FROM alphahydrae/nginx-serf-base

RUN mkdir -p /opt/nginx-serf
ADD package.json /opt/nginx-serf/package.json
RUN cd /opt/nginx-serf && npm install

RUN mkdir -p /etc/nginx-serf /etc/ssl/private /var/www
ADD update.js /opt/nginx-serf/
ADD bin /opt/nginx-serf/bin
ADD templates /opt/nginx-serf/templates

RUN mkdir -p /etc/serf /etc/supervisord \
    && echo "{}" > /etc/serf/serf.join.conf \
    && echo "{}" > /etc/serf/serf.override.conf

ADD serf.conf /etc/serf/
ADD supervisord.conf /etc/supervisord/

RUN rm -fr /etc/nginx/conf.d/*

EXPOSE 80
EXPOSE 443
EXPOSE 7946

CMD [ "/opt/nginx-serf/bin/start.sh" ]
