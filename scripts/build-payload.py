#!/usr/bin/env python3
"""JARVIS v10 payload builder: data.json (bots, local only) + secrets/collected.json (connector snapshot collected
by the agent on 'JARVIS 업데이트') -> payload.enc.json (AES-256-GCM, key = PBKDF2-SHA256 310k from passcode).
Only ciphertext is written to the repo. NEW tracking: secrets/firstseen.json (item id -> first seen on box)."""
import json, os, hashlib, base64, datetime, zoneinfo, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S="/workspace/bot-dashboard-secrets"; IT=310000; CT=zoneinfo.ZoneInfo("America/Chicago")
now=datetime.datetime.now(CT)
data=json.load(open(os.path.join(D,"data.json")))
try: col=json.load(open(os.path.join(S,"collected.json")))
except Exception: col={}
bots=data["bots"]
F=col.get("finance") or {}; M=col.get("mail") or {}; C=col.get("calendar") or {}; DOC=col.get("docs") or {}; EV=col.get("events") or []
money=lambda v:"—" if v is None else ("-" if v<0 else "")+f"${abs(v):,.0f}"
def iso(s):
    if not s: return None
    try:
        s=str(s).replace("Z","+00:00"); d=datetime.datetime.fromisoformat(s if len(s)>10 else s+"T12:00:00")
        return (d if d.tzinfo else d.replace(tzinfo=CT)).astimezone(CT)
    except Exception: return None
fsf=os.path.join(S,"firstseen.json")
try: FS=json.load(open(fsf))
except Exception: FS={}
seed=not FS; feed=[]
def item(id,kind,area,title,detail,ts,tone="info",ref=None):
    t=iso(ts)
    if id not in FS: FS[id]=(t or now).isoformat() if seed else now.isoformat()
    feed.append({"id":id,"kind":kind,"area":area,"title":title,"detail":detail,"ts":(t or iso(FS[id])).isoformat(),"firstSeen":FS[id],"tone":tone,"ref":ref or id})
for b in bots:
    if b.get("summaryLive"): item(f"bot:{b['id']}:{b.get('updatedAt')}","bot","bots",b["name"],b["summary"],b.get("updatedAt"),{"error":"err","working":"work"}.get(b["status"],"info"),b["id"])
for t in (F.get("tx") or [])[:40]: item(f"tx:{t['id']}","tx","money",f"{t['name']} {money(t['amount'])}",t["cat"]+(" · 대기" if t.get("pending") else ""),t["date"],"in" if t["amount"]>0 else "out",t["id"])
for m in (M.get("recent") or [])+(M.get("important") or []):
    if not any(x["id"]=="mail:"+m["id"] for x in feed): item("mail:"+m["id"],"mail","sched",m["subject"],f"{m['type']} · {m['from']}",m["date"],"warn" if m["type"] in("가족·학교",) else "info",m["id"])
for e in EV: item("ev:"+e["id"],"event","sched",e["subject"],(f"{e['count']}개 · " if e.get("count") else "")+(e.get("top") or "")[:100],e["date"],"info",e["id"])
for f in DOC.get("files") or []: item(f"doc:{f['id']}:{f['modified']}","doc","more",f["name"],f"Drive · {f['kind']}",f["modified"],"info",f["id"])
RC=col.get("reco") or {}
for r in RC.get("items") or []: item("reco:"+r["id"],"reco","reco",r["title"],r["why"][:120],r.get("date") or RC.get("at"),"warn" if r.get("prio")==1 else "info",r["id"])
for i,n in enumerate(RC.get("news") or []): item("news:"+n["link"],"news","interest",n["title"],n["src"],n["date"]+"T12:00:00-05:00","info",str(i))
json.dump(FS,open(fsf,"w")); os.chmod(fsf,0o600)
feed.sort(key=lambda x:x["ts"],reverse=True); feed=[x for x in feed if (iso(x["ts"]) or now)>=now-datetime.timedelta(days=10)][:120]
appr=[b["name"] for b in bots if b.get("summaryLive") and "승인" in (b.get("summary") or "")]
wk=F.get("weeks") or []; tr=round(100*(wk[-1]["spend"]-wk[-2]["spend"])/wk[-2]["spend"]) if len(wk)>1 and wk[-2]["spend"] else None
bills=F.get("bills") or []
hl=[]
if F: hl.append(f"30일 순현금흐름 {'+' if F['cash30']>=0 else ''}{money(F['cash30'])} (입금 {money(F['income30'])} · 지출 {money(F['spend30'])})")
if tr is not None: hl.append(f"이번 주 지출 {money(wk[-1]['spend'])}, 지난주 대비 {'+' if tr>0 else ''}{tr}%")
if bills: hl.append(f"21일 내 청구 예상 {len(bills)}건 {money(sum(b['amount'] for b in bills))}")
hl.append(f"봇 {data['health'].get('ok',0)}/{data['health'].get('total',0)} 정상"+(f" · 승인 대기 {len(appr)}" if appr else ""))
hol=[h for h in C.get("holidays") or [] if h["date"]>=now.date().isoformat()]
tctx={"now":now.isoformat(timespec="minutes"),"weekday":"월화수목금토일"[now.weekday()],"next":[{"date":h["date"],"title":h["title"],"dday":(datetime.date.fromisoformat(h["date"])-now.date()).days} for h in hol]}
conn=json.load(open(os.path.join(D,"scripts","connections.json")))
for c in conn["categories"]:
    if c["key"]=="회의": c["note"]="Granola 계정 미생성 — 연결 필요"
    if c["key"]=="개발": c["note"]="GitHub 알림 권한 없음(403)"
def _mk():
    try: return json.load(open(os.path.join(S,"market.json")))
    except Exception: return None
MK=_mk()
def _paper():
    import csv
    f="/workspace/trading-system/reports/paper-forward/daily.csv"
    try: rows=list(csv.DictReader(open(f)))
    except Exception: return None
    R={}
    for r in rows: R.setdefault(r["strategy"],{}).setdefault(r["run_id"],[]).append(r)
    out=[]
    for st,runs in R.items():
        allr=[x for rid in sorted(runs) for x in runs[rid]]
        cur=runs[sorted(runs)[-1]]
        out.append({"strategy":st,"currency":cur[-1]["currency"],"run":sorted(runs)[-1],"runs":len(runs),"equity":float(cur[-1]["equity_end"]),"start":float(cur[0]["start_equity"]),"cum":float(cur[-1]["cum_return_pct"]),"mdd":float(cur[-1]["mdd_pct"]),"trades":int(cur[-1]["trades_cum"]),
          "series":[[x["date"],float(x["cum_return_pct"]),x["run_id"][:8]] for x in allr],"updated":cur[-1]["updated_at"]})
    return {"src":"trading-system/reports/paper-forward/daily.csv (페이퍼·가상자금)","items":out}
PAPER=_paper()
plain={"v":4,"generatedAt":data["generatedAt"],"collectedAt":col.get("collectedAt"),"health":data["health"],"bots":bots,"approvals":appr,
 "headline":hl,"weekTrend":tr,"time":tctx,"fin":F,"mail":M,"cal":C,"events":EV,"docs":DOC,"dev":col.get("dev"),"x":col.get("x"),"meet":col.get("meetings"),
 "side":col.get("sideIncome"),"routines":col.get("routines"),"automations":data.get("automations"),"conn":conn,"feed":feed,"reco":col.get("reco"),"interests":col.get("interests"),"mailx":col.get("mailx"),"fortune":col.get("fortune"),"profile":col.get("profile"),"market":MK,"paper":PAPER}
raw=json.dumps(plain,ensure_ascii=False,sort_keys=True).encode()
h=hashlib.sha256(raw).hexdigest(); hf=os.path.join(S,"payload.hash"); out=os.path.join(D,"payload.enc.json")
if os.path.exists(out) and os.path.exists(hf) and open(hf).read()==h and "--force" not in sys.argv: print("unchanged"); sys.exit(0)
pw_=open(os.path.join(S,"passcode")).read().strip().encode(); salt=os.urandom(16); iv=os.urandom(12)
key=PBKDF2HMAC(algorithm=hashes.SHA256(),length=32,salt=salt,iterations=IT).derive(pw_)
b=lambda x:base64.b64encode(x).decode()
json.dump({"v":3,"kdf":"PBKDF2-SHA256","iter":IT,"salt":b(salt),"iv":b(iv),"ct":b(AESGCM(key).encrypt(iv,raw,None))},open(out,"w"))
open(hf,"w").write(h); os.chmod(hf,0o600); print("encrypted",len(raw),"bytes plain")
if "--print" in sys.argv: print(hl, len(feed), tctx)
