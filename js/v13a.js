/* v13a — 비주얼 시스템 + 홈 '부의 흐름' 퍼널 */
const RM=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
/* 1) 부드러운 곡선 스파크라인 + 변화율 칩 */
function smoothD(d){const p=[...d.matchAll(/[ML]([\d.\-]+),([\d.\-]+)/g)].map(m=>[+m[1],+m[2]]);if(p.length<3||p.length>500)return d;
 let s="M"+p[0][0]+","+p[0][1];for(let i=0;i<p.length-1;i++){const a=p[i-1]||p[i],b=p[i],c=p[i+1],e=p[i+2]||c,t=6;
  s+="C"+(b[0]+(c[0]-a[0])/t).toFixed(1)+","+(b[1]+(c[1]-a[1])/t).toFixed(1)+" "+(c[0]-(e[0]-b[0])/t).toFixed(1)+","+(c[1]-(e[1]-b[1])/t).toFixed(1)+" "+c[0]+","+c[1]}return s}
const _chLine0=chLine;chLine=function(pts,o={}){let h=_chLine0(pts,o);if(!pts||pts.length<2)return h;
 const m=h.match(/<path d="(M[^"]+)" fill="none"/);if(m){const sd=smoothD(m[1]);h=h.split(m[1]).join(sd)}
 const a=+pts[0][1],b=+pts[pts.length-1][1];if(a&&isFinite(a)&&isFinite(b)){const dl=(b-a)/Math.abs(a)*100;if(isFinite(dl))h=h.replace("<svg",`<svg data-dl="${dl.toFixed(1)}"`)}return h};
const dchip=v=>v==null||!isFinite(v)?"":`<span class="dchip ${v>=0?"up":"dn"}">${v>=0?"▲":"▼"}${Math.abs(v)>=100?Math.round(Math.abs(v)):Math.abs(v).toFixed(1)}%</span>`;
const _mTile0=mTile;mTile=function(t){let h=_mTile0(t);if(!t||!t.sp)return h;const m=String(t.sp).match(/data-dl="(-?[\d.]+)"/);
 if(m&&!/dchip/.test(t.v)&&!/^(goal|flow|fire|side|habits|ai)$/.test(t.k)&&Math.abs(+m[1])<300)h=h.replace(/(<div class="v">[\s\S]*?)(<\/div>)/,(x,a,b)=>a+dchip(+m[1])+b);return h};
/* 2) 굵은 도넛 + 큰 중앙 숫자 */
function donutBig(pct,o={}){const r=40,c=2*Math.PI*r,p=Math.max(0,Math.min(100,pct||0));return `<svg class="dnb" viewBox="0 0 100 100" width="${o.s||112}" height="${o.s||112}" role="img" aria-label="${esc(o.l||"")} ${p.toFixed(1)}%"><circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(127,140,180,.18)" stroke-width="13"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="${o.c||"var(--c)"}" stroke-width="13" stroke-linecap="round" stroke-dasharray="${(c*p/100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 50 50)" class="dnbarc"/><text x="50" y="${o.sub?50:56}" text-anchor="middle" class="dnbv">${o.v!=null?o.v:p.toFixed(p<10?1:0)+"%"}</text>${o.sub?`<text x="50" y="66" text-anchor="middle" class="dnbs">${esc(o.sub)}</text>`:""}</svg>`}
/* 3) 카운트업 (첫 홈 진입 1회, 모션 감소 시 생략) */
function countUp(root){if(RM()||!root)return;root.querySelectorAll("[data-cu]").forEach(el=>{const txt=el.textContent,m=txt.match(/-?[\d,]+(\.\d+)?/);if(!m)return;
 const end=parseFloat(m[0].replace(/,/g,"")),dec=(m[1]||"").length?m[1].length-1:0,t0=performance.now(),D0=700;
 const f=n=>txt.replace(m[0],n.toLocaleString("en-US",{minimumFractionDigits:dec,maximumFractionDigits:dec}));
 const st=now=>{const k=Math.min(1,(now-t0)/D0),e=1-Math.pow(1-k,3);el.textContent=f(end*e);if(k<1)requestAnimationFrame(st);else el.textContent=txt};requestAnimationFrame(st)})}
/* 4) 스켈레톤 (잠금 해제 직후 렌더 전) */
(function(){const v=$("v");if(v&&!v.innerHTML.trim())v.innerHTML=`<div class="skel">${'<div class="sk"></div>'.repeat(6)}</div>`})();
/* 5) 부의 흐름 퍼널 — 실데이터, 추정은 라벨 */
function wealthStages(){const f=F(),inc=f.income30,sp=f.spend30,sv=(inc!=null&&sp!=null)?inc-sp:null;
 const cash=f.cash,inv=(cash!=null&&sp!=null)?Math.max(0,cash-3*sp):null,nw=typeof NWv==="function"?NWv():f.net,g=typeof G==="function"?G().target:1e6;
 return [{k:"in",l:"입금 30일",v:inc,go:"flow",real:1},{k:"sp",l:"지출 30일",v:sp,go:"spend",real:1},{k:"sv",l:"남은 돈",v:sv,go:"flow",real:1},
  {k:"iv",l:"투자 가능액",v:inv,go:"rich:dca",est:"현금 − 지출 3개월치(비상금) · 추정"},{k:"gl",l:"목표 진척",v:nw,pct:nw!=null&&g?100*nw/g:null,go:"rich:goal",est:"순자산 ÷ 목표 "+money(g)}]}
function funnelHTML(){const S=wealthStages(),base=S[0].v;
 const pct=(a,b)=>a==null||b==null||!b?null:100*a/b;
 const cells=S.map((s,i)=>{const prev=i?S[i-1]:null;let rate=null,rl="";
  if(i===1){rate=pct(s.v,base);rl="입금 대비"}else if(i===2){rate=pct(s.v,base);rl="저축률"}else if(i===3){rate=s.v==null?null:pct(s.v,F().cash);rl="현금 중"}else if(i===4){rate=s.pct;rl="달성"}
  const big=i===4?(s.pct==null?"—":s.pct.toFixed(s.pct<10?1:0)+"%"):money(s.v);
  return `<button class="fst ${s.v!=null&&s.v<0?"neg":""}" data-go="${s.go}" data-fk="${s.k}"><span class="fl">${esc(s.l)}${s.est?'<em class="est">추정</em>':""}</span><b class="fv" data-cu>${big}</b>${rate!=null&&i?`<span class="fr">${rl} ${rate.toFixed(Math.abs(rate)<10?1:0)}%</span>`:'<span class="fr">&nbsp;</span>'}</button>`}).join("");
 const notes=S.filter(s=>s.est).map(s=>`${esc(s.l)}: ${esc(s.est)}`).join(" · ");
 return `<section class="whero glass" aria-label="부의 흐름"><div class="wh-h"><span class="wh-t">부의 흐름 <small>WEALTH FLOW · 30일</small></span><button class="pill" data-go="rich">부자되기 →</button></div>
 <div class="fwrap"><canvas id="fcv" aria-hidden="true"></canvas><div class="fgrid">${cells}</div></div><div class="wh-n">입금·지출·남은 돈 = 카드·계좌 실데이터 (${esc(F().range30||"")} · ${esc(hm(D.collectedAt))} CT 수집). ${notes}</div></section>`}
let _fx=null;function funnelAnim(){const cv=$("fcv");if(!cv)return;if(_fx){_fx.stop();_fx=null}
 const S=wealthStages(),vals=S.slice(0,4).map(s=>Math.max(0,s.v||0)),mx=Math.max(...vals,1),ctx=cv.getContext("2d");let W,H,dpr=Math.min(2,devicePixelRatio||1);
 const size=()=>{const r=cv.getBoundingClientRect();W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};size();
 const n=S.length,hw=i=>{const v=i<4?vals[i]/mx:Math.min(1,(S[4].pct||0)/100);return Math.max(.06,v)*H*.42};
 const half=x=>{const f=x/W*(n-1),i=Math.floor(Math.min(n-2,f)),t=f-i,a=hw(i),b=hw(i+1),e=t*t*(3-2*t);return a+(b-a)*e};
 const col=getComputedStyle(document.documentElement).getPropertyValue("--c").trim()||"#22e3f5";
 const P=[...Array(70)].map(()=>({x:Math.random()*W,o:Math.random()*2-1,s:.4+Math.random()*1.1,r:.6+Math.random()*1.6}));
 const draw=()=>{ctx.clearRect(0,0,W,H);const cy=H/2;ctx.beginPath();for(let x=0;x<=W;x+=4)ctx.lineTo(x,cy-half(x));for(let x=W;x>=0;x-=4)ctx.lineTo(x,cy+half(x));ctx.closePath();
  const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,col+"66");g.addColorStop(1,col+"14");ctx.fillStyle=g;ctx.shadowColor=col;ctx.shadowBlur=18;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=col+"aa";ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle=col;P.forEach(p=>{const y=cy+p.o*half(p.x)*.9;ctx.globalAlpha=.35+.5*(1-Math.abs(p.o));ctx.beginPath();ctx.arc(p.x,y,p.r,0,7);ctx.fill()});ctx.globalAlpha=1};
 draw();if(RM())return;let on=true,vis=true,last=0,raf;const io=new IntersectionObserver(e=>{vis=e[0].isIntersecting});io.observe(cv);
 const loop=t=>{if(!on)return;raf=requestAnimationFrame(loop);if(document.hidden||!vis||t-last<33)return;last=t;P.forEach(p=>{p.x+=p.s;if(p.x>W){p.x=0;p.o=Math.random()*2-1}});draw()};raf=requestAnimationFrame(loop);
 const rs=()=>{size();draw()};addEventListener("resize",rs);_fx={stop(){on=false;cancelAnimationFrame(raf);io.disconnect();removeEventListener("resize",rs)}}}
/* 6) 홈에 히어로 + 빠른 이동(별자리·타임라인·보드) */
const _home13=V.home;V.home=function(){let h=_home13.apply(this,arguments);if(window._ed)return h;
 const nav=`<div class="pills nav13"><button class="pill" data-go="const">✺ 별자리</button><button class="pill" data-go="tl">▤ 35일 타임라인</button><button class="pill" data-go="board">▦ 기회 보드</button><button class="pill" data-go="cats">카테고리</button></div>`;
 return funnelHTML()+nav+h};
let _cuDone=false;const _rend13=render;render=function(){_rend13();if(!D)return;const k=cur().split(":")[0];document.documentElement.dataset.route=k;
 if(k==="home"&&!$("q").value.trim()){funnelAnim();if(!_cuDone){_cuDone=true;countUp($("v"))}}else if(_fx){_fx.stop();_fx=null}};
/* 7) 부드러운 테마 전환 */
(function(){const de=document.documentElement;new MutationObserver(r=>{if(RM()||!r.some(x=>x.oldValue!==de.dataset.theme))return;de.classList.add("thx");clearTimeout(de._tx);de._tx=setTimeout(()=>de.classList.remove("thx"),450)}).observe(de,{attributes:true,attributeFilter:["data-theme"],attributeOldValue:true})})();
