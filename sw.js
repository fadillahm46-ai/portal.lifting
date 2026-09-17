// sw.js - Service Worker untuk Portal Lifting PPA
const CACHE_NAME = 'portal-lifting-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Push / Notification Trigger Event
self.addEventListener('push', (event) => {
  let data = { title: 'Ada Orderan Masuk!', body: 'Order baru memerlukan penugasan atau validasi.' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Silakan cek portal untuk memproses order.',
    icon: 'https://raw.githubusercontent.com/fadillahmursyid-dev/portal-lifting/main/icon-192.png',
    badge: 'https://raw.githubusercontent.com/fadillahmursyid-dev/portal-lifting/main/icon-192.png',
    tag: 'portal-lifting-alert', // Menggantikan notifikasi lama agar tidak menumpuk
    renotify: true,
    requireInteraction: true // Memastikan notifikasi tetap menetap di bilah status HP / layar sampai di-swipe/klik user
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ada Orderan Masuk!', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./#monitoring');
      }
    })
  );
});
