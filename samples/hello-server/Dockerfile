FROM alphahydrae/nginx-serf-docker-base:2.0.0

RUN mkdir -p /opt/bin
ADD hello-server.js /opt/bin/

RUN mkdir -p /etc/services.d/serf /etc/services.d/hello-server
ADD run-serf.sh /etc/services.d/serf/run
ADD run-hello-server.sh /etc/services.d/hello-server/run
ADD finish-hello-server.sh /etc/services.d/hello-server/finish
ADD serf-graceful-shutdown.sh /etc/cont-finish.d/

ENV S6_KILL_FINISH_MAXTIME 10000

EXPOSE 3000
EXPOSE 7946
