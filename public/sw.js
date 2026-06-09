/**
 * YFIT AI - Service Worker
 * Strategy: Network-first for everything.
 * This ensures new Vercel deployments are always picked up immediately.
 * Assets are still cached as a fallback for offline use.
 */

const CACHE_NAME = 'yfit-cache-v9'; // Jun 9 2026 - switched to network-first strategy

self.addEventListener('install', () => {
  console.log('[SW] Installing...');
  self.skipWaiting(); // Activate immediately without waiting
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating, clearing old caches...');
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and non-http(s) requests
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Skip API calls entirely — always go to network
  if (url.pathname.includes('/api/')) {
    return;
  }

  // Network-first for everything: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache a copy of the successful response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache if available
        return caches.match(event.request);
      })
  );
});

// Allow manual cache clearing from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))));
  }
});
