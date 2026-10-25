#!/usr/bin/env python3
"""JARVIS 터치 탭 회귀 테스트 (390x844, 모바일 터치 에뮬레이션).
모든 카테고리·가맹점·필터 칩·세그먼트 버튼·홈 타일을 실제 tap()으로 눌러 기대한 화면/필터가 활성화되는지 확인.
사용: python scripts/tap-test.py [URL]   (암호는 비밀 폴더 passcode 파일에서 읽음, 저장소에 없음)"""
import sys,urllib.parse
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else "http://localhost:8787/"
PW=open("/workspace/bot-dashboard-secrets/passcode").read().strip()
ok=0;fail=[]
def chk(c,msg):
    global ok
    if c: ok+=1
    else: fail.append(msg)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome")
    ctx=b.new_context(viewport={"width":390,"height":844},has_touch=True,is_mobile=True,device_scale_factor=2,reduced_motion="reduce",permissions=["clipboard-read","clipboard-write"]);pg=ctx.new_page();errs=[]
    pg.on("pageerror",lambda e:errs.append(str(e)));pg.set_default_timeout(4000)
    pg.goto(URL);pg.wait_for_timeout(700);pg.fill("#pw",PW);pg.click("#lf button");pg.wait_for_timeout(4500)
    H=lambda:urllib.parse.unquote(pg.evaluate("location.hash.slice(1)"))
    V=lambda:pg.inner_text("#v")
    def nav(h): pg.evaluate(f"location.hash={h!r}");pg.wait_for_timeout(250)
    def tap(loc):
        loc.evaluate("e=>e.scrollIntoView({block:'center'})");pg.wait_for_timeout(60);loc.tap();pg.wait_for_timeout(220)
    def good(tag):
        t=V();chk(len(t)>15 and "표시 오류" not in t,f"{tag}: 빈 화면/오류")
    # 1 home tiles
    nav("home");n=pg.locator(".tiles.home .tile").count();chk(n>=20,f"home tiles {n}")
    for i in range(n):
        nav("home");t=pg.locator(".tiles.home .tile").nth(i);exp=t.get_attribute("data-go");tap(t);chk(H()==exp,f"home tile {exp} -> {H()}");good("tile "+exp)
    # 2 money segments + category / merchant bars
    for mode,pref in [("카테고리","cat:"),("가맹점","mer:")]:
        nav("money");tap(pg.locator(".seg button",has_text=mode).first);chk("on" in (pg.locator(".seg button",has_text=mode).first.get_attribute("class") or ""),f"seg {mode} active")
        cnt=pg.locator(".card .bar[data-go]").count();chk(cnt>0,f"{mode} bars {cnt}")
        for i in range(cnt):
            nav("money");tap(pg.locator(".seg button",has_text=mode).first);bar=pg.locator(".card .bar[data-go]").nth(i);exp=bar.get_attribute("data-go");name=bar.locator("span").inner_text()
            tap(bar);chk(H()==exp and H().startswith(pref),f"{mode} '{name}' -> {H()}");chk(name[:12] in V(),f"{mode} '{name}' 내용");good(exp)
    for lab in ["30일","60일","90일","주별","요일","일별"]:
        nav("money");s=pg.locator(".seg button",has_text=lab).first;tap(s);chk("on" in (pg.locator(".seg button",has_text=lab).first.get_attribute("class") or ""),f"seg {lab} active")
    nav("money");tap(pg.locator(".seg button",has_text="카테고리").first);lg=pg.locator(".dnw .lg span[data-go]")
    for i in range(lg.count()):
        nav("money");tap(pg.locator(".seg button",has_text="카테고리").first);e=pg.locator(".dnw .lg span[data-go]").nth(i);exp=e.get_attribute("data-go");tap(e);chk(H()==exp,f"legend {exp}")
    # 3 table sort + filters
    nav("money");th=pg.locator("table.tb th",has_text="금액");tap(th);chk("on" in (pg.locator("table.tb th",has_text="금액").get_attribute("class") or ""),"sort 금액 active")
    sel=pg.locator(".tf select").first;opts=[o for o in sel.locator("option").all_inner_texts() if o!="전체 분류"]
    for o in opts:
        sel.select_option(label=o);pg.wait_for_timeout(120);cats=pg.locator("table.tb tbody td:nth-child(3)").all_inner_texts();chk(cats and all(c==o for c in cats),f"filter {o}")
    sel.select_option(index=0);pg.fill("#tfq","");
    # 4 expanded chart drill (x:spend) incl. SVG bar hit targets
    for r in ["7","30","60","90"]:
        nav("x:spend");tap(pg.locator(".seg button",has_text=r+"일").first);chk("on" in (pg.locator(".seg button",has_text=r+"일").first.get_attribute("class") or ""),f"range {r} active")
    nav("x:spend");hits=pg.locator("svg .hit");hc=hits.count();chk(hc>0,"svg hits")
    for i in range(hc):
        nav("x:spend");h=pg.locator("svg .hit").nth(i);exp=h.get_attribute("data-go");tap(h);chk(H()==exp,f"svg bar {exp} -> {H()}");good(exp)
    nav("x:spend");cb=pg.locator(".card .bar[data-go]");
    for i in range(cb.count()):
        nav("x:spend");e=pg.locator(".card .bar[data-go]").nth(i);exp=e.get_attribute("data-go");tap(e);chk(H()==exp,f"x:spend bar {exp}")
        if exp.startswith("cat:"):
            m=pg.locator(".card .bar[data-go^='mer:']")
            if m.count(): e2=m.first;exp2=e2.get_attribute("data-go");tap(e2);chk(H()==exp2,f"cat->mer {exp2}");chk(pg.locator(".row[data-go^='tx:']").count()>0,f"mer tx list {exp2}")
    # 5 interest top20 chips
    nav("itop");chips=pg.locator("#itchips .chip");nc=chips.count();chk(nc>1,"itop chips")
    for i in range(nc):
        nav("itop");c=pg.locator("#itchips .chip").nth(i);v=c.get_attribute("data-v");tap(c);act=pg.locator("#itchips .chip.on");chk(act.count()==1 and act.get_attribute("data-v")==v,f"chip {v} active")
        if v: tags=pg.locator(".nrow .tchip").all_inner_texts();chk(tags and all(t==v for t in tags),f"chip {v} filter")
    nav("imap");chk(pg.locator("#itchips .chip").count()>1,"imap has top20 chips")
    # 6 news sections + source chips
    for sec in ["top","local","us","kr"]:
        nav("news:"+sec);good("news "+sec);chk(pg.locator("a.nrow").count()>0,f"news {sec} items")
        ch=pg.locator(".fchips .chip")
        for i in range(1,min(ch.count(),6)):
            nav("news:"+sec);c=pg.locator(".fchips .chip").nth(i);v=c.get_attribute("data-v");tap(c);chk(pg.locator(".fchips .chip.on").get_attribute("data-v")==v,f"news chip {v}")
    nav("news:top");tap(pg.locator(".seg button",has_text="지역 뉴스"));chk(H()=="news:local","news seg")
    # 7 weather
    for lab,st in [("30일","30"),("위성·레이더 지도","map"),("7일","7")]:
        nav("wx");tap(pg.locator(".seg button",has_text=lab).first);chk(pg.evaluate("window._wr")==st,f"wx {lab}")
    # 8 categories page
    nav("cats");n=pg.locator(".ctile").count()
    for i in range(n):
        nav("cats");c=pg.locator(".ctile").nth(i);exp=c.get_attribute("data-go");tap(c);chk(H()==exp,f"cat tile {exp}");good(exp)
    chk(not errs,f"page errors {errs}")
    b.close()
print(f"tap-test: {ok} passed, {len(fail)} failed");[print(" FAIL",f) for f in fail[:40]]
sys.exit(1 if fail else 0)
