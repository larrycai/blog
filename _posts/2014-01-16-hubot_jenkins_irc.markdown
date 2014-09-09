---
layout: post
title: Ask hubot to deal with jenkins in IRC
categories: [hubot,coffeescript, nodejs,jenkinsapi,irc,jenkins]
---

# What is Hubot ? #
[hubot][Hubot] is your company's robot. this is the stated in the github's webpage. And it does. It is opensourced from github, which they used internally for ops.

![hubot](https://github-images.s3.amazonaws.com/blog/2011/hubot.png)

It is easy to setup for own hubot service inside the company, like what we did for jenkins server for CI, surely it is not limited to this, lots of plugins can be added, see more [Hubot Script Catalog][hubot_catalog], and you can create your own.

[IRC](http://en.wikipedia.org/wiki/Internet_Relay_Chat) enables quick discussion and collaboration without breaking your workflow.

Hubot will be used as robot in IRC, send command to hubot, she will do the rest.

	> hubot jenkins build testjob, buildType=latest 

# Installation #

## Hubot ##
Hubot is written in [CoffeeScript](http://coffeescript.org/) on [Node.js](http://nodejs.org/), but don't be afraid of it, it is easy to learn.

Follow the [Installing Node.js via package manager](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager) to install node.js.

Then for [Getting Started With Hubot](https://github.com/github/hubot/blob/master/docs/README.md)

	$ sudo npm install -g hubot coffee-script

This (`-g`) will help to install hubot and coffee-script binary in global.

Mostly we create instance `myhubot` like below, it will create directory `myhubot` and copied needed files inside, the plugins scripts are located under `scripts`, like `ping.coffee`

	$ hubot --create myhubot

Then you can start hubot and play with it in shell

    $ cd myhubot
	$ bin/hubot 
	Hubot> 

You can ask hubot to do something for you 

    Hubot> hubot ping
	Hubot> PONG

## IRC ##

this Shell is called [adapter](https://github.com/github/hubot/blob/master/docs/adapters.md) in hubot, you can choose others, and [IRC](https://github.com/nandub/hubot-irc) adapter is one easy service to setup.

You can use [freenode](http://freenode.net/) as your IRC server if you want to public, otherwise install it locally, I choose default [irc server](https://help.ubuntu.com/12.04/serverguide/irc-server.html) in Ubuntu.

	$ sudo apt-get install ircd-irc2

In your `myhubot` directory, install `hubot-irc` locally (without `-g` for `npm` command), it will install the nodejs module under `node_modules`

	$ npm install hubot-irc --save && npm install

Then configure the environment:

	$ export HUBOT_IRC_SERVER=localhost # this is the url for irc server
	$ export HUBOT_IRC_ROOMS="#myhubot-irc" 
	$ export HUBOT_IRC_NICK="myhubot" 
	$ export HUBOT_IRC_UNFLOOD="true" 

Start hubot again with IRC adapter 

	$ bin/hubot --adapter irc

You can use your favorite IRC client to access it, default port is `6667`, [hexchat](http://hexchat.github.io/) is used by me since it is free ;-)

![hexchat](http://hexchat.github.io/img/screenshot-windows.png)

## Integrate Jenkins ##

Now it is time to integrate hubot with jenkins, fortunately there exists plugin already [jenkins.coffee](https://github.com/github/hubot-scripts/blob/master/src/scripts/jenkins.coffee), the instruction is in [Hubot Script Catalog][hubot_catalog] (search jenkins)

Copy the `jenkins.coffee` into `scripts` directory, set following configuration

	$ export HUBOT_JENKINS_URL=http://<jenkins server>
	$ export HUBOT_JENKINS_AUTH=<user>:<passwd> 

Don't put your real jenkins password in environment, use token instead. `token` can be obtained via `http://<jenkins-server>/user/<username>/configure` - push on **Show API token** button, 

Now restart hubot again, feed command

	Hubot> hubot jenkins build job, parameter1&value
    Hubot> hubot jenkins list

# How it works #

`jenkins.coffee` is simple, it just send raw http request to jenkins server via REST interface, and this is typical hubot scripts works. 

```javascript
jenkinsBuild = (msg, buildWithEmptyParameters) ->
    url = process.env.HUBOT_JENKINS_URL
    job = querystring.escape msg.match[1]
    params = msg.match[3]
    command = if buildWithEmptyParameters then "buildWithParameters" else "build"
    path = if params then "#{url}/job/#{job}/buildWithParameters?#{params}" else "#{url}/job/#{job}/#{command}"

    req = msg.http(path)

    if process.env.HUBOT_JENKINS_AUTH
      auth = new Buffer(process.env.HUBOT_JENKINS_AUTH).toString('base64')
      req.headers Authorization: "Basic #{auth}"

    req.header('Content-Length', 0)
    req.post() (err, res, body) ->
```

When I use it, I meet small issues for https

## HTTPS issues ##

In one of my jenkins server, it is enabled https, and the certification is not well configured, therefore `rejectUnauthorized` shall be set to `false`, the default is `true`. In `curl` command, it can be set using `-k`

	-k, --insecure      Allow connections to SSL sites without certs (H)

It hasn't been supported in `jenkins.coffee`, see [issues 1267](https://github.com/github/hubot-scripts/issues/1267), several solution can be used.

### change low level http ###

Just wait since there are [pull request 612](https://github.com/github/hubot/pull/612) already, it can help to add more options for `msg.http()` request

### Use jenkins-api node.js module with hack ###

I noticed there are [jenkins-api node.js module](https://github.com/jansepar/node-jenkins-api) exist, it encapsulate the jenkins-api, it can be invoked directly like below used in coffeescript

	jenkins = jenkinsapi.init("https://#{auth}@#{url}")
	jenkins.build job, params, (err, data) 

Much cleaner, while it is no complete for the API like build, my simple [patch 8](https://github.com/jansepar/node-jenkins-api/pull/8) can solve it.

Another small dirty-fix is to add `rejectUnauthorized: false` in request directly like below, it is so ugly, so it is not treated as pull request.

	request({method: 'GET', url: build_url(LAST_BUILD, jobname),rejectUnauthorized: false}, function(error, response, body) {

Based on this, I created a small `ci.coffee` as [gist 8450214](https://gist.github.com/larrycai/8450214), it is hard coded `https` as well.

### fix https certification ###

Better to fix the https in server side directly. ;-)

# FAQ #
* can I see pictures like that in hubot.github.com ?
  No. you need another adapter instead of IRC like [campfire](https://github.com/github/hubot/blob/master/docs/adapters/campfire.md) 

# Reference #

* Say hello to hubot: https://github.com/blog/968-say-hello-to-hubot
* http://blog.mornati.net/2011/12/21/install-hubot-as-irc-channel-bot/ 
* http://www.preshweb.co.uk/2011/10/why-irc-is-a-valuable-tool-to-your-development-team/
* https://wiki.jenkins-ci.org/display/JENKINS/Authenticating+scripted+clients

[hubot]: http://hubot.github.com/
[hubot_catalog]: (http://hubot-script-catalog.herokuapp.com/)