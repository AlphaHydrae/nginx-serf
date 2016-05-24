#!/usr/bin/env bash
while /opt/bin/serf info &>/dev/null; do
  echo "[$(date)] Waiting for serf to gracefully shut down..."
  sleep 1
done
