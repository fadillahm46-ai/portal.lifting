// Service Worker Dasar untuk Syarat Instalasi PWA
const CACHE_NAME = 'lifting-ppa-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Biarkan aplikasi mengambil data dari internet (bypass cache)
    // agar data realtime Supabase tidak terganggu
    return;
});
