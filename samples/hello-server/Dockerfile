FROM alphahydrae/nginx-serf-base

RUN mkdir -p /opt/bin
ADD hello-server.js /opt/bin/
ADD supervisord.conf /etc/supervisord.conf

EXPOSE 3000
EXPOSE 7946

CMD [ "/usr/local/bin/supervisord", "-c", "/etc/supervisord.conf" ]
