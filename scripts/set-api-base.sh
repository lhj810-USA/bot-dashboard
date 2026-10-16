#!/bin/sh
# usage: scripts/set-api-base.sh https://xxx.trycloudflare.com  → updates config.js (then commit/push for Pages)
cd "$(dirname "$0")/.." && echo "window.API_BASE=\"$1\";" > config.js
