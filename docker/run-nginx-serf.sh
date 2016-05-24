#!/usr/bin/with-contenv bash

for i in {1..10}; do
  if /opt/bin/serf members &>/dev/null; then
    break
  fi

  echo "Waiting for serf to start..."
  sleep 1
done

exec /opt/nginx-serf/bin/www
