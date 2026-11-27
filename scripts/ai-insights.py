#!/usr/bin/env python3
"""JARVIS v21 AI insights — 신뢰된 박스에서만 실행 (브라우저/제3자 AI로 개인 데이터 전송 없음).
입력(비밀 폴더): collected.json, patterns.json, grok-memory.json, photos-meta.json, fun.json, market.json, extra-info.json
출력: secrets/ai-insights.json (chmod 600) → build-payload.py 가 암호화 payload 의 aiInsights 로 포함.
모든 항목은 src(근거 필드)를 갖고, 추정치는 est=True + 문구에 '추정'.
하루 2회 Grok Bot 루틴(에이전트)이 이 스크립트 실행 후 docs/ai-insights-prompt.md 에 따라 문장을 다듬어 덮어쓸 수 있음(스키마 유지)."""
import json, os, re, html, datetime, zoneinfo, hashlib
S = "/workspace/bot-dashboard-secrets"; OUT = os.path.join(S, "ai-insights.json")
CT = zoneinfo.ZoneInfo("America/Chicago"); NOW = datetime.datetime.now(CT); TODAY = NOW.date()

def J(n, d=None):
    try: return json.load(open(os.path.join(S, n)))
    except Exception: return {} if d is None else d
def money(v, d=0):
    if v is None: return "—"
    return ("−" if v < 0 else "") + "$" + f"{abs(v):,.{d}f}"
def sg(v): return ("+" if v >= 0 else "−") + "$" + f"{abs(v):,.0f}"

col, pat, gm, pm, fun, mk, ex = J("collected.json"), J("patterns.json"), J("grok-memory.json"), J("photos-meta.json"), J("fun.json"), J("market.json"), J("extra-info.json")
f = col.get("finance") or {}
cats = {c["cat"]: c["amount"] for c in f.get("byCategory") or []}
sug, recos, funs, warn = [], [], [], []

def add(lst, **k):
    k.setdefault("est", False); k["id"] = k.get("id") or hashlib.sha1((k.get("cat","") + k["title"]).encode()).hexdigest()[:8]
    lst.append(k)

# ---------- money ----------
try:
    net, cash, card, util = f.get("net"), f.get("cash"), f.get("cardBalance"), f.get("cardUtil")
    sp, inc, c30 = f.get("spend30"), f.get("income30"), f.get("cash30")
    limit = (card or 0) + (f.get("cardAvailable") or 0)
    if util is not None and util >= 30 and limit:
        need = card - 0.3 * limit
        add(sug, cat="money", icon="card", prio=1, title=f"카드 사용률 {util}% → 30% 아래로 낮추려면 약 {money(need)} 상환",
            body=f"카드 잔액 {money(card)} / 한도 {money(limit)}. 현금 {money(cash)}이 있어 명세서 마감 전에 일부 미리 갚으면 사용률이 내려가요.",
            why="신용점수 계산에서 사용률 30% 이하가 일반적인 기준이에요. 금융 조언이 아닙니다.",
            src=["finance.cardBalance", "finance.cardAvailable", "finance.cash"], go="card")
    if c30 is not None:
        rem = cats.get("송금", 0)
        add(sug, cat="money", icon="flow", prio=1, title=f"30일 현금흐름 {sg(c30)} — 송금 {money(rem)}을 빼면 {sg(c30 + rem)}",
            body=f"수입 {money(inc)} · 지출 {money(sp)} ({f.get('range30','')}). 큰 송금이 흐름을 끌어내렸고, 일상 지출만 보면 차이가 줄어요.",
            why="송금은 생활비가 아닌 이동일 수 있어 분리해서 봤어요 · 추정", est=True,
            src=["finance.cash30", "finance.income30", "finance.spend30", "finance.byCategory[송금]"], go="flow")
    food = cats.get("식비")
    if food:
        cut = food * 0.2
        add(sug, cat="money", icon="food", prio=2, title=f"식비 {money(food)}/30일 — 20%만 줄여도 월 약 {money(cut)} 저축 추정",
            body="식비가 송금 다음으로 큰 지출 분류예요. 주 1회 집밥·장보기 목록을 정하면 효과가 커요.",
            why="최근 30일 카테고리 합계 기준 · 추정", est=True, src=["finance.byCategory[식비]"], go="cat:식비")
    weeks = f.get("weeks") or []
    if len(weeks) >= 4:
        top = max(weeks, key=lambda w: w.get("spend") or 0); avg = sum(w.get("spend") or 0 for w in weeks) / len(weeks)
        add(sug, cat="money", icon="spike", prio=3, title=f"지출이 가장 컸던 주: {top['range']} {money(top['spend'])} (평균 {money(avg)})",
            body="그 주의 큰 거래를 한 번 보면 반복될 지출인지 일회성인지 구분돼요.", why="12주 주별 지출 비교",
            src=["finance.weeks"], go="money")
    bills = sorted(f.get("bills14") or [], key=lambda b: b.get("next") or "")
    if bills:
        tot = sum(abs(b.get("amount") or 0) for b in bills)
        add(sug, cat="money", icon="bill", prio=2, title=f"2주 안 결제 {len(bills)}건 · {money(tot, 2)}",
            body=" · ".join(f"{b['name']} {b.get('next','')[5:]} {money(abs(b.get('amount') or 0), 2)}" for b in bills),
            why="거래 패턴으로 추정한 다음 결제일 · 추정", est=True, src=["finance.bills14"], go="bills14")
except Exception as e: warn.append("money:" + str(e)[:80])

# ---------- side income (L-1) ----------
try:
    side = col.get("sideIncome") or {}; con = side.get("contractor") or []
    inc_names = {i.get("name") for i in (f.get("income") or []) if (i.get("amount") or 0) > 3000}
    same = [c for c in con if c.get("name") in inc_names]
    body = f"목표 {side.get('goal','월 $300–500')}. 최근 부업 후보 입금 {len(con)}건."
    if same:
        body += f" 그중 {len(same)}건은 급여와 같은 입금처라 실제 부업 수입이 아니라 회사 지급일 가능성이 커요 · 추정."
    add(sug, cat="side", icon="side", prio=2, title="부업 수입 집계를 다시 확인해 보세요",
        body=body + " 스톡 이미지 부업은 한국 계정·합법 구조 우선이라는 기존 결정과 맞춰 진행하세요.",
        why="L-1 비자는 미국 내 별도 고용·자영 활동에 제약이 있을 수 있어요. 진행 전 이민 전문가 확인 권장 · 법률 조언 아님", est=True,
        src=["sideIncome.contractor", "finance.income", "grokMemory.goals[g2]", "grokMemory.openTodos[td3]"], go="side")
except Exception as e: warn.append("side:" + str(e)[:80])

# ---------- family / kids / weekend ----------
evtxt = " ".join(html.unescape(e.get("top") or "") + " " + (e.get("subject") or "") for e in (col.get("events") or []))
EV = [("조지타운 공룡 축제", r"공룡", "Georgetown · 29일까지 · 아침 9시부터", "kids"),
      ("볼런티 'Lights on the Lake'", r"Lights on the Lake", "집에서 가까운 빛 축제", "kids"),
      ("텍사스 스타즈 하키 @ HEB Center", r"스타즈|HEB Center", "Cedar Park · 저녁 경기", "family"),
      ("조지타운 'Lighting of the Square'", r"Lighting of the", "Georgetown 광장 점등", "family"),
      ("Lake Austin Lights 보트", r"Lake Austin Lights", "호수 빛 크루즈", "family"),
      ("롱센터 아이스링크", r"아이스링크", "Austin · 추수감사절 당일 휴무", "family"),
      ("에스테이트 세일 (금–일)", r"에스테이트 세일", "주소는 보통 목요일 9시 공개", "fun")]
found = [(n, s, k) for n, rx, s, k in EV if re.search(rx, evtxt)]
try:
    wx = (mk.get("weather") or {}).get("daily") or {}
    best = None
    for i, d in enumerate(wx.get("time") or []):
        dt = datetime.date.fromisoformat(d)
        if dt.weekday() in (5, 6):
            sc = (wx["temperature_2m_max"][i]) - (wx.get("precipitation_probability_max") or [0]*99)[i] / 2
            if not best or sc > best[1]: best = (d, sc, wx["temperature_2m_max"][i], (wx.get("precipitation_probability_max") or [0]*99)[i])
    kids = [x for x in found if x[2] == "kids"]
    if found:
        wtxt = f" 날씨는 {best[0][5:]} 최고 {round(best[2])}°F·강수 {best[3]}%로 주말 중 가장 좋아요." if best else ""
        add(sug, cat="family", icon="kids", prio=1, title=f"이번 주말 아이들과: {found[0][0]}" + (f" + {kids[1][0]}" if len(kids) > 1 else ""),
            body="추수감사절 방학 주간이에요. " + " · ".join(f"{n} ({s})" for n, s, _ in found[:3]) + "." + wtxt,
            why="Event 알림봇 이번 주 행사 메일 + Open-Meteo 주말 예보. 시간·티켓은 링크에서 재확인", src=["events[]", "market.weather.daily"], go="events")
        for n, s, k in found[:4]:
            add(recos, type="event", title=n, sub=s, src=["events[]"], go="events")
    sch = (col.get("mailx") or {}).get("school") or []
    art = [m for m in sch if re.search(r"Art|Portfolio", m.get("subject") or "", re.I)]
    if sch:
        add(sug, cat="family", icon="school", prio=2, title="학교 소식 " + str(len(sch)) + "건 — " + ("아이 미술 포트폴리오가 올라왔어요" if art else "11–12월 일정 확인"),
            body=" · ".join((m.get("from") or "") + ": " + (m.get("subject") or "") for m in sch[:3]),
            why="Gmail 가족·학교 분류 메일", src=["mailx.school"], go="family")
except Exception as e: warn.append("family:" + str(e)[:80])

# ---------- English ----------
EXPR = [("yield ramp", "수율 끌어올리기", "We're on track to complete the yield ramp by Q1."),
        ("root cause", "근본 원인", "Let's align on the root cause before we change the recipe."),
        ("bottleneck", "병목", "Litho is the bottleneck this week, not etch."),
        ("circle back", "나중에 다시 논의", "Let me circle back after I check the wafer map."),
        ("action item", "실행 과제", "I'll take that action item and update you by EOD."),
        ("heads-up", "미리 알림", "Quick heads-up: the tool will be down for PM tomorrow."),
        ("ballpark figure", "대략적인 수치", "Can you give me a ballpark figure for the cycle time?"),
        ("sign off on", "승인하다", "We need the customer to sign off on the spec change.")]
try:
    e = EXPR[TODAY.toordinal() % len(EXPR)]
    tabs = ((ex.get("drive") or {}).get("englishSheetTabs") or [])
    rows = next((re.search(r"\((\d+)행\)", t).group(1) for t in tabs if "오늘의 표현" in t and re.search(r"\((\d+)행\)", t)), None)
    add(sug, cat="english", icon="eng", prio=2, title=f"오늘의 반도체 영어: “{e[0]}” — {e[1]}",
        body=f"예문: {e[2]}" + (f" 영어 표현 노트 '오늘의 표현' 탭에 {rows}행이 쌓였어요 — 오늘 3개만 소리 내어 복습해 보세요." if rows else ""),
        why="영어공부 봇 목표(비즈니스·반도체 영어, 매일 2–3개) + Google Sheets 탭", src=["grokMemory.goals[g4]", "extra.drive.englishSheetTabs"], go="eng")
except Exception as e2: warn.append("eng:" + str(e2)[:80])

# ---------- investing ----------
try:
    st = mk.get("stocks") or {}
    mv = sorted(((k, v.get("chg") or 0) for k, v in st.items()), key=lambda x: -abs(x[1]))[:3]
    smh = st.get("SMH") or {}
    add(sug, cat="invest", icon="chart", prio=2, title="관심 종목 큰 움직임: " + ", ".join(f"{k} {c:+.2f}%" for k, c in mv),
        body=f"SMH {smh.get('price','—')} ({(smh.get('chg') or 0):+.2f}%). 연결된 투자 계좌는 없어서 보유 손익이 아니라 시세 관찰이에요.",
        why="공개 시세 수집값 · 금융 조언 아님 · L-1 신분에서는 수동적 투자 중심이 기존 원칙", src=["market.stocks", "extra.finance.holdingsNote", "grokMemory.goals[g1]"], go="inv")
    add(sug, cat="invest", icon="bot", prio=3, title="코인 자동매매: 실전 전 모의 러너 검증부터",
        body="열린 할 일 1순위가 '모의 러너 스케줄러 및 실전 안전 검증'이에요. 레버리지 상품은 Ben Felix의 레버리지 ETF 영상을 먼저 보고 판단해 보세요.",
        why="Grok 자동매매 대장 기억 + 관심 영상 · 금융 조언 아님", src=["grokMemory.openTodos[td1]", "fun.videos"], go="memory")
except Exception as e: warn.append("invest:" + str(e)[:80])

# ---------- recos: videos / reading / places ----------
try:
    pref = ["finance", "trading", "ai", "science", "english", "travel"]
    vids = sorted(fun.get("videos") or [], key=lambda v: (min((pref.index(t) for t in v.get("tags", []) if t in pref), default=9), -(len(v.get("pub") or ""))))
    seen = set()
    for v in vids:
        if v.get("ch") in seen: continue
        seen.add(v.get("ch"))
        add(recos, type="video", title=v.get("t"), sub=v.get("ch") + " · " + "/".join(v.get("tags", [])), url="https://www.youtube.com/watch?v=" + v.get("id", ""), src=["fun.videos"], go="videos")
        if len([r for r in recos if r["type"] == "video"]) >= 4: break
    for o in (fun.get("odd") or []):
        if o.get("src") in ("Wikipedia 오늘의 글", "Atlas Obscura") and len([r for r in recos if r["type"] == "read"]) < 3:
            add(recos, type="read", title=o.get("t"), sub=o.get("src"), url=o.get("url"), src=["fun.odd"], go="inews")
    add(recos, type="place", title="White Sands 다음 여행 후보: Big Bend · Carlsbad Caverns", sub="8월 White Sands 사진이 7장 — 비슷한 사막 풍경 · 차로 6–7시간 추정", est=True, src=["photosMeta.items[loc=White Sands]"], go="travel19")
except Exception as e: warn.append("reco:" + str(e)[:80])

# ---------- fun ----------
try:
    items = {i["id"]: i for i in pm.get("items") or []}
    for pid in (pm.get("onThisDay") or {}).get("sameMonthIds") or []:
        i = items.get(pid)
        if i:
            yrs = TODAY.year - int(i["date"][:4])
            add(funs, type="photo", title=f"{yrs}년 전 이맘때 · {i.get('loc') or '사진'}", body=f"{i['date']} {i.get('src','')} 사진", photoId=pid, src=["photosMeta.onThisDay"], go="photos")
    ws = [i for i in items.values() if (i.get("loc") or "").startswith("White Sands")]
    if ws:
        add(funs, type="photo", title=f"White Sands 여행 {len(ws)}장", body=ws[0]["date"] + " · 사진 지도에서 위치 보기", photoId=ws[0]["id"], src=["photosMeta.items"], go="photos")
    for o in fun.get("odd") or []:
        if o.get("src") == "Wikipedia 역사 속 오늘" and re.search(r"Mars|NASA|space|rocket|launch", o.get("t", ""), re.I):
            y = re.match(r"(\d{4})", o["t"])
            add(funs, type="fact", title=f"오늘은 큐리오시티 화성 탐사선 발사 {TODAY.year - int(y.group(1))}주년" if y and "Mars Science" in o["t"] else "역사 속 오늘 · 우주",
                body=o["t"], url=o.get("url"), src=["fun.odd[Wikipedia 역사 속 오늘]"], go="space"); break
    for o in fun.get("odd") or []:
        if o.get("src") == "Wikipedia 오늘의 사진" and "turkey" in o.get("t", "").lower():
            add(funs, type="fact", title="추수감사절 오늘의 사진: 야생 칠면조", body="야생 칠면조는 시속 40km 넘게 달리고 짧게 날 수도 있어요.", url=o.get("url"), src=["fun.odd[Wikipedia 오늘의 사진]"], go="inews"); break
    apod = next((o for o in fun.get("odd") or [] if o.get("src") == "NASA APOD"), None)
    if apod: add(funs, type="fact", title="NASA 오늘의 천체 사진", body=(apod.get("d") or "")[:110], url=apod.get("url"), src=["fun.odd[NASA APOD]"], go="space")
    fx = (mk.get("fx") or {}).get("now")
    if fx: add(funs, type="fact", title=f"오늘 환율 1달러 = {fx:,.0f}원", body=f"한국에 $1,000 보내면 약 {fx*1000/10000:,.0f}만 원 · 추정(수수료 제외)", est=True, src=["market.fx.now"], go="fx")
except Exception as e: warn.append("fun:" + str(e)[:80])

# ---------- future you ----------
future = {}
try:
    net = f.get("net") or 0; c30 = f.get("cash30") or 0; rem = cats.get("송금", 0)
    def fv(p, m, r, yrs):
        n = yrs * 12; i = r / 12; v = p
        for _ in range(n): v = v * (1 + i) + m
        return v
    sc = [("월 $500 적립 · 연 4% 가정", 500, 0.04), ("월 $1,000 적립 · 연 6% 가정", 1000, 0.06), ("월 $2,000 적립 · 연 7% 가정", 2000, 0.07)]
    cash = f.get("cash") or 0
    future = {"base": net, "src": ["finance.net", "finance.cash", "finance.cash30", "finance.byCategory[송금]", "grokMemory.goals[g1]"], "est": True,
              "note": "단순 복리 계산 · 추정 · 금융 조언 아님 · 목표 100만 달러",
              "runway": {"pace": round(c30), "paceExTransfer": round(c30 + rem),
                         "months": round(cash / -c30, 1) if c30 < 0 else None,
                         "monthsExTransfer": round(cash / -(c30 + rem), 1) if (c30 + rem) < 0 else None},
              "scenarios": [{"name": n, "monthly": m, "rate": r, "y1": round(fv(net, m, r, 1)), "y5": round(fv(net, m, r, 5)), "y10": round(fv(net, m, r, 10)),
                             "toMillionYears": next((y for y in range(1, 61) if fv(net, m, r, y) >= 1e6), None)} for n, m, r in sc]}
    s3 = future["scenarios"][1]; yrs = s3["toMillionYears"]; rw = future["runway"]
    add(sug, cat="future", icon="future", prio=2, title=f"미래의 혁진님: 월 $1,000·연 6%면 10년 뒤 약 {money(s3['y10'])} 추정",
        body=f"현재 순자산 {money(net)}에서 시작, 같은 조건으로 100만 달러까지 약 {yrs}년 · 추정. 다만 최근 30일 흐름({sg(c30)})이 계속되면 현금 {money(cash)}은 약 {rw['months']}개월 분량이에요"
             + (f"(송금 제외 시 약 {rw['monthsExTransfer']}개월)." if rw.get("monthsExTransfer") else "."),
        why="단순 복리 가정 · 30일 창에는 일회성 지출이 섞여 있을 수 있음 · 금융 조언 아님", est=True, src=future["src"], go="future")
except Exception as e: warn.append("future:" + str(e)[:80])

sug.sort(key=lambda x: x.get("prio", 9))
nw = f.get("net"); wxn = ((mk.get("weather") or {}).get("current") or {}).get("temperature_2m")
brief = {"title": f"{TODAY.month}월 {TODAY.day}일 브리핑", "lines": [x for x in [
    f"순자산 {money(nw)} · 카드 사용률 {f.get('cardUtil')}% · 30일 흐름 {sg(f.get('cash30') or 0)}" if nw is not None else None,
    f"오늘 시더파크 {round(wxn)}°F" + (" · 추수감사절 — 문 닫는 곳이 많아요" if TODAY.month == 11 and 22 <= TODAY.day <= 28 and TODAY.weekday() == 3 else "") if wxn is not None else None,
    (sug[0]["title"] if sug else None)] if x],
    "src": ["finance", "market.weather.current", "suggestions[0]"]}
chips = ["오늘 뭐부터 하면 돼?", "이번 주말 아이들이랑 어디 가?", "식비 얼마나 줄일 수 있어?", "카드 사용률 낮추려면?", "10년 뒤 내 자산은?", "오늘의 영어 표현", "1년 전 오늘 사진", "부업 L-1 괜찮아?"]
out = {"v": 1, "generatedAt": NOW.strftime("%Y-%m-%dT%H:%M%z"), "generator": "scripts/ai-insights.py (로컬 규칙) · 루틴 에이전트가 다듬을 수 있음",
       "disclaimer": "추정 포함 · 금융·법률 조언 아님 · 부업은 L-1 비자 제약 확인 필요",
       "briefing": brief, "suggestions": sug[:10], "recos": recos[:12], "fun": funs[:8], "future": future, "chips": chips, "warnings": warn}
prev = J("ai-insights.json")
if isinstance(prev, dict) and prev.get("agent") and prev.get("agent", {}).get("at", "")[:10] == TODAY.isoformat():
    out["agent"] = prev["agent"]   # 루틴 에이전트가 오늘 쓴 보강 문장 보존
tmp = OUT + ".tmp"; json.dump(out, open(tmp, "w"), ensure_ascii=False, indent=1); os.chmod(tmp, 0o600); os.replace(tmp, OUT)
print(f"ai-insights: {len(out['suggestions'])} suggestions, {len(out['recos'])} recos, {len(out['fun'])} fun, warnings={len(warn)}")
