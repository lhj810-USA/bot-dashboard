#!/usr/bin/env python3
"""JARVIS v20 extra-info collector.
Updates /workspace/bot-dashboard-secrets/extra-info.json headlessly from
collected.json (Gmail top senders/subscriptions, Drive counts) and tx-full.json
so the routine keeps extra-info stats fresh between live MCP runs.
"""
import datetime as dt
import json
import os
import zoneinfo
from collections import Counter

SEC = "/workspace/bot-dashboard-secrets"
OUT = os.path.join(SEC, "extra-info.json")
CT = zoneinfo.ZoneInfo("America/Chicago")


def main():
    now = dt.datetime.now(CT)
    try:
        extra = json.load(open(OUT))
    except Exception:
        extra = {"drive": {}, "gmail": {}, "calendar": {}, "onedrive": {}, "finance": {}, "x": {}, "sources": {"ok": [], "failed": []}}

    try:
        col = json.load(open(os.path.join(SEC, "collected.json")))
    except Exception:
        col = {}

    # Refresh Gmail top senders & subscriptions from latest collected.json
    sender_cnt = Counter()
    sub_cnt = Counter()
    for m in ((col.get("mail") or {}).get("recent") or []) + ((col.get("mail") or {}).get("important") or []):
        frm = (m.get("from") or "").split("<")[0].strip().strip('"') or m.get("from") or ""
        if frm:
            sender_cnt[frm] += 1
            if m.get("type") in ("구독·뉴스레터", "쇼핑·광고", "할인·프로모", "알림"):
                sub_cnt[frm] += 1
    for p in ((col.get("mailx") or {}).get("promoTop") or []):
        if isinstance(p, dict) and p.get("sender"):
            sub_cnt[p["sender"]] += int(p.get("count") or 1)
    if sender_cnt:
        extra.setdefault("gmail", {})["topSenders"] = [{"name": k, "count": v} for k, v in sender_cnt.most_common(12)]
    if sub_cnt:
        extra.setdefault("gmail", {})["subscriptions"] = [{"name": k, "count": v} for k, v in sub_cnt.most_common(10)]

    # Filter upcoming holidays from today onward
    today_iso = now.date().isoformat()
    cal = extra.get("calendar") or {}
    if cal.get("usHolidays"):
        cal["usHolidays"] = [h for h in cal["usHolidays"] if (h.get("date") or "") >= today_iso][:10]
    if cal.get("krHolidays"):
        cal["krHolidays"] = [h for h in cal["krHolidays"] if (h.get("date") or "") >= today_iso][:10]

    extra["at"] = now.isoformat(timespec="minutes")
    json.dump(extra, open(OUT, "w"), ensure_ascii=False, indent=2)
    os.chmod(OUT, 0o600)
    print("extra-info refreshed:", extra["at"])


if __name__ == "__main__":
    main()
