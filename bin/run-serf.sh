#!/usr/bin/with-contenv bash
pid=$$

sigterm() {
  kill -INT $pid
}

trap sigterm SIGTERM

/opt/bin/serf agent --config-file /etc/serf/serf.conf --config-file /etc/serf/serf.join.conf --config-file /etc/serf/serf.override.conf &
pid=$!
wait
