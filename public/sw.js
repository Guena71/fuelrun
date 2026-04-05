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
