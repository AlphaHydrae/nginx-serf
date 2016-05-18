#!/usr/bin/env bash

if [ -n "$NGINX_SERF_JOIN" ]; then
  echo "{\"start_join\":[\"$NGINX_SERF_JOIN\"]}" > /etc/serf/serf.join.conf
fi

exec /usr/local/bin/supervisord -c /etc/supervisord/supervisord.conf
