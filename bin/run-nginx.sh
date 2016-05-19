#!/usr/bin/with-contenv bash
/opt/nginx-serf/update.js
exec /usr/sbin/nginx -c /etc/nginx/nginx.conf
