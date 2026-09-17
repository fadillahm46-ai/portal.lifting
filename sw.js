// Service Worker Portal Lifting PPA
// Mengelola instalasi PWA, bypass cache data realtime, dan penanganan notifikasi sistem

const CACHE_NAME = 'lifting-ppa-v1';

// Event Install: Mempercepat aktivasi service worker baru
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Event Activate: Mengambil kendali atas semua tab/klien yang aktif
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Event Fetch: Mengambil data langsung dari internet (bypass cache)
// Memastikan data realtime Supabase dan REST API selalu mutakhir tanpa terhalang cache lokal
self.addEventListener('fetch', (event) => {
    return;
});

// Event saat notifikasi di status bar atau lockscreen HP diklik oleh pengguna
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Bersihkan atau kurangi badge ikon aplikasi jika didukung
    if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(() => {});
    }

    // Fokuskan tab aplikasi yang sudah terbuka atau buka tab baru jika tertutup
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Jika ada jendela portal yang sudah aktif di browser HP, buka dan fokuskan
            for (const client of clientList) {
                if ('focus' in client) {
                    return client.focus();
                }
            }
            // Jika aplikasi belum terbuka sama sekali, buka jendela baru
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Event penanganan pesan dari index.html (untuk show notification dan update app icon badge di layar depan HP)
self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SHOW_NOTIFICATION') {
        const payload = event.data.payload || {};
        const title = payload.title || 'Portal Lifting PPA';
        const options = {
            body: payload.body || 'Ada pembaruan status pekerjaan.',
            icon: 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U',
            badge: 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U',
            vibrate: [200, 100, 200],
            tag: 'lifting-job-alert-' + Date.now(),
            renotify: true,
            data: payload
        };
        self.registration.showNotification(title, options);
    }

    // Set badge angka pada ikon aplikasi di layar depan HP
    if (event.data.type === 'SET_BADGE') {
        const count = event.data.count || 0;
        if ('setAppBadge' in navigator) {
            if (count > 0) {
                navigator.setAppBadge(count).catch(() => {});
            } else {
                navigator.clearAppBadge().catch(() => {});
            }
        }
    }
});

// Event penanganan sinyal push saat aplikasi ditutup atau layar HP terkunci
self.addEventListener('push', (event) => {
    let payload = { title: 'Order Lifting PPA', body: 'Ada pembaruan status pekerjaan.' };

    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    const notificationOptions = {
        body: payload.body,
        icon: 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U',
        badge: 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U',
        vibrate: [200, 100, 200],
        tag: 'lifting-job-alert',
        renotify: true,
        data: payload
    };

    // Tampilkan notifikasi dan aktifkan titik badge ikon aplikasi
    if ('setAppBadge' in navigator) {
        navigator.setAppBadge().catch(() => {});
    }

    event.waitUntil(
        self.registration.showNotification(payload.title, notificationOptions)
    );
});
