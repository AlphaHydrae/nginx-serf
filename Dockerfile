FROM alphahydrae/nginx-serf-base

RUN mkdir -p /opt/nginx-serf
ADD package.json /opt/nginx-serf/package.json
RUN cd /opt/nginx-serf && npm install

RUN mkdir -p /etc/nginx-serf /etc/ssl/private /var/www
ADD update.js supervisord.conf /opt/nginx-serf/
ADD bin /opt/nginx-serf/bin
ADD templates /opt/nginx-serf/templates

RUN rm -fr /etc/nginx/conf.d/*
