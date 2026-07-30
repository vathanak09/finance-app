const CACHE_NAME = 'finance-app-v5';
const STATIC_ASSETS = [
  './manifest.json?v=5.0',
  './icons/icon-192x192.png?v=5.0',
  './icons/icon-512x512.png?v=5.0',
  './icons/apple-touch-icon.png?v=5.0',
  './favicon.png?v=5.0'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging old SW cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = event.request.url;
  
  // NEVER cache HTML or API calls -> Always network fresh!
  if (event.request.mode === 'navigate' || (event.request.headers && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
    return;
  }
  
  if (url.includes('firestore.googleapis.com') || url.includes('google.com')) {
    return;
  }

  // Assets cache first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request);
    })
  );
});
