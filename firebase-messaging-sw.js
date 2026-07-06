// CaddyPro - 自己消去用 Service Worker
// 旧バージョンが残したService Worker／キャッシュを自動的に解除し、
// 古い画面がPCに残り続ける問題を、次回アクセス時に自動修復する。
self.addEventListener('install', function(){
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil((async function(){
    // 全キャッシュを削除
    try{
      var keys = await caches.keys();
      await Promise.all(keys.map(function(k){ return caches.delete(k); }));
    }catch(e){}
    // このService Worker自身を登録解除
    try{ await self.registration.unregister(); }catch(e){}
    // 開いている全ウィンドウを再読み込みして新版に切り替える
    try{
      var clientList = await self.clients.matchAll({ type: 'window' });
      clientList.forEach(function(c){ try{ c.navigate(c.url); }catch(e){} });
    }catch(e){}
  })());
});
