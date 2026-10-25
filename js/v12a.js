// JARVIS v12 · stage A — customization layer, command palette, category launcher (no personal strings here)
"use strict";
const ALLTABS=[["home","⌂","홈"],["cats","▦","분류"],["money","$","돈"],["rich","◆","부자"],["inv","↗","투자"],["ai","✧","AI"],["imap","◎","관심사"],["bots","⬡","봇"],["reco","✦","추천"],["set","⚙","설정"]];
const DEFTABS=["home","cats","money","rich","inv","ai","imap","bots"];
const DEFV={"기본":{only:null},"아침":{only:["ai","flow","wx","bills","news:top","news:local","mailx","fortune","habits"]},"투자":{only:["nw","goal","coin:BTC","coin:ETH","coin:XRP","fx","paper","dca","watch"]},"가족":{only:["wx","bills","news:local","fortune","imap","reco"]}};
const DEFST=()=>({theme:"cyan",dens:"n",fz:1,range:"30",view:"기본",views:JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(DEFV).map(([k,v])=>[k,{only:v.only,order:[],hide:[],size:{},pin:[]}])))),tabs:DEFTABS.slice(),qa:[["AI 브리핑","ai"],["100만$ 경로","rich:goal"],["DCA","rich:dca"],["지출","x:spend"],["AI 질문","ai:ask"]],watch:["BTC","ETH","XRP","SOL"],goal:{}});
let ST;try{ST=Object.assign(DEFST(),JSON.parse(localStorage.getItem("jv_set")||"{}"))}catch(e){ST=DEFST()}
if(!ST.views||!Object.keys(ST.views).length)ST.views=DEFST().views;if(!ST.views[ST.view])ST.view=Object.keys(ST.views)[0];
const saveST=()=>{try{localStorage.setItem("jv_set",JSON.stringify(ST))}catch(e){}};
const VW=()=>{const v=ST.views[ST.view];v.order=v.order||[];v.hide=v.hide||[];v.size=v.size||{};v.pin=v.pin||[];return v};
function applyST(){const h=document.documentElement;h.dataset.theme=ST.theme;h.dataset.dens=ST.dens;h.style.setProperty("--fz",String(ST.fz));
 const keep=(ST.tabs||DEFTABS).map(k=>ALLTABS.find(t=>t[0]===k)).filter(Boolean);TABS.splice(0,TABS.length,...keep);const tb=$("tabs");if(tb)tb.style.gridTemplateColumns=`repeat(${TABS.length},1fr)`;
 if(ST.range&&!window._xrSet){window._xr=+ST.range;window._xrSet=1}}
applyST();
// ---- extra widgets registry (stages B/C push into XW) ----
const XW=[];
function allW(){let b=[];try{b=homeTiles()}catch(e){}const x=XW.map(f=>{try{return f()}catch(e){return null}}).filter(Boolean);return [...x,...b]}
function orderedW(withHidden){const v=VW(),A=allW(),by=Object.fromEntries(A.map(t=>[t.k,t]));let keys=A.map(t=>t.k);if(v.only)keys=[...v.only.filter(k=>by[k]),...(v.order||[]).filter(k=>by[k]&&!v.only.includes(k))];
 const ord=v.order.filter(k=>keys.includes(k));keys=[...ord,...keys.filter(k=>!ord.includes(k))];keys=[...v.pin.filter(k=>keys.includes(k)),...keys.filter(k=>!v.pin.includes(k))];
 if(!withHidden)keys=keys.filter(k=>!v.hide.includes(k));return keys.map(k=>by[k])}
function hTile(t){const v=VW(),sz=v.size[t.k]||"S",ed=window._ed;let h=mTile(t);
 h=h.replace('<div class="tile mt"',`<div class="tile mt sz-${sz}${v.hide.includes(t.k)?" hid":""}${v.pin.includes(t.k)?" pin":""}"`);
 if(ed)h=h.replace(/<\/div>$/,`<div class="edc"><span class="hd" data-hd="${esc(t.k)}">⠿</span><button data-ea="up">◀</button><button data-ea="dn">▶</button><button data-ea="sz">${sz}</button><button data-ea="pin">${v.pin.includes(t.k)?"📌":"📍"}</button><button data-ea="hide">${v.hide.includes(t.k)?"👁‍🗨":"👁"}</button></div></div>`);return h}
const LCATS=[["rec","추천","✦","#ff9f43","reco"],["money","돈","$","var(--ok)","money"],["rich","부자되기","◆","#ffd166","rich"],["inv","투자·코인","↗","var(--warn)","inv"],["ai","AI","✧","#c084fc","ai"],["news","뉴스","◉","#7dd3fc","news"],["life","일정·생활","◷","var(--c)","c:life"],["mail","메일·연락","✉","var(--work)","c:mail"],["grow","성장·학습","✎","#a78bfa","c:grow"],["imap","관심사","◎","#e879f9","imap"],["family","가족","♥","#fb7185","family"],["bots","봇·시스템","⬡","#38e08c","bots"],["conn","연결","⇄","#9fb9c2","conn"],["set","설정","⚙","#9fb9c2","set"]];
V.home=()=>{const v=VW(),ed=window._ed,keys=orderedW(ed);
 return `<div class="vchips">${Object.keys(ST.views).map(n=>`<button class="${n===ST.view?"on":""}" data-act="view:${esc(n)}" data-view="${esc(n)}">${esc(n)}</button>`).join("")}<button id="edBtn" class="${ed?"on":""}" data-act="edit">${ed?"✓ 완료":"✎ 편집"}</button><button data-go="set:gallery">＋ 위젯</button><button data-act="pal">⌘</button></div>
 <div class="qa">${(ST.qa||[]).map(q=>`<button data-go="${esc(q[1])}">${esc(q[0])}</button>`).join("")}</div>
 <div class="cchips">${LCATS.filter(c=>c[0]!=="set").map(([k,l,ic,col,to])=>`<button data-go="${esc(to)}" style="--tone:${col}"><b>${ic}</b>${esc(l)}</button>`).join("")}<button data-go="brief" style="--tone:var(--c)"><b>›</b>브리핑</button></div>
 ${ed?`<div class="note">편집 모드 · ⠿ 길게 눌러 끌기 · ◀▶ 순서 · S/M/L 크기 · 📌 고정 · 👁 숨김 (보기 '${esc(ST.view)}'에 저장)</div>`:""}
 <div class="tiles home${ed?" ed":""}" id="htiles">${keys.map(hTile).join("")}</div>`};
// ---- action delegation (window capture → runs before the data-go handler) ----
const ACT={};
window.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-act],[data-ea]");const inEd=window._ed&&e.target.closest&&e.target.closest("#htiles .tile");
 if(!t&&!inEd)return;if(t&&t.hasAttribute("data-ea")){e.preventDefault();e.stopPropagation();const k=t.closest(".tile").getAttribute("data-k");edA(t.getAttribute("data-ea"),k);return}
 if(!t){e.preventDefault();e.stopPropagation();return}e.preventDefault();e.stopPropagation();const a=t.getAttribute("data-act"),i=a.indexOf(":"),n=i<0?a:a.slice(0,i),arg=i<0?"":a.slice(i+1);if(ACT[n])ACT[n](arg,t,e)},true);
ACT.view=n=>{ST.view=n;saveST();render()};ACT.edit=()=>{window._ed=!window._ed;if(cur()!=="home")go("home");else render()};
function edA(a,k){const v=VW(),keys=orderedW(true).map(t=>t.k),i=keys.indexOf(k);
 if(a==="up"||a==="dn"){const j=a==="up"?i-1:i+1;if(j<0||j>=keys.length)return;[keys[i],keys[j]]=[keys[j],keys[i]];v.order=keys;if(v.pin.includes(k)!==v.pin.includes(keys[i])){}}
 if(a==="sz"){const s=["S","M","L"],c=v.size[k]||"S";v.size[k]=s[(s.indexOf(c)+1)%3]}
 if(a==="pin"){v.pin=v.pin.includes(k)?v.pin.filter(x=>x!==k):[k,...v.pin]}
 if(a==="hide"){v.hide=v.hide.includes(k)?v.hide.filter(x=>x!==k):[...v.hide,k]}
 if(v.only&&!v.only.includes(k))v.only.push(k);saveST();render()}
// long-press drag on the ⠿ handle (pointer events: touch + mouse)
let DG=null;
document.addEventListener("pointerdown",e=>{const h=e.target.closest&&e.target.closest("[data-hd]");if(!h)return;e.preventDefault();const k=h.getAttribute("data-hd");DG={k,on:false,t:setTimeout(()=>{DG&&(DG.on=true);const el=h.closest(".tile");el&&el.classList.add("drag");navigator.vibrate&&navigator.vibrate(15)},220)}},true);
document.addEventListener("pointermove",e=>{if(!DG||!DG.on)return;e.preventDefault();document.querySelectorAll("#htiles .tile.tgt").forEach(x=>x.classList.remove("tgt"));const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest("#htiles .tile");if(t)t.classList.add("tgt")},{passive:false});
document.addEventListener("pointerup",e=>{if(!DG)return;clearTimeout(DG.t);const d=DG;DG=null;if(!d.on)return;const el=document.elementFromPoint(e.clientX,e.clientY),t=el&&el.closest("#htiles .tile");
 if(t){const to=t.getAttribute("data-k");if(to&&to!==d.k){const v=VW(),keys=orderedW(true).map(x=>x.k).filter(x=>x!==d.k);const j=keys.indexOf(to);keys.splice(j+1,0,d.k);v.order=keys;v.pin=v.pin.filter(x=>x!==d.k);if(v.only&&!v.only.includes(d.k))v.only.push(d.k);saveST();T("순서 저장됨")}}render()},true);
// ---- launcher ----
function lcData(k){const f=F();try{switch(k){
 case"rec":{const R=(RC().items||[]);return [R.length+"<small>개</small>","오늘의 추천·운세",""]}
 case"rich":{const n=typeof NWv==="function"?NWv():f.net;return [money(n),"순자산 · 목표 경로 · FIRE · DCA",""]}
 case"ai":{const a=D.ai||{};return [a.anomalies?(a.anomalies.length+"<small>이상 · "+(a.risks||[]).length+" 위험</small>"):"—","브리핑 · 어시스턴트 · 인사이트",""]}
 case"news":{const S=NW().sections||{},n=Object.values(S).reduce((a,l)=>a+l.length,0);return [n+"<small>건</small>","주요·지역·미국·한국",chBars(Object.keys(SECN).map(s=>(S[s]||[]).length),{h:34,color:"#7dd3fc"})]}
 case"family":return ["♥","가족·학교 · 일정",""]
 case"set":return ["⚙","테마 · 보기 · 탭 · 백업",""]
 default:{const r=catChart(k);return r}}}catch(e){return ["—","데이터 없음",""]}}
V.cats=()=>`${H2("카테고리",LCATS.length+"개 · 눌러서 열기")}<div class="cgrid">${LCATS.map(([k,l,ic,col,to])=>{const [v,s,ch]=lcData(k);return `<div class="ctile" style="--tone:${col}" data-go="${esc(to)}"><div class="t"><b style="color:${col}">${ic}</b> ${esc(l)}</div><div class="v">${v||"—"}</div><div class="cx">${esc(s||"")}</div>${ch||""}</div>`}).join("")}</div>`;
if(!V.news._v12){const _nv=V.news;V.news=a=>a?_nv(a):(H2("뉴스","섹션")+`<div class="tiles home">${newsTiles().map(mTile).join("")}</div>`);V.news._v12=1}
// ---- settings ----
const SEG=(cur,opts,act)=>`<div class="seg">${opts.map(o=>`<button class="${String(o[0])===String(cur)?"on":""}" data-act="${act}:${o[0]}">${esc(o[1])}</button>`).join("")}</div>`;
ACT.theme=v=>{ST.theme=v;saveST();applyST();render()};ACT.dens=v=>{ST.dens=v;saveST();applyST();render()};ACT.fz=v=>{ST.fz=+v;saveST();applyST();render()};ACT.range=v=>{ST.range=v;window._xr=+v;saveST();render()};
ACT.tab=k=>{ST.tabs=ST.tabs.includes(k)?ST.tabs.filter(x=>x!==k):[...ST.tabs,k];if(!ST.tabs.length)ST.tabs=["home"];saveST();applyST();render()};
ACT.tmv=a=>{const [k,d]=a.split("|"),i=ST.tabs.indexOf(k),j=i+(+d);if(i<0||j<0||j>=ST.tabs.length)return;[ST.tabs[i],ST.tabs[j]]=[ST.tabs[j],ST.tabs[i]];saveST();applyST();render()};
ACT.vadd=()=>{const n=($("vnm").value||"").trim();if(!n)return T("보기 이름 입력");if(!ST.views[n])ST.views[n]={only:null,order:[],hide:[],size:{},pin:[]};ST.view=n;saveST();T("보기 '"+n+"' 추가됨");render()};
ACT.vren=()=>{const n=($("vnm").value||"").trim();if(!n||ST.views[n])return T("새 이름 입력");ST.views[n]=ST.views[ST.view];delete ST.views[ST.view];ST.view=n;saveST();render()};
ACT.vdel=n=>{if(Object.keys(ST.views).length<2)return T("마지막 보기는 삭제 불가");delete ST.views[n];if(ST.view===n)ST.view=Object.keys(ST.views)[0];saveST();render()};
ACT.qadd=()=>{const l=($("qal").value||"").trim(),g=$("qag").value;if(!l)return T("이름 입력");ST.qa.push([l,g]);saveST();T("빠른 실행 추가");render()};
ACT.qdel=i=>{ST.qa.splice(+i,1);saveST();render()};ACT.qmv=a=>{const [i,d]=a.split("|").map(Number),j=i+d;if(j<0||j>=ST.qa.length)return;[ST.qa[i],ST.qa[j]]=[ST.qa[j],ST.qa[i]];saveST();render()};
ACT.exp=()=>{const b=new Blob([JSON.stringify({v:12,settings:ST},null,1)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="jarvis-settings-"+TODAY()+".json";document.body.appendChild(a);a.click();a.remove();T("설정 내보냄 (개인 데이터 없음)")};
ACT.imp=()=>{const i=document.createElement("input");i.type="file";i.accept=".json";i.onchange=async()=>{try{const j=JSON.parse(await i.files[0].text());ST=Object.assign(DEFST(),j.settings||j);saveST();applyST();T("설정 가져옴");render()}catch(e){T("가져오기 실패")}};i.click()};
ACT.rst=(a,el)=>{if(!el.classList.contains("arm")){el.classList.add("arm");el.textContent="한 번 더 누르면 초기화";return}ST=DEFST();saveST();window._ed=false;applyST();T("초기화됨");render()};
ACT.gw=k=>{const v=VW();v.hide=v.hide.includes(k)?v.hide.filter(x=>x!==k):[...v.hide,k];if(v.only&&!v.only.includes(k)){v.only.push(k);v.hide=v.hide.filter(x=>x!==k)}saveST();render()};
const ROUTES=()=>{const r=[["home","홈"],["cats","카테고리"],["ai","AI 브리핑"],["ai:ask","AI 어시스턴트"],["rich","부자되기"],["money","돈"],["inv","투자·코인"],["news","뉴스"],["set","설정"],["set:gallery","위젯 갤러리"],["brief","브리핑"],["reco","추천"],["imap","관심사"],["bots","봇"]];(typeof RICH!=="undefined"?RICH:[]).forEach(x=>r.push(["rich:"+x[0],x[1]]));return r};
V.set=a=>{if(a==="gallery"){const v=VW(),A=allW();return H2("위젯 갤러리",`보기 '${ST.view}' · 탭해서 켜기/끄기`)+`<div class="gal">${A.map(t=>{const onn=(v.only?v.only.includes(t.k):true)&&!v.hide.includes(t.k);return `<button class="gw ${onn?"on":""}" data-gw="${esc(t.k)}" data-act="gw:${esc(t.k)}"><i style="background:${SC[t.tone]||t.tone||"var(--c)"}"></i>${esc(t.t)}<b>${onn?"✓":"+"}</b></button>`}).join("")}</div>`}
 const tl=ST.tabs.map(k=>ALLTABS.find(t=>t[0]===k)).filter(Boolean);
 return H2("설정","기기에만 저장 · 내보내기/가져오기 가능")+card(`<div class="sl"><b>테마</b>${SEG(ST.theme,[["cyan","시안"],["green","그린"],["amber","앰버"],["minimal","미니멀"],["light","라이트"]],"theme")}</div>
 <div class="sl"><b>밀도</b>${SEG(ST.dens,[["c","촘촘"],["n","보통"],["r","넉넉"]],"dens")}</div><div class="sl"><b>글자 크기</b>${SEG(ST.fz,[[0.9,"작게"],[1,"보통"],[1.15,"크게"]],"fz")}</div><div class="sl"><b>기본 기간</b>${SEG(ST.range,[["7","7일"],["30","30일"],["60","60일"],["90","90일"]],"range")}</div>`)
 +H2("보기 (홈 레이아웃)","현재 '"+ST.view+"'")+card(`<div class="xb">${Object.keys(ST.views).map(n=>`<span class="cb ${n===ST.view?"on":""}"><button data-act="view:${esc(n)}">${esc(n)}</button><button data-act="vdel:${esc(n)}" data-vdel="${esc(n)}">✕</button></span>`).join("")}</div><div class="xb"><input id="vnm" placeholder="보기 이름"><button class="btn" id="vadd" data-act="vadd">추가</button><button class="btn" id="vren" data-act="vren">현재 이름 변경</button><button class="btn" data-act="edit" data-go="home">홈에서 편집</button></div>`)
 +H2("하단 탭","켜기/끄기 · 순서")+card(`<div class="xb">${ALLTABS.map(t=>`<button class="cb ${ST.tabs.includes(t[0])?"on":""}" data-tab="${t[0]}" data-act="tab:${t[0]}">${t[1]} ${esc(t[2])}</button>`).join("")}</div>${tl.map(t=>`<div class="row nl"><div class="m"><b>${t[1]} ${esc(t[2])}</b></div><button class="btn" data-tmv="${t[0]}:-1" data-act="tmv:${t[0]}|-1">▲</button><button class="btn" data-tmv="${t[0]}:1" data-act="tmv:${t[0]}|1">▼</button></div>`).join("")}`)
 +H2("빠른 실행","홈 상단 버튼")+card(`${ST.qa.map((q,i)=>`<div class="row nl"><div class="m"><b>${esc(q[0])}</b><span>${esc(q[1])}</span></div><button class="btn" data-qmv="${i}" data-act="qmv:${i}|-1">▲</button><button class="btn" data-qdel="${i}" data-act="qdel:${i}">✕</button></div>`).join("")}<div class="xb"><input id="qal" placeholder="버튼 이름"><select id="qag">${ROUTES().map(r=>`<option value="${esc(r[0])}">${esc(r[1])}</option>`).join("")}</select><button class="btn" id="qadd" data-act="qadd">추가</button></div>`)
 +H2("백업","설정만 · 개인 데이터 제외")+card(`<div class="xb"><button class="btn" id="sexp" data-act="exp">내보내기</button><button class="btn" id="simp" data-act="imp">가져오기</button><button class="btn" id="srst" data-act="rst">초기화</button></div>`)
 +H2("단축키","데스크톱")+card(`<div class="kb">${[["Ctrl/⌘ K","명령 팔레트"],["/","검색"],["Esc","닫기"],["g h · g r · g a · g m · g i · g s","홈 · 부자 · AI · 돈 · 투자 · 설정"],["e","홈 편집 모드"],["1–9","탭 이동"],["?","팔레트"]].map(x=>`<div><kbd>${esc(x[0])}</kbd> ${esc(x[1])}</div>`).join("")}</div>`)};
// ---- command palette ----
function palItems(){const it=[];ROUTES().forEach(r=>it.push({l:r[1],s:r[0],go:r[0]}));LCATS.forEach(c=>it.push({l:c[1]+" (카테고리)",s:c[4],go:c[4]}));
 try{allW().forEach(t=>it.push({l:t.t,s:"위젯 · "+t.k,go:t.to||XTO[t.k]||t.k}))}catch(e){}Object.keys(ST.views).forEach(n=>it.push({l:"보기: "+n,s:"홈 레이아웃",act:"view:"+n}));
 [["cyan","시안"],["green","그린"],["amber","앰버"],["minimal","미니멀"],["light","라이트"]].forEach(t=>it.push({l:"테마: "+t[1],s:"설정",act:"theme:"+t[0]}));it.push({l:"편집 모드",s:"홈 위젯 배치",act:"edit"});
 (window.PALX||[]).forEach(x=>it.push(x));return it}
function openPal(q){let p=$("pal");if(!p){p=document.createElement("div");p.id="pal";p.innerHTML=`<div class="pb"><input id="palq" placeholder="이동·명령 검색 (예: DCA, 테마, 뉴스)" autocomplete="off"><div id="pall"></div></div>`;document.body.appendChild(p);
  p.addEventListener("click",e=>{if(e.target===p)closePal()});$("palq").oninput=palR;$("palq").onkeydown=e=>{if(e.key==="Enter"){const f=$("pall").querySelector("[data-pa]");f&&f.click()}if(e.key==="Escape")closePal()}}
 p.classList.add("on");$("palq").value=q||"";palR();setTimeout(()=>$("palq").focus(),30)}
function palR(){const q=$("palq").value.trim().toLowerCase(),it=palItems().filter(x=>!q||(x.l+" "+x.s).toLowerCase().includes(q)).slice(0,40);window._pi=it;$("pall").innerHTML=it.map((x,i)=>`<div class="pi" data-pa="${i}" data-act="pa:${i}"><b>${esc(x.l)}</b><span>${esc(x.s)}</span></div>`).join("")||`<div class="note">결과 없음</div>`}
function closePal(){const p=$("pal");p&&p.classList.remove("on")}
ACT.pal=()=>openPal();ACT.pa=i=>{const x=window._pi[+i];closePal();if(!x)return;if(x.go)go(x.go);else if(x.act){const j=x.act.indexOf(":"),n=j<0?x.act:x.act.slice(0,j);ACT[n]&&ACT[n](j<0?"":x.act.slice(j+1),document.createElement("b"))}};
(()=>{const f=document.createElement("button");f.id="fab";f.textContent="⌘";f.title="명령 팔레트 (Ctrl/⌘K)";f.setAttribute("data-act","pal");document.body.appendChild(f)})();
let GK=0;document.addEventListener("keydown",e=>{const tg=e.target,typing=tg&&(tg.tagName==="INPUT"||tg.tagName==="TEXTAREA"||tg.tagName==="SELECT");
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openPal();return}if(e.key==="Escape"){closePal();if(window._ed){window._ed=false;render()}return}if(typing||e.ctrlKey||e.metaKey||e.altKey)return;
 if(GK&&Date.now()-GK<1200){GK=0;const m={h:"home",r:"rich",a:"ai",m:"money",i:"inv",s:"set",n:"news",c:"cats",b:"bots"}[e.key];if(m){e.preventDefault();go(m)}return}
 if(e.key==="g"){GK=Date.now();return}if(e.key==="/"){e.preventDefault();$("q").focus();return}if(e.key==="?"){openPal();return}if(e.key==="e"&&cur()==="home"){window._ed=!window._ed;render();return}
 if(/^[1-9]$/.test(e.key)){const t=TABS[+e.key-1];if(t)go(t[0])}});
Object.assign(TITLE,{set:"설정",rich:"부자되기",ai:"AI",news:"뉴스",cats:"카테고리"});
// keep tab highlighting for new sections
const _render0=render;render=function(){applyST();_render0();const k=cur().split(":")[0];if(["rich","ai","set"].includes(k)){document.querySelectorAll("#tabs button").forEach((b,i)=>b.classList.toggle("on",TABS[i]&&TABS[i][0]===k))}};
if(D)render();
window.addEventListener("hashchange",()=>closePal());
