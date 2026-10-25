#!/usr/bin/env python3
"""헤드리스 잠금해제 스모크: 모든 경로 방문, 페이지 오류/빈 화면 검사. 사용: smoke.py [URL] [shots_prefix]"""
import sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else "http://localhost:8787/"
PW=open("/workspace/bot-dashboard-secrets/passcode").read().strip()
R=["home","cats","money","inv","rich","rich:net","rich:goal","rich:cut","rich:fire","rich:dca","rich:side","rich:debt","rich:subs","rich:port","rich:watch","rich:fx","rich:opp","rich:habits","ai","ai:ask","set","set:gallery","news","news:top","brief","reco","imap","bots","x:spend","coin:BTC","fx","wx","family","c:life","conn"]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome")
    ctx=b.new_context(viewport={"width":390,"height":844},has_touch=True,is_mobile=True,device_scale_factor=2,reduced_motion="reduce");pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:200]));pg.goto(URL);pg.wait_for_timeout(700);pg.fill("#pw",PW);pg.click("#lf button");pg.wait_for_timeout(4000)
    bad=[]
    for r in R:
        pg.evaluate(f"location.hash={r!r}");pg.wait_for_timeout(300);t=pg.inner_text("#v")
        if "표시 오류" in t or len(t)<10: bad.append((r,t[:200]))
    pg.evaluate("location.hash='home'");pg.wait_for_timeout(300)
    print("tiles",pg.locator(".tiles.home .tile").count(),"errs",errs,"bad",bad)
    b.close()
sys.exit(1 if errs else 0)
