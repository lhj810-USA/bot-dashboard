#!/bin/sh
# every 5 min: regenerate data.json (local only) -> encrypted payload.enc.json; push only when the plaintext changed
cd "$(dirname "$0")/.."
while true; do
  python3 scripts/update-data.py >/dev/null 2>&1
  /workspace/bot-dashboard-venv/bin/python scripts/build-payload.py >/dev/null 2>&1
  if [ -n "$(git status --porcelain payload.enc.json)" ]; then
    git add payload.enc.json && git -c user.name=lhj810-USA -c user.email=lhj810-USA@users.noreply.github.com commit -qm "payload: auto update (encrypted)" && (git pull -q --rebase -X theirs || git rebase --abort) && git push -q
  fi
  sleep 300
done
