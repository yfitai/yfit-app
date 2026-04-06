/**
 * YFIT AI - Service Worker for Cache Management
 * This service worker ensures users always get the latest version
 */

// Static cache name - old caches are cleared on activate
const CACHE_NAME = 'yfit-cache-v5'; // bumped Apr 6 2026 - force clear for new marketing landing page integration

// PWA icon filenames that must NEVER be cached (always fetch fresh so
// the home-screen icon updates when the user re-installs the PWA)
const NEVER_CACHE = [
  '/icon-76x76.png',
  '/icon-120x120.png',
  '/icon-152x152.png',
  '/icon-180x180.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
];

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker...');
  self.skipWaiting();
});

// Activate event - clear old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all old caches
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Old caches cleared');
      return self.clients.claim();
    })
  );
});

// Fetch event - network first strategy for HTML, cache for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Never cache PWA icons or manifest — always fetch fresh from network
  if (NEVER_CACHE.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-first (no caching) for HTML navigation and API calls
  if (
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.includes('/api/') ||
    url.pathname === '/version.json'
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
  } 
  // Cache-first for assets (JS, CSS, images)
  else if (
    url.pathname.includes('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(event.request).then((response) => {
          // Cache the fetched asset
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
    );
  }
  // Default: network only for everything else
  else {
    event.respondWith(fetch(event.request));
  }
});

// Message event - allow manual cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
