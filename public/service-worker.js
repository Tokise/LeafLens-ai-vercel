const CACHE_NAME = 'leaflens-ai-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/assets/images/logo.PNG',
  '/vite.svg',
  // Add more static assets as needed
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        // Optionally cache new requests
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, fetchRes.clone());
          return fetchRes;
        });
      }).catch(() => {
        // Offline fallback (optional)
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
