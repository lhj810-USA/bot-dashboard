/* v14.1 — TTS mini-player, 관심사 관리, Takeout importer (all local, encrypted) */
/* ---------- 1) TTS player ---------- */
const TTS={on:0,paused:0,chunks:[],i:0,gen:0,rate:+(localStorage.jv_ttsr||1),lang:"ko-KR"};
const _ssSpeak=("speechSynthesis" in window)?speechSynthesis.speak.bind(speechSynthesis):null,_ssCancel=("speechSynthesis" in window)?speechSynthesis.cancel.bind(speechSynthesis):()=>{};
function ttsEl(){let e=document.getElementById("ttsp");if(e)return e;e=document.createElement("div");e.id="ttsp";e.className="ttsp off";e.setAttribute("role","region");e.setAttribute("aria-label","음성 재생 컨트롤");
 e.innerHTML=`<span class="tts-ic" aria-hidden="true">🔊</span><span class="tts-st" id="ttsSt">읽는 중</span><button id="ttsPause" type="button" aria-label="일시정지">⏸ 일시정지</button><button id="ttsStop" type="button" aria-label="멈춤">■ 멈춤</button><select id="ttsRate" aria-label="읽기 속도">${[.8,1,1.2].map(r=>`<option value="${r}" ${r===TTS.rate?"selected":""}>${r}×</option>`).join("")}</select>`;
 document.body.appendChild(e);
 e.querySelector("#ttsStop").addEventListener("click",ev=>{ev.stopPropagation();ttsStop()});
 e.querySelector("#ttsPause").addEventListener("click",ev=>{ev.stopPropagation();TTS.paused?ttsResume():ttsPause()});
 e.querySelector("#ttsRate").addEventListener("change",ev=>{TTS.rate=+ev.target.value;localStorage.jv_ttsr=TTS.rate;if(TTS.on&&!TTS.paused){_ssCancel();ttsSay()}});
 return e}
function ttsUI(){const e=ttsEl();e.classList.toggle("off",!TTS.on);const p=e.querySelector("#ttsPause");p.textContent=TTS.paused?"▶ 이어듣기":"⏸ 일시정지";p.setAttribute("aria-label",TTS.paused?"이어듣기":"일시정지");
 e.querySelector("#ttsSt").textContent=TTS.paused?"일시정지됨":`읽는 중 ${Math.min(TTS.i+1,TTS.chunks.length)}/${TTS.chunks.length}`;document.body.classList.toggle("tts-on",!!TTS.on)}
function ttsSay(){if(!_ssSpeak||!TTS.on||TTS.paused)return;if(TTS.i>=TTS.chunks.length)return ttsStop();const g=++TTS.gen,u=new SpeechSynthesisUtterance(TTS.chunks[TTS.i]);u.lang=TTS.lang;u.rate=TTS.rate;
 const v=speechSynthesis.getVoices().find(v=>/^ko/i.test(v.lang));if(v&&/^ko/i.test(TTS.lang))u.voice=v;
 u.onend=()=>{if(g!==TTS.gen||TTS.paused)return;TTS.i++;ttsUI();ttsSay()};u.onerror=e=>{if(g!==TTS.gen||TTS.paused)return;if(e.error==="interrupted"||e.error==="canceled")return;TTS.i++;ttsSay()};
 _ssSpeak(u);ttsUI()}
/* split into sentences: avoids Chrome's ~15s cutoff and lets pause/resume work via cancel()+re-speak (Chrome pause() bug) */
function ttsPlay(text,lang){text=String(text||"").replace(/\s+/g," ").trim();if(!text)return;if(!_ssSpeak)return T("이 브라우저는 음성 읽기를 지원하지 않아요");
 _ssCancel();TTS.gen++;TTS.chunks=(text.match(/[^.!?。…\n]+[.!?。…]*\s*/g)||[text]).map(s=>s.trim()).filter(Boolean).reduce((a,s)=>{if(a.length&&(a[a.length-1]+" "+s).length<160)a[a.length-1]+=" "+s;else a.push(s);return a},[]);
 TTS.i=0;TTS.on=1;TTS.paused=0;TTS.lang=lang||"ko-KR";ttsSay()}
function ttsPause(){if(!TTS.on)return;TTS.paused=1;TTS.gen++;_ssCancel();ttsUI()}
function ttsResume(){if(!TTS.on)return;TTS.paused=0;ttsSay()}
function ttsStop(){TTS.gen++;TTS.on=0;TTS.paused=0;_ssCancel();ttsUI()}
/* every legacy speak() (briefing, assistant) goes through the player */
if(_ssSpeak){try{speechSynthesis.speak=function(u){if(u&&u.text)ttsPlay(u.text,u.lang);else _ssSpeak(u)}}catch(e){}}
ACT.speak=()=>ttsPlay(($("wtx")||{}).textContent||"");
ACT.ttsstop=()=>ttsStop();
addEventListener("hashchange",()=>{if(TTS.on)ttsStop()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&TTS.on)ttsStop()});
addEventListener("pagehide",()=>{if(TTS.on)ttsStop()});
/* ---------- 2) 관심사 엔진 ---------- */
const ICAT={finance:["재테크·투자",/투자|재테크|주식|ETF|배당|부자|경제|금리|finance|invest|stock|money|dividend|wealth/i,"finance",["inv"]],
 trading:["트레이딩·코인",/자동매매|퀀트|코인|비트|트레이딩|차트|crypto|bitcoin|trading|algo|quant/i,"trading",["passive"]],
 ai:["AI·테크",/AI|인공지능|GPT|LLM|코딩|프로그래밍|개발|봇|에이전트|tech|coding|programming|machine learning/i,"ai",["edu"]],
 english:["영어",/영어|english|IELTS|TOEIC|회화|vocabulary/i,"english",["edu"]],
 career:["커리어·부업",/부업|창업|커리어|연봉|이직|아르바이트|알바|side hustle|career|business|startup/i,"",["side","edu"]],
 realestate:["부동산",/부동산|아파트|주택|집값|렌트|real estate|house|mortgage/i,"",["re"]],
 travel:["여행·맛집",/여행|맛집|캠핑|travel|street food|trip|hotel/i,"travel",[]],
 science:["과학·우주",/과학|우주|물리|천문|science|space|physics|NASA|engineering/i,"science",[]],
 fun:["예능·재미",/예능|웃긴|챌린지|코미디|funny|challenge|comedy|prank/i,"fun",[]],
 family:["가족·육아",/가족|육아|아이|자녀|kids|family|parenting/i,"",[]],
 sports:["스포츠·운동",/축구|야구|골프|헬스|운동|soccer|football|nba|golf|workout/i,"",[]],
 music:["음악",/음악|노래|music|k-?pop|playlist/i,"",[]]};
const ISUG={finance:["배당주","ETF 적립","Roth IRA","경제 뉴스"],trading:["비트코인","퀀트 전략","자동매매 봇"],ai:["AI 에이전트","코딩 자동화","최신 AI 모델"],english:["비즈니스 영어","영어 회화"],career:["부업 아이디어","온라인 창업"],realestate:["미국 집 구매","리츠"],travel:["가족 여행","맛집"],science:["우주","공학"],fun:["한국 예능","챌린지 영상"],family:["주말 나들이","육아"],sports:["골프","헬스"],music:["K-pop","재즈"]};
const ISRC={said:["말씀하신 것","#f5c451"],pick:["직접 선택","#22d3ee"],conv:["대화에서 추정","#a78bfa"],yt:["유튜브 기록","#ff4d66"],news:["뉴스 클릭","#34d399"]};
const icat=s=>{for(const k in ICAT)if(ICAT[k][1].test(s))return k;return"etc"};
const IST=()=>{const s=SX("int");s.items=s.items||{};s.ov=s.ov||{};s.imp=s.imp||{};s.news=s.news||{};return s};
function interests(){const s=secReady()?IST():{items:{},ov:{},imp:{},news:{}},M={},put=(key,t,cat,src,w,ev)=>{const m=M[key]=M[key]||{key,t,cat,src:{},w:0,ev:[]};m.src[src]=1;m.w+=w;m.ev.push(ev)};
 Object.entries(s.items).forEach(([k,x])=>put("u:"+k,x.t,x.cat,x.src||"said",x.src==="pick"?2.5:3,(x.src==="pick"?"추천 칩에서 직접 고르심":"직접 말씀/입력하심")+(x.at?" · "+x.at:"")));
 ((D.profile||{}).topics||[]).forEach(tp=>{if(!tp.n)return;put("c:"+tp.topic,tp.topic,icat(tp.topic),"conv",Math.min(3,Math.log2(tp.n+1)/2.2),`봇 대화에서 '${tp.topic}' 관련 ${tp.n}회 (봇: ${(tp.bots||[]).slice(0,3).join(", ")||"—"})`)});
 const kw=(s.imp||{}).kw||{};Object.entries(kw).forEach(([c,n])=>{if(c!=="etc"&&n>0)put("y:"+c,(ICAT[c]||[c])[0],c,"yt",Math.min(3,Math.log2(n+1)/2),`유튜브 시청·구독·좋아요 기록에서 ${n}건이 이 분야`)});
 Object.entries(s.news||{}).forEach(([c,n])=>{if(c!=="etc"&&n>0)put("n:"+c,(ICAT[c]||[c])[0],c,"news",Math.min(2,n/3),`JARVIS에서 이 분야 기사·영상 ${n}회 열어보심`)});
 return Object.values(M).filter(m=>!(s.ov[m.key]||{}).del).map(m=>{const o=s.ov[m.key]||{};m.adj=o.adj||0;m.mute=!!o.mute;m.w=m.mute?0:Math.max(0,m.w+m.adj*.75);return m}).sort((a,b)=>b.w-a.w)}
function catW(){const w={},IL=interests();IL.forEach(m=>{w[m.cat]=(w[m.cat]||0)+m.w});const out={};Object.keys(ICAT).forEach(k=>{const muted=IL.some(m=>m.cat===k&&m.mute)&&!w[k];out[k]=muted?.4:1+Math.min(1.5,(w[k]||0)*.15)});return out}
/* feed: YouTube tags, money opps, wants */
const _tagW14=tagW;tagW=function(){const w=_tagW14(),cw=catW();Object.entries(ICAT).forEach(([k,c])=>{if(c[2])w[c[2]]=(w[c[2]]||1)*cw[k]});return w};
const _opps14=opps;opps=function(){const L=_opps14(),cw=catW();L.forEach(o=>{let b=1;Object.entries(ICAT).forEach(([k,c])=>{if(c[3].includes(o.c))b=Math.max(b,cw[k])});o.sc*=b});return L.sort((a,b)=>b.sc-a.sc)};
const _wants14=wants;wants=function(){const W=_wants14(),cw=catW(),map={auto:"trading",save:"finance",rich:"finance",eng:"english",side:"career",fam:"family"};
 W.forEach(x=>{x.sc*=cw[map[x.k]]||1});
 interests().filter(m=>m.src.said||m.src.pick).slice(0,2).forEach(m=>{if(!W.some(x=>x.k==="i:"+m.key))W.push({k:"i:"+m.key,t:m.t,why:"직접 알려주신 관심사",s:30+m.w*5,sc:(30+m.w*5)*(cw[m.cat]||1),ev:[[m.src.said?"말씀하신 것":"직접 선택","interests"]],go:"interests"})});
 return W.sort((a,b)=>b.sc-a.sc)};
/* channel boost from imported history/subscriptions */
function chBoost(){const im=secReady()?IST().imp:{},b={};Object.entries(im.ch||{}).forEach(([cid,x])=>b[cid]=1+Math.min(1,Math.log10((x[1]||0)+1)/2));Object.keys(im.subs||{}).forEach(c=>b[c]=(b[c]||1)+.3);return b}
ytPick=function(){const V0=(FUN().videos||[]).slice(),fb=secReady()?SX("yt"):{},no=fb.no||{},W=tagW(),CB=chBoost(),im=secReady()?IST().imp:{},now=Date.now(),seed=+TODAY().replace(/-/g,"");
 const sc=v=>{const age=(now-new Date(v.pub))/864e5,tw=Math.max(...v.tags.map(t=>W[t]||1)),ch=Math.pow(1.3,(fb.ch||{})[v.cid]||0)*(CB[v.cid]||1),j=((parseInt(v.id.replace(/[^a-zA-Z0-9]/g,""),36)||0)+seed)%13/100;return tw*ch*(1/(1+age/5))*(v.short?.75:1)+j};
 const pool=V0.filter(v=>!no[v.id]&&((fb.ch||{})[v.cid]||0)>-3).map(v=>Object.assign({},v,{sc:sc(v)})).sort((a,b)=>b.sc-a.sc),out=[],perCh={},perTag={};
 for(const v of pool){if(out.length>=10)break;if((perCh[v.cid]||0)>=1&&pool.length>20)continue;const t=v.tags[0];if((perTag[t]||0)>=3&&pool.length>20)continue;out.push(v);perCh[v.cid]=(perCh[v.cid]||0)+1;perTag[t]=(perTag[t]||0)+1}
 for(const v of pool){if(out.length>=10)break;if(!out.includes(v))out.push(v)}
 out.forEach(v=>{const t=v.tags.slice().sort((a,b)=>(W[b]||1)-(W[a]||1))[0];v.why=((im.subs||{})[v.cid]?"구독 채널 · ":(im.ch||{})[v.cid]?"자주 보는 채널 · ":"")+(TAGK[t]||t)+(W[t]>1.2?" · 관심 높음":"")+((now-new Date(v.pub))<2*864e5?" · 새 영상":"")});
 const fun=pool.filter(v=>!out.includes(v)&&v.tags.some(t=>t==="fun"||t==="science")).slice(0,8);return {top:out,fun}};
/* news / video opens → 뉴스 클릭 source (category counts only) */
document.addEventListener("click",e=>{const a=e.target.closest&&e.target.closest("a[target=_blank]");if(!a||!secReady())return;const r=(location.hash||"").slice(1);if(!/^(news|brief|yt|odd|home)/.test(r))return;const c=icat((a.textContent||"")+" "+(a.closest(".ytc,.odc,.row,.card")||a).textContent);if(c==="etc")return;const n=IST().news;n[c]=(n[c]||0)+1;saveSec()},true);
/* ---------- Takeout importer (parsed in the browser; raw file never stored/uploaded) ---------- */
function tkParse(name,txt){const R={watch:[],subs:[],liked:[]};const nm=name.toLowerCase();
 if(/\.json$/.test(nm)){let a;try{a=JSON.parse(txt)}catch(e){throw new Error("JSON 형식 오류")}if(!Array.isArray(a))throw new Error("시청 기록 JSON이 아니에요");
  a.forEach(x=>{if(!x||!x.titleUrl||!/watch\?v=/.test(x.titleUrl))return;if((x.details||[]).some(d=>/Ads|광고/.test(d.name||"")))return;const sb=(x.subtitles||[])[0]||{};R.watch.push({t:String(x.title||"").replace(/^Watched\s+/i,"").replace(/\s*(을\(를\)\s*)?시청(했습니다|함)\.?$/,""),ch:sb.name||"",cid:((sb.url||"").match(/channel\/(UC[\w-]{22})/)||[])[1]||""})})}
 else if(/\.html?$/.test(nm)){const doc=new DOMParser().parseFromString(txt,"text/html");doc.querySelectorAll(".content-cell").forEach(c=>{const as=[...c.querySelectorAll("a")],w=as.find(a=>/watch\?v=/.test(a.href));if(!w)return;const ch=as.find(a=>/channel\//.test(a.href));R.watch.push({t:w.textContent.trim(),ch:ch?ch.textContent.trim():"",cid:ch?((ch.href.match(/channel\/(UC[\w-]{22})/)||[])[1]||""):""})})}
 else if(/\.csv$/.test(nm)){const L=txt.replace(/^\uFEFF/,"").split(/\r?\n/).filter(l=>l.trim());const h=(L[0]||"").toLowerCase();
  if(/channel id|채널 id|채널 아이디/.test(h))L.slice(1).forEach(l=>{const c=l.split(",");if(/^UC[\w-]{22}$/.test((c[0]||"").trim()))R.subs.push({cid:c[0].trim(),ch:c.slice(2).join(",").trim()})});
  else if(/video id|동영상 id/.test(h)){const i=L.findIndex(l=>/video id|동영상 id/i.test(l));L.slice(i+1).forEach(l=>{const id=(l.split(",")[0]||"").trim();if(/^[\w-]{11}$/.test(id))R.liked.push(id)})}
  else throw new Error("구독/좋아요 CSV 형식이 아니에요")}
 else throw new Error("json, html, csv 파일만 가능해요");return R}
function tkMerge(R){const s=IST(),im=s.imp;im.ch=im.ch||{};im.kw=im.kw||{};im.subs=im.subs||{};const vids=FUN().videos||[],tagCat={};Object.entries(ICAT).forEach(([k,c])=>{if(c[2])tagCat[c[2]]=k});
 const chCat={};vids.forEach(v=>{chCat[v.cid]=tagCat[v.tags[0]]||chCat[v.cid]});
 R.watch.forEach(w=>{const k=w.cid||("n:"+w.ch);if(w.ch){const x=im.ch[k]||[w.ch,0];x[1]++;im.ch[k]=x}const c=chCat[w.cid]||icat(w.t+" "+w.ch);im.kw[c]=(im.kw[c]||0)+1});
 R.subs.forEach(x=>{im.subs[x.cid]=x.ch;const c=chCat[x.cid]||icat(x.ch);im.kw[c]=(im.kw[c]||0)+2});
 R.liked.forEach(id=>{const v=vids.find(v=>v.id===id);if(v){const c=tagCat[v.tags[0]];if(c)im.kw[c]=(im.kw[c]||0)+2}});
 /* keep aggregates only: top 40 channels, category counts */
 im.ch=Object.fromEntries(Object.entries(im.ch).sort((a,b)=>b[1][1]-a[1][1]).slice(0,40));im.watched=(im.watched||0)+R.watch.length;im.liked=(im.liked||0)+R.liked.length;im.at=new Date().toISOString().slice(0,10);saveSec()}
async function tkFiles(files){if(!secReady())return T("잠시 후 다시 시도");const out=[];for(const f of files){try{const R=tkParse(f.name,await f.text());tkMerge(R);out.push(`${f.name}: 시청 ${R.watch.length} · 구독 ${R.subs.length} · 좋아요 ${R.liked.length}`)}catch(e){out.push(`${f.name}: ${e.message}`)}}
 window._tkLast=out;T("가져오기 완료");render()}
document.addEventListener("change",e=>{if(e.target&&e.target.id==="tkfile"&&e.target.files.length){tkFiles([...e.target.files]);e.target.value=""}});
ACT.tkclr=()=>{if(!secReady())return;IST().imp={};saveSec();T("가져온 유튜브 기록 삭제됨");render()};
ACT.tkids=()=>{const im=IST().imp,have=new Set((FUN().videos||[]).map(v=>v.cid)),ids=Object.keys(im.subs||{}).filter(c=>!have.has(c));navigator.clipboard&&navigator.clipboard.writeText(ids.join("\n"));T(ids.length+"개 채널 ID 복사됨")};
/* ---------- 관심사 관리 page ---------- */
const iBadge=m=>Object.keys(m.src).map(s=>`<span class="isb" style="--c:${ISRC[s][1]}">${ISRC[s][0]}</span>`).join("");
const _iOpen={};
V.interests=()=>{const L=interests(),s=secReady()?IST():{items:{},imp:{}},im=s.imp||{},pr=(D.profile||{}).topics||[],have=new Set((FUN().videos||[]).map(v=>v.cid)),subs=Object.keys(im.subs||{}),miss=subs.filter(c=>!have.has(c)).length;
 const srcRows=[["said",`직접 말씀/입력: ${Object.values(s.items||{}).filter(x=>x.src!=="pick").length}개`],["pick",`추천 칩에서 선택: ${Object.values(s.items||{}).filter(x=>x.src==="pick").length}개`],["conv",pr.length?`봇·Grok 대화 주제 ${pr.length}개 (대화 기록에서 횟수만 집계, "JARVIS 업데이트"로 갱신)`:"대화 데이터 없음 — 연결 필요"],["yt",im.at?`유튜브 Takeout 가져옴 (${im.at}): 시청 ${im.watched||0} · 구독 ${subs.length} · 좋아요 ${im.liked||0}`:"아직 없음 — 아래에서 Takeout 파일 가져오기"],["news",`JARVIS에서 연 기사·영상: ${Object.values(s.news||{}).reduce((a,b)=>a+b,0)}회`]];
 const sr=SR14?`<button class="btn mic14" data-act="imic" aria-label="음성으로 말하기">🎤 말로 추가</button>`:`<span class="mut">음성 인식 미지원 브라우저</span>`;
 return `<section class="hero14 glass2"><span class="ey">INTERESTS · 관심사 관리</span><h2 class="h14">나의 관심사 ${L.length}</h2><p class="mut">말씀·선택·대화·유튜브 기록·클릭을 합쳐 욕구 요약, 유튜브 10, 돈 기회 순위에 반영해요. 모두 이 기기에 암호화 저장.</p></section>
 ${H2("JARVIS는 이렇게 관심사를 알아요","실제 소스")}<div class="card isrc">${srcRows.map(r=>`<div class="row"><span class="isb" style="--c:${ISRC[r[0]][1]}">${ISRC[r[0]][0]}</span><span>${esc(r[1])}</span></div>`).join("")}</div>
 ${H2("말로 알려주기","입력 또는 음성")}<div class="card iadd"><input id="iin" placeholder="예: 미국 배당주, 가족 캠핑, AI 에이전트" aria-label="관심사 입력"><button class="btnp" data-act="iadd">추가</button>${sr}</div>
 ${H2("골라서 추가","카테고리별 추천")}<div class="card isug">${Object.entries(ISUG).map(([k,a])=>`<div class="isg"><b>${esc(ICAT[k][0])}</b>${a.map(t=>`<button class="pill${(s.items||{})[t]?" on":""}" data-act="ipick:${esc(t)}">${esc(t)}</button>`).join("")}</div>`).join("")}</div>
 ${H2("현재 관심사","가중치 순")}<div class="card ilist">${L.length?L.map(m=>`<div class="irow${m.mute?" muted":""}" data-ik="${esc(m.key)}"><div class="ir-h"><b>${esc(m.t)}</b><span class="mut">${esc((ICAT[m.cat]||["기타"])[0])}</span></div><div class="ir-b">${iBadge(m)}</div><div class="ibar"><i style="width:${Math.min(100,m.w/6*100)}%"></i></div><div class="ir-a"><span class="mut">가중치 ${m.w.toFixed(1)}</span><button data-act="iadj:${esc(m.key)}:1" aria-label="부스트">▲ 더</button><button data-act="iadj:${esc(m.key)}:-1" aria-label="덜">▼ 덜</button><button data-act="imute:${esc(m.key)}" aria-label="음소거">${m.mute?"🔈 켜기":"🔇 숨김"}</button><button data-act="idel:${esc(m.key)}" aria-label="삭제">✕</button><button data-act="iwhy:${esc(m.key)}" aria-label="왜 좋아한다고 생각해?">왜?</button></div>${_iOpen[m.key]?`<div class="iwhy"><b>왜 좋아하신다고 생각했냐면</b><ul>${m.ev.map(e=>`<li>${esc(e)}</li>`).join("")}</ul>${m.adj?`<p class="mut">직접 조정 ${m.adj>0?"+":""}${m.adj}</p>`:""}</div>`:""}</div>`).join(""):'<p class="mut">데이터 없음</p>'}</div>
 ${H2("유튜브 시청 기록 가져오기","기기 안에서만 처리")}<div class="card tk">
 <ol class="tks"><li><a href="https://takeout.google.com/" target="_blank" rel="noopener">takeout.google.com</a> 접속 → <b>모두 선택 해제</b></li><li><b>YouTube 및 YouTube Music</b> 체크 → <b>모든 YouTube 데이터 포함됨</b> 누르고 <b>시청 기록·구독·재생목록</b>만 선택</li><li><b>여러 형식</b> → 기록을 <b>JSON</b>으로 변경 (HTML도 가능)</li><li>내보내기 생성 → 메일로 온 zip 다운로드·압축 해제</li><li>아래에서 <code>watch-history.json</code>, <code>subscriptions.csv</code>(구독), <code>Liked videos.csv</code>(좋아요) 선택</li></ol>
 <label class="btnp tkb">📂 파일 선택<input type="file" id="tkfile" accept=".json,.html,.htm,.csv" multiple hidden></label>
 <p class="mut">원본 파일은 업로드·저장하지 않아요. 채널별 횟수(상위 40)와 분야별 횟수만 암호화해 저장합니다. YouTube Data API는 로그인(OAuth)을 해도 시청 기록을 읽는 기능이 없고(2016년 제거), 지금 연결된 커넥터에도 없어서 Takeout 파일이 유일한 방법이에요.</p>
 ${(window._tkLast||[]).length?`<div class="tkr" id="tkr">${window._tkLast.map(x=>`<div>${esc(x)}</div>`).join("")}</div>`:""}
 ${im.at?`<div class="tkc"><b>자주 본 채널</b> ${Object.values(im.ch||{}).slice(0,6).map(x=>`<span class="pill">${esc(x[0])} ${x[1]}</span>`).join("")||"—"}</div>${miss?`<p class="mut">구독 채널 중 ${miss}개는 아직 수집 목록에 없어요 (브라우저는 유튜브 피드를 직접 못 읽음). <button class="pill" data-act="tkids">채널 ID 복사</button> 후 "JARVIS 업데이트"로 수집 목록에 추가할 수 있어요.</p>`:""}<button class="pill" data-act="tkclr">가져온 기록 삭제</button>`:""}</div>`};
TITLE.interests="관심사 관리";
const SR14=window.SpeechRecognition||window.webkitSpeechRecognition;
function iAdd(t,src){t=String(t||"").trim().slice(0,40);if(!t)return;if(!secReady())return T("잠시 후 다시 시도");const s=IST();if(src==="pick"&&s.items[t]&&s.items[t].src==="pick"){delete s.items[t]}else s.items[t]={t,cat:icat(t),src:src||"said",at:TODAY()};saveSec();vib();render()}
ACT.iadd=()=>{iAdd(($("iin")||{}).value,"said")};
ACT.ipick=t=>iAdd(t,"pick");
ACT.iadj=a=>{const i=a.lastIndexOf(":"),k=a.slice(0,i),d=+a.slice(i+1);if(!secReady())return;const o=IST().ov[k]=IST().ov[k]||{};o.adj=Math.max(-4,Math.min(4,(o.adj||0)+d));saveSec();render()};
ACT.imute=k=>{if(!secReady())return;const o=IST().ov[k]=IST().ov[k]||{};o.mute=!o.mute;saveSec();render()};
ACT.idel=k=>{if(!secReady())return;const s=IST();if(k.startsWith("u:"))delete s.items[k.slice(2)];else(s.ov[k]=s.ov[k]||{}).del=1;saveSec();render()};
ACT.iwhy=k=>{_iOpen[k]=!_iOpen[k];render()};
ACT.imic=()=>{if(!SR14)return T("음성 인식 미지원");const r=new SR14();r.lang="ko-KR";r.interimResults=false;r.onresult=e=>{const t=e.results[0][0].transcript;if($("iin"))$("iin").value=t;iAdd(t,"said");T("추가: "+t)};r.onerror=e=>T("음성 인식 실패: "+e.error);try{r.start();T("말씀하세요…")}catch(e){T("음성 인식 시작 실패")}};
const _me141=V.me;V.me=()=>`<button class="card glass2 ilink" data-go="interests"><b>✦ 관심사 관리</b><span class="mut">${interests().length}개 · 말씀·선택·대화·유튜브 기록 →</span></button>`+_me141();
try{LCATS.unshift(["interests","관심사 관리","✦","var(--gold)","interests"])}catch(e){}
const _pal141=palItems;palItems=function(){const it=_pal141();it.unshift({l:"관심사 관리 · 유튜브 기록 가져오기",s:"interests",go:"interests"});return it};
