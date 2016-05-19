#!/usr/bin/with-contenv bash
pid=$$

sigterm() {
  kill -INT $pid
}

trap sigterm SIGTERM

/opt/bin/serf agent --join serf --tag role=server --tag app=hello &
pid=$!
wait
