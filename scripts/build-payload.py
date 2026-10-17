#!/usr/bin/env python3
"""Merge data.json (bots) + private collected.json (connector snapshot) -> briefing -> AES-GCM encrypt -> payload.enc.json.
Key: PBKDF2-HMAC-SHA256(passcode, salt, 310000) -> 256-bit. Only ciphertext is written into the repo.
Re-encrypts only when plaintext changes (hash kept in secrets dir)."""
import json, os, hashlib, base64, datetime, zoneinfo, sys
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
D=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); S="/workspace/bot-dashboard-secrets"; IT=310000
CT=zoneinfo.ZoneInfo("America/Chicago")
data=json.load(open(os.path.join(D,"data.json")))
try: col=json.load(open(os.path.join(S,"collected.json")))
except Exception: col={}
bots=data["bots"]; by=lambda k:[b for b in bots if b["dept"]==k]
def money(v): return None if v is None else f"${v:,.0f}"
def k(v): return None if v is None else (f"${v/1000:.1f}K" if abs(v)>=1000 else f"${v:,.0f}")
F=col.get("finance") or {}; M=col.get("mail") or {}; C=col.get("calendar") or {}; G=col.get("dev") or {}; DOC=col.get("docs") or {}; AL=col.get("alertsBot") or {}
def st(bs):
    if any(b["status"]=="error" for b in bs): return "error"
    if any(b["status"]=="working" for b in bs): return "working"
    if any(b["status"]=="idle" for b in bs): return "idle"
    return "unknown"
def al(bs): return sum(int((b.get("metrics") or {}).get("alerts") or 0) for b in bs)
tr=by("매매")
sectors=[
 {"key":"금융","big":k(F.get("net")),"unit":"순자산(현금−카드)","status":"idle" if F.get("connection")=="active" else "unknown",
  "lines":[f"현금 {money(F.get('cash'))} · 카드 잔액 {money(F.get('cardBalance'))}" if F else "연결 필요",
           f"7일 지출 {money(F.get('spend7d'))} · 대기 {F.get('pending')}건" if F else "",
           ("주요 지출: "+", ".join(f"{t['name'].strip()} {money(-t['amount'])}" for t in F.get("topSpend",[]))) if F.get("topSpend") else "",
           f"{F.get('institution','')} 연결 {F.get('connection','—')}" if F else ""]},
 {"key":"매매","big":str(sum(1 for b in tr if b["status"]=="working")),"unit":f"작업 중 / {len(tr)}봇","status":st(tr),
  "lines":[f"봇 보고 알림 합계 {al(tr)}건","손익: 데이터 없음 (봇 status에 pnl 미보고)"]},
 {"key":"일정","big":str(C.get("events7d","—")),"unit":"7일 일정","status":"idle" if C else "unknown","lines":[C.get("note","연결 필요")]},
 {"key":"메일","big":str(M.get("unread","—")),"unit":"안 읽음","status":"idle" if M else "unknown",
  "lines":[f"중요·안 읽음 {M.get('importantUnread','—')}건"]+[f"{t['date'][5:]} {t['subject']} — {t['from']}" for t in M.get("top",[])]},
 {"key":"지식","big":str(DOC.get("recent7d","—")),"unit":"7일 수정 문서","status":st(by("지식")),"lines":["최근: "+", ".join(DOC.get("recentTop",[]))] if DOC else []},
 {"key":"알바","big":str(al(by("알바"))),"unit":"유지 알림","status":st(by("알바")),"lines":[]},
 {"key":"알림","big":str(AL.get("dailyEmails","—")),"unit":"최근 행사 메일","status":st(by("알림")),"lines":[f"최근 발송: {AL.get('last')} ({AL.get('lastAt','')[5:].replace('T',' ')} UTC)"] if AL.get("last") else []},
 {"key":"개발","big":str(G.get("openPRs","—")),"unit":"열린 PR","status":"idle" if G else "unknown","lines":[G.get("note","")] if G else ["연결 필요"]},
]
known=[b for b in bots if b["status"]!="unknown"]; ok=[b for b in known if b["status"]!="error"]; work=[b["name"] for b in bots if b["status"]=="working"]
appr=[b["name"] for b in bots if "승인" in (b.get("summary") or "") and b.get("summaryLive")]
last=max([b["lastActivity"] for b in bots if b.get("lastTurnAt")] or ["—"])
brief=[f"봇 {len(bots)}개 중 {len(ok)}개 정상" + (f", {', '.join(work)} 작업 중" if work else "") + f". 최근 보고 {last[11:] if len(last)>11 else last}.",
 (f"현금 {money(F.get('cash'))}, 카드 잔액 {money(F.get('cardBalance'))}, 7일 지출 {money(F.get('spend7d'))}." if F else "금융 데이터 연결 필요."),
 f"안 읽은 메일 {M.get('unread','—')}(중요 {M.get('importantUnread','—')}), 7일 일정 {C.get('events7d','—')}건" + (f", 승인 대기 {len(appr)}건({'·'.join(appr)})." if appr else ".")]
conn=json.load(open(os.path.join(D,"scripts","connections.json")))
for c in conn["categories"]:
    if c["key"]=="회의": c["note"]="Granola 계정 미생성 — 연결 필요"
plain={"generatedAt":data["generatedAt"],"collectedAt":col.get("collectedAt"),"health":data["health"],"bots":bots,"sectors":sectors,"brief":brief,
 "connections":conn,"automations":data.get("automations"),"approvals":appr}
raw=json.dumps(plain,ensure_ascii=False,sort_keys=True).encode()
h=hashlib.sha256(raw).hexdigest(); hf=os.path.join(S,"payload.hash")
out=os.path.join(D,"payload.enc.json")
if os.path.exists(out) and os.path.exists(hf) and open(hf).read()==h and "--force" not in sys.argv: print("unchanged"); sys.exit(0)
pw=open(os.path.join(S,"passcode")).read().strip().encode(); salt=os.urandom(16); iv=os.urandom(12)
key=PBKDF2HMAC(algorithm=hashes.SHA256(),length=32,salt=salt,iterations=IT).derive(pw)
ct=AESGCM(key).encrypt(iv,raw,None); b=lambda x:base64.b64encode(x).decode()
json.dump({"v":1,"kdf":"PBKDF2-SHA256","iter":IT,"salt":b(salt),"iv":b(iv),"ct":b(ct)},open(out,"w"))
open(hf,"w").write(h); os.chmod(hf,0o600); print("encrypted",len(ct),"bytes")
if "--print" in sys.argv: print(json.dumps({"brief":brief,"sectors":[(s["key"],s["big"],s["unit"],s["status"]) for s in sectors]},ensure_ascii=False,indent=0))
