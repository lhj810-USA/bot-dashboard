#!/usr/bin/env python3
"""Regenerate data.json read-only from /home/box/agent-data/agents. Never fabricates values."""
import json, os, datetime, zoneinfo
A="/home/box/agent-data/agents"; CT=zoneinfo.ZoneInfo("America/Chicago")
IDS=[("총괄 Bot","927a7b6f-fb9c-4669-8bc9-cf48f34f70b6"),("자동 매매_감시자","173243fe-b09d-49c5-9541-2dbaff3b72d6"),("영어공부 봇","c16480ab-9b7e-4832-9edc-b6a27ff82899"),("Event 알림봇","61c15c0d-aeeb-488f-99bf-88878e64b446"),("자동 매매_대장","c134c704-d944-4fbb-8f13-b6d70c4d75f8"),("아르바이트봇","92919409-9721-49b6-b150-79aaee08b3a2"),("자동 매매_실험","ec952ea5-d6ba-48db-8957-34895ac75c50")]
def fmt(ms): return datetime.datetime.fromtimestamp(ms/1000,CT).strftime("%Y-%m-%d %H:%M CT")
bots=[]
for name,i in IDS:
    d=os.path.join(A,i); p={}
    try: p=json.load(open(os.path.join(d,"profile.json")))
    except Exception: pass
    lt=p.get("lastTurnAt"); st=p.get("status")
    mt=[os.path.getmtime(os.path.join(d,f)) for f in ("store.db","store.db-wal") if os.path.exists(os.path.join(d,f))]
    bots.append({"id":i,"name":p.get("name") or name,"description":p.get("description") or "알 수 없음",
      "lastTurnAt":lt,"lastActivity":fmt(lt) if isinstance(lt,(int,float)) else "알 수 없음",
      "localFileModified":fmt(max(mt)*1000) if mt else "알 수 없음","status":st or "unknown"})
out={"generatedAt":datetime.datetime.now(CT).strftime("%Y-%m-%d %H:%M CT"),"bots":bots,
 "automations":[{"name":"자동화 트레이닝","taskId":"ea82d2ea-ee33-499f-b00b-c59055a09071","status":"비활성/아카이브"}]}
json.dump(out,open(os.path.join(os.path.dirname(__file__),"..","data.json"),"w"),ensure_ascii=False,indent=1)
print("ok",out["generatedAt"])
