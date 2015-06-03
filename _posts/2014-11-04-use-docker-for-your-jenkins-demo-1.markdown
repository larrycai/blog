---
layout: post
title: use docker to enhance your jenkins demo - 1 
---
## What is Jenkins

Jenkins ([http://jenkins-ci.org](http://jenkins-ci.org/)) is almost 
the standard for CI (continuous integration) now. It has a big community with 
lots of plugins for nice features, in order to learn those things, it will be 
good to practice it by setting the environment. 

Also if you want to introduce new features of jenkins to others, you want to 
have a demo environment for them quickly.

How this can be done easily? Docker is my favorite to achieve this.

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-1.png)

In this blog series, I use some examples to describe how to achieve this step 
by step.

## Demo jenkins small feature – AnsiColor plugin

[Jenkins AnsiColor plugin](https://wiki.jenkins-ci.org/display/JENKINS/AnsiColor+Plugin) is one of my favorite small plugin, it can turn console log looks better.

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-2.png)

So I want to setup a demo environment for everyone can try it locally without 
installation, since mostly we want to try before deployment.

### Result

Let’s see result first since you may just interesting this feature

    docker run –p 8080:8080 –t larrycai/jenkins-demo1

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-3.png)

The jenkins is started in console, then open the browser to access `8080` port.

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-4.png)

Looks great, one craft sample job is there and Jenkins is latest LTS version 
1.580.1

Click `Craft` job and run it, then check the `console`, great, it shows the color 
in console

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-5.png)

Then back to see how it is configured

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-6.png)

Now the demo is completed

### How it works

Here is the Dockerfile, see [source](https://github.com/larrycai/docker-images/blob/master/jenkins-demo1/Dockerfile)

	FROM ubuntu:trusty
	
	MAINTAINER Larry Cai <larry.caiyu@gmail.com>
	
	ENV REFRESHED_AT 2014-11-03
	
	RUN apt-get update  && apt-get install -qqy curl openjdk-6-jdk
	
	ENV JENKINS_HOME /opt/jenkins/data
	ENV JENKINS_MIRROR http://mirrors.jenkins-ci.org
	
	# install jenkins.war and plugins
	
	RUN mkdir -p $JENKINS_HOME/plugins $JENKINS_HOME/jobs/craft
	RUN curl -sf -o /opt/jenkins/jenkins.war -L $JENKINS_MIRROR/war-stable/latest/jenkins.war
	
	RUN for plugin in chucknorris greenballs scm-api git-client ansicolor description-setter \
	    envinject job-exporter git ws-cleanup ;\
	    do curl -sf -o $JENKINS_HOME/plugins/${plugin}.hpi \
	       -L $JENKINS_MIRROR/plugins/${plugin}/latest/${plugin}.hpi ; done
	
	# ADD sample job craft
	
	ADD craft-config.xml $JENKINS_HOME/jobs/craft/config.xml
	
	# start script
	
	ADD ./start.sh /usr/local/bin/start.sh
	RUN chmod +x /usr/local/bin/start.sh
	
	EXPOSE 8080
	
	CMD [ "/usr/local/bin/start.sh" ]

Started with installing `openjdk`/`curl` package and setting related environment which is needed when jenkins starts.

Jenkins app (`.war`) can be found in [http://jenkins-ci.org/](http://jenkins-ci.org/), you can choose latest version or LTS (Long Term Support) stable version, here I choose LTS version [http://mirrors.jenkins-ci.org/war-stable/latest/jenkins.war](http://mirrors.jenkins-ci.org/war-stable/latest/jenkins.war)

All the plugins can be found in mirror sites: [http://mirrors.jenkins-ci.org/](http://mirrors.jenkins-ci.org/), you need to find the `Plugin Id` for your plugin like `ansicolor`, which can be mapped to [http://mirrors.jenkins-ci.org/plugins/ansicolor/latest/ansicolor.hpi](http://mirrors.jenkins-ci.org/plugins/ansicolor/latest/ansicolor.hpi)

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-7.png)

In jenkins, job’s configuration is saved as `config.xml`, you can prepare in 
advance and put it under `$JENKINS_HOME/jobs/craft` in docker image.

	<?xml version='1.0' encoding='UTF-8'?>
	<project>
	  <actions/>
	  <description></description>
	  <keepDependencies>false</keepDependencies>
	  <properties/>
	  <scm class="hudson.scm.NullSCM"/>
	  <canRoam>true</canRoam>
	  <disabled>false</disabled>
	  <blockBuildWhenDownstreamBuilding>false</blockBuildWhenDownstreamBuilding>
	  <blockBuildWhenUpstreamBuilding>false</blockBuildWhenUpstreamBuilding>
	  <triggers/>
	  <concurrentBuild>false</concurrentBuild>
	  <builders>
	    <hudson.tasks.Shell>
	      <command>#!/bin/bash
	env
	echo -e "\e[1;31;42m Using docker to demo is awful, v5 \e[0m"
	echo see more in http://misc.flogisoft.com/bash/tip_colors_and_formatting
	</command>
	    </hudson.tasks.Shell>
	  </builders>
	  <publishers/>
	  <buildWrappers>
	    <hudson.plugins.ansicolor.AnsiColorBuildWrapper plugin="ansicolor@0.4.0">
	       <colorMapName>xterm</colorMapName>
	    </hudson.plugins.ansicolor.AnsiColorBuildWrapper>
	  </buildWrappers>
	</project>

The most easy way is to get the file from running jenkins directly (append `config.xml` in your job URL) 

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-8.png)

And in the end, add small `start.sh` which will start your jenkins during startup.

    exec java -jar /opt/jenkins/jenkins.war

Then you can build your docker image

    docker build –t larrycai/jenkins-demo1 .

### How to share it public

You can put your project into [github](http://github.com) or [bitbucket](http://bitbucket.com) and run your build in [http://hub.docker.com](http://hub.docker.com/) , then others can simple run docker command to run it (you can search for guideline)

![](http://www.larrycaiyu.com/blog/images/jenkins-demo1-9.png)

## Summary

In this blog, we demoed how to dockerize your jenkins application with sample 
job, which is well prepared for the configuration. It will be easily for your 
audience to know your demo feature.

Now you can pack your nice jenkins feature into the docker.

In next blog, I will show how to organize the JENKINS home better

Docker can help us a lot.