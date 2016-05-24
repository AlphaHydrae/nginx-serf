#!/usr/bin/with-contenv bash

for i in {1..10}; do
  if [ -f /etc/nginx/nginx.conf ]; then
    break
  fi

  echo "Waiting for nginx-serf to start..."
  sleep 1
done

exec /usr/sbin/nginx -c /etc/nginx/nginx.conf
