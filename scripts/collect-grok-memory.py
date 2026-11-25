#!/usr/bin/env python3
"""JARVIS v20 Grok Bot memory aggregator.
Headlessly normalizes /workspace/bot-dashboard-secrets/grok-memory.json and merges
any updated bot status from data.json plus optional transcript JSONL dumps in JARVIS_DUMP.
NOTE: Live MCP ReadTranscript / SearchTranscripts / RecallMemory tools are agent-only
and cannot be invoked headlessly from cron without an agent session exporting dumps.
"""
import datetime as dt
import glob
import json
import os
import re
import sys
import zoneinfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEC = "/workspace/bot-dashboard-secrets"
OUT = os.path.join(SEC, "grok-memory.json")
CT = zoneinfo.ZoneInfo("America/Chicago")


def parse_dump_jsonl(fp):
    asks = []
    try:
        for line in open(fp, errors="ignore"):
            if not line.startswith('{"role":"user"'):
                continue
            obj = json.loads(line)
            blob = "\n".join(
                c.get("text", "")
                for c in obj.get("message", {}).get("content", [])
                if c.get("type") == "text"
            )
            if any(k in blob for k in ("<memory_context>", "[SAND_HIDDEN_PROMPT]", "[GROK_BOT_HIDDEN_PROMPT]", "[routine]", "Automation '")):
                continue
            ts_m = re.search(r"<timestamp>(.*?)</timestamp>", blob)
            uq_m = re.search(r"<user_query>\s*(.*?)\s*</user_query>", blob, re.S)
            msg = (uq_m.group(1) if uq_m else blob).strip()
            if not msg or msg.startswith(("[inbound]", "[agent]", "A non-urgent")):
                continue
            msg = re.sub(r"\s+", " ", msg)[:160]
            asks.append({"ts": ts_m.group(1) if ts_m else "", "text": msg})
    except Exception:
        pass
    return asks


def main():
    now = dt.datetime.now(CT)
    try:
        mem = json.load(open(OUT))
    except Exception:
        mem = {
            "at": now.isoformat(timespec="minutes"),
            "botsRead": 0,
            "botsTotal": 7,
            "sharedFactsCount": 0,
            "headlessNote": "Agent MCP tools (ReadTranscript/RecallMemory) required for live transcript pull; headless run refreshes dump/state.",
            "goals": [],
            "interests": [],
            "projects": [],
            "decisions": [],
            "preferences": [],
            "openTodos": [],
            "topics": [],
            "perBot": [],
            "timeline": [],
        }

    # Merge live bot statuses from data.json if available
    try:
        data = json.load(open(os.path.join(ROOT, "data.json")))
        bmap = {b.get("id"): b for b in data.get("bots") or []}
        for pb in mem.get("perBot") or []:
            bid = pb.get("id")
            if bid in bmap:
                pb["status"] = bmap[bid].get("status", pb.get("status"))
                pb["updatedAt"] = bmap[bid].get("updatedAt", pb.get("updatedAt"))
    except Exception:
        pass

    # Merge optional transcript JSONL dumps if JARVIS_DUMP is set or exists
    dump_dir = os.environ.get("JARVIS_DUMP") or os.path.join(SEC, "dumps")
    if os.path.isdir(dump_dir):
        for fp in sorted(glob.glob(os.path.join(dump_dir, "transcript_*.jsonl"))):
            asks = parse_dump_jsonl(fp)
            if asks:
                mem.setdefault("dumpMerged", 0)
                mem["dumpMerged"] += len(asks)

    mem["at"] = now.isoformat(timespec="minutes")
    mem["itemCount"] = (
        len(mem.get("goals") or [])
        + len(mem.get("interests") or [])
        + len(mem.get("projects") or [])
        + len(mem.get("decisions") or [])
        + len(mem.get("preferences") or [])
        + len(mem.get("openTodos") or [])
        + len(mem.get("timeline") or [])
    )
    json.dump(mem, open(OUT, "w"), ensure_ascii=False, indent=2)
    os.chmod(OUT, 0o600)
    print(f"grok-memory updated: bots={mem.get('botsRead',0)}, items={mem['itemCount']}")


if __name__ == "__main__":
    main()
