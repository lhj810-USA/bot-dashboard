/* JARVIS service worker v21 — 새 버전 즉시 활성화, 옛 캐시 삭제, 셸은 항상 네트워크 재검증(no-cache) 후 오프라인 대비 캐시 */
const VER="v21",C="bot-dash-v21",SHELL=["./","index.html","config.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png","css/v12.css","js/v12a.js","js/v12b.js","js/v12c.js","css/v13.css","js/v13a.js","js/v13b.js","js/v13c.js","css/v14.css","js/v14a.js","js/v14b.js","js/v14c.js","js/v15.js","js/v16.js","js/v17.js","css/v17.css","css/v18.css","js/v18.js","fonts/PretendardVariable.woff2","fonts/InterVariable.woff2","fonts/SpaceGroteskVariable.woff2","css/v19.css","js/v19.js","lib/leaflet/leaflet.css","lib/leaflet/leaflet.js","css/v20.css","js/v20.js","css/v21.css","js/v21.js"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:"reload"})).catch(()=>{})))))});
self.addEventListener("activate",e=>e.waitUntil((async()=>{for(const k of await caches.keys())if(k!==C)await caches.delete(k);await self.clients.claim();
 for(const cl of await self.clients.matchAll({type:"window"}))cl.postMessage({type:"sw-activated",ver:VER})})()));
self.addEventListener("message",e=>{if(e.data==="skip")self.skipWaiting();if(e.data==="ver"&&e.source)e.source.postMessage({type:"sw-ver",ver:VER})});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin||u.pathname.includes("/api/"))return;
 if(u.pathname.endsWith("data.json")||u.pathname.endsWith("payload.enc.json")||u.pathname.endsWith("photos.enc.json")){e.respondWith(fetch(e.request,{cache:"no-store"}).catch(()=>caches.match(e.request)));return}
 e.respondWith(fetch(e.request,{cache:"no-cache"}).then(r=>{if(r&&r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
self.addEventListener("push",e=>{let d={};try{d=e.data.json()}catch(_){d={title:"봇 대시보드",body:e.data?e.data.text():""}}
 e.waitUntil(self.registration.showNotification(d.title||"봇 대시보드",{body:d.body||"",icon:"icons/icon-192.png",data:{url:d.url||"./"}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data.url))});
