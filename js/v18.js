/* v18 — premium hubs, life profile, trajectory, magazine play */
document.documentElement.classList.add("v18");

const HUBTABS=[["home","○","오늘"],["wealth","◇","돈"],["life","◎","나"],["world","✺","세계"],["play","✦","재미"]];
try{
  ALLTABS.push(["wealth","$","돈"],["life","◉","나"],["future","↗","미래"],["play","✦","재미"],["dash","▦","전체"]);
  LCATS.unshift(["wealth","돈","$","var(--gold)","wealth"],["life","나","◉","#7dd3fc","life"],["future","미래 · 방향","↗","var(--gold)","future"],["play","재미","✦","var(--c)","play"]);
}catch(e){}
try{Object.assign(TITLE,{wealth:"돈",life:"나",future:"미래 · 방향",play:"재미",dash:"전체 타일",home:"오늘"})}catch(e){}

const _applyST18=applyST;
applyST=function(){
  _applyST18.apply(this,arguments);
  TABS.splice(0,TABS.length,...HUBTABS);
  const tb=$("tabs");if(tb)tb.style.gridTemplateColumns=`repeat(${TABS.length},1fr)`;
};

const I18=(n,s=22)=>{
  const d={
    today:"M5 6h14M5 12h10M5 18h14",
    wealth:"M4 19h16M7 19V10l5 3 5-7v13",
    me:"M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1.6-3.2 4.2-5 7-5s5.4 1.8 7 5",
    world:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3.5 12h17M12 3c3.2 3 3.2 15 0 18M12 3C8.8 6 8.8 18 12 21",
    play:"M5 6h14v12H5zM10 9.5l5 2.5-5 2.5z",
    up:"M12 19V5M6 11l6-6 6 6",
    down:"M12 5v14M6 13l6 6 6-6",
    bot:"M8 9h8v7H8zM9 6h6M12 6v3M9 20h6",
    mail:"M4 6h16v12H4zM4 7l8 6 8-6",
    cal:"M6 4v3M18 4v3M4 8h16v12H4zM8 13h3M13 13h3",
    doc:"M7 3h7l5 5v13H7zM14 3v5h5",
    compass:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM14.5 9.5l-2 5-5 2 2-5z",
    spark:"M12 3l1.4 6.2L20 12l-6.6 2.8L12 21l-1.4-6.2L4 12l6.6-2.8z",
    jarvis:"M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8 12h8M12 8v8"
  }[n]||"M5 12h14";
  return `<svg class="ti" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
};

function hello18(){
  const h=new Date().getHours();
  const p=h<5?"늦은 밤이에요":h<12?"좋은 아침이에요":h<17?"좋은 오후예요":h<22?"좋은 저녁이에요":"늦은 밤이에요";
  return p+", 혁진님";
}
const SIDE=()=>D.side||D.sideIncome||{};
function ctMonth(){try{return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit"}).format(new Date())}catch(e){return new Date().toISOString().slice(0,7)}}
function sideMo(){
  const list=SIDE().contractor||[],m=ctMonth();
  const cur=list.filter(x=>String(x.date||"").slice(0,7)===m);
  const sum=cur.reduce((a,b)=>a+(+b.amount||0),0);
  return {sum,n:cur.length,all:list.length,allSum:list.reduce((a,b)=>a+(+b.amount||0),0)};
}
function netHist(){
  const s=(typeof patSeries==="function"?patSeries():((PAT()||{}).series||[])).filter(x=>x&&x.net!=null);
  const by={};
  s.forEach(x=>{const d=String(x.at||"").slice(0,10);if(d)by[d]=+x.net});
  return Object.keys(by).sort().map(d=>({t:d,v:by[d]}));
}
function netDelta(days){
  const h=netHist();if(h.length<2)return null;
  const last=h[h.length-1];
  const cut=new Date(last.t+"T12:00:00");cut.setDate(cut.getDate()-days);
  const want=cut.toISOString().slice(0,10);
  let prev=h[0];
  h.forEach(p=>{if(p.t<=want)prev=p});
  if(prev.t===last.t&&h.length>=2)prev=h[0];
  return {a:prev.v,b:last.v,d:last.v-prev.v,from:prev.t,to:last.t,days:Math.max(1,Math.round((new Date(last.t)-new Date(prev.t))/864e5))};
}
function replyN(){const m=M()||{};const n=m.needsReply;return Array.isArray(n)?n.length:(+n||0)}
function schoolN(){return ((D.mailx||{}).school||[]).length}
function holSoon(){const hol=((D.cal||{}).holidays||[]).filter(h=>{if(!h||!h.date)return false;const d=(new Date(h.date+"T12:00:00")-Date.now())/864e5;return d>=-0.5&&d<=21});return hol}

function compass18(){
  const f=F()||{},out=[];
  if(f.cash30!=null&&f.cash30<0)out.push({t:"30일 현금흐름부터 보세요",s:sg(f.cash30)+" · 수입 "+money(f.income30)+" / 지출 "+money(f.spend30),go:"flow"});
  else if(f.cash30!=null)out.push({t:"여유분의 흐름을 목표와 맞춰 보세요",s:"30일 "+sg(f.cash30),go:"future"});
  if(f.cardUtil!=null&&f.cardUtil>=50)out.push({t:"카드 사용률을 낮출 여유가 있는지 보세요",s:"사용률 "+f.cardUtil+"%",go:"card"});
  const bills=f.bills14||(f.bills||[]),bsum=bills.reduce((a,b)=>a+Math.abs(b.amount||0),0);
  if(bills.length)out.push({t:"2주 안 결제 "+bills.length+"건을 확인하세요",s:bsum?money(bsum):"",go:"bills14"});
  const nr=replyN();
  if(nr)out.push({t:"회신이 필요할 수 있는 메일이 있어요",s:nr+"건 · 추정",go:"reply",est:1});
  if(schoolN())out.push({t:"가족·학교 메일을 살펴보세요",s:schoolN()+"건 (샘플)",go:"family"});
  const sm=sideMo();
  if(sm.sum>0&&sm.sum<300)out.push({t:"이번 달 부업 수입이 단기 목표에 못 미쳐요",s:money(sm.sum)+" · 목표 월 $300–500 · 추정",go:"side",est:1});
  const hol=holSoon();
  if(hol[0])out.push({t:(hol[0].title||"공휴일")+"이 다가와요",s:hol[0].date,go:"week"});
  return out.slice(0,3);
}

function area18(pts,opt){
  opt=opt||{};
  const w=opt.w||320,h=opt.h||148,gold=!!opt.gold;
  if(!pts||pts.length<2)return `<p class="mut">아직 그릴 시계열이 부족해요.</p>`;
  const vs=pts.map(p=>+p.v),min=Math.min(...vs),max=Math.max(...vs),span=(max-min)||1;
  const xy=pts.map((p,i)=>{
    const x=16+i*(w-32)/Math.max(1,pts.length-1);
    const y=h-24-((p.v-min)/span)*(h-40);
    return [x,y];
  });
  const line=()=>{
    let d=`M${xy[0][0].toFixed(1)},${xy[0][1].toFixed(1)}`;
    for(let i=1;i<xy.length;i++){
      const a=xy[i-1],b=xy[i],cx=((a[0]+b[0])/2).toFixed(1);
      d+=`C${cx},${a[1].toFixed(1)} ${cx},${b[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    }
    return d;
  };
  const ln=line();
  const fl=`${ln}L${xy[xy.length-1][0].toFixed(1)},${h-18}L${xy[0][0].toFixed(1)},${h-18}Z`;
  const id="ag"+Math.random().toString(36).slice(2,8);
  const col=gold?"#E2C572":"#4FD6E4";
  const lab0=pts[0].t?String(pts[0].t).slice(5,10):"";
  const lab1=pts[pts.length-1].t?String(pts[pts.length-1].t).slice(5,10):"";
  return `<svg class="chart18s" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="추이 차트">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".38"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
    <path d="${fl}" fill="url(#${id})"></path>
    <path d="${ln}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"></path>
    <text x="16" y="${h-4}" fill="#6A7386" font-size="10">${esc(lab0)}</text>
    <text x="${w-16}" y="${h-4}" fill="#6A7386" font-size="10" text-anchor="end">${esc(lab1)}</text>
  </svg>`;
}

function ring18(pct,label,sub,go,gold){
  const p=pct==null?0:Math.max(0,Math.min(1,pct));
  const r=28,c=2*Math.PI*r,dash=(c*p).toFixed(1);
  const col=gold?"#E2C572":"#4FD6E4";
  const body=`<svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
    <circle cx="40" cy="40" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>
    <circle class="prog" cx="40" cy="40" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"
      stroke-dasharray="${dash} ${c.toFixed(1)}" transform="rotate(-90 40 40)"/>
  </svg><div class="ring-n">${pct==null?"—":Math.round(p*100)+"%"}</div><b>${esc(label)}</b><span class="mut">${esc(sub||"")}</span>`;
  return go?`<button class="ringc glass2" data-go="${esc(go)}">${body}</button>`:`<div class="ringc glass2">${body}</div>`;
}

function traj18(){
  const nw=typeof NWv==="function"?NWv():(F()||{}).net;
  const f=F()||{},g=typeof G==="function"?G():{target:1e6,spendY:(f.spend30||0)*12,swr:4};
  const tgt=g.target||1e6;
  const cash30=f.cash30;
  const d=netDelta(30);
  const obsMo=d&&d.days? (d.d/d.days)*30 : null; // observed monthly from net hist
  const pace=cash30!=null?cash30:obsMo;
  const yr=y=>nw==null||pace==null?null:nw+pace*12*y;
  const needMo=nw==null?null:(tgt-nw)/120; // 10y monthly to target, 0 return 추정
  const spendY=g.spendY||((f.spend30||0)*12);
  const free=spendY&&g.swr?spendY/(g.swr/100):null; // 경제자유 추정
  return {nw,tgt,cash30,obsMo,obsDays:d&&d.days,obsD:d&&d.d,obsFrom:d&&d.from,pace,y1:yr(1),y5:yr(5),y10:yr(10),needMo,spendY,free,d};
}

function momChips(){
  const f=F()||{},d=netDelta(30),out=[];
  if(d)out.push({t:"순자산",s:(d.d>0?"개선 ":"하락 ")+sg(d.d),n:d.d,go:"future",note:`최근 ${d.days}일 관측`});
  // spend30 vs earlier series points that have spend
  const ser=(typeof patSeries==="function"?patSeries():[]).filter(x=>x&&x.spend!=null&&String(x.at||"").slice(0,10)>= (d?d.from:"0000"));
  if(ser.length>=2){
    const a=ser[0].spend,b=ser[ser.length-1].spend,df=b-a;
    if(a!=null&&b!=null&&a!==b)out.push({t:"30일 지출",s:(df>0?"증가 ":"감소 ")+sg(df),n:-df,go:"patterns",note:"스냅 비교 · 추정"});
  }
  if(f.cardUtil!=null)out.push({t:"카드 사용률",s:f.cardUtil+"%",n:50-f.cardUtil,go:"card",note:f.cardUtil>=50?"주의":"여유"});
  if(f.cash30!=null)out.push({t:"30일 현금흐름",s:sg(f.cash30),n:f.cash30,go:"flow",note:"실제 거래"});
  return out;
}

function timeline18(){
  const it=[],d=netDelta(90),f=F()||{},hol=holSoon(),bills=(f.bills14||f.bills||[]).slice().sort((a,b)=>String(a.next||"").localeCompare(String(b.next||"")));
  if(d)it.push({k:"지난 일",t:`순자산 ${sg(d.d)} (${d.from.slice(5)}–${d.to.slice(5)})`,s:"관측된 잔액 변화"});
  if(f.cash30!=null)it.push({k:"지난 일",t:"30일 현금흐름 "+sg(f.cash30),s:"수입 "+money(f.income30)+" · 지출 "+money(f.spend30)});
  const sm=sideMo();
  if(sm.n)it.push({k:"지난 일",t:"이번 달 부업 관련 입금 "+money(sm.sum),s:sm.n+"건 · 추정 분류",est:1});
  if(bills[0]&&bills[0].next)it.push({k:"다음",t:"다음 결제 "+(bills[0].name||"").slice(0,24),s:(bills[0].next||"")+" · "+money(Math.abs(bills[0].amount||0)),go:"bills14"});
  if(hol[0])it.push({k:"다음",t:hol[0].title||"공휴일",s:hol[0].date,go:"week"});
  if(!((D.cal||{}).personal||[]).length)it.push({k:"다음",t:"개인 일정은 아직 없어요",s:"향후 45일 기준",go:"cal"});
  return it.slice(0,6);
}

function docTopics(){
  const files=((D.docs||{}).files)||[],map={};
  files.forEach(f=>{
    const n=f.name||"";
    let k="기타";
    if(/영어|english/i.test(n))k="영어";
    else if(/비자|visa|\bl-?1\b|i-?94|이민/i.test(n))k="체류·서류";
    else if(/세금|tax|irs/i.test(n))k="세금";
    else if(/학교|school|isd|homework|숙제/i.test(n))k="학교";
    else if(/투자|증권|broker|trading/i.test(n))k="투자";
    else if(/계약|contract|lease/i.test(n))k="계약";
    map[k]=(map[k]||0)+1;
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}

function areaLife(){
  const f=F()||{},nw=typeof NWv==="function"?NWv():f.net,d=netDelta(30);
  const bots=D.bots||[],ok=(D.health||{}).ok,tot=(D.health||{}).total;
  const eng=((D.docs||{}).files||[]).filter(x=>/영어|english/i.test(x.name||"")).length;
  const topics=((D.profile||{}).topics||[]);
  const hol=((D.cal||{}).holidays||[]).length;
  const sm=sideMo();
  const areas=[
    {n:"돈",ic:"wealth",st:nw==null?"데이터 없음":money(nw),tr:d?(d.d>=0?"상승 ":"하락 ")+sg(d.d)+" · "+d.days+"일":"—",nx:"현금흐름과 목표 페이스를 보세요",go:"wealth",tone:d&&d.d<0?"t-lo":"t-ok"},
    {n:"가족",ic:"me",st:schoolN()?"학교·가족 메일 "+schoolN()+"건 (샘플)":(hol?"공휴일 "+hol+"개":"개인 일정 없음"),tr:replyN()?"회신 후보 "+replyN()+"건 · 추정":"큰 변화 없음",nx:schoolN()?"가족·학교 메일을 확인":"일정이 생기면 여기 모여요",go:"family"},
    {n:"일",ic:"bot",st:tot!=null?`봇 ${ok||0}/${tot}`:(bots.length?bots.length+"개 봇":"데이터 없음"),tr:((D.dev||{}).activity||[]).length?`GitHub 활동 ${((D.dev||{}).activity||[]).length}건`:"저장소 "+(((D.dev||{}).repos)||[]).length+"개",nx:sm.n?"부업 입금을 목표와 비교해 보세요":"봇과 파일을 살펴보세요",go:"bots"},
    {n:"배움",ic:"doc",st:eng?`영어 관련 파일 ${eng}개`:"영어 파일 없음",tr:topics.length?`관심 주제 ${topics.length}개 · 추정`:"주제 맵 없음",nx:eng?"영어 파일을 이어서":"학습 자료를 연결하면 보여요",go:"eng"},
    {n:"건강",ic:"spark",st:"데이터 없음",tr:"—",nx:"운동·수면 데이터가 아직 없어요",go:null,empty:1},
    {n:"취미",ic:"play",st:topics[0]?String(topics[0].topic||"").split(" ")[0]+" 외":"관심사 맵을 보세요",tr:((FUN()||{}).videos||[]).length?`영상 ${((FUN()||{}).videos||[]).length}개`:"볼거리 수집",nx:"재미 허브에서 이어서",go:"play"}
  ];
  return areas;
}

function staleOrFresh(){
  let s="";
  try{if(typeof staleBanner==="function")s+=staleBanner()}catch(e){}
  try{if(typeof freshLine==="function")s+=freshLine()}catch(e){}
  return s;
}

function home18(){
  const f=F()||{},nw=typeof NWv==="function"?NWv():f.net,d=netDelta(30),tr=traj18();
  const dir=d?`<span class="dir18 ${d.d>=0?"t-ok":"t-lo"}">${d.d>=0?I18("up",16):I18("down",16)}${sg(d.d)} · ${d.days}일</span>`:`<span class="dir18 mut">추세 데이터 부족</span>`;
  const kpis=[
    {l:"30일 흐름",v:f.cash30==null?"—":sg(f.cash30),go:"flow",tone:f.cash30==null?"":f.cash30>=0?"t-ok":"t-lo"},
    {l:"카드 사용",v:f.cardUtil==null?"—":f.cardUtil+"%",go:"card",tone:f.cardUtil>=70?"t-lo":f.cardUtil>=50?"t-mid":"t-ok"},
    {l:"2주 안 결제",v:(f.bills14||[]).length?((f.bills14||[]).length+"건"):((f.bills||[]).length? (f.bills||[]).length+"건":"—"),go:"bills14"}
  ];
  const foc=compass18();
  const hubs=[["wealth","wealth","돈","잔액·지출·청구"],["life","me","나","삶과 패턴"],["future","spark","미래","목표·방향"],["world","world","세계","정세·지도"],["play","play","재미","영상·이색"]];
  return `<div class="home18">
    ${staleOf&&staleOf()?staleBanner():""}
    <section class="hero18">
      <p class="hello18 greet17">${esc(hello18())}</p>
      <span class="k18">순자산</span>
      <b class="hero-n num" data-count="${nw==null?"":nw}" data-money="1">${nw==null?"—":money(nw)}</b>
      ${dir}
      <p class="disc18">금융 조언이 아닙니다</p>
    </section>
    <div class="kpi3">${kpis.map(k=>`<button class="glass2 ${k.tone||""}" data-go="${k.go}"><span>${esc(k.l)}</span><b class="num">${k.v}</b></button>`).join("")}</div>
    <section class="focus18 glass2">
      <h3>${I18("compass",18)} 오늘의 방향</h3>
      <ol>${foc.length?foc.map((x,i)=>`<li><button data-go="${esc(x.go)}"><i class="n">${i+1}</i><span><b>${esc(x.t)}</b><em class="mut"> ${esc(x.s||"")}</em></span></button></li>`).join(""):`<li class="mut">아직 제안할 데이터가 부족해요.</li>`}</ol>
      
    </section>
    <nav class="hubs5" aria-label="허브">${hubs.map(h=>`<button class="glass2" data-go="${h[0]}">${I18(h[1],26)}<b>${esc(h[2])}</b><span>${esc(h[3])}</span></button>`).join("")}</nav>
  </div>`;
}

V.dash=V.home;
V.home=function(){
  try{if(typeof startHud==="function")startHud()}catch(e){}
  if(window._ed)return V.dash.apply(this,arguments);
  return home18();
};

V.wealth=function(){
  const f=F()||{},nw=typeof NWv==="function"?NWv():f.net,hist=netHist(),d=netDelta(30);
  const cats=(f.byCategory||[]).slice(0,6);
  const rec=(f.recurring||[]).slice().sort((a,b)=>Math.abs(b.amount||0)-Math.abs(a.amount||0)).slice(0,6);
  const bills=f.bills14||f.bills||[];
  const mer=[];
  (f.tx||[]).filter(t=>t&&t.amount<0&&t.name).forEach(t=>{const k=t.name;mer[k]=(mer[k]||0)-t.amount});
  const merTop=Object.entries((()=>{const m={};(f.tx||[]).forEach(t=>{if(t&&t.amount<0&&t.name)m[t.name]=(m[t.name]||0)-t.amount});return m})()).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const mx=Math.max(1,...cats.map(c=>c.amount||0));
  return `<div class="hub18 wealth18">
    <div class="row18"><div><p class="ey">WEALTH</p><h2 class="h18">돈</h2></div><button class="pill" data-go="future">미래 · 방향 →</button></div>
    <section class="hero18">
      <span class="k18">순자산</span>
      <b class="hero-n num" data-count="${nw==null?"":nw}" data-money="1">${nw==null?"—":money(nw)}</b>
      ${d?`<span class="dir18 ${d.d>=0?"t-ok":"t-lo"}">${sg(d.d)} · ${d.days}일 관측</span>`:""}
      <div class="chart18">${area18(hist,{gold:true})}</div>
    </section>
    <div class="kpi3">
      <button class="glass2" data-go="flow"><span>30일 현금흐름</span><b class="num ${f.cash30<0?"t-lo":"t-ok"}">${f.cash30==null?"—":sg(f.cash30)}</b></button>
      <button class="glass2" data-go="card"><span>현금 · 카드</span><b class="num sm">${money(f.cash)}</b><b class="num sm mut">${money(f.cardBalance)}</b></button>
      <button class="glass2" data-go="recur"><span>정기결제</span><b class="num">${(f.recurring||[]).length}건</b></button>
    </div>
    <section class="glass2" style="padding:20px">
      <div class="row18"><h3 style="margin:0">분류별 지출</h3><button class="pill" data-go="money">자세히</button></div>
      ${cats.map(c=>`<button class="row18b" data-go="cat:${esc(c.cat)}"><span>${esc(c.cat)}</span><b class="num">${money(c.amount)}</b><em class="bar18"><em style="width:${Math.round(100*(c.amount||0)/mx)}%"></em></em></button>`).join("")||`<p class="mut">분류 데이터 없음</p>`}
    </section>
    <section class="glass2" style="padding:20px">
      <div class="row18"><h3 style="margin:0">가맹점</h3><button class="pill" data-go="money">거래</button></div>
      ${merTop.map(([n,v])=>`<button class="row18b" data-go="mer:${esc(n)}"><span>${esc(n)}</span><b class="num">${money(v)}</b></button>`).join("")||`<p class="mut">가맹점 데이터 없음</p>`}
    </section>
    <section class="glass2" style="padding:20px">
      <div class="row18"><h3 style="margin:0">정기결제 · 청구</h3><button class="pill" data-go="recur">전체</button></div>
      ${bills.slice(0,5).map(b=>`<button class="row18b" data-go="bills14"><span>${esc((b.name||"").slice(0,28))}<i class="mut"> ${esc(b.next||"")}</i></span><b class="num">${money(Math.abs(b.amount||0))}</b></button>`).join("")||`<p class="mut">예정된 청구 없음</p>`}
      <p class="mut">정기결제는 거래 패턴 추정이에요. 금융 조언이 아닙니다.</p>
    </section>
    <div class="mom">${[["forecast","이번 달 전망 · 추정"],["patterns","내 패턴"],["nwchg","순자산 변화"],["txall","전체 거래"],["dash","전체 타일"]].map(x=>`<button class="schip18 glass2" data-go="${x[0]}">${esc(x[1])}</button>`).join("")}</div>
  </div>`;
};

V.life=function(){
  const areas=areaLife(),mx=D.mailx||{},m=M()||{},x=D.x||{},docs=D.docs||{},pr=D.profile||{};
  const senders=((m.byType)||[]).slice(0,6);
  const topSend=((PAT().latest||{}).mail||{}).senders||m.senders||[];
  const tweets=((x.profile)||{}).tweets;
  const tn=Array.isArray(tweets)?tweets.length:(tweets&&tweets.length)||0;
  const tops=docTopics();
  return `<div class="hub18 life18">
    <div class="row18"><div><p class="ey">LIFE</p><h2 class="h18">나</h2></div><button class="pill" data-go="me">프로필</button></div>
    <div class="areas">${areas.map(a=>`<button class="area glass2 ${a.tone||""}" ${a.go?`data-go="${a.go}"`:"disabled"}>
      ${I18(a.ic,26)}<span><b>${esc(a.n)}</b><em>${esc(a.st)}</em><em>${esc(a.tr)}</em><i class="nxt">${esc(a.nx)}</i></span>
    </button>`).join("")}</div>
    <section class="glass2" style="padding:20px">
      <div class="row18"><h3 style="margin:0">메일 · 정리</h3><button class="pill" data-go="mailx">메일</button></div>
      <div class="mailx">
        ${[["receipts","영수증", (mx.receipts||[]).length,"orders"],["packages","배송", (mx.packages||[]).length,"orders"],["school","학교·가족", (mx.school||[]).length,"family"],["travel","여행", (mx.travel||[]).length,"mailx"],["reply","회신 후보 · 추정", replyN(),"reply"],["unread","안 읽은 추정", m.unreadEstimate||m.unread,"unread"]].map(x=>`<button class="mx glass2" data-go="${x[3]}"><span class="mut">${esc(x[1])}</span><b class="num">${x[2]==null?"—":x[2]}</b></button>`).join("")}
      </div>
      <p class="mut">배송·여행 건수는 메일 제목 패턴 추정이에요. ${(mx.packagesNote||mx.travelNote||"")?esc(String(mx.packagesNote||mx.travelNote||"").slice(0,80)):""}</p>
    </section>
    ${topSend.length?`<section class="glass2" style="padding:20px"><h3 style="margin:0 0 8px">자주 온 보낸 이 (샘플)</h3>${topSend.slice(0,6).map(s=>`<div class="row nl"><span>${esc(s.from||s.name||"")}</span><b>${s.n||1}</b></div>`).join("")}</section>`:""}
    <section class="glass2" style="padding:20px">
      <div class="row18"><h3 style="margin:0">파일 · 주제</h3><button class="pill" data-go="drive">Drive</button></div>
      ${tops.length?tops.map(([k,n])=>`<button class="pill" data-go="drive">${esc(k)} ${n}</button>`).join(" "):`<p class="mut">최근 파일 없음</p>`}
      <p class="mut">주제는 파일 이름만으로 나눈 추정이에요. 최근 ${((docs.files)||[]).length}개.</p>
    </section>
    <section class="glass2" style="padding:20px">
      <div class="row18"><h3 style="margin:0">봇 · X · 관심</h3></div>
      <div class="mom">
        <button class="schip18 glass2" data-go="bots">봇 ${(D.health&&D.health.ok!=null)?(D.health.ok+"/"+D.health.total):((D.bots||[]).length+"개")}</button>
        <button class="schip18 glass2" data-go="x">X 팔로워 ${x.followers==null?"—":x.followers}${tn?` · 글 ${tn}`:""}${(x.mentions||[]).length?` · 멘션 ${(x.mentions||[]).length}`:""}</button>
        <button class="schip18 glass2" data-go="interests">관심 주제 ${(pr.topics||[]).length}개</button>
        <button class="schip18 glass2" data-go="patterns">패턴 기록 ${(PAT().series||[]).length}회</button>
        <button class="schip18 glass2" data-go="week">이번 주 일정</button>
      </div>
    </section>
    <p class="mut">건강 데이터는 연결된 출처가 없어 비워 두었어요.</p>
  </div>`;
};

V.future=function(){
  const t=traj18(),f=F()||{},chips=momChips(),tl=timeline18(),foc=compass18();
  const sm=sideMo();
  const yfmt=v=>v==null?"—":(v<0?"소진 구간 "+money(v):money(v));
  const hist=netHist();
  const freePct=t.free&&t.nw!=null?t.nw/t.free:null;
  const milPct=t.nw!=null?t.nw/t.tgt:null;
  const sidePct=sm.sum/500;
  return `<div class="hub18 future18">
    <div class="row18"><div><p class="ey">TRAJECTORY · 추정</p><h2 class="h18">미래 · 방향</h2></div></div>
    <section class="hero18">
      <span class="k">지금 페이스를 유지하면 (추정)</span>
      <div class="chart18">${area18(hist,{gold:true})}</div>
      <p class="mut">관측 순자산 ${t.obsDays||"—"}일 ${t.obsD==null?"—":sg(t.obsD)}. 30일 현금흐름 ${t.cash30==null?"—":sg(t.cash30)}을 월 페이스로 썼어요. 수익률은 넣지 않았습니다.</p>
    </section>
    <div class="scen">
      <article class="glass2"><span class="ey">1년</span><b class="num ${t.y1<0?"t-lo":""}">${yfmt(t.y1)}</b><span class="mut">현재 30일 페이스</span></article>
      <article class="glass2"><span class="ey">5년</span><b class="num ${t.y5<0?"t-lo":""}">${yfmt(t.y5)}</b><span class="mut">같은 가정</span></article>
      <article class="glass2"><span class="ey">10년</span><b class="num ${t.y10<0?"t-lo":""}">${yfmt(t.y10)}</b><span class="mut">같은 가정</span></article>
    </div>
    <section class="glass2" style="padding:20px">
      <h3 style="margin:0 0 8px">목표로 가려면</h3>
      <p>10년 안에 ${money(t.tgt)}에 닿으려면 월 약 <b class="num">${t.needMo==null?"—":money(t.needMo)}</b>이 쌓이는 페이스가 필요해요. <span class="mut">단순 나눗셈 추정, 수익·물가 없음.</span></p>
      <p>경제 자유(연 지출의 25배, 인출 4% 가정)는 약 <b class="num">${t.free==null?"—":money(t.free)}</b>예요. 연 지출 가정 ${money(t.spendY)}.</p>
    </section>
    <div class="rings">
      ${ring18(milPct,"$1M 목표", t.nw==null?"—":money(t.nw)+" / "+money(t.tgt),"rich:goal",true)}
      ${ring18(freePct==null?0:Math.min(1,freePct),"경제 자유", t.free==null?"데이터 부족":"추정","future",true)}
      ${ring18(Math.min(1,sidePct||0),"부업 이번 달", money(sm.sum)+" / $500 · 추정","side")}
    </div>
    <p class="mut">단기 부업 목표는 월 $300–500이에요. 체류 자격(L-1) 조건을 먼저 보세요. 금융·법률 조언이 아닙니다.</p>
    <section class="glass2" style="padding:20px">
      <h3 style="margin:0 0 8px">최근 발전 · 미끄러짐</h3>
      <div class="mom">${chips.map(c=>`<button class="schip18 glass2 ${c.n>=0?"t-ok":"t-lo"}" data-go="${c.go}"><b>${esc(c.t)}</b> ${esc(c.s)}<em class="mut"> ${esc(c.note||"")}</em></button>`).join("")}</div>
    </section>
    <section class="glass2" style="padding:20px">
      <h3 style="margin:0 0 8px">성장 타임라인</h3>
      <div class="tl18">${tl.map(x=>`<div class="it"><i class="dot"></i><div><b>${esc(x.t)}</b><div class="mut">${esc(x.k)} · ${esc(x.s||"")}</div></div></div>`).join("")}</div>
    </section>
    <section class="focus18 glass2">
      <h3>${I18("compass",18)} 이번 주 세 가지</h3>
      <ol>${foc.map((x,i)=>`<li><button data-go="${esc(x.go)}"><i class="n">${i+1}</i><span><b>${esc(x.t)}</b><em class="mut"> ${esc(x.s||"")}</em></span></button></li>`).join("")}</ol>
    </section>
  </div>`;
};

function featMedia(){
  const fun=FUN()||{},odd=fun.odd||fun.offbeat||[],vids=fun.videos||[];
  const space=(fun.space||[]).concat((D.world||{}).apod?[(D.world||{}).apod]:[]);
  const imgOf=o=>o&&(o.img||o.image||o.thumb||o.urlImg);
  const pick=odd.find(imgOf)||vids.find(v=>v.thumb||v.image)||space.find(imgOf);
  return {fun,odd,vids,pick};
}

V.play=function(){
  const {fun,odd,vids,pick}=featMedia();
  const space=fun.space||[];
  const inews=fun.inews||fun.odd||odd;
  const feat=pick||odd[0]||vids[0];
  const featImg=feat&&(feat.img||feat.image||feat.thumb);
  const featT=feat&&(feat.title||feat.t||"");
  const featL=feat&&(feat.link||feat.url|| (feat.id?`https://www.youtube.com/watch?v=${feat.id}`:"#inews"));
  const rest=(odd.length?odd:inews).filter(x=>x!==feat&&(x.img||x.image||x.thumb)).slice(0,8);
  const vrow=vids.slice(0,10);
  return `<div class="hub18 play18">
    <div class="row18"><div><p class="ey">PLAY</p><h2 class="h18">재미</h2></div><button class="pill" data-go="videos">영상 벽</button></div>
    ${feat?`<a class="feat" href="${esc(featL||"#inews")}" ${String(featL||"").startsWith("http")?'target="_blank" rel="noopener"':`data-go="inews"`}>
      ${featImg?`<img src="${esc(featImg)}" alt="">`:`<div style="height:220px;background:linear-gradient(135deg,#123,#1a3040)"></div>`}
      <span><i class="ey">FEATURED</i><b>${esc(featT)}</b></span>
    </a>`:`<p class="mut">오늘은 아직 이색 이미지가 없어요.</p>`}
    <div class="row18"><h3 style="margin:0">이색 · 한컷</h3><button class="pill" data-go="inews">더 보기</button></div>
    <div class="mag">${rest.map(x=>{
      const im=x.img||x.image||x.thumb||"";const tt=x.title||x.t||"";const lk=x.link||x.url||"#inews";
      return `<a href="${esc(lk)}" ${String(lk).startsWith("http")?'target="_blank" rel="noopener"':`data-go="inews"`}>${im?`<img src="${esc(im)}" alt="">`:""}<span>${esc(tt)}</span></a>`;
    }).join("")}</div>
    <div class="row18"><h3 style="margin:0">관심 영상</h3><button class="pill" data-go="videos">전체</button></div>
    <div class="mag">${vrow.map(v=>{
      const im=v.thumb||v.image||"";const tt=v.title||v.t||"";const id=v.id||v.videoId||"";
      return `<a href="#" data-yt="${esc(id)}" data-act="ytplay:${esc(id)}">${im?`<img src="${esc(im)}" alt="">`:""}<span>${esc(tt)}</span></a>`;
    }).join("")}</div>
    <div class="mom">
      <button class="schip18 glass2" data-go="space">우주 · 과학</button>
      <button class="schip18 glass2" data-go="globe">지구본</button>
      <button class="schip18 glass2" data-go="near">근처</button>
      <button class="schip18 glass2" data-go="odd">이색 전체</button>
    </div>
    <p class="mut">수집 ${esc((fun.at||"").toString().slice(0,16))}. 채널 목록은 검증된 피드만 씁니다.</p>
  </div>`;
};

const _world18=V.world;
V.world=function(){
  const w=D.world||{};
  const inner=_world18?_world18.apply(this,arguments):"";
  return `<div class="hub18 world18"><div class="row18"><button class="pill" data-go="globe">지구본</button></div>${inner}</div>`;
};

const _pal18=palItems;
palItems=function(){
  const it=_pal18();
  [["home","오늘 홈"],["wealth","돈 허브"],["life","나 · 삶"],["future","미래 · 방향"],["world","세계"],["play","재미"],["dash","전체 타일"],["jarvis","JARVIS 비서"]].forEach(r=>it.unshift({l:r[1],s:r[0],go:r[0]}));
  return it;
};

function armCount18(){
  try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return}catch(e){return}
  document.querySelectorAll("[data-count]").forEach(el=>{
    if(el.dataset.armed||el.dataset.count==="")return;
    const t=+el.dataset.count;if(!isFinite(t))return;
    el.dataset.armed="1";
    const mon=el.dataset.money==="1";
    const t0=performance.now();
    const tick=now=>{
      const p=Math.min(1,(now-t0)/900),e=1-Math.pow(1-p,3),v=t*e;
      el.textContent=mon?money(v):Math.round(v).toLocaleString("en-US");
      if(p<1)requestAnimationFrame(tick);
      else el.textContent=mon?money(t):Math.round(t).toLocaleString("en-US");
    };
    requestAnimationFrame(tick);
  });
}

function ensureFab(){
  if($("jfab"))return;
  const b=document.createElement("button");
  b.id="jfab";b.className="assist18";b.setAttribute("data-go","jarvis");b.setAttribute("aria-label","JARVIS 비서");
  b.innerHTML=I18("jarvis",22);
  document.body.appendChild(b);
}

const _render18=render;
render=function(){
  const r=_render18.apply(this,arguments);
  try{ensureFab();armCount18()}catch(e){}
  return r;
};

try{ensureFab()}catch(e){}
