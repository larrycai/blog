---
layout: post
title: Build the jenkins job and get notification in hubot
categories: [hubot,coffeescript, nodejs,jenkinsapi,irc,jenkins]
---

# Build the job in Hubot #

In previous blog [ask hubot to deal with jenkins in IRC](http://larrycaiyu.com/blog/2014/01/14/extend-jenkins-job-builder/), I discussed about how to connect [Hubot][hubot] with Jenkins and IRC.

One frequent command I used is to build the job

	#hubot jenkins build jobname
    #(201) Build started for jobname https://my_jenkins_server/job/jobname

The request is sent to jenkins and start to build.

How to get notification when build is finished ? 

## Notification when job is finished ##

I googled and got several solutions below:

1. Use [jenkins-notifier.coffee][jenkins_notify] script with [Jenkins Notification Plugin](https://wiki.jenkins-ci.org/display/JENKINS/Notification+Plugin) 
2. Create own callback function in hubot with simple script (`curl`) in [Jenkins PostBuildScript Plugin](https://wiki.jenkins-ci.org/display/JENKINS/PostBuildScript+Plugin) , see blog [How to let Hubot send status messages to your Jabber conference after a Jenkins build was finished](http://lambda.fortytools.com/post/29961447332/how-to-let-hubot-send-status-messages-to-your-jabber)
3. Use [Jenkins IRC Plugin](https://wiki.jenkins-ci.org/display/JENKINS/IRC+Plugin) to send the build information to your IRC room directly.
4. Use regular check to fetch the build status in hubot directly.

Solution 1&2 are almost the same, listen the notification inside hubot script, and the build is finished, it will send request to hubot.

Solution 3 are nothing related with hubot actually, it is triggered after jenkins build is finished, and send to IRC room directly  

## How it works for solution 1&2 ##

I answered similar question in stackoverflow #18318485 [Hubot's github-pull-request-notifier.coffee](http://stackoverflow.com/questions/18318485/hubots-github-pull-request-notifier-coffee)

Write the script in hubot to listen to notification from jenkins, and use either plugin or shell script to send notification back to hubot when job is finished. 

[jenkins-notifier.coffee][jenkins_notify] has line below to listen on request path `hubot/jenkins-notify`

	robot.router.post "/hubot/jenkins-notify", (req, res) ->

Hubot itself define the port number, it route the path to the script above as it requested, see this part in [robot.coffee][3], the default port is `8080`

And also the [jenkins-notifier.coffee][jenkins_notify] want to have more configuration on the path to configure the notification like `notificationStrategy`, `room`, etc.

Therefore the URL is like below

    http://<your hubot sever>:8080/hubot/jenkins-notify/?room=<room>[&type=<type>][&notstrat=<notificationSTrategy>

Sender define the data are transferred, in Jenkins Notification Plugin, it states the message like below

```json
{"name":"JobName",
 "url":"JobUrl",
 "build":{"number":1,
	  "phase":"STARTED",
	  "status":"FAILED",
          "url":"job/project/5",
          "full_url":"http://ci.jenkins.org/job/project/5"
          "parameters":{"branch":"master"}
	 }
}
```

In the jenkins-notifier.coffee script, it will parse the data and according to the configuration to further send notification.

```coffeescript
      data = req.body

      if data.build.phase == 'FINISHED'
        if data.build.status == 'FAILURE'
          if data.name in @failing
            build = "is still"
```

## Solution 3 to check result regularly ##

Since we had lots of jenkins job, I don't want to inject this there, therefore I decide to check result after build.

See [code changes](https://github.com/larrycai/hubot-scripts/compare/1b2d3ca8...d77bd03) in jenkins.coffee

> The code is little ugly, just take for reference

	#   HUBOT_JENKINS_NOTIFY_BUILD
	#   HUBOT_JENKINS_NOTIFY_INTERVAL

Two environment variables are added to enable the feature and set internal time (default is 10 seconds)

After the jenkins build is executed, the item is created to keep who request the notification and job name, then item is push into the `queue`. If the regular check is not started, start it using `setInterval` function.

```coffeescript
  item = 
    user: msg.message.user,
    name: job,
    url: "#{url}/job/#{job}"

  queue.push(item)
  
  if not init
    init = true
    # set interval is 10 seconds
    interval = process.env.HUBOT_JENKINS_NOTIFY_INTERVAL || 10
    setInterval check_build, interval*1000, msg, robot
```

`check_build` is more straight forward, fetch one item from queue each time, and execute  `get_build` . 

```coffeescript
item = queue.shift()
get_build(msg, robot,item)
```

If the job is finished, send message to original user, otherwise put back in the end of queue

```coffeescript
if content.building is false
	robot.reply {user: user }, "#{job} .. building is finished, result #{content.result}"
else
	robot.reply {user: user }, "#{job} building is in progress, [this log will be removed ..] "             
	queue.push(item)
```

The code is not javascript style, need to be improved

* sync for queue, do I need lock here
* how to handle lots of request, take one each time is not perfect
* `robot` and `msg` are confused

# Reference #

* Say hello to hubot: https://github.com/blog/968-say-hello-to-hubot
* http://larrycaiyu.com/blog/2014/01/14/extend-jenkins-job-builder
* http://stackoverflow.com/questions/18318485/hubots-github-pull-request-notifier-coffee/21206400
* http://www.morethanseven.net/2012/01/06/Talking-to-jenkins-from-campfire-with-hubot/
* send private message https://github.com/nandub/hubot-irc/issues/75

[1]: http://developer.github.com/v3/repos/hooks/#create-a-hook
[2]: https://github.com/github/hubot-scripts/blob/master/src/scripts/github-pull-request-notifier.coffee
[3]: https://github.com/github/hubot/blob/master/src/robot.coffee
[hubot]: http://hubot.github.com/
[hubot_catalog]: http://hubot-script-catalog.herokuapp.com/
[jenkins_notify]: https://github.com/github/hubot-scripts/blob/master/src/scripts/jenkins-notifier.coffee
