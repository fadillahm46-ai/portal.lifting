// ============================================================
// SERVICE WORKER - PORTAL LIFTING PPA
// ============================================================

const CACHE_NAME = 'portal-lifting-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

const DEFAULT_ICON = 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U';
const DEFAULT_BADGE = 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U';

// 1. Install Event: Cache aset statis dasar
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Gagal caching sebagian aset instalasi:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Bersihkan cache versi usang
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
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Network-First dengan fallback cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// 4. Push Event: Notifikasi saat aplikasi diminimalkan / layar HP terkunci via server push
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Order Lifting PPA',
    body: 'Ada pembaruan status pekerjaan.',
    url: '/'
  };

  if (event.data) {
    try {
      payload = event.data.json();
    } catch (e) {
      payload.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: payload.body || 'Pembaruan pekerjaan baru diterima.',
    icon: payload.icon || DEFAULT_ICON,
    badge: payload.badge || DEFAULT_BADGE,
    vibrate: [300, 150, 300, 150, 400],
    tag: payload.tag || 'lifting-job-alert-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Portal Lifting PPA', notificationOptions)
  );
});

// 5. Message Event: Menerima pemicu notifikasi langsung dari index.html (Supabase Realtime)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const payload = event.data.payload || {};
    const title = payload.title || 'Portal Lifting PPA';

    const notificationOptions = {
      body: payload.body || 'Ada pembaruan data tugas.',
      icon: payload.icon || DEFAULT_ICON,
      badge: payload.badge || DEFAULT_BADGE,
      vibrate: [300, 150, 300, 150, 400],
      tag: payload.tag || 'lifting-realtime-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  }
});

// 6. Notification Click Event: Buka tab web atau fokuskan layar HP ke aplikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
