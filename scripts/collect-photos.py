#!/usr/bin/env python3
"""JARVIS v20 photo collector & AES-256-GCM encryptor.
Reads downloaded camera/attachment images from /workspace/bot-dashboard-secrets/photo-cache/,
extracts EXIF timestamp, camera, and GPS (city/region level only), resizes thumbnails (~320px JPEG),
caps at 120 latest photos, writes lightweight metadata to secrets/photos-meta.json,
and writes encrypted thumbnail payload to repo/photos.enc.json (never plaintext in repo).
"""
import base64
import datetime as dt
import glob
import hashlib
import io
import json
import math
import os
import re
import sys
import zoneinfo

from PIL import Image, ImageOps
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEC = "/workspace/bot-dashboard-secrets"
CACHE_DIR = os.path.join(SEC, "photo-cache")
MANIFEST_FILE = os.path.join(SEC, "photo_manifest_to_dl.json")
META_OUT = os.path.join(SEC, "photos-meta.json")
FULL_OUT = os.path.join(SEC, "photos-full.json")
ENC_OUT = os.path.join(ROOT, "photos.enc.json")
HASH_OUT = os.path.join(SEC, "photos.hash")
PASSCODE_FILE = os.path.join(SEC, "passcode")
CT = zoneinfo.ZoneInfo("America/Chicago")
IT = 310000
MAX_PHOTOS = 120
MAX_DIM = 320


def _to_float(v):
    try:
        if hasattr(v, "numerator") and hasattr(v, "denominator"):
            return float(v.numerator) / float(v.denominator) if v.denominator else None
        if isinstance(v, (tuple, list)) and len(v) == 2:
            return float(v[0]) / float(v[1]) if v[1] else None
        x = float(v)
        return None if (math.isnan(x) or math.isinf(x)) else x
    except Exception:
        return None


def _dms_to_deg(dms, ref):
    if not dms or len(dms) < 3:
        return None
    d, m, s = (_to_float(dms[0]), _to_float(dms[1]), _to_float(dms[2]))
    if d is None or m is None or s is None:
        return None
    deg = d + m / 60.0 + s / 3600.0
    if str(ref).upper() in ("S", "W"):
        deg = -deg
    if abs(deg) < 1e-6 or abs(deg) > 180:
        return None
    return round(deg, 5)


def _region_label(lat, lon):
    if lat is None or lon is None:
        return None
    if 30.20 <= lat <= 30.70 and -98.05 <= lon <= -97.55:
        return "Cedar Park · Austin, TX"
    if 32.50 <= lat <= 33.10 and -106.60 <= lon <= -105.90:
        return "White Sands, NM"
    if 29.0 <= lat <= 33.5 and -106.5 <= lon <= -94.0:
        return "Texas / US Southwest"
    if 37.45 <= lat <= 37.70 and 126.80 <= lon <= 127.20:
        return "서울"
    if 37.10 <= lat <= 37.45 and 126.80 <= lon <= 127.30:
        return "용인 · 수원"
    if 36.90 <= lat <= 37.12 and 126.80 <= lon <= 127.25:
        return "평택"
    if 37.30 <= lat <= 37.70 and 128.90 <= lon <= 129.35:
        return "동해 · 삼척"
    if 35.00 <= lat <= 35.30 and 126.65 <= lon <= 127.05:
        return "광주"
    if 33.0 <= lat <= 38.7 and 125.0 <= lon <= 130.0:
        return "대한민국"
    return f"{lat:.2f}, {lon:.2f}"


def _parse_date(exif_dt, fname):
    if exif_dt:
        m = re.match(r"(\d{4})[:\-](\d{2})[:\-](\d{2})[\sT](\d{2}):(\d{2}):(\d{2})", str(exif_dt).strip())
        if m:
            y, mo, d, H, M, S = m.groups()
            return f"{y}-{mo}-{d}T{H}:{M}:{S}", f"{y}-{mo}-{d}", f"{y}-{mo}", f"{mo}-{d}"
    m = re.search(r"(20\d{2})(\d{2})(\d{2})[_-]?(\d{2})(\d{2})(\d{2})?", fname)
    if m:
        y, mo, d, H, M, S = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5), m.group(6) or "00"
        return f"{y}-{mo}-{d}T{H}:{M}:{S}", f"{y}-{mo}-{d}", f"{y}-{mo}", f"{mo}-{d}"
    return None, None, None, None


def _source_name(fn, manifest_map):
    if fn in manifest_map:
        src = manifest_map[fn].get("src") or ""
        if src == "gd":
            return "Google Drive"
        if src == "od":
            return "OneDrive"
    if fn.startswith("gd_"):
        return "Google Drive"
    if fn.startswith("od_"):
        return "OneDrive"
    if fn.startswith("gm_"):
        return "Gmail"
    return "Cloud"


def main():
    os.makedirs(CACHE_DIR, exist_ok=True)
    manifest_map = {}
    if os.path.exists(MANIFEST_FILE):
        try:
            for m in json.load(open(MANIFEST_FILE)):
                key = f"{m.get('src')}_{m.get('name')}"
                manifest_map[key] = m
        except Exception:
            pass

    files = sorted(
        f for f in glob.glob(os.path.join(CACHE_DIR, "*"))
        if os.path.splitext(f)[1].lower() in (".jpg", ".jpeg", ".png", ".webp")
    )
    items = []
    seen_sig = set()

    for fp in files:
        fn = os.path.basename(fp)
        if re.search(r"(scan_|운전면허|여권|비자|idcard)", fn, re.I):
            continue
        try:
            with Image.open(fp) as raw_im:
                exif = raw_im.getexif()
                exif_dt = exif.get(36867) or exif.get(36868) or exif.get(306)
                make = str(exif.get(271) or "").strip()
                model = str(exif.get(272) or "").strip()
                camera = " ".join(x for x in (make, model) if x and x not in model) or model or make or None

                gps_ifd = None
                try:
                    gps_ifd = exif.get_ifd(34853)
                except Exception:
                    gps_ifd = None
                lat = lon = None
                if gps_ifd:
                    lat = _dms_to_deg(gps_ifd.get(2), gps_ifd.get(1) or "N")
                    lon = _dms_to_deg(gps_ifd.get(4), gps_ifd.get(3) or "E")

                man = manifest_map.get(fn) or {}
                if lat is None and man.get("lat") is not None and man.get("lon") is not None:
                    lat = round(float(man["lat"]), 5)
                    lon = round(float(man["lon"]), 5)

                ts, date_str, ym, mmdd = _parse_date(exif_dt or man.get("taken"), fn)
                if not date_str:
                    st = os.stat(fp)
                    d0 = dt.datetime.fromtimestamp(st.st_mtime, CT)
                    ts = d0.strftime("%Y-%m-%dT%H:%M:%S")
                    date_str = d0.strftime("%Y-%m-%d")
                    ym = d0.strftime("%Y-%m")
                    mmdd = d0.strftime("%m-%d")

                im = ImageOps.exif_transpose(raw_im).convert("RGB")
                w, h = im.size
                im.thumbnail((MAX_DIM, MAX_DIM), Image.Resampling.LANCZOS)
                buf = io.BytesIO()
                im.save(buf, format="JPEG", quality=68, optimize=True)
                thumb_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

                sig = f"{date_str}_{w}x{h}_{man.get('name') or fn}"
                if sig in seen_sig:
                    continue
                seen_sig.add(sig)

                pid = hashlib.sha1(fn.encode()).hexdigest()[:12]
                loc = _region_label(lat, lon)
                src = _source_name(fn, manifest_map)
                items.append({
                    "id": pid,
                    "name": man.get("name") or fn,
                    "src": src,
                    "ts": ts,
                    "date": date_str,
                    "ym": ym,
                    "mmdd": mmdd,
                    "lat": lat,
                    "lon": lon,
                    "loc": loc,
                    "camera": camera or man.get("camera"),
                    "w": w,
                    "h": h,
                    "thumb": thumb_b64,
                })
        except Exception as ex:
            print("skip", fn, ex, file=sys.stderr)

    items.sort(key=lambda x: x.get("ts") or "", reverse=True)
    items = items[:MAX_PHOTOS]

    months = {}
    for it in items:
        ym = it.get("ym") or "unknown"
        months[ym] = months.get(ym, 0) + 1
    month_list = [{"ym": k, "count": months[k]} for k in sorted(months.keys(), reverse=True)]

    now = dt.datetime.now(CT)
    today_mmdd = now.strftime("%m-%d")
    exact_otd = [it["id"] for it in items if it.get("mmdd") == today_mmdd]
    same_month = [it["id"] for it in items if it.get("mmdd") and it["mmdd"][:2] == now.strftime("%m")]

    dates = [it["date"] for it in items if it.get("date")]
    date_range = {"min": min(dates) if dates else None, "max": max(dates) if dates else None}

    meta_items = [{k: v for k, v in it.items() if k != "thumb"} for it in items]
    meta = {
        "at": now.isoformat(timespec="minutes"),
        "count": len(items),
        "gpsCount": sum(1 for it in items if it.get("lat") is not None and it.get("lon") is not None),
        "dateRange": date_range,
        "months": month_list,
        "sources": {s: sum(1 for it in items if it["src"] == s) for s in sorted({it["src"] for it in items})},
        "onThisDay": {"mmdd": today_mmdd, "exactIds": exact_otd, "sameMonthIds": same_month[:8]},
        "items": meta_items,
    }
    json.dump(meta, open(META_OUT, "w"), ensure_ascii=False)
    os.chmod(META_OUT, 0o600)

    full = {"at": meta["at"], "count": len(items), "dateRange": date_range, "photos": items}
    json.dump(full, open(FULL_OUT, "w"), ensure_ascii=False)
    os.chmod(FULL_OUT, 0o600)

    raw = json.dumps(full, ensure_ascii=False, sort_keys=True).encode("utf-8")
    h = hashlib.sha256(raw).hexdigest()
    if os.path.exists(ENC_OUT) and os.path.exists(HASH_OUT) and open(HASH_OUT).read() == h and "--force" not in sys.argv:
        print("photos unchanged", len(items))
        return
    pw = open(PASSCODE_FILE).read().strip().encode("utf-8")
    salt = os.urandom(16)
    iv = os.urandom(12)
    key = PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=IT).derive(pw)
    b64 = lambda x: base64.b64encode(x).decode("ascii")
    enc = {"v": 3, "kdf": "PBKDF2-SHA256", "iter": IT, "salt": b64(salt), "iv": b64(iv), "ct": b64(AESGCM(key).encrypt(iv, raw, None))}
    json.dump(enc, open(ENC_OUT, "w"))
    open(HASH_OUT, "w").write(h)
    os.chmod(HASH_OUT, 0o600)
    print(f"photos encrypted: {len(items)} photos ({meta['gpsCount']} with GPS), range {date_range['min']}..{date_range['max']}, plain={len(raw)}B, enc={os.path.getsize(ENC_OUT)}B")


if __name__ == "__main__":
    main()
