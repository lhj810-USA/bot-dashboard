/* v20 — Real Leaflet maps, encrypted Photos gallery & EXIF import, Grok Bot memory & export import, extra sources */
"use strict";

try {
  Object.assign(TITLE, {
    globe: "실제 지도",
    map: "실제 지도",
    photos: "내 사진",
    memory: "Grok 기억 · 대화",
    docs20: "문서 · Drive · OneDrive",
    mailstats20: "메일 라벨 · 발신자"
  });
} catch (e) {}

/* ----- IndexedDB + AES-GCM encrypted local store for device photos & grok.com exports ----- */
const DB20_NAME = "jarvis_v20_db";
const DB20_VER = 1;
let _v20Key = null;
let _cloudPhotos20 = null;
let _cloudPhotosErr20 = "";
let _localPhotos20 = [];
let _grokExports20 = [];
let _localLoaded20 = false;
let _mapLayer20 = "all";
let _mapFocus20 = null;
let _photoMonth20 = "all";
let _photoFilter20 = "all";
let _photoModal20 = null;
let _memBotFilter20 = "all";
let _memTopicFilter20 = "";
const _maps20 = {};

function getPass20() {
  return sessionStorage.getItem("jv_pw") || localStorage.getItem("jv_pw") || "";
}
function b64ToU8_20(s) {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function u8ToB64_20(u) {
  let s = "";
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return btoa(s);
}
async function getDeviceAesKey20() {
  if (_v20Key) return _v20Key;
  const pw = getPass20();
  if (!pw || !crypto.subtle) return null;
  let saltB64 = localStorage.getItem("jv_v20_salt");
  if (!saltB64) {
    const s = crypto.getRandomValues(new Uint8Array(16));
    saltB64 = u8ToB64_20(s);
    localStorage.setItem("jv_v20_salt", saltB64);
  }
  const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  _v20Key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64ToU8_20(saltB64), iterations: 120000, hash: "SHA-256" },
    km,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return _v20Key;
}
function openDb20() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error("IndexedDB unavailable"));
    const req = indexedDB.open(DB20_NAME, DB20_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("photos_local")) db.createObjectStore("photos_local", { keyPath: "id" });
      if (!db.objectStoreNames.contains("grok_exports")) db.createObjectStore("grok_exports", { keyPath: "id" });
    };
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}
async function idbPutEnc20(storeName, id, payloadObj) {
  const key = await getDeviceAesKey20();
  if (!key) throw new Error("잠금 해제 상태에서만 암호화 저장이 가능합니다.");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const raw = new TextEncoder().encode(JSON.stringify(payloadObj));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, raw));
  const db = await openDb20();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put({ id, iv: u8ToB64_20(iv), ct: u8ToB64_20(ct), ts: Date.now() });
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}
async function idbDel20(storeName, id) {
  const db = await openDb20();
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => res(true);
    tx.onerror = () => rej(tx.error);
  });
}
async function idbGetAllDec20(storeName) {
  const key = await getDeviceAesKey20();
  if (!key) return [];
  const db = await openDb20();
  const rows = await new Promise((res, rej) => {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
  const out = [];
  for (const r of rows) {
    try {
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToU8_20(r.iv) }, key, b64ToU8_20(r.ct));
      out.push(JSON.parse(new TextDecoder().decode(pt)));
    } catch (_) {}
  }
  return out;
}

async function loadLocalData20(force) {
  if (_localLoaded20 && !force) return;
  try {
    _localPhotos20 = await idbGetAllDec20("photos_local");
    _grokExports20 = await idbGetAllDec20("grok_exports");
    _localLoaded20 = true;
  } catch (_) {}
}
async function loadCloudPhotos20() {
  if (_cloudPhotos20) return _cloudPhotos20;
  const pw = getPass20();
  if (!pw) return null;
  try {
    const resp = await fetch("photos.enc.json?t=" + Date.now(), { cache: "no-store" });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
    const P = await resp.json();
    const km = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64ToU8_20(P.salt), iterations: P.iter || 310000, hash: "SHA-256" },
      km,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64ToU8_20(P.iv) }, key, b64ToU8_20(P.ct));
    const parsed = JSON.parse(new TextDecoder().decode(pt));
    _cloudPhotos20 = parsed.photos || [];
    _cloudPhotosErr20 = "";
    return _cloudPhotos20;
  } catch (e) {
    _cloudPhotosErr20 = String(e.message || e);
    return null;
  }
}

try {
  const lb = $("lockBtn");
  if (lb) lb.addEventListener("click", () => {
    _cloudPhotos20 = null;
    _localPhotos20 = [];
    _grokExports20 = [];
    _localLoaded20 = false;
    _v20Key = null;
  });
} catch (_) {}

/* ----- Pure-JS EXIF parser + client-side 320px thumbnailer ----- */
function parseExif20(buf) {
  const out = { taken: null, lat: null, lon: null, camera: null };
  try {
    const v = new DataView(buf);
    if (v.byteLength < 12 || v.getUint16(0, false) !== 0xFFD8) return out;
    let off = 2;
    while (off + 4 < v.byteLength) {
      const mk = v.getUint16(off, false);
      off += 2;
      if (mk === 0xFFE1) {
        const len = v.getUint16(off, false);
        if (v.getUint32(off + 2, false) === 0x45786966 && v.getUint16(off + 6, false) === 0x0000) {
          const tiff = off + 8;
          const le = v.getUint16(tiff, false) === 0x4949;
          const u16 = p => v.getUint16(p, le);
          const u32 = p => v.getUint32(p, le);
          const strAt = (p, cnt) => {
            let s = "";
            for (let i = 0; i < cnt - 1 && p + i < v.byteLength; i++) {
              const ch = v.getUint8(p + i);
              if (!ch) break;
              s += String.fromCharCode(ch);
            }
            return s.trim();
          };
          const ratAt = p => {
            const num = u32(p), den = u32(p + 4);
            return den ? num / den : 0;
          };
          const readIfd = ifdOff => {
            const tags = {};
            if (!ifdOff || ifdOff + 2 >= v.byteLength) return tags;
            const n = u16(ifdOff);
            for (let i = 0; i < n; i++) {
              const e = ifdOff + 2 + i * 12;
              if (e + 12 > v.byteLength) break;
              const tag = u16(e), typ = u16(e + 2), cnt = u32(e + 4);
              const valOff = (typ === 2 && cnt <= 4) || (typ === 3 && cnt <= 2) || (typ === 4 && cnt <= 1) ? e + 8 : tiff + u32(e + 8);
              if (typ === 2) tags[tag] = strAt(valOff, cnt);
              else if (typ === 3) tags[tag] = u16(e + 8);
              else if (typ === 4) tags[tag] = u32(e + 8);
              else if (typ === 5) {
                const arr = [];
                for (let k = 0; k < cnt && k < 4; k++) arr.push(ratAt(valOff + k * 8));
                tags[tag] = arr;
              }
            }
            return tags;
          };
          const ifd0 = readIfd(tiff + u32(tiff + 4));
          const make = ifd0[0x010F] || "", model = ifd0[0x0110] || "";
          out.camera = [make, model && model.includes(make) ? "" : model].filter(Boolean).join(" ") || model || make || null;
          if (ifd0[0x8769]) {
            const ex = readIfd(tiff + ifd0[0x8769]);
            if (ex[0x9003]) out.taken = ex[0x9003];
          }
          if (!out.taken && ifd0[0x0132]) out.taken = ifd0[0x0132];
          if (ifd0[0x8825]) {
            const gps = readIfd(tiff + ifd0[0x8825]);
            if (Array.isArray(gps[2]) && gps[2].length >= 3 && Array.isArray(gps[4]) && gps[4].length >= 3) {
              let la = gps[2][0] + gps[2][1] / 60 + gps[2][2] / 3600;
              let lo = gps[4][0] + gps[4][1] / 60 + gps[4][2] / 3600;
              if (String(gps[1] || "N").toUpperCase() === "S") la = -la;
              if (String(gps[3] || "E").toUpperCase() === "W") lo = -lo;
              if (isFinite(la) && isFinite(lo) && (Math.abs(la) > 0.001 || Math.abs(lo) > 0.001)) {
                out.lat = Math.round(la * 1e5) / 1e5;
                out.lon = Math.round(lo * 1e5) / 1e5;
              }
            }
          }
        }
        break;
      }
      if (mk === 0xFFDA || mk === 0xFFD9) break;
      const segLen = v.getUint16(off, false);
      if (segLen < 2) break;
      off += segLen;
    }
  } catch (_) {}
  return out;
}

async function processLocalPhotoFile20(file) {
  const buf = await file.arrayBuffer();
  const ex = parseExif20(buf);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
    const maxDim = 320;
    const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
    const cw = Math.max(1, Math.round(img.width * scale));
    const ch = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    canvas.getContext("2d").drawImage(img, 0, 0, cw, ch);
    const thumb = canvas.toDataURL("image/jpeg", 0.72);
    let ts, date, ym, mmdd;
    const m = ex.taken && String(ex.taken).match(/(\d{4})[:\-](\d{2})[:\-](\d{2})[\sT](\d{2}):(\d{2}):(\d{2})/);
    if (m) {
      ts = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
      date = `${m[1]}-${m[2]}-${m[3]}`;
      ym = `${m[1]}-${m[2]}`;
      mmdd = `${m[2]}-${m[3]}`;
    } else {
      const d = new Date(file.lastModified || Date.now());
      const pad = n => String(n).padStart(2, "0");
      date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      ts = `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      ym = date.slice(0, 7);
      mmdd = date.slice(5, 10);
    }
    const id = "loc_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
    const item = {
      id,
      name: file.name,
      src: "내 기기 (암호화)",
      local: true,
      ts,
      date,
      ym,
      mmdd,
      lat: ex.lat,
      lon: ex.lon,
      loc: ex.lat != null ? `${ex.lat.toFixed(2)}, ${ex.lon.toFixed(2)}` : null,
      camera: ex.camera || "Device",
      w: img.width,
      h: img.height,
      thumb
    };
    await idbPutEnc20("photos_local", id, item);
    return item;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ----- Map Geocoding & Real Leaflet Engine ----- */
const GEO_KEYWORDS20 = [
  [/Cedar Park|Brushy Creek|Leander|78613/i, 30.5052, -97.8203, "Cedar Park"],
  [/Round Rock|Pflugerville/i, 30.5083, -97.6789, "Round Rock"],
  [/Austin|UT Austin|Zilker|Travis/i, 30.2672, -97.7431, "Austin, TX"],
  [/Taylor|Samsung Austin|SAS/i, 30.5708, -97.4095, "Taylor, TX"],
  [/Starbase|Boca Chica|Starship/i, 25.9972, -97.1561, "Starbase, TX"],
  [/Houston|NASA|Galveston/i, 29.7604, -95.3698, "Houston, TX"],
  [/Dallas|DFW|Fort Worth/i, 32.8998, -97.0403, "Dallas / DFW"],
  [/White Sands/i, 32.7801, -106.3257, "White Sands, NM"],
  [/Washington|White House|Pentagon|Fed|Trump/i, 38.9072, -77.0369, "Washington, D.C."],
  [/New York|Wall St|Nasdaq|NYSE/i, 40.7128, -74.0060, "New York"],
  [/California|Silicon Valley|Nvidia|Apple|Meta|Google/i, 37.3875, -122.0575, "Silicon Valley"],
  [/Seoul|서울|Korea|한국|삼성|KOSPI|환율|원화/i, 37.5665, 126.9780, "서울"],
  [/Tokyo|Japan|일본|도쿄|Nikkei/i, 35.6762, 139.6503, "Tokyo"],
  [/Taipei|Taiwan|TSMC|대만/i, 25.0330, 121.5654, "Taipei"],
  [/China|Beijing|Shanghai|중국|베이징/i, 39.9042, 116.4074, "Beijing"],
  [/Europe|EU|Brussels|유럽/i, 50.8503, 4.3517, "Brussels"],
  [/UK|Britain|London|영국|런던/i, 51.5074, -0.1278, "London"],
  [/Ukraine|Kyiv|우크라|Russia|Moscow/i, 50.4501, 30.5234, "Kyiv"],
  [/Israel|Gaza|Iran|Hormuz|Tehran|Middle East|이스라엘|이란|중동/i, 32.0853, 34.7818, "Middle East"],
  [/Singapore|싱가포르/i, 1.3521, 103.8198, "Singapore"]
];

function geocodeText20(txt) {
  const s = String(txt || "");
  for (const [re, lat, lon, city] of GEO_KEYWORDS20) {
    if (re.test(s)) return { lat, lon, city };
  }
  return null;
}

function collectMapPins20() {
  const pins = [];
  const W = typeof WLD === "function" ? WLD() : (D.world || {});

  // 1. Home base (Cedar Park 78613 approximate area only) & Seoul
  pins.push({
    id: "home_cp",
    layer: "home",
    color: "#ffd166",
    radius: 9,
    lat: 30.5052,
    lon: -97.8203,
    title: "홈 생활권 · Cedar Park TX 78613",
    sub: "대략적 생활권 중심 (상세 주소 비표시) · Austin/Williamson",
    circleKm: 5
  });
  pins.push({
    id: "home_kr",
    layer: "home",
    color: "#ffd166",
    radius: 7,
    lat: 37.5665,
    lon: 126.9780,
    title: "한국 · 서울",
    sub: "홈 타임존 · 한국 가족/계좌 기준점"
  });

  // 2. Nearby events & Austin/Cedar Park local news
  (D.events || []).forEach((ev, i) => {
    const g = geocodeText20((ev.subject || "") + " " + (ev.top || "")) || { lat: 30.48 + (i % 4) * 0.03, lon: -97.79 - (i % 3) * 0.03, city: "Cedar Park · Austin" };
    pins.push({
      id: "near_ev_" + i,
      layer: "near",
      color: "#22e3f5",
      radius: 7,
      lat: g.lat,
      lon: g.lon,
      title: ev.subject || "주변 행사",
      sub: `${g.city} · ${(ev.top || "").slice(0, 70)}`,
      go: "events"
    });
  });
  (W.nearbyNews || []).slice(0, 6).forEach((n, i) => {
    const g = geocodeText20(n.t) || { lat: 30.28 + (i % 3) * 0.04, lon: -97.74 + (i % 2) * 0.05, city: "Austin" };
    pins.push({
      id: "near_nw_" + i,
      layer: "near",
      color: "#38bdf8",
      radius: 6,
      lat: g.lat + (i * 0.008),
      lon: g.lon - (i * 0.008),
      title: n.t,
      sub: `지역 소식 · ${n.src || g.city}`,
      url: n.url
    });
  });

  // 3. World news, regions, quakes, markets
  (W.pins || []).forEach((p, i) => {
    if (p.lat == null || p.lon == null) return;
    if (Math.abs(+p.lat) < 0.001 && Math.abs(+p.lon) < 0.001) return;
    if (p.kind === "home") return;
    pins.push({
      id: p.id || "wp_" + i,
      layer: "world",
      color: p.kind === "quake" ? "#ff9f43" : p.kind === "mkt" ? (p.isOpen ? "#34d399" : "#ff6b81") : "#c4b5fd",
      radius: p.kind === "quake" ? Math.min(10, 4 + ((+p.mag || 4.5) - 4) * 2) : 6.5,
      lat: +p.lat,
      lon: +p.lon,
      title: p.label || p.city || "세계 핀",
      sub: p.kind === "mkt" ? `${p.isOpen ? "개장" : "폐장"} · 현지 ${p.local || ""}` : p.kind === "quake" ? `USGS 지진 M${p.mag}` : "권역 정세",
      url: p.url
    });
  });
  // Geocode additional world news & GDELT items
  const newsPool = [...(W.gdelt || []).slice(0, 12), ...((D.news && D.news.sections && D.news.sections.top) || []).slice(0, 10)];
  newsPool.forEach((it, i) => {
    const title = it.t || it.title;
    const g = geocodeText20(title + " " + (it.country || ""));
    if (!g) return;
    pins.push({
      id: "wnw_" + i,
      layer: "world",
      color: "#a78bfa",
      radius: 5.5,
      lat: g.lat + ((i % 5) - 2) * 0.25,
      lon: g.lon + ((i % 4) - 1.5) * 0.25,
      title: title,
      sub: `${g.city} · ${it.src || "뉴스"}`,
      url: it.url || it.link
    });
  });

  // 4. Interest pins
  [
    { id: "int_spx", lat: 25.9972, lon: -97.1561, title: "SpaceX Starbase", sub: "관심사 · 텍사스 우주 발사 감시", go: "space" },
    { id: "int_ksc", lat: 28.5729, lon: -80.6490, title: "Kennedy Space Center", sub: "관심사 · 우주 과학", go: "space" },
    { id: "int_nvda", lat: 37.3707, lon: -122.0375, title: "Silicon Valley · NVDA", sub: "관심사 · AI·반도체 (SMH)", go: "inv" },
    { id: "int_tsmc", lat: 24.7740, lon: 121.0100, title: "Hsinchu · TSMC", sub: "관심사 · 반도체 파운드리 (EWT)", go: "inv" },
    { id: "int_semi", lat: 37.0320, lon: 127.0580, title: "평택 반도체 캠퍼스", sub: "관심사 · 삼성전자 / 반도체", go: "stk:005930" }
  ].forEach(x => pins.push({ ...x, layer: "interest", color: "#f472b6", radius: 7 }));

  // 5. Travel destinations from D.mailx.travel
  const mx = typeof MX === "function" ? MX() : (D.mailx || {});
  (mx.travel || []).forEach((tr, i) => {
    const g = geocodeText20((tr.subject || "") + " " + (tr.snippet || ""));
    if (g) {
      pins.push({
        id: "trv_" + i,
        layer: "travel",
        color: "#38e08c",
        radius: 7.5,
        lat: g.lat + 0.04,
        lon: g.lon + 0.04,
        title: "여행 · 예약 (메일 추정)",
        sub: `${g.city} · ${tr.subject || ""}`,
        go: "travel19"
      });
    }
  });

  // 6. Photo EXIF GPS pins (merged cloud decrypted + metadata + local IndexedDB)
  const thumbMap = {};
  (_cloudPhotos20 || []).forEach(p => { thumbMap[p.id] = p; });
  const cloudItems = ((D.photosMeta || {}).items || []);
  const allPhotos = [..._localPhotos20, ...cloudItems.map(m => thumbMap[m.id] || m)];
  const seenPos = new Set();
  allPhotos.forEach((p, idx) => {
    if (p.lat == null || p.lon == null) return;
    const key = `${(+p.lat).toFixed(3)},${(+p.lon).toFixed(3)}`;
    const jit = seenPos.has(key) ? ((idx % 7) - 3) * 0.004 : 0;
    seenPos.add(key);
    pins.push({
      id: "ph_" + p.id,
      layer: "photo",
      color: "#ff6b6b",
      radius: 6.5,
      lat: +p.lat + jit,
      lon: +p.lon - jit,
      title: `${p.loc || "사진"} (${p.date || ""})`,
      sub: `${p.src || ""} · ${p.camera || p.name || ""}`,
      thumb: p.thumb || null,
      photoId: p.id,
      go: "photos"
    });
  });

  return pins;
}

function pinPopupHtml20(p) {
  let h = `<b>${esc(p.title)}</b>`;
  if (p.sub) h += `<div style="color:#9fb9c2;margin-top:3px">${esc(p.sub)}</div>`;
  if (p.thumb) h += `<img src="${p.thumb}" alt="">`;
  if (p.url) h += `<div style="margin-top:6px"><a href="${esc(p.url)}" target="_blank" rel="noopener" style="color:#22e3f5">출처 열기 ↗</a></div>`;
  if (p.go) h += `<div style="margin-top:6px"><button class="pill" data-go="${esc(p.go)}">화면 열기 →</button></div>`;
  return h;
}

function mountRealMap20(elId, opts) {
  const el = $(elId);
  if (!el || typeof L === "undefined") return;
  try {
    if (_maps20[elId]) {
      _maps20[elId].remove();
      delete _maps20[elId];
    }
  } catch (_) {}

  const o = opts || {};
  const center = (_mapFocus20 && !o.mini) ? [_mapFocus20.lat, _mapFocus20.lon] : (o.center || [30.5052, -97.8203]);
  const zoom = (_mapFocus20 && !o.mini) ? (_mapFocus20.zoom || 11) : (o.zoom != null ? o.zoom : 4);
  if (!o.mini) _mapFocus20 = null;

  const map = L.map(el, {
    center,
    zoom,
    zoomControl: !o.mini,
    attributionControl: true,
    scrollWheelZoom: !o.mini
  });
  _maps20[elId] = map;

  const baseDark = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16,
    attribution: '&copy; Esri &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  }).addTo(map);
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16,
    opacity: 0.9
  }).addTo(map);
  baseDark.on("tileerror", () => {
    if (!map._osmFallback) {
      map._osmFallback = true;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map);
    }
  });

  const layerGroup = L.layerGroup().addTo(map);
  const activeFilter = o.filter || _mapLayer20 || "all";

  function drawPins() {
    layerGroup.clearLayers();
    const pins = collectMapPins20().filter(p => activeFilter === "all" || (Array.isArray(activeFilter) ? activeFilter.includes(p.layer) : p.layer === activeFilter));
    pins.forEach(p => {
      if (p.circleKm) {
        L.circle([p.lat, p.lon], {
          radius: p.circleKm * 1000,
          color: "#ffd166",
          weight: 1,
          fillColor: "#ffd166",
          fillOpacity: 0.08
        }).addTo(layerGroup);
      }
      const mk = L.circleMarker([p.lat, p.lon], {
        radius: p.radius || 6,
        color: "#041016",
        weight: 1.5,
        fillColor: p.color || "#22e3f5",
        fillOpacity: 0.92
      }).addTo(layerGroup);
      mk.bindPopup(pinPopupHtml20(p));
    });
    const cntEl = $(elId + "_cnt");
    if (cntEl) cntEl.textContent = pins.length + "개 핀";
  }

  drawPins();
  setTimeout(() => { try { map.invalidateSize(); } catch (_) {} }, 120);

  // Background hydrate cloud+local photos so photo pins show thumbnails
  Promise.all([loadLocalData20(), loadCloudPhotos20()]).then(() => {
    if (_maps20[elId] === map) drawPins();
  }).catch(() => {});
}

/* ----- Map Views: #globe, #map, #near, #world, #home, #imap ----- */
function renderMapView20(defaultFilter, defaultCenter, defaultZoom) {
  const layerDefs = [
    ["all", "전체", "#22e3f5"],
    ["home", "홈·서울", "#ffd166"],
    ["near", "주변", "#38bdf8"],
    ["world", "세계·지진", "#c4b5fd"],
    ["interest", "관심사", "#f472b6"],
    ["travel", "여행", "#38e08c"],
    ["photo", "사진 GPS", "#ff6b6b"]
  ];
  const f = _mapLayer20 || defaultFilter || "all";
  setTimeout(() => mountRealMap20("map20_main", { center: defaultCenter || [30.5052, -97.8203], zoom: defaultZoom != null ? defaultZoom : 3 }), 50);
  return `<div class="hub18">
    <div class="row18">
      <div><p class="ey">INTERACTIVE MAP · ESRI DARK · OSM</p><h2 class="h18">실제 지도</h2></div>
      <span class="pill" id="map20_main_cnt">로딩…</span>
    </div>
    <div class="map20-layers">
      ${layerDefs.map(([k, lbl, col]) => `<button class="mpill20${f === k ? " on" : ""}" data-act="maplayer:${k}"><i style="background:${col}"></i>${lbl}</button>`).join("")}
    </div>
    <div id="map20_wrap" class="map20-wrap">
      <div class="map20-bar">
        <button class="pill" data-act="mapfocus:cp">시더파크</button>
        <button class="pill" data-act="mapfocus:kr">서울</button>
        <button class="pill" data-act="mapfocus:wld">세계</button>
        <button class="pill" data-act="maplocate">◎ 내 위치</button>
        <button class="pill" data-act="mapfs">⛶ 전체화면</button>
      </div>
      <div id="map20_main" class="map20-box" aria-label="실제 인터랙티브 지도"></div>
    </div>
    <p class="mut" style="margin-top:8px">홈 핀은 Cedar Park TX 78613 대략적 권역만 표시해요. '내 위치'는 이 기기 브라우저에서만 처리되며 저장·전송하지 않습니다.</p>
    <div class="qstrip19">
      <button class="qpill19" data-go="photos"><span>사진 지도</span><b>EXIF 위치 · 갤러리 →</b></button>
      <button class="qpill19" data-go="world"><span>세계 정세</span><b>권역 헤드라인 →</b></button>
    </div>
  </div>`;
}

V.globe = () => renderMapView20("all", [30.5052, -97.8203], 3);
V.map = V.globe;

ACT.maplayer = k => {
  _mapLayer20 = k || "all";
  render();
};
ACT.mapfocus = k => {
  const m = _maps20["map20_main"];
  if (!m) return;
  if (k === "cp") m.setView([30.5052, -97.8203], 10);
  else if (k === "kr") m.setView([37.25, 127.1], 7);
  else m.setView([28, 10], 2);
};
ACT.mapfs = () => {
  const w = $("map20_wrap");
  if (!w) return;
  w.classList.toggle("fs");
  const m = _maps20["map20_main"];
  if (m) setTimeout(() => m.invalidateSize(), 120);
};
ACT.maplocate = () => {
  if (!navigator.geolocation) return T("이 브라우저는 위치 기능을 지원하지 않아요");
  T("기기에서 현재 위치를 확인 중…");
  navigator.geolocation.getCurrentPosition(
    pos => {
      const m = _maps20["map20_main"];
      if (!m) return;
      const { latitude, longitude } = pos.coords;
      m.setView([latitude, longitude], 12);
      L.circleMarker([latitude, longitude], {
        radius: 9,
        color: "#ffffff",
        weight: 2,
        fillColor: "#22e3f5",
        fillOpacity: 1
      }).addTo(m).bindPopup("<b>현재 기기 위치</b><br><span class='mut'>브라우저 로컬 전용</span>").openPopup();
    },
    err => T("위치 확인 실패: " + (err.message || "권한 필요")),
    { enableHighAccuracy: false, timeout: 8000 }
  );
};

/* Replace circle globe in V.near with real Austin/Cedar Park map */
const _vnear17_v20 = V.near;
V.near = function () {
  const base = _vnear17_v20 ? _vnear17_v20.apply(this, arguments) : "";
  setTimeout(() => mountRealMap20("map20_near", { mini: true, center: [30.45, -97.78], zoom: 9, filter: ["home", "near", "interest"] }), 60);
  const block = `<div class="map20-wrap" style="margin:12px 0">
    <div class="map20-bar"><b>주변 실제 지도 · Cedar Park / Austin</b><button class="pill" data-go="globe">전체 지도 →</button></div>
    <div id="map20_near" class="map20-mini"></div>
  </div>`;
  const idx = base.indexOf("</section>");
  return idx >= 0 ? base.slice(0, idx + 10) + block + base.slice(idx + 10) : block + base;
};

/* Add mini real map to V.world */
const _vworld19_v20 = V.world;
V.world = function () {
  let h = _vworld19_v20.apply(this, arguments);
  // Remove old canvas globe if present and inject real Leaflet mini map
  h = h.replace(/<canvas id="wglobe18"[^>]*><\/canvas>/g, "").replace(">지구본</button>", ">실제 지도</button>");
  setTimeout(() => mountRealMap20("map20_world", { mini: true, center: [26, 15], zoom: 2, filter: "all" }), 70);
  const mini = `<section class="sec19 glass2" style="padding:12px">
    <div class="row18" style="margin-bottom:8px"><b>실제 세계 지도</b><button class="pill" data-go="globe">전체 · 레이어 →</button></div>
    <div class="map20-wrap"><div id="map20_world" class="map20-mini"></div></div>
  </section>`;
  const pos = h.indexOf('<div class="regs">');
  return pos >= 0 ? h.slice(0, pos) + mini + h.slice(pos) : mini + h;
};

/* ----- Photos View (#photos) ----- */
function regionFilterMatch20(p) {
  if (_photoMonth20 !== "all" && p.ym !== _photoMonth20) return false;
  if (_photoFilter20 === "gps") return p.lat != null && p.lon != null;
  if (_photoFilter20 === "local") return !!p.local;
  return true;
}

function buildPhotosViewHtml20() {
  const meta = D.photosMeta || {};
  const cloud = _cloudPhotos20;
  const all = [..._localPhotos20, ...(cloud || [])].sort((a, b) => String(b.ts || "").localeCompare(String(a.ts || "")));
  const items = all.length ? all : (meta.items || []);

  // Recompute months including local photos
  const mc = {};
  items.forEach(p => { if (p.ym) mc[p.ym] = (mc[p.ym] || 0) + 1; });
  const months = Object.keys(mc).sort().reverse().map(ym => ({ ym, count: mc[ym] }));
  const dates = items.map(p => p.date).filter(Boolean).sort();
  const minD = dates[0] || (meta.dateRange || {}).min || "—";
  const maxD = dates[dates.length - 1] || (meta.dateRange || {}).max || "—";
  const gpsCnt = items.filter(p => p.lat != null && p.lon != null).length;

  const now = new Date();
  const mmdd = String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const mm = mmdd.slice(0, 2);
  let otd = items.filter(p => p.mmdd === mmdd);
  let otdLabel = `오늘(${mmdd})의 추억`;
  if (!otd.length) {
    otd = items.filter(p => p.mmdd && p.mmdd.slice(0, 2) === mm).slice(0, 6);
    otdLabel = `${Number(mm)}월의 추억 (같은 달 기록)`;
  }

  const filtered = items.filter(regionFilterMatch20);
  const srcCounts = {};
  items.forEach(p => { srcCounts[p.src || "Cloud"] = (srcCounts[p.src || "Cloud"] || 0) + 1; });

  return `<div class="hub18">
    <div class="row18">
      <div><p class="ey">ENCRYPTED PHOTOS · DRIVE · ONEDRIVE · GMAIL</p><h2 class="h18">내 사진 ${items.length}장</h2></div>
      <button class="pill" data-act="photomap">지도에 보기 →</button>
    </div>

    <div class="kpi3">
      <div class="glass2" style="padding:12px"><span class="mut">수집·기기</span><b class="num">${items.length}장</b></div>
      <div class="glass2" style="padding:12px"><span class="mut">기간</span><b style="font-size:13px">${esc(minD)} ~ ${esc(maxD)}</b></div>
      <div class="glass2" style="padding:12px"><span class="mut">EXIF 위치</span><b class="num">${gpsCnt}장</b></div>
    </div>

    <section class="sec19 glass2">
      <div class="upbox20">
        <div>
          <b>휴대폰 · PC 사진 기기 내 추가</b>
          <div class="mut">브라우저에서 320px·EXIF 처리 후 AES-GCM으로 IndexedDB에만 암호화 저장 (업로드 없음)</div>
        </div>
        <label class="upbtn20">+ 사진 선택<input id="photo_up20" type="file" accept="image/*" multiple></label>
      </div>
      <div class="mut" style="margin-top:8px">소스: ${Object.entries(srcCounts).map(([k, v]) => `${esc(k)} ${v}`).join(" · ") || "—"}</div>
      ${!cloud && !_cloudPhotosErr20 ? `<p class="mut" style="margin-top:6px">암호화 썸네일 해독 중…</p>` : ""}
      ${_cloudPhotosErr20 ? `<p class="mut" style="color:var(--warn)">썸네일 로드 오류: ${esc(_cloudPhotosErr20)}</p>` : ""}
    </section>

    ${otd.length ? `<section class="sec19 glass2"><h3>${esc(otdLabel)}</h3>
      <div class="pgrid20">${otd.slice(0, 6).map(p => `<button class="pcard20" data-act="photoopen:${esc(p.id)}">${p.thumb ? `<img src="${p.thumb}" loading="lazy" alt="">` : `<div style="padding:20px" class="mut">${esc(p.date || "")}</div>`}<div class="pmeta20">${esc(p.date || "")} ${esc(p.loc || "")}</div></button>`).join("")}</div>
    </section>` : ""}

    <section class="sec19 glass2"><h3>월별 타임라인 (${months.length}개월)</h3>
      <div class="mstrip20">
        <button class="mpill20${_photoMonth20 === "all" ? " on" : ""}" data-act="photomonth:all">전체 (${items.length})</button>
        ${months.map(m => `<button class="mpill20${_photoMonth20 === m.ym ? " on" : ""}" data-act="photomonth:${esc(m.ym)}">${esc(m.ym)} (${m.count})</button>`).join("")}
      </div>
      <div class="map20-layers">
        <button class="mpill20${_photoFilter20 === "all" ? " on" : ""}" data-act="photofilt:all">전체</button>
        <button class="mpill20${_photoFilter20 === "gps" ? " on" : ""}" data-act="photofilt:gps">GPS 있음 (${gpsCnt})</button>
        <button class="mpill20${_photoFilter20 === "local" ? " on" : ""}" data-act="photofilt:local">내 기기 (${_localPhotos20.length})</button>
      </div>
      <div class="pgrid20">
        ${filtered.map(p => `<button class="pcard20" data-act="photoopen:${esc(p.id)}">
          ${p.thumb ? `<img src="${p.thumb}" loading="lazy" alt="${esc(p.name || "")}">` : `<div style="padding:20px" class="mut">${esc(p.date || "")}</div>`}
          ${p.lat != null ? `<span class="pbadge20">GPS</span>` : (p.local ? `<span class="pbadge20">기기</span>` : "")}
          <div class="pmeta20">${esc(p.date || "")}${p.loc ? " · " + esc(p.loc) : ""}</div>
        </button>`).join("") || `<p class="mut">조건에 맞는 사진이 없어요.</p>`}
      </div>
    </section>
    ${_photoModal20 ? renderPhotoModal20(_photoModal20, items) : ""}
  </div>`;
}

function renderPhotoModal20(pid, items) {
  const p = items.find(x => x.id === pid);
  if (!p) return "";
  return `<div class="modal20" data-act="photoclose">
    <div class="modal20-card" onclick="event.stopPropagation()">
      <div class="row18" style="margin-bottom:8px"><b>${esc(p.date || "")} ${esc(p.loc || "")}</b><button class="pill" data-act="photoclose">닫기</button></div>
      ${p.thumb ? `<img src="${p.thumb}" alt="">` : ""}
      <dl class="kv" style="margin-top:10px">
        <dt>출처</dt><dd>${esc(p.src || "—")}</dd>
        <dt>촬영</dt><dd>${esc(p.ts || p.date || "—")}</dd>
        <dt>카메라</dt><dd>${esc(p.camera || "—")}</dd>
        <dt>위치</dt><dd>${p.lat != null ? `${esc(p.loc || "")} (${p.lat.toFixed(3)}, ${p.lon.toFixed(3)})` : "GPS 없음"}</dd>
      </dl>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        ${p.lat != null ? `<button class="btnp" data-act="photogps:${p.lat},${p.lon}">지도에서 보기 →</button>` : ""}
        ${p.local ? `<button class="pill" style="border-color:var(--err);color:var(--err)" data-act="photodel:${esc(p.id)}">기기에서 삭제</button>` : ""}
      </div>
    </div>
  </div>`;
}

V.photos = function () {
  Promise.all([loadLocalData20(), loadCloudPhotos20()]).then(() => {
    if (cur() === "photos") {
      const box = $("v");
      if (box) box.innerHTML = buildPhotosViewHtml20();
      bindPhotoUpload20();
    }
  });
  setTimeout(bindPhotoUpload20, 40);
  return buildPhotosViewHtml20();
};

function bindPhotoUpload20() {
  const inp = $("photo_up20");
  if (!inp || inp._b20) return;
  inp._b20 = 1;
  inp.addEventListener("change", async e => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    T(`${files.length}장 처리·암호화 중…`);
    let ok = 0;
    for (const f of files.slice(0, 30)) {
      try {
        const item = await processLocalPhotoFile20(f);
        _localPhotos20.unshift(item);
        ok++;
      } catch (_) {}
    }
    T(`${ok}장 암호화 저장 완료`);
    render();
  });
}

ACT.photomonth = m => { _photoMonth20 = m || "all"; render(); };
ACT.photofilt = f => { _photoFilter20 = f || "all"; render(); };
ACT.photoopen = id => { _photoModal20 = id; render(); };
ACT.photoclose = () => { _photoModal20 = null; render(); };
ACT.photomap = () => { _mapLayer20 = "photo"; _photoModal20 = null; go("globe"); };
ACT.photogps = ll => {
  const [la, lo] = String(ll || "").split(",").map(Number);
  if (isFinite(la) && isFinite(lo)) {
    _mapLayer20 = "photo";
    _mapFocus20 = { lat: la, lon: lo, zoom: 11 };
    _photoModal20 = null;
    go("globe");
  }
};
ACT.photodel = async id => {
  await idbDel20("photos_local", id);
  _localPhotos20 = _localPhotos20.filter(x => x.id !== id);
  _photoModal20 = null;
  T("삭제됨");
  render();
};

/* ----- Grok Memory & Grok.com Export Import (#memory) ----- */
function parseGrokExport20(jsonObj, fileName) {
  const convs = [];
  const rawList = Array.isArray(jsonObj)
    ? jsonObj
    : (jsonObj.conversations || jsonObj.data || jsonObj.chats || []);
  for (const c of rawList) {
    const meta = c.conversation || c;
    const title = meta.title || meta.name || "Grok 대화";
    const created = (meta.create_time || meta.created_at || meta.update_time || "").toString().slice(0, 10);
    const msgs = c.responses || c.messages || c.items || [];
    const userMsgs = [];
    for (const m of msgs) {
      const r = m.response || m;
      const sender = String(r.sender || r.role || "").toLowerCase();
      const txt = (r.message || r.content || r.text || "").toString().trim();
      if (txt && (sender === "human" || sender === "user" || !sender)) {
        userMsgs.push(txt.slice(0, 180));
      }
    }
    convs.push({
      id: meta.id || ("gx_" + convs.length),
      title: String(title).slice(0, 90),
      date: created,
      msgCount: msgs.length,
      asks: userMsgs.slice(0, 5)
    });
  }
  return {
    id: "grok_export_latest",
    fileName: fileName || "prod-grok-backend.json",
    importedAt: new Date().toISOString().slice(0, 16),
    count: convs.length,
    conversations: convs.slice(0, 120)
  };
}

function buildMemoryViewHtml20() {
  const gm = D.grokMemory || {};
  const perBot = gm.perBot || [];
  const goals = gm.goals || [];
  const projects = gm.projects || [];
  const decisions = gm.decisions || [];
  const prefs = gm.preferences || [];
  const todos = gm.openTodos || [];
  const topics = gm.topics || [];
  const timeline = (gm.timeline || []).filter(t => {
    if (_memBotFilter20 !== "all" && t.bot !== _memBotFilter20) return false;
    if (_memTopicFilter20 && !(t.text + " " + t.bot).toLowerCase().includes(_memTopicFilter20.toLowerCase())) return false;
    return true;
  });
  const srcs = (D.extra || {}).sources || {};

  return `<div class="hub18">
    <div class="row18">
      <div><p class="ey">GROK MEMORY · 나를 아는 비서</p><h2 class="h18">Grok 기억 · 대화</h2></div>
      <button class="pill" data-go="jarvis">비서에게 묻기 →</button>
    </div>

    <div class="kpi3">
      <div class="glass2" style="padding:12px"><span class="mut">읽은 봇</span><b class="num">${gm.botsRead || 7}개</b></div>
      <div class="glass2" style="padding:12px"><span class="mut">공유 메모리</span><b class="num">${gm.sharedFactsCount || 21}건</b></div>
      <div class="glass2" style="padding:12px"><span class="mut">정리 항목</span><b class="num">${gm.itemCount || 46}개</b></div>
    </div>

    <section class="sec19 glass2"><h3>핵심 목표 · 진행 프로젝트</h3>
      ${goals.map(g => `<div class="row18b" style="cursor:default"><span><b>${esc(g.title)}</b><br><em class="mut">${esc(g.detail)}</em></span><span class="pill">${esc(g.bot)}</span></div>`).join("")}
      <div class="fgrid19" style="margin-top:10px">
        ${projects.map(p => `<div class="tile19" style="cursor:default"><span class="tk19">${esc(p.bot)}</span><b>${esc(p.name)}</b><em>${esc(p.status)} · ${esc((p.detail || "").slice(0, 34))}</em></div>`).join("")}
      </div>
    </section>

    <section class="sec19 glass2"><h3>미해결 할 일 · 주요 결정 · 성향</h3>
      ${todos.map(t => `<div class="row18b" style="cursor:default"><span><b>[P${t.prio}] ${esc(t.text)}</b><br><em class="mut">${esc(t.bot)}</em></span></div>`).join("")}
      <div style="margin-top:10px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px">
        <b style="font-size:13px">최근 결정</b>
        ${decisions.map(d => `<p class="mut" style="margin:4px 0">• [${esc(d.date)} · ${esc(d.bot)}] ${esc(d.text)}</p>`).join("")}
      </div>
      <div style="margin-top:8px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px">
        <b style="font-size:13px">선호 · 원칙</b>
        ${prefs.map(p => `<p class="mut" style="margin:4px 0">• ${esc(p)}</p>`).join("")}
      </div>
    </section>

    <section class="sec19 glass2"><h3>관심 토픽 클라우드 ${_memTopicFilter20 ? `<button class="pill" data-act="memtopic:">필터 해제 (${esc(_memTopicFilter20)})</button>` : ""}</h3>
      <div class="tcloud20">
        ${topics.map((tp, i) => `<button class="tchip20${i < 3 ? " gold" : ""}" style="font-size:${Math.min(18, 12 + Math.round((tp.count || 5) / 5))}px" data-act="memtopic:${esc(tp.word.split("·")[0])}">${esc(tp.word)} <span class="mut">${tp.count}</span></button>`).join("")}
      </div>
    </section>

    <section class="sec19 glass2"><h3>봇별 최근 요청 · 타임라인</h3>
      <div class="mstrip20">
        <button class="mpill20${_memBotFilter20 === "all" ? " on" : ""}" data-act="membot:all">전체 (${(gm.timeline || []).length})</button>
        ${perBot.map(b => `<button class="mpill20${_memBotFilter20 === b.name ? " on" : ""}" data-act="membot:${esc(b.name)}">${esc(b.name)}</button>`).join("")}
      </div>
      <div style="margin:8px 0">
        ${timeline.map(it => `<div class="tl20-item"><b>${esc(it.bot)}</b> <span class="mut">${esc(it.date)}</span><div style="margin-top:2px;font-size:14px">${esc(it.text)}</div></div>`).join("") || `<p class="mut">일치하는 대화 타임라인이 없어요.</p>`}
      </div>
      <div class="fgrid19" style="margin-top:10px">
        ${perBot.map(b => `<div class="tile19" style="cursor:default"><span class="tk19">${esc(b.lastAt || "")}</span><b>${esc(b.name)}</b><em>${esc((b.recentAsks || [])[0] || b.role || "")}</em></div>`).join("")}
      </div>
      ${gm.headlessNote ? `<p class="mut" style="margin-top:8px">${esc(gm.headlessNote)}</p>` : ""}
    </section>

    <section class="sec19 glass2"><h3>Grok.com 일반 대화 가져오기 (기기 내 암호화)</h3>
      <p class="mut">커넥터로 외부 grok.com 소비자 계정의 개인 대화는 직접 읽을 수 없어, 공식 내보내기 JSON을 기기 안에서만 파싱·암호화 저장해요.</p>
      <ol style="margin:6px 0 10px 18px;color:var(--sub);font-size:13px;line-height:1.5">
        ${((gm.grokExportGuide || {}).steps || []).map(s => `<li>${esc(s)}</li>`).join("")}
      </ol>
      <div class="upbox20">
        <span><b>prod-grok-backend.json 선택</b><br><em class="mut">${_grokExports20.length ? `${_grokExports20[0].count}개 대화 암호화 보관 중 (${_grokExports20[0].importedAt})` : "외부 업로드 없이 IndexedDB에만 저장"}</em></span>
        <label class="upbtn20">+ 내보내기 JSON<input id="grok_up20" type="file" accept=".json,application/json"></label>
      </div>
      ${_grokExports20.length ? `<div style="margin-top:10px">${(_grokExports20[0].conversations || []).slice(0, 10).map(c => `<div class="row18b" style="cursor:default"><span><b>${esc(c.title)}</b><br><em class="mut">${esc((c.asks || [])[0] || "대화 " + c.msgCount + "건")}</em></span><span class="mut">${esc(c.date || "")}</span></div>`).join("")}</div>` : ""}
    </section>

    <section class="sec19 glass2"><h3>정보 소스 연결 상태</h3>
      <div>${(srcs.ok || []).map(s => `<span class="srcbadge20">✓ ${esc(s)}</span>`).join("")}</div>
      <div style="margin-top:8px">${(srcs.failed || []).map(f => `<span class="srcbadge20 fail">✕ ${esc(f.name)} (${esc(f.reason)})</span>`).join("")}</div>
    </section>
  </div>`;
}

V.memory = function () {
  loadLocalData20().then(() => {
    if (cur() === "memory") {
      const box = $("v");
      if (box) box.innerHTML = buildMemoryViewHtml20();
      bindGrokUpload20();
    }
  });
  setTimeout(bindGrokUpload20, 40);
  return buildMemoryViewHtml20();
};

function bindGrokUpload20() {
  const inp = $("grok_up20");
  if (!inp || inp._b20) return;
  inp._b20 = 1;
  inp.addEventListener("change", async e => {
    const f = (e.target.files || [])[0];
    if (!f) return;
    try {
      T("Grok 대화 내보내기 파싱 중…");
      const txt = await f.text();
      const parsed = parseGrokExport20(JSON.parse(txt), f.name);
      await idbPutEnc20("grok_exports", parsed.id, parsed);
      _grokExports20 = [parsed];
      T(`${parsed.count}개 대화 기기 내 암호화 저장 완료`);
      render();
    } catch (err) {
      T("JSON 파싱 실패: " + (err.message || err));
    }
  });
}

ACT.membot = b => { _memBotFilter20 = b || "all"; render(); };
ACT.memtopic = w => { _memTopicFilter20 = w || ""; render(); };

/* ----- Wire Grok Memory into Local Assistant ask17 ----- */
const _ask17_v20 = ask17;
ask17 = function (q) {
  const t = (q || "").trim();
  const gm = D.grokMemory || {};
  if (/그록|grok|기억|목표|프로젝트|할 ?일|투두|봇.*대화|자동매매.*봇|영어.*봇|부업|사진/i.test(t)) {
    const bits = [];
    if (/사진|앨범|위치|exif/i.test(t)) {
      const pm = D.photosMeta || {};
      const tot = (pm.count || 0) + _localPhotos20.length;
      bits.push(`사진 ${tot}장 (${(pm.dateRange || {}).min || ""} ~ ${(pm.dateRange || {}).max || ""}, GPS ${pm.gpsCount || 0}장)이 사진첩과 실제 지도에 연결되어 있어요.`);
    }
    if (/목표|경제적|꿈/i.test(t)) {
      bits.push("기록된 핵심 목표: " + (gm.goals || []).slice(0, 3).map(g => `${g.title}(${g.bot})`).join(" · "));
    }
    if (/할 ?일|투두|해야|미해결/i.test(t)) {
      bits.push("열린 할 일: " + (gm.openTodos || []).slice(0, 3).map(x => x.text).join(" / "));
    }
    if (!bits.length) {
      const kw = t.replace(/[?？]/g, "").split(/\s+/).filter(s => s.length > 1);
      const hit = [
        ...(gm.timeline || []).map(x => `[${x.bot} ${x.date}] ${x.text}`),
        ...(gm.projects || []).map(x => `${x.name}: ${x.detail}`),
        ...(_grokExports20[0] ? _grokExports20[0].conversations.map(c => `[Grok.com] ${c.title}`) : [])
      ].filter(s => kw.some(k => s.toLowerCase().includes(k.toLowerCase()))).slice(0, 3);
      if (hit.length) bits.push("Grok 7개 봇 기억에서 찾았어요: " + hit.join(" · "));
      else bits.push(`7개 봇(${gm.botsRead || 7}봇)과 공유 메모리 ${gm.sharedFactsCount || 21}건이 통합돼 있어요. 최근 프로젝트는 ${(gm.projects || []).slice(0, 2).map(p => p.name).join(", ")}입니다.`);
    }
    return { a: bits.join(" "), sug: ["내 목표 뭐야?", "열린 할 일", "내 사진 몇 장?", "이번 달 외식 얼마?"] };
  }
  return _ask17_v20.apply(this, arguments);
};

/* ----- Extra Info Views (#docs20, #mailstats20) & Enhanced Existing Views ----- */
V.docs20 = function () {
  const ex = D.extra || {}, dr = ex.drive || {}, od = ex.onedrive || {};
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">GOOGLE DRIVE · SHEETS · SLIDES · ONEDRIVE</p><h2 class="h18">내 문서 · 파일</h2></div><button class="pill" data-go="life">나 →</button></div>
    <div class="kpi3">
      <div class="glass2" style="padding:12px"><span class="mut">Google Sheets</span><b class="num">${(dr.sheets || []).length}개</b></div>
      <div class="glass2" style="padding:12px"><span class="mut">Slides</span><b class="num">${(dr.slides || []).length}개</b></div>
      <div class="glass2" style="padding:12px"><span class="mut">OneDrive 사진</span><b class="num">${od.cameraCount || 0}</b></div>
    </div>
    <section class="sec19 glass2"><h3>Google Sheets (${(dr.sheets || []).length})</h3>
      ${(dr.englishSheetTabs || []).length ? `<p class="mut">영어 표현 노트 탭: ${esc(dr.englishSheetTabs.join(" · "))}</p>` : ""}
      ${(dr.sheets || []).slice(0, 14).map(s => `<a class="row18b" style="text-decoration:none;color:inherit" href="${esc(s.url || "#")}" target="_blank" rel="noopener"><span><b>${esc(s.name)}</b></span><span class="mut">${esc(s.modified || "")} ↗</span></a>`).join("") || `<p class="mut">시트 없음</p>`}
    </section>
    <section class="sec19 glass2"><h3>Google Slides (${(dr.slides || []).length}) · Drive 유형별</h3>
      <div class="map20-layers">${(dr.byType || []).map(t => `<span class="mpill20">${esc(t.type)} ${t.count}</span>`).join("")}</div>
      ${(dr.slides || []).map(s => `<a class="row18b" style="text-decoration:none;color:inherit" href="${esc(s.url || "#")}" target="_blank" rel="noopener"><span><b>${esc(s.name)}</b></span><span class="mut">${esc(s.modified || "")} ↗</span></a>`).join("")}
    </section>
    <section class="sec19 glass2"><h3>OneDrive · 미국생활 · 주재원 준비</h3>
      ${(od.items || []).map(it => `<div class="row18b" style="cursor:default"><span><b>${esc(it.name)}</b><br><em class="mut">${esc(it.folder)} · ${esc(it.kind)}${it.childCount != null ? ` (${it.childCount}항목)` : ""}</em></span><span class="mut">${esc(it.modified || "")}</span></div>`).join("") || `<p class="mut">항목 없음</p>`}
    </section>
  </div>`;
};

V.mailstats20 = function () {
  const gm = (D.extra || {}).gmail || {};
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">GMAIL ANALYTICS</p><h2 class="h18">메일 라벨 · 발신자</h2></div><button class="pill" data-go="life">나 →</button></div>
    <section class="sec19 glass2"><h3>Gmail 라벨 (${(gm.labels || []).length}개 · 최근 60일 약 ${gm.recentEstimate || "—"}건)</h3>
      <div class="tcloud20">${(gm.labels || []).map(l => `<span class="mpill20">${esc(l.name)}</span>`).join("")}</div>
    </section>
    <section class="sec19 glass2"><h3>주요 발신자 TOP</h3>
      ${(gm.topSenders || []).map(s => `<div class="row18b" style="cursor:default"><b>${esc(s.name)}</b><span class="num">${s.count}건</span></div>`).join("") || `<p class="mut">집계 없음</p>`}
    </section>
    <section class="sec19 glass2"><h3>구독 · 프로모션 발신</h3>
      ${(gm.subscriptions || []).map(s => `<div class="row18b" style="cursor:default"><b>${esc(s.name)}</b><span class="num">${s.count}건</span></div>`).join("") || `<p class="mut">집계 없음</p>`}
    </section>
  </div>`;
};

/* Enhance X profile with real followers/following/timeline from D.extra.x */
V.xprof = function () {
  const xx = (D.extra || {}).x || {};
  const x = D.x || {};
  const m = xx.metrics || {};
  const posts = xx.timeline || [];
  const uname = xx.username || x.account || "계정";
  return `<div class="hub18">
    <div class="row18"><div><p class="ey">X PROFILE · TIMELINE</p><h2 class="h18">X · ${esc(uname)}</h2></div><button class="pill" data-go="life">나 →</button></div>
    <div class="kpi3">
      <div class="glass2" style="padding:12px"><span class="mut">팔로워 · 팔로잉</span><b class="num">${m.followers_count ?? x.followers ?? "—"} / ${m.following_count ?? "—"}</b></div>
      <div class="glass2" style="padding:12px"><span class="mut">내 게시물</span><b class="num">${m.tweet_count ?? 0}건</b></div>
      <div class="glass2" style="padding:12px"><span class="mut">북마크</span><b class="num">${xx.bookmarksCount ?? 0}건</b></div>
    </div>
    <section class="sec19 glass2"><h3>홈 타임라인 최근 (${posts.length}건)</h3>
      ${posts.map(p => `<div class="row18b" style="cursor:default"><span>${esc(p.text)}</span><span class="mut">${esc(p.created || "")}</span></div>`).join("") || `<p class="mut">타임라인 없음</p>`}
    </section>
  </div>`;
};

/* Enhance D-day with US holidays, KR holidays, Birthdays */
const _vdday19_v20 = V.dday19;
V.dday19 = function () {
  const h = _vdday19_v20 ? _vdday19_v20.apply(this, arguments) : "";
  const cal = (D.extra || {}).calendar || {};
  const extra = `
    <section class="sec19 glass2"><h3>미국 공휴일 (${(cal.usHolidays || []).length}) · 한국 공휴일 (${(cal.krHolidays || []).length})</h3>
      ${(cal.usHolidays || []).slice(0, 6).map(x => `<div class="row18b" style="cursor:default"><b>🇺🇸 ${esc(x.title)}</b><span class="mut">${esc(x.date)}</span></div>`).join("")}
      ${(cal.krHolidays || []).slice(0, 6).map(x => `<div class="row18b" style="cursor:default"><b>🇰🇷 ${esc(x.title)}</b><span class="mut">${esc(x.date)}</span></div>`).join("")}
    </section>
    ${(cal.birthdays || []).length ? `<section class="sec19 glass2"><h3>캘린더 생일</h3>
      ${cal.birthdays.map(b => `<div class="row18b" style="cursor:default"><b>🎂 ${esc(b.title)}</b><span class="mut">${esc(b.date)}</span></div>`).join("")}
    </section>` : ""}`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + extra + h.slice(idx) : h + extra;
};

/* Enhance V.home (오늘) with compact interactive real mini map + photo/memory quick pills */
const _vhome19_v20 = V.home;
V.home = function () {
  let h = _vhome19_v20.apply(this, arguments);
  if (window._ed) return h;
  const pm = D.photosMeta || {}, gm = D.grokMemory || {};
  setTimeout(() => mountRealMap20("map20_home", { mini: true, center: [30.5052, -97.8203], zoom: 8, filter: ["home", "near", "photo"] }), 80);
  const block = `
    <section class="sec19 glass2" style="padding:12px">
      <div class="row18" style="margin-bottom:8px"><b>내 주변 · 사진 실제 지도</b><button class="pill" data-go="globe">전체 지도 →</button></div>
      <div class="map20-wrap"><div id="map20_home" class="map20-mini home"></div></div>
    </section>
    <div class="qstrip19">
      <button class="qpill19" data-go="photos"><span>내 사진첩</span><b>${(pm.count || 0) + _localPhotos20.length}장 · GPS ${pm.gpsCount || 0} →</b></button>
      <button class="qpill19" data-go="memory"><span>Grok 기억</span><b>${gm.botsRead || 7}개 봇 · ${gm.itemCount || 46}건 →</b></button>
    </div>`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + block + h.slice(idx) : h + block;
};

/* Enhance V.wealth (돈) with Bank of America live accounts/liability/0 holdings note */
const _vwealth19_v20 = V.wealth;
V.wealth = function () {
  let h = _vwealth19_v20.apply(this, arguments);
  const fn = (D.extra || {}).finance || {};
  if (!fn.checking && !fn.liability) return h;
  const chk = fn.checking || {}, lb = fn.liability || {};
  const card20 = `<section class="sec19 glass2"><h3>Bank of America 실시간 스냅샷</h3>
    <div class="row18b" style="cursor:default"><span><b>${esc(chk.name || "Checking")}</b><br><em class="mut">가용 ${money(chk.available)}</em></span><b class="num t-ok">${money(chk.current)}</b></div>
    <div class="row18b" style="cursor:default"><span><b>${esc(lb.name || "Card")}</b><br><em class="mut">결제 마감 ${esc(lb.due || "—")} · 잔여 한도 ${money(lb.available)}</em></span><b class="num t-lo">-${money(lb.current)}</b></div>
    <p class="mut" style="margin:6px 0 0">${esc(fn.holdingsNote || "연결된 투자 계좌 없음")}</p>
  </section>`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + card20 + h.slice(idx) : h + card20;
};

/* Enhance V.life (나) with Photos, Grok Memory, Docs20, MailStats20 tiles */
const _vlife19_v20 = V.life;
V.life = function () {
  let h = _vlife19_v20.apply(this, arguments);
  const pm = D.photosMeta || {}, gm = D.grokMemory || {}, ex = D.extra || {};
  const sec = `<section class="sec19 glass2"><h3>내 기억 · 사진 · 파일 (v20)</h3>
    <div class="fgrid19">
      ${tile19("photos", "내 사진첩", "Drive · OneDrive · 기기", ((pm.count || 0) + _localPhotos20.length) + "장", true)}
      ${tile19("memory", "Grok 기억 · 대화", "7개 봇 · 내보내기", (gm.itemCount || 46) + "개 기록", true)}
      ${tile19("globe", "실제 지도", "홈 · 주변 · 사진 GPS", "실제 지도 · GPS")}
      ${tile19("docs20", "문서 · 시트 · OneDrive", "Sheets · Slides", ((ex.drive || {}).sheets || []).length + "시트")}
      ${tile19("mailstats20", "메일 라벨 · 발신자", "구독 · 통계", ((ex.gmail || {}).labels || []).length + "라벨")}
    </div>
  </section>`;
  const idx = h.lastIndexOf("</div>");
  return idx >= 0 ? h.slice(0, idx) + sec + h.slice(idx) : h + sec;
};

/* Enhance V.jarvis (비서) with Memory link */
const _vjarvis19_v20 = V.jarvis;
V.jarvis = function () {
  let h = _vjarvis19_v20.apply(this, arguments);
  const gm = D.grokMemory || {};
  const extra = `<section class="sec19 glass2" style="margin-top:12px"><h3>Grok 대화 기억 연동</h3>
    <p class="mut">7개 봇의 대화와 공유 메모리 ${gm.sharedFactsCount || 21}건이 비서 검색에 연결되어 있어요. 예: "내 목표 뭐야?", "열린 할 일", "내 사진 몇 장?"</p>
    <div class="qstrip19" style="margin-top:8px">
      <button class="qpill19" data-go="memory"><span>기억 · 타임라인</span><b>7개 봇 전체 보기 →</b></button>
      <button class="qpill19" data-go="photos"><span>사진 · 지도</span><b>사진첩 열기 →</b></button>
    </div>
  </section>`;
  return h + extra;
};

/* Enhance V.imap with mini interest + photo map */
const _vimap_v20 = V.imap;
V.imap = function () {
  const h = _vimap_v20 ? _vimap_v20.apply(this, arguments) : "";
  setTimeout(() => mountRealMap20("map20_imap", { mini: true, center: [32, 0], zoom: 2, filter: ["interest", "photo"] }), 70);
  const block = `<div class="map20-wrap" style="margin:12px 0">
    <div class="map20-bar"><b>관심사 · 사진 위치 실제 지도</b><button class="pill" data-go="globe">전체 지도 →</button></div>
    <div id="map20_imap" class="map20-mini"></div>
  </div>`;
  return block + h;
};

/* Enhance catalog19 & palItems with v20 views */
if (typeof palItems === "function") {
  const _pal20 = palItems;
  palItems = function () {
    const it = _pal20();
    [
      ["photos", "내 사진첩 (Drive·OneDrive·기기)"],
      ["memory", "Grok 기억 · 대화 타임라인"],
      ["globe", "실제 인터랙티브 지도"],
      ["docs20", "문서 · Google Sheets · OneDrive"],
      ["mailstats20", "메일 라벨 · 주요 발신자"]
    ].forEach(r => it.unshift({ l: r[1], s: r[0], go: r[0] }));
    return it;
  };
}
if (typeof catalog19 === "function") {
  const _cat20 = catalog19;
  catalog19 = function () {
    const cats = _cat20();
    const lifeCat = cats.find(c => c[0] === "나 · 일정 · 메일");
    const pm = D.photosMeta || {}, gm = D.grokMemory || {}, ex = D.extra || {};
    if (lifeCat) {
      lifeCat[1].unshift(
        ["photos", "내 사진첩", ((pm.count || 0) + _localPhotos20.length) + "장 · EXIF"],
        ["memory", "Grok 기억 · 대화", (gm.itemCount || 46) + "건 · 7개 봇"],
        ["docs20", "문서 · 시트 · OneDrive", ((ex.drive || {}).sheets || []).length + "시트 · " + ((ex.drive || {}).slides || []).length + "슬라이드"],
        ["mailstats20", "메일 라벨 · 발신자", ((ex.gmail || {}).labels || []).length + "라벨"]
      );
    }
    const wCat = cats.find(c => c[0] === "세계 · 재미 · 영상");
    if (wCat) {
      const idx = wCat[1].findIndex(x => x[0] === "globe");
      if (idx >= 0) wCat[1][idx] = ["globe", "실제 지도 (Leaflet)", "홈·주변·사진 GPS"];
    }
    return cats;
  };
}

try {
  loadLocalData20();
  loadCloudPhotos20();
} catch (_) {}
