FROM alphahydrae/nginx-serf-docker-base:1.0.0

# Install nginx-serf dependencies.
RUN mkdir -p /opt/nginx-serf
ADD package.json /opt/nginx-serf/package.json
RUN cd /opt/nginx-serf && npm install

# Install nginx-serf.
RUN mkdir -p /etc/nginx-serf /etc/ssl/private /var/www
ADD update.js /opt/nginx-serf/
ADD bin /opt/nginx-serf/bin
ADD templates /opt/nginx-serf/templates

# Add serf configuration files.
RUN mkdir -p /etc/serf \
    && echo "{}" > /etc/serf/serf.join.conf \
    && echo "{}" > /etc/serf/serf.override.conf
ADD serf.conf /etc/serf/

# Add s6 serf service.
RUN mkdir -p /etc/services.d/serf
ADD bin/init-serf.sh /etc/cont-init.d/
ADD bin/run-serf.sh /etc/services.d/serf/run

# Add s6 nginx service.
RUN mkdir -p /etc/services.d/nginx
ADD bin/run-nginx.sh /etc/services.d/nginx/run
ADD bin/finish-nginx.sh /etc/services.d/nginx/finish

# Add s6 serf graceful shutdown script.
ADD bin/serf-graceful-shutdown.sh /etc/cont-finish.d/

# Set up nginx directories.
RUN mkdir /etc/nginx/sites-serf \
    && rm -fr /etc/nginx/sites-available/* /etc/nginx/sites-enabled/*

# Allow the serf graceful shutdown script to last up to 10 seconds.
ENV S6_KILL_FINISH_MAXTIME 10000

# Expose http/s ports.
EXPOSE 80
EXPOSE 443

# Expose serf port.
EXPOSE 7946
