const C="bot-dash-v11-glance",SHELL=["./","index.html","config.js","manifest.webmanifest","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)));self.skipWaiting()});
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET"||u.origin!==location.origin||u.pathname.includes("/api/"))return;
 if(u.pathname.endsWith("data.json")||u.pathname.endsWith("payload.enc.json")){e.respondWith(fetch(e.request).catch(()=>caches.match(e.request)));return}
 e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
self.addEventListener("push",e=>{let d={};try{d=e.data.json()}catch(_){d={title:"봇 대시보드",body:e.data?e.data.text():""}}
 e.waitUntil(self.registration.showNotification(d.title||"봇 대시보드",{body:d.body||"",icon:"icons/icon-192.png",data:{url:d.url||"./"}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.openWindow(e.notification.data.url))});
