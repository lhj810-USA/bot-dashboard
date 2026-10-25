#!/usr/bin/env python3
"""AI 브리핑 생성 (박스 로컬, 규칙·통계 엔진 — LLM 호출·외부 전송 없음).
입력: 비밀 폴더 collected.json, market.json, ai-config.json → 출력: 비밀 폴더 ai.json (build-payload가 암호화 페이로드에 포함).
개인 문자열은 이 파일에 없음 (설정은 비밀 폴더)."""
import json,os,statistics as st
from datetime import date,timedelta,datetime
S=os.environ.get("JV_SECRETS","/workspace/bot-dashboard-secrets")
def J(n,d=None):
    try: return json.load(open(os.path.join(S,n)))
    except Exception: return d
col=J("collected.json",{});mk=J("market.json",{});cfg=J("ai-config.json",{})
f=col.get("finance",{}) or {};tx=[t for t in f.get("tx",[]) if t.get("amount") is not None]
today=date.today();D=lambda s:date.fromisoformat(s[:10])
sp=[t for t in tx if t["amount"]<0 and not any(k in (t.get("cat") or "") for k in ("상환","이체","카드대금","Transfer"))]
def m_(v): return f"${abs(v):,.0f}"
an=[];risks=[];opp=[];acts=[]
# 1 category spike: last 30d vs monthly avg of prior 60d
c30={};cpr={}
for t in sp:
    a=(today-D(t["date"])).days;c=t.get("cat") or "기타"
    if a<30: c30[c]=c30.get(c,0)-t["amount"]
    elif a<90: cpr[c]=cpr.get(c,0)-t["amount"]
for c,v in sorted(c30.items(),key=lambda x:-x[1]):
    base=cpr.get(c,0)/2
    if base>0 and v>150 and v>1.4*base: an.append({"t":f"{c} 지출 급증","d":f"30일 {m_(v)} · 이전 월평균 {m_(base)} 대비 {v/base:.1f}배","go":"cat:"+c,"sev":2})
    elif base==0 and v>150 and cpr!={}: an.append({"t":f"새 지출 카테고리: {c}","d":f"30일 {m_(v)} (이전 60일 없음)","go":"cat:"+c,"sev":1})
# 2 unusual charges vs merchant median
bym={}
for t in sp: bym.setdefault(t["name"],[]).append(-t["amount"])
for t in sorted(sp,key=lambda x:x["date"],reverse=True):
    if (today-D(t["date"])).days>=14: continue
    v=-t["amount"];h=bym[t["name"]];med=st.median(h) if len(h)>1 else None
    if (med and v>3*med and v>60) or (v>=400 and not (med and v<=1.5*med)):
        an.append({"t":f"큰 결제: {t['name']}","d":f"{t['date'][5:]} {m_(v)}"+(f" · 평소 {m_(med)}" if med else " · 첫 결제"),"go":"mer:"+t["name"],"sev":2 if v>=400 else 1})
# 3 new recurring
for r in (f.get("recurring") or [])+(f.get("bills") or []):
    first=min([D(t["date"]) for t in sp if t["name"]==r["name"]] or [today])
    if (today-first).days<=45: an.append({"t":f"새 정기결제 추정: {r['name']}","d":f"{m_(r['amount'])} · 다음 {r.get('next','—')}","go":"recur","sev":1})
an=sorted(an,key=lambda x:-x["sev"])[:8]
# risks
u=f.get("cardUtil");cash=f.get("cash");s30=f.get("spend30");c30v=f.get("cash30")
if u is not None and u>=30: risks.append({"t":f"카드 사용률 {u}%","d":"30% 초과 시 신용점수 불리 · 결제일 전 일부 상환 권장","go":"rich:debt","sev":3 if u>=50 else 2})
if c30v is not None and c30v<0: risks.append({"t":f"30일 현금흐름 −{m_(c30v)}","d":f"입금 {m_(f.get('income30',0))} < 지출 {m_(s30 or 0)}","go":"x:flow","sev":2})
if cash and s30 and cash/s30<3: risks.append({"t":f"비상금 {cash/s30:.1f}개월","d":"권장 3–6개월","go":"rich:net","sev":2})
for sym,cn in (mk.get("coins") or {}).items():
    ch=(cn.get("tick") or {}).get("chg")
    if ch is not None and abs(ch)>=5: risks.append({"t":f"{sym} 24h {ch:+.1f}%","d":"큰 변동 — 분할 매수/매도 원칙 확인","go":"coin:"+sym,"sev":1})
# opportunities
rec=(f.get("recurring") or [])+(f.get("bills") or [])
if rec: opp.append({"t":f"정기결제 {len(rec)}건 점검","d":f"주기 합계 {m_(sum(abs(r['amount']) for r in rec))} · 안 쓰는 것 해지 → 적립","go":"rich:subs"})
if f.get("cardBalance"): opp.append({"t":"카드 잔액 전액 결제 유지","d":f"이월 시 연 24% 가정 이자 약 {m_(f['cardBalance']*0.24)}/년 회피","go":"rich:debt"})
if c30:
    c,v=max(c30.items(),key=lambda x:x[1]);opp.append({"t":f"{c} 10% 절감","d":f"월 {m_(v*0.1)} → 10년 7% 가정 약 {m_(sum(v*0.1*(1.07**(i/12)) for i in range(120)))}","go":"rich:cut"})
fx=(mk.get("fx") or {});ser=[p[1] for p in fx.get("series",[])];now=fx.get("now")
if ser and now:
    pct=round(100*sum(1 for v in ser if v<=float(now))/len(ser));opp.append({"t":f"원·달러 90일 백분위 {pct}%","d":"원화 송금 유리 구간" if pct>=70 else "원화 송금 불리 구간" if pct<=30 else "중간 구간","go":"rich:fx"})
# next 3 actions (priority ordered)
if u is not None and u>=30: acts.append({"t":f"카드에 {m_(max(0,f['cardBalance']-0.3*(f['cardBalance']+(f.get('cardAvailable') or 0))))} 미리 상환","d":"사용률 30% 아래로","go":"rich:debt"})
if c30: c,v=max(c30.items(),key=lambda x:x[1]);acts.append({"t":f"{c} 이번 주 예산 {m_(v/4*0.9)} 정하기","d":"최대 지출 카테고리 −10%","go":"cat:"+c})
if rec: acts.append({"t":"정기결제 1개 해지 검토","d":"구독 최적화에서 후보 표시","go":"rich:subs"})
acts.append({"t":"오늘 부자 습관 체크","d":"연속 기록 유지","go":"rich:habits"});acts=acts[:3]
summ=[]
if c30v is not None: summ.append(f"30일 현금흐름 {'+' if c30v>=0 else '−'}{m_(c30v)}")
if u is not None: summ.append(f"카드 사용률 {u}%")
summ.append(f"이상 {len(an)} · 위험 {len(risks)} · 기회 {len(opp)}")
out={"at":datetime.now().astimezone().isoformat(timespec="minutes"),"engine":"박스 규칙·통계 엔진 v1 (LLM 아님 · 외부 전송 없음)","summary":" · ".join(summ),
 "anomalies":an,"risks":sorted(risks,key=lambda x:-x["sev"]),"opportunities":opp,"actions":acts,
 "ideas":cfg.get("ideas",[]),"habits":cfg.get("habits",[]),"prompts":cfg.get("prompts",{}),"sideGoal":cfg.get("sideGoal",[300,500])}
p=os.path.join(S,"ai.json");json.dump(out,open(p,"w"),ensure_ascii=False);os.chmod(p,0o600)
print(f"ai.json: {len(an)} anomalies, {len(risks)} risks, {len(opp)} opps, {len(acts)} actions")
