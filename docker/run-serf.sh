#!/usr/bin/with-contenv bash

pid=$$

sigterm() {
  kill -INT $pid
}

trap sigterm SIGTERM

COMMAND="/opt/bin/serf agent"
COMMAND="$COMMAND --bind $(hostname -i)"
COMMAND="$COMMAND --event-handler user:nginx-serf-reload=/opt/nginx-serf/handle-serf-event.sh"
COMMAND="$COMMAND --event-handler member-join,member-leave,member-failed,member-update=/opt/nginx-serf/handle-serf-event.sh"
COMMAND="$COMMAND --config-file /etc/serf.conf"

if [ -n "$NGINX_SERF_JOIN" ]; then
  OLD_IFS=$IFS
  IFS=','

  for JOIN in "$NGINX_SERF_JOIN"; do
    COMMAND="$COMMAND --join $JOIN"
  done

  IFS=$OLD_IFS
fi

echo "$COMMAND"

exec $COMMAND &
pid=$!
wait
