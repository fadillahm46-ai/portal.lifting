// sw.js - Service Worker Resmi Portal Lifting PPA
const CACHE_NAME = 'portal-lifting-v6'; // Sinkronkan ke v6 agar cache v5 dibersihkan

// Hanya cache aset statis inti pembungkus shell
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Install Event: Mengunduh cache baru dan langsung aktif tanpa menunggu tab ditutup
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Bersihkan tuntas semua cache versi lama (Anti-Zombie)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Menghapus cache usang:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Strategi Network-First untuk mencegah data usang (Zombie Data)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // BYPASS: Jangan simpan request Supabase API, realtime websocket, atau version.json ke dalam cache
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('version.json') ||
    event.request.method !== 'GET'
  ) {
    return; // Langsung lewatkan ke internet asli
  }

  // Network-First: Selalu coba ambil yang paling baru dari server Vercel dulu
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback saat sinyal blind spot / offline di lapangan
        return caches.match(event.request);
      })
  );
});

// 4. Push / Notification Trigger Event (Web Push Notification OS Android)
self.addEventListener('push', (event) => {
  let data = { 
    title: 'Ada Orderan Masuk!', 
    body: 'Order baru memerlukan penugasan atau validasi lapangan.',
    url: './#monitoring'
  };
  
  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Silakan cek portal untuk memproses order.',
    icon: 'https://raw.githubusercontent.com/fadillahmursyid-dev/portal-lifting/main/icon-192.png',
    badge: 'https://raw.githubusercontent.com/fadillahmursyid-dev/portal-lifting/main/icon-192.png',
    tag: 'portal-lifting-alert',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || './#monitoring'
    },
    actions: [
      { action: 'open_order', title: 'Lihat Order' },
      { action: 'close_alert', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 5. Notification Click Event: Mengarahkan langsung ke halaman order saat notifikasi ditekan
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close_alert') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : './#monitoring';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
