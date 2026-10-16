#!/bin/sh
# every 5 min: regenerate data.json and push to Pages only if changed
cd "$(dirname "$0")/.."
while true; do
  python3 scripts/update-data.py >/dev/null 2>&1
  if ! git diff --quiet -- data.json status 2>/dev/null || [ -n "$(git status --porcelain status data.json)" ]; then
    git add data.json status && git -c user.name=lhj810-USA -c user.email=lhj810-USA@users.noreply.github.com commit -qm "data: auto update" && git push -q
  fi
  sleep 300
done
