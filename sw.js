// Service Worker Portal Lifting PPA
// Mengelola instalasi PWA, bypass cache data realtime, dan penanganan notifikasi sistem

const CACHE_NAME = 'portal-lifting-cache-v4';

// 1. Event Install: Mempercepat aktivasi service worker baru
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// 2. Event Activate: Membersihkan cache versi lama dan segera mengambil alih kontrol halaman
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

// 3. Event Fetch: Mengambil data langsung dari internet (bypass cache untuk data realtime)
self.addEventListener('fetch', (event) => {
    return;
});

// 4. Aksi Ketika Notifikasi Banner / Baris di HP Diklik Pengguna
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    // Bersihkan titik badge notifikasi ikon aplikasi
    if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(() => {});
    }

    const targetUrl = (event.notification.data && event.notification.data.url) 
        ? event.notification.data.url 
        : './';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Jika aplikasi sudah terbuka di HP, fokuskan kembali halamannya
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Jika aplikasi tertutup, buka jendela baru
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// 5. Listener Pesan dari index.html (Pemicu Notifikasi Tunggal & App Icon Badge)
self.addEventListener('message', (event) => {
    const data = event.data;
    if (!data) return;

    // Handler: Update Angka Badge pada Ikon Aplikasi di Layar Utama HP
    if (data.action === 'SET_BADGE' || data.type === 'SET_BADGE') {
        const count = data.count || 0;
        if ('setAppBadge' in navigator) {
            if (count > 0) {
                navigator.setAppBadge(count).catch(() => {});
            } else {
                navigator.clearAppBadge().catch(() => {});
            }
        }
    } else if (data.action === 'CLEAR_BADGE' || data.type === 'CLEAR_BADGE') {
        if ('clearAppBadge' in navigator) {
            navigator.clearAppBadge().catch(() => {});
        }
    }

    // Handler: Tampilkan Notifikasi Banner di HP (Pasti 1 baris & menimpa notifikasi lama)
    if (data.action === 'SHOW_NOTIFICATION' || data.type === 'SHOW_NOTIFICATION') {
        const title = data.title || (data.payload && data.payload.title) || 'Ada Orderan Masuk!';
        const body = data.body || (data.payload && data.payload.body) || 'Order baru siap divalidasi.';

        // KUNCI UTAMA: Tag statis seragam agar Android langsung me-replace notifikasi lama (TIDAK BERTUMPUK)
        const notificationTag = data.tag || 'portal-lifting-single-order-notif';

        const options = {
            body: body,
            icon: data.icon || 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U',
            badge: data.badge || 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U',
            vibrate: [200, 100, 200],
            tag: notificationTag,
            renotify: true, // Memicu getar/bunyi lagi saat ada order baru tanpa menambah baris baru
            data: data.payload || { url: './' }
        };

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

// 6. Event Push saat aplikasi tertutup / HP dalam keadaan standby
self.addEventListener('push', (event) => {
    let payload = { title: 'Ada Orderan Masuk!', body: 'Order baru siap divalidasi.' };
    if (event.data) {
        try {
            payload = event.data.json();
        } catch (e) {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body || 'Order baru siap divalidasi.',
        icon: 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U',
        badge: 'https://lh3.googleusercontent.com/d/1hQZopiZU-_bQC9aRmyZndlmEF--k4h5U',
        vibrate: [200, 100, 200],
        tag: 'portal-lifting-single-order-notif',
        renotify: true,
        data: payload
    };

    if ('setAppBadge' in navigator) {
        navigator.setAppBadge().catch(() => {});
    }

    event.waitUntil(
        self.registration.showNotification(payload.title || 'Ada Orderan Masuk!', options)
    );
});
