#!/usr/bin/env python3
"""Append a dated pattern snapshot to secrets/patterns.json.
Designed for the 7AM/6PM CT 'JARVIS 업데이트' routine (and for publish-loop).
Reads secrets/collected.json and optional secrets/tx-full.json.
Writes only to the secrets folder. Prints counts, never merchant names or amounts.
Usage: python scripts/snapshot-patterns.py [--backfill] [--force] [--secrets DIR]
"""
import json, os, sys, argparse, collections, datetime, zoneinfo, hashlib
CT=zoneinfo.ZoneInfo("America/Chicago")
ap=argparse.ArgumentParser()
ap.add_argument("--backfill",action="store_true")
ap.add_argument("--force",action="store_true")
ap.add_argument("--secrets",default="/workspace/bot-dashboard-secrets")
args=ap.parse_args()
S=args.secrets
P=os.path.join(S,"patterns.json")
C=os.path.join(S,"collected.json")
if not os.path.exists(C):
    print("skip: no collected.json"); sys.exit(0)
col=json.load(open(C))
fin=col.get("finance") or {}
mail=col.get("mail") or {}
cal=col.get("calendar") or {}
try: tx=json.load(open(os.path.join(S,"tx-full.json")))
except Exception: tx=fin.get("tx") or []
isSpend=lambda t:t.get("amount",0)<0 and t.get("primary") not in("LOAN_PAYMENTS",) and not(t.get("src")=="card" and t.get("primary")=="TRANSFER_IN")
now=datetime.datetime.now(CT)
today=now.date()

def load_pat():
    try:
        p=json.load(open(P)); p.setdefault("snapshots",[]); return p
    except Exception:
        return {"v":1,"snapshots":[]}

def weekday_spend(rows):
    w=[0.0]*7
    for t in rows:
        if not isSpend(t) or not t.get("date"): continue
        try: d=datetime.date.fromisoformat(t["date"][:10])
        except Exception: continue
        w[d.weekday()]+=-t["amount"]
    return [round(x,2) for x in w]

def merch(rows,n=8):
    c=collections.Counter(); k=collections.Counter()
    for t in rows:
        if not isSpend(t): continue
        name=(t.get("name") or "?").strip() or "?"
        c[name]+=-t["amount"]; k[name]+=1
    return [{"name":m,"amt":round(c[m],2),"n":k[m]} for m,_ in c.most_common(n)]

def cats(rows):
    c=collections.Counter()
    for t in rows:
        if isSpend(t): c[t.get("cat") or "기타"]+=-t["amount"]
    return [{"cat":k,"amount":round(v,2)} for k,v in c.most_common()]

def senders(ml,n=8):
    c=collections.Counter()
    for arr in (ml.get("recent") or [], ml.get("important") or [], ml.get("flagged") or []):
        for m in arr:
            if m.get("from"): c[m["from"]]+=1
    return [{"from":k,"n":v} for k,v in c.most_common(n)]

def snap_from(rows, at, kind, extra=None):
    s={"at":at,"kind":kind,
       "spend":round(-sum(t["amount"] for t in rows if isSpend(t)),2),
       "income":round(sum(t["amount"] for t in rows if t.get("amount",0)>0 and t.get("primary") in("INCOME","TRANSFER_IN") and t.get("src")=="bank"),2),
       "byCategory":cats(rows),"byMerchant":merch(rows),
       "weekdaySpend":weekday_spend(rows),"hourSpend":None, # bank/card feeds have no time-of-day
       "recurring":[{"name":r.get("name"),"amount":r.get("amount"),"next":r.get("next"),"change":r.get("change") or 0,"missed":bool(r.get("missed"))} for r in (fin.get("recurring") or [])] if kind=="live" else [],
       "tx":len(rows)}
    if extra: s.update(extra)
    return s

def append(p, s):
    # de-dupe live snapshots in the same local hour
    if s.get("kind")=="live":
        key=s["at"][:13]
        p["snapshots"]=[x for x in p["snapshots"] if not(x.get("kind")=="live" and x.get("at","" )[:13]==key)]
    p["snapshots"].append(s)
    p["snapshots"]=sorted(p["snapshots"],key=lambda x:x.get("at") or "")[-400:]
    p["updatedAt"]=now.isoformat(timespec="minutes")

pat=load_pat()
added=0

if args.backfill or not any(x.get("kind")=="backfill" for x in pat["snapshots"]):
    # weekly history from full tx, plus a 30-day rolling point each week
    if tx:
        dates=sorted({t["date"][:10] for t in tx if t.get("date")})
        if dates:
            start=datetime.date.fromisoformat(dates[0])
            # align to Monday
            start=start-datetime.timedelta(days=start.weekday())
            end=datetime.date.fromisoformat(dates[-1])
            d=start
            while d<=end:
                e=d+datetime.timedelta(days=6)
                rows=[t for t in tx if d.isoformat()<=t.get("date","")<=e.isoformat()]
                if rows:
                    append(pat, snap_from(rows, e.isoformat()+"T20:00-06:00","backfill",{"from":d.isoformat(),"to":e.isoformat()}))
                    added+=1
                d+=datetime.timedelta(days=7)

# live snapshot from current collected.json
live_extra={
    "net":fin.get("net"),"cash":fin.get("cash"),"card":fin.get("cardBalance"),"cardUtil":fin.get("cardUtil"),
    "spend30":fin.get("spend30"),"income30":fin.get("income30"),"cash30":fin.get("cash30"),
    "mail":{"unread":mail.get("unreadEstimate") or mail.get("unread"),"byType":mail.get("byType") or [],
            "senders":senders(mail),"needsReply":len(mail.get("needsReply") or [])},
    "calendar":{"personal":len(cal.get("personal") or []),"holidays":len(cal.get("holidays") or [])},
    "collectedAt":col.get("collectedAt")
}
# skip if a live snap exists in the last 5 hours unless --force
recent=None
for s in reversed(pat["snapshots"]):
    if s.get("kind")=="live":
        try: recent=datetime.datetime.fromisoformat(s["at"])
        except Exception: recent=None
        break
if args.force or recent is None or (now-recent.replace(tzinfo=recent.tzinfo or CT)).total_seconds()>5*3600:
    rows30=[t for t in tx if t.get("date","")>=(today-datetime.timedelta(days=29)).isoformat()]
    append(pat, snap_from(rows30, now.isoformat(timespec="minutes"),"live",live_extra))
    added+=1
    kind="live-appended"
else:
    kind="live-skipped-recent"

# compact public series for the encrypted payload (aggregates)
series=[]
for s in pat["snapshots"]:
    series.append({"at":s.get("to") or s.get("at"),"kind":s.get("kind"),"spend":s.get("spend"),"income":s.get("income"),
                   "net":s.get("net"),"weekdaySpend":s.get("weekdaySpend"),
                   "byCategory":s.get("byCategory"),"byMerchant":[{"name":m["name"],"amt":m["amt"],"n":m["n"]} for m in (s.get("byMerchant") or [])[:5]]})
out={"v":1,"updatedAt":pat["updatedAt"],"hourNote":"transaction feeds have no time-of-day; hour grid is app-usage only",
     "weekdayLabels":["월","화","수","목","금","토","일"],
     "series":series,
     "latest":next((s for s in reversed(pat["snapshots"]) if s.get("kind")=="live"), pat["snapshots"][-1] if pat["snapshots"] else None)}
json.dump(pat,open(P,"w"),ensure_ascii=False,indent=1); os.chmod(P,0o600)
# payload-facing extract (also secrets; build-payload reads it)
E=os.path.join(S,"patterns-pub.json")
json.dump(out,open(E,"w"),ensure_ascii=False); os.chmod(E,0o600)
print(f"ok snapshots={len(pat['snapshots'])} added={added} status={kind}")
