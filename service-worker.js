const CACHE_NAME = "muwajjah-tracker-v9";
const urlsToCache = [
  "./",
  "./index.html",
  "./analisis.html",
  "./kelola_pembimbing.html",
  "./kelola_santri.html",
  "./manifest.json",
  "./piket.html",
  "./manifest-piket.json",
  "./laporan-piket.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js",
  "https://code.jquery.com/jquery-3.6.0.min.js",
  "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/css/select2.min.css",
  "https://cdn.jsdelivr.net/npm/select2@4.1.0-rc.0/dist/js/select2.min.js"
];

// Instalasi service worker: segera aktifkan tanpa menunggu tab ditutup
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Aktivasi service worker: hapus cache versi lama & ambil alih kontrol halaman langsung
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("🧹 Menghapus cache PWA lama:", cache);
              return caches.delete(cache);
            }
          })
        );
      })
    ])
  );
});

// Strategi Pengambilan (Fetch):
// - Halaman HTML (Dokumen): Network-First (Cari ke server dulu agar selalu dapat versi terbaru, jika offline baru ambil cache)
// - Aset Statis (CSS/JS/Gambar): Cache-First
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Aset statis lainnya
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});
