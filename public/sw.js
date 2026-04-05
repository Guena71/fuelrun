var CACHE="fuelrun-v4";
var SHELL=["/","index.html","/manifest.json","/icon-192.svg","/icon-512.svg"];

self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL);}));
  self.skipWaiting();
});

self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});

self.addEventListener("push",function(e){
  var data={title:"FuelRun",body:"Consulte ton plan du jour !",url:"/"};
  try{data=Object.assign(data,JSON.parse(e.data.text()));}catch(err){}
  e.waitUntil(self.registration.showNotification(data.title,{
    body:data.body,
    icon:"/icon-192.svg",
    badge:"/icon-192.svg",
    data:{url:data.url},
    vibrate:[200,100,200],
  }));
});

self.addEventListener("notificationclick",function(e){
  e.notification.close();
  var url=(e.notification.data&&e.notification.data.url)||"/";
  e.waitUntil(clients.matchAll({type:"window"}).then(function(list){
    for(var c of list){if(c.url.includes(self.location.origin)&&"focus" in c)return c.focus();}
    if(clients.openWindow)return clients.openWindow(url);
  }));
});

self.addEventListener("fetch",function(e){
  if(e.request.method!=="GET")return;
  var url=new URL(e.request.url);
  if(url.pathname.startsWith("/api/"))return;
  // Network-first: always try network, fall back to cache offline
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res.ok){
        var clone=res.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,clone);});
      }
      return res;
    }).catch(function(){
      return caches.match(e.request);
    })
  );
});
