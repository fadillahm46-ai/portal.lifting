// Nama cache service worker
const CACHE_NAME = 'portal-lifting-cache-v2';

// 1. Event Install
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Event Activate & Clean Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Listener Pesan dari index.html (Khusus Notifikasi & App Badge HP)
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  // Handler: Set atau Clear App Icon Badge di layar depan HP
  if (data.action === 'SET_BADGE') {
    if (navigator.setAppBadge) {
      if (data.count > 0) {
        navigator.setAppBadge(data.count).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
  } else if (data.action === 'CLEAR_BADGE') {
    if (navigator.clearAppBadge) {
      navigator.clearAppBadge().catch(() => {});
    }
  }

  // Handler: Tampilkan Notifikasi Banner di HP
  if (data.action === 'SHOW_NOTIFICATION') {
    const title = data.title || 'Portal Lifting';
    const options = {
      body: data.body || 'Ada pembaruan pekerjaan baru.',
      icon: data.icon || 'icon-192.png',
      badge: data.badge || 'icon-192.png',
      vibrate: [200, 100, 200],
      tag: data.tag || 'order-notif',
      renotify: true,
      data: data.payload || { url: '/' }
    };
    self.registration.showNotification(title, options);
  }
});

// 4. Aksi Ketika Notifikasi di HP Diklik Pengguna
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) 
    ? event.notification.data.url 
    : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Jika tab/aplikasi sudah terbuka, fokuskan kembali
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika belum terbuka, buka window baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
