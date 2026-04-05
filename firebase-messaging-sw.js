// CaddyPro - Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDFWQLDjXqYaJ7QbtZlcsmNR3TywV6HGlU",
  authDomain: "caddypro-c3a44.firebaseapp.com",
  projectId: "caddypro-c3a44",
  storageBucket: "caddypro-c3a44.appspot.com",
  messagingSenderId: "956784211640",
  appId: "1:956784211640:web:c1427c3a1ad273d4d9e64d",
  databaseURL: "https://caddypro-c3a44-default-rtdb.firebaseio.com"
});

const messaging = firebase.messaging();

// バックグラウンド通知受信
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] バックグラウンド通知受信:', payload);
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || '📨 CaddyPro', {
    body: body || '新しいお知らせがあります',
    icon: icon || 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/26f3.png',
    badge: 'https://cdn.jsdelivr.net/npm/twemoji@14.0.2/assets/72x72/26f3.png',
    vibrate: [200, 100, 200],
    tag: 'caddypro-notice',
    requireInteraction: true
  });
});

// 通知クリックでアプリを開く
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('caddypro') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow('https://winwincaddy.github.io/caddypro/');
    })
  );
});
