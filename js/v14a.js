/* v14a — 나의 욕구 요약 · 돈 기회 허브 · 나의 프로필 · 이색 볼거리 · 유튜브 10 */
const FUN=()=>D.fun||{},SX=k=>{SECS=SECS||{};if(!SECS[k]||Array.isArray(SECS[k]))SECS[k]={};return SECS[k]};
const secReady=()=>SECS&&!_secP;
const topicN=re=>((D.profile||{}).topics||[]).filter(t=>re.test(t.topic)).reduce((a,t)=>a+(t.n||0),0);
const vib=()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}};
/* ---------- 1) 나의 욕구 요약 (규칙·통계 추론) ---------- */
function wants(){const f=F(),fb=secReady()?SX("want"):{},w=k=>Math.pow(1.35,fb[k]||0),out=[];
 const tq=topicN(/자동매매|퀀트|코인|투자|트레이딩/),te=topicN(/영어/),tj=topicN(/아르바이트|부업|알바/),ev=(D.events||[]).length,nw=typeof NWv==="function"?NWv():f.net,g=typeof G==="function"?G().target:1e6;
 if(tq)out.push({k:"auto",t:"자동매매로 꾸준한 투자 수익",why:"봇 대화의 가장 큰 주제",s:40+tq/3,ev:[["봇 대화 '자동매매·코인' "+tq+"회","profile"],["매매 봇 "+((D.bots||[]).filter(b=>/매매/.test(b.name)).length)+"개","bots"]],go:"inv"});
 if(f.cash30!=null&&f.cash30<0)out.push({k:"save",t:"새는 돈 막고 저축 플러스 전환",why:"30일 현금흐름 "+sg(f.cash30),s:45+Math.min(30,-f.cash30/60),ev:[["30일 현금흐름 "+sg(f.cash30),"flow"],["카드 사용률 "+f.cardUtil+"%","card"],["정기결제 "+((f.bills||[]).length)+"건","recur"]],go:"mopp"});
 if(nw!=null)out.push({k:"rich",t:"100만 달러 경제적 자유",why:"목표 진척 "+(100*nw/g).toFixed(1)+"%",s:30+(tq?10:0),ev:[["순자산 "+money(nw),"rich:net"],["목표 "+money(g),"rich:goal"]],go:"rich:goal"});
 if(te)out.push({k:"eng",t:"영어 실력 올리기",why:"영어 공부 봇과 대화",s:20+te,ev:[["봇 대화 '영어' "+te+"회","profile"]],go:"c:grow"});
 if(tj||(D.side||{}).goal)out.push({k:"side",t:"부업으로 월 "+((D.side||{}).goal||"추가 수입"),why:"부업 목표가 설정됨",s:28+tj,ev:[["부업 목표 "+((D.side||{}).goal||"—"),"rich:side"],tj?["봇 대화 '아르바이트' "+tj+"회","profile"]:null].filter(Boolean),go:"rich:side"});
 if(ev)out.push({k:"fam",t:"가족과 주말 나들이",why:"주변 행사 알림 구독",s:15+ev,ev:[["행사 알림 "+ev+"건","events"]],go:"events"});
 out.forEach(x=>x.sc=x.s*w(x.k));return out.sort((a,b)=>b.sc-a.sc)}
function wantText(W){if(!W.length)return"아직 추론할 데이터가 부족해요.";const [a,b,c]=W;
 return `혁진님은 요즘 ${a.t.replace(/ $/,"")}에 가장 관심이 많으신 것 같아요. ${a.why}이기 때문이에요.`+(b?` 그리고 ${b.t}을(를) 원하시는 것 같아요 — ${b.why}.`:"")+(c?` ${c.t}도 마음 한편에 있으신 듯해요.`:"")+` 이건 데이터로 추정한 것이니, 맞으면 👍, 아니면 👎를 눌러 알려주세요.`}
function wantCard(full){const W=wants(),top=W.slice(0,3),fb=secReady()?SX("want"):{};
 return `<section class="want glass2" aria-label="나의 욕구 요약"><div class="wt-h"><span class="ey">WHAT YOU WANT · 추정</span><b>나의 욕구 요약</b><button class="spk" data-act="speak" aria-label="소리로 듣기">▶ 듣기</button></div>
 <p class="wtx" id="wtx">${esc(wantText(W))}</p><ol class="wl">${top.map((x,i)=>`<li><span class="rk">${i+1}</span><div><b data-go="${esc(x.go)}">${esc(x.t)}</b><div class="evs">${x.ev.map(e=>`<button class="ev" data-go="${esc(e[1])}">${esc(e[0])}<em>추정 근거</em></button>`).join("")}</div></div><span class="fbk"><button data-act="wfb:${x.k}:1" class="${fb[x.k]>0?"on":""}" aria-label="맞아요">👍</button><button data-act="wfb:${x.k}:-1" class="${fb[x.k]<0?"on":""}" aria-label="아니에요">👎</button></span></li>`).join("")}</ol>
 ${full?`<div class="note">추론 방식: 봇 대화 주제 횟수(본문 미포함), 30일 현금흐름·카드 사용률, 목표 진척, 부업 목표, 행사 알림 수를 점수화하고 👍/👎(기기에 암호화 저장)로 가중치를 조정합니다. LLM이 아닌 규칙·통계 추정입니다.</div>${W.slice(3).length?H2("그 외 후보")+card(W.slice(3).map(x=>row(x.go,x.t,x.why)).join("")):""}`:`<button class="lnk" data-go="want">자세히 →</button>`}</section>`}
V.want=()=>wantCard(true);
ACT.wfb=a=>{const [k,v]=a.split(":");const fb=SX("want");fb[k]=Math.max(-3,Math.min(3,(fb[k]||0)+(+v)));saveSec();vib();render();T(+v>0?"반영했어요 👍":"덜 추천할게요 👎")};
ACT.speak=()=>{const t=($("wtx")||{}).textContent||"";if(!("speechSynthesis" in window))return T("이 브라우저는 음성 읽기를 지원하지 않아요");speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang="ko-KR";u.rate=1.02;const v=speechSynthesis.getVoices().find(v=>/ko/i.test(v.lang));if(v)u.voice=v;speechSynthesis.speak(u);T("읽는 중…")};
/* ---------- 2) 돈 기회 허브 ---------- */
const OC=[["inv","투자·ETF·세금혜택"],["save","절약·구독 정리"],["card","카드·은행 보너스"],["kr","한국 연계·환율"],["side","부업 아이디어"],["passive","디지털·패시브"],["re","부동산·리츠"],["edu","교육·커리어"]];
function opps(){const f=F(),L=[],tq=topicN(/자동매매|퀀트|코인|투자/),add=o=>L.push(Object.assign({eff:2,risk:2,visa:"ok"},o));
 add({c:"inv",id:"roth",t:"Roth IRA 연 한도 채우기",ev:"연 $7,000 한도 · 장기 비과세 성장",lo:300,hi:900,u:"년(추정)",step:"증권사에서 Roth IRA 계좌 개설 → 월 자동이체 설정",src:"https://www.irs.gov/retirement-plans/roth-iras",risk:1});
 add({c:"inv",id:"401k",t:"회사 401(k) 매칭 100% 받기",ev:"매칭분은 즉시 수익률 50~100%",lo:1000,hi:4000,u:"년(추정)",step:"급여 포털에서 매칭 비율 확인 → 기여율 상향",src:"https://www.investor.gov/",risk:1,eff:1});
 add({c:"inv",id:"etf",t:"지수 ETF 월 자동 적립",ev:"과거 장기 연 6~10% (보장 아님)",lo:200,hi:1200,u:"년(추정, 월 $500 기준)",step:"보드에 저장 → DCA 시뮬로 금액 정하기",src:"https://www.investor.gov/introduction-investing/investing-basics/glossary/exchange-traded-funds-etfs",risk:2});
 add({c:"inv",id:"hysa",t:"고금리 저축계좌(HYSA)로 비상금 이동",ev:"현금 "+money(f.cash)+" 일부를 연 3~4%대로",lo:Math.round((f.cash||0)*.5*.03),hi:Math.round((f.cash||0)*.5*.045),u:"년(추정)",step:"FDIC 가입 온라인 은행 비교 → 비상금 3개월치만 이동",src:"https://www.fdic.gov/resources/deposit-insurance",risk:1,eff:1});
 ((f.bills||[]).filter(b=>/구독|정기/.test(b.kind||""))).sort((a,b)=>b.amount-a.amount).slice(0,6).forEach(b=>add({c:"save",id:"sub:"+b.name,t:"해지·다운그레이드 검토: "+b.name,ev:money(b.amount)+"/월 · 실제 결제",lo:Math.round(b.amount*12*.5),hi:Math.round(b.amount*12),u:"년",step:"최근 30일 사용 여부 확인 → 안 쓰면 해지",real:1,go:"recur",eff:1,risk:0}));
 if(f.cardBalance>0)add({c:"save",id:"apr",t:"카드 잔액 결제일 전 상환",ev:"잔액 "+money(f.cardBalance)+" · 사용률 "+f.cardUtil+"% (실제)",lo:Math.round(f.cardBalance*.2*.5),hi:Math.round(f.cardBalance*.24),u:"년 이자 회피(추정, APR 20~24% 가정)",step:"결제일 전 잔액 일부 상환 → 사용률 30% 미만",real:1,go:"rich:debt",eff:1,risk:0});
 add({c:"card",id:"bonus",t:"은행 신규 계좌 보너스",ev:"보통 $200~$400 (조건: 직접입금)",lo:200,hi:400,u:"회(추정)",step:"현재 은행 프로모션 페이지에서 조건 확인",risk:1});
 add({c:"card",id:"cashback",t:"지출 카테고리 맞춤 캐시백 카드",ev:"식비·장보기 비중 기준 추가 1~3%",lo:Math.round((f.spend30||0)*12*.01*.4),hi:Math.round((f.spend30||0)*12*.02*.4),u:"년(추정)",step:"카테고리별 지출 확인 → 신용점수 영향 고려",go:"x:spend",risk:1});
 add({c:"kr",id:"fx",t:"원화 송금 환율 타이밍",ev:"달러·원 90일 범위 하단/상단 활용",lo:30,hi:300,u:"회(추정, $10k 기준 0.3~3%)",step:"환율 페이지에서 90일 백분위 확인",go:"rich:fx",risk:2});
 add({c:"kr",id:"remit",t:"해외송금 수수료 비교 (Wise 등)",ev:"은행 대비 수수료·환전 스프레드 절감",lo:20,hi:150,u:"회(추정)",step:"송금 전 2~3곳 견적 비교",src:"https://wise.com/us/compare/",risk:0,eff:1});
 [["side1","온라인 강의·전자책 (지식 상품)","passive","주의"],["side2","보유 기술로 프리랜스 (Upwork 등)","side","위험"],["side3","주말 아르바이트·배달","side","위험"],["side4","배당주·채권 이자 (투자 소득)","passive","ok"],["side5","블로그·유튜브 광고 수익","passive","주의"]].forEach(x=>add({c:x[2],id:x[0],t:x[1],ev:x[3]==="ok"?"투자 소득은 일반적으로 취업 아님":"L-1 비자: 미국 내 다른 고용주를 위한 근로는 제한됨",lo:x[3]==="ok"?100:200,hi:x[3]==="ok"?1500:1500,u:x[3]==="ok"?"년(추정)":"월(추정)",step:x[3]==="ok"?"보드에 저장 → 투자 계획에 포함":"이민 변호사에게 가능 여부 먼저 확인",visa:x[3],risk:2,eff:x[3]==="ok"?1:3}));
 if(tq)add({c:"passive",id:"algo",t:"자동매매 전략을 페이퍼→소액 실전",ev:"봇 대화 주제 1위 · 손실 위험 큼",lo:-500,hi:1500,u:"년(추정, 매우 불확실)",step:"페이퍼 성과 3개월 검증 후 소액만",go:"inv",risk:3,eff:2});
 add({c:"re",id:"reit",t:"리츠(REIT) ETF로 부동산 노출",ev:"배당 연 3~5% (변동성 있음)",lo:100,hi:500,u:"년(추정, $5k 기준)",step:"리츠 ETF 보수·배당률 비교",src:"https://www.investor.gov/introduction-investing/investing-basics/investment-products/real-estate-investment-trusts-reits",risk:2});
 add({c:"re",id:"home",t:"주택 구매 vs 렌트 비교",ev:"월세·금리 기준 손익분기 계산",lo:0,hi:0,u:"",step:"관심 지역 시세 확인 → 계산기",risk:2,eff:2});
 add({c:"edu",id:"cert",t:"직무 자격증·AI 스킬 업",ev:"연봉 협상·승진 근거",lo:1000,hi:8000,u:"년(추정)",step:"회사 교육비 지원 제도 확인",risk:1,eff:3});
 add({c:"edu",id:"eng",t:"영어 비즈니스 회화 집중",ev:"커리어 기회 확대",lo:0,hi:0,u:"",step:"영어 봇으로 주 3회 연습",go:"c:grow",risk:0,eff:2});
 const pw={inv:1+(tq?.3:0),save:F().cash30<0?1.4:1,card:.9,kr:1,side:.8,passive:1+(tq?.2:0),re:.7,edu:.8},fb=secReady()?SX("oppfb"):{};
 L.forEach(o=>{o.ev2=(o.lo+o.hi)/2;o.sc=(Math.log10(Math.max(10,o.ev2))*pw[o.c])/(1+o.eff*.25+o.risk*.2)*(o.visa==="위험"?.6:1)*(fb[o.id]==="x"?0:1)*(o.real?1.25:1)});return L.sort((a,b)=>b.sc-a.sc)}
const evr=o=>o.lo||o.hi?`${money(o.lo)}~${money(o.hi)}<small>/${esc(o.u)}</small>`:"—";
const oppCard=o=>`<div class="oc glass2" data-oid="${esc(o.id)}"><div class="oc-h"><span class="tg">${esc((OC.find(c=>c[0]===o.c)||[])[1])}</span>${o.real?'<span class="tg real">실데이터</span>':'<span class="tg est">추정</span>'}${o.visa!=="ok"?`<span class="tg visa ${o.visa==="위험"?"r":"w"}">L-1 ${o.visa}</span>`:'<span class="tg ok">비자 OK</span>'}</div><b class="oc-t">${esc(o.t)}</b><div class="oc-v">${evr(o)}</div><div class="oc-d">${esc(o.ev)}</div><div class="oc-m"><span>노력 ${"●".repeat(o.eff)}${"○".repeat(3-o.eff)}</span><span>위험 ${"●".repeat(o.risk)}${"○".repeat(3-o.risk)}</span></div><div class="oc-s">첫 단계: ${esc(o.step)}</div><div class="oc-b"><button class="btnp" data-act="osave:${esc(o.id)}">보드에 저장</button>${o.go?`<button class="btng" data-go="${esc(o.go)}">관련 화면</button>`:""}${o.src?`<a class="btng" href="${esc(o.src)}" target="_blank" rel="noopener">출처</a>`:""}</div></div>`;
let OCF="all";
function weekKey(){const d=new Date(TODAY()+"T12:00:00");d.setDate(d.getDate()-d.getDay());return d.toISOString().slice(0,10)}
function checklist(){const f=F(),L=[["bal","카드 잔액·결제일 확인","card"],["sub","안 쓰는 구독 1개 정리","recur"],["inv","이번 주 적립(DCA) 실행","rich:dca"],["fx","환율 90일 위치 확인","rich:fx"],["sp","지난주 지출 Top 3 점검","x:spend"],["opp","기회 보드 카드 1개 진행","board"]];if(f.cardUtil>30)L.unshift(["util","카드 사용률 30% 미만으로 (현재 "+f.cardUtil+"%)","rich:debt"]);return L}
V.mopp=()=>{const L=opps(),cnt=c=>L.filter(o=>o.c===c).length,sel=OCF==="all"?L:L.filter(o=>o.c===OCF),ck=secReady()?SX("chk"):{},wk=weekKey(),done=ck[wk]||{},CL=checklist();
 return `<section class="hero14 glass2"><span class="ey">MONEY OPPORTUNITIES</span><b class="h14">돈 기회 ${L.length}개</b><div class="sub14">프로필 기준 순위 · 추정 기대값 합계 ${money(L.slice(0,5).reduce((a,o)=>a+Math.max(0,o.ev2),0))} (상위 5)</div></section>
 ${H2("이번 주 돈 체크리스트",Object.keys(done).filter(k=>done[k]).length+"/"+CL.length)}<div class="card ckl">${CL.map(c=>`<label class="ck"><input type="checkbox" data-act="ck:${c[0]}" ${done[c[0]]?"checked":""}><span>${esc(c[1])}</span><button class="lnk" data-go="${c[2]}">→</button></label>`).join("")}</div>
 <div class="pills"><button class="pill ${OCF==="all"?"on":""}" data-act="ocf:all">전체<span class="n">${L.length}</span></button>${OC.map(c=>`<button class="pill ${OCF===c[0]?"on":""}" data-act="ocf:${c[0]}">${c[1]}<span class="n">${cnt(c[0])}</span></button>`).join("")}</div>
 <div class="ocg">${sel.map(oppCard).join("")||'<div class="note">항목 없음</div>'}</div><div class="disc">투자·세무·법률 조언이 아닙니다. 기대값은 일반적 범위로 계산한 추정치이며, 비자 표시는 일반 정보입니다 — 부업은 반드시 이민 변호사와 먼저 확인하세요.</div>`};
ACT.ocf=a=>{OCF=a;render()};
ACT.osave=id=>{const o=opps().find(x=>x.id===id);if(!o||!secReady())return T("잠시 후 다시 시도");if(!SECS.board||Array.isArray(SECS.board))SECS.board={cards:[],dec:{},n:0};const b=SECS.board;b.cards=b.cards||[];if(b.cards.some(c=>c.oid===id))return T("이미 보드에 있어요");b.n=(b.n||b.cards.length)+1;b.cards.unshift({id:"c"+b.n,t:o.t,col:"look",tag:"기회",p:2,oid:id});saveSec();vib();T("기회 보드에 저장했어요")};
ACT.ck=k=>{const ck=SX("chk"),wk=weekKey();ck[wk]=ck[wk]||{};ck[wk][k]=!ck[wk][k];saveSec();vib();render()};
/* ---------- 3) 나의 프로필 ---------- */
const MEF=[["goal","목표 금액 (USD)","예: 1000000"],["monthly","월 투자 가능액 (USD)","예: 500"],["risk","위험 성향","안정/중립/공격"],["family","가족 구성","예: 배우자·자녀 2"],["city","관심 지역","예: 오스틴"],["visaEnd","비자 만료 예정 (연-월)","예: 2028-06"],["credit","신용점수 대략","예: 720"],["dream","5년 뒤 원하는 모습","자유롭게"]];
V.me=()=>{const f=F(),me=secReady()?SX("me"):{},pr=D.profile||{},sub=(f.bills||[]).filter(b=>/구독|정기/.test(b.kind||""));
 const known=[["관심사",(pr.topics||[]).slice(0,3).map(t=>t.topic.split(" ")[0]).join(", "),"profile"],["활동 시간대",(()=>{const h=pr.activityHour||[];if(!h.length)return null;const m=h.indexOf(Math.max(...h));return m+"시 전후 활동 최다"})(),"profile"],["순자산 추정",money(typeof NWv==="function"?NWv():f.net),"rich:net"],["30일 현금흐름",sg(f.cash30),"flow"],["구독",sub.length+"건 · "+money(sub.reduce((a,b)=>a+b.amount,0))+"/월","recur"],["다가오는 결제",(f.bills||[]).length+"건","tl"],["습관",Object.keys((SECS&&SECS.hab)||{}).length?"기록 있음":null,"rich:habits"],["부업 목표",(D.side||{}).goal,"rich:side"],["일정",((D.cal||{}).holidays||[]).length+"개 공휴일 · 행사 "+(D.events||[]).length+"건","tl"],["봇",(D.bots||[]).length+"개","bots"],["기분·운세",D.fortune&&D.fortune.today?String(D.fortune.today).slice(0,40):null,"fortune"]];
 const filledK=known.filter(k=>k[1]).length,filledM=MEF.filter(m=>me[m[0]]).length,tot=known.length+MEF.length,pct=Math.round(100*(filledK+filledM)/tot);
 return `<section class="hero14 glass2 mehero">${donutBig(pct,{l:"프로필 완성도",sub:"완성도",c:"var(--gold)"})}<div><span class="ey">MY PROFILE</span><b class="h14">나의 프로필</b><div class="sub14">알고 있는 정보 ${filledK+filledM}/${tot} · 채우면 추천이 더 정확해져요</div></div></section>
 ${H2("자동으로 아는 것","수집 데이터")}<div class="card">${known.map(k=>`<div class="row" ${k[1]?`data-go="${k[2]}"`:""}><div class="m"><b>${esc(k[0])}</b></div><div class="amt ${k[1]?"":"gap"}">${k[1]?esc(String(k[1])):"비어 있음"}</div></div>`).join("")}</div>
 ${H2("채우면 더 정확해져요",filledM+"/"+MEF.length+" · 기기에 암호화 저장")}<div class="card mef">${MEF.map(m=>`<label class="mf"><span>${esc(m[1])}${me[m[0]]?"":' <em class="gapb">비어 있음</em>'}</span><input data-mef="${m[0]}" value="${esc(me[m[0]]||"")}" placeholder="${esc(m[2])}" maxlength="80"></label>`).join("")}<button class="btnp" data-act="mesave" id="mesave">저장</button></div><div class="note">입력값은 이 기기에만 암호화(AES-GCM) 저장되며 저장소에 올라가지 않습니다.</div>`};
ACT.mesave=()=>{if(!secReady())return T("잠시 후 다시 시도");const me=SX("me");document.querySelectorAll("[data-mef]").forEach(i=>{const v=i.value.trim();if(v)me[i.dataset.mef]=v;else delete me[i.dataset.mef]});if(me.goal&&+me.goal>0&&typeof ST!=="undefined"){ST.goal=Object.assign(ST.goal||{},{target:+me.goal});if(me.monthly&&+me.monthly>0)ST.goal.monthly=+me.monthly;saveST()}saveSec();vib();render();T("프로필 저장됨")};
/* ---------- 4) 이색 볼거리 ---------- */
let ODF="all";
const oddL=()=>{const fb=secReady()?SX("odd"):{};return (FUN().odd||[]).map((o,i)=>Object.assign({i,k:o.url},o,{lk:fb[o.url]}))};
const oddCard=(o,sm)=>`<div class="odc glass2${sm?" sm":""}">${o.img?`<a href="${esc(o.url)}" target="_blank" rel="noopener" class="odi"><img loading="lazy" src="${esc(o.img)}" alt="" referrerpolicy="no-referrer"></a>`:`<div class="odi ph">${esc((o.tag||"").slice(0,4))}</div>`}<div class="odb"><span class="tg">${esc(o.tag)}</span><a class="odt" href="${esc(o.url)}" target="_blank" rel="noopener">${esc(o.t)}</a>${sm?"":`<div class="odd">${esc(o.d||"")}</div>`}<div class="odm"><span>${esc(o.src)} · 영어 원문</span><button data-act="olk:${o.i}" class="${o.lk==="like"?"on":""}" aria-label="좋아요">♥</button><button data-act="osv:${o.i}" class="${o.lk==="save"?"on":""}" aria-label="저장">★</button></div></div></div>`;
V.odd=()=>{const L=oddL(),F0=FUN(),tags=[...new Set(L.map(o=>o.tag))],sel=ODF==="all"?L:ODF==="saved"?L.filter(o=>o.lk):L.filter(o=>o.tag===ODF);
 const seed=+TODAY().replace(/-/g,""),rot=L.slice().sort((a,b)=>((a.i*7919+seed)%97)-((b.i*7919+seed)%97));
 return `<section class="hero14 glass2"><span class="ey">STRANGE &amp; WONDERFUL</span><b class="h14">이색 볼거리 ${L.length}</b><div class="sub14">${esc(F0.src||"")} · ${F0.at?rel(F0.at):"—"} 수집</div></section>
 <div class="pills"><button class="pill ${ODF==="all"?"on":""}" data-act="odf:all">전체<span class="n">${L.length}</span></button><button class="pill ${ODF==="saved"?"on":""}" data-act="odf:saved">♥ 저장<span class="n">${L.filter(o=>o.lk).length}</span></button>${tags.map(t=>`<button class="pill ${ODF===t?"on":""}" data-act="odf:${esc(t)}">${esc(t)}<span class="n">${L.filter(o=>o.tag===t).length}</span></button>`).join("")}</div>
 <div class="odg">${sel.map(o=>oddCard(o)).join("")||'<div class="note">항목 없음</div>'}</div>
 ${H2("오늘의 이색 Top 20","날짜별 순환")}<div class="card">${rot.slice(0,20).map((o,i)=>`<a class="row tr" href="${esc(o.url)}" target="_blank" rel="noopener"><div class="m"><b>${i+1}. ${esc(o.t)}</b><small>${esc(o.src)}</small></div></a>`).join("")}</div>
 ${(F0.errors||[]).length?`<div class="note">접근 실패: ${esc(F0.errors.join(" · "))}</div>`:""}<div class="note">Reddit은 박스에서 403으로 차단되어 사용하지 않습니다. 제목은 원문(영어) 그대로이며 한국어 라벨만 붙였습니다.</div>`};
ACT.odf=a=>{ODF=a;render()};
const oddFb=(i,v)=>{const o=(FUN().odd||[])[+i];if(!o||!secReady())return;const fb=SX("odd");fb[o.url]=fb[o.url]===v?undefined:v;if(!fb[o.url])delete fb[o.url];saveSec();vib();render()};
ACT.olk=i=>oddFb(i,"like");ACT.osv=i=>oddFb(i,"save");
/* ---------- 5) 유튜브 오늘의 10 ---------- */
const TAGK={finance:"재테크",trading:"트레이딩",ai:"AI",english:"영어",korean:"한국 콘텐츠",travel:"여행",fun:"재미",science:"과학"};
function tagW(){const w={finance:1+topicN(/투자|재테크|돈/)/40,trading:1+topicN(/자동매매|퀀트|코인|트레이딩/)/40,ai:1+topicN(/AI|봇|에이전트/)/40,english:1+topicN(/영어/)/20,korean:1,travel:.8,fun:.9,science:.8};const fb=secReady()?SX("yt"):{};Object.entries(fb.tag||{}).forEach(([t,v])=>w[t]=(w[t]||1)*Math.pow(1.25,v));return w}
function ytPick(){const V0=(FUN().videos||[]).slice(),fb=secReady()?SX("yt"):{},no=fb.no||{},W=tagW(),now=Date.now(),seed=+TODAY().replace(/-/g,"");
 const sc=v=>{const age=(now-new Date(v.pub))/864e5,tw=Math.max(...v.tags.map(t=>W[t]||1)),ch=Math.pow(1.3,(fb.ch||{})[v.cid]||0),j=((parseInt(v.id.replace(/[^a-zA-Z0-9]/g,""),36)||0)+seed)%13/100;return tw*ch*(1/(1+age/5))*(v.short?.75:1)+j};
 const pool=V0.filter(v=>!no[v.id]&&((fb.ch||{})[v.cid]||0)>-3).map(v=>Object.assign({},v,{sc:sc(v)})).sort((a,b)=>b.sc-a.sc),out=[],perCh={},perTag={};
 for(const v of pool){if(out.length>=10)break;if((perCh[v.cid]||0)>=1&&pool.length>20)continue;const t=v.tags[0];if((perTag[t]||0)>=3&&pool.length>20)continue;out.push(v);perCh[v.cid]=(perCh[v.cid]||0)+1;perTag[t]=(perTag[t]||0)+1}
 for(const v of pool){if(out.length>=10)break;if(!out.includes(v))out.push(v)}
 out.forEach(v=>{const t=v.tags.slice().sort((a,b)=>(W[b]||1)-(W[a]||1))[0];v.why=(TAGK[t]||t)+(W[t]>1.2?" · 관심 높음":"")+((now-new Date(v.pub))<2*864e5?" · 새 영상":"")});
 const fun=pool.filter(v=>!out.includes(v)&&v.tags.some(t=>t==="fun"||t==="science")).slice(0,8);return {top:out,fun}}
const ytAgo=s=>{const d=(Date.now()-new Date(s))/864e5;return d<1?Math.max(1,Math.round(d*24))+"시간 전":Math.round(d)+"일 전"};
const ytCard=(v,i,sm)=>`<div class="ytc${sm?" sm":""}"><a href="${esc(v.url)}" target="_blank" rel="noopener" class="yti" data-yt="${esc(v.id)}"><img loading="lazy" src="${esc(v.thumb)}" alt="" referrerpolicy="no-referrer">${i!=null?`<span class="ytn">${i+1}</span>`:""}${v.short?'<span class="yts">Shorts</span>':""}</a><div class="ytb"><a class="ytt" href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.t)}</a><div class="ytm">${esc(v.ch)} · ${ytAgo(v.pub)}</div>${sm?"":`<div class="ytf"><span class="tg">${esc(v.why||"")}</span><button data-act="ylk:${esc(v.id)}" class="${((SECS&&SECS.yt&&SECS.yt.ch)||{})[v.cid]>0?"on":""}" aria-label="좋아요">👍</button><button data-act="yno:${esc(v.id)}" aria-label="관심 없음">관심 없음</button></div>`}</div></div>`;
V.yt=()=>{const F0=FUN(),{top,fun}=ytPick(),n=(F0.videos||[]).length;
 return `<section class="hero14 glass2"><span class="ey">TODAY'S 10 · YOUTUBE</span><b class="h14">오늘의 유튜브 ${top.length}</b><div class="sub14">검증된 채널 ${new Set((F0.videos||[]).map(v=>v.cid)).size}곳의 최신 영상 ${n}개 중 관심사·최신성·다양성으로 선별 · ${F0.at?rel(F0.at):"—"} 수집</div></section>
 ${top.length<10?`<div class="note">영상 후보가 ${top.length}개뿐이에요 (수집 실패 또는 제외). 지어내지 않고 있는 것만 보여줍니다.</div>`:""}<div class="ytg">${top.map((v,i)=>ytCard(v,i)).join("")}</div>
 ${fun.length?H2("재밌는 볼거리","재미·과학 채널")+`<div class="strip">${fun.map(v=>ytCard(v,null,1)).join("")}</div>`:""}<div class="note">YouTube 채널 RSS(키 없음)로 수집합니다. 👍 = 그 채널·주제 더 추천, 관심 없음 = 그 영상 제외 + 채널 가중치 감소 (기기에 암호화 저장).</div>`};
const ytV=id=>(FUN().videos||[]).find(v=>v.id===id);
ACT.ylk=id=>{const v=ytV(id);if(!v||!secReady())return;const y=SX("yt");y.ch=y.ch||{};y.tag=y.tag||{};y.ch[v.cid]=Math.min(3,(y.ch[v.cid]||0)+1);v.tags.forEach(t=>y.tag[t]=Math.min(3,(y.tag[t]||0)+1));saveSec();vib();render();T("비슷한 영상을 더 추천할게요")};
ACT.yno=id=>{const v=ytV(id);if(!v||!secReady())return;const y=SX("yt");y.no=y.no||{};y.ch=y.ch||{};y.no[id]=1;y.ch[v.cid]=Math.max(-3,(y.ch[v.cid]||0)-1);saveSec();vib();render();T("이 영상은 빼고 다른 걸 보여드릴게요")};
/* ---------- 6) 홈 재구성 ---------- */
const _home14=V.home;V.home=function(){let h=_home14.apply(this,arguments);if(window._ed)return h;
 const i=h.indexOf('<div class="pills nav13">');const {top}=ytPick(),O=opps().slice(0,3),odd=oddL().slice(0,8);
 const blk=wantCard(false)
  +`<div class="sec14"><div class="sh"><b>오늘의 유튜브 10</b><button class="lnk" data-go="yt">전체 →</button></div><div class="strip">${top.map((v,i)=>ytCard(v,i,1)).join("")||'<div class="note">영상 데이터 없음</div>'}</div></div>`
  +`<div class="sec14"><div class="sh"><b>돈 기회 Top 3</b><button class="lnk" data-go="mopp">전체 →</button></div><div class="ocg h3">${O.map(oppCard).join("")}</div></div>`
  +`<div class="sec14"><div class="sh"><b>이색 볼거리</b><button class="lnk" data-go="odd">전체 →</button></div><div class="strip">${odd.map(o=>oddCard(o,1)).join("")||'<div class="note">데이터 없음</div>'}</div></div>`;
 const nav=`<div class="pills nav14"><button class="pill" data-go="want">✦ 나의 욕구</button><button class="pill" data-go="mopp">$ 돈 기회</button><button class="pill" data-go="me">◉ 나의 프로필</button><button class="pill" data-go="yt">▶ 유튜브 10</button><button class="pill" data-go="odd">✺ 이색</button></div>`;
 return i>=0?h.slice(0,i)+blk+nav+h.slice(i):blk+nav+h};
Object.assign(TITLE,{want:"나의 욕구 요약",mopp:"돈 기회",me:"나의 프로필",odd:"이색 볼거리",yt:"오늘의 유튜브 10"});
try{ALLTABS.push(["mopp","$","돈 기회"],["yt","▶","유튜브"],["odd","✺","이색"],["me","◉","프로필"]);LCATS.unshift(["want","나의 욕구","✦","var(--gold)","want"],["mopp","돈 기회","$","var(--gold)","mopp"],["me","나의 프로필","◉","#7dd3fc","me"],["yt","유튜브 10","▶","#ff4d66","yt"],["odd","이색 볼거리","✺","#e879f9","odd"])}catch(e){}
const _pal14=palItems;palItems=function(){const it=_pal14();[["want","나의 욕구 요약 (음성)"],["mopp","돈 기회 허브"],["me","나의 프로필"],["yt","오늘의 유튜브 10"],["odd","이색 볼거리"]].forEach(r=>it.unshift({l:r[1],s:r[0],go:r[0]}));return it};
/* 프리미엄 상호작용: 누름 피드백·햅틱·페이지 전환 */
addEventListener("pointerdown",e=>{const b=e.target.closest("button,.tile,.pill,.row[data-go],a.btng");if(b){b.classList.add("prs");setTimeout(()=>b.classList.remove("prs"),160)}},{passive:true});
addEventListener("click",e=>{if(e.target.closest("[data-go],[data-act]"))vib()},true);
let _lr="";const _rend14=render;render=function(){_rend14();if(!D)return;const r=cur();if(r!==_lr&&!RM()){const v=$("v");v.classList.remove("pgin");void v.offsetWidth;v.classList.add("pgin")}_lr=r};
