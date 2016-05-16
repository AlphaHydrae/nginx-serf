FROM nginx:1.9

RUN apt-get update \
    && apt-get install -y \
       wget python-setuptools python-dev build-essential \
       --no-install-recommends \
    && easy_install supervisor

RUN wget -q https://nodejs.org/dist/v4.4.4/node-v4.4.4-linux-x64.tar.xz \
    && tar -C /usr/local --strip-components 1 -xf node-v4.4.4-linux-x64.tar.xz \
    && rm -f node-v4.4.4-linux-x64.tar.xz

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ADD https://releases.hashicorp.com/serf/0.7.0/serf_0.7.0_linux_amd64.zip /tmp/serf.gz

RUN mkdir /opt/bin && \
    gunzip -c /tmp/serf.gz > /opt/bin/serf && \
    chmod 755 /opt/bin/serf && \
    rm -f /tmp/serf.gz

CMD [ "supervisord", "-c", "/etc/supervisord.conf" ]
