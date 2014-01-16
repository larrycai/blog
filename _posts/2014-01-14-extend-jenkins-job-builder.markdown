---
layout: post
title: Extend jenkins job builder
categories: [jenkins, python, jenkins job builder]
---

# What is jenkins job builder #

[Jenkins job builder][jjb] is extreme good tool to manage your jenkins CI jobs, it takes simple description from YAML files, and use them to configure jenkins.

```yaml
# set free style job
# job-template.yml
- job:
    name: testjob
    project-type: freestyle
    defaults: global
    disabled: false
    display-name: 'Fancy job name'
    concurrent: true
    quiet-period: 5
    workspace: /srv/build-area/job-name
    block-downstream: false
    block-upstream: false
```
 
Then put your jenkins access into `jenkins.ini` file   

```ini
[jenkins]
user=USERNAME
password=USER_TOKEN
url=JENKINS_URL
ignore_cache=IGNORE_CACHE_FLAG
```

Based on the job configuration above, you just need to type command

```bash
$ jenkins-jobs --conf jenkins.ini update job-template.yaml 
```

Then your job `testjob` is created in your jenkins server.

The project is created by [openstack-infrastructure team](https://wiki.openstack.org/wiki/InfraTeam), it is used to manage the openstack environment, fairly good.

## How it works ##

There is no magic behind it, `jenkins-jobs` just convert the `job-template.yaml` to jenkins XML request file, and use [jenkins remote API](https://wiki.jenkins-ci.org/display/JENKINS/Remote+access+API) to send create request.

Try to do below to understand this.

```bash
$ jenkins-jobs test job-template.yaml -o .
```

Then xml file `testjob` is created, see

```xml
<?xml version="1.0" ?>
<project>
  <actions/>
  <description>

&lt;!-- Managed by Jenkins Job Builder --&gt;</description>
  <keepDependencies>false</keepDependencies>
  <disabled>false</disabled>
  <displayName>Fancy job name</displayName>
  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
  <concurrentBuild>true</concurrentBuild>
  <customWorkspace>/srv/build-area/job-name</customWorkspace>
  <quietPeriod>5</quietPeriod>
  <canRoam>true</canRoam>
  <properties/>
  <scm class="hudson.scm.NullSCM"/>
  <builders/>
  <publishers/>
  <buildWrappers/>
</project>
```

Now you can use `curl` command to send the request (`testjob`) directly !!

```bash
$ curl --user USER:PASS -H "Content-Type: text/xml" -s --data "@testjob" "http://jenkins-server/createItem?name=testjob"
```

### How to recreate your jenkins job ###

Looks great, finally you need think about how to re-create your jenkins job, it is also simple, just download the `config.xml`

```bash
$ curl --user USER:PASS http://jenkins-server/testjob/config.xml
```

Or open the configuration page in broswer `http://jenkins-server/testjob/configure` and map from YAML file.

You need to read [jenkins job builder's guideline](http://ci.openstack.org/jenkins-job-builder/configuration.html) to know the map, generate it had level Macro like [builders](http://ci.openstack.org/jenkins-job-builder/builders.html), which is connected to the real [python builders module](https://github.com/openstack-infra/jenkins-job-builder/blob/master/jenkins_jobs/modules/builders.py) to do transformation from YAML to XML. 

What you stated in YAML file like
	
```yaml
-job:
  name: test_job	
  builders:
    - shell: "make test"
```

it will be converted to

```xml 
<builders>
	<hudson.tasks.Shell>
	  <command>make test</command></hudson.tasks.Shell>
</builders>
```

## How to extend ##

Greatly to see [jenkins job builder][jjb] already had lots of default modules to support your normal jenkins jobs, but there is exceptions like some none popular jenkins plugins or your own plugins.

Then it is time to extend the module, the [existing document: Extending](http://ci.openstack.org/jenkins-job-builder/extending.html) is not clear enough, I will use example to show how it works, code is in github [jenkins-buddy project](https://github.com/larrycai/jenkins-buddy)

[ArtifactDeployer Plugin](https://wiki.jenkins-ci.org/display/JENKINS/ArtifactDeployer+Plugin) is used as example, this plugin is the popular plugin to deploy the artifacts to other folder.

![Artifact Deploy Plugin][img-artifactdeployer]

And I want to have `.YAML` like below

```yaml
# artifactdeploy.yaml
- job:
    name: test-job
    publishers:
      - artifactdeployer: 
          includes: 'buddy-*.tar.gz'
          remote: '/project/buddy'
```

### write codes to transform ###

Now I need to download the existing jobs to see how XML looks like, using `curl` above, I got it like

```xml
<publishers>
   ...	
  <org.jenkinsci.plugins.artifactdeployer.ArtifactDeployerPublisher plugin="artifactdeployer@0.27">
	<entries>
	  <org.jenkinsci.plugins.artifactdeployer.ArtifactDeployerEntry>
	    <includes>buddy-*.tar.gz</includes>
	    <basedir></basedir>
	    <excludes></excludes>
	    <remote>/project/buddy</remote>
	    <flatten>false</flatten>
	    <deleteRemote>false</deleteRemote>
	    <deleteRemoteArtifacts>false</deleteRemoteArtifacts>
	    <deleteRemoteArtifactsByScript>false</deleteRemoteArtifactsByScript>
	    <failNoFilesDeploy>false</failNoFilesDeploy>
	  </org.jenkinsci.plugins.artifactdeployer.ArtifactDeployerEntry>
	</entries>
	<deployEvenBuildFail>false</deployEvenBuildFail>
  </org.jenkinsci.plugins.artifactdeployer.ArtifactDeployerPublisher>
	..
</publishers> 
```

It belongs the section `publishers` So I write the `jenkins_buddy/modules/publishers.py` module to add one function `artifactdeployer`:

```python
def artifactdeployer(parser, xml_parent, data):
    logger = logging.getLogger("%s:artifactdeployer" % __name__)
    artifactdeployer = XML.SubElement(xml_parent, 'org.jenkinsci.plugins.artifactdeployer.ArtifactDeployerPublisher')
    entries = XML.SubElement(artifactdeployer, 'entries')
    entry = XML.SubElement(entries, 'org.jenkinsci.plugins.artifactdeployer.ArtifactDeployerEntry')
    print data
    XML.SubElement(entry, 'includes').text = data['includes']
    XML.SubElement(entry, 'remote').text = data['remote']
```

It is the core part handling convert.

### Hook into jenkins-job builder ###

Now you need hook this script into `jenkins-jobs builder`, thank for the [entry_points](http://docs.pylonsproject.org/projects/pylons-webframework/en/latest/advanced_pylons/entry_points_and_plugins.html) in python, it can be used for this.

Create the plugin related script and structure, add new `entry_point` in [setup.py](https://github.com/larrycai/jenkins-buddy/blob/master/setup.py)

```python
# setup.py in jenkins-buddy
entry_points={
    'jenkins_jobs.publishers': [
        'artifactdeployer=jenkins_buddy.modules.publishers:artifactdeployer',
    ],
}
```
it tells `jenkins-jobs` if you meet new keyword `artifactdeployer` in `publishers`, please let me `jenkins_buddy.modules.publishers:artifactdeployer` to handle.

### Verify it ###

Build the pip package local and install it 

```bash
$ python setup.py sdist
$ pip install dist/jenkins-buddy-0.0.5.zip
```
 
And verify the new job, Bingo, it works.

```bash
$ jenkins-jobs test artifactdeploy.yaml -o . 
```

### Make it more complete by checking jenkins plugin java code ###

Maybe you noticed, it is hack solution, since I skipped some parameter converting and guess what the XML will look like, if you want to make it more complete, we need to check the java codes directly.

[src/main/java/org/jenkinsci/plugins/artifactdeployer/ArtifactDeployerPublisher.java](https://github.com/jenkinsci/artifactdeployer-plugin/blob/master/src/main/java/org/jenkinsci/plugins/artifactdeployer/ArtifactDeployerPublisher.java) is the class we need to take care.

```java
@DataBoundConstructor
public ArtifactDeployerPublisher(List<ArtifactDeployerEntry> deployedArtifact, boolean deployEvenBuildFail) {
    this.entries = deployedArtifact;
    this.deployEvenBuildFail = deployEvenBuildFail;
    if (this.entries == null)
        this.entries = Collections.emptyList();
}
```

It is directly mapping from XML into internal data, if you need know more, learn [how to develop jenkins plugin](https://wiki.jenkins-ci.org/display/JENKINS/Plugin+tutorial).

Till now, you mostly understand all, don't forget to contribute back for your modules.

## Reference ##

* [Jenkins job builder in openstack][jjb], it has documentation as well
* My sample [jenkins-buddy](https://github.com/larrycai/jenkins-buddy) in github
* [ArtifactDeployer Plugin](https://wiki.jenkins-ci.org/display/JENKINS/ArtifactDeployer+Plugin) is the plugin we practiced to add extra support.

[jjb]: http://ci.openstack.org/jenkins-job-builder/extending.html
[img-artifactdeployer]: http://larrycaiyu.com/blog/images/artifactdeploy.png