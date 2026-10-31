import sys
from playwright.sync_api import sync_playwright
PW=open("/workspace/bot-dashboard-secrets/passcode").read().strip();URL=sys.argv[1] if len(sys.argv)>1 else "http://localhost:8787/"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome");ctx=b.new_context(viewport={"width":390,"height":844},is_mobile=True,has_touch=True);pg=ctx.new_page()
    cdp=ctx.new_cdp_session(pg);cdp.send("Emulation.setCPUThrottlingRate",{"rate":4})
    pg.goto(URL);pg.wait_for_timeout(800);pg.fill("#pw",PW);pg.click("#lf button");pg.wait_for_timeout(6000)
    for r in ["home","const","tl","board","money","inv","news","ai","rich"]:
        ms=pg.evaluate(f"(()=>{{location.hash={r!r};const t=performance.now();render();return performance.now()-t}})()");print(f"render {r:6s} {ms:6.1f} ms (4x CPU throttle)")
    pg.evaluate("location.hash='home'");pg.wait_for_timeout(500)
    fps=pg.evaluate("new Promise(r=>{let n=0,t=performance.now();const f=()=>{n++;if(performance.now()-t<3000)requestAnimationFrame(f);else r(n/3)};requestAnimationFrame(f)})");print(f"home rAF fps with funnel particles: {fps:.0f}")
    lt=pg.evaluate("new Promise(r=>{const a=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>a.push(e.duration))).observe({type:'longtask',buffered:true});setTimeout(()=>r(a),2000)})");print("long tasks >50ms in last window:",len([x for x in lt if x>50]))
    b.close()
