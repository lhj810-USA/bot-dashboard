/* v13c — 카테고리 페이지 공통 구조: 히어로 KPI + 스파크라인 · 스탯 스트립 · '무엇이 바뀌었나' */
function anat(k){const f=F(),ai=D.ai||{},sp=(arr,c)=>arr&&arr.length>1?chLine(arr,{h:56,w:320,color:c}):"";
 const ch=(l)=>l.filter(Boolean).slice(0,4);
 switch(k){
 case"money":return {l:"순현금 (현금 − 카드)",v:money(f.net),sp:sp((f.daily||[]).map((d,i)=>[i,d.spend]),"var(--c)"),spl:"일별 지출 추이",st:[["지출 ("+(f.range30||"30일")+")",money(f.spend30)],["입금 (수집 기준)",money(f.income30)],["카드 사용률",(f.cardUtil??"—")+"%"],["정기결제",((f.bills||[]).length+(f.recurring||[]).length)+"건"]],chg:ch((ai.anomalies||[]).map(a=>[a.t,a.d,a.go]))};
 case"inv":{const c=(MK().coins||{}).BTC||{},s=((c.usd||{})["7D"]||[]),last=s.length?s[s.length-1][1]:null;return {l:"비트코인 (USD)",v:usd(last),sp:sp(s,null),spl:"7일 가격",st:Object.entries(MK().coins||{}).slice(0,4).map(([k,x])=>[k,((x.tick||{}).chg!=null?((x.tick.chg>=0?"+":"")+x.tick.chg.toFixed(2)+"%"):"—")]),chg:ch((ai.opportunities||[]).filter(o=>/투자|코인|ETF|BTC|환/.test(o.t+o.d)).map(a=>[a.t,a.d,a.go]))}}
 case"news":{const S=NW().sections||{},all=Object.values(S).flat(),src=new Set(all.map(n=>n.src||n.feed));return {l:"오늘의 기사",v:all.length+"건",st:[["출처",src.size+"곳"],...Object.keys(S).slice(0,3).map(s=>[SECN[s]||s,(S[s]||[]).length+"건"])],chg:ch(all.slice().sort((a,b)=>String(b.ts).localeCompare(String(a.ts))).slice(0,3).map(n=>[n.title,(n.src||"")+" · "+rel(n.ts),null]))}}
 case"bots":{const b=D.bots||[],c=s=>b.filter(x=>x.status===s).length;return {l:"봇",v:b.length+"개",st:[["작업 중",c("working")],["대기",c("idle")],["오류",c("error")],["승인 대기",(D.approvals||[]).length]],chg:ch((D.approvals||[]).map(a=>["승인 대기: "+a,"",null]))}}
 case"family":case"events":{const e=D.events||[];return {l:"주변 행사 소식",v:e.length+"건",st:[["최근",e[0]?md(String(e[0].date).slice(0,10)):"—"]],chg:ch(e.slice(0,3).map(x=>[x.subject,String(x.date).slice(0,10),"events"]))}}
 default:return null}}
function anatHTML(k){let a;try{a=anat(k)}catch(e){a=null}if(!a)return"";
 return `<section class="anat glass"><div class="an-k"><span>${esc(a.l)}</span><b data-cu>${a.v}</b></div>${a.sp?`<div class="an-sp">${a.sp.replace(/ data-go="[^"]*"/g,"")}<small>${esc(a.spl||"")}</small></div>`:""}
 <div class="an-st">${a.st.map(s=>`<div><small>${esc(s[0])}</small><b>${esc(String(s[1]))}</b></div>`).join("")}</div>
 ${a.chg.length?`<div class="an-ch"><div class="an-cht">무엇이 바뀌었나</div>${a.chg.map(c=>`<div class="an-ci"${c[2]?` data-go="${esc(c[2])}"`:""}><i></i><span><b>${esc(c[0])}</b>${c[1]?` <small>${esc(c[1])}</small>`:""}</span></div>`).join("")}</div>`:""}</section>`}
const _rend13c=render;render=function(){_rend13c();if(!D||$("q").value.trim())return;const k=cur().split(":")[0],full=cur();if(full.includes(":")&&k!=="c")return;
 const h=anatHTML(k);if(h){const v=$("v");v.insertAdjacentHTML("afterbegin",h)}};
