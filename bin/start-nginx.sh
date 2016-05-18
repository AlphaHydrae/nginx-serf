#!/usr/bin/env bash
/opt/nginx-serf/update.js
exec /usr/sbin/nginx -c /etc/nginx/nginx.conf
