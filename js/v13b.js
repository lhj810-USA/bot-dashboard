/* v13b — 별자리(Constellation) · 35일 타임라인 · 기회 보드 · 결정 대기 */
const DOM13=[["money","돈","#38e08c","money"],["inv","투자","#ffb020","inv"],["news","뉴스","#7dd3fc","news"],["cal","일정","#22e3f5","c:life"],["mail","메일","#5aa2ff","c:mail"],["bots","봇","#c084fc","bots"],["grow","성장","#a78bfa","c:grow"],["family","가족","#f472b6","family"],["ai","AI","#e879f9","ai"]];
function cItems(){const f=F(),it=[],add=(d,l,w,go,s)=>it.push({d,l,w:Math.max(.15,Math.min(1,w||.3)),go,s:s||""});
 (f.accounts||[]).forEach((a,i)=>add("money",a.name,Math.abs(a.balance||0)/25000,"acct:"+i,money(a.balance)));
 [...new Map([...(f.recurring||[]),...(f.bills||[])].map(r=>[r.name,r])).values()].forEach(r=>add("money",r.name,(r.amount||0)/200,"recur",money(r.amount)+" · "+(r.kind||"")));
 (ST.watch||[]).forEach(s=>add("inv",s,.5,"inv",""));Object.entries(MK().stocks||{}).forEach(([k,v])=>add("inv",k,.35,"inv",v&&v.price!=null?usd(v.price):""));
 const src={};Object.values(NW().sections||{}).forEach(a=>(a||[]).forEach(n=>{const s=n.src||n.feed;if(s)src[s]=(src[s]||0)+1}));Object.entries(src).forEach(([s,n])=>add("news",s,n/12,"news",n+"건"));
 ((D.cal||{}).holidays||[]).forEach(h=>add("cal",h.title,.3,"cal",h.date));(D.events||[]).slice(0,8).forEach(e=>add("family",String(e.subject||"행사").slice(0,40),.35,"events",String(e.date||"").slice(0,10)));
 ((M()||{}).byType||[]).forEach(t=>add("mail",t.type,t.n/10,"c:mail",t.n+"통"));(D.bots||[]).forEach(b=>add("bots",b.name,b.status==="working"?.8:.4,"bots",b.status||""));
 const ai=D.ai||{};["anomalies","risks","opportunities"].forEach(k=>(ai[k]||[]).forEach(x=>add("ai",x.t||x.title||x.l||String(x).slice(0,40),.4,"ai",k==="risks"?"위험":k==="anomalies"?"이상":"기회")));
 (D.paper&&D.paper.items||[]).slice(0,8).forEach(p=>add("grow",String(p.title||p.t||"논문").slice(0,40),.3,"c:grow","논문"));return it}
let CF="all",CVW="sky";
V.const=()=>{const it=cItems(),cnt=d=>it.filter(x=>x.d===d).length,W=360,H=400,cx=W/2,cy=H/2,R=140;
 const pos={};DOM13.forEach((d,i)=>{const a=-Math.PI/2+i*2*Math.PI/DOM13.length;pos[d[0]]=[cx+R*Math.cos(a),cy+R*Math.sin(a)*.95]});
 const pills=`<div class="pills" role="tablist"><button class="pill ${CF==="all"?"on":""}" data-act="cf:all">전체<span class="n">${it.length}</span></button>${DOM13.map(d=>`<button class="pill ${CF===d[0]?"on":""}" data-act="cf:${d[0]}" style="--dc:${d[2]}">${d[1]}<span class="n">${cnt(d[0])}</span></button>`).join("")}</div>`;
 const tog=`<div class="seg13"><button class="${CVW==="sky"?"on":""}" data-act="cvw:sky">✺ 별자리</button><button class="${CVW==="list"?"on":""}" data-act="cvw:list">☰ 목록</button></div>`;
 const sel=CF==="all"?it:it.filter(x=>x.d===CF);let body;
 if(CVW==="sky"){let g=`<defs><radialGradient id="cg"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
  DOM13.forEach((d,i)=>{const [x,y]=pos[d[0]],[x2,y2]=pos[DOM13[(i+1)%DOM13.length][0]];g+=`<line x1="${x}" y1="${y}" x2="${cx}" y2="${cy}" class="cl"/><line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}" class="cl f"/>`});
  const per={};it.forEach(x=>{const d=x.d,k=per[d]=(per[d]||0)+1;if(k>24)return;const [px,py]=pos[d],a=k*2.4,rr=22+((k*13)%24),dx=px+rr*Math.cos(a),dy=py+rr*Math.sin(a),dim=CF!=="all"&&CF!==d,col=(DOM13.find(z=>z[0]===d)||[])[2];
   g+=`<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="${(1.6+x.w*3.4).toFixed(1)}" fill="${col}" class="cdot${dim?" dim":""}" style="animation-delay:${(k*.37%3).toFixed(2)}s" data-go="${esc(x.go)}"><title>${esc(x.l)} ${esc(x.s)}</title></circle>`});
  g+=`<circle cx="${cx}" cy="${cy}" r="30" class="core"/><text x="${cx}" y="${cy-2}" class="cn" text-anchor="middle">${it.length}</text><text x="${cx}" y="${cy+12}" class="cs" text-anchor="middle">항목</text>`;
  DOM13.forEach(d=>{const [x,y]=pos[d[0]],n=cnt(d[0]),r=13+Math.min(10,Math.sqrt(n)*2),on=CF===d[0],dim=CF!=="all"&&!on;
   g+=`<g class="cnode${on?" on":""}${dim?" dim":""}" data-act="cf:${d[0]}" role="button" aria-label="${d[1]} ${n}개"><circle cx="${x}" cy="${y}" r="${r+8}" fill="url(#cg)" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="${d[2]}22" stroke="${d[2]}" stroke-width="1.6" style="filter:drop-shadow(0 0 6px ${d[2]})"/><text x="${x}" y="${y+4}" text-anchor="middle" class="cnl">${d[1]}</text><text x="${x}" y="${y+r+12}" text-anchor="middle" class="cnc">${n}</text></g>`});
  body=`<div class="sky glass"><svg viewBox="0 0 ${W} ${H}" class="csvg">${g}</svg></div>`}
 else body="";
 const dm=DOM13.find(d=>d[0]===CF);
 const list=(CF==="all"?DOM13:[dm]).map(d=>{const xs=it.filter(x=>x.d===d[0]);if(!xs.length)return"";return `<div class="clg"><div class="clh"><i style="background:${d[2]}"></i>${d[1]} <span class="n">${xs.length}</span><button class="pill sm" data-go="${d[3]}">열기 →</button></div>${xs.slice(0,CVW==="list"||CF!=="all"?60:4).map(x=>`<div class="row" data-go="${esc(x.go)}"><div class="m"><b>${esc(x.l)}</b></div><div class="amt">${esc(x.s)}</div></div>`).join("")}</div>`}).join("");
 return pills+tog+body+(dm?`<div class="note">${dm[1]} 영역 선택됨 — 노드를 다시 누르면 전체로 돌아갑니다.</div>`:"")+`<div class="card clist">${list||row(null,"데이터 없음")}</div><div class="note">작은 점 = 실제 항목(계좌·정기결제·관심 자산·뉴스 출처·메일 분류·봇·AI 신호·행사), 크기 = 금액·건수 기준.</div>`};
ACT.cf=a=>{CF=(CF===a&&a!=="all")?"all":a;render()};ACT.cvw=a=>{CVW=a;render()};
/* 35일 타임라인 */
const FOMC=["2026-01-28","2026-03-18","2026-04-29","2026-06-17","2026-07-29","2026-09-16","2026-10-28","2026-12-09","2027-01-27","2027-03-17"];
function tlItems(){const t0=new Date(TODAY()+"T12:00:00"),day=s=>Math.round((new Date(String(s).slice(0,10)+"T12:00:00")-t0)/864e5),out=[],f=F();
 const roll=(s,p)=>{let d=day(s);if(isNaN(d))return [];while(d<0)d+=p;const r=[];for(;d<35;d+=p)r.push(d);return r};
 (f.bills||[]).forEach(b=>roll(b.next,30).forEach(d=>out.push({g:"정기결제",d,l:b.name,s:money(b.amount),go:"recur",c:"#ffb020"})));
 const bn=new Set((f.bills||[]).map(b=>b.name));(f.recurring||[]).filter(b=>!bn.has(b.name)).forEach(b=>roll(b.next,30).forEach(d=>out.push({g:"청구(추정)",d,l:b.name,s:money(b.amount),go:"recur",c:"#f472b6",est:1})));
 ((D.cal||{}).holidays||[]).forEach(h=>{const d=day(h.date);if(d>=0&&d<35)out.push({g:"공휴일",d,l:h.title,go:"cal",c:"#38e08c"})});
 (D.events||[]).forEach(e=>{const d=day(e.date);if(d>=0&&d<35)out.push({g:"행사",d,l:String(e.subject||"").slice(0,30),go:"events",c:"#22e3f5"})});
 FOMC.forEach(s=>{const d=day(s);if(d>=0&&d<35)out.push({g:"거시",d,l:"FOMC 금리 결정",go:"inv",c:"#c084fc",span:2,d0:d-1})});
 for(let d=0;d<35;d++){const x=new Date(t0.getTime()+d*864e5);if(x.getDay()===5&&x.getDate()<=7)out.push({g:"거시",d,l:"美 고용보고서(통상 첫 금요일)",go:"inv",c:"#c084fc",est:1})}
 return out}
let TLF="all";
V.tl=()=>{const it=tlItems(),G=[...new Set(it.map(x=>x.g))],t0=new Date(TODAY()+"T12:00:00"),CW=34;
 const pills=`<div class="pills"><button class="pill ${TLF==="all"?"on":""}" data-act="tlf:all">전체<span class="n">${it.length}</span></button>${G.map(g=>`<button class="pill ${TLF===g?"on":""}" data-act="tlf:${esc(g)}">${esc(g)}<span class="n">${it.filter(x=>x.g===g).length}</span></button>`).join("")}</div>`;
 const hd=[...Array(35)].map((_,d)=>{const x=new Date(t0.getTime()+d*864e5),w=x.getDay();return `<div class="tlh${d===0?" now":""}${w===0||w===6?" we":""}" style="left:${d*CW}px">${x.getDate()===1||d===0?(x.getMonth()+1)+"/":""}${x.getDate()}<small>${"일월화수목금토"[w]}</small></div>`}).join("");
 const rows=G.filter(g=>TLF==="all"||TLF===g).map(g=>{const xs=it.filter(x=>x.g===g).sort((a,b)=>a.d-b.d),lanes=[];xs.forEach(x=>{const st=x.d0!=null?Math.max(0,x.d0):x.d,w=Math.max(3,Math.min(6,Math.ceil(x.l.length/3.2)));let L=lanes.findIndex(e=>e<=st);if(L<0){L=lanes.length;lanes.push(0)}lanes[L]=st+w;x._L=L;x._s=st;x._w=w});
  return `<div class="tlr" style="height:${Math.max(1,lanes.length)*30+8}px"><div class="tlg">${esc(g)}</div>${xs.map(x=>`<button class="tlb${x.est?" est2":""}" data-go="${esc(x.go)}" style="left:${x._s*CW+2}px;top:${x._L*30+4}px;width:${x._w*CW-4}px;--bc:${x.c}" title="${esc(x.l)} ${esc(x.s||"")}"><b>${esc(x.l)}</b>${x.s?`<span>${esc(x.s)}</span>`:""}</button>`).join("")}</div>`}).join("");
 const sum=it.filter(x=>x.g==="정기결제"||x.g==="청구(추정)").reduce((a,x)=>a+(parseFloat(String(x.s).replace(/[^\d.]/g,""))||0),0);
 return `<div class="kp">${kpi("recur","35일 예정 결제",money(sum),"정기결제 + 청구(추정)")}${kpi("cal","일정·공휴일",it.filter(x=>x.g==="공휴일"||x.g==="행사").length+"건","")}</div>`+pills+`<div class="tlw glass"><div class="tli" style="width:${35*CW+90}px"><div class="tlhs">${hd}</div><div class="tlnow"></div>${rows||'<div class="note">표시할 항목 없음</div>'}</div></div><div class="note">결제일은 지난 결제일 + 30일 주기로 추정(점선 = 추정). FOMC는 연준 공개 일정, 고용보고서는 통상 첫째 금요일(추정).</div>`};
ACT.tlf=a=>{TLF=a;render()};
/* 기회 보드 (칸반, 암호화 로컬 저장) */
const COLS=[["look","알아보기"],["doing","진행"],["exec","실행"],["done","완료"]];
let _bdOK=false;function BD(){if(!_bdOK){if(!SECS||_secP){if(sessionStorage.getItem("jv_pw")||localStorage.getItem("jv_pw"))loadSec();return {cards:[],dec:{},n:0}}_bdOK=true}if(!SECS.board||Array.isArray(SECS.board))SECS.board={};const b=SECS.board;if(!b.cards){b.cards=[];const ai=D.ai||{};let n=0;(ai.actions||[]).forEach(a=>b.cards.push({id:"c"+(++n),t:a.t||a.title||String(a),col:"look",tag:"AI 행동",p:2}));(ai.opportunities||[]).slice(0,4).forEach(a=>b.cards.push({id:"c"+(++n),t:a.t||a.title||String(a),col:"look",tag:"기회",p:1}));b.n=n;b.dec={};saveSec()}return b}
let BTF="all";
V.board=()=>{const b=BD(),tags=[...new Set(b.cards.map(c=>c.tag))],dec=decisions(b);
 const dh=dec.length?H2("결정 대기",dec.length+"건")+`<div class="card">${dec.map(d=>`<div class="dec"><div class="m"><b>${esc(d.t)}</b><small>${esc(d.s)}</small></div><button class="btnp" data-act="dok:${esc(d.id)}">보드에 추가</button><button class="btng" data-act="dno:${esc(d.id)}">보류</button></div>`).join("")}</div>`:"";
 const pills=`<div class="pills"><button class="pill ${BTF==="all"?"on":""}" data-act="btf:all">전체<span class="n">${b.cards.length}</span></button>${tags.map(t=>`<button class="pill ${BTF===t?"on":""}" data-act="btf:${esc(t)}">${esc(t)}<span class="n">${b.cards.filter(c=>c.tag===t).length}</span></button>`).join("")}</div>`;
 const cols=COLS.map(([k,l],ci)=>{const cs=b.cards.filter(c=>c.col===k&&(BTF==="all"||c.tag===BTF));return `<div class="kcol" data-col="${k}"><div class="kh">${l}<span class="n">${cs.length}</span></div>${cs.map(c=>`<div class="kc" data-id="${c.id}"><div class="kt"><span class="tg">${esc(c.tag)}</span><button class="stars" data-act="bp:${c.id}" aria-label="우선순위 ${c.p}">${"★".repeat(c.p)}${"☆".repeat(3-c.p)}</button></div><b>${esc(c.t)}</b><div class="kb">${ci?`<button data-act="bm:${c.id}:-1" aria-label="왼쪽">◀</button>`:"<span></span>"}<span class="kd" title="끌어서 이동">⠿</span>${ci<3?`<button data-act="bm:${c.id}:1" aria-label="오른쪽">▶</button>`:`<button data-act="bx:${c.id}" aria-label="삭제">✕</button>`}</div></div>`).join("")}</div>`}).join("");
 return dh+H2("기회·할 일 보드","끌어서 또는 ◀▶로 이동 · 암호화 저장")+`<form class="kadd" data-act="none" onsubmit="return false"><input id="kin" placeholder="새 카드 (예: 부업 아이디어 조사)" maxlength="80"><select id="ktag"><option>할 일</option><option>기회</option><option>투자</option><option>부업</option><option>가족</option></select><button class="btnp" type="button" data-act="badd">추가</button></form>`+pills+`<div class="kan">${cols}</div>`};
function decisions(b){const out=[];(D.approvals||[]).forEach((a,i)=>out.push({id:"ap"+i,t:"승인 대기: "+a,s:"봇 승인 요청",tag:"승인"}));
 const ai=D.ai||{};(ai.risks||[]).forEach((r,i)=>out.push({id:"rk"+i,t:r.t||r.title||String(r),s:"AI 위험 신호 — 대응할지 결정",tag:"위험"}));
 ((RC()||{}).items||[]).filter(r=>r.prio===1).slice(0,3).forEach((r,i)=>out.push({id:"rc"+i,t:r.title,s:r.date?"기한 "+r.date:"추천 · 우선",tag:"결정"}));
 return out.filter(d=>!(b.dec||{})[d.id])}
ACT.btf=a=>{BTF=a;render()};
ACT.bp=id=>{const c=BD().cards.find(x=>x.id===id);if(c){c.p=c.p%3+1;saveSec();render()}};
ACT.bm=a=>{const [id,dir]=a.split(":"),c=BD().cards.find(x=>x.id===id);if(!c)return;const i=COLS.findIndex(x=>x[0]===c.col);c.col=COLS[Math.max(0,Math.min(3,i+(+dir)))][0];saveSec();render()};
ACT.bx=id=>{const b=BD();b.cards=b.cards.filter(x=>x.id!==id);saveSec();render()};
ACT.badd=()=>{const v=($("kin")||{}).value||"";if(!v.trim())return T("카드 내용을 입력하세요");const b=BD();b.cards.unshift({id:"c"+(++b.n),t:v.trim(),col:"look",tag:$("ktag").value,p:2});saveSec();render();T("카드 추가됨")};
ACT.dok=id=>{const b=BD(),d=decisions(b).find(x=>x.id===id);if(!d)return;b.dec[id]=1;b.cards.unshift({id:"c"+(++b.n),t:d.t,col:"look",tag:d.tag,p:3});saveSec();render();T("보드에 추가됨")};
ACT.dno=id=>{const b=BD();b.dec[id]=2;saveSec();render();T("보류됨")};
/* 끌어서 열 이동 */
(function(){let dg=null;addEventListener("pointerdown",e=>{const h=e.target.closest(".kc .kd");if(!h)return;const c=h.closest(".kc");dg={id:c.dataset.id,el:c,x:e.clientX,y:e.clientY};c.classList.add("drag");e.preventDefault()},true);
 addEventListener("pointermove",e=>{if(!dg)return;dg.el.style.transform=`translate(${e.clientX-dg.x}px,${e.clientY-dg.y}px)`;document.querySelectorAll(".kcol").forEach(k=>{const r=k.getBoundingClientRect();k.classList.toggle("over",e.clientX>=r.left&&e.clientX<=r.right)})},true);
 addEventListener("pointerup",e=>{if(!dg)return;const t=[...document.querySelectorAll(".kcol")].find(k=>{const r=k.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right});const c=BD().cards.find(x=>x.id===dg.id);dg=null;
  if(t&&c&&c.col!==t.dataset.col){c.col=t.dataset.col;saveSec();T("이동: "+COLS.find(x=>x[0]===c.col)[1])}render()},true)})();
Object.assign(TITLE,{const:"별자리",tl:"35일 타임라인",board:"기회 보드"});
try{ALLTABS.push(["const","✺","별자리"],["tl","▤","타임라인"],["board","▦","보드"]);LCATS.push(["const","별자리","✺","#e879f9","const"],["tl","타임라인","▤","#22e3f5","tl"],["board","기회 보드","▦","#ffb020","board"])}catch(e){}
const _pal13=palItems;palItems=function(){const it=_pal13();[["const","별자리 (전체 연결 보기)"],["tl","35일 타임라인"],["board","기회 보드 · 결정 대기"]].forEach(r=>it.unshift({l:r[1],s:r[0],go:r[0]}));return it};
