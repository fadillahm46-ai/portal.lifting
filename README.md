# Sistem Order Lifting Alat Berat
Aplikasi PWA berbasis cloud untuk manajemen *support equipment* (Crane Truck, Big Crane, Lowboy).

## Fitur Utama:
- 📱 **Mobile-First / PWA**: Dapat diinstal sebagai aplikasi native di Android/iOS.
- ☁️ **Cloud Database**: Terintegrasi langsung dengan Supabase PostgreSQL.
- 📁 **Cloud Storage**: Mendukung kompresi gambar dan upload langsung ke Google Drive API.
- 📡 **Offline-First Sync**: Pekerjaan lapangan tetap bisa dilakukan walau sinyal hilang. Data tersimpan di localStorage dan melakukan sinkronisasi saat internet tersedia.
- 📊 **Smart Workflow**: Penugasan shift berlanjut otomatis dengan status pending/validasi ulang.

## Stack Teknologi:
- Frontend: HTML5, JavaScript (ES6+), Tailwind CSS
- Backend/DB: Supabase (REST API)
- Storage: Google Apps Script + Google Drive
- Hosting: Vercel (Static Web)