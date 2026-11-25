#!/bin/sh
# every 5 min: regenerate data.json (local only) -> encrypted payload.enc.json & photos.enc.json; push only when changed
export PATH=$HOME/.local/bin:$PATH
cd "$(dirname "$0")/.."
while true; do
  python3 scripts/update-data.py >/dev/null 2>&1
  /workspace/bot-dashboard-venv/bin/python scripts/collect-market.py >/dev/null 2>&1   # 공개 시세·환율·날씨 (30분 간격)
  python3 scripts/collect-news.py >/dev/null 2>&1   # 공개 RSS 뉴스 (30분 간격)
  python3 scripts/collect-fun.py >/dev/null 2>&1   # 유튜브·이색 볼거리 (6시간 간격)
  python3 scripts/collect-world.py >/dev/null 2>&1   # USGS·GDELT·세계 시계 (30분 간격)
  python3 scripts/collect-extra.py >/dev/null 2>&1   # 추가 커넥터 요약 갱신
  python3 scripts/collect-grok-memory.py >/dev/null 2>&1   # Grok 봇 기억 집계
  /workspace/bot-dashboard-venv/bin/python scripts/collect-photos.py >/dev/null 2>&1   # 사진 썸네일 암호화
  python3 scripts/ai-brief.py >/dev/null 2>&1   # AI 브리핑 (로컬 규칙 엔진)
  python3 scripts/snapshot-patterns.py >/dev/null 2>&1   # 패턴 스냅샷 (5시간 내 중복 생략; 7AM/6PM 루틴이 수집 후 --force 가능)
  /workspace/bot-dashboard-venv/bin/python scripts/build-payload.py >/dev/null 2>&1
  if [ -n "$(git status --porcelain payload.enc.json photos.enc.json)" ]; then
    git add payload.enc.json photos.enc.json && git -c user.name=lhj810-USA -c user.email=lhj810-USA@users.noreply.github.com commit -qm "payload: auto update (encrypted)" && (git pull -q --rebase -X theirs || git rebase --abort) && git push -q
  fi
  sleep 300
done
