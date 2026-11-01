/* v14.2 — device store survives passcode change; never overwrite an undecryptable store */
const LKEY="jv_sec_locked";let SEC_LOCKED=false;
async function pwKey(pw,salt){const b=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},b,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function secDec(raw,pw){const r=JSON.parse(raw),salt=u8(r.s),k=await pwKey(pw,salt);return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:u8(r.i)},k,u8(r.c))))}
const lockedList=()=>{try{const a=JSON.parse(localStorage.getItem(LKEY)||"[]");return Array.isArray(a)?a:[]}catch(e){return[]}};
function lockedPush(raw){const a=lockedList();if(!a.includes(raw)){a.push(raw);localStorage.setItem(LKEY,JSON.stringify(a.slice(-5)))}}
loadSec=function(){if(SECS)return Promise.resolve();if(_secP)return _secP;_secP=(async()=>{const pw=sessionStorage.getItem("jv_pw")||localStorage.getItem("jv_pw");const raw=localStorage.getItem("jv_sec");
 if(!pw){_secP=null;return}window._secPw=pw;
 let ok=false;if(raw){try{SECS=await secDec(raw,pw);const r=JSON.parse(raw),salt=u8(r.s);SECK={salt,k:await pwKey(pw,salt)};ok=true}catch(e){/* undecryptable: back it up first, never overwrite silently */lockedPush(raw);localStorage.removeItem("jv_sec");SEC_LOCKED=true}}
 if(!ok){const salt=crypto.getRandomValues(new Uint8Array(16));SECK={salt,k:await pwKey(pw,salt)};SECS={}}
 _secP=null;if(lockedList().length&&!ok)secPrompt();render()})();return _secP};
const _saveSec142=saveSec;saveSec=function(){if(SEC_LOCKED)return;return _saveSec142()};
function secPrompt(){if(document.getElementById("secrec"))return;const n=lockedList().length;if(!n)return;const d=document.createElement("div");d.id="secrec";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-label","이전 기기 데이터 복구");
 d.innerHTML=`<div class="secbox glass2"><b>🔐 이전 기기 데이터가 잠겨 있어요</b><p>접근 코드가 바뀌어 이 기기에 저장된 보드·관심사·프로필·체크리스트 등을 새 코드로 열 수 없어요. <b>이전 접근 코드</b>를 입력하면 복구한 뒤 새 코드로 다시 암호화해요.</p><input id="secold" type="password" autocomplete="off" placeholder="이전 접근 코드" aria-label="이전 접근 코드"><div class="er" id="secer"></div><div class="secbt"><button class="btnp" id="secgo" type="button">복구</button><button class="btn" id="secskip" type="button">건너뛰기</button></div><p class="mut" id="secwarn">건너뛰면 빈 저장소로 새로 시작해요. 잠긴 데이터는 지우지 않고 백업(${n}개)으로 보관되며, 명령 팔레트의 '이전 기기 데이터 복구'로 나중에 다시 시도할 수 있어요.</p></div>`;
 document.body.appendChild(d);
 d.querySelector("#secgo").addEventListener("click",secRecover);d.querySelector("#secold").addEventListener("keydown",e=>{if(e.key==="Enter")secRecover()});
 d.querySelector("#secskip").addEventListener("click",()=>{const b=d.querySelector("#secskip");if(!b.dataset.c){b.dataset.c=1;b.textContent="정말 건너뛰기 (백업 보관)";d.querySelector("#secwarn").classList.add("warn");return}SEC_LOCKED=false;d.remove();T("새 저장소로 시작 · 이전 데이터는 백업 보관");saveSec();render()})}
async function secRecover(){const pw=(document.getElementById("secold")||{}).value||"",er=document.getElementById("secer");if(!pw)return;er.textContent="복구 중…";const L=lockedList();let got=null,idx=-1;
 for(let i=L.length-1;i>=0;i--){try{got=await secDec(L[i],pw);idx=i;break}catch(e){}}
 if(!got){er.textContent="이전 접근 코드가 맞지 않아요";return}
 SECS=Object.assign({},SECS||{},got);/* old data wins; new-session-only keys kept */
 L.splice(idx,1);L.length?localStorage.setItem(LKEY,JSON.stringify(L)):localStorage.removeItem(LKEY);
 SEC_LOCKED=false;const d=document.getElementById("secrec");if(d)d.remove();
 const cur=sessionStorage.getItem("jv_pw")||localStorage.getItem("jv_pw"),salt=crypto.getRandomValues(new Uint8Array(16));SECK={salt,k:await pwKey(cur,salt)};_saveSec142();T("복구 완료 · 새 접근 코드로 다시 암호화했어요");render()}
ACT.secrec=()=>{lockedList().length?secPrompt():T("잠긴 이전 데이터가 없어요")};
try{const _pal142=palItems;palItems=function(){const it=_pal142();if(lockedList().length)it.unshift({l:"이전 기기 데이터 복구",s:"secrec",act:"secrec"});return it}}catch(e){}
/* stale remembered passcode → clear it and show the unlock screen (no blank screen) */
const _unlock142=unlock;unlock=async function(pw,rem){const r=await _unlock142(pw,rem);if(r===false&&/올바르지/.test((document.getElementById("er")||{}).textContent||"")){if(localStorage.getItem("jv_pw")===pw)localStorage.removeItem("jv_pw");if(sessionStorage.getItem("jv_pw")===pw)sessionStorage.removeItem("jv_pw");const L=document.getElementById("lock");if(L)L.style.display="flex";if(document.getElementById("er")&&!pw)document.getElementById("er").textContent=""}else if(window._secPw!==pw){if(SECS&&!_secP&&!SEC_LOCKED&&window._secPw){/* store was opened with an older remembered code: re-key to the current one */const salt=crypto.getRandomValues(new Uint8Array(16));SECK={salt,k:await pwKey(pw,salt)};window._secPw=pw;_saveSec142()}else{if(_secP)await _secP;if(window._secPw!==pw){SECS=null;SECK=null;SEC_LOCKED=false;loadSec()}}}return r};
