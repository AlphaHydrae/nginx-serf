#!/usr/bin/env bash

set -e





echo
echo "SETUP"
echo "====="

if ! docker network inspect demo &>/dev/null; then
  echo
  echo "Creating 'demo' network..."
  docker network create -d bridge demo
fi

cd /vagrant

if ! docker images|grep -e '^alphahydrae\/nginx-serf-base ' &>/dev/null; then
  echo
  echo "Building nginx-serf-base image..."
  docker build -t alphahydrae/nginx-serf-base base
fi

if ! docker images|grep -e '^alphahydrae\/nginx-serf ' &>/dev/null; then
  echo
  echo "Building nginx-serf image..."
  docker build -t alphahydrae/nginx-serf .
fi

if ! docker images|grep -e '^hello-server ' &>/dev/null; then
  echo
  echo "Building hello-server image..."
  docker build -t hello-server samples/hello-server
fi

for NAME in nginx-serf hello-server-1 hello-server-2 hello-server-3 hello-server-4 hello-server-5 serf; do
  docker rm -f $NAME &>/dev/null || :
done

echo
echo "Launching a serf agent in the 'serf' container..."
docker run -d --name serf --net demo alphahydrae/nginx-serf /opt/bin/serf agent

echo
echo "Launching a hello server for Bob in the 'hello-server-1' container..."
docker run --net demo --name hello-server-1 -e NAME=Bob -d hello-server

echo
echo "Launching a hello server for Jim in the 'hello-server-2' container..."
docker run --net demo --name hello-server-2 -e NAME=Jim -d hello-server

echo
echo "Launching a hello server for Ian in the 'hello-server-3' container..."
docker run --net demo --name hello-server-3 -e NAME=Ian -d hello-server





echo; echo; echo
echo "DEMO: automatic configuration from an existing serf cluster"
echo "==========================================================="

echo
echo "Printing the list of containers..."
docker ps -a

echo
echo "Launching nginx-serf in the 'nginx-serf' container..."
docker run \
  --volume /vagrant/samples/config.yml:/etc/nginx-serf/config.yml \
  --volume /vagrant/samples/conf.d:/etc/nginx-serf/conf.d \
  --volume /vagrant/samples/certs:/etc/ssl/private/hello.demo \
  --volume /vagrant/samples/blog:/var/www/blog \
  -e NGINX_SERF_JOIN=serf \
  --name nginx-serf \
  --net demo \
  -p 443:443 \
  -p 80:80 \
  -d \
  alphahydrae/nginx-serf

echo
while ! curl http://blog.demo &>/dev/null; do
  echo "Waiting for nginx to start..."
  sleep 1
done

echo
echo "Printing the hello upstream configuration..."
docker exec nginx-serf cat /etc/nginx/conf.d/hello.serf.conf | head -n 5 | sed 's/^/  /'

echo
echo "Running 'curl -k https://hello.demo' 3 times..."
for i in 1 2 3; do curl -k https://hello.demo; done

cowsay "The 3 different greetings show that the nginx load balancer has correctly picked up the 3 hello-server containers."





echo; echo; echo
echo "DEMO: automatic re-configuration when a member leaves"
echo "====================================================="

echo
echo "Stopping 1 hello-server container..."
docker stop hello-server-1 &>/dev/null
sleep 2

echo
echo "Printing the hello upstream configuration..."
docker exec nginx-serf cat /etc/nginx/conf.d/hello.serf.conf | head -n 5 | sed 's/^/  /'

echo
echo "Running 'curl -k https://hello.demo' 4 times..."
for i in 1 2 3 4; do curl -k https://hello.demo; done

cowsay "The missing hello-server container was automatically removed from the load balancer."





echo; echo; echo
echo "DEMO: static site alongside load balancer"
echo "========================================="

echo
echo "Running 'curl http://blog.demo'..."
curl http://blog.demo

cowsay "nginx-serf can also manage your other sites alongside load-balanced servers."

echo
