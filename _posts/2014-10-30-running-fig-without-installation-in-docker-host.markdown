---
layout: post
title: running fig without installation in docker host
---

## What is Fig ?

Fig (http://fig.sh) is a simple orchestration tool for managing multiple docker containers, now the company is acquired by docker.

Simple you write configuration in `fig.yml` file (source from https://github.com/larrycai/codingwithme-ansible/blob/master/fig.yml) like

	ansible:
	  image: dockerfile/ansible
	  volumes: 
	   - /home/docker/codingwithme-ansible:/data
	  links: 
	   - haproxy
	   - web1
	   - web2
	   - database
	haproxy:
	  image: larrycai/ubuntu-sshd
	web1:
	  image: larrycai/ubuntu-sshd
	web2:
	  image: larrycai/ubuntu-sshd
	database:
	  image: larrycai/ubuntu-sshd

Then execute `fig run ansible`, it will launch the docker container as you defined: sample above is to start 5 docker containers and enter into `ansible` container for testing.

Learn fig more in http://blog.docker.com/2014/08/getting-started-with-orchestration-using-fig

## Problem for running environment

Before using the fig, you mostly need to install it, while if you check http://www.fig.sh/install.html, you will notice it only support OS X (with boot2docker 1.3) and other Linux system, you can’t install it in Windows (boot2docker env).

Also if you start to play with CoreOS, you will find it is difficult to install it 
as well, in official document, it recommends to use fleet (coreos tool) instead 
to manage docker service. Then you need to run [fig2coreos](https://github.com/centurylinklabs/fig2coreos), it is not so sweat for small things.

How can we solve it ?

TLDR;
    
   	docker run larrycai/fig

### Using docker in docker for fig

The solution is not difficult actually, we can simple to have a fig container 
to run docker inside, surely it needs docker inside docker as well.

See [Dockerfile](https://github.com/larrycai/docker-images/blob/master/fig/Dockerfile)

	## docker run -v /var/run/docker.sock:/docker.sock -v <figapp>:/app larrycai/fig
	
	FROM ubuntu:latest
	MAINTAINER Larry Cai "larry.caiyu@gmail.com"
	ENV REFREST_AT 20141015
	
	RUN apt-get update && apt-get install -y curl make
	
	RUN \
	    curl -L https://get.docker.io/builds/Linux/x86_64/docker-latest -o /usr/local/bin/docker  && \
	    chmod +x /usr/local/bin/docker && \
	    
	    # see http://www.fig.sh/install.html 
	    curl -L https://github.com/docker/fig/releases/download/1.0.0/fig-`uname -s`-`uname -m`  -o /usr/local/bin/fig && \
	    chmod +x /usr/local/bin/fig 
	    
	ENV DOCKER_HOST unix:///docker.sock
	
	WORKDIR /app
	
	# set initial command
	
	ENTRYPOINT ["/usr/local/bin/fig"]
	CMD ["-v"]

It will install latest docker inside, and also follow the fig installation to 
install 1.0.0 version as well

### How to use it ?

As normally docker container, run it directly to see the fig help (which is 
default)

	docker@boot2docker:~$ docker run larrycai/fig
	Punctual, lightweight development environments using Docker.
	
	Usage:
	  fig [options] [COMMAND] [ARGS...]
	  fig -h|--help
    ....

Now if I clone my [codingwithme-ansible sample code](https://github.com/larrycai/codingwithme-ansible) 
locally into `/home/docker` (see `fig.yml` sample above), then I can run

	docker@boot2docker:~/codingwithme-ansible$ docker run -it \
	 -v /var/run/docker.sock:/docker.sock \
	 -v /home/docker/codingwithme-ansible:/app \
	 larrycai/fig run ansible

Then it will start web stack containers (`haproxy`/`web`/`database`) at once ( 
download needed docker image for first time) and run into `ansible` container

`-v /var/run/docker.sock:/docker.sock` is used to pass the docker daemon socket into docker container so docker inside can community outside   
`-v /home/docker/codingwithme-ansible:/app` is to share the host folder inside.

### Remind

Just remind one thing, since those docker commands are run in host machine, 
please specify the **absolute path** in `volumes`, don’t use `.`

	  volumes: 
	   - /home/docker/codingwithme-ansible:/data

This is the only limitation for using fig docker container, I guess.

### Summary

Now using fig docker image, you don’t need to install fig manually, this is 
core value for docker. And it works in Windows/CoreOS as well.

Enjoy