/* v15 — morning brief cards, daily score, since-last-visit, net-worth pacing, recurring calendar, search, freshness */
const isoAgeH=s=>{if(!s)return null;const d=new Date(String(s).replace(" ","T").replace(" CT","")+((/T/.test(s)&&!/[+-]\d\d/.test(s))?"-06:00":""));return isNaN(+d)?null:(Date.now()-d)/36e5};
const FR=()=>D.fresh||{};
function staleOf(){const h=isoAgeH(D.collectedAt);return h!=null&&h>48}
function srcFresh(){const f=FR(),rows=[["금융",f.finance||(F()||{}).syncedAt||D.collectedAt],["메일",f.mail||D.collectedAt],["일정",f.calendar||D.collectedAt],["파일",f.docs||D.collectedAt],["뉴스",(D.news||{}).at],["유튜브",(FUN().at)]];
 return rows.map(([k,t])=>{const h=isoAgeH(t);return {k,t,h,old:h!=null&&h>48,lab:h==null?"데이터 없음":h<1?"방금":h<24?Math.round(h)+"시간 전":Math.round(h/24)+"일 전"}})}
/* ---------- snapshot (since last visit) ---------- */
function currSnap(){const f=F(),m=M();return {at:Date.now(),net:typeof NWv==="function"?NWv():f.net,cash:f.cash,card:f.cardBalance,spend30:f.spend30,income30:f.income30,cash30:f.cash30,unread:parseInt(String(m.unread||"0"),10)||0,bills:(f.bills||[]).length,collectedAt:D.collectedAt}}
function prevSnap(){if(window._prevSnap!==undefined)return window._prevSnap;try{window._prevSnap=JSON.parse(localStorage.jv_snap||"null")}catch(e){window._prevSnap=null}return window._prevSnap}
function armSnap(){if(window._snap15)return;window._snap15=1;prevSnap();setTimeout(()=>{try{localStorage.setItem("jv_snap",JSON.stringify(currSnap()))}catch(e){}},4000)}
function sinceItems(){const a=prevSnap(),b=currSnap();if(!a)return [];const d=(k,l,go,moneyish)=>{if(a[k]==null||b[k]==null||a[k]===b[k])return null;const n=b[k]-a[k];return {k,l,go,n,txt:moneyish?(n>0?"+":"")+money(n):(n>0?"+"+n:String(n))}};
 return [d("net","순자산","rich:net",1),d("card","카드 잔액","rich:debt",1),d("cash30","30일 현금흐름","flow",1),d("spend30","30일 지출","spend",1),d("unread","안 읽은 메일","unread",0),d("bills","21일 내 청구","bills",0)].filter(Boolean)}
/* ---------- daily score (재정/일정/관심) · 추정 ---------- */
function scoreFin(){const f=F(),ev=[],s={n:"재정",go:"money",v:70};
 if(f.cash30==null&&f.net==null)return {n:"재정",v:null,ev:[["연결 필요","money"]],why:"금융 데이터 없음"};
 if(f.cash30!=null){if(f.cash30<0){s.v-=22;ev.push(["30일 현금흐름 "+sg(f.cash30),"flow"])}else{s.v+=10;ev.push(["30일 현금흐름 +"+money(f.cash30),"flow"])}}
 if(f.cardUtil!=null){if(f.cardUtil>=70){s.v-=20;ev.push(["카드 사용률 "+f.cardUtil+"%","rich:debt"])}else if(f.cardUtil>=50){s.v-=8;ev.push(["카드 사용률 "+f.cardUtil+"%","rich:debt"])}else if(f.cardUtil<30){s.v+=8;ev.push(["카드 사용률 "+f.cardUtil+"% · 여유","rich:debt"])}else ev.push(["카드 사용률 "+f.cardUtil+"%","rich:debt"])}
 const soon=(f.bills||[]).filter(b=>b.next&&(new Date(b.next)-Date.now())/864e5<=7);const sm=soon.reduce((a,b)=>a+Math.abs(b.amount||0),0);
 if(sm&&f.cash&&sm>f.cash*.35){s.v-=10;ev.push(["7일 안 결제 "+money(sm)+" (잔액 대비 큼)","bills"])}else if(soon.length)ev.push(["7일 안 결제 "+soon.length+"건","bills"]);
 s.v=Math.max(0,Math.min(100,s.v));s.ev=ev;s.why=s.v>=80?"돈 흐름이 비교적 안정적이에요":s.v>=60?"주의할 항목이 있어요":"오늘 돈 쪽을 먼저 보는 게 좋겠어요";return s}
function scoreCal(){const hol=(D.cal||{}).holidays||[],evn=D.events||[],mail=(M().flagged||[]).filter(x=>x.type==="가족·학교"),s={n:"일정",go:"cal",v:72,ev:[]};
 if(!(D.cal||{}).personal||!(D.cal.personal||[]).length){s.ev.push(["개인 일정 없음 (향후 45일)","cal"]);s.v=68}
 if(hol[0]){const d=(new Date(hol[0].date+"T12:00:00")-Date.now())/864e5;if(d>=0&&d<=10){s.v+=8;s.ev.push([hol[0].title+" "+Math.ceil(d)+"일 남음","cal"])}else s.ev.push([hol[0].title,"cal"])}
 if(evn[0])s.ev.push(["행사 알림: "+(evn[0].subject||"").slice(0,28),"events"]);
 if(mail.length){s.v-=12;s.ev.push(["안 읽은 가족·학교 메일 "+mail.length+"건 (샘플)","flag"])}
 s.v=Math.max(0,Math.min(100,s.v));s.why=s.v>=80?"일정은 한산하거나 준비된 편이에요":s.v>=60?"다가오는 일정·메일을 확인해 보세요":"오늘 일정·가족 쪽을 먼저 보세요";return s}
function scoreInt(){const s={n:"관심",go:"interests",v:70,ev:[]},fun=FUN(),tp=((D.profile||{}).topics||[]).length,h=isoAgeH(fun.at);
 if(tp){s.v+=8;s.ev.push(["대화에서 추정한 관심 주제 "+tp+"개","interests"])}else s.ev.push(["관심사 맵 없음","interests"]);
 if(h!=null&&h<12){s.v+=6;s.ev.push(["유튜브·이색 최신 수집","yt"])}else if(h!=null&&h>48){s.v-=8;s.ev.push(["볼거리 데이터가 오래됨","yt"])}
 s.v=Math.max(0,Math.min(100,s.v));s.why="관심사는 대화·선택·유튜브 기록을 합친 추정이에요";return s}
function dailyScore(){const a=scoreFin(),b=scoreCal(),c=scoreInt(),parts=[a,b,c].filter(x=>x.v!=null);const v=parts.length?Math.round(parts.reduce((s,x)=>s+x.v,0)/parts.length):null;
 return {v,parts:[a,b,c],why:v==null?"점수에 쓸 데이터가 부족해요":v>=80?"오늘은 흐름이 좋은 편이에요":v>=65?"보통이에요. 아래 카드부터 보시면 됩니다":"먼저 보면 좋은 항목이 있어요"}}
const toneOf=v=>v==null?"mut":v>=80?"ok":v>=65?"mid":"lo";
/* ---------- brief cards (Pulse/Gemini style, max 5) ---------- */
function briefCards(){const f=F(),out=[],seen=new Set(),push=c=>{if(!c||!c.t||seen.has(c.id)||out.length>=5)return;seen.add(c.id);out.push(c)};
 const sc=dailyScore();
 if(f.cash30!=null&&f.cash30<0)push({id:"flow",k:"돈",t:"30일 현금흐름 "+sg(f.cash30),why:"수입 "+money(f.income30)+" · 지출 "+money(f.spend30)+" ("+(f.range30||"")+")",src:"BoA 거래 (실제)",go:"flow",act:"흐름 보기"});
 else if(f.cash30!=null)push({id:"flow",k:"돈",t:"30일 현금흐름 +"+money(f.cash30),why:"여유분 일부를 목표 적립에 넣을지 페이스를 확인해 보세요.",src:"BoA 거래 (실제)",go:"rich:goal",act:"목표 페이스"});
 const ch=(f.recurring||[]).filter(r=>Math.abs(r.change||0)>=2||Math.abs(r.changePct||0)>=5).sort((a,b)=>Math.abs(b.change||0)-Math.abs(a.change||0))[0];
 if(ch)push({id:"chg",k:"돈",t:ch.name+" 금액 변동",why:"직전 "+money(ch.prev)+" → 이번 "+money(ch.amount)+" ("+(ch.changePct>0?"+":"")+ch.changePct+"%). 다음 예상일 "+(ch.next||"—")+".",src:"거래 패턴 (추정)",go:"recur",act:"정기결제"});
 const soon=(f.bills||[]).filter(b=>b.next&&(new Date(b.next)-Date.now())/864e5<=7);
 if(soon.length)push({id:"bill",k:"돈",t:"7일 안 결제 "+soon.length+"건 · "+money(soon.reduce((a,b)=>a+Math.abs(b.amount||0),0)),why:soon.slice(0,3).map(b=>b.name+" "+b.next.slice(5)).join(" · "),src:"거래 패턴 (추정)",go:"bills",act:"청구 보기"});
 if(f.cardUtil!=null&&f.cardUtil>=50)push({id:"util",k:"돈",t:"카드 사용률 "+f.cardUtil+"%",why:"잔액 "+money(f.cardBalance)+". 30% 아래면 더 여유로워집니다.",src:"BoA 카드 (실제)",go:"rich:debt",act:"카드"});
 const hol=((D.cal||{}).holidays||[])[0];
 if(hol){const d=Math.ceil((new Date(hol.date+"T12:00:00")-Date.now())/864e5);if(d>=0)push({id:"hol",k:"일정",t:hol.title+(d===0?" · 오늘":" · "+d+"일 남음"),why:"개인 캘린더 향후 일정이 없어 공휴일만 표시해요.",src:"Google 공휴일 캘린더",go:"cal",act:"일정"})}
 const fam=(M().flagged||[]).filter(x=>x.type==="가족·학교");
 if(fam.length)push({id:"fam",k:"가족",t:"안 읽은 가족·학교 메일 "+fam.length+"건",why:fam[0].subject,src:"Gmail 샘플 (실제)",go:"flag",act:"메일"});
 const ev=(D.events||[])[0];if(ev)push({id:"ev",k:"지역",t:ev.subject,why:(ev.top||"행사 알림").slice(0,140),src:"Event 알림봇",go:"events",act:"행사"});
 const W=typeof wants==="function"?wants()[0]:null;if(W)push({id:"want",k:"욕구",t:W.t,why:"추정: "+W.why,src:"관심사 엔진 (추정)",go:"want",act:"요약"});
 (RC().items||[]).slice().sort((a,b)=>a.prio-b.prio).forEach(r=>push({id:"r-"+r.id,k:r.cat,t:r.title,why:r.why,src:r.src,go:r.go||"reco",act:"자세히"}));
 if(staleOf())out.unshift({id:"stale",k:"데이터",t:"수집이 오래되었어요",why:"금융·메일이 48시간을 넘었습니다. 'JARVIS 업데이트'를 이 채팅에 보내 주세요.",src:"수집 시각",go:null,act:"명령 복사",copy:"JARVIS 업데이트"});
 return out.slice(0,5)}
function cardTrack(cs,sm){return `<div class="b15" role="region" aria-label="오늘의 브리핑 카드"><div class="b15-tr">${cs.map((c,i)=>`<article class="b15c glass2" data-i="${i}">
 <span class="ey">${esc(c.k)} · ${esc(c.src||"")}</span><b>${esc(c.t)}</b><p>${esc(c.why)}</p>
 <div class="b15-why">왜 보이냐면 · ${esc(c.src||"데이터")}</div>
 <div class="b15-a">${c.go?`<button class="btnp" data-go="${esc(c.go)}">${esc(c.act||"보기")}</button>`:""}${c.copy?`<button class="btnp" data-act="jupd">${esc(c.act||"복사")}</button>`:""}<button class="btn" data-act="bfb:${esc(c.id)}:1" aria-label="유용함">👍</button><button class="btn" data-act="bfb:${esc(c.id)}:-1" aria-label="별로">👎</button></div>
</article>`).join("")}</div><div class="b15-d" role="tablist">${cs.map((_,i)=>`<button class="b15-dot${i===0?" on":""}" data-act="b15:${i}" aria-label="${i+1}번째 카드"></button>`).join("")}</div></div>`}
function scoreRow(){const S=dailyScore(),col=S.v==null?"var(--mut)":S.v>=80?"var(--ok,#34d399)":S.v>=65?"var(--gold,#f5c451)":"#ff6b81";
 return `<section class="s15 glass2" data-go="score"><div class="s15-r">${donutBig(S.v,{l:"오늘의 준비도",sub:"준비도",c:col,s:96,v:S.v==null?"—":S.v})}</div>
 <div class="s15-b"><span class="ey">TODAY · 추정</span><b>오늘의 준비도 ${S.v??"—"}</b><p>${esc(S.why)}</p>
 <div class="s15-p">${S.parts.map(p=>`<span class="s15-chip t-${toneOf(p.v)}" data-go="${esc(p.go)}">${esc(p.n)} ${p.v??"—"}</span>`).join("")}</div></div></section>`}
function sinceRow(){const it=sinceItems();if(!it.length)return "";return `<div class="sec15"><div class="sh"><b>지난번 방문 이후</b><span class="mut">${prevSnap()&&prevSnap().at?rel(new Date(prevSnap().at).toISOString()):""}</span></div><div class="since">${it.map(x=>`<button class="schip ${x.n>0?"up":"dn"}" data-go="${esc(x.go)}"><b>${esc(x.l)}</b> ${esc(x.txt)}</button>`).join("")}</div></div>`}
function staleBanner(){if(!staleOf())return "";const src=srcFresh().filter(x=>x.old||x.h==null).map(x=>x.k+" "+x.lab).join(" · ");
 return `<div class="stale glass2" role="status"><b>데이터가 오래되었어요</b><p>${esc(src||"수집 시각이 48시간을 넘었습니다.")}</p><button class="btnp" data-act="jupd">JARVIS 업데이트 명령 복사</button></div>`}
function qa15(){return `<div class="qa15">${[["오늘의 브리핑","brief15"],["준비도","score"],["지난번 이후","since"],["정기결제","recur"],["순자산","nwtl"],["관심사","interests"]].map(x=>`<button class="pill" data-go="${x[1]}">${x[0]}</button>`).join("")}<button class="pill" data-act="speak15">▶ 브리핑 듣기</button><button class="pill" data-act="pal">⌘K 검색</button></div>`}
function freshLine(){return `<div class="fresh15">${srcFresh().map(x=>`<span class="${x.old?"old":""}">${esc(x.k)} ${esc(x.lab)}</span>`).join("<i>·</i>")}</div>`}
const _home15=V.home;V.home=function(){armSnap();let h=_home15.apply(this,arguments);if(window._ed)return h;
 const hero=staleBanner()+scoreRow()+cardTrack(briefCards())+sinceRow()+qa15()+freshLine();
 return hero+h};
/* pages */
V.brief15=()=>{armSnap();const cs=briefCards();return `<section class="hero14 glass2"><span class="ey">DAILY BRIEF · 오늘 분량</span><h2 class="h14">오늘의 브리핑 ${cs.length}</h2><p class="mut">Pulse·Gemini처럼 카드 몇 장만 보여 드려요. 각 카드에 출처와 '왜 보이냐면'이 있습니다. 금융 조언이 아닙니다.</p></section>`+cardTrack(cs)+freshLine()+`<p class="mut">오늘 분량은 여기까지예요.</p>`};
V.score=()=>{const S=dailyScore();
 return `<section class="hero14 glass2">${donutBig(S.v,{l:"오늘의 준비도",sub:"준비도",c:(S.v==null?"var(--mut)":S.v>=80?"var(--ok,#34d399)":S.v>=65?"var(--gold,#f5c451)":"#ff6b81"),s:120,v:S.v==null?"—":S.v})}<div><span class="ey">READINESS · 추정</span><h2 class="h14">오늘의 준비도</h2><p>${esc(S.why)}</p><p class="mut">Oura/WHOOP처럼 한 숫자로 보되, 여기는 몸 센서가 아니라 재정·일정·관심 데이터로 만든 추정입니다.</p></div></section>`
  +S.parts.map(p=>`${H2(p.n+" "+(p.v??"—"),p.why)}<div class="card ev15">${(p.ev||[]).map(e=>`<button class="r15" data-go="${esc(e[1])}">${esc(e[0])}</button>`).join("")||'<p class="mut">데이터 없음</p>'}</div>`).join("")};
V.since=()=>{armSnap();const it=sinceItems();
 return `<section class="hero14 glass2"><span class="ey">SINCE LAST VISIT</span><h2 class="h14">지난번 방문 이후</h2><p class="mut">${it.length?"숫자가 바뀐 항목만 보여요. 기기에만 저장한 스냅샷과 비교합니다.":"아직 비교할 이전 방문이 없어요. 다음부터 여기에 변화가 표시됩니다."}</p></section>`
  +(it.length?`<div class="since wrap">${it.map(x=>`<button class="schip ${x.n>0?"up":"dn"}" data-go="${esc(x.go)}"><b>${esc(x.l)}</b> ${esc(x.txt)}</button>`).join("")}</div>`:"")+freshLine()};
/* net-worth timeline + goal pacing */
function pace(){const f=F(),nw=typeof NWv==="function"?NWv():f.net,g=typeof G==="function"?G():{target:1e6,monthly:500,ret:7,years:20};
 if(nw==null)return null;const y=typeof yearsTo==="function"?yearsTo(nw,g.monthly||0,g.ret||0,g.target):null;
 const need=(()=>{if(!g.years)return null;const q=Math.pow(1+(g.ret||0)/100,1/12)-1,N=Math.round(g.years*12);if(Math.abs(q)<1e-9)return (g.target-nw)/N;const fv=nw*Math.pow(1+q,N);return (g.target-fv)*q/(Math.pow(1+q,N)-1)})();
 const saved=f.cash30!=null?Math.max(0,f.cash30):null;
 return {nw,g,y,need,saved,ok:saved!=null&&need!=null&&saved>=need,ms:[10000,25000,50000,1e5,2.5e5,5e5,1e6].filter(x=>x>nw).slice(0,4)}}
V.nwtl=()=>{const P=pace(),f=F(),bt=typeof balTrend==="function"?balTrend(90):[];
 if(!P)return H2("순자산 타임라인","데이터 없음")+card('<p class="mut">금융 연결이 필요합니다.</p>');
 const next=P.ms[0];
 return `<section class="hero14 glass2"><span class="ey">NET WORTH · 실제 + 가정</span><h2 class="h14">${money(P.nw)}</h2><p class="mut">현금 − 카드${typeof manual==="function"&&manual()?" + 수동 자산":""}. 목표 ${money(P.g.target)}까지 ${P.y==null?"—":P.y.toFixed(1)+"년"} (월 ${money(P.g.monthly)} · 수익률 ${P.g.ret}% 가정).</p></section>`
  +H2("90일 궤적","실제 잔액 역산")+card((bt.length?chLine(bt.map(x=>[tsx(x.d),x.net+(typeof manual==="function"?manual():0)]),{h:160,axis:1,color:"#ffd166",fmt:v=>money(v),xfmt:dX}):'<p class="mut">데이터 없음</p>'))
  +H2("다음 이정표",next?money(next)+"까지 "+money(next-P.nw):"목표 도달")
  +`<div class="ms15">${[P.nw].concat(P.ms).map((v,i,a)=>`<div class="msi${i===0?" on":""}"><b>${money(v)}</b><span>${i===0?"지금":"이정표"}</span></div>${i<a.length-1?`<i></i>`:""}`).join("")}</div>`
  +H2("목표 페이스","가정: 월 투자 "+money(P.g.monthly)+" · "+P.g.years+"년 · 연 "+P.g.ret+"%")
  +card(`<div class="kpis">${kpi(null,"목표까지",P.y==null?"—":P.y.toFixed(1)+"년")}${kpi(null,P.g.years+"년 안에 가려면 월",P.need==null?"—":money(P.need), "추정")}${kpi(null,"최근 30일 여유",P.saved==null?"—":money(P.saved),P.ok?"페이스 충족":"부족하거나 적자")}</div><div class="note">페이스는 최근 현금흐름을 월 투자 가능액의 대용으로 본 추정입니다. 가정은 부자되기 탭에서 바꿀 수 있어요.</div>`)
  +`<button class="btnp" data-go="rich:goal">가정 조정 →</button>`};
const _rich15=V.rich;V.rich=function(a){const h=_rich15.apply(this,arguments);if(a==="net"||!a)return h+`<div class="card glass2 ilink" data-go="nwtl"><b>✦ 타임라인 · 이정표 · 목표 페이스</b><span class="mut">90일 궤적과 한 달 필요 적립 →</span></div>`;return h};
/* ---------- recurring calendar + price change ---------- */
const _recur15=V.recur;V.recur=function(){const f=F(),R=f.recurring||[],today=TODAY(),t0=new Date(today+"T12:00:00"),start=new Date(t0);
 start.setDate(t0.getDate()-t0.getDay());
 const days=[...Array(28)].map((_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d.toISOString().slice(0,10)});
 const by={};R.forEach(r=>{if(r.next)(by[r.next]=by[r.next]||[]).push(r)});
 const cal=`<div class="rcal">${days.map(d=>{const list=by[d]||[],miss=list.some(x=>x.missed),chg=list.some(x=>Math.abs(x.change||0)>=2);const st=!list.length?"":miss?"miss":chg?"chg":"ok";
  return `<div class="rd ${st}" data-d="${d}"><b>${+d.slice(8)}</b>${list.slice(0,2).map(x=>`<span title="${esc(x.name)}">${esc(x.name).slice(0,6)}</span>`).join("")}</div>`}).join("")}</div>`;
 const row=r=>{const chg=Math.abs(r.change||0)>=2||Math.abs(r.changePct||0)>=5;const st=r.missed?"miss":chg?"chg":(r.next&&r.next<=days[6]?"soon":"");
  return `<div class="rcard glass2 ${st}"><div class="oc-h"><b>${esc(r.name)}</b><span class="tg">${esc(r.kind||"")}</span>${r.missed?'<span class="tg miss">예상일 지남</span>':""}${chg?`<span class="tg chg">${(r.change||0)>0?"▲":"▼"} ${money(Math.abs(r.change||0))} (${(r.changePct||0)>0?"+":""}${r.changePct}%)</span>`:""}</div>
  <div class="oc-m">${money(r.amount)} <span class="mut">${r.prev!=null&&r.prev!==r.amount?"직전 "+money(r.prev):""}</span></div>
  <div class="oc-s">다음 ${(r.next||"—")}${r.last?" · 최근 "+r.last:""} · ${r.count||1}회 · ${esc(r.cat||"")}</div></div>`};
 return H2("정기결제 · 구독","다음 21일 · 금액 변동 · 놓친 건")+`<p class="mut">Monarch/Rocket처럼 다음 결제일과 금액 변화를 보여 드려요. 패턴에서 추정한 것이며 해지를 대신 해 주지는 않아요.</p>`+cal
  +H2("금액이 바뀐 항목",R.filter(r=>Math.abs(r.change||0)>=2).length+"건")+R.filter(r=>Math.abs(r.change||0)>=2||Math.abs(r.changePct||0)>=5).map(row).join("")
  +H2("전체",R.length+"개")+R.map(row).join("")};
/* nudges (ranked) */
V.nudge=()=>{const cs=briefCards();return H2("지금 보면 좋은 것",cs.length+"개 · 우선순위 순")+cs.map((c,i)=>`<div class="n15 glass2"><span class="rk">${i+1}</span><div><b data-go="${c.go?esc(c.go):""}">${esc(c.t)}</b><p>${esc(c.why)}</p><span class="mut">${esc(c.src)}</span></div></div>`).join("")+`<p class="mut">금융·법률 조언이 아닙니다.</p>`};
/* empty state helper already inlined where needed */
ACT.jupd=()=>{const t="JARVIS 업데이트";(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>T("명령이 복사됐어요. 이 채팅에 붙여 넣으세요")).catch(()=>T(t))};
ACT.speak15=()=>{const cs=briefCards(),t="혁진님, 오늘의 브리핑입니다. 준비도는 "+(dailyScore().v??"—")+"점. "+cs.map(c=>c.t+". "+c.why).join(" ") ;ttsPlay?ttsPlay(t,"ko-KR"):(window.speechSynthesis&&speechSynthesis.speak(new SpeechSynthesisUtterance(t)))};
ACT.b15=i=>{const tr=document.querySelector(".b15-tr"),c=tr&&tr.children[+i];if(c)c.scrollIntoView({inline:"center",block:"nearest",behavior:RM()?"auto":"smooth"});document.querySelectorAll(".b15-dot").forEach((d,j)=>d.classList.toggle("on",j===+i))};
ACT.bfb=(a)=>{const [id,v]=a.split(":");if(!secReady())return;const s=SX("brief");s[id]=(s[id]||0)+(+v);saveSec();T(+v>0?"반영했어요":"다음엔 덜 보여 드릴게요")};
document.addEventListener("scroll",e=>{const tr=e.target&&e.target.closest&&e.target.closest(".b15-tr");if(!tr)return;const i=Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth*.85));document.querySelectorAll(".b15-dot").forEach((d,j)=>d.classList.toggle("on",j===i))},true);
/* search + palette: include youtube, oddities, opportunities, brief cards */
const _search15=search;search=function(q){const h=_search15(q),s=q.toLowerCase(),hit=x=>String(x||"").toLowerCase().includes(s);
 const yt=(FUN().videos||[]).filter(v=>hit(v.t)||hit(v.ch)),od=(FUN().odd||[]).filter(o=>hit(o.t)||hit(o.d)||hit(o.src));
 const op=(typeof opps==="function"?opps():[]).filter(o=>hit(o.t)||hit(o.step));
 const n=yt.length+od.length+op.length;if(!n)return h;
 const extra=(yt.length?H2("유튜브",yt.length+"건")+card(yt.slice(0,10).map(v=>`<a class="row" href="${esc(v.url)}" target="_blank" rel="noopener"><b>${esc(v.t)}</b><span>${esc(v.ch)}</span></a>`).join("")):"")
  +(od.length?H2("이색 볼거리",od.length+"건")+card(od.slice(0,10).map(o=>`<a class="row" href="${esc(o.url)}" target="_blank" rel="noopener"><b>${esc(o.t)}</b><span>${esc(o.src)}</span></a>`).join("")):"")
  +(op.length?H2("돈 기회",op.length+"건")+card(op.slice(0,10).map(o=>`<button class="row" data-go="mopp"><b>${esc(o.t)}</b><span>${esc(o.ev||"")}</span></button>`).join("")):"");
 return h+extra};
const _pal15=palItems;palItems=function(){const it=_pal15(),q=(document.getElementById("palq")||{}).value||"";
 [["brief15","오늘의 브리핑 카드"],["score","오늘의 준비도"],["since","지난번 방문 이후"],["nwtl","순자산 타임라인"],["nudge","지금 보면 좋은 것"],["recur","정기결제·구독"]].forEach(r=>it.unshift({l:r[1],s:r[0],go:r[0]}));
 it.unshift({l:"JARVIS 업데이트 명령 복사",s:"명령",act:"jupd"});
 if(q.length>=2){const s=q.toLowerCase(),hit=x=>String(x||"").toLowerCase().includes(s);
  (F().tx||[]).filter(t=>hit(t.name)||hit(t.cat)).slice(0,6).forEach(t=>it.push({l:t.name+" "+(t.amount>0?"+":"")+money(t.amount),s:"거래 "+t.date,go:"txall"}));
  (M().recent||[]).filter(m=>hit(m.subject)||hit(m.from)).slice(0,5).forEach(m=>it.push({l:m.subject,s:"메일 "+m.from,go:"unread"}));
  (F().recurring||[]).filter(r=>hit(r.name)).slice(0,4).forEach(r=>it.push({l:r.name+" "+money(r.amount),s:"정기결제",go:"recur"}));
  (FUN().videos||[]).filter(v=>hit(v.t)||hit(v.ch)).slice(0,4).forEach(v=>it.push({l:v.t,s:"유튜브 "+v.ch,go:"yt"}))}
 return it};
Object.assign(TITLE,{brief15:"오늘의 브리핑",score:"오늘의 준비도",since:"지난번 방문 이후",nwtl:"순자산 타임라인",nudge:"지금 보면 좋은 것"});
try{LCATS.unshift(["brief15","오늘의 브리핑","☰","var(--gold)","brief15"],["score","오늘의 준비도","◎","var(--gold)","score"],["nwtl","순자산 타임라인","↗","#ffd166","nwtl"])}catch(e){}
