#!/usr/bin/env bash

set -e

if ! docker network inspect demo &>/dev/null; then
  docker network create -d bridge demo
fi

docker rm -f nginx-serf
docker rm -f hello-server-1
docker rm -f hello-server-2
docker rm -f hello-server-3
docker rm -f serf

docker run -d --name serf --net demo alphahydrae/nginx-serf /opt/bin/serf agent
docker run --net demo --name hello-server-1 -e NAME=Bob -d hello-server
docker run --net demo --name hello-server-2 -e NAME=Jim -d hello-server
docker run --net demo --name hello-server-3 -e NAME=Ian -d hello-server
docker run --volume /vagrant/samples/config.yml:/etc/nginx-serf/config.yml --volume /vagrant/samples/conf.d:/etc/nginx-serf/conf.d --volume /vagrant/samples/certs:/etc/ssl/private/hello.demo --net demo -e NGINX_SERF_JOIN=serf --name nginx-serf -d alphahydrae/nginx-serf
