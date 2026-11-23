/* v19 — full feature restoration, zero bottom overlap, 6-tab dock + all-features launcher + new personal panels */
"use strict";

const HUBTABS19 = [
  ["home", "○", "오늘"],
  ["wealth", "◇", "돈"],
  ["life", "◎", "나"],
  ["world", "✺", "세계"],
  ["play", "✦", "재미"],
  ["jarvis", "◉", "비서"]
];

try {
  ALLTABS.push(["all", "⌘", "전체"], ["jarvis", "◉", "비서"]);
  LCATS.unshift(["all", "전체 기능", "⌘", "var(--c)", "all"]);
} catch (e) {}

try {
  Object.assign(TITLE, {
    all: "전체 기능",
    subs19: "구독 · 정기결제 관리",
    goals19: "저축 · 목표 트래커",
    packages19: "배송 추적",
    travel19: "여행 · 예약",
    dday19: "D-day · 공휴일",
    notes19: "빠른 메모 · 할 일",
    xprof: "X 프로필"
  });
} catch (e) {}

/* Override dock to 6 tabs (오늘/돈/나/세계/재미/비서) cleanly, preserving ST.tabs settings */
const _applyST19 = applyST;
applyST = function () {
  _applyST19.apply(this, arguments);
  TABS.splice(0, TABS.length, ...HUBTABS19);
  const tb = $("tabs");
  if (tb) tb.style.gridTemplateColumns = `repeat(${TABS.length}, minmax(0, 1fr))`;
};

/* Remove floating #jfab (assistant is now Tab #6 + header/hub links) and dock #fab into .sbox */
ensureFab = function () {
  const j = $("jfab");
  if (j) j.remove();
};
function placeFabInHeader() {
  const j = $("jfab");
  if (j) j.remove();
  const f = $("fab"), sb = document.querySelector(".sbox");
  if (f && sb && f.parentNode !== sb) sb.appendChild(f);
}

/* Measure actual fixed bottom bar heights so #cmd and body padding never overlap */
function syncBottomChrome() {
  const tb = $("tabs"), cm = $("cmd");
  const th = tb ? Math.ceil(tb.getBoundingClientRect().height) : 66;
  const ch = cm ? Math.ceil(cm.getBoundingClientRect().height) : 62;
  const root = document.documentElement;
  root.style.setProperty("--tabs-h", th + "px");
  root.style.setProperty("--cmd-h", ch + "px");
  root.style.setProperty("--chrome-b", (th + ch + 22) + "px");
}

/* Helpers */
function wxLive19() {
  const lv = (typeof LIVE !== "undefined" && LIVE.wx) ? LIVE.wx : null;
  const mkc = ((typeof MK === "function" ? MK() : D.market || {}).weather || {}).current || {};
  const w = (typeof wxNow === "function" ? wxNow() : null) || {};
  const t = lv && lv.temperature_2m != null ? lv.temperature_2m : (mkc.temperature_2m != null ? mkc.temperature_2m : w.tempF);
  const code = lv && lv.weather_code != null ? lv.weather_code : mkc.weather_code;
  const desc = (typeof WMO !== "undefined" && code != null ? WMO[code] : "") || w.desc || "";
  return { tempF: t, desc };
}
function nextDday19() {
  const n = ((D.time || {}).next || [])[0];
  if (n) return n;
  const hol = ((D.cal || {}).holidays || []).filter(h => h && h.date >= TODAY());
  if (!hol[0]) return null;
  const dd = Math.ceil((new Date(hol[0].date + "T12:00:00") - Date.now()) / 864e5);
  return { title: hol[0].title, date: hol[0].date, dday: dd };
}
function tile19(goTo, k, title, val, gold) {
  return `<button class="tile19${gold ? " gold" : ""}" data-go="${esc(goTo)}"><span class="tk19">${esc(k)}</span><b>${esc(title)}</b><em>${esc(val)}</em></button>`;
}

/* Fix V.mail so mail items from mailx (packages, travel, school, receipts, promoTop) also open */
const _vmail19 = V.mail;
V.mail = function (id) {
  const mx = typeof MX === "function" ? MX() : (D.mailx || {});
  const pool = [
    ...(M().recent || []), ...(M().important || []), ...(M().flagged || []),
    ...(mx.receipts || []), ...(mx.packages || []), ...(mx.travel || []),
    ...(mx.school || []), ...(mx.promoTop || [])
  ];
  const m = pool.find(x => x && x.id === id);
  if (!m) return _vmail19 ? _vmail19(id) : card(row(null, "메일을 찾을 수 없음"));
  if (typeof markSeen === "function") markSeen("mail", id);
  const hmTxt = typeof hm === "function" ? hm(m.date) : String(m.date || "").slice(0, 16);
  return H2("메일 상세") + card(`<dl class="kv"><dt>제목</dt><dd>${esc(m.subject)}</dd><dt>보낸 사람</dt><dd>${esc(m.from)}</dd><dt>시간</dt><dd>${esc(hmTxt)} CT</dd><dt>유형</dt><dd>${esc(m.type || "—")}</dd><dt>상태</dt><dd>${m.unread === true ? "안 읽음" : m.unread === false ? "읽음" : "샘플"}</dd>${m.snippet ? `<dt>미리보기</dt><dd>${esc(m.snippet)}</dd>` : ""}</dl>`) + `<a class="btnp" style="text-decoration:none" href="https://mail.google.com/mail/u/0/#inbox/${encodeURIComponent(m.id)}" target="_blank" rel="noopener">Gmail에서 열기 ↗</a>`;
};

/* Fix V.x collision: #x shows X profile, #x:spend / #x:flow etc. preserve spending charts */
const _vxChart19 = V.x;
V.xprof = function () {
  const x = D.x || {}, tw = (x.profile || {}).tweets;
  const ttxt = typeof tw === "number" ? `${tw}개 (수집)` : Array.isArray(tw) ? `${tw.length}개` : "—";
  const mns = x.mentions || [];
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">X PROFILE</p><h2 class="h18">X · ${esc(x.account || "계정")}</h2></div><button class="pill" data-go="life">나 →</button></div>
    <div class="kpi3">
      <div class="glass2" style="padding:14px"><span class="mut">팔로워</span><b class="num">${x.followers == null ? "—" : x.followers}</b></div>
      <div class="glass2" style="padding:14px"><span class="mut">게시물</span><b class="num">${esc(ttxt)}</b></div>
      <div class="glass2" style="padding:14px"><span class="mut">멘션</span><b class="num">${mns.length}건</b></div>
    </div>
    <section class="sec19 glass2"><h3>최근 멘션</h3>
      ${mns.length ? mns.map(m => `<a class="row nl" style="text-decoration:none;color:inherit" href="${esc(m.url || "#")}" target="_blank" rel="noopener"><div class="m"><b>${esc(m.text)}</b><span>${m.spam ? "스팸 추정" : "멘션"}</span></div></a>`).join("") : `<p class="mut">멘션 없음</p>`}
      ${x.note ? `<p class="mut" style="margin-top:8px">${esc(x.note)}</p>` : ""}
      ${(x.profile || {}).note ? `<p class="mut">${esc(x.profile.note)}</p>` : ""}
    </section>
  </div>`;
};
V.x = function (k) {
  if (k && String(k).trim()) return _vxChart19.apply(this, arguments);
  return V.xprof();
};

/* Fix V.orders so real packages & travel show up instead of hardcoded empty text */
V.orders = function () {
  const x = typeof MX === "function" ? MX() : (D.mailx || {});
  const rec = x.receipts || [], pkg = x.packages || [], trv = x.travel || [], prm = x.promoTop || [];
  const hmTxt = d => typeof hm === "function" ? hm(d) : String(d || "").slice(0, 10);
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">MAILX</p><h2 class="h18">영수증 · 배송 · 여행</h2></div><button class="pill" data-go="life">나 →</button></div>
    <section class="sec19 glass2"><h3>영수증 · 주문 <small class="mut">${rec.length}건</small></h3>
      ${rec.map(m => row("mail:" + m.id, m.subject, `${m.from} · ${hmTxt(m.date)}`)).join("") || row(null, "데이터 없음")}
    </section>
    <section class="sec19 glass2"><h3>배송 추적 (추정) <small class="mut">${pkg.length}건</small></h3>
      ${pkg.map(m => row("mail:" + m.id, m.subject, `${m.from} · ${hmTxt(m.date)}`)).join("") || row(null, "배송 메일 없음")}
      ${x.packagesNote ? `<p class="mut">${esc(x.packagesNote)}</p>` : ""}
    </section>
    <section class="sec19 glass2"><h3>여행 · 예약 (추정) <small class="mut">${trv.length}건</small></h3>
      ${trv.map(m => row("mail:" + m.id, m.subject, `${m.from} · ${hmTxt(m.date)}`)).join("") || row(null, "예약 없음")}
      ${x.travelNote ? `<p class="mut">${esc(x.travelNote)}</p>` : ""}
    </section>
    <section class="sec19 glass2"><h3>프로모션 (7일) <small class="mut">${x.promos7d ?? prm.length}건</small></h3>
      ${prm.map(m => row("mail:" + m.id, m.subject, `${m.from} · ${hmTxt(m.date)}`)).join("") || row(null, "없음")}
    </section>
  </div>`;
};

/* New dedicated panels: Package Tracker, Travel, Subscription Manager, Savings Goals, D-day, Quick Notes */
V.packages19 = function () {
  const x = typeof MX === "function" ? MX() : (D.mailx || {});
  const pkg = x.packages || [];
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">PACKAGES · 추정</p><h2 class="h18">배송 추적 ${pkg.length}</h2></div><button class="pill" data-go="orders">주문 전체</button></div>
    <section class="sec19 glass2">
      <p class="mut" style="margin-top:0">메일 제목 패턴에서 분류한 배송 관련 메일입니다 (추정). ${esc(x.packagesNote || "")}</p>
      ${pkg.length ? pkg.map(m => row("mail:" + m.id, m.subject, `${m.from} · ${(m.date || "").slice(0, 16)}`)).join("") : `<p class="mut">수집된 배송 메일이 없어요.</p>`}
    </section>
  </div>`;
};

V.travel19 = function () {
  const x = typeof MX === "function" ? MX() : (D.mailx || {});
  const trv = x.travel || [];
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">TRAVEL · 추정</p><h2 class="h18">여행 · 예약 ${trv.length}</h2></div><button class="pill" data-go="orders">주문 전체</button></div>
    <section class="sec19 glass2">
      <p class="mut" style="margin-top:0">메일 키워드에서 분류한 여행·항공·숙소 메일입니다 (추정). ${esc(x.travelNote || "")}</p>
      ${trv.length ? trv.map(m => row("mail:" + m.id, m.subject, `${m.from} · ${(m.date || "").slice(0, 16)}`)).join("") : `<p class="mut">수집된 여행 메일이 없어요.</p>`}
    </section>
  </div>`;
};

V.subs19 = function () {
  const f = F() || {}, rec = (f.recurring || []).slice().sort((a, b) => Math.abs(b.amount || 0) - Math.abs(a.amount || 0));
  const tot = rec.reduce((a, b) => a + Math.abs(b.amount || 0), 0);
  const chg = rec.filter(r => Math.abs(r.change || 0) >= 1 || Math.abs(r.changePct || 0) >= 5);
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">SUBSCRIPTIONS · 추정</p><h2 class="h18">구독 · 정기결제</h2></div><button class="pill" data-go="recur">달력 보기</button></div>
    <div class="kpi3">
      <button class="glass2" data-go="recur"><span>정기 항목</span><b class="num">${rec.length}건</b></button>
      <button class="glass2" data-go="bills14"><span>합계(주기)</span><b class="num">${money(tot)}</b></button>
      <button class="glass2" data-go="rich:subs"><span>금액 변동</span><b class="num">${chg.length}건</b></button>
    </div>
    <section class="sec19 glass2"><h3>전체 정기결제 목록</h3>
      ${rec.length ? rec.map(r => `<button class="row18b" data-go="mer:${esc(r.name)}"><span><b>${esc(r.name)}</b><br><em class="mut">${esc(r.kind || r.cat || "정기")} · 다음 ${esc(r.next || "—")}${r.change ? ` (${r.change > 0 ? "+" : ""}${money(r.change, 2)})` : ""}</em></span><b class="num">${money(Math.abs(r.amount || 0), 2)}</b></button>`).join("") : `<p class="mut">정기결제 없음</p>`}
      <p class="mut">거래 반복 패턴으로 추정했어요. 금융 조언이 아닙니다.</p>
    </section>
    <div class="mom"><button class="schip18 glass2" data-go="rich:subs">구독 최적화 도구</button><button class="schip18 glass2" data-go="bills14">14일 결제</button><button class="schip18 glass2" data-go="recur">정기결제 달력</button></div>
  </div>`;
};

V.goals19 = function () {
  const f = F() || {}, nw = typeof NWv === "function" ? NWv() : f.net, g = typeof G === "function" ? G() : { target: 1e6 };
  const em3 = (f.spend30 || 0) * 3;
  const sm = typeof sideMo === "function" ? sideMo() : { sum: 0 };
  const list = (typeof secReady === "function" && secReady()) ? (Array.isArray(SX("goals19").items) ? SX("goals19").items : []) : [];
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">GOALS</p><h2 class="h18">저축 · 목표 트래커</h2></div><button class="pill" data-go="future">궤적 →</button></div>
    <div class="rings">
      ${typeof ring18 === "function" ? ring18(nw != null ? nw / (g.target || 1e6) : null, "$1M 목표", money(nw) + " / " + money(g.target || 1e6), "rich:goal", true) : ""}
      ${typeof ring18 === "function" ? ring18(em3 > 0 && f.cash != null ? f.cash / em3 : null, "비상금 3개월", money(f.cash) + " / " + money(em3), "flow", false) : ""}
      ${typeof ring18 === "function" ? ring18(sm.sum / 500, "부업 월 목표", money(sm.sum) + " / $500 · 추정", "side", false) : ""}
    </div>
    <section class="sec19 glass2"><h3>내 추가 목표 <small class="mut">이 기기 암호화 저장</small></h3>
      <form class="noteform19" onsubmit="return false">
        <input id="g19n" placeholder="목표 이름 (예: 비상금)">
        <input id="g19v" type="number" placeholder="금액 $" style="max-width:100px">
        <button class="btnp" type="button" data-act="g19add">추가</button>
      </form>
      ${list.length ? list.map((x, i) => {
        const pct = x.target > 0 && f.cash != null ? Math.min(100, Math.round(100 * f.cash / x.target)) : 0;
        return `<div class="noteitem19"><div style="flex:1"><b>${esc(x.name)}</b> <span class="mut num">${money(x.target)} · 현재 현금 기준 ${pct}% (추정)</span></div><button class="ndel" data-act="g19del:${i}" aria-label="삭제">✕</button></div>`;
      }).join("") : `<p class="mut">아직 추가한 목표가 없어요.</p>`}
    </section>
  </div>`;
};
ACT.g19add = () => {
  if (!secReady()) return T("잠시 후 다시 시도");
  const n = ($("g19n").value || "").trim(), v = +($("g19v").value || 0);
  if (!n || !(v > 0)) return T("이름과 금액을 입력해 주세요");
  const g = SX("goals19"); const arr = Array.isArray(g.items) ? g.items : (g.items = []);
  arr.push({ name: n, target: v, at: TODAY() });
  saveSec(); render(); T("목표 저장됨");
};
ACT.g19del = i => {
  if (!secReady()) return; const arr = SX("goals19").items; if (!Array.isArray(arr)) return;
  arr.splice(+i, 1); saveSec(); render();
};

V.dday19 = function () {
  const hol = ((D.cal || {}).holidays || []).map(h => ({ title: h.title, date: h.date, sys: 1 }));
  const _darr = (typeof secReady === "function" && secReady() && Array.isArray(SX("ddays19").items)) ? SX("ddays19").items : [];
  const cus = _darr.map((x, i) => ({ title: x.title, date: x.date, idx: i }));
  const all = [...cus, ...hol].filter(x => x && x.date).sort((a, b) => a.date.localeCompare(b.date));
  const dd = d => Math.ceil((new Date(d + "T12:00:00") - Date.now()) / 864e5);
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">COUNTDOWN</p><h2 class="h18">D-day · 공휴일</h2></div><button class="pill" data-go="cal">14일 일정</button></div>
    <section class="sec19 glass2"><h3>내 D-day 추가 <small class="mut">암호화 저장</small></h3>
      <form class="noteform19" onsubmit="return false">
        <input id="d19t" placeholder="일정 이름">
        <input id="d19d" type="date" style="max-width:140px">
        <button class="btnp" type="button" data-act="d19add">추가</button>
      </form>
      ${all.map(x => {
        const n = dd(x.date), lbl = n === 0 ? "D-Day" : n > 0 ? "D-" + n : "D+" + Math.abs(n);
        return `<div class="noteitem19"><div style="flex:1"><b>${esc(x.title)}</b><div class="mut">${esc(x.date)} ${x.sys ? "· 공휴일" : "· 내 D-day"}</div></div><b class="num ${n >= 0 && n <= 14 ? "t-ok" : ""}">${esc(lbl)}</b>${x.sys ? "" : `<button class="ndel" data-act="d19del:${x.idx}" aria-label="삭제">✕</button>`}</div>`;
      }).join("") || `<p class="mut">일정 없음</p>`}
    </section>
  </div>`;
};
ACT.d19add = () => {
  if (!secReady()) return T("잠시 후 다시 시도");
  const t = ($("d19t").value || "").trim(), d = ($("d19d").value || "").trim();
  if (!t || !d) return T("이름과 날짜를 입력해 주세요");
  const dx = SX("ddays19"); const arr = Array.isArray(dx.items) ? dx.items : (dx.items = []);
  arr.push({ title: t, date: d });
  saveSec(); render(); T("D-day 저장됨");
};
ACT.d19del = i => {
  if (!secReady()) return; const arr = SX("ddays19").items; if (!Array.isArray(arr)) return;
  arr.splice(+i, 1); saveSec(); render();
};

V.notes19 = function () {
  const arr = (typeof secReady === "function" && secReady() && Array.isArray(SX("notes19").items)) ? SX("notes19").items : [];
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">NOTES · TODO</p><h2 class="h18">빠른 메모 · 할 일</h2></div><button class="pill" data-go="life">나 →</button></div>
    <section class="sec19 glass2">
      <p class="mut" style="margin-top:0">모든 메모는 이 기기에 AES-GCM으로 암호화되어 저장됩니다.</p>
      <form class="noteform19" onsubmit="return false">
        <input id="n19t" placeholder="할 일이나 짧은 메모 입력…">
        <button class="btnp" type="button" data-act="n19add">저장</button>
      </form>
      ${arr.length ? arr.map((x, i) => `<div class="noteitem19">
        <button class="ntog ${x.done ? "done" : ""}" data-act="n19tog:${i}">${x.done ? "☑ " : "☐ "}${esc(x.t)} <span class="mut">${esc(x.at || "")}</span></button>
        <button class="ndel" data-act="n19del:${i}" aria-label="삭제">✕</button>
      </div>`).join("") : `<p class="mut">아직 메모가 없어요. 오늘 꼭 할 일을 하나 적어 보세요.</p>`}
    </section>
  </div>`;
};
ACT.n19add = () => {
  if (!secReady()) return T("잠시 후 다시 시도");
  const t = ($("n19t").value || "").trim();
  if (!t) return T("내용을 입력해 주세요");
  const n = SX("notes19"); const arr = Array.isArray(n.items) ? n.items : (n.items = []);
  arr.unshift({ t, done: false, at: TODAY() });
  saveSec(); render(); T("메모 저장됨");
};
ACT.n19tog = i => {
  if (!secReady()) return; const arr = SX("notes19").items; if (!Array.isArray(arr) || !arr[+i]) return;
  arr[+i].done = !arr[+i].done; saveSec(); render();
};
ACT.n19del = i => {
  if (!secReady()) return; const arr = SX("notes19").items; if (!Array.isArray(arr)) return;
  arr.splice(+i, 1); saveSec(); render();
};

ACT.botpick = id => {
  if (typeof pick === "function") pick(id);
  const el = $("txt");
  if (el) { el.focus(); el.scrollIntoView({ block: "nearest" }); }
  T("하단 명령 입력창에 봇을 선택했어요");
};

/* All-features searchable catalog (#all) */
function catalog19() {
  const f = F() || {}, m = M() || {}, mx = typeof MX === "function" ? MX() : (D.mailx || {});
  const fun = typeof FUN === "function" ? FUN() : (D.fun || {});
  const w = wxLive19(), nd = nextDday19();
  const nCnt = (typeof secReady === "function" && secReady() && Array.isArray((SECS.notes19 || {}).items)) ? SECS.notes19.items.filter(x => !x.done).length : 0;
  return [
    { g: "오늘 · 요약", items: [
      ["home", "오늘 홈", money(typeof NWv === "function" ? NWv() : f.net)],
      ["brief15", "오늘의 브리핑 (Pulse)", "카드 요약"],
      ["brief", "헤드라인 브리핑", (D.headline || []).length + "줄"],
      ["score", "오늘의 준비도 점수", "추정"],
      ["needs", "지금 볼 것", "한눈에"],
      ["since", "방문 후 변화", "비교"],
      ["nudge", "우선순위 넛지", "행동 제안"],
      ["dash", "예전 전체 타일 대시보드", "위젯 편집"]
    ]},
    { g: "돈 · 투자 · 부자", items: [
      ["wealth", "돈 허브", money(f.net)],
      ["future", "미래 · 방향 궤적", "1/5/10년 추정"],
      ["money", "상세 지출 · 가맹점", money(f.spend30)],
      ["flow", "현금흐름", sg(f.cash30)],
      ["txall", "전체 거래", (f.tx || []).length + "건"],
      ["pending", "대기 결제", money(f.pendingTotal)],
      ["card", "카드 · 사용률", (f.cardUtil ?? "—") + "%"],
      ["bills", "청구 예정", (f.bills || []).length + "건"],
      ["bills14", "14일 안 결제", (f.bills14 || []).length + "건"],
      ["subs19", "구독 · 정기결제 매니저", (f.recurring || []).length + "건"],
      ["recur", "정기결제 캘린더", "추정"],
      ["forecast", "이번 달 현금흐름 전망", "추정"],
      ["patterns", "소비 · 앱 패턴", (((PAT() || {}).series) || []).length + "스냅"],
      ["nwchg", "순자산 변화", "추적"],
      ["nwtl", "순자산 90일 타임라인", "이정표"],
      ["goals19", "저축 · 목표 트래커", "$1M / 비상금"],
      ["rich", "부자되기 13도구 전체", "시뮬레이터"],
      ["rich:goal", "100만$ 목표 경로", "추정"],
      ["rich:cut", "지출 줄이기 what-if", "시뮬"],
      ["rich:fire", "FIRE 경제자유 계산", "추정"],
      ["rich:dca", "DCA 적립 시뮬레이터", "BTC·ETH·SPY"],
      ["rich:side", "부수입 트래커", "월 $300–500"],
      ["rich:debt", "카드·부채 상환", "추정"],
      ["rich:subs", "구독 최적화", "추정"],
      ["rich:port", "포트폴리오 · 페이퍼", "전략"],
      ["rich:watch", "관심 종목 편집", (ST.watch || []).length + "종"],
      ["rich:fx", "원·달러 송금 계획", "환율"],
      ["rich:opp", "부자 기회 아이디어", "아이디어"],
      ["rich:habits", "부자 습관 체크", "일일"],
      ["inv", "투자 · 코인 · 주식", "시장"],
      ["stk", "주식 · ETF", "15종목"],
      ["crypto", "코인 시세", "BTC·ETH·XRP"],
      ["watchm", "관심 종목 움직임", "등락순"],
      ["paper", "페이퍼 매매", "모의"],
      ["fx", "USD/KRW 환율", "실시간/스냅"],
      ["mopp", "돈 기회 허브", "체크리스트"],
      ["board", "기회 보드 (칸반)", "암호화"],
      ["x:spend", "일별·주별 지출 차트", "드릴다운"]
    ]},
    { g: "나 · 메일 · 일정 · 메모", items: [
      ["life", "나 (삶의 영역 6)", "허브"],
      ["me", "내 프로필 · 편집", "암호화"],
      ["notes19", "빠른 메모 · 할 일", nCnt + "건 남음"],
      ["dday19", "D-day · 공휴일 카운트다운", nd ? (nd.title + " D-" + nd.dday) : "일정"],
      ["unread", "안 읽은 메일", String(m.unreadEstimate || m.unread || "—")],
      ["important", "중요 메일", (m.important || []).length + "건"],
      ["flag", "확인 필요 메일", (m.flagged || []).length + "건"],
      ["reply", "회신 후보 (추정)", (Array.isArray(m.needsReply) ? m.needsReply.length : (m.needsReply || 0)) + "건"],
      ["mailall", "최근 7일 메일", (m.recent || []).length + "통"],
      ["mailx", "메일 유형별", "분류"],
      ["packages19", "배송 추적 (추정)", (mx.packages || []).length + "건"],
      ["travel19", "여행 · 예약 (추정)", (mx.travel || []).length + "건"],
      ["family", "가족 · 학교 메일", (mx.school || []).length + "건"],
      ["orders", "영수증 · 주문 · 프로모", (mx.receipts || []).length + "건"],
      ["week", "이번 주 일정", "7일"],
      ["cal", "14일 캘린더", ((D.cal || {}).holidays || []).length + "공휴일"],
      ["sched", "일정 · 메일 요약", "통합"],
      ["events", "주변 행사 브리핑", (D.events || []).length + "건"],
      ["drive", "Drive 최근 파일", (((D.docs || {}).files) || []).length + "개"],
      ["eng", "영어 학습 · 파일", "학습봇"],
      ["side", "부업 · 아르바이트봇", (D.side || {}).goal || "목표"],
      ["interests", "관심사 관리 · 유튜브 기록", "Takeout"],
      ["imap", "관심사 · 대화 주제 맵", (((D.profile || {}).topics) || []).length + "주제"],
      ["want", "나의 욕구 (음성 요약)", "추정"],
      ["const", "별자리 전체 연결", "관계도"],
      ["tl", "35일 타임라인", "일정·결제"]
    ]},
    { g: "봇 · 시스템 · 개발", items: [
      ["bots", "8개 봇 상태 · 상세", `${(D.health || {}).ok ?? 0}/${(D.health || {}).total ?? (D.bots || []).length}`],
      ["routines", "자동화 · 루틴 상태", (((D.routines || {}).items) || []).length + "개"],
      ["conn", "커넥터 연결 상태", "상태"],
      ["gh", "GitHub 저장소 · 커밋", (((D.dev || {}).repos) || []).length + "저장소"],
      ["xprof", "X 프로필 · 멘션", ((D.x || {}).followers ?? "—") + " 팔로워"],
      ["meet", "회의 (Granola)", "상태"],
      ["cats", "전체 카테고리 타일", "요약"],
      ["set", "테마 · 화면 설정", "커스텀"],
      ["set:gallery", "위젯 갤러리", "켜기/끄기"]
    ]},
    { g: "세계 · 재미 · AI", items: [
      ["world", "세계 정세 · 시계", "권역별"],
      ["globe", "3D 지구본", "지진·뉴스핀"],
      ["wx", "시더파크 날씨", w.tempF != null ? Math.round(w.tempF) + "°F" : "예보"],
      ["news", "뉴스 섹션 전체", "피드"],
      ["news:top", "주요 뉴스", "헤드라인"],
      ["news:local", "지역 뉴스", "오스틴·텍사스"],
      ["newall", "최근 새 소식", "업데이트"],
      ["near", "근처에서 볼 것", "행사·소식"],
      ["play", "재미 매거진", "허브"],
      ["videos", "관심 영상 벽", (fun.videos || []).length + "편"],
      ["yt", "오늘의 유튜브 10", "선별"],
      ["inews", "이색 뉴스", (fun.odd || []).length + "건"],
      ["odd", "이색 볼거리 (저장)", "필터"],
      ["space", "우주 · 과학", "피드"],
      ["itop", "관심사 뉴스", "피드"],
      ["fortune", "오늘의 운세 (재미)", "사주"],
      ["reco", "오늘의 추천", (((D.reco || {}).items) || []).length + "개"],
      ["jarvis", "JARVIS 대화 비서", "질문/음성"],
      ["ai", "AI 브리핑 · 액션", "3가지"],
      ["ai:ask", "AI 질문", "로컬"]
    ]}
  ];
}

V.all = function () {
  const q = (window._allq || "").trim().toLowerCase();
  const groups = catalog19();
  const rows = groups.map(grp => {
    const hits = grp.items.filter(([rt, lb, sub]) => !q || (rt + " " + lb + " " + sub).toLowerCase().includes(q));
    if (!hits.length) return "";
    return `<section class="sec19 glass2"><h3>${esc(grp.g)} <small class="mut">${hits.length}</small></h3>
      <div class="fgrid19">${hits.map(([rt, lb, sub]) => tile19(rt, rt, lb, sub || "")).join("")}</div>
    </section>`;
  }).filter(Boolean).join("");
  return `<div class="hub18 all19">
    <div class="row18"><div><p class="ey">ALL FEATURES</p><h2 class="h18">전체 기능</h2></div><button class="pill" data-go="dash">예전 타일</button></div>
    <input id="allq" class="allsearch19" value="${esc(window._allq || "")}" placeholder="기능 검색 — 예: 구독, 배송, 봇, 지구본, 100만$, 메모…">
    ${rows || `<p class="mut">검색 결과가 없어요.</p>`}
  </div>`;
};

document.addEventListener("input", e => {
  if (e.target && e.target.id === "allq") {
    window._allq = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const el = $("allq");
    if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (_) {} }
  }
});

/* Enhance Home: keep 3-second scan + add briefing preview, live weather/D-day/bots/notes strip, and All Features door */
const _home18_v19 = V.home;
V.home = function () {
  if (window._ed) return V.dash.apply(this, arguments);
  let h = _home18_v19.apply(this, arguments);
  const w = wxLive19(), nd = nextDday19(), b = D.health || {};
  const nCnt = (typeof secReady === "function" && secReady() && Array.isArray((SECS.notes19 || {}).items)) ? SECS.notes19.items.filter(x => !x.done).length : 0;
  const br = (typeof briefCards === "function" ? briefCards() : []).slice(0, 2);
  const strip = `
    <div class="qstrip19">
      <button class="qpill19" data-go="wx"><span>시더파크</span><b>${w.tempF != null ? Math.round(w.tempF) + "°F " + esc(w.desc) : "날씨 보기"}</b></button>
      <button class="qpill19" data-go="dday19"><span>다음 일정</span><b>${nd ? esc(nd.title) + " D-" + nd.dday : "D-day"}</b></button>
      <button class="qpill19" data-go="bots"><span>8개 봇</span><b>${b.ok != null ? `${b.ok}/${b.total} 정상` : "상태 보기"}</b></button>
      <button class="qpill19" data-go="notes19"><span>빠른 메모</span><b>${nCnt ? nCnt + "건 할 일" : "메모 쓰기"}</b></button>
    </div>
    ${br.length ? `<section class="sec19 glass2"><h3>오늘의 브리핑 <button class="pill" data-go="brief15">전체 ${br.length}+</button></h3>
      ${br.map(c => `<button class="row18b" data-go="${esc(c.go || "brief15")}"><span><b>${esc(c.t)}</b><br><em class="mut">${esc((c.why || "").slice(0, 56))}</em></span><span class="mut">→</span></button>`).join("")}
    </section>` : ""}
    <div class="qstrip19">
      <button class="qpill19" data-go="jarvis"><span>AI 비서</span><b>질문 · 음성 듣기 →</b></button>
      <button class="qpill19" data-go="all"><span>전체 기능</span><b>모든 화면 · 검색 →</b></button>
    </div>`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + strip + h.slice(idx) : h + strip;
};

/* Enhance 돈 (wealth): append comprehensive money/investing/rich feature grid */
const _wealth18_v19 = V.wealth;
V.wealth = function () {
  let h = _wealth18_v19.apply(this, arguments);
  const f = F() || {}, sr = typeof sRate === "function" ? sRate() : null;
  const recN = (f.recurring || []).length, txN = (f.tx || []).length;
  const grid = `<section class="sec19 glass2"><h3>돈 · 투자 · 부자 도구 <button class="pill" data-go="all">전체</button></h3>
    <div class="fgrid19">
      ${tile19("money", "지출 분석", "카테고리 · 가맹점", money(f.spend30))}
      ${tile19("txall", "거래 내역", "전체 거래 · 대기", txN + "건")}
      ${tile19("subs19", "구독 매니저", "정기결제 관리", recN + "건")}
      ${tile19("recur", "정기결제 달력", "이번 달 일정", "추정")}
      ${tile19("goals19", "저축 목표", "목표 트래커", sr == null ? "추적" : "저축률 " + Math.round(sr) + "%", true)}
      ${tile19("rich", "부자 13도구", "FIRE · DCA · 목표", "시뮬레이터", true)}
      ${tile19("rich:goal", "100만$ 경로", "목표 시뮬레이션", "추정", true)}
      ${tile19("rich:cut", "지출 줄이기", "what-if 절약", "10% 가정", true)}
      ${tile19("inv", "투자 · 시장", "코인 · 주식 · ETF", "실시간/스냅")}
      ${tile19("watchm", "관심 종목", "등락 순위", (ST.watch || []).length + "종")}
      ${tile19("fx", "원·달러 환율", "송금 계산", "USD/KRW")}
      ${tile19("mopp", "돈 기회 허브", "체크리스트 · 보드", "부업·절약", true)}
      ${tile19("board", "기회 보드", "칸반 메모", "암호화")}
      ${tile19("x:spend", "지출 차트", "일별 · 주별", "드릴다운")}
      ${tile19("patterns", "소비 패턴", "요일 히트맵", (((PAT() || {}).series) || []).length + "회")}
      ${tile19("needs", "지금 볼 것", "우선순위 타일", "한눈에")}
    </div>
  </section>`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + grid + h.slice(idx) : h + grid;
};

/* Enhance 나 (life): add Mail Triage, Packages/School/Travel, D-day/Notes, 8-Bot Command Center & Routine Status, and All Life Features */
const _life18_v19 = V.life;
V.life = function () {
  let h = _life18_v19.apply(this, arguments);
  const f = F() || {}, m = M() || {}, mx = typeof MX === "function" ? MX() : (D.mailx || {});
  const bots = D.bots || [], rtItems = (D.routines || {}).items || [], nd = nextDday19();
  const nCnt = (typeof secReady === "function" && secReady() && Array.isArray((SECS.notes19 || {}).items)) ? SECS.notes19.items.filter(x => !x.done).length : 0;
  const extra = `
    <section class="sec19 glass2"><h3>배송 · 학교 · 여행 · 주문 <button class="pill" data-go="orders">전체</button></h3>
      <div class="fgrid19">
        ${tile19("packages19", "배송 (추정)", "배송 추적", (mx.packages || []).length + "건")}
        ${tile19("family", "가족 · 학교", "학교·가족 메일", (mx.school || []).length + "건")}
        ${tile19("travel19", "여행 (추정)", "여행 · 예약", (mx.travel || []).length + "건")}
        ${tile19("orders", "영수증 · 프로모", "주문 정리", (mx.receipts || []).length + "건")}
        ${tile19("unread", "안 읽은 메일", "분류 버킷", String(m.unreadEstimate || m.unread || "—"))}
        ${tile19("important", "중요 메일", "우선 확인", (m.important || []).length + "건")}
        ${tile19("flag", "확인 필요", "가족 · 금융", (m.flagged || []).length + "건")}
        ${tile19("reply", "회신 후보", "메일 샘플", (typeof replyN === "function" ? replyN() : 0) + "건 · 추정")}
      </div>
    </section>
    <section class="sec19 glass2"><h3>일정 · D-day · 빠른 메모</h3>
      <div class="fgrid19">
        ${tile19("dday19", "D-day", "공휴일 · 내 일정", nd ? nd.title + " D-" + nd.dday : "보기")}
        ${tile19("notes19", "빠른 메모 · 할 일", "로컬 암호화", nCnt + "건 남음")}
        ${tile19("week", "이번 주 일정", "7일 캘린더", "결제·공휴일")}
        ${tile19("cal", "14일 캘린더", "일정 전체", ((D.cal || {}).holidays || []).length + "공휴일")}
        ${tile19("events", "주변 행사", "시더파크 80km", (D.events || []).length + "건")}
        ${tile19("sched", "일정 · 메일 통합", "요약", "확인")}
      </div>
    </section>
    <section class="sec19 glass2"><h3>8개 봇 명령 센터 · 루틴 <button class="pill" data-go="routines">루틴 ${rtItems.length}</button></h3>
      <div class="botgrid19">
        ${bots.map(b => `<div class="botc19">
          <button class="bm" data-go="bot:${esc(b.id)}"><b>${esc(b.name)}</b><span>${esc((typeof LB !== "undefined" && LB[b.status]) || b.status || "—")} · ${esc(b.summaryLive && b.summary ? b.summary : (b.description || ""))}</span></button>
          <button class="bcmd" data-act="botpick:${esc(b.id)}">명령</button>
        </div>`).join("")}
      </div>
      <p class="mut" style="margin:10px 0 0">${esc((D.routines || {}).note || "매일 07:00 / 18:00 CT 자동 수집 루틴 활성")}</p>
    </section>
    <section class="sec19 glass2"><h3>내 모든 도구 · 기록 <button class="pill" data-go="all">전체 기능</button></h3>
      <div class="fgrid19">
        ${tile19("want", "나의 욕구", "말로 요약", "추정", true)}
        ${tile19("score", "준비도 점수", "재정·일정·관심", "추정")}
        ${tile19("brief15", "오늘의 브리핑", "카드 요약", "출처 포함")}
        ${tile19("since", "방문 후 변화", "스냅샷 비교", "실제")}
        ${tile19("nudge", "넛지", "우선순위 제안", "3+")}
        ${tile19("eng", "영어 학습", "학습봇 · 파일", "보기")}
        ${tile19("side", "부업 트래커", (D.side || {}).goal || "월 $300–500", "L-1 주의")}
        ${tile19("gh", "GitHub", "저장소 · 커밋", (((D.dev || {}).repos) || []).length + "개")}
        ${tile19("xprof", "X 프로필", "팔로워 · 멘션", ((D.x || {}).followers ?? "—") + "명")}
        ${tile19("const", "별자리 연결", "전체 관계도", "그래프")}
        ${tile19("tl", "35일 타임라인", "흐름 한눈에", "일정·결제")}
        ${tile19("set", "설정 · 화면", "테마 · 글씨", "위젯")}
        ${tile19("dash", "예전 전체 타일", "전체 위젯", "편집")}
        ${tile19("all", "전체 기능", "70+ 메뉴 검색", "열기", true)}
      </div>
    </section>`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + extra + h.slice(idx) : h + extra;
};

/* Enhance 세계 (world): add direct feature grid */
const _world18_v19 = V.world;
V.world = function () {
  let h = _world18_v19.apply(this, arguments);
  const w = wxLive19();
  const grid = `<section class="sec19 glass2"><h3>세계 · 뉴스 · 날씨 도구 <button class="pill" data-go="all">전체</button></h3>
    <div class="fgrid19">
      ${tile19("globe", "3D 지구본", "오스틴·서울·지진", "열기")}
      ${tile19("wx", "시더파크 날씨", "7일 · 레이더", w.tempF != null ? Math.round(w.tempF) + "°F" : "보기")}
      ${tile19("news", "뉴스 섹션", "전체 피드", "카테고리")}
      ${tile19("news:top", "주요 뉴스", "글로벌", "최신")}
      ${tile19("news:local", "지역 뉴스", "오스틴 · 텍사스", "최신")}
      ${tile19("near", "근처에서 볼 것", "행사 · 소식", (D.events || []).length + "건")}
      ${tile19("watchm", "시장 움직임", "코인 · ETF", "등락")}
      ${tile19("space", "우주 · 과학", "피드", "탐색")}
    </div>
  </section>`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + grid + h.slice(idx) : h + grid;
};

/* Enhance 재미 (play): ensure full links to yt, odd, inews, videos, space, near, fortune, reco, globe */
const _play18_v19 = V.play;
V.play = function () {
  let h = _play18_v19.apply(this, arguments);
  const fun = typeof FUN === "function" ? FUN() : (D.fun || {});
  const grid = `<section class="sec19 glass2"><h3>재미 · 영상 · 탐색 <button class="pill" data-go="all">전체</button></h3>
    <div class="fgrid19">
      ${tile19("videos", "관심 영상 벽", "태그별 재생", (fun.videos || []).length + "편")}
      ${tile19("yt", "오늘의 유튜브 10", "선별 피드", "재생")}
      ${tile19("inews", "이색 뉴스", "시각 월", (fun.odd || []).length + "건")}
      ${tile19("odd", "이색 볼거리", "태그 · 저장", "필터")}
      ${tile19("space", "우주 · 과학", "탐색", "피드")}
      ${tile19("near", "근처 소식", "행사 · 지역", "보기")}
      ${tile19("fortune", "오늘의 운세", "사주 재미용", "보기")}
      ${tile19("reco", "오늘의 추천", "맞춤 추천", (((D.reco || {}).items) || []).length + "개")}
    </div>
  </section>`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + grid + h.slice(idx) : h + grid;
};

/* Enhance 비서 (jarvis): add quick links to AI brief, Ask, Want, Notes, All Features */
const _jarvis19 = V.jarvis;
V.jarvis = function () {
  const h = _jarvis19 ? _jarvis19.apply(this, arguments) : "";
  const extra = `<section class="sec19 glass2" style="margin-top:16px"><h3>비서 · AI 도구</h3>
    <div class="fgrid19">
      ${tile19("ai", "AI 브리핑", "핵심 액션 3", "로컬")}
      ${tile19("ai:ask", "AI 질문", "데이터 질의", "로컬")}
      ${tile19("want", "나의 욕구", "말로 요약", "음성")}
      ${tile19("brief15", "오늘의 브리핑", "Pulse 스타일", "카드")}
      ${tile19("notes19", "빠른 메모", "할 일 저장", "암호화")}
      ${tile19("all", "전체 기능", "70+ 메뉴", "검색", true)}
    </div>
  </section>`;
  return h + extra;
};


/* Fix V.stk (when called without :sym) and V.newall (empty feed fallback) */
const _vstk19 = V.stk;
V.stk = function (sym) {
  if (sym && String(sym).trim()) return _vstk19.apply(this, arguments);
  const st = Object.values((typeof MK === "function" ? MK() : D.market || {}).stocks || {});
  return `<div class="hub18"><div class="row18"><div><p class="ey">STOCKS · ETF</p><h2 class="h18">주식 · ETF ${st.length}</h2></div><button class="pill" data-go="inv">투자 전체</button></div><section class="sec19 glass2">${st.map(s => `<button class="row18b" data-go="stk:${esc(s.sym)}"><span><b>${esc(s.sym)}</b> <em class="mut">${esc(s.name || "")}</em></span><b class="num ${s.chg >= 0 ? "t-ok" : "t-lo"}">${s.cur === "KRW" ? "₩" + Number(s.price || 0).toLocaleString("en-US") : money(s.price, 2)} (${s.chg >= 0 ? "+" : ""}${Number(s.chg || 0).toFixed(2)}%)</b></button>`).join("") || `<p class="mut">종목 데이터 없음</p>`}</section></div>`;
};
const _vnewall19 = V.newall;
V.newall = function () {
  const nw = (D.feed || []).filter(x => typeof isNew === "function" && isNew(x));
  if (nw.length && _vnewall19) return _vnewall19.apply(this, arguments);
  const list = (D.feed || []).slice(0, 15);
  return H2("새 소식 전체", list.length + "건") + card(list.length && typeof feedRow === "function" ? list.map(feedRow).join("") : row(null, "새 소식 없음", "마지막 방문 이후 변경된 항목이 없어요"));
};

/* Enhance palItems with new v19 views */
const _pal19 = palItems;
palItems = function () {
  const it = _pal19();
  [
    ["all", "전체 기능 (검색 런처)"],
    ["subs19", "구독 · 정기결제 매니저"],
    ["goals19", "저축 · 목표 트래커"],
    ["packages19", "배송 추적 (메일)"],
    ["travel19", "여행 · 예약 (메일)"],
    ["dday19", "D-day · 공휴일 카운트다운"],
    ["notes19", "빠른 메모 · 할 일"],
    ["xprof", "X 프로필 · 멘션"]
  ].forEach(r => it.unshift({ l: r[1], s: r[0], go: r[0] }));
  return it;
};

/* Hook render & resize so #fab sits in .sbox and bottom bar heights stay synced */
const _render19 = render;
render = function () {
  const r = _render19.apply(this, arguments);
  try { placeFabInHeader(); syncBottomChrome(); } catch (e) {}
  return r;
};

try {
  applyST();
  placeFabInHeader();
  syncBottomChrome();
  window.addEventListener("resize", () => { try { syncBottomChrome(); } catch (e) {} });
} catch (e) {}
