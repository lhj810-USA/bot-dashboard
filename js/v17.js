/* v17 — living HUD, world globe, video wall, local JARVIS assistant */
const WLD=()=>D.world||{};
const RM17=()=>typeof RM==="function"?RM():matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ----- WMO weather in Korean ----- */
function wxDesc(c){c=+c;return c===0?"맑음":c<=3?"구름":c<=48?"안개":c<=57?"이슬비":c<=67?"비":c<=77?"눈":c<=82?"소나기":c>=95?"뇌우":"날씨 "+c}

/* ----- Living HUD (particles + neural links + core + waveform) ----- */
let _hudOn=0,_hudSpk=0,_hudRaf=0;
function hudSpeak(on){_hudSpk=on?1:0;const w=$("wave17");if(w)w.classList.toggle("off",!on)}
function ensureHud(){
  if(!$("hudfx")){const c=document.createElement("canvas");c.id="hudfx";document.body.prepend(c)}
  if(!$("wave17")){const w=document.createElement("div");w.id="wave17";w.className="wave17 off";w.innerHTML="<i></i><i></i><i></i><i></i><i></i><i></i>";document.body.appendChild(w)}
  const hd=document.querySelector(".hd h1");
  if(hd&&!$("jcore")){const b=document.createElement("button");b.id="jcore";b.title="JARVIS";b.setAttribute("data-go","jarvis");b.innerHTML="<canvas width='72' height='72'></canvas>";hd.parentNode.insertBefore(b,hd)}
}
function startHud(){
  ensureHud();
  const fx=$("hudfx"),core=$("jcore")&&$("jcore").querySelector("canvas");
  if(!fx)return;
  const red=RM17();
  function size(){fx.width=innerWidth;fx.height=innerHeight}
  size();
  const N=red?0:(innerWidth<700?28:56);
  const P=Array.from({length:N},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4}));
  let t0=0;
  function frame(ts){
    if(!_hudOn)return;
    if(document.hidden){_hudRaf=requestAnimationFrame(frame);return}
    if(ts-t0<33){_hudRaf=requestAnimationFrame(frame);return} // 30fps
    t0=ts;
    const ctx=fx.getContext("2d");if(!ctx)return;
    ctx.clearRect(0,0,fx.width,fx.height);
    const boost=_hudSpk?1.8:1,pulse=.55+.45*Math.sin(ts/800);
    // neural field
    ctx.globalCompositeOperation="lighter";
    for(const p of P){p.x+=p.vx*boost;p.y+=p.vy*boost;if(p.x<0||p.x>fx.width)p.vx*=-1;if(p.y<0||p.y>fx.height)p.vy*=-1}
    for(let i=0;i<P.length;i++){
      for(let j=i+1;j<P.length;j++){
        const dx=P[i].x-P[j].x,dy=P[i].y-P[j].y,d=dx*dx+dy*dy;
        if(d<140*140){ctx.strokeStyle=`rgba(0,207,255,${(1-Math.sqrt(d)/140)*.12*pulse})`;ctx.beginPath();ctx.moveTo(P[i].x,P[i].y);ctx.lineTo(P[j].x,P[j].y);ctx.stroke()}
      }
    }
    for(const p of P){ctx.fillStyle=`rgba(125,216,255,${.25+.35*pulse})`;ctx.beginPath();ctx.arc(p.x,p.y,1.4+(_hudSpk?1:0),0,7);ctx.fill()}
    ctx.globalCompositeOperation="source-over";
    drawCore(core,ts,red);
    _hudRaf=requestAnimationFrame(frame);
  }
  function drawCore(c,ts,red){
    if(!c)return;const g=c.getContext("2d");if(!g)return;
    const w=c.width,h=c.height,cx=w/2,cy=h/2,p=red?.7:(.55+.45*Math.sin((ts||0)/700));
    g.clearRect(0,0,w,h);
    g.strokeStyle=`rgba(0,207,255,${.35+.4*p})`;g.lineWidth=2;
    g.beginPath();g.arc(cx,cy,26,0,7);g.stroke();
    g.strokeStyle=`rgba(255,209,102,${.25+.3*p})`;g.lineWidth=1.5;
    g.beginPath();g.arc(cx,cy,18,ts/400,(ts/400)+4);g.stroke();
    g.fillStyle=`rgba(0,207,255,${.55+.45*p})`;g.beginPath();g.arc(cx,cy,7,0,7);g.fill();
    if(_hudSpk){g.strokeStyle="rgba(255,255,255,.7)";g.beginPath();g.arc(cx,cy,30,0,7);g.stroke()}
  }
  if(_hudRaf)cancelAnimationFrame(_hudRaf);
  if(red){drawCore(core,0,1);const ctx=fx.getContext("2d");if(ctx){ctx.clearRect(0,0,fx.width,fx.height)}return}
  _hudOn=1;_hudRaf=requestAnimationFrame(frame);
  addEventListener("resize",size,{passive:true});
}
try{
  const _tp=window.ttsPlay,_ts=window.ttsStop;
  if(_tp){window.ttsPlay=function(){hudSpeak(1);return _tp.apply(this,arguments)}}
  if(_ts){window.ttsStop=function(){hudSpeak(0);return _ts.apply(this,arguments)}}
  setInterval(()=>{if(_hudSpk&&!("speechSynthesis" in window&&speechSynthesis.speaking||(window.TTS&&TTS.on)))hudSpeak(0)},800);
}catch(e){}

/* ----- Globe (hand-rolled orthographic canvas, offline) ----- */
function projectLL(lat,lon,rot,w,h,r){
  const la=lat*Math.PI/180,lo=(lon+rot)*Math.PI/180;
  const x=Math.cos(la)*Math.sin(lo),y=Math.sin(la),z=Math.cos(la)*Math.cos(lo);
  if(z<0)return null;
  return {x:w/2+x*r,y:h/2-y*r,z};
}
function pinColor(k,p){return k==="home"?"#ffd166":k==="mkt"?(p.isOpen||(p.always)?"#34d399":"#ff6b81"):k==="quake"?"#ff9f43":k==="news"?"#c4b5fd":"#7dd8ff"}
let _grot=100,_gdrag=0,_gmx=0,_gsel=null;
function mountGlobe(id){
  const c=$(id);if(!c)return;
  const pins=(WLD().pins||[]).filter(p=>p.lat!=null&&p.lon!=null&&!(p.lat===0&&p.lon===0&&p.id==="crypto"));
  const red=RM17();
  function draw(){
    const w=c.clientWidth||c.width,h=c.clientHeight||c.height;if(!w||!h)return;
    const dpr=Math.min(2,devicePixelRatio||1);c.width=w*dpr;c.height=h*dpr;
    const ctx=c.getContext("2d");ctx.scale(dpr,dpr);
    const r=Math.min(w,h)*0.42,cx=w/2,cy=h/2;
    const g=ctx.createRadialGradient(cx-r*.3,cy-r*.3,r*.1,cx,cy,r);
    g.addColorStop(0,"#14345a");g.addColorStop(1,"#061018");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();
    ctx.strokeStyle="rgba(0,207,255,.35)";ctx.lineWidth=1.2;ctx.stroke();
    // lat/lon grid
    ctx.strokeStyle="rgba(125,216,255,.15)";ctx.lineWidth=.6;
    for(const lat of[-60,-30,0,30,60]){ctx.beginPath();let first=1;
      for(let lon=-180;lon<=180;lon+=8){const p=projectLL(lat,lon,_grot,w,h,r);if(!p){first=1;continue}first?(ctx.moveTo(p.x,p.y),first=0):ctx.lineTo(p.x,p.y)}
      ctx.stroke()}
    for(const lon of[-150,-90,-30,30,90,150]){ctx.beginPath();let first=1;
      for(let lat=-80;lat<=80;lat+=6){const p=projectLL(lat,lon,_grot,w,h,r);if(!p){first=1;continue}first?(ctx.moveTo(p.x,p.y),first=0):ctx.lineTo(p.x,p.y)}
      ctx.stroke()}
    const vis=[];
    pins.forEach(p=>{const q=projectLL(+p.lat,+p.lon,_grot,w,h,r);if(!q)return;vis.push({p,q});
      ctx.fillStyle=pinColor(p.kind,p);ctx.beginPath();ctx.arc(q.x,q.y,p.kind==="quake"?3+Math.min(4,(+p.mag||4)-4):4.2,0,7);ctx.fill();
      if(_gsel&&_gsel.id===p.id){ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q.x,q.y,8,0,7);ctx.stroke()}
    });
    c._vis=vis;
  }
  draw();
  if(!c._bound){
    c._bound=1;
    let last=0;
    const spin=ts=>{if(red||_gdrag){last=ts;if(!red)requestAnimationFrame(spin);return}if(ts-last>40){_grot=(_grot+.12)%360;draw();last=ts}requestAnimationFrame(spin)};
    if(!red)requestAnimationFrame(spin);
    c.addEventListener("pointerdown",e=>{_gdrag=1;_gmx=e.clientX;c.setPointerCapture(e.pointerId)});
    c.addEventListener("pointermove",e=>{if(!_gdrag)return;_grot+= (e.clientX-_gmx)*0.35;_gmx=e.clientX;draw()});
    const up=()=>{_gdrag=0};c.addEventListener("pointerup",up);c.addEventListener("pointercancel",up);
    c.addEventListener("click",e=>{
      const rec=c.getBoundingClientRect(),x=e.clientX-rec.left,y=e.clientY-rec.top,vis=c._vis||[];
      let best=null,bd=16;
      vis.forEach(v=>{const d=Math.hypot(v.q.x-x,v.q.y-y);if(d<bd){bd=d;best=v.p}});
      if(best){_gsel=best;draw();const box=$("pinp");if(box)box.innerHTML=pinHTML(best)}
    });
  }
}
function pinHTML(p){
  if(!p)return `<p class="mut">핀을 누르면 출처와 관련 소식이 나와요.</p>`;
  const bits=[`<b>${esc(p.label||p.id)}</b>`];
  if(p.kind==="mkt") bits.push(`<span class="mut">${p.always?"24시간":(p.isOpen?"개장":"폐장")} · 현지 ${esc(p.local||"")}</span>`);
  if(p.kind==="quake") bits.push(`<span class="mut">USGS · M${esc(p.mag)}</span>${p.url?`<div><a href="${esc(p.url)}" target="_blank" rel="noopener">지진 상세 →</a></div>`:""}`);
  if(p.kind==="home") bits.push(`<span class="mut">도시 위치 · 상세 주소 없음</span>`);
  if(p.kind==="news"&&p.region){
    const r=(WLD().regions||[]).find(x=>x.id===p.region);
    if(r) bits.push((r.items||[]).map(i=>`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.t)}</a>`).join(""));
  }
  const near=(WLD().gdelt||[]).filter(g=>g.country&&p.region).slice(0,3);
  if(near.length) bits.push(near.map(i=>`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.t)}</a>`).join(""));
  return bits.join("");
}

function clocksHTML(){
  const L=WLD().clocks||[];
  if(!L.length){
    // live fallback
    const mk=(label,tz)=>{try{const f=new Intl.DateTimeFormat("en-GB",{timeZone:tz,hour:"2-digit",minute:"2-digit",hour12:false});return {label,hhmm:f.format(new Date())}}catch(e){return {label,hhmm:"—"}}};
    L.push(mk("Austin","America/Chicago"),mk("Seoul","Asia/Seoul"),mk("UTC","UTC"));
  }
  return `<div class="clocks17">${L.map(c=>`<div class="clk glass2"><span class="mut">${esc(c.label)}</span><b>${esc(c.hhmm)}</b></div>`).join("")}</div>`;
}

V.globe=()=>{
  const W=WLD(),q=(W.quakes||[]).length,m=(W.pins||[]).filter(p=>p.kind==="mkt");
  setTimeout(()=>mountGlobe("globe"),60);
  return `<section class="hero14 glass2"><span class="ey">WORLD MAP · 실제 좌표</span><h2 class="h14">세계 지도</h2><p class="mut">홈 도시·서울·거래소 개장, USGS 지진(M4.5+, 7일), 권역 뉴스 핀. 드래그로 회전, 핀을 누르면 출처가 나와요. 지구본은 이 기기에서 그립니다.</p></section>`
    +clocksHTML()
    +`<div class="gleg"><i style="color:#ffd166">●</i>홈/서울 <i style="color:#34d399">●</i>개장 <i style="color:#ff6b81">●</i>폐장 <i style="color:#ff9f43">●</i>지진 ${q} <i style="color:#c4b5fd">●</i>정세</div>`
    +`<div class="gwrap glass2"><canvas id="globe" aria-label="세계 지구본"></canvas></div>`
    +`<div id="pinp" class="pinp glass2">${pinHTML(_gsel)}</div>`
    +`<button class="btnp" data-go="world">세계 정세 브리핑 →</button>`;
};

V.world=()=>{
  const W=WLD(),regs=W.regions||[];
  return `<section class="hero14 glass2"><span class="ey">WORLD AFFAIRS · 헤드라인 인용</span><h2 class="h14">세계 정세</h2><p class="mut">권역 요약은 수집된 헤드라인 앞줄을 이어 붙인 것입니다. 분석이 아니에요. ${W.at?rel(W.at):"—"} 수집${(W.errors||[]).length?" · 일부 소스 실패":""}.</p></section>`
    +clocksHTML()
    +`<div class="regs">${regs.map(r=>`<article class="reg glass2"><h3>${esc(r.label)}</h3>${r.summary?`<p>${esc(r.summary)}</p>`:`<p class="mut">이 권역 헤드라인이 부족해요.</p>`}<span class="mut">${esc(r.note||"")}</span>${(r.items||[]).map(i=>`<a href="${esc(i.url)}" target="_blank" rel="noopener">${esc(i.t)} <span class="mut">${esc(i.src||"")}</span></a>`).join("")}</article>`).join("")}</div>`
    +`<button class="pill" data-go="globe">지도에서 보기 →</button>`;
};

function oddCards(L){return `<div class="wall">${L.map(o=>`<a class="oc17 glass2" href="${esc(o.url)}" target="_blank" rel="noopener">${o.img?`<img loading="lazy" src="${esc(o.img)}" alt="" referrerpolicy="no-referrer">`:""}<span><b>${esc(o.t)}</b><em class="mut"> ${esc(o.src||"")} · ${esc(o.tag||"")}</em></span></a>`).join("")||'<p class="mut">이색 데이터가 없어요.</p>'}</div>`}
V.inews=()=>{const L=(typeof oddL==="function"?oddL():(FUN().odd||[]));
  const tags=[...new Set(L.map(o=>o.tag).filter(Boolean))];
  return `<section class="hero14 glass2"><span class="ey">OFFBEAT · 실제 소스</span><h2 class="h14">이색 뉴스</h2><p class="mut">${esc((FUN().src||"공개 RSS"))} · 썸네일이 있는 것만 크게, 없는 것도 카드로 보여요.</p></section>`
    +`<div class="pills">${[["all","전체"],...tags.map(t=>[t,t])].map(([k,l])=>`<button class="pill ${((window._odf17||"all")===k)?"on":""}" data-act="odf17:${esc(k)}">${esc(l)}</button>`).join("")}</div>`
    +oddCards((window._odf17&&window._odf17!=="all")?L.filter(o=>o.tag===window._odf17):L)};
ACT.odf17=k=>{window._odf17=k;render()};

V.space=()=>{const L=(FUN().odd||[]).filter(o=>/우주|과학|space|science/i.test((o.tag||"")+(o.src||"")));
  const dyk=WLD().dyk;
  return `<section class="hero14 glass2"><span class="ey">SPACE + SCIENCE</span><h2 class="h14">우주 · 과학</h2></section>`
    +(dyk?`<article class="glass2 pinp"><span class="ey">오늘 이런 일이 · Wikipedia</span><b>${esc(dyk.year||"")} · ${esc(dyk.t||"")}</b>${dyk.url?`<div><a href="${esc(dyk.url)}" target="_blank" rel="noopener">원문 →</a></div>`:""}</article>`:"")
    +oddCards(L)};

V.near=()=>{
  const ev=(D.events||[]).slice(0,12), news=WLD().nearbyNews||[], hol=((D.cal||{}).holidays||[]).filter(h=>{const d=(new Date((h.date||"")+"T12:00:00")-Date.now())/864e5;return d>=-1&&d<=14});
  return `<section class="hero14 glass2"><span class="ey">NEARBY</span><h2 class="h14">근처에서 볼 것</h2><p class="mut">완전한 지역 행사 API는 키가 없어 연결하지 않았어요. 수집된 행사 알림·공휴일·지역 뉴스입니다.</p></section>`
    +(hol.length?H2("다가오는 공휴일")+hol.map(h=>`<div class="row glass2">${esc(h.date)} · ${esc(h.title||h.name||"")}</div>`).join(""):"")
    +(ev.length?H2("행사 알림")+ev.map(e=>`<div class="row glass2">${esc((e.date||"").slice(0,10))} · ${esc(e.subject||e.top||"행사")}${e.count?` · ${e.count}건`:""}</div>`).join(""):'<p class="mut">개인 캘린더 일정은 없어요.</p>')
    +(news.length?H2("지역 소식","공개 뉴스")+`<div class="wall">${news.map(n=>`<a class="oc17 glass2" href="${esc(n.url)}" target="_blank" rel="noopener"><span><b>${esc(n.t)}</b><em class="mut"> ${esc(n.src||"")}</em></span></a>`).join("")}</div>`:"")};

function vidRows(){
  const all=FUN().videos||[], tags=["world","science","space","finance","ai","korean","fun","travel","english"];
  const pref=(()=>{try{const I=typeof IST==="function"?IST():{};return Object.keys(I.tag||I.w||{})}catch(e){return []}})();
  const order=[...new Set([...pref.filter(t=>tags.includes(t)),...tags])];
  return order.map(t=>{const L=all.filter(v=>(v.tags||[]).includes(t)).slice(0,8);return L.length?{t,L}:null}).filter(Boolean);
}
V.videos=()=>{
  const all=FUN().videos||[], rows=vidRows(), n=new Set(all.map(v=>v.cid)).size;
  const picked=(typeof ytPick==="function"?ytPick().top:[] )||[];
  const seen=new Set(picked.map(v=>v.id)), mix=picked.slice();
  rows.forEach(r=>r.L.forEach(v=>{if(!seen.has(v.id)&&mix.length<12){mix.push(v);seen.add(v.id)}}));
  if(mix.length<12) all.forEach(v=>{if(!seen.has(v.id)&&mix.length<12){mix.push(v);seen.add(v.id)}});
  return `<section class="hero14 glass2"><span class="ey">VIDEO WALL · 관심사 매칭</span><h2 class="h14">관심 영상</h2><p class="mut">검증된 채널 ${n}곳 · 수집 ${all.length}개 · 썸네일을 누르면 여기서 재생합니다. ${FUN().at?rel(FUN().at):""}</p></section>`
    +(mix.length?`<div class="wall">${mix.slice(0,12).map((v,i)=>typeof ytCard==="function"?ytCard(v,i):`<a class="oc17" href="${esc(v.url)}" target="_blank" rel="noopener"><img src="${esc(v.thumb)}" alt=""><span>${esc(v.t)}</span></a>`).join("")}</div>`:`<p class="mut">지금은 영상을 모으지 못했어요. 지어내지 않고 비워 둡니다.</p>`)
    +rows.map(r=>`<div class="vrow">${H2(r.t,"채널 태그")}<div class="strip">${r.L.map(v=>typeof ytCard==="function"?ytCard(v,null,1):"").join("")}</div></div>`).join("")
    +`<button class="pill" data-go="yt">오늘의 10 →</button>`;
};
ACT.ytplay=id=>{
  if(!/^[\w-]{11}$/.test(id||""))return;
  let box=$("ytbox");
  if(!box){box=document.createElement("div");box.id="ytbox";box.className="ytbox off";document.body.appendChild(box)}
  box.innerHTML=`<iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?autoplay=1" allow="accelerometer;autoplay;encrypted-media;picture-in-picture" allowfullscreen title="YouTube"></iframe><button class="btnp ytx" data-act="ytx">닫기</button>`;
  box.classList.remove("off");
};
ACT.ytx=()=>{const b=$("ytbox");if(b){b.classList.add("off");b.innerHTML=""}};
document.addEventListener("click",e=>{const a=e.target.closest("[data-yt]");if(!a)return;const id=a.getAttribute("data-yt");if(id&&/^[\w-]{11}$/.test(id)){e.preventDefault();e.stopPropagation();ACT.ytplay(id)}},true);

/* ----- Local assistant ----- */
function greet17(){
  const h=new Date().getHours(),tod=h<5?"새벽":h<12?"아침":h<17?"오후":h<21?"저녁":"밤";
  const wx=((D.market||{}).weather||{}).current||{}, bits=[`혁진님, ${tod}입니다.`];
  if(wx.temperature_2m!=null) bits.push(`시더파크는 ${Math.round(wx.temperature_2m)}도에 ${wxDesc(wx.weather_code)}.`);
  const f=typeof F==="function"?F():{};
  if(f.cardUtil>=50) bits.push(`카드 사용률 ${f.cardUtil}%라 조금 주의가 필요해 보여요.`);
  else if(f.net!=null) bits.push(`순자산은 ${money(typeof NWv==="function"?NWv():f.net)}입니다.`);
  const cal=(D.cal||{}).personal||(D.cal||{}).days||[];
  const has=Array.isArray(cal)&&cal.some(x=>x&&(x.title||x.items&&x.items.length));
  if(!has) bits.push("이번 주 개인 일정은 한산해요.");
  try{const ins=typeof insights==="function"?insights():[];if(ins[0]) bits.push(ins[0])}catch(e){}
  const q=(WLD().quakes||[]).find(x=>+x.mag>=6);
  if(q) bits.push(`이번 주 M${q.mag} 지진이 관측됐어요 (${q.place}).`);
  return {text:bits.join(" "),tod};
}
function noticed17(){
  const out=[];
  try{(insights()||[]).forEach(s=>out.push(s))}catch(e){}
  const f=F()||{};
  if(f.bills14&&f.bills14.length) out.push(`앞으로 14일 안에 결제 ${f.bills14.length}건이 잡혀 있어요.`);
  const W=WLD();
  if((W.quakes||[]).some(q=>+q.mag>=6)) out.push("규모 6 이상 지진이 이번 주 관측 목록에 있어요.");
  const mv=(typeof moves==="function"?moves():[])[0];
  if(mv&&Math.abs(+mv.chg)>=2) out.push(`관심 종목 ${mv.s}이 ${mv.chg>0?"+":""}${Number(mv.chg).toFixed(1)}% 움직였어요.`);
  if((M().needsReply||[]).length) out.push(`회신 후보 메일이 ${(M().needsReply||[]).length}통 있어요. 추정입니다.`);
  return out.slice(0,6);
}
function memAsk(){return secReady()?(SX("ask").log||[]):[]}
function pushAsk(q,a){if(!secReady())return;const s=SX("ask");s.log=s.log||[];s.log.unshift({q,a,t:new Date().toISOString()});s.log=s.log.slice(0,20);saveSec()}
function catSpend(re){
  const cats=F().byCategory||[], hit=cats.filter(c=>re.test(c.cat||c.name||""));
  const amt=hit.reduce((a,c)=>a+(+c.amount||0),0);
  return {hit,amt};
}
function ask17(q){
  const t=(q||"").trim();if(!t)return {a:"무엇이든 물어보세요. 예: 이번 달 외식 얼마, 내일 일정, 삼성전자 어때, 오늘 볼 영상.",sug:["이번 달 외식 얼마?","내일 일정?","관심 종목은?","오늘 볼 영상"]};
  let a="",sug=[];
  const f=F()||{};
  if(/외식|식비|음식|식당|카페|배달/.test(t)){
    const {hit,amt}=catSpend(/food|restaurant|커피|카페|외식|식비|meal|dining|grocer/i);
    a=hit.length?`최근 30일 ${hit.map(c=>c.cat).join("·")} 합계는 ${money(amt)}이에요. 실제 거래 분류입니다.`:`식비로 보이는 분류가 최근 30일 집계에 없어요.`;
    sug=["이번 달 전망","카드 사용률"];
  }else if(/내일|일정|스케줄|주 일정/.test(t)){
    a="개인 캘린더에 잡힌 다음 일정이 거의 없어요. 공휴일·결제·행사 알림은 이번 주 일정 화면에 모아 두었어요.";
    sug=["이번 주 일정","14일 결제"];
  }else if(/삼성|005930|엔비디아|NVDA|비트|BTC|이더|ETH|환율|달러|관심 종목|시세/.test(t)){
    const L=typeof moves==="function"?moves():[], want=/삼성|005930/.test(t)?"005930":/BTC|비트/.test(t)?"BTC":/ETH|이더/.test(t)?"ETH":null;
    const m=want?L.find(x=>String(x.s).includes(want)||String(x.sym||"").includes(want))||L.find(x=>String(x.s).toUpperCase().includes(want)):L[0];
    a=m?`${m.s}는 ${m.chg>=0?"+":""}${Number(m.chg).toFixed(2)}%예요. 시세 수집값이며 투자 조언이 아닙니다.`:"지금은 해당 시세를 찾지 못했어요.";
    sug=["관심 종목 움직임","세계 정세"];
  }else if(/영상|유튜브|볼 만|추천 영상|뭐 볼/.test(t)){
    const v=(FUN().videos||[])[0];
    a=v?`가장 먼저 보여드릴 영상은 ${v.ch}의 “${v.t}”이에요. 관심 영상 벽에 더 있어요.`:"오늘은 영상 수집이 비어 있어요.";
    sug=["관심 영상","이색 뉴스"];
  }else if(/순자산|자산|카드|현금|지출|수입|흐름|전망/.test(t)){
    a=`순자산 ${money(typeof NWv==="function"?NWv():f.net)}, 30일 흐름 ${f.cash30==null?"—":sg(f.cash30)}, 카드 ${f.cardUtil??"—"}%. 이번 달 전망은 추정 화면에서 볼 수 있어요.`;
    sug=["이번 달 전망","내 패턴"];
  }else if(/메일|답장|회신/.test(t)){
    const n=(M().needsReply||[]).length;
    a=`회신 후보로 보는 메일이 ${n}통이에요. 프로모·알림을 제외한 추정입니다.`;
    sug=["회신 후보"];
  }else if(/날씨|기온|비 오/.test(t)){
    const wx=((D.market||{}).weather||{}).current||{};
    a=wx.temperature_2m!=null?`시더파크 지금 ${Math.round(wx.temperature_2m)}도, ${wxDesc(wx.weather_code)}. Open-Meteo 값이에요.`:"날씨 데이터가 없어요.";
    sug=["근처에서 볼 것"];
  }else if(/패턴|습관|요일|인사이트/.test(t)){
    const ins=typeof insights==="function"?insights():[];
    a=ins.length?ins.join(" "):"아직 비교할 패턴이 부족해요.";
    sug=["내 패턴","순자산 변화"];
  }else if(/뉴스|정세|세계|지진/.test(t)){
    const r=(WLD().regions||[]).find(x=>x.summary)||{};
    a=r.summary?`${r.label}: ${r.summary} (헤드라인 인용)`:"세계 정세 헤드라인을 아직 모으지 못했어요.";
    sug=["세계 정세","세계 지도"];
  }else if(/안녕|누구|자비스|JARVIS/.test(t)){
    a="혁진님의 JARVIS예요. 돈, 일정, 관심 영상, 세계 소식을 이 기기에서 묶어 보여 드려요. 개인 데이터는 제3자 모델로 보내지 않아요.";
    sug=["오늘 브리핑","지금 볼 것"];
  }else{
    // retrieval over news / videos / odd titles
    const pool=[...((D.news||{}).sections&&[].concat(...Object.values(D.news.sections||{}))||[]), ...(FUN().videos||[]), ...(FUN().odd||[])];
    const kw=t.replace(/[?？]/g,"").split(/\s+/).filter(s=>s.length>1);
    const hit=pool.filter(x=>{const b=(x.title||x.t||"");return kw.some(k=>b.includes(k))}).slice(0,3);
    a=hit.length?("관련해 찾은 것: "+hit.map(x=>x.title||x.t).join(" · ")):"그 문장에 딱 맞는 항목이 없어요. 아래 질문 중 하나로 바꿔 보실래요?";
    sug=["이번 달 외식 얼마?","오늘 볼 영상","세계 정세"];
  }
  return {a,sug};
}
V.jarvis=()=>{
  const g=greet17(), log=memAsk(), ntc=noticed17(), last=window._ask17;
  return `<section class="hero14 glass2"><span class="ey">ASSISTANT · 로컬</span><h2 class="h14">JARVIS 비서</h2><p class="mut">시간대·날씨·돈·일정·패턴으로 먼저 말 겁니다. 답은 이 기기에서 규칙과 검색으로 만들어요. 개인 데이터는 외부 모델로 보내지 않아요.</p></section>`
    +`<div class="greet17 glass2"><b>${esc(g.text)}</b><div class="gacts"><button class="pill" data-act="gspeak">▶ 듣기</button></div><span class="mut">읽는 중 하단에서 멈출 수 있어요</span></div>`
    +(ntc.length?`<div class="noticed glass2"><span class="ey">JARVIS가 눈치챈 것 · 추정 포함</span><ul>${ntc.map(s=>`<li>${esc(s)}</li>`).join("")}</ul></div>`:"")
    +`<div class="ask17">${(log.slice(0,6).reverse().map(x=>`<div class="bub me">${esc(x.q)}</div><div class="bub jv glass2">${esc(x.a)}</div>`).join(""))}${last?`<div class="bub me">${esc(last.q)}</div><div class="bub jv glass2">${esc(last.a)}</div>`:""}
      <form class="askbox" onsubmit="return false"><input id="askq" placeholder="이번 달 외식 얼마? 내일 일정? 오늘 볼 영상" value="${esc((last&&last.keep)||"")}"><button class="btnp" data-act="askgo">묻기</button></form>
      <div class="sug17">${(last&&last.sug||["이번 달 외식 얼마?","내일 일정?","삼성전자 어때?","오늘 볼 영상"]).map(s=>`<button class="pill" data-act="asksug:${esc(s)}">${esc(s)}</button>`).join("")}</div>
    </div>`;
};
ACT.gspeak=()=>{const t=greet17().text;ttsPlay?ttsPlay(t,"ko-KR"):(speechSynthesis.speak(new SpeechSynthesisUtterance(t)))};
ACT.askgo=()=>{const q=(($("askq")||{}).value||"").trim();if(!q)return;const r=ask17(q);pushAsk(q,r.a);window._ask17={q,a:r.a,sug:r.sug};render()};
ACT.asksug=s=>{window._ask17={q:s,a:ask17(s).a,sug:ask17(s).sug,keep:s};const r=ask17(s);pushAsk(s,r.a);window._ask17={q:s,a:r.a,sug:r.sug};render()};

function orbitRow(){
  const items=[["globe","🌐","세계 지도"],["world","✦","세계 정세"],["videos","▶","관심 영상"],["inews","✺","이색 뉴스"],["space","🪐","우주·과학"],["near","📍","근처"],["jarvis","◉","비서"],["patterns","▣","내 패턴"]];
  return `<div class="orbit17" role="navigation" aria-label="세계와 재미">${items.map(x=>`<button data-go="${x[0]}"><i>${x[1]}</i><span>${x[2]}</span></button>`).join("")}</div>`;
}
function greetBar(){
  const g=greet17(), short=g.text.split(". ").slice(0,2).join(". ");
  return `<div class="greet17 glass2 short"><b>${esc(short)}</b><div class="gacts"><button class="pill" data-act="gspeak">▶ 듣기</button><button class="pill" data-go="jarvis">비서 →</button></div></div>`;
}

const _home17=V.home;V.home=function(){
  try{startHud()}catch(e){}
  let h=_home17.apply(this,arguments);if(window._ed)return h;
  const g=greetBar()+orbitRow();
  const i=h.indexOf('<div class="kpi16">');
  if(i>=0){const j=h.indexOf("</div>",i);if(j>=0)h=h.slice(0,j+6)+g+h.slice(j+6)}
  else h=g+h;
  try{maybeGreet()}catch(e){}
  return h;
};
function maybeGreet(){
  if(RM17()||!secReady())return;
  const s=SX("greet");
  if(s.day===TODAY())return;
  s.day=TODAY();saveSec();
  setTimeout(()=>{if(cur()==="home")ACT.gspeak()},1200);
}

Object.assign(TITLE,{globe:"세계 지도",world:"세계 정세",inews:"이색 뉴스",videos:"관심 영상",space:"우주 · 과학",near:"근처에서 볼 것",jarvis:"비서"});
try{LCATS.unshift(["jarvis","비서","◉","#00cfff","jarvis"],["globe","세계 지도","🌐","#7dd8ff","globe"],["world","세계 정세","✦","#c4b5fd","world"],["videos","관심 영상","▶","#ff4d66","videos"],["inews","이색 뉴스","✺","#e879f9","inews"])}catch(e){}
const _pal17=palItems;palItems=function(){const it=_pal17();[["jarvis","JARVIS 비서"],["globe","세계 지도"],["world","세계 정세"],["videos","관심 영상"],["inews","이색 뉴스"],["space","우주 · 과학"],["near","근처에서 볼 것"]].forEach(r=>it.unshift({l:r[1],s:r[0],go:r[0]}));return it};

document.addEventListener("DOMContentLoaded",()=>{try{ensureHud();startHud()}catch(e){}});
try{ensureHud();startHud()}catch(e){}

