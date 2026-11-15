/* v16 — patterns, needs hub, tighter HUD, desktop multi-column */
const PAT=()=>D.patterns||{};
let _useAt=0,_useRt="";
function logUse(r){if(!r||!secReady())return;const now=Date.now();if(r===_useRt&&now-_useAt<1500)return;_useRt=r;_useAt=now;
 const u=SX("use");u.days=u.days||{};u.hours=u.hours||Array(24).fill(0);u.routes=u.routes||{};
 const d=TODAY(),h=new Date().getHours();u.days[d]=u.days[d]||{};u.days[d][r]=(u.days[d][r]||0)+1;u.hours[h]=(u.hours[h]||0)+1;u.routes[r]=(u.routes[r]||0)+1;
 Object.keys(u.days).sort().slice(0,-60).forEach(k=>delete u.days[k]);saveSec()}
const _go16=go;go=function(p){try{logUse((p||"").split(":")[0])}catch(e){}_go16(p)};
try{addEventListener("hashchange",()=>{try{logUse((location.hash.slice(1)||"home").split(":")[0])}catch(e){}})}catch(e){}
/* ---------- pattern helpers ---------- */
function patSeries(){return (PAT().series||[]).slice()}
function weekSpend(){const f=F(),w=f.weeks||[];return w.map(x=>({l:x.range||x.to||x.at,v:+x.spend||0,from:x.from,to:x.to}))}
function wdSpend(){const live=(PAT().latest||{}).weekdaySpend;if(live&&live.length===7)return live.slice();
 const w=[0,0,0,0,0,0,0];(F().tx||[]).forEach(t=>{if(t.amount<0&&t.date){const d=new Date(t.date+"T12:00:00");if(!isNaN(+d))w[(d.getDay()+6)%7]+=-t.amount}});return w.map(x=>+x.toFixed(2))}
function insights(){const out=[],w=wdSpend(),lab=(PAT().weekdayLabels)||["월","화","수","목","금","토","일"];
 const wd=w.slice(0,5),we=w.slice(5),aw=wd.reduce((a,b)=>a+b,0)/5,ae=(we[0]+we[1])/2,mx=Math.max(...w),ix=w.indexOf(mx);
 if(aw>0&&ae>=0){const r=ae/aw;out.push(r>=1.15?`주말 지출이 평일 평균의 ${r.toFixed(1)}배예요.`:r<=0.75?`주말 지출이 평일 평균보다 낮아요 (${r.toFixed(1)}배).`:`주말과 평일 지출이 비슷해요.`)}
 if(ix>=0&&aw>0&&mx>aw*1.6)out.push(`${lab[ix]}요일 지출이 다른 평일 평균보다 ${(mx/aw).toFixed(1)}배 많아요. 큰 건이 포함됐을 수 있어요.`);
 const cats=F().byCategory||[],tot=cats.reduce((a,c)=>a+c.amount,0);
 if(cats[0]&&tot)out.push(`최근 30일 지출의 ${Math.round(100*cats[0].amount/tot)}%가 ${cats[0].cat}예요.`);
 const weeks=weekSpend(),cur=weeks[weeks.length-1],avg=weeks.slice(0,-1).slice(-8);
 if(cur&&avg.length){const m=avg.reduce((a,x)=>a+x.v,0)/avg.length;if(m>0)out.push(`이번 주 지출은 최근 평균의 ${(cur.v/m).toFixed(1)}배예요.`)}
 const rec=(F().recurring||[]).reduce((a,r)=>a+Math.abs(r.amount||0),0),inc=F().income30;
 if(rec&&inc)out.push(`정기결제가 최근 30일 수입의 ${Math.round(100*rec/inc)}%예요.`);
 const f=F();if(f.cardUtil>=50)out.push(`카드 사용률 ${f.cardUtil}%예요. 30% 아래면 더 여유로워집니다.`);
 if(f.cash30<0)out.push(`30일 현금흐름이 ${sg(f.cash30)}예요.`);
 if(!out.length)out.push("아직 비교할 패턴이 부족해요.");
 return out.slice(0,5)}
function heatWD(){const w=wdSpend(),lab=(PAT().weekdayLabels)||["월","화","수","목","금","토","일"],mx=Math.max(1,...w);
 return `<div class="hmap" role="img" aria-label="요일별 지출">${w.map((v,i)=>`<div class="hcell" style="--p:${v/mx}" data-go="patterns"><b>${lab[i]}</b><em>${v?money(v):"—"}</em></div>`).join("")}</div><p class="mut">거래 기록에 시각이 없어 요일만 표시해요.</p>`}
function heatUse(){const u=secReady()?SX("use"):{},hrs=u.hours||[],days=u.days||{},mx=Math.max(1,...hrs);
 const has=hrs.some(n=>n>0)||Object.keys(days).length;
 if(!has)return `<p class="mut">앱 사용 시간대는 이 기기에서 화면을 열 때부터 암호화해 모아요. 아직 기록이 없어요.</p>`;
 const lab=["월","화","수","목","금","토","일"],grid=Array.from({length:7},()=>Array(24).fill(0));
 Object.entries(days).forEach(([d,rts])=>{const wd=(new Date(d+"T12:00:00").getDay()+6)%7,n=Object.values(rts).reduce((a,b)=>a+b,0);if(n)grid[wd][12]+=n}); // day totals parked mid if no hour-per-day
 // prefer hour totals as a 1×24 row plus weekday opens
 const opens=[0,0,0,0,0,0,0];Object.keys(days).forEach(d=>{const wd=(new Date(d+"T12:00:00").getDay()+6)%7;opens[wd]+=Object.values(days[d]).reduce((a,b)=>a+b,0)});
 const om=Math.max(1,...opens);
 return `<div class="uhour">${hrs.map((n,i)=>`<i title="${i}시 ${n}회" style="--p:${n/mx}"></i>`).join("")}</div>
 <div class="ulab">${[0,6,12,18,23].map(h=>`<span style="grid-column:${h+1}">${h}시</span>`).join("")}</div>
 <div class="hmap sm">${opens.map((n,i)=>`<div class="hcell" style="--p:${n/om}"><b>${lab[i]}</b><em>${n}회</em></div>`).join("")}</div>`}
function merTrend(){const ser=patSeries().filter(s=>s.byMerchant&&s.byMerchant.length),names={};
 ser.forEach(s=>s.byMerchant.forEach(m=>names[m.name]=(names[m.name]||0)+m.amt));
 const top=Object.entries(names).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]);
 if(!top.length)return `<p class="mut">가맹점 추이를 그릴 데이터가 부족해요.</p>`;
 const cols=ser.slice(-12);
 return `<div class="mtr">${top.map(nm=>{const pts=cols.map(s=>((s.byMerchant||[]).find(m=>m.name===nm)||{}).amt||0);const mx=Math.max(1,...pts);
  return `<div class="mtr-r"><span class="mtr-n" title="${esc(nm)}">${esc(nm)}</span><div class="mtr-b">${pts.map(v=>`<i style="height:${Math.round(100*v/mx)}%"></i>`).join("")}</div><em>${money(pts[pts.length-1]||0)}</em></div>`}).join("")}</div>`}
V.patterns=()=>{const weeks=weekSpend(),cur=weeks[weeks.length-1],avg=weeks.slice(0,-1).slice(-8),mean=avg.length?avg.reduce((a,x)=>a+x.v,0)/avg.length:null;
 const vs=cur&&mean?cur.v-mean:null,tone=vs==null?"":vs>0?"t-lo":"t-ok";
 return `<section class="hero14 glass2"><span class="ey">MY PATTERNS · 실제 거래</span><h2 class="h14">내 패턴</h2><p class="mut">요일·가맹점·주간 비교는 실제 거래입니다. 문장은 규칙으로 만든 추정이에요. 시간대 지출은 거래에 시각이 없어 표시하지 않아요.</p></section>`
  +H2("요일별 지출","실제")+heatWD()
  +H2("주요 가맹점 추이","주 단위 · 실제")+merTrend()
  +H2("최근 주 vs 내 평균",mean!=null?("평균 "+money(mean)):"—")
  +`<div class="kpis"><div class="kpi ${tone}"><div class="k">이번 주</div><div class="v">${cur?money(cur.v):"—"}</div></div>
    <div class="kpi"><div class="k">최근 평균</div><div class="v">${mean!=null?money(mean):"—"}</div></div>
    <div class="kpi ${tone}"><div class="k">차이</div><div class="v">${vs==null?"—":((vs>0?"+":"")+money(vs))}</div></div></div>`
  +(weeks.length?card(chBars(weeks.slice(-8).map(x=>x.v),{h:110,labels:weeks.slice(-8).map(x=>(x.l||"").slice(0,5)),color:"var(--gold)",fmt:v=>money(v)})):"")
  +H2("앱 사용 습관","이 기기에 암호화")+heatUse()
  +H2("자동 인사이트","규칙 · 추정")+`<div class="card ins16">${insights().map(t=>`<p>✦ ${esc(t)}</p>`).join("")}</div>`};
/* ---------- forecast / needs ---------- */
function forecast(){const f=F(),today=new Date(),y=today.getFullYear(),m=today.getMonth(),dim=new Date(y,m+1,0).getDate(),dom=today.getDate(),left=dim-dom;
 const mtd=(f.daily||[]).filter(d=>d.date&&d.date.slice(0,7)===TODAY().slice(0,7)).reduce((a,d)=>a+(d.spend||0),0);
 const avg=dom?mtd/dom:0, bills=(f.recurring||[]).filter(r=>r.next&&r.next.slice(0,7)===TODAY().slice(0,7)&&r.next>=TODAY());
 const billSum=bills.reduce((a,r)=>a+Math.abs(r.amount||0),0), projSpend=mtd+avg*left, incMtd=(f.income||[]).filter(t=>t.date&&t.date.slice(0,7)===TODAY().slice(0,7)).reduce((a,t)=>a+(t.amount||0),0);
 const incPace=dom?incMtd/dom*dim:incMtd, flow=incPace-projSpend, endCash=(f.cash||0)+incPace-projSpend;
 return {dom,dim,left,mtd,avg,billSum,bills,projSpend,incMtd,incPace,flow,endCash,cash:f.cash}}
V.forecast=()=>{const F0=forecast();
 return `<section class="hero14 glass2"><span class="ey">CASH FLOW · 이번 달 추정</span><h2 class="h14 ${F0.flow<0?"t-lo":"t-ok"}">${F0.flow<0?sg(F0.flow):"+"+money(F0.flow)}</h2><p class="mut">오늘까지 실제 지출·수입을 남은 날에 연장하고, 이번 달 남은 정기결제를 참고한 추정입니다.</p></section>`
  +`<div class="kpis"><div class="kpi"><div class="k">오늘까지 지출</div><div class="v">${money(F0.mtd)}</div></div>
    <div class="kpi"><div class="k">예상 월 지출</div><div class="v">${money(F0.projSpend)}</div></div>
    <div class="kpi"><div class="k">오늘까지 수입</div><div class="v">${money(F0.incMtd)}</div></div>
    <div class="kpi"><div class="k">남은 정기결제</div><div class="v">${money(F0.billSum)}</div></div>
    <div class="kpi"><div class="k">예상 월말 현금</div><div class="v">${F0.endCash!=null?money(F0.endCash):"—"}</div></div>
    <div class="kpi"><div class="k">남은 날</div><div class="v">${F0.left}일</div></div></div>`
  +`<div class="note">일평균 지출 ${money(F0.avg)} × 남은 ${F0.left}일. 금융 조언이 아닙니다.</div>`
  +(F0.bills.length?H2("이번 달 남은 정기결제",F0.bills.length+"건")+F0.bills.map(b=>`<div class="rcard glass2"><b>${esc(b.name)}</b> ${money(b.amount)} <span class="mut">${b.next}</span></div>`).join(""):"")};
V.bills14=()=>{const f=F(),L=f.bills14||(f.recurring||[]).filter(r=>r.next&&r.next>=TODAY()&&(new Date(r.next)-Date.now())/864e5<=14),tot=L.reduce((a,r)=>a+Math.abs(r.amount||0),0);
 const soon=L.filter(r=>(new Date(r.next)-Date.now())/864e5<=3);
 return `<section class="hero14 glass2"><span class="ey">NEXT 14 DAYS</span><h2 class="h14">${money(tot)}</h2><p class="mut">${L.length}건 · 3일 안 ${soon.length}건 · 거래 패턴 추정</p></section>`
  +(L.length?L.map(r=>{const d=Math.ceil((new Date(r.next+"T12:00:00")-Date.now())/864e5),cl=d<=3?"t-lo":d<=7?"t-mid":"";
    return `<div class="rcard glass2 ${cl}"><div class="oc-h"><b>${esc(r.name)}</b><span class="tg">${d<=0?"오늘":d+"일 후"}</span></div><div class="oc-m">${money(r.amount)}</div><div class="oc-s">${r.next||"—"} · ${esc(r.kind||"")}</div></div>`}).join(""):'<p class="mut">14일 안 예상 결제가 없어요.</p>')};
V.nwchg=()=>{const f=F(),nw=typeof NWv==="function"?NWv():f.net,bt=typeof balTrend==="function"?balTrend(90):[];
 const at=d=>{const x=bt.find(p=>p.d===d);return x?x.net+(typeof manual==="function"?manual():0):null};
 const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return at(d.toISOString().slice(0,10))||(bt[0]&&n>=80?bt[0].net+(typeof manual==="function"?manual():0):null)};
 const d7=ago(7),d30=ago(30),d90=bt[0]?bt[0].net+(typeof manual==="function"?manual():0):null;
 const row=(l,v,go)=>v==null?"":`<button class="kpi ${nw-v>=0?"t-ok":"t-lo"}" data-go="${go}"><div class="k">${l}</div><div class="v">${(nw-v>=0?"+":"")+money(nw-v)}</div><span class="mut">그때 ${money(v)}</span></button>`;
 return `<section class="hero14 glass2"><span class="ey">NET WORTH CHANGE · 실제</span><h2 class="h14">순자산 변화</h2><p class="mut">지금 ${money(nw)} · 현금 − 카드. 변화는 잔액과 거래로 역산한 궤적입니다.</p></section>`
  +`<div class="kpis">${row("7일",d7,"nwtl")}${row("30일",d30,"nwtl")}${row("90일",d90,"nwtl")}</div>`
  +(bt.length?card(chLine(bt.map(x=>[tsx(x.d),x.net+(typeof manual==="function"?manual():0)]),{h:150,axis:1,color:"#ffd166",fmt:v=>money(v),xfmt:dX})):"" )
  +`<button class="btnp" data-go="nwtl">타임라인 · 페이스 →</button>`};
function unent(t){return String(t||"").replace(/&amp;/g,"&").replace(/&#39;|&apos;/g,"'").replace(/&quot;/g,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n)).replace(/&lt;/g,"<").replace(/&gt;/g,">")}
V.reply=()=>{const L=(M().needsReply)||[];
 return `<section class="hero14 glass2"><span class="ey">MAIL · 추정</span><h2 class="h14">회신 후보 ${L.length}</h2><p class="mut">${esc(M().needsReplyNote||"프로모션·알림을 제외한 최근 메일 샘플. 실제 회신 여부는 확인하지 못했어요.")}</p></section>`
  +(L.length?L.map(m=>`<div class="rcard glass2"><b>${esc(unent(m.subject))}</b><div class="mut">${esc(unent(m.from))} · ${(m.date||"").slice(0,16)} · ${esc(m.type||"")}</div><p>${esc(unent(m.snippet||""))}</p></div>`).join(""):'<p class="mut">회신 후보가 없어요.</p>')};
V.week=()=>{const start=new Date();start.setHours(12,0,0,0);start.setDate(start.getDate()-start.getDay()); // Sunday
 const days=[...Array(7)].map((_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d.toISOString().slice(0,10)});
 const hol=((D.cal||{}).holidays||[]),bills=(F().recurring||[]),ev=D.events||[];
 const cell=d=>{const H=hol.filter(h=>h.date===d),B=bills.filter(b=>b.next===d),E=ev.filter(e=>(e.date||"").slice(0,10)===d);
  return `<div class="wkd glass2 ${d===TODAY()?"on":""}"><b>${["일","월","화","수","목","금","토"][new Date(d+"T12:00:00").getDay()]} <em>${d.slice(8)}</em></b>
   ${H.map(h=>`<span class="tg">공휴일 ${esc(h.title)}</span>`).join("")}
   ${B.map(b=>`<div class="wk-i t-mid">${esc(b.name)} ${money(b.amount)}</div>`).join("")}
   ${E.slice(0,2).map(e=>`<div class="wk-i">${esc(e.subject)}</div>`).join("")}
   ${!H.length&&!B.length&&!E.length?'<span class="mut">비어 있음</span>':""}</div>`};
 return `<section class="hero14 glass2"><span class="ey">THIS WEEK</span><h2 class="h14">이번 주 일정</h2><p class="mut">${(D.cal||{}).personal&&D.cal.personal.length?"개인 일정 포함":"개인 캘린더 일정 없음 · 공휴일·예상 결제·행사 알림만"}</p></section>`
  +`<div class="week7">${days.map(cell).join("")}</div>`};
function moves(){const mk=typeof MK==="function"?MK():(D.market||{}),coins=(typeof coinsNow==="function"?coinsNow():((mk.coins)||[])),stocks=mk.stocks||{};
 const L=[];(ST.watch||["BTC","ETH","XRP","SOL"]).forEach(s=>{const c=coins.find(x=>x.sym===s);if(c)L.push({s,n:s,chg:c.chg??c.usdChg,price:c.krw||c.usd,k:"coin",go:"crypto"})});
 Object.keys(stocks).forEach(k=>{const v=stocks[k]||{};L.push({s:k,n:v.name||k,chg:v.chg,price:v.price||v.cur,k:"stk",go:"stk:"+k})});
 const seen=new Set();return L.filter(x=>x.chg!=null&&(seen.has(x.s)?false:seen.add(x.s))).sort((a,b)=>Math.abs(b.chg||0)-Math.abs(a.chg||0))}
V.watchm=()=>{const L=moves();
 return `<section class="hero14 glass2"><span class="ey">WATCHLIST</span><h2 class="h14">관심 종목 움직임</h2><p class="mut">수집된 시세 · 등락이 큰 순. 투자 조언이 아닙니다.</p></section>`
  +(L.length?`<div class="mv16">${L.slice(0,16).map(x=>`<button class="mvc glass2 ${x.chg>=0?"t-ok":"t-lo"}" data-go="${esc(x.go)}"><b>${esc(x.s)}</b><em>${x.chg>=0?"+":""}${(+x.chg).toFixed(2)}%</em><span class="mut">${x.price!=null?(x.k==="coin"?"₩":"$")+Number(x.price).toLocaleString("en-US"):""}</span></button>`).join("")}</div>`:'<p class="mut">시세 데이터 없음</p>')};
function needsTiles(){const f=F(),Fc=forecast(),nw=typeof NWv==="function"?NWv():f.net,bt=typeof balTrend==="function"?balTrend(30):[],d30=bt[0]?nw-(bt[0].net+(typeof manual==="function"?manual():0)):null;
 const bills=f.bills14||[],mailL=(M().needsReply)||[],hol=((D.cal||{}).holidays||[]).filter(h=>{const d=(new Date(h.date+"T12:00:00")-Date.now())/864e5;return d>=-0.5&&d<=7});
 const mv=moves()[0],bots=D.health||{};
 return [
  {go:"forecast",ic:"≈",k:"이번 달 전망",v:Fc.flow==null?"—":(Fc.flow<0?sg(Fc.flow):"+"+money(Fc.flow)),s:"추정",tone:Fc.flow<0?"lo":"ok"},
  {go:"bills14",ic:"▣",k:"14일 결제",v:money(bills.reduce((a,r)=>a+Math.abs(r.amount||0),0)),s:(bills.length||0)+"건 · 추정",tone:bills.some(r=>(new Date(r.next)-Date.now())/864e5<=3)?"lo":bills.length?"mid":"ok"},
  {go:"nwchg",ic:"↗",k:"순자산 변화",v:d30==null?"—":((d30>=0?"+":"")+money(d30)),s:"30일 · 실제",tone:d30==null?"":d30>=0?"ok":"lo"},
  {go:"reply",ic:"✉",k:"회신 후보",v:String(mailL.length),s:"추정",tone:mailL.length?"mid":"ok"},
  {go:"week",ic:"▦",k:"이번 주",v:hol[0]?hol[0].title:"한산",s:hol[0]?"공휴일":"개인 일정 없음",tone:hol[0]?"mid":""},
  {go:"watchm",ic:"◉",k:"관심 종목",v:mv?(mv.s+" "+(mv.chg>=0?"+":"")+Number(mv.chg).toFixed(1)+"%"):"—",s:"시세",tone:mv?(Math.abs(mv.chg)>=1.5?(mv.chg<0?"lo":"ok"):""):""},
  {go:"bots",ic:"⬡",k:"봇 상태",v:(bots.ok||0)+"/"+(bots.total||0),s:(bots.pct!=null?bots.pct+"%":""),tone:bots.pct>=80?"ok":bots.pct>=50?"mid":"lo"},
  {go:"patterns",ic:"▣",k:"내 패턴",v:"요일·가맹점",s:"실제 거래",tone:""}
 ]}
V.needs=()=>`<section class="hero14 glass2"><span class="ey">NOW · 한눈에</span><h2 class="h14">지금 볼 것</h2><p class="mut">각 칸을 누르면 해당 화면으로 갑니다.</p></section><div class="needs16 page">${needsTiles().map(t=>`<button class="ntile glass2 t-${t.tone}" data-go="${t.go}"><span class="ic">${t.ic}</span><span class="k">${esc(t.k)}</span><b>${esc(t.v)}</b><span class="mut">${esc(t.s)}</span></button>`).join("")}</div>`;
function kpi16(){const f=F(),nw=typeof NWv==="function"?NWv():f.net,Fc=forecast(),bills=(f.bills14||[]).length,bots=D.health||{};
 const t=[{go:"nwchg",k:"순자산",v:money(nw),tone:""},{go:"forecast",k:"30일 흐름",v:f.cash30==null?"—":sg(f.cash30),tone:f.cash30==null?"":f.cash30<0?"lo":"ok"},
  {go:"rich:debt",k:"카드",v:f.cardUtil!=null?f.cardUtil+"%":"—",tone:f.cardUtil>=70?"lo":f.cardUtil>=50?"mid":"ok"},
  {go:"bills14",k:"14일 결제",v:bills+"건",tone:bills?"mid":"ok"},
  {go:"bots",k:"봇",v:(bots.ok||0)+"/"+(bots.total||0),tone:bots.pct>=80?"ok":"mid"}];
 return `<div class="kpi16">${t.map(x=>`<button class="k16 t-${x.tone}" data-go="${x.go}"><span>${esc(x.k)}</span><b>${esc(x.v)}</b></button>`).join("")}</div>`}
function needsStrip(){return `<div class="needs16 strip">${needsTiles().map(t=>`<button class="ntile glass2 t-${t.tone}" data-go="${t.go}"><span class="ic">${t.ic}</span><span class="k">${esc(t.k)}</span><b>${esc(t.v)}</b></button>`).join("")}</div>`}
const _home16=V.home;V.home=function(){armSnap();try{logUse("home")}catch(e){}let h=_home16.apply(this,arguments);if(window._ed)return h;
 const cut=h.indexOf('<section class="whero');const head=cut>=0?h.slice(0,cut):h,rest=cut>=0?h.slice(cut):"";
 const slim=head.replace(qa15(),"").replace(freshLine(),"");
 return `<div class="home16">${kpi16()}<div class="hud-top"><aside class="hud-side">${needsStrip()}${qa15()}${freshLine()}</aside><div class="hud-main">${slim}</div></div><div class="hud-rest">${rest}</div></div>`};
Object.assign(TITLE,{patterns:"내 패턴",needs:"지금 볼 것",forecast:"이번 달 전망",bills14:"14일 결제",nwchg:"순자산 변화",reply:"회신 후보",week:"이번 주 일정",watchm:"관심 종목"});
try{LCATS.unshift(["patterns","내 패턴","▣","var(--gold)","patterns"],["needs","지금 볼 것","◎","var(--gold)","needs"],["forecast","이번 달 전망","≈","#34d399","forecast"],["bills14","14일 결제","▣","#f5c451","bills14"])}catch(e){}
const _pal16=palItems;palItems=function(){const it=_pal16();[["patterns","내 패턴"],["needs","지금 볼 것"],["forecast","이번 달 현금흐름 전망"],["bills14","14일 안 결제"],["nwchg","순자산 변화"],["reply","회신 후보 메일"],["week","이번 주 일정"],["watchm","관심 종목 움직임"]].forEach(r=>it.unshift({l:r[1],s:r[0],go:r[0]}));return it};
/* tighten score blurb on home only via CSS; keep cinematic HUD */
