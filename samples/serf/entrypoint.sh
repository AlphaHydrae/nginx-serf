#!/usr/bin/env bash

pid=$$

sigterm() {
  kill -INT $pid
}

trap sigterm SIGTERM

COMMAND="/opt/bin/serf agent"
COMMAND="$COMMAND --bind $(hostname -i)"

if [ -n "$SERF_JOIN" ]; then
  OLD_IFS=$IFS
  IFS=','

  for JOIN in "$SERF_JOIN"; do
    COMMAND="$COMMAND --join $JOIN"
  done

  IFS=$OLD_IFS
fi

echo "$COMMAND"

exec $COMMAND &
pid=$!
wait
