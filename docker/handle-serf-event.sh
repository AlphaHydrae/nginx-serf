#!/usr/bin/env bash
exec curl -X POST -d @- -H "Content-Type: text/plain" -H "Serf-Event: $SERF_EVENT" -H "Serf-User-Event: $SERF_USER_EVENT" http://127.0.0.1:3000/api/serfEvent
