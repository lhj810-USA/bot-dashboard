/* v21 — 지도 복구(타일 체인·리사이즈·미리보기), 즉시 업데이트 + 버전 배지, 프리미엄 홈/허브/차트/모션, AI 제안 · 대화형 비서 */
"use strict";
const APP_VER21 = "v21";
document.documentElement.classList.add("v21");
const RM21 = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
const AI21 = () => {
  const a = (D && D.aiInsights) || {};
  if (a._m21) return a;
  const ag = a.agent || {}, icm = { money: "flow", family: "kids", english: "eng", invest: "chart", future: "future", side: "side", fun: "spark" };
  if ((ag.picks || []).length) a.suggestions = ag.picks.map((p, i) => Object.assign({ id: "ag" + i, icon: icm[p.cat] || "spark", prio: 0, agent: 1 }, p)).concat(a.suggestions || []).slice(0, 12);
  if ((ag.briefing || []).length) a.briefing = Object.assign({}, a.briefing || {}, { lines: ag.briefing });
  try { Object.defineProperty(a, "_m21", { value: 1, enumerable: false }); } catch (e) {}
  return a;
};
try { Object.assign(TITLE, { ai21: "AI 제안 · 추천 · 재미" }); } catch (e) {}

/* ---------- 0. 아이콘 ---------- */
const IC21 = {
  card: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
  flow: '<path d="M4 16l5-5 4 3 7-7"/><path d="M15 7h5v5"/>',
  food: '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 11v10M17 3c-2 2-2 6 0 8v10"/>',
  spike: '<path d="M3 17l4-4 3 3 4-8 3 5 4-2"/>',
  bill: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  side: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10M9.5 9.5c0-1.2 1.1-2 2.5-2s2.5.8 2.5 2-1.1 1.8-2.5 2-2.5.8-2.5 2 1.1 2 2.5 2 2.5-.8 2.5-2"/>',
  kids: '<circle cx="8" cy="7" r="2.5"/><circle cx="16.5" cy="9" r="2"/><path d="M3.5 20c.5-4 2.5-6 4.5-6s4 2 4.5 6M13 20c.3-3 1.7-4.6 3.5-4.6S19.7 17 20 20"/>',
  school: '<path d="M3 9l9-5 9 5-9 5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>',
  eng: '<path d="M4 5h9v9H4zM13 10h7v9h-9v-5"/><path d="M6.5 11l2-5 2 5M7.3 9.3h2.4"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  bot: '<rect x="5" y="8" width="14" height="10" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01"/>',
  future: '<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/>',
  read: '<path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1z"/><path d="M12 6v14"/>',
  place: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  event: '<rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  photo: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>',
  fact: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  send: '<path d="M4 12l16-8-6 16-2-6z"/>',
  map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>',
  wealth: '<path d="M12 3l8 4v2H4V7zM5 10v7M9.5 10v7M14.5 10v7M19 10v7M3 20h18"/>',
  me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/>',
  world: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  play: '<path d="M12 3l2.2 6.3H21l-5.4 4 2 6.6L12 16l-5.6 3.9 2-6.6L3 9.3h6.8z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
};
function ic21(n, s) { return `<svg class="ic21" width="${s || 20}" height="${s || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC21[n] || IC21.spark}</svg>`; }
const CATLAB21 = { money: "돈", family: "가족·아이", english: "영어", invest: "투자", future: "미래", side: "부업" };

/* ---------- 1. 업데이트 흐름 + 버전 배지 ---------- */
(function swFlow21() {
  if (!("serviceWorker" in navigator)) return;
  const hadCtl = !!navigator.serviceWorker.controller;
  let reloading = false;
  const doReload = () => {
    if (reloading) return;
    const a = document.activeElement;
    if (a && /INPUT|TEXTAREA|SELECT/.test(a.tagName) && document.visibilityState === "visible") {
      a.addEventListener("blur", doReload, { once: true }); return;
    }
    reloading = true; try { T("새 버전 적용 중…"); } catch (e) {}
    setTimeout(() => location.reload(), 250);
  };
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadCtl) doReload(); });
  const check = () => navigator.serviceWorker.getRegistration().then(r => { if (r) { r.update().catch(() => {}); if (r.waiting) r.waiting.postMessage("skip"); } }).catch(() => {});
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { check(); invalidateMaps21(); } });
  window.addEventListener("focus", check);
  window.addEventListener("pageshow", e => { if (e.persisted) { check(); invalidateMaps21(); } });
  setTimeout(check, 4000);
  setInterval(check, 15 * 60 * 1000);
})();
function verBadge21() {
  const t = $("fresh");
  if (t && !$("ver21")) t.insertAdjacentHTML("afterend", `<button class="ver21" id="ver21" data-act="ver21" title="버전 · 업데이트 확인">${APP_VER21}</button>`);
  const lk = $("lock");
  if (lk && !$("lockver21")) lk.insertAdjacentHTML("beforeend", `<div class="lockver21" id="lockver21">JARVIS ${APP_VER21}</div>`);
}
ACT.ver21 = () => {
  const sw = navigator.serviceWorker;
  if (!sw) return T(`JARVIS ${APP_VER21}`);
  const ctl = sw.controller;
  sw.getRegistration().then(r => { if (r) r.update().catch(() => {}); });
  if (ctl) {
    const once = e => { if (e.data && e.data.type === "sw-ver") { T(`JARVIS ${APP_VER21} · 오프라인 캐시 ${e.data.ver} · 최신 버전 확인함`); sw.removeEventListener("message", once); } };
    sw.addEventListener("message", once); ctl.postMessage("ver");
    setTimeout(() => sw.removeEventListener("message", once), 3000);
  } else T(`JARVIS ${APP_VER21} · 업데이트 확인 중`);
};

/* ---------- 2. 지도: 타일 체인 · 리사이즈 · 미니맵 미리보기 ---------- */
const TILES21 = {
  dark: { name: "다크", url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", max: 16,
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", attr: "&copy; Esri &copy; OpenStreetMap" },
  osm: { name: "표준", url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png", max: 19, attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  street: { name: "거리", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", max: 18, attr: "&copy; Esri" },
  sat: { name: "위성", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", max: 18,
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", attr: "&copy; Esri, Maxar" }
};
const CHAIN21 = ["dark", "osm", "street"];
function tilePref21() { try { return localStorage.jv_tile21 && TILES21[localStorage.jv_tile21] ? localStorage.jv_tile21 : "dark"; } catch (e) { return "dark"; } }
function setTiles21(map, key, el) {
  const p = TILES21[key] || TILES21.dark;
  (map._t21 || []).forEach(l => { try { map.removeLayer(l); } catch (e) {} });
  map._t21 = []; map._t21key = key; map._t21ok = 0; map._t21err = 0;
  const base = L.tileLayer(p.url, { maxZoom: p.max, maxNativeZoom: p.max, attribution: p.attr, crossOrigin: true, keepBuffer: 3 });
  base.on("tileload", () => { map._t21ok++; if (el) { el.classList.remove("skel21"); el.dataset.tiles = key; } });
  base.on("tileerror", () => {
    map._t21err++;
    if (map._t21err >= 4 && map._t21err > map._t21ok * 2) nextTiles21(map, el, "오류");
  });
  base.addTo(map); map._t21.push(base);
  if (p.labels) { const lb = L.tileLayer(p.labels, { maxZoom: p.max, maxNativeZoom: p.max, opacity: .9, crossOrigin: true }); lb.addTo(map); map._t21.push(lb); }
  clearTimeout(map._t21wd);
  map._t21wd = setTimeout(() => { if (!map._t21ok && document.visibilityState === "visible" && el && el.isConnected && el.clientHeight > 0) nextTiles21(map, el, "응답 없음"); }, 8000);
}
function nextTiles21(map, el, why) {
  const i = CHAIN21.indexOf(map._t21key);
  const nx = CHAIN21[(i + 1) % CHAIN21.length];
  if ((map._t21tries = (map._t21tries || 0) + 1) > CHAIN21.length) return;
  try { T(`지도 타일 ${why} → ${TILES21[nx].name} 지도로 자동 전환`); } catch (e) {}
  setTiles21(map, nx, el);
}
function invalidateMaps21() { Object.values(_maps20 || {}).forEach(m => { try { m.invalidateSize(); } catch (e) {} }); }
window.addEventListener("orientationchange", () => setTimeout(invalidateMaps21, 300));
window.addEventListener("resize", () => { clearTimeout(invalidateMaps21.t); invalidateMaps21.t = setTimeout(invalidateMaps21, 150); });

const PINCOL21 = { home: "#F5D48A", near: "#8AB4FF", world: "#C4B5FD", interest: "#F9A8D4", travel: "#6EE7B7", photo: "#FCA5A5" };
mountRealMap20 = function (elId, opts) {
  const el = $(elId);
  if (!el || typeof L === "undefined") return;
  const o = opts || {};
  if (!el.clientHeight || !el.clientWidth) {           // 숨김·0높이 컨테이너에서 초기화하지 않음 (iOS 첫 렌더/전환 중)
    const tries = (el._w21 = (el._w21 || 0) + 1);
    if (tries < 40) { setTimeout(() => mountRealMap20(elId, opts), 75); }
    return;
  }
  try { if (_maps20[elId]) { _maps20[elId].remove(); delete _maps20[elId]; } } catch (e) {}
  const mini = !!o.mini;
  const center = (_mapFocus20 && !mini) ? [_mapFocus20.lat, _mapFocus20.lon] : (o.center || [30.5052, -97.8203]);
  const zoom = (_mapFocus20 && !mini) ? (_mapFocus20.zoom || 11) : (o.zoom != null ? o.zoom : 4);
  if (!mini) _mapFocus20 = null;
  el.classList.add("skel21");
  const map = L.map(el, {
    center, zoom, zoomControl: false, attributionControl: true, worldCopyJump: true,
    scrollWheelZoom: !mini, dragging: !mini, touchZoom: !mini, doubleClickZoom: !mini, boxZoom: !mini, keyboard: !mini, tap: false,
    zoomSnap: .5, inertia: true
  });
  map.attributionControl.setPrefix(false);
  if (!mini) L.control.zoom({ position: "bottomright" }).addTo(map);
  _maps20[elId] = map;
  setTiles21(map, tilePref21(), el);
  const layerGroup = L.layerGroup().addTo(map);
  const activeFilter = o.filter || _mapLayer20 || "all";
  function drawPins() {
    layerGroup.clearLayers();
    const pins = collectMapPins20().filter(p => activeFilter === "all" || (Array.isArray(activeFilter) ? activeFilter.includes(p.layer) : p.layer === activeFilter));
    pins.forEach(p => {
      const col = PINCOL21[p.layer] || p.color || "#8AB4FF";
      if (p.circleKm) L.circle([p.lat, p.lon], { radius: p.circleKm * 1000, color: col, weight: 1, fillColor: col, fillOpacity: .07, interactive: !mini }).addTo(layerGroup);
      const mk = L.circleMarker([p.lat, p.lon], { radius: mini ? 4.5 : (p.radius || 6.5), color: "rgba(5,7,11,.9)", weight: 2, fillColor: col, fillOpacity: .95, interactive: !mini }).addTo(layerGroup);
      if (!mini) mk.bindPopup(pinPopupHtml20(p), { className: "pop21" });
    });
    const cntEl = $(elId + "_cnt"); if (cntEl) cntEl.textContent = pins.length + "개 핀";
  }
  drawPins();
  if (mini) {                                         // 미니맵 = 스크롤을 가로채지 않는 미리보기, 탭하면 해당 위치로 전체 지도
    el.classList.add("mini21");
    el.setAttribute("role", "button"); el.setAttribute("aria-label", "탭하면 전체 지도 열기");
    if (!el.querySelector(".open21")) el.insertAdjacentHTML("beforeend", `<span class="open21">${ic21("map", 14)} 탭하여 지도 열기</span>`);
    el.onclick = ev => { if (ev.target.closest("a")) return; _mapFocus20 = { lat: center[0], lon: center[1], zoom: Math.max(3, zoom + 1) }; go("globe"); };
  }
  try { if (window.ResizeObserver) { const ro = new ResizeObserver(() => { try { map.invalidateSize({ pan: false }); } catch (e) {} }); ro.observe(el); map.on("unload", () => ro.disconnect()); } } catch (e) {}
  [60, 250, 800].forEach(t => setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, t));
  Promise.all([loadLocalData20(), loadCloudPhotos20()]).then(() => { if (_maps20[elId] === map) drawPins(); }).catch(() => {});
};

renderMapView20 = function (defaultFilter, defaultCenter, defaultZoom) {
  const layerDefs = [["all", "전체"], ["home", "홈·서울"], ["near", "주변"], ["world", "세계·지진"], ["interest", "관심사"], ["travel", "여행"], ["photo", "사진 GPS"]];
  const f = _mapLayer20 || defaultFilter || "all", tp = tilePref21();
  setTimeout(() => mountRealMap20("map20_main", { center: defaultCenter || [30.5052, -97.8203], zoom: defaultZoom != null ? defaultZoom : 3 }), 30);
  return `<div class="hub18 map21">
    <div class="row18 maphd21"><div><p class="ey">LIVE MAP · ${esc(TILES21[tp].name)}</p><h2 class="h18">실제 지도</h2></div></div>
    <div class="map20-layers chips21">${layerDefs.map(([k, lbl]) => `<button class="mpill20${f === k ? " on" : ""}" data-act="maplayer:${k}"><i style="background:${k === "all" ? "#F2F4F8" : PINCOL21[k]}"></i>${lbl}</button>`).join("")}</div>
    <div id="map20_wrap" class="map20-wrap mapwrap21">
      <div id="map20_main" class="map20-box mapbox21" aria-label="실제 인터랙티브 지도"></div><span class="pill cnt21" id="map20_main_cnt">로딩…</span>
      <div class="map20-bar mapbar21">
        <button class="pill" data-act="mapfocus:cp">시더파크</button><button class="pill" data-act="mapfocus:kr">서울</button><button class="pill" data-act="mapfocus:wld">세계</button>
        <button class="pill" data-act="maplocate" aria-label="내 위치">◎</button><button class="pill" data-act="maptile21" aria-label="지도 종류">${esc(TILES21[tp].name)}</button><button class="pill" data-act="mapfs" aria-label="전체화면">⛶</button>
      </div>
    </div>
    <p class="mut note21">홈 핀은 Cedar Park TX 78613 권역만 표시해요. ‘내 위치’는 이 기기에서만 처리하고 저장·전송하지 않습니다. 타일이 안 뜨면 자동으로 다른 지도 서버로 바뀌어요.</p>
    <div class="qstrip19"><button class="qpill19" data-go="photos"><span>사진 지도</span><b>EXIF 위치 · 갤러리 →</b></button><button class="qpill19" data-go="world"><span>세계 정세</span><b>권역 헤드라인 →</b></button></div>
  </div>`;
};
ACT.maptile21 = () => {
  const order = ["dark", "sat", "osm", "street"], cur = tilePref21(), nx = order[(order.indexOf(cur) + 1) % order.length];
  try { localStorage.jv_tile21 = nx; } catch (e) {}
  const m = _maps20["map20_main"], el = $("map20_main");
  if (m) { m._t21tries = 0; setTiles21(m, nx, el); }
  const b = document.querySelector("[data-act='maptile21']"); if (b) b.textContent = TILES21[nx].name;
  T(TILES21[nx].name + " 지도");
};
const _mapfs20_v21 = ACT.mapfs;
ACT.mapfs = () => { _mapfs20_v21(); document.documentElement.classList.toggle("mapfs21", !!document.querySelector("#map20_wrap.fs")); [80, 300].forEach(t => setTimeout(invalidateMaps21, t)); };

/* ---------- 3. 차트 ---------- */
function smoothPath21(xy) {
  if (xy.length < 2) return "";
  let d = `M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
  for (let i = 0; i < xy.length - 1; i++) {
    const p0 = xy[i - 1] || xy[i], p1 = xy[i], p2 = xy[i + 1], p3 = xy[i + 2] || p2, t = .18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t], c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}
let _gid21 = 0;
function area21(pts, o) {
  o = o || {};
  const w = o.w || 360, h = o.h || 120, pad = o.pad == null ? 6 : o.pad;
  if (!pts || pts.length < 2) return `<div class="chart21 empty21"><span class="mut">추세를 그릴 데이터가 아직 부족해요</span></div>`;
  const vs = pts.map(p => +p.v), mn = Math.min(...vs), mx = Math.max(...vs), sp = (mx - mn) || 1;
  const xy = pts.map((p, i) => [pad + i * (w - pad * 2) / (pts.length - 1), pad + (1 - (p.v - mn) / sp) * (h - pad * 2 - (o.axis ? 14 : 0))]);
  const ln = smoothPath21(xy), last = xy[xy.length - 1], id = "g21_" + (++_gid21);
  const base = h - (o.axis ? 14 : 0);
  const data = esc(JSON.stringify(pts.map(p => [String(p.t || "").slice(0, 10), +(+p.v).toFixed(2)])));
  return `<div class="chart21${o.scrub ? " scrub21" : ""}" data-pts="${data}" data-w="${w}" data-pad="${pad}" data-money="${o.money ? 1 : 0}">
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${esc(o.label || "추이 차트")}">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--a21)" stop-opacity=".34"/><stop offset="1" stop-color="var(--a21)" stop-opacity="0"/></linearGradient></defs>
      <path class="fill21" d="${ln}L${last[0].toFixed(1)},${base}L${xy[0][0].toFixed(1)},${base}Z" fill="url(#${id})"/>
      <path class="line21" d="${ln}" pathLength="1" fill="none" stroke="var(--a21)" stroke-width="${o.sw || 2}" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
      ${o.axis ? `<text x="${pad}" y="${h - 2}" class="ax21">${esc(String(pts[0].t || "").slice(5, 10))}</text><text x="${w - pad}" y="${h - 2}" class="ax21" text-anchor="end">${esc(String(pts[pts.length - 1].t || "").slice(5, 10))}</text>` : ""}
    </svg>
    <i class="dot21" style="left:${(last[0] / w * 100).toFixed(2)}%;top:${(last[1] / h * 100).toFixed(2)}%"></i>
    ${o.scrub ? `<i class="cur21" hidden></i><b class="tip21" hidden></b>` : ""}
  </div>`;
}
function ring21(pct, label, sub, go, tone) {
  const p = pct == null ? 0 : Math.max(0, Math.min(1, pct)), r = 26, c = 2 * Math.PI * r;
  const body = `<svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true"><circle cx="34" cy="34" r="${r}" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="7"/>
    <circle class="rp21" cx="34" cy="34" r="${r}" fill="none" stroke="${tone === "lo" ? "var(--lo21)" : "var(--a21)"}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * p).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 34 34)" style="--len:${c.toFixed(1)}"/></svg>
    <span class="rn21 num">${pct == null ? "—" : Math.round(p * 100) + "%"}</span><span class="rl21"><b>${esc(label)}</b><em>${esc(sub || "")}</em></span>`;
  return go ? `<button class="ring21" data-go="${esc(go)}">${body}</button>` : `<div class="ring21">${body}</div>`;
}
function heat21(daily) {
  const d = (daily || []).slice(-35);
  if (!d.length) return `<p class="mut">일별 지출 데이터가 없어요</p>`;
  const mx = Math.max(1, ...d.map(x => +x.spend || 0));
  const first = new Date(d[0].date + "T12:00:00"), lead = (first.getDay() + 6) % 7;
  const cells = Array(lead).fill(`<i class="hc21 nil"></i>`).concat(d.map(x => {
    const v = +x.spend || 0, lv = v <= 0 ? 0 : Math.min(4, 1 + Math.floor(3.999 * Math.sqrt(v / mx)));
    return `<button class="hc21 l${lv}" data-act="heat21:${esc(x.date)}|${v.toFixed(0)}" aria-label="${esc(x.date)} ${money(v)}"></button>`;
  }));
  return `<div class="heat21"><div class="hw21">${["월", "화", "수", "목", "금", "토", "일"].map(s => `<span>${s}</span>`).join("")}</div><div class="hg21">${cells.join("")}</div>
    <div class="hl21"><span>적음</span><i class="hc21 l1"></i><i class="hc21 l2"></i><i class="hc21 l3"></i><i class="hc21 l4"></i><span>많음</span></div></div>`;
}
ACT.heat21 = a => { const [d, v] = String(a || "").split("|"); T(`${d} 지출 ${money(+v || 0)}`); };

/* 차트 스크럽 (Apple Stocks 방식) */
function scrub21(ev) {
  const c = ev.target.closest && ev.target.closest(".scrub21"); if (!c) return;
  let pts; try { pts = JSON.parse(c.dataset.pts); } catch (e) { return; }
  const r = c.getBoundingClientRect(), x = Math.max(0, Math.min(1, ((ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left) / r.width));
  const i = Math.round(x * (pts.length - 1)), p = pts[i], cur = c.querySelector(".cur21"), tip = c.querySelector(".tip21");
  if (!p || !cur) return;
  cur.hidden = tip.hidden = false; cur.style.left = (i / (pts.length - 1) * 100) + "%";
  tip.textContent = `${p[0].slice(5)} · ${c.dataset.money === "1" ? money(p[1]) : p[1]}`;
  tip.style.left = Math.max(12, Math.min(88, i / (pts.length - 1) * 100)) + "%";
}
function unscrub21(ev) { document.querySelectorAll(".scrub21 .cur21,.scrub21 .tip21").forEach(e => e.hidden = true); }
document.addEventListener("pointermove", scrub21, { passive: true });
document.addEventListener("pointerdown", scrub21, { passive: true });
document.addEventListener("pointerup", () => setTimeout(unscrub21, 900), { passive: true });
document.addEventListener("pointerleave", unscrub21, { passive: true });

/* ---------- 4. 오로라 · 오브 · 모션 ---------- */
function ensureAurora21() {
  if (!$("aur21")) document.body.insertAdjacentHTML("afterbegin", `<div id="aur21" aria-hidden="true"><i></i><i></i><i></i></div>`);
}
function orb21(size, go) {
  const s = size || 56;
  const inner = `<span class="orb21" style="--s:${s}px" aria-hidden="true"><i></i><i></i><b></b></span>`;
  return go ? `<button class="orbbtn21" data-go="${esc(go)}" aria-label="AI 비서 열기">${inner}</button>` : inner;
}
function countUp21(root) {
  if (RM21()) return;
  (root || document).querySelectorAll("[data-cu21]").forEach(el => {
    if (el.dataset.cuDone) return; el.dataset.cuDone = "1";
    const t = +el.dataset.cu21; if (!isFinite(t)) return;
    const mon = el.dataset.money21 === "1", t0 = performance.now(), dur = 1100;
    const fmt = v => mon ? money(v) : Math.round(v).toLocaleString("en-US");
    const tick = now => { const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(2, -10 * p); el.textContent = fmt(t * (p >= 1 ? 1 : e)); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
}
let _ptick21 = 0, _hdc21 = false;
window.addEventListener("scroll", () => { const c = (window.scrollY || 0) > 56; if (c !== _hdc21) { _hdc21 = c; document.documentElement.classList.toggle("hdc21", c); } }, { passive: true });
window.addEventListener("scroll", () => {
  if (RM21() || _ptick21) return;
  _ptick21 = requestAnimationFrame(() => {
    _ptick21 = 0; const y = window.scrollY || 0, a = $("aur21");
    if (a) a.style.transform = `translate3d(0,${(-y * .12).toFixed(1)}px,0)`;
    document.querySelectorAll(".par21").forEach(el => el.style.transform = `translate3d(0,${(y * .1).toFixed(1)}px,0)`);
  });
}, { passive: true });

/* ---------- 5. 홈 ---------- */
function focus3_21() {
  const s = (AI21().suggestions || []).slice(), out = [], used = new Set();
  for (const x of s) { if (out.length >= 3) break; if (used.has(x.cat) && s.length > 4) continue; used.add(x.cat); out.push({ t: x.title, s: x.body, go: x.go || "ai21", ic: x.icon, est: x.est }); }
  if (out.length < 3) (typeof compass18 === "function" ? compass18() : []).forEach(c => { if (out.length < 3) out.push({ t: c.t, s: c.s, go: c.go, ic: "spark", est: c.est }); });
  while (out.length < 3) out.push({ t: "AI 제안 전체 보기", s: "돈·가족·영어·투자·재미", go: "ai21", ic: "spark" });
  return out;
}
function topAi21(skip) {
  const s = AI21().suggestions || [];
  return s.find(x => !skip.includes(x.title) && /family|future|english|side/.test(x.cat)) || s.find(x => !skip.includes(x.title)) || null;
}
function srcChips21(src) { return (src || []).length ? `<span class="src21">근거 · ${(src || []).slice(0, 3).map(s => esc(s)).join(" · ")}</span>` : ""; }
function photoThumb21(pid) {
  const p = (_cloudPhotos20 || []).find(x => x.id === pid);
  return p && p.thumb ? `<img src="${p.thumb}" alt="" loading="lazy">` : "";
}
function funCards21() {
  const ai = AI21(), cards = [];
  (ai.fun || []).forEach(x => cards.push({ k: x.type === "photo" ? "추억" : "오늘의 재미", ic: x.type === "photo" ? "photo" : "fact", t: x.title, s: x.body, go: x.go, url: x.url, pid: x.photoId, est: x.est }));
  (ai.recos || []).filter(r => r.type === "event").slice(0, 3).forEach(r => cards.push({ k: "이번 주 행사", ic: "event", t: r.title, s: r.sub, go: r.go || "events" }));
  return cards.slice(0, 9);
}
function funRow21() {
  const cs = funCards21();
  if (!cs.length) return "";
  return `<section class="sect21"><div class="sh21"><p class="ey">오늘의 재미 · 추억 · 행사</p><button class="lnk21" data-go="ai21">모두 ${ic21("arrow", 14)}</button></div>
    <div class="car21" role="list">${cs.map(c => `<button class="fc21${c.pid ? " ph21" : ""}" role="listitem" data-go="${esc(c.go || "ai21")}" ${c.pid ? `data-pid="${esc(c.pid)}"` : ""}>
      ${c.pid ? `<span class="fimg21">${photoThumb21(c.pid)}</span>` : ""}<span class="fk21">${ic21(c.ic, 14)} ${esc(c.k)}${c.est ? " · 추정" : ""}</span><b>${esc(c.t)}</b><em>${esc(String(c.s || "").slice(0, 70))}</em></button>`).join("")}</div></section>`;
}
function hydrateThumbs21() {
  if (!document.querySelector("[data-pid]")) return;
  const fill = () => document.querySelectorAll(".fc21[data-pid] .fimg21").forEach(s => { if (!s.firstChild) { const h = photoThumb21(s.parentNode.dataset.pid); if (h) s.innerHTML = h; } });
  fill(); if (typeof loadCloudPhotos20 === "function") loadCloudPhotos20().then(fill).catch(() => {});
}
function glance21() {
  const w = typeof wxLive19 === "function" ? wxLive19() : {}, nd = typeof nextDday19 === "function" ? nextDday19() : null, b = D.health || {};
  const it = [
    ["wx", w.tempF != null ? Math.round(w.tempF) + "°" : "—", w.desc || "날씨"],
    ["dday19", nd ? "D-" + nd.dday : "—", nd ? nd.title : "D-day"],
    ["bots", b.ok != null ? `${b.ok}/${b.total}` : "—", "봇 정상"],
    ["photos", String(((D.photosMeta || {}).count || 0) + (_localPhotos20 || []).length), "사진"]
  ];
  return `<div class="gl21">${it.map(x => `<button data-go="${x[0]}"><b class="num">${esc(x[1])}</b><span>${esc(String(x[2]).slice(0, 10))}</span></button>`).join("")}</div>`;
}
V.home = function () {
  if (window._ed) return V.dash.apply(this, arguments);
  try { if (typeof armSnap === "function") armSnap(); } catch (e) {}
  const f = F() || {}, nw = typeof NWv === "function" ? NWv() : f.net, d = typeof netDelta === "function" ? netDelta(30) : null;
  const hist = typeof netHist === "function" ? netHist() : [], ai = AI21(), fc = focus3_21(), heroAi = topAi21(fc.map(x => x.t)), top = topAi21(fc.map(x => x.t).concat(heroAi ? [heroAi.title] : []));
  const bills = (f.bills14 || []).slice().sort((a, b) => String(a.next || "").localeCompare(String(b.next || "")));
  const brief = (ai.briefing || {}).lines || [];
  setTimeout(() => mountRealMap20("map20_home", { mini: true, center: [30.5052, -97.8203], zoom: 8, filter: ["home", "near", "photo"] }), 60);
  setTimeout(hydrateThumbs21, 80);
  return `<div class="home18 home21">
    ${typeof staleOf === "function" && staleOf() && typeof staleBanner === "function" ? staleBanner() : ""}
    <section class="hero18 hero21">
      <div class="hrow21">${orb21(44, "jarvis")}<div class="hg21t"><p class="hello18 greet17">${esc(typeof hello18 === "function" ? hello18() : "안녕하세요, 혁진님")}</p>
        <button class="ail21" data-go="${esc((heroAi || {}).go || "ai21")}">${ic21("spark", 12)} ${esc((heroAi || {}).title || brief[0] || "오늘도 데이터를 살펴보고 있어요")}</button></div></div>
      <div class="nwrow21"><div><span class="k18">순자산</span>
        <b class="hero-n num" data-count="${nw == null ? "" : nw}" data-money="1">${nw == null ? "—" : money(nw)}</b>
        ${d ? `<span class="dl21 ${d.d >= 0 ? "up" : "dn"}">${d.d >= 0 ? "▲" : "▼"} ${esc(sg(d.d))} · ${d.days}일</span>` : `<span class="dl21 mut">추세 수집 중</span>`}<span class="disc18 dsc21">금융 조언 아님</span></div>
        <button class="spk21" data-go="wealth" aria-label="순자산 추이">${area21(hist.slice(-30), { w: 160, h: 64, pad: 4, money: 1, label: "순자산 30일" })}</button></div>
      <div class="kpi3 kpi21">
      <button data-go="flow"><span>30일 흐름</span><b class="num ${f.cash30 == null ? "" : f.cash30 >= 0 ? "t-ok" : "t-lo"}">${f.cash30 == null ? "—" : esc(sg(f.cash30))}</b></button>
      <button data-go="card"><span>카드 사용</span><b class="num ${f.cardUtil >= 50 ? "t-lo" : "t-ok"}">${f.cardUtil == null ? "—" : f.cardUtil + "%"}</b></button>
      <button data-go="bills14"><span>다음 결제</span><b class="num">${bills[0] ? esc(String(bills[0].next || "").slice(5)) : "—"}</b><em>${bills[0] ? esc(String(bills[0].name || "").slice(0, 14)) : ""}</em></button>
    </div>
    </section>
    <section class="focus18 glass2 focus21">
      <div class="sh21"><p class="ey">오늘의 3가지</p><span class="mut aib21">${ic21("spark", 12)} AI · ${esc(String(ai.generatedAt || "").slice(5, 16).replace("T", " ")) || "로컬"}</span></div>
      <ol>${fc.map((x, i) => `<li><button data-go="${esc(x.go)}"><i class="n">${i + 1}</i><span><b>${esc(x.t)}</b><em class="mut">${esc(String(x.s || "").slice(0, 64))}${x.est ? " · 추정" : ""}</em></span>${ic21("arrow", 16)}</button></li>`).join("")}</ol>
    </section>
    ${top ? `<button class="aitop21" data-go="${esc(top.go || "ai21")}">
      <span class="aik21">${ic21(top.icon, 16)} AI 제안 · ${esc(CATLAB21[top.cat] || top.cat)}${top.est ? " · 추정" : ""}</span>
      <b>${esc(top.title)}</b><em>${esc(top.body)}</em>${srcChips21(top.src)}
      <span class="aimore21" data-go="ai21">제안 ${(ai.suggestions || []).length}개 · 추천 ${(ai.recos || []).length}개 모두 보기 →</span></button>` : ""}
    ${funRow21()}
    <section class="sect21 mapcard21"><div class="sh21"><p class="ey">내 주변 · 사진 위치</p><button class="lnk21" data-go="globe">지도 ${ic21("arrow", 14)}</button></div>
      <div class="map20-wrap"><div id="map20_home" class="map20-mini home"></div></div></section>
    ${glance21()}
    <nav class="hubs5 hubs21" aria-label="허브">${[["wealth", "wealth", "돈", "잔액·지출"], ["life", "me", "나", "삶·패턴"], ["future", "future", "미래", "목표"], ["world", "world", "세계", "정세·지도"], ["play", "play", "재미", "영상·이색"]].map(h => `<button data-go="${h[0]}">${ic21(h[1], 22)}<b>${h[2]}</b><span>${h[3]}</span></button>`).join("")}</nav>
    <div class="qstrip19 foot21"><button class="qpill19" data-go="all"><span>전체 기능</span><b>모든 화면 · 검색 →</b></button><button class="qpill19" data-go="jarvis"><span>AI 비서</span><b>대화 · 음성 →</b></button></div>
  </div>`;
};

/* ---------- 6. 돈 허브 ---------- */
const _vwealth20_v21 = V.wealth;
V.wealth = function () {
  let h = _vwealth20_v21.apply(this, arguments);
  const f = F() || {}, nw = typeof NWv === "function" ? NWv() : f.net, d = typeof netDelta === "function" ? netDelta(30) : null, hist = typeof netHist === "function" ? netHist() : [];
  const lim = (f.cardBalance || 0) + (f.cardAvailable || 0), food = ((f.byCategory || []).find(c => c.cat === "식비") || {}).amount;
  const hero = `<section class="hero18 hero21 mhero21">
      <span class="k18">순자산</span>
      <b class="hero-n num" data-count="${nw == null ? "" : nw}" data-money="1">${nw == null ? "—" : money(nw)}</b>
      ${d ? `<span class="dl21 ${d.d >= 0 ? "up" : "dn"}">${d.d >= 0 ? "▲" : "▼"} ${esc(sg(d.d))} · ${d.days}일 관측</span>` : ""}
      <div class="mchart21">${area21(hist, { w: 360, h: 150, money: 1, scrub: 1, axis: 1, sw: 2.2, label: "순자산 추이" })}</div>
      <p class="disc18">차트를 손가락으로 문질러 날짜별 값을 보세요 · 금융 조언이 아닙니다</p>
    </section>`;
  h = h.replace(/<section class="hero18">[\s\S]*?<\/section>/, hero);
  const rings = `<section class="sect21 glass2 rings21"><div class="sh21"><p class="ey">한눈에</p></div><div class="rr21">
      ${ring21(f.cardUtil == null ? null : f.cardUtil / 100, "카드 사용률", lim ? `${money(f.cardBalance)} / ${money(lim)}` : "", "card", f.cardUtil >= 50 ? "lo" : "")}
      ${ring21(food && f.spend30 ? food / f.spend30 : null, "식비 비중", food ? money(food) + " · 30일" : "", "cat:식비")}
      ${ring21(f.income30 ? Math.max(0, Math.min(1, f.spend30 / f.income30)) : null, "수입 대비 지출", f.income30 ? `${money(f.spend30)} / ${money(f.income30)}` : "", "flow", f.spend30 > f.income30 ? "lo" : "")}
    </div></section>
    <section class="sect21 glass2"><div class="sh21"><p class="ey">30일 지출 히트맵</p><button class="lnk21" data-go="money">분석 ${ic21("arrow", 14)}</button></div>${heat21(f.daily)}</section>`;
  const i = h.indexOf('<section class="glass2" style="padding:20px">');
  return i >= 0 ? h.slice(0, i) + rings + h.slice(i) : h + rings;
};

/* ---------- 7. AI 제안 화면 ---------- */
let _aiCat21 = "all";
ACT.aicat21 = c => { _aiCat21 = c || "all"; render(); };
V.ai21 = function () {
  const ai = AI21(), sug = ai.suggestions || [], cats = ["all", ...new Set(sug.map(s => s.cat))];
  const list = sug.filter(s => _aiCat21 === "all" || s.cat === _aiCat21);
  const fu = ai.future || {}, sc = fu.scenarios || [], mxv = Math.max(1, ...sc.map(s => s.y10 || 0)), rw = fu.runway || {};
  const agent = ai.agent || {};
  setTimeout(hydrateThumbs21, 60);
  if (!sug.length) return `<div class="hub18 ai21"><div class="row18"><div><p class="ey">AI</p><h2 class="h18">AI 제안</h2></div></div><section class="glass2 sect21"><p class="mut">아직 AI 인사이트가 생성되지 않았어요. 하루 2번 루틴이 만들어 둡니다.</p></section></div>`;
  return `<div class="hub18 ai21">
    <section class="aihero21">${orb21(64)}<div><p class="ey">AI · ${esc(String(ai.generatedAt || "").slice(0, 16).replace("T", " "))} CT</p><h2 class="h18">${esc((ai.briefing || {}).title || "오늘의 브리핑")}</h2>
      <ul class="bl21">${((agent.briefing && agent.briefing.length ? agent.briefing : (ai.briefing || {}).lines) || []).map(l => `<li>${esc(l)}</li>`).join("")}</ul></div></section>
    <div class="chips21 aicats21">${cats.map(c => `<button class="mpill20${_aiCat21 === c ? " on" : ""}" data-act="aicat21:${esc(c)}">${esc(c === "all" ? "전체 " + sug.length : (CATLAB21[c] || c))}</button>`).join("")}</div>
    <div class="sugs21">${list.map(s => `<article class="sug21 c-${esc(s.cat)}">
      <span class="aik21">${ic21(s.icon, 16)} ${esc(CATLAB21[s.cat] || s.cat)}${s.est ? `<i class="est21">추정</i>` : ""}</span>
      <h3>${esc(s.title)}</h3><p>${esc(s.body)}</p>${s.why ? `<p class="why21">${esc(s.why)}</p>` : ""}${srcChips21(s.src)}
      <div class="sa21"><button class="btnp" data-go="${esc(s.go || "home")}">열기 ${ic21("arrow", 14)}</button><button class="pill" data-act="askai21:${esc(s.id)}">비서에게 묻기</button></div></article>`).join("")}</div>
    ${sc.length ? `<section class="sect21 glass2 fut21"><div class="sh21"><p class="ey">미래의 혁진님 · 추정</p><button class="lnk21" data-go="future">미래 ${ic21("arrow", 14)}</button></div>
      <div class="fbars21">${sc.map(s => `<div class="fb21"><span>${esc(s.name)}</span><i><i style="width:${Math.max(4, Math.round(100 * (s.y10 || 0) / mxv))}%"></i></i><b class="num">${money(s.y10)}</b><em>10년 · 100만$까지 ${s.toMillionYears || "—"}년</em></div>`).join("")}</div>
      ${rw.months ? `<p class="why21">최근 30일 흐름(${esc(sg(rw.pace))}/월)이 계속되면 현금은 약 ${rw.months}개월 분량${rw.monthsExTransfer ? ` · 송금 제외 시 약 ${rw.monthsExTransfer}개월` : ""} · 추정</p>` : ""}
      <p class="mut">${esc(fu.note || "추정 · 금융 조언 아님")}</p></section>` : ""}
    <section class="sect21"><div class="sh21"><p class="ey">추천 · 장소 · 행사 · 영상 · 읽을거리</p></div>
      <div class="recs21">${(ai.recos || []).map(r => r.url ? `<a class="rec21" href="${esc(r.url)}" target="_blank" rel="noopener">${ic21(r.type, 18)}<span><b>${esc(r.title)}</b><em>${esc(r.sub || "")}${r.est ? " · 추정" : ""}</em></span>↗</a>`
        : `<button class="rec21" data-go="${esc(r.go || "events")}">${ic21(r.type, 18)}<span><b>${esc(r.title)}</b><em>${esc(r.sub || "")}${r.est ? " · 추정" : ""}</em></span>${ic21("arrow", 14)}</button>`).join("")}</div></section>
    ${funRow21()}
    <p class="mut note21">${esc(ai.disclaimer || "")} · 생성: ${esc(ai.generator || "")}. 개인 데이터는 브라우저에서 외부 AI로 보내지 않아요.</p>
  </div>`;
};
ACT.askai21 = id => { const s = (AI21().suggestions || []).find(x => x.id === id); window._prefill21 = s ? `${s.title} — 자세히 알려줘` : ""; go("jarvis"); };

/* ---------- 8. 대화형 비서 ---------- */
function botFind21(name) { const n = String(name || "").toLowerCase().replace(/\s+/g, ""); return (D.bots || []).find(b => String(b.name || "").toLowerCase().replace(/\s+/g, "").includes(n)); }
function txSearch21(kw) {
  const k = kw.toLowerCase(), tx = ((F() || {}).tx || []).filter(t => t && t.amount < 0 && String(t.name || "").toLowerCase().includes(k));
  if (!tx.length) return null;
  const sum = tx.reduce((a, t) => a - t.amount, 0);
  return { n: tx.length, sum, from: tx[tx.length - 1].date, to: tx[0].date, name: tx[0].name };
}
function sugBy21(re) { return (AI21().suggestions || []).find(s => re.test(s.cat + " " + s.title)); }
function ask21(q) {
  const t = (q || "").trim(), ai = AI21(), S = ai.suggestions || [];
  const say = (a, src, sug) => ({ a, src: src || [], sug: sug || ai.chips && ai.chips.slice(0, 4) || [] });
  if (!t) return say("무엇이든 물어보세요. 돈·가족·주말·영어·사진·투자 모두 제 데이터 안에 있어요.");
  const m0 = t.match(/^[@/]\s*(\S+)\s+([\s\S]+)/);
  if (m0) {
    const b = botFind21(m0[1]);
    if (b) { send(b.id, m0[2]); return say(`${b.name}에게 전달할게요: “${m0[2]}” — 서버 대기열이 없으면 클립보드에 복사돼서 Grok Bot 앱에 붙여넣으면 돼요.`, ["bots"], ["봇 상태", "오늘 뭐부터 하면 돼?"]); }
    return say(`'${m0[1]}' 봇을 찾지 못했어요. 가능한 봇: ${(D.bots || []).map(x => x.name).slice(0, 8).join(", ")}`, ["bots"]);
  }
  if (/오늘.*(뭐|무엇|우선)|브리핑|요약해|할 일 알려/.test(t)) {
    const l = ((ai.agent || {}).briefing || (ai.briefing || {}).lines || []);
    return say(l.join(" · ") + (S.length ? ` 우선순위: ${S.slice(0, 3).map((s, i) => `${i + 1}) ${s.title}`).join(" ")}` : ""), ["aiInsights.briefing", "aiInsights.suggestions"]);
  }
  const intents = [
    [/주말|아이|애들|가족|나들이|행사|놀러/, /family/],
    [/식비|외식|줄일|절약|아끼|장보기/, /식비/],
    [/카드|사용률|신용/, /카드/],
    [/미래|10년|백만|100만|은퇴|자산.*(뒤|후)|얼마나 모/, /future/],
    [/영어|표현|english|회화/, /english/],
    [/부업|L-?1|비자|사이드|스톡/, /side/],
    [/투자|종목|ETF|SMH|자동매매|코인/, /invest/],
    [/결제|청구|빌|요금/, /결제/],
    [/학교|미술|ISD/, /학교/]
  ];
  for (const [qre, sre] of intents) if (qre.test(t)) {
    const s = sugBy21(sre);
    if (s) {
      let a = `${s.title}. ${s.body}${s.why ? " (" + s.why + ")" : ""}`;
      if (/family/.test(s.cat)) { const ev = (ai.recos || []).filter(r => r.type === "event").map(r => r.title); if (ev.length) a += ` 이번 주 후보: ${ev.join(", ")}.`; }
      if (/future/.test(s.cat)) { const sc = ((ai.future || {}).scenarios || []); if (sc.length) a += " 시나리오: " + sc.map(x => `${x.name} → 10년 ${money(x.y10)}`).join(" / ") + " · 추정."; }
      return say(a, s.src, ["오늘 뭐부터 하면 돼?", "AI 제안 전체", "10년 뒤 내 자산은?"]);
    }
  }
  if (/사진|1년 전|추억|앨범/.test(t)) {
    const ph = (ai.fun || []).filter(x => x.type === "photo");
    const pm = D.photosMeta || {};
    return say(`${ph.map(x => x.title + " (" + x.body + ")").join(" · ") || "추억 사진이 아직 없어요."} 전체 사진 ${(pm.count || 0) + (_localPhotos20 || []).length}장 · GPS ${pm.gpsCount || 0}장은 사진첩과 지도에 있어요.`, ["photosMeta.onThisDay", "photosMeta.items"], ["사진첩 열어줘", "오늘의 재미"]);
  }
  if (/추천|볼 만|영상|읽을|뭐 볼|유튜브/.test(t)) {
    const v = (ai.recos || []).filter(r => r.type === "video"), rd = (ai.recos || []).filter(r => r.type === "read");
    if (v.length || rd.length) return say(`오늘 볼 영상: ${v.map(x => `“${x.title}”(${String(x.sub || "").split(" · ")[0]})`).join(", ")}.${rd.length ? " 읽을거리: " + rd.map(x => x.title).join(", ") + "." : ""}`, ["fun.videos", "fun.odd"], ["관심 영상", "오늘의 재미"]);
  }
  if (/재미|신기|사실|fun|웃긴/.test(t)) { const fx = (ai.fun || []).filter(x => x.type === "fact"); if (fx.length) return say(fx.map(x => `${x.title} — ${x.body}`).join(" · "), ["fun.odd", "market.fx"]); }
  const mm = t.match(/^(.{2,24}?)\s*(에서|에|으로|로)?\s*(얼마|몇|썼|지출|결제)/);
  if (mm && !/이번 달|외식|식비/.test(mm[1])) { const r = txSearch21(mm[1].trim()); if (r) return say(`최근 거래 중 ‘${r.name}’ 관련 지출 ${r.n}건, 합계 ${money(r.sum, 2)} (${r.from} ~ ${r.to}). 실제 BoA 거래 기준이에요.`, ["finance.tx"]); }
  const base = typeof ask17 === "function" ? ask17(t) : { a: "", sug: [] };
  const generic = /맞는 항목이 없어요|찾지 못했어요/.test(base.a || "");
  if (generic) {
    const kw = t.replace(/[?？.!]/g, "").split(/\s+/).filter(s => s.length > 1);
    const pool = [...S.map(s => ({ t: s.title + " " + s.body, src: "aiInsights.suggestions" })), ...(ai.recos || []).map(r => ({ t: r.title + " " + (r.sub || ""), src: "aiInsights.recos" })), ...(ai.fun || []).map(r => ({ t: r.title + " " + (r.body || ""), src: "aiInsights.fun" })),
      ...(((D.mail || {}).recent) || []).map(m => ({ t: (m.subject || "") + " — " + (m.from || ""), src: "mail.recent" }))];
    const hit = pool.filter(x => kw.some(k => x.t.toLowerCase().includes(k.toLowerCase()))).slice(0, 3);
    if (hit.length) return say("찾은 것: " + hit.map(x => x.t.slice(0, 90)).join(" · "), [...new Set(hit.map(x => x.src))]);
  }
  return say(base.a, [], base.sug && base.sug.length ? base.sug : undefined);
}
function voiceOk21() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
let _rec21 = null;
ACT.askmic21 = () => {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!R) return T("이 브라우저는 음성 입력을 지원하지 않아요 (Safari 앱에서 시도해 보세요)");
  if (_rec21) { try { _rec21.stop(); } catch (e) {} _rec21 = null; return; }
  const r = new R(); r.lang = "ko-KR"; r.interimResults = true; r.maxAlternatives = 1; _rec21 = r;
  const btn = document.querySelector("[data-act='askmic21']"); if (btn) btn.classList.add("on");
  r.onresult = e => { const tx = Array.from(e.results).map(x => x[0].transcript).join(""); const i = $("askq"); if (i) i.value = tx; if (e.results[e.results.length - 1].isFinal) { _rec21 = null; ACT.askgo(); } };
  r.onerror = e => { _rec21 = null; if (btn) btn.classList.remove("on"); T("음성 입력 실패: " + (e.error || "권한 필요")); };
  r.onend = () => { _rec21 = null; const b = document.querySelector("[data-act='askmic21']"); if (b) b.classList.remove("on"); };
  try { r.start(); T("듣고 있어요… 말씀하세요"); } catch (e) { _rec21 = null; T("음성 입력을 시작하지 못했어요"); }
};
let _thread21 = [];
function threadMsgs21() {
  const log = typeof memAsk === "function" ? memAsk() : [];
  const fromLog = log.slice(0, 8).reverse().map(x => ({ q: x.q, a: x.a, t: x.t }));
  const seen = new Set(fromLog.map(x => x.q + "|" + x.a));
  return fromLog.concat(_thread21.filter(x => !seen.has(x.q + "|" + x.a))).slice(-10);
}
V.jarvis = function () {
  const ai = AI21(), g = typeof greet17 === "function" ? greet17() : { text: "안녕하세요, 혁진님" }, ntc = typeof noticed17 === "function" ? noticed17() : [];
  const msgs = threadMsgs21(), last = window._ask17, typing = window._typing21;
  const chips = (last && last.sug && last.sug.length ? last.sug : (ai.chips || ["오늘 뭐부터 하면 돼?", "이번 주말 아이들이랑 어디 가?", "식비 얼마나 줄일 수 있어?", "오늘 볼 영상"])).slice(0, 8);
  const pre = window._prefill21 || ""; window._prefill21 = "";
  const tools = `<section class="sec19 glass2 tools21"><h3>비서 · AI 도구</h3><div class="fgrid19">
      ${tile19("ai21", "AI 제안", "추천 · 재미 · 미래", (ai.suggestions || []).length + "개", true)}
      ${tile19("ai", "AI 브리핑", "핵심 액션 3", "로컬")}${tile19("ai:ask", "AI 질문", "데이터 질의", "로컬")}
      ${tile19("want", "나의 욕구", "말로 요약", "음성")}${tile19("brief15", "오늘의 브리핑", "Pulse 스타일", "카드")}
      ${tile19("notes19", "빠른 메모", "할 일 저장", "암호화")}${tile19("memory", "Grok 기억", "7개 봇 대화", ((D.grokMemory || {}).itemCount || 0) + "건")}
      ${tile19("all", "전체 기능", "70+ 메뉴", "검색", true)}</div></section>`;
  return `<div class="chat21">
    <section class="chhd21">${orb21(44)}<div><b>JARVIS</b><span class="mut">이 기기에서 내 데이터 + AI 인사이트로 답해요 · 외부 AI 전송 없음</span></div><button class="pill" data-act="gspeak" aria-label="인사 듣기">▶</button></section>
    <div class="thread21" id="thread21">
      <div class="msg21 jv"><div class="bub21">${esc(g.text)}</div></div>
      <div class="msg21 jv"><details class="bub21 ntc21"><summary>JARVIS가 눈치챈 것 ${ntc.length}개 · 추정 포함</summary><ul>${(ntc.length ? ntc : ["아직 특별한 변화는 없어요"]).slice(0, 4).map(s => `<li>${esc(s)}</li>`).join("")}</ul>
        ${(ai.suggestions || [])[0] ? `<button class="lnk21" data-go="ai21">AI 제안 ${(ai.suggestions || []).length}개 보기 ${ic21("arrow", 12)}</button>` : ""}</details></div>
      ${msgs.map((x, i) => `<div class="msg21 me"><div class="bub21">${esc(x.q)}</div></div><div class="msg21 jv"><div class="bub21${typing && i === msgs.length - 1 ? " typing21" : ""}" ${typing && i === msgs.length - 1 ? `data-full="${esc(x.a)}"` : ""}>${typing && i === msgs.length - 1 && !RM21() ? `<span class="dots21"><i></i><i></i><i></i></span>` : esc(x.a)}</div>
        ${x.src && x.src.length ? srcChips21(x.src) : ""}</div>`).join("")}
    </div>
    <div class="dock21"><div class="chips21 sug17">${chips.map(s => `<button class="pill" data-act="asksug:${esc(s)}">${esc(s)}</button>`).join("")}<button class="pill" data-act="asksug:@총괄 Bot 오늘 브리핑 정리해줘">@봇에게 맡기기</button></div>
    <form class="askbox ask21" onsubmit="return false">
      <button type="button" class="mic21${voiceOk21() ? "" : " off"}" data-act="askmic21" aria-label="음성으로 묻기">${ic21("mic", 18)}</button>
      <input id="askq" placeholder="무엇이든 물어보세요 · @봇이름 으로 일 맡기기" autocomplete="off" enterkeyhint="send" value="${esc(pre)}">
      <button class="btnp send21" data-act="askgo" aria-label="보내기">${ic21("send", 18)}<span>묻기</span></button>
    </form></div>
    ${tools}
  </div>`;
};
function ask21run(q) {
  const r = ask21(q);
  if (typeof pushAsk === "function") pushAsk(q, r.a);
  _thread21.push({ q, a: r.a, src: r.src });
  const lg = typeof memAsk === "function" ? memAsk() : [];
  if (lg[0] && lg[0].q === q) lg[0].src = r.src;
  window._ask17 = { q, a: r.a, sug: r.sug };
  window._typing21 = !RM21();
  render();
}
ACT.askgo = () => { const q = (($("askq") || {}).value || "").trim(); if (!q) return; ask21run(q); };
ACT.asksug = s => { if (/^@\S+\s+/.test(s) && !/^@총괄 Bot 오늘 브리핑/.test(s)) return ask21run(s); if (/^@총괄 Bot/.test(s)) { const i = $("askq"); if (i) { i.value = s; i.focus(); } return; } ask21run(s); };
document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target && e.target.id === "askq") { e.preventDefault(); ACT.askgo(); } });
function runTyper21() {
  const b = document.querySelector(".bub21.typing21[data-full]");
  const th = $("thread21");
  if (th) { const last = th.lastElementChild; if (last) last.scrollIntoView({ block: "nearest" }); }
  if (!b) return;
  window._typing21 = false;
  const full = b.dataset.full; b.removeAttribute("data-full");
  if (RM21()) { b.textContent = full; b.classList.remove("typing21"); return; }
  setTimeout(() => {
    let i = 0; const step = Math.max(1, Math.ceil(full.length / 60));
    const tick = () => { i = Math.min(full.length, i + step); b.textContent = full.slice(0, i); if (i < full.length) requestAnimationFrame(tick); else b.classList.remove("typing21"); };
    tick();
  }, 420);
}

/* ---------- 8b. iOS/WebKit 탭 보정: div·span 등 비대화형 요소는 탭해도 click이 안 생김 → role=button + tabindex 부여 ---------- */
function tapFix21(root) {
  (root || document).querySelectorAll("[data-go],[data-act],[data-hd]").forEach(el => {
    if (el.dataset.tf21) return; el.dataset.tf21 = "1";
    const tg = el.tagName;
    if (tg === "BUTTON" || tg === "A" || tg === "INPUT" || tg === "SELECT" || tg === "TEXTAREA" || tg === "OPTION" || tg === "LABEL") return;
    if (!el.hasAttribute("role")) el.setAttribute("role", "button");
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "0");
  });
}
document.addEventListener("keydown", e => {
  if ((e.key === "Enter" || e.key === " ") && e.target && e.target.getAttribute && e.target.getAttribute("role") === "button" && e.target.dataset && e.target.dataset.tf21) { e.preventDefault(); e.target.click(); }
});
try { new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches && n.matches("[data-go],[data-act],[data-hd]")) tapFix21(n.parentNode || document); else tapFix21(n); } }).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {}

/* ---------- 9. 렌더 후처리: 허브 전환 · 카운트업 · 배지 ---------- */
const ORDER21 = ["home", "wealth", "life", "world", "play", "jarvis"];
let _lastRt21 = null;
const _render20_v21 = render;
render = function () {
  const r = _render20_v21.apply(this, arguments);
  try {
    ensureAurora21(); verBadge21();
    const rt = cur().split(":")[0], v = $("v");
    if (v && rt !== _lastRt21) {
      const a = ORDER21.indexOf(_lastRt21), b = ORDER21.indexOf(rt);
      v.classList.remove("in21", "inl21", "inr21");
      if (!RM21() && _lastRt21 !== null) { void v.offsetWidth; v.classList.add(a >= 0 && b >= 0 ? (b > a ? "inr21" : "inl21") : "in21"); clearTimeout(render._t21); render._t21 = setTimeout(() => v.classList.remove("in21", "inl21", "inr21"), 900); }
      document.documentElement.dataset.rt21 = rt;
      _lastRt21 = rt;
      if (!document.querySelector("#map20_wrap.fs")) document.documentElement.classList.remove("mapfs21");
    }
    tapFix21(document); countUp21(v); runTyper21();
    const hd = document.querySelector("header");
    if (hd) document.documentElement.style.setProperty("--hdr21", Math.ceil(hd.getBoundingClientRect().height) + "px");
  } catch (e) {}
  return r;
};
document.addEventListener("animationend", e => { if (e.target && e.target.id === "v") e.target.classList.remove("in21", "inl21", "inr21"); });

/* ---------- 10. 런처 · 팔레트 ---------- */
if (typeof palItems === "function") { const _p21 = palItems; palItems = function () { const it = _p21(); it.unshift({ l: "AI 제안 · 추천 · 재미 · 미래", s: "ai21", go: "ai21" }); return it; }; }
if (typeof catalog19 === "function") {
  const _c21 = catalog19;
  catalog19 = function () {
    const cats = _c21(), ai = AI21();
    const j = cats.find(c => c && /비서|AI/.test(c.g || "")) || cats[0];
    if (j && Array.isArray(j.items) && !j.items.some(x => x[0] === "ai21")) j.items.unshift(["ai21", "AI 제안 · 추천 · 재미", ((ai.suggestions || []).length) + "개 제안 · " + ((ai.recos || []).length) + "개 추천"]);
    const l = cats.find(c => c && /나 ·/.test(c.g || ""));
    if (l && Array.isArray(l.items)) [["photos", "내 사진첩", ((D.photosMeta || {}).count || 0) + "장"], ["memory", "Grok 기억 · 대화", ((D.grokMemory || {}).itemCount || 0) + "건"], ["docs20", "문서 · 시트 · OneDrive", "Drive"], ["mailstats20", "메일 라벨 · 발신자", "통계"]].forEach(r => { if (!l.items.some(x => x[0] === r[0])) l.items.push(r); });
    return cats;
  };
}
try { ensureAurora21(); verBadge21(); } catch (e) {}
