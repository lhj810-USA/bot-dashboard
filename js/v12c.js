// JARVIS v12 · stage C — AI briefing (box rule engine via encrypted payload), on-device insight engine, assistant panel → Grok Bot prompt hand-off
"use strict";
function insights(){const f=F(),out=[];try{
 const w=wdSp(90),dn=["월","화","수","목","금","토","일"],mx=Math.max(...w),i=w.indexOf(mx),avg=w.reduce((a,b)=>a+b,0)/7;if(mx>avg*1.3)out.push({t:`${dn[i]}요일 지출이 평균의 ${(mx/avg).toFixed(1)}배`,d:`90일 ${dn[i]}요일 평균 ${money(mx)} · 전체 평균 ${money(avg)}`,go:"x:wd"});
 const we=(w[5]+w[6])/2,wd=(w[0]+w[1]+w[2]+w[3]+w[4])/5;if(we>wd*1.2)out.push({t:"주말 지출이 평일보다 많음",d:`주말 하루 ${money(we)} vs 평일 ${money(wd)}`,go:"x:wd"});
 const m=merchSp(30),tot=m.reduce((a,x)=>a+x.v,0);if(m[0]&&tot)out.push({t:`최대 가맹점 ${m[0].l} ${Math.round(100*m[0].v/tot)}%`,d:`30일 ${money(m[0].v)} · ${m[0].n}건`,go:"mer:"+m[0].l});
 const wk=weeklySp(56);if(wk.length>3){const l=wk[wk.length-1].v,p=wk.slice(0,-1).reduce((a,x)=>a+x.v,0)/(wk.length-1);out.push({t:`이번 주 지출 ${l>p?"↑":"↓"} ${Math.abs(Math.round(100*(l/p-1)))}%`,d:`${money(l)} vs 주평균 ${money(p)}`,go:"x:wk"})}
 const sr=sRate();if(sr!=null)out.push({t:`저축률 ${sr.toFixed(0)}%`,d:sr<0?"지출 > 수입 — 목표 경로가 멈춘 상태":sr<15?"15% 이상이면 목표 도달 가속":"양호",go:"rich:net"});
 const r=(f.recurring||[]).concat(f.bills||[]),rs=r.reduce((a,x)=>a+Math.abs(x.amount||0),0);if(rs&&f.income30)out.push({t:`정기결제가 월수입의 ${Math.round(100*rs/f.income30)}%`,d:`${r.length}건 ${money(rs)}`,go:"rich:subs"});
 const g=G(),y=yearsTo(NWv()||0,g.monthly,g.ret,g.target),y2=yearsTo(NWv()||0,g.monthly+100,g.ret,g.target);if(y&&y2)out.push({t:`월 $100 더 넣으면 목표 ${(y-y2).toFixed(1)}년 단축`,d:`현재 가정 ${fmtY(y)} → ${fmtY(y2)}`,go:"rich:goal"});
 const c=coinNow("BTC");if(c&&c.chg!=null&&Math.abs(c.chg)>=3)out.push({t:`BTC 24h ${c.chg.toFixed(1)}%`,d:"변동 큼 · DCA 원칙 유지",go:"coin:BTC"});
}catch(e){}return out}
const AIL=(l,fn)=>l&&l.length?l.map(fn).join(""):row(null,"없음","");
const aiRow=(x,c)=>`<div class="row" data-go="${esc(x.go||"ai")}"><div class="m"><b><span style="color:${c}">●</span> ${esc(x.t)}</b><span>${esc(x.d||"")}</span></div></div>`;
V.ai=a=>{const A=AIX();if(a==="ask")return aiAsk();const ins=insights();
 return `<div class="seg"><button class="on" data-go="ai">브리핑</button><button data-go="ai:ask">어시스턴트</button></div><div class="aihero"><div class="e">AI 브리핑 · ${esc(A.engine||"박스 엔진 데이터 없음")} · ${A.at?rel(A.at):"—"}</div><p>${esc(A.summary||"데이터 없음 — 박스 브리핑 생성 전")}</p></div>`
 +H2("다음 3가지 행동","우선순위")+card((A.actions||[]).map((x,i)=>`<div class="act" data-go="${esc(x.go||"ai")}"><b class="n">${i+1}</b><div class="m">${esc(x.t)}<span>${esc(x.d||"")}</span></div></div>`).join("")||row(null,"데이터 없음",""))
 +H2("이상 징후",(A.anomalies||[]).length+"건")+card(AIL(A.anomalies,x=>aiRow(x,x.sev>=2?"var(--err)":"var(--warn)")))
 +H2("위험",(A.risks||[]).length+"건")+card(AIL(A.risks,x=>aiRow(x,"var(--err)")))
 +H2("기회",(A.opportunities||[]).length+"건")+card(AIL(A.opportunities,x=>aiRow(x,"var(--ok)")))
 +H2("기기 내 인사이트","브라우저에서 즉시 계산")+card(AIL(ins,x=>aiRow(x,"#c084fc")))
 +`<div class="disc"><b>작동 방식</b> — 박스 규칙·통계 엔진(5분마다)이 실제 거래·시세로 이상(카테고리 급증·평소보다 큰 결제·새 정기결제)·위험·기회·행동을 계산해 암호화 페이로드에 넣고, 이 화면은 그것을 복호화해 보여줍니다. '기기 내 인사이트'는 이 브라우저에서 계산. 대형 언어모델(LLM)은 쓰지 않으며 외부로 데이터를 보내지 않습니다. 깊은 분석은 '어시스턴트'에서 문맥 프롬프트를 만들어 Grok Bot 대화에 붙여넣으세요.</div>`};
const CTX={money:["돈",()=>{const f=F();return `현금 ${money(f.cash)}, 카드잔액 ${money(f.cardBalance)} (사용률 ${f.cardUtil}%), 30일 입금 ${money(f.income30)} / 지출 ${money(f.spend30)} / 현금흐름 ${money(f.cash30)}. 상위 지출: ${catSp(30).slice(0,5).map(x=>x.l+" "+money(x.v)).join(", ")}`}],
 rich:["부자되기",()=>{const g=G();return `순자산 ${money(NWv())}, 저축률 ${sRate()==null?"—":sRate().toFixed(0)+"%"}, 비상금 ${runway()==null?"—":runway().toFixed(1)}개월. 목표 ${money(g.target)}, 월 투자 ${money(g.monthly)}, 수익률 가정 ${g.ret}% → ${fmtY(yearsTo(NWv()||0,g.monthly,g.ret,g.target))}`}],
 inv:["투자·코인",()=>["BTC","ETH","XRP"].map(s=>{const c=coinNow(s);return `${s} ${krw(c.krw)} (24h ${c.chg==null?"—":c.chg.toFixed(2)}%)`}).join(", ")+`; USD/KRW ${fxCur()?(+fxCur()).toFixed(1):"—"}; 페이퍼 ${((D.paper||{}).items||[]).map(p=>p.strategy+" "+p.cum.toFixed(1)+"%").join(", ")||"없음"}`],
 brief:["AI 브리핑",()=>{const A=AIX();return `${A.summary||""}. 이상: ${(A.anomalies||[]).map(x=>x.t).join("; ")}. 위험: ${(A.risks||[]).map(x=>x.t).join("; ")}`}],
 news:["관심 뉴스",()=>(NW().interest||[]).slice(0,6).map(x=>x.title).join(" / ")||"없음"],
 habits:["습관",()=>{const H=AIX().habits||[],d=((SECS&&SECS.hab)||{})[TODAY()]||[];return `오늘 습관 ${d.length}/${H.length}: ${H.map((h,i)=>(d.includes(i)?"✓":"·")+h).join(", ")}`}]};
window._ctx=window._ctx||["money","rich"];
function aiPrompt(){const q=($("aiq")&&$("aiq").value||window._aiq||"").trim();return `[JARVIS 문맥 · ${TODAY()} · 대시보드 자동 생성]\n${window._ctx.map(k=>"- "+CTX[k][0]+": "+CTX[k][1]()).join("\n")}\n\n[질문]\n${q||"(질문을 입력하세요)"}\n\n※ 투자·비자 관련은 위험과 확인 사항을 함께 알려줘.`}
function aiAsk(){const P=AIX().prompts||{},pc=Object.keys(P),c=window._apc||pc[0];const has=typeof window.LanguageModel!=="undefined";
 return `<div class="seg"><button data-go="ai">브리핑</button><button class="on" data-go="ai:ask">어시스턴트</button></div>
 <div class="aihero"><div class="e">AI 어시스턴트 · 문맥 프롬프트 → Grok Bot</div><p>질문을 쓰거나 말하고, 포함할 문맥을 고른 뒤 복사/전송하세요. 개인 데이터는 이 기기 클립보드로만 갑니다.</p></div>
 ${card(`<textarea id="aiq" placeholder="예: 이번 달 어디서 줄이면 100만$ 목표가 가장 빨라질까?">${esc(window._aiq||"").replace(/^—$/,"")}</textarea>
 <div class="xb">${Object.entries(CTX).map(([k,v])=>`<button class="pbtn ${window._ctx.includes(k)?"on":""}" data-ctx="${k}" data-act="ctx:${k}">${esc(v[0])}</button>`).join("")}</div>
 <div class="xb"><button class="btn" id="aicopy" data-act="aicopy">📋 프롬프트 복사</button><button class="btn" id="aisend" data-act="aisend">➤ 봇에게 전송</button><button class="btn" id="aimic" data-act="aimic">🎤 말하기</button>${has?`<button class="btn" id="ailocal" data-act="ailocal">⚡ 기기 내 AI</button>`:""}</div>
 <div id="aipv">${esc(aiPrompt())}</div><div id="aiout"></div>`)}
 ${H2("프롬프트 라이브러리","카테고리별 · 탭하면 입력")}<div class="seg">${pc.map(k=>`<button class="${k===c?"on":""}" data-apc="${esc(k)}" data-act="apc:${esc(k)}">${esc(k)}</button>`).join("")}</div>
 ${card((P[c]||[]).map((p,i)=>`<div class="row" data-ap="${i}" data-act="ap:${i}"><div class="m"><b>${esc(p)}</b></div></div>`).join("")||row(null,"프롬프트 없음",""))}
 <div class="disc">브라우저 안 AI: ${has?"Chrome 내장 Prompt API 감지 — '기기 내 AI'는 기기에서만 실행(키 불필요).":"이 브라우저에는 안전한 내장 AI(API 키 없이 기기 내 실행)가 없습니다. 키를 웹에 넣는 방식은 보안상 쓰지 않습니다."} 'Grok Bot 앱 딥링크'는 확인된 방식이 없어 클립보드 붙여넣기를 사용합니다.</div>`}
const aiSync=()=>{if($("aiq"))window._aiq=$("aiq").value;if($("aipv"))$("aipv").textContent=aiPrompt()};
document.addEventListener("input",e=>{if(e.target&&e.target.id==="aiq")aiSync()});
ACT.ctx=k=>{aiSync();window._ctx=window._ctx.includes(k)?window._ctx.filter(x=>x!==k):[...window._ctx,k];render()};
ACT.apc=k=>{aiSync();window._apc=k;render()};ACT.ap=i=>{const P=AIX().prompts||{},c=window._apc||Object.keys(P)[0];window._aiq=(P[c]||[])[+i]||"";render()};
ACT.aicopy=async()=>{aiSync();try{await navigator.clipboard.writeText(aiPrompt());T("프롬프트 복사됨 · Grok Bot 대화에 붙여넣기")}catch(e){T("복사 실패 — 미리보기를 길게 눌러 복사")}};
ACT.aisend=()=>{aiSync();send($("sel").value,aiPrompt())};
ACT.aimic=()=>{const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R)return T("음성 인식 미지원");const r=new R();r.lang="ko-KR";T("듣는 중…");r.onresult=e=>{const t=[...e.results].map(x=>x[0].transcript).join("");$("aiq").value=t;aiSync()};r.onerror=e=>T("음성 오류: "+e.error);r.start()};
ACT.ailocal=async()=>{try{aiSync();$("aiout").innerHTML=`<div class="note">기기 내 AI 생성 중…</div>`;const s=await LanguageModel.create();const o=await s.prompt(aiPrompt());$("aiout").innerHTML=card(`<div style="white-space:pre-wrap;font-size:13px;padding:8px 0">${esc(o)}</div>`)}catch(e){$("aiout").innerHTML=`<div class="note">기기 내 AI 사용 불가: ${esc(e.message||e)}</div>`}};
// command bar: "AI …" / "자비스 …" → assistant
document.addEventListener("submit",e=>{if(e.target.id!=="cmd")return;const v=$("txt").value.trim(),m=v.match(/^(ai|AI|자비스|jarvis)[\s,:]+(.+)/i);if(!m)return;e.preventDefault();e.stopPropagation();window._aiq=m[2];$("txt").value="";go("ai:ask")},true);
XW.unshift(()=>{const A=AIX(),n=(A.anomalies||[]).length,r=(A.risks||[]).length,o=(A.opportunities||[]).length;return {k:"ai",to:"ai",t:"AI 브리핑",v:A.at?n+"<small>이상 · "+r+" 위험</small>":"—",sp:chBars([n,r,o,(A.actions||[]).length],{h:40,colors:["#ffb020","#ff4d66","#38e08c","#c084fc"]}),tone:"#c084fc"}});
window.PALX=(window.PALX||[]).concat([{l:"AI 브리핑",s:"ai",go:"ai"},{l:"AI 어시스턴트 · 질문",s:"ai:ask",go:"ai:ask"}]);
if(D)render();
