---
layout: post
title: three cases using docker to improve development efficiency
categories: [docker, software development]
---
# Introduction #

[Docker](docker.com) is the rising star recently in cloud industry, docker’s ecosystem grows even more fast compare to 2 years ago of [openstack](openstack.org)’s.

Docker is an open platform for distributed applications for developers and sysadmins. It is based on existing container technology, and make it is much easier to use. 

Please visit https://www.docker.com/whatisdocker/ for more information.

In this blog, I share three use cases on how to use docker to improve development efficiency based on my current experience

## Use case 1: Product Building Service ##

Some of our products have different OS and different release, it demands several physical HW or VM (mostly in IT-Hub) to host different build platform, there are some issues around this

1. Difficult to maintain those servers, we have to request IT engineer to install the packages and sometimes patches, in worse case, some designer may request additional package to install packages (surely process is problem as well). It is not well version controlled.
2. Developer team (use windows) has to find the way to clone the build server locally to make sure the code can be compiled in the same way with real build server, sometimes it builds failure in CI though it is ok locally. it has consistency problem
3. Due to the life-cycle of the product, we have to maintain them and keep them alive with cooperating with IT dept., it is the waste. 

By using docker, we move our build service into docker image, And consolidate different build server into one powerful HW/VM machine, they can share the load. 

![docker-3cases-build server](http://www.larrycaiyu.com/blog/images/docker-3cases-1.png)

Cost is not the big gain for those small machines, Instead, we make our build environment more professional

* The build server is now version controlled, each build server is docker image, generated from [Dockerfile](https://docs.docker.com/reference/builder/), which is the plain text to describe how the server comes. They are put into git control system, all the changes are visible to everyone.
* We are able to run the docker instance for different release in seconds: just checkout the Dockerfile and rebuild the image and launch it.
* Developers now can run those build service locally, which make sure if it is passed locally, it works in CI as well
Using docker, build environment is well maintained. see my previous blog Create the docker images for product development for more detail.

## Use case 2: Local cloud testing environment ##
Recently I am studying how to use [ansible](ansible.com) to do image installation in cloud (openstack) environment, there are two things bother me during development:

1. Remote Openstack environment is in another network, I need to sync my code base from windows to target machines to test, it wastes time.
2. It demands me to start/stop VM frequently, the start-up of VM lasts several minutes mostly, it is kind of waste of time since some testing are none VM related like installation packages, while in order to get clean environment, I have to restart them.
So I switch for most of development time using docker.

[Boot2docker](boot2docker.io) provides the docker environment in windows, it can share the folder with my Window folder, so I use normal text editor to write the codes, and testing it inside docker container.

Also I created several docker images to simulate the real VM node, and using [fig](fig.sh) to start those nodes in seconds. It can provide almost the same environment as openstack environment, and it is much much fast.

![docker-3cases-fig](http://www.larrycaiyu.com/blog/images/docker-3cases-2.png)
![docker-3cases-ansible](http://www.larrycaiyu.com/blog/images/docker-3cases-3.png)

I only use openstack when I have to deal with cloud VM and integration test in the end. I have to say I love it.

## Use case 3: Test more locally with different scenario ##

My working product is combined with several nodes with different deployment. By using some simulators around it, we can do end-2-end testing.

While testing is costly, several issues:

1. Since too many deployment cases exists and fail-over and load balancer kind of stuff are difficult to setup the environment, it is mostly tested in later phase, which cause lots of trouble and waste.
2. competence is low due to less chance to practice, mostly they are developed and tested with experienced engineers only.
3. since it is difficult to get environment ready, it causes the difference setup and view for designers and tester. 

![docker-3cases-locally](http://www.larrycaiyu.com/blog/images/docker-3cases-4.png)

By using docker, we managed to establish those nodes in docker images. Inside, we provide testing environment (legacy, complex) as well, cool. Professional tester quickly like it.

Now all the developers (including traditional testers) can do most of the work locally. They may build the java codes in eclipse, “deploy the package” (actually shared with docker instance) into docker environment, doing testing.

Since the environment is easy to be established, therefore everyone can experience different setup in seconds, they learn that quickly by practice

It is just the beginning, and designers give a strong feedback, “Wooh, it can be done like this”.

## Summary ##

The unique features of docker brings new trend of software development, it will be definitely to contribution to better software development.

The use case above is just the beginning of the usage of docker, I will soon drive the DevOps concept inside software development based on CI.

