const CACHE_NAME = 'my-app-cache-v1';
const ASSETS = [
  '/', 
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/static/js/bundle.js',
];

// ✅ Install: Cache app shell (HTML, JS, CSS)
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(ASSETS);
    })
  );
});

// ✅ Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Only handle http/https requests
  if (requestUrl.protocol.startsWith('http')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(event.request)
            .then((response) => {
              // Clone response before caching
              const resClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                try {
                  cache.put(event.request, resClone);
                } catch (err) {
                  // Some requests can't be cached, just ignore
                  console.warn('[SW] Cannot cache request:', event.request.url);
                }
              });
              return response;
            })
            .catch(() => cachedResponse)
        );
      })
    );
  }
});

