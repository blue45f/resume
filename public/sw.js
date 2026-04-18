// 이력서공방 Service Worker v2
// Strategies:
// - App shell: precache
// - Navigation: network-first with offline fallback
// - Static assets (.js/.css/.woff2/images): stale-while-revalidate
// - Fonts (Google): cache-first with 30d expiry
// - API GETs: network-only (never cached — data freshness)

const CACHE_VERSION = 'v2';
const CACHE_SHELL = `resume-shell-${CACHE_VERSION}`;
const CACHE_ASSETS = `resume-assets-${CACHE_VERSION}`;
const CACHE_FONTS = `resume-fonts-${CACHE_VERSION}`;

const APP_SHELL = ['/', '/index.html', '/manifest.json', '/favicon.svg'];

// Install: precache shell, activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_SHELL).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

// Activate: clean up old caches, claim clients
self.addEventListener('activate', (event) => {
  const valid = new Set([CACHE_SHELL, CACHE_ASSETS, CACHE_FONTS]);
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !valid.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // Never cache API calls — always network (data freshness)
  if (url.pathname.startsWith('/api/')) return;

  // Navigation → network-first (fresh HTML) + offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_SHELL).then((cache) => cache.put('/index.html', clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  // Google Fonts → cache-first (fonts are immutable)
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_FONTS).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }),
    );
    return;
  }

  // Static assets → stale-while-revalidate
  if (/\.(js|css|png|jpg|jpeg|svg|webp|avif|woff2?|ttf|eot|ico)(\?.*)?$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_ASSETS).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      }),
    );
    return;
  }
});

// Message handler: allow clients to request immediate update
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
