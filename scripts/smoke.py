#!/usr/bin/env python3
"""헤드리스 잠금해제 스모크: 모든 경로 방문, 페이지 오류/빈 화면 검사. 사용: smoke.py [URL] [chromium|webkit]  (webkit = iPhone 14 Safari 프로필 + 지도 타일 픽셀 검사)"""
import sys,io
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else "http://localhost:8787/"
PW=open("/workspace/bot-dashboard-secrets/passcode").read().strip()
R=["home","cats","money","inv","rich","rich:net","rich:goal","rich:cut","rich:fire","rich:dca","rich:side","rich:debt","rich:subs","rich:port","rich:watch","rich:fx","rich:opp","rich:habits","ai","ai:ask","set","set:gallery","news","news:top","brief","reco","imap","bots","x:spend","coin:BTC","fx","wx","family","c:life","conn","want","mopp","me","odd","yt","const","tl","board","interests","brief15","score","since","nwtl","nudge","recur","patterns","needs","forecast","bills14","nwchg","reply","week","watchm","globe","world","videos","inews","space","near","jarvis","wealth","life","future","play","dash","all","subs19","goals19","packages19","travel19","dday19","notes19","xprof","x","photos","memory","docs20","mailstats20","map","ai21"]
ENGINE=(sys.argv[2] if len(sys.argv)>2 else "chromium").lower()
with sync_playwright() as p:
    if ENGINE=="webkit":
        b=p.webkit.launch();dev={k:v for k,v in p.devices["iPhone 14"].items() if k!="default_browser_type"};ctx=b.new_context(**dev)
    else:
        b=p.chromium.launch(executable_path="/usr/bin/google-chrome");ctx=b.new_context(viewport={"width":390,"height":844},has_touch=True,is_mobile=True,device_scale_factor=2,reduced_motion="reduce")
    pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)[:200]));pg.goto(URL);pg.wait_for_timeout(700);pg.fill("#pw",PW);pg.click("#lf button");pg.wait_for_timeout(4000)
    bad=[]
    for r in R:
        pg.evaluate(f"location.hash={r!r}");pg.wait_for_timeout(300);t=pg.inner_text("#v")
        if "표시 오류" in t or len(t)<10: bad.append((r,t[:200]))
    # 지도 타일 픽셀 검사: 지도 영역 스크린샷의 밝기 분산이 충분해야(빈 회색/워터마크 단색 아님) 통과
    from PIL import Image, ImageStat
    tiles={}
    for rt,mid in [("globe","map20_main"),("home","map20_home"),("world","map20_world")]:
        pg.evaluate(f"location.hash={rt!r}");pg.wait_for_timeout(4500)
        loc=pg.locator("#"+mid);loc.scroll_into_view_if_needed();pg.wait_for_timeout(1200)
        im=Image.open(io.BytesIO(loc.screenshot())).convert("L");st=ImageStat.Stat(im)
        n=pg.evaluate(f"document.querySelectorAll('#{mid} .leaflet-tile-loaded').length");src=pg.evaluate(f"(document.getElementById('{mid}')||{{}}).dataset?.tiles||''")
        tiles[mid]={"loaded":n,"provider":src,"std":round(st.stddev[0],1)}
        if n<1 or st.stddev[0]<6: bad.append((mid,"blank tiles",tiles[mid]))
    print("map tiles",tiles)
    pg.evaluate("location.hash='home'");pg.wait_for_timeout(300)
    print("home18",pg.locator(".home18").count(),"dash tiles",pg.locator(".tiles.home .tile").count(),"errs",errs,"bad",bad)
    b.close()
sys.exit(1 if errs or bad else 0)
