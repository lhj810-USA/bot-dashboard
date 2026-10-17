#!/usr/bin/env python3
"""Build the private briefing payload and encrypt it (AES-256-GCM, PBKDF2-SHA256 310k).
Inputs: data.json (bots, local only), secrets/collected.json (connector snapshot collected by the agent).
NEW tracking: secrets/firstseen.json maps item-id -> first time the box saw it (or the item's own time on first seeding)."""
import json, os, hashlib, base64, datetime, zoneinfo, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S="/workspace/bot-dashboard-secrets"; IT=310000; CT=zoneinfo.ZoneInfo("America/Chicago")
now=datetime.datetime.now(CT)
data=json.load(open(os.path.join(D,"data.json")))
try: col=json.load(open(os.path.join(S,"collected.json")))
except Exception: col={}
bots=data["bots"]; by=lambda *k:[b for b in bots if b["dept"] in k]
F=col.get("finance") or {}; M=col.get("mail") or {}; C=col.get("calendar") or {}; G=col.get("dev") or {}; DOC=col.get("docs") or {}; EV=col.get("events") or []; SI=col.get("sideIncome") or {}
money=lambda v:"—" if v is None else ("-" if v<0 else "")+f"${abs(v):,.0f}"
kf=lambda v:"—" if v is None else (f"${v/1000:.1f}K" if abs(v)>=1000 else money(v))
def iso(s):
    """parse various timestamps -> aware datetime (CT)"""
    if not s: return None
    try:
        s=str(s).replace("Z","+00:00")
        d=datetime.datetime.fromisoformat(s if len(s)>10 else s+"T12:00:00")
        if d.tzinfo is None: d=d.replace(tzinfo=datetime.timezone.utc if "T" in s and len(s)>10 and not s.endswith(":00") else CT)
        return d.astimezone(CT)
    except Exception: return None
fmt=lambda d:d.strftime("%m/%d %H:%M CT") if d else "—"
def st(bs):
    for s in ("error","working","idle"):
        if any(b["status"]==s for b in bs): return s
    return "unknown"
al=lambda bs:sum(int((b.get("metrics") or {}).get("alerts") or 0) for b in bs)
appr=[b for b in bots if b.get("summaryLive") and "승인" in (b.get("summary") or "")]
# ---------- items for NEW feed ----------
fsf=os.path.join(S,"firstseen.json")
try: FS=json.load(open(fsf))
except Exception: FS={}
seed=not FS
items=[]
def item(id,cat,title,detail,ts,tone="info"):
    t=iso(ts) if isinstance(ts,str) else ts
    if id not in FS: FS[id]=(t or now).isoformat() if seed else now.isoformat()
    fs=iso(FS[id]) or now
    items.append({"id":id,"cat":cat,"title":title,"detail":detail,"at":(t.strftime("%m/%d") if isinstance(ts,str) and len(ts)==10 and t else fmt(t)),"ts":(t or fs).isoformat(),"firstSeen":fs.isoformat(),"tone":tone})
for b in bots:
    if b.get("summaryLive"):
        item(f"bot:{b['id']}:{b.get('updatedAt')}","봇 운영",b["name"],b["summary"],b.get("updatedAt"),"error" if b["status"]=="error" else ("work" if b["status"]=="working" else "info"))
for t in (F.get("recentTx") or [])[:15]:
    item(f"tx:{t['id']}","자산·금융",f"{t['name']} {money(t['amount'])}",f"{t['cat']}{' · 대기' if t.get('pending') else ''}",t["date"],"in" if t["amount"]>0 else "out")
for m in (M.get("important") or [])[:12]:
    item(f"mail:{m['id']}","메일·연락",m["subject"],f"{m['type']} · {m['from']}",m["date"]+"+00:00" if len(m["date"])==16 else m["date"])
for e in EV[:7]:
    item(f"ev:{e['id']}","일정·생활",e["subject"],(f"{e['count']}개 · " if e.get("count") else "")+"TOP: "+e.get("top","")[:90],e["date"]+"+00:00")
for f in (DOC.get("files") or [])[:10]:
    item(f"doc:{f['id']}:{f['modified']}","성장·학습",f["name"],"Drive 수정",f["modified"]+"+00:00")
json.dump(FS,open(fsf,"w")); os.chmod(fsf,0o600)
items.sort(key=lambda x:x["ts"],reverse=True)
cut=now-datetime.timedelta(hours=36)
feed=[x for x in items if (iso(x["ts"]) or now)>=cut or (iso(x["firstSeen"]) or now)>=now-datetime.timedelta(hours=24)][:30]
# ---------- 관심 / hero ----------
sw,pw=F.get("spendWeek"),F.get("spendPrevWeek")
trend=None if not (sw and pw) else round(100*(sw-pw)/pw)
trade=by("매매"); work=[b["name"] for b in bots if b["status"]=="working"]
pend=F.get("pending") or []
interest=[
 {"key":"wealth","title":"경제적 자유 · 순현금","big":kf(F.get("net")),"sub":f"현금 {money(F.get('cash'))} − 카드 {money(F.get('cardBalance'))}","trend":trend,"trendLabel":f"주간 지출 {money(sw)} (지난주 {money(pw)})" if sw is not None else "지출 데이터 없음","tone":"warn" if trend and trend>20 else "ok","cat":"자산·금융"},
 {"key":"side","title":"부업 목표 "+SI.get("goal","월 $300–500"),"big":"—" if SI.get("tracked") is None else money(SI["tracked"]),"sub":SI.get("note","추적 시작 필요"),"tone":"muted","cat":"부업·알바"},
 {"key":"trade","title":"자동 매매","big":f"{sum(1 for b in trade if b['status']=='working')}/{len(trade)}","sub":"작업 중 봇 · 손익 데이터 없음","trendLabel":f"봇 보고 알림 {al(trade)}건","tone":"work" if any(b['status']=='working' for b in trade) else "ok","cat":"투자·매매"},
 {"key":"decide","title":"결정 필요","big":str(len(appr)),"sub":" · ".join(b["name"] for b in appr) or "없음","tone":"warn" if appr else "ok","cat":"봇 운영"},
]
p1=f"이번 주 지출 {money(sw)}로 지난주보다 {abs(trend)}% {'늘었' if trend>0 else '줄었'}" if trend is not None else ""
p2=f"승인 대기 {len(appr)}건이 있습니다" if appr else ""
hl=(p1+("고, "+p2 if p2 else "습니다")+".") if p1 else ((p2+".") if p2 else "새로운 큰 변화는 없습니다.")
chips=[]
if trend is not None: chips.append({"kind":"변화","label":f"지출 {'+' if trend>0 else ''}{trend}% 주간","cat":"자산·금융","tone":"warn" if trend>0 else "ok"})
chips.append({"kind":"결정","label":f"승인 대기 {len(appr)}건" if appr else "결정 대기 없음","cat":"봇 운영","tone":"warn" if appr else "ok"})
if pend: chips.append({"kind":"주시","label":f"카드 대기 {len(pend)}건 {money(-sum(p['amount'] for p in pend))}","cat":"자산·금융","tone":"info"})
today_ev=EV[0] if EV else None
# ---------- categories ----------
cats=[
 {"key":"자산·금융","icon":"◈","big":kf(F.get("net")),"unit":"순현금","trend":trend,"trendText":"주간 지출","status":"ok" if F else "unknown",
  "accounts":[{"name":"BoA 입출금 ••4090","value":F.get("cash"),"kind":"cash"},{"name":"BoA 카드 ••6432","value":-(F.get("cardBalance") or 0),"kind":"card","extra":f"사용 가능 {money(F.get('cardAvailable'))}"}] if F else [],
  "byCategory":F.get("byCategory"),"daily":F.get("daily"),"spendWeek":sw,"spendPrevWeek":pw,"weekRange":F.get("weekRange"),"prevRange":F.get("prevRange"),
  "pending":pend,"recentTx":(F.get("recentTx") or [])[:10],"income30d":F.get("income30d"),"income30dCount":F.get("income30dCount"),"note":F.get("note")},
 {"key":"투자·매매","icon":"⟁","big":str(al(trade)),"unit":"봇 보고 알림","status":st(trade),"bots":[b["id"] for b in trade],"note":"손익(PnL) 데이터 없음 — 자본 봇이 status 파일 metrics.pnl로 보고하면 표시"},
 {"key":"일정·생활","icon":"◷","big":str(today_ev["count"]) if today_ev and today_ev.get("count") else str(C.get("events7d","—")),"unit":"오늘 주변 행사" if today_ev and today_ev.get("count") else "7일 일정","status":st(by("알림")),
  "calendar":C,"events":EV[:7],"bots":[b["id"] for b in by("알림")]},
 {"key":"메일·연락","icon":"✉","big":str(M.get("unread","—")),"unit":"안 읽음","status":"ok" if M else "unknown","importantUnread":M.get("importantUnread"),"important":(M.get("important") or [])[:12],"groups":M.get("groups"),"recent3d":M.get("recent3d"),"note":M.get("note")},
 {"key":"성장·학습","icon":"✦","big":str(DOC.get("recent7d","—")),"unit":"7일 수정 문서","status":st(by("지식")),"files":(DOC.get("files") or [])[:8],"bots":[b["id"] for b in by("지식")]},
 {"key":"부업·알바","icon":"＄","big":"—" if SI.get("tracked") is None else money(SI["tracked"]),"unit":"이번 달 부업 수입","status":st(by("알바")),"goal":SI.get("goal"),"note":SI.get("note"),"bots":[b["id"] for b in by("알바")]},
 {"key":"봇 운영","icon":"⬡","big":f"{data['health'].get('ok',0)}/{data['health'].get('total',0)}","unit":"정상 봇","status":"error" if any(b['status']=='error' for b in bots) else "ok","bots":[b["id"] for b in bots],"approvals":[b["name"] for b in appr]},
 {"key":"연결","icon":"◎","big":str(sum(sum(i[1] for i in c["items"]) for c in json.load(open(os.path.join(D,"scripts","connections.json")))["categories"])),"unit":"연결 계정","status":"ok"},
]
conn=json.load(open(os.path.join(D,"scripts","connections.json")))
for c in conn["categories"]:
    if c["key"]=="회의": c["note"]="Granola 계정 미생성 — 연결 필요"
    if c["key"]=="개발": c["note"]="GitHub 알림 권한 없음"
brief=[hl, f"순현금 {money(F.get('net'))}, 카드 대기 결제 {len(pend)}건." if F else "금융 연결 필요.",
 f"봇 {len(bots)}개 중 {data['health'].get('ok',0)}개 정상" + (f", {'·'.join(work)} 작업 중" if work else "") + (f". 오늘 주변 행사 {today_ev['count']}개." if today_ev and today_ev.get("count") else ".")]
plain={"v":2,"generatedAt":data["generatedAt"],"collectedAt":col.get("collectedAt"),"health":data["health"],"bots":bots,"hero":{"headline":hl,"chips":chips},
 "feed":feed,"interest":interest,"cats":cats,"brief":brief,"connections":conn,"automations":data.get("automations")}
raw=json.dumps(plain,ensure_ascii=False,sort_keys=True).encode()
# hash excludes firstSeen churn: stable fields only
h=hashlib.sha256(raw).hexdigest(); hf=os.path.join(S,"payload.hash"); out=os.path.join(D,"payload.enc.json")
if os.path.exists(out) and os.path.exists(hf) and open(hf).read()==h and "--force" not in sys.argv: print("unchanged"); sys.exit(0)
pw_=open(os.path.join(S,"passcode")).read().strip().encode(); salt=os.urandom(16); iv=os.urandom(12)
key=PBKDF2HMAC(algorithm=hashes.SHA256(),length=32,salt=salt,iterations=IT).derive(pw_)
b=lambda x:base64.b64encode(x).decode()
json.dump({"v":2,"kdf":"PBKDF2-SHA256","iter":IT,"salt":b(salt),"iv":b(iv),"ct":b(AESGCM(key).encrypt(iv,raw,None))},open(out,"w"))
open(hf,"w").write(h); os.chmod(hf,0o600); print("encrypted",len(raw),"bytes plain")
if "--print" in sys.argv: print(json.dumps({"hero":plain["hero"],"feed":[(x["cat"],x["title"][:40],x["at"]) for x in feed[:12]],"interest":[(i["title"],i["big"]) for i in interest],"cats":[(c["key"],c["big"],c["unit"]) for c in cats]},ensure_ascii=False,indent=0))
