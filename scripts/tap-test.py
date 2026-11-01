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
    pg.add_init_script("speechSynthesis.speak=u=>{(window._spk=window._spk||[]).push(u.text)};speechSynthesis.cancel=()=>{window._cn=(window._cn||0)+1}")
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
    # ===== 9 v12 customization =====
    on=lambda loc:"on" in (loc.get_attribute("class") or "")
    nav("home");tap(pg.locator(".vchips [data-view='투자']"));chk(on(pg.locator(".vchips [data-view='투자']")),"view 투자 active")
    n2=pg.locator("#htiles .tile").count();tap(pg.locator(".vchips [data-view='기본']"));chk(pg.locator("#htiles .tile").count()>n2,f"view 기본 shows more tiles {n2}")
    tap(pg.locator("#edBtn"));chk(pg.locator("#htiles.ed").count()==1,"edit mode on")
    k0=pg.locator("#htiles .tile").nth(0).get_attribute("data-k");tap(pg.locator("#htiles .tile").nth(0).locator("[data-ea='dn']"));chk(pg.locator("#htiles .tile").nth(1).get_attribute("data-k")==k0,"edit move ▶")
    tap(pg.locator(f"#htiles .tile[data-k='{k0}'] [data-ea='sz']"));chk("sz-M" in pg.locator(f"#htiles .tile[data-k='{k0}']").get_attribute("class"),"edit size S→M")
    k5=pg.locator("#htiles .tile").nth(5).get_attribute("data-k");tap(pg.locator(f"#htiles .tile[data-k='{k5}'] [data-ea='pin']"));chk(pg.locator("#htiles .tile").nth(0).get_attribute("data-k")==k5,"pin → first")
    k2=pg.locator("#htiles .tile").nth(2).get_attribute("data-k");tap(pg.locator(f"#htiles .tile[data-k='{k2}'] [data-ea='hide']"));chk("hid" in pg.locator(f"#htiles .tile[data-k='{k2}']").get_attribute("class"),"hide toggled")
    a=pg.locator("#htiles .tile").nth(3);ka=a.get_attribute("data-k");a.locator(".hd").evaluate("e=>e.scrollIntoView({block:'center'})");pg.wait_for_timeout(100);ha=a.locator(".hd").bounding_box();bb=pg.locator("#htiles .tile").nth(5).bounding_box()
    pg.mouse.move(ha["x"]+6,ha["y"]+6);pg.mouse.down();pg.wait_for_timeout(400);pg.mouse.move(bb["x"]+bb["width"]/2,bb["y"]+bb["height"]/2,steps=8);pg.mouse.up();pg.wait_for_timeout(300)
    ks=[x.get_attribute("data-k") for x in pg.locator("#htiles .tile").all()];chk(ks.index(ka)!=3,f"drag reorder {ka} -> {ks.index(ka)}")
    tap(pg.locator("#edBtn"));chk(pg.locator("#htiles.ed").count()==0 and pg.locator(f"#htiles .tile[data-k='{k2}']").count()==0,"edit off, hidden tile gone")
    tap(pg.locator("#fab"));chk(pg.locator("#pal.on").count()==1,"palette open via ⌘ button");pg.fill("#palq","DCA");pg.wait_for_timeout(100);tap(pg.locator("#pall .pi").first);chk(H()=="rich:dca",f"palette → rich:dca {H()}");chk(pg.locator("#pal.on").count()==0,"palette closed")
    pg.keyboard.press("Control+k");pg.wait_for_timeout(200);chk(pg.locator("#pal.on").count()==1,"Ctrl-K opens");pg.keyboard.type("설정");pg.keyboard.press("Enter");pg.wait_for_timeout(300);chk(H()=="set","palette enter → set")
    pg.evaluate("document.activeElement.blur()");pg.keyboard.press("g");pg.keyboard.press("r");pg.wait_for_timeout(250);chk(H()=="rich","shortcut g r")
    # ===== 10 wealth suite =====
    nav("rich");cnt=pg.locator(".tiles.home .tile").count();chk(cnt==13,f"rich tiles {cnt}")
    for i in range(cnt):
        nav("rich");t=pg.locator(".tiles.home .tile").nth(i);exp=t.get_attribute("data-go");tap(t);chk(H()==exp,f"rich tile {exp}");good(exp)
    nav("rich:goal");b0=pg.inner_text("#pj");pg.locator("[data-sl='monthly']").evaluate("e=>{e.value=3000;e.dispatchEvent(new Event('input',{bubbles:true}))}");pg.wait_for_timeout(150);chk(pg.inner_text("#pj")!=b0,"goal slider updates projection");chk(pg.locator("#pj svg path").count()>=4,"projection lines + MC band")
    pg.locator("[data-sl='cut0']").evaluate("e=>{e.value=20;e.dispatchEvent(new Event('input',{bubbles:true}))}");pg.wait_for_timeout(150);chk("단축" in pg.inner_text("#pj"),"cut slider → years saved")
    nav("rich:dca")
    for s2 in ["ETH","SPY","BTC"]:
        tap(pg.locator(f"[data-ds='{s2}']"));chk(on(pg.locator(f"[data-ds='{s2}']")),f"dca {s2} active");chk("평가액" in V(),f"dca {s2} result")
    tap(pg.locator(".seg button",has_text="매일"));chk(on(pg.locator(".seg button",has_text="매일")),"dca freq active")
    nav("rich:side");pg.fill("#ss","tapcheck");pg.fill("#sa","123");tap(pg.locator("#sadd"));chk("tapcheck" in V() and "$123" in V(),"side income add")
    tap(pg.locator("[data-del^='side:']").first);chk("tapcheck" not in V(),"side income delete")
    nav("rich:habits");tap(pg.locator("[data-hab='0']"));chk(on(pg.locator("[data-hab='0']")),"habit check on");nav("home");nav("rich:habits");chk(on(pg.locator("[data-hab='0']")),"habit persists");tap(pg.locator("[data-hab='0']"))
    nav("rich:subs");sb=pg.locator("[data-sub]").first;nm=sb.get_attribute("data-sub");tap(sb);chk(on(pg.locator("[data-sub]").first),"sub select on");tap(pg.locator("[data-sub]").first)
    nav("rich:watch");pg.fill("#wls","DOGE");tap(pg.locator("#wladd"));chk("DOGE" in V(),"watch add");tap(pg.locator("[data-wdel='crypto:DOGE']"));chk("DOGE" not in V(),"watch remove")
    nav("rich:opp");oc=pg.locator("[data-ot]").count();chk(oc>1,"opp chips")
    for i in range(oc):
        nav("rich:opp");c=pg.locator("[data-ot]").nth(i);v=c.get_attribute("data-ot");tap(c);chk(on(pg.locator(f"[data-ot='{v}']")),f"opp chip {v or '전체'}")
    # ===== 11 AI =====
    nav("ai");good("ai");chk(pg.locator(".act").count()==3,"3 next actions")
    a0=pg.locator(".act").first;exp=a0.get_attribute("data-go");tap(a0);chk(H()==exp,"action tap → "+exp)
    nav("ai:ask");tap(pg.locator("[data-apc]").nth(1));chk(on(pg.locator("[data-apc]").nth(1)),"prompt category active")
    tap(pg.locator("[data-ap]").first);chk(len(pg.input_value("#aiq"))>10,"prompt fills textarea")
    tap(pg.locator("[data-ctx='news']"));chk(on(pg.locator("[data-ctx='news']")),"ctx chip on");chk("관심 뉴스" in pg.locator("#aipv").text_content(),"ctx in prompt")
    tap(pg.locator("#aicopy"));clip=pg.evaluate("navigator.clipboard.readText()");chk("[JARVIS 문맥" in clip and "[질문]" in clip,"prompt copied to clipboard")
    nav("home");pg.fill("#txt","자비스 이번 달 어디서 줄일까");pg.locator("#txt").press("Enter");pg.wait_for_timeout(400);chk(H()=="ai:ask" and "줄일까" in pg.input_value("#aiq"),"command bar → AI assistant")
    # ===== 13 v13 visuals =====
    nav("home");chk(pg.locator(".whero .fst").count()==5,"funnel 5 stages");chk("$" in pg.locator(".whero .fst").first.inner_text(),"funnel real income")
    f2=pg.locator(".whero .fst").nth(1);ex=f2.get_attribute("data-go");tap(f2);chk(H()==ex,"funnel stage → "+ex)
    nav("home");tap(pg.locator(".nav13 [data-go='const']"));chk(H()=="const","home → constellation")
    chk(pg.locator(".cnode").count()==9,"9 domain nodes");chk(pg.locator(".cdot").count()>20,"item dots")
    tap(pg.locator(".pill[data-act='cf:money']"));chk(on(pg.locator(".pill[data-act='cf:money']")) and pg.locator(".clg").count()==1,"pill filter money")
    tap(pg.locator(".cnode[data-act='cf:inv']"));chk(on(pg.locator(".pill[data-act='cf:inv']")),"node tap filters")
    tap(pg.locator("[data-act='cvw:list']"));chk(pg.locator(".csvg").count()==0 and pg.locator(".clist .row").count()>0,"list toggle");tap(pg.locator("[data-act='cvw:sky']"));tap(pg.locator(".pill[data-act='cf:all']"))
    d0=pg.locator(".cdot").first;ex=d0.get_attribute("data-go");d0.dispatch_event("click");pg.wait_for_timeout(250);chk(H()==ex,"dot → "+ex)
    nav("tl");chk(pg.locator(".tlb").count()>3,"timeline bars");chk(pg.locator(".tlh").count()==35,"35 day columns")
    g=pg.locator("[data-act^='tlf:']").nth(1);tap(g);chk(on(g),"timeline filter");tap(pg.locator("[data-act='tlf:all']"))
    b0=pg.locator(".tlb").first;ex=b0.get_attribute("data-go");tap(b0);chk(H()==ex,"bar → "+ex)
    nav("board");n0=pg.locator(".kc").count();chk(n0>0,"board seeded");pg.fill("#kin","테스트카드");tap(pg.locator("[data-act='badd']"));chk(pg.locator(".kc",has_text="테스트카드").count()==1,"card added")
    c=pg.locator(".kc",has_text="테스트카드");cid=c.get_attribute("data-id");tap(c.locator("[data-act^='bm:']"));chk(pg.locator(f".kcol[data-col='doing'] .kc[data-id='{cid}']").count()==1,"card ▶ to 진행")
    st=pg.locator(f".kc[data-id='{cid}'] .stars");s0=st.inner_text();tap(st);chk(pg.locator(f".kc[data-id='{cid}'] .stars").inner_text()!=s0,"priority star")
    h=pg.locator(f".kc[data-id='{cid}'] .kd");h.scroll_into_view_if_needed();bb=h.bounding_box();tgt=pg.locator(".kcol[data-col='look']").bounding_box()
    pg.mouse.move(bb["x"]+5,bb["y"]+5);pg.mouse.down();pg.mouse.move(tgt["x"]+40,bb["y"]+5,steps=5);pg.mouse.up();pg.wait_for_timeout(300)
    chk(pg.locator(f".kcol[data-col='look'] .kc[data-id='{cid}']").count()==1,"drag card → 알아보기")
    nd=pg.locator(".dec").count()
    if nd: tap(pg.locator(".dec .btnp").first);chk(pg.locator(".dec").count()==nd-1,"decision → board")
    pg.reload();pg.wait_for_timeout(1500)
    if pg.locator("#pw").is_visible(): pg.fill("#pw",PW);pg.click("#lf button")
    pg.wait_for_timeout(3500);nav("board");chk(pg.locator(".kc",has_text="테스트카드").count()==1,"board persisted (encrypted)")
    chk("테스트카드" not in pg.evaluate("localStorage.jv_sec||''"),"board stored encrypted")
    tap(pg.locator(f".kc[data-id='{cid}'] [data-act^='bm:']").last);tap(pg.locator(f".kc[data-id='{cid}'] [data-act^='bm:']").last);tap(pg.locator(f".kc[data-id='{cid}'] [data-act^='bm:']").last);tap(pg.locator(f".kc[data-id='{cid}'] [data-act^='bx:']"));chk(pg.locator(".kc",has_text="테스트카드").count()==0,"card delete")
    for r in ["money","inv","news","bots"]:
        nav(r);chk(pg.locator(".anat .an-st > div").count()>=1,"category hero "+r)
    nav("set");tap(pg.locator(".seg button",has_text="라이트"));chk(pg.evaluate("getComputedStyle(document.body).backgroundColor")!="rgb(0, 0, 0)" and pg.evaluate("getComputedStyle(document.documentElement).filter")=="none","real light theme (no invert)");tap(pg.locator(".seg button",has_text="시안"))
    # ===== 14 v14 =====
    nav("home");chk(pg.locator(".want").count()>=1 and pg.locator(".strip .ytc").count()>=1 and pg.locator(".oc").count()>=3,"home v14 blocks")
    nav("want");chk(len(pg.locator("#wtx").inner_text())>40,"want paragraph");chk(pg.locator(".wl li").count()==3,"3 ranked wants");chk("추정" in pg.locator(".want").inner_text(),"inference label")
    tap(pg.locator("[data-act='speak']").first);chk(not errs,"speak no error")
    tap(pg.locator("[data-act^='wfb:']").first);chk("want" in pg.evaluate("Object.keys(SECS||{})").__str__(),"want feedback stored")
    nav("mopp");n=pg.locator(".oc").count();chk(n>=8,f"opps {n}");chk(pg.locator(".oc a[href^='http']").count()==n,"every opp has source link")
    p=pg.locator("[data-act^='ocf:']").nth(1);tap(p);chk(pg.locator(".oc").count()<n,"opp filter");tap(pg.locator("[data-act='ocf:all']"))
    o=pg.locator(".oc").first;oid=o.get_attribute("data-oid");tap(o.locator("[data-act^='osave:']"));chk(pg.evaluate(f"((SECS.board||{{}}).cards||[]).some(c=>c.oid==='{oid}')"),"opp → board")
    c=pg.locator("[data-act^='ck:']").first;tap(c);chk(pg.locator("[data-act^='ck:']").first.is_checked(),"checklist check")
    nav("me");pg.locator("[data-mef='city']").fill("테스트시티");tap(pg.locator("[data-act='mesave']"));pg.wait_for_timeout(500)
    nav("odd");n=pg.locator(".odc").count();chk(n>=10,f"oddities {n}");tap(pg.locator("[data-act^='odf:']").nth(3));chk(pg.locator(".odc").count()<n,"odd filter");tap(pg.locator("[data-act='odf:all']"))
    tap(pg.locator("[data-act^='olk:']").first);tap(pg.locator("[data-act='odf:saved']"));chk(pg.locator(".odc").count()>=1,"odd like → saved")
    nav("yt");y=pg.locator(".ytc:not(.sm)");chk(y.count()==10,f"youtube exactly 10 ({y.count()})")
    chk(all("i.ytimg.com/vi/" in (y.nth(i).locator("img").get_attribute("src") or "") and "watch?v=" in (y.nth(i).locator("a.yti").get_attribute("href") or "") for i in range(y.count())),"yt thumbs+links valid")
    first=y.first.locator("a.yti").get_attribute("data-yt");tap(y.first.locator("[data-act^='ylk:']"));tap(pg.locator(".ytc:not(.sm)").first.locator("[data-act^='yno:']"));pg.wait_for_timeout(300)
    chk(pg.locator(f".ytc:not(.sm) a[data-yt='{first}']").count()==0 and pg.locator(".ytc:not(.sm)").count()==10,"not-interested replaces, still 10")
    pg.reload();pg.wait_for_timeout(1500)
    if pg.locator("#pw").is_visible(): pg.fill("#pw",PW);pg.click("#lf button")
    pg.wait_for_timeout(3500);nav("me");chk(pg.locator("[data-mef='city']").input_value()=="테스트시티","profile persisted");chk("테스트시티" not in pg.evaluate("localStorage.jv_sec||''"),"profile encrypted")
    pg.locator("[data-mef='city']").fill("");tap(pg.locator("[data-act='mesave']"))
    # ===== 14.1 TTS player + interests + Takeout importer =====
    nav("want");tap(pg.locator("[data-act='speak']").first);tp=pg.locator("#ttsp")
    chk(tp.is_visible() and pg.evaluate("(window._spk||[]).length")>=1,"tts player shows while speaking")
    c0=pg.evaluate("window._cn||0");tap(pg.locator("#ttsPause"));chk("이어듣기" in pg.locator("#ttsPause").inner_text() and pg.evaluate("window._cn||0")>c0,"tts pause (cancel workaround)")
    s0=pg.evaluate("_spk.length");tap(pg.locator("#ttsPause"));chk("일시정지" in pg.locator("#ttsPause").inner_text() and pg.evaluate("_spk.length")>s0,"tts resume re-speaks")
    pg.select_option("#ttsRate","1.2");pg.wait_for_timeout(200);chk(pg.evaluate("localStorage.jv_ttsr")=="1.2" and pg.evaluate("TTS.rate")==1.2,"tts speed 1.2")
    tap(pg.locator("#ttsStop"));chk(not tp.is_visible(),"tts stop hides player")
    tap(pg.locator("[data-act='speak']").first);nav("home");pg.wait_for_timeout(200);chk(not tp.is_visible(),"tts auto-stop on route change")
    pg.evaluate("speechSynthesis.speak(new SpeechSynthesisUtterance('브리핑 테스트입니다.'))");chk(tp.is_visible(),"legacy briefing speak uses player");tap(pg.locator("#ttsStop"))
    pg.evaluate("localStorage.jv_ttsr=1;TTS.rate=1")
    nav("me");chk(pg.locator("[data-go='interests']").count()>=1,"profile → interests link")
    nav("interests");chk("JARVIS는 이렇게 관심사를 알아요" in V(),"interests explainer");chk(pg.locator(".irow .isb",has_text="대화에서 추정").count()>=1,"conversation source badge")
    pg.fill("#iin","테스트관심사");tap(pg.locator("[data-act='iadd']"));r=pg.locator(".irow",has_text="테스트관심사");chk(r.count()==1 and "말씀하신 것" in r.inner_text(),"interest added (said)")
    ch=pg.locator("[data-act^='ipick:']").first;pt=ch.inner_text();tap(ch);chk(pg.locator(".irow",has_text=pt).filter(has_text="직접 선택").count()>=1,"interest picked")
    w0=float(r.locator(".ir-a .mut").inner_text().split()[-1]);tap(r.locator("[data-act^='iadj:']").first);r=pg.locator(".irow",has_text="테스트관심사");chk(float(r.locator(".ir-a .mut").inner_text().split()[-1])>w0,"interest boost")
    tap(r.locator("[data-act^='iwhy:']"));chk(pg.locator(".irow",has_text="테스트관심사").locator(".iwhy").count()==1,"why explainer")
    tap(pg.locator(".irow",has_text="테스트관심사").locator("[data-act^='imute:']"));chk("muted" in (pg.locator(".irow",has_text="테스트관심사").get_attribute("class") or ""),"interest mute")
    chk("테스트관심사" not in pg.evaluate("localStorage.jv_sec||''"),"interests encrypted")
    tap(pg.locator(".irow",has_text="테스트관심사").locator("[data-act^='idel:']"));chk(pg.locator(".irow",has_text="테스트관심사").count()==0,"interest delete")
    tap(pg.locator(".irow",has_text=pt).filter(has_text="직접 선택").first.locator("[data-act^='idel:']"))
    import os;fx=os.path.join(os.path.dirname(os.path.abspath(__file__)),"fixtures")
    pg.set_input_files("#tkfile",[os.path.join(fx,f) for f in ["synthetic-watch-history.json","synthetic-subscriptions.csv","synthetic-watch-history.html"]]);pg.wait_for_timeout(1200)
    t=pg.locator("#tkr").inner_text() if pg.locator("#tkr").count() else "";chk("시청 10" in t and "구독 2" in t and "시청 1 " in t,"takeout import json/csv/html: "+t.replace("\n"," | "))
    chk(pg.evaluate("IST().imp.watched")==11,"ads skipped, 11 watched");chk("test video" not in pg.evaluate("JSON.stringify(SECS)"),"only aggregates stored (no titles)")
    chk(pg.locator(".irow .isb",has_text="유튜브 기록").count()>=1,"youtube source badge");chk("1개는 아직 수집 목록에 없어요" in V(),"unmatched subscription reported")
    nav("yt");chk(pg.locator(".ytc:not(.sm)").count()==10,"yt still 10 after import");chk(pg.locator(".ytc",has_text="구독 채널").count()+pg.locator(".ytc",has_text="자주 보는 채널").count()>=1,"imported channels boost picks")
    nav("interests");tap(pg.locator("[data-act='tkclr']"));chk(pg.evaluate("JSON.stringify(IST().imp)")=="{}","import cleared")
    # ===== 12 settings =====
    nav("set")
    for th in ["라이트","앰버","시안"]:
        tap(pg.locator(".seg button",has_text=th));chk(on(pg.locator(".seg button",has_text=th)),f"theme {th}")
    chk(pg.evaluate("document.documentElement.dataset.theme")=="cyan","theme attr")
    tap(pg.locator(".seg button",has_text="크게"));chk(pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--fz').trim()")=="1.15","font size")
    tap(pg.locator(".seg button",has_text="보통").nth(1))
    tap(pg.locator(".seg button",has_text="촘촘"));chk(pg.evaluate("document.documentElement.dataset.dens")=="c","density");tap(pg.locator(".seg button",has_text="보통").first)
    first=pg.locator("#tabs button").nth(1).inner_text();tap(pg.locator("[data-tmv='money:-1']"));chk(pg.locator("#tabs button").nth(1).inner_text()!=first,"tab reorder")
    nt=pg.locator("#tabs button").count();tap(pg.locator("[data-tab='set']"));chk(pg.locator("#tabs button").count()==nt+1,"tab show 설정")
    pg.fill("#qal","테스트QA");tap(pg.locator("#qadd"));nav("home");chk("테스트QA" in pg.locator(".qa").inner_text(),"quick action added")
    nav("set");pg.fill("#vnm","테스트뷰");tap(pg.locator("#vadd"));nav("home");chk(on(pg.locator(".vchips [data-view='테스트뷰']")),"view added+active")
    nav("set:gallery");g0=pg.locator("[data-gw]").first;gk=g0.get_attribute("data-gw");st0=on(g0);tap(g0);chk(on(pg.locator(f"[data-gw='{gk}']"))!=st0,"gallery toggle")
    nav("set")
    with pg.expect_download() as dl: tap(pg.locator("#sexp"))
    chk(dl.value.suggested_filename.startswith("jarvis-settings"),"export file")
    tap(pg.locator("#srst"));tap(pg.locator("#srst"));chk(pg.evaluate("JSON.parse(localStorage.jv_set).view")=="기본","reset")
    # ===== 14.2 passcode change: device store survives =====
    OLD="synthetic-old-code-142"
    def mkctx():
        c=b.new_context(viewport={"width":390,"height":844},reduced_motion="reduce");q=c.new_page();q.on("pageerror",lambda e:errs.append(str(e)));q.set_default_timeout(4000);return c,q
    seed=f"""async()=>{{const salt=crypto.getRandomValues(new Uint8Array(16)),k=await pwKey({OLD!r},salt),iv=crypto.getRandomValues(new Uint8Array(12)),c=new Uint8Array(await crypto.subtle.encrypt({{name:"AES-GCM",iv}},k,new TextEncoder().encode(JSON.stringify({{me:{{city:"복구테스트시티"}}}}))));localStorage.setItem("jv_sec",JSON.stringify({{v:1,s:h64(salt),i:h64(iv),c:h64(c)}}));localStorage.removeItem("jv_sec_locked")}}"""
    c2,q=mkctx();q.goto(URL);q.wait_for_timeout(800);q.evaluate(seed);q.reload();q.wait_for_timeout(800)
    q.fill("#pw",PW);q.click("#lf button");q.wait_for_timeout(4500)
    chk(q.locator("#secrec").is_visible(),"old-code store → recovery prompt");chk(q.evaluate("localStorage.jv_sec_locked||''").count("c")>0 and q.evaluate("!localStorage.jv_sec"),"undecryptable store backed up, not overwritten")
    q.evaluate("location.hash='me'");q.wait_for_timeout(300);q.evaluate("saveSec()");q.wait_for_timeout(400);chk(q.evaluate("!localStorage.jv_sec"),"no save while locked")
    q.fill("#secold","wrong-code");q.click("#secgo");q.wait_for_timeout(2500);chk("맞지 않아요" in q.inner_text("#secer"),"wrong old code rejected")
    q.fill("#secold",OLD);q.click("#secgo");q.wait_for_timeout(3000);chk(q.locator("#secrec").count()==0 and q.evaluate("(SECS.me||{}).city")=="복구테스트시티","recovered with old code")
    q.wait_for_timeout(600);chk(q.evaluate("!!localStorage.jv_sec && !localStorage.jv_sec_locked"),"re-encrypted, backup cleared")
    chk(q.evaluate(f"(async()=>{{try{{await secDec(localStorage.jv_sec,{PW!r});return true}}catch(e){{return false}}}})()") and "복구테스트시티" not in q.evaluate("localStorage.jv_sec"),"store now opens with current code, encrypted")
    c2.close()
    c2,q=mkctx();q.goto(URL);q.wait_for_timeout(800);q.evaluate(seed);q.reload();q.wait_for_timeout(800);q.fill("#pw",PW);q.click("#lf button");q.wait_for_timeout(4500)
    q.click("#secskip");chk(q.locator("#secrec").count()==1 and "정말" in q.inner_text("#secskip"),"skip needs confirmation");q.click("#secskip");q.wait_for_timeout(600)
    chk(q.locator("#secrec").count()==0 and q.evaluate("JSON.parse(localStorage.jv_sec_locked).length")==1,"skip keeps backup")
    q.evaluate("ACT.secrec()");chk(q.locator("#secrec").is_visible(),"retry later from palette action");c2.close()
    c2,q=mkctx();q.goto(URL);q.wait_for_timeout(500);q.evaluate("localStorage.jv_pw='stale-remembered-code'");q.reload();q.wait_for_timeout(4000)
    chk(q.locator("#lock").is_visible() and q.locator("#pw").is_visible() and not q.evaluate("localStorage.jv_pw"),"stale remembered code → unlock screen, cleared")
    q.fill("#pw",PW);q.click("#lf button");q.wait_for_timeout(4000);chk(not q.locator("#lock").is_visible(),"then unlock works");c2.close()
    chk(not errs,f"page errors {errs}")
    b.close()
print(f"tap-test: {ok} passed, {len(fail)} failed");[print(" FAIL",f) for f in fail[:40]]
sys.exit(1 if fail else 0)
