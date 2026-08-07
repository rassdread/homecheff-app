// Service Worker voor supersnelle caching
// v3: Next `_next/static` niet meer cache-first (voorkomt oude Capacitor/JS-bundels).
const CACHE_NAME = 'homecheff-v3';
const STATIC_CACHE = 'homecheff-static-v3';
const DYNAMIC_CACHE = 'homecheff-dynamic-v3';

// Statische assets die altijd gecached moeten worden
const STATIC_ASSETS = [
  '/',
  '/login',
  '/register',
  '/messages',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico',
  '/manifest.json'
];

// API routes die gecached moeten worden
const CACHEABLE_API_ROUTES = [
  '/api/users',
  '/api/products',
  '/api/conversations'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Video-proxy: nooit door SW – direct netwerk (Edge en andere browsers falen anders met video)
  if (url.pathname.includes('video-proxy')) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Favicons / manifest: nooit door SW (cache-first op *.png breekt Safari-tabicon).
  const pathname = url.pathname;
  if (
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon-') ||
    pathname === '/icon.png' ||
    pathname === '/apple-icon.png' ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/manifest.json'
  ) {
    return;
  }

  // Handle API routes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => {
          return cache.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                // Serve from cache, but also update in background
                fetch(request)
                  .then((response) => {
                    if (response.ok) {
                      cache.put(request, response.clone());
                    }
                  })
                  .catch(() => {
                    // Network error, keep cached version
                  });
                return cachedResponse;
              }

              // Not in cache, fetch from network
              return fetch(request)
                .then((response) => {
                  if (response.ok && CACHEABLE_API_ROUTES.some(route => url.pathname.startsWith(route))) {
                    cache.put(request, response.clone());
                  }
                  return response;
                });
            });
        })
    );
    return;
  }

  // Next.js hashed chunks: nooit via SW (anders oude login/native Google code in WebView).
  if (url.pathname.includes('/_next/static/')) {
    return;
  }

  // Handle static assets
  if (url.pathname.startsWith('/static/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.webp')) {
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            });
        })
    );
    return;
  }

  // Handle page navigation - Network First strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.ok) {
          caches.open(DYNAMIC_CACHE)
            .then((cache) => {
              cache.put(request, responseClone);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If no cache, return offline page
            if (request.mode === 'navigate') {
              return caches.match('/offline');
            }
          });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Process any queued actions
      processQueuedActions()
    );
  }
});

/**
 * Resolve deep-link path from push payload.
 * Prefer route / actionUrl / link; never default to homepage.
 */
function resolvePushDeepLink(data) {
  if (!data || typeof data !== 'object') return null;
  const candidates = [data.route, data.actionUrl, data.link, data.path];
  for (const raw of candidates) {
    if (typeof raw !== 'string' || !raw.trim()) continue;
    try {
      if (raw.startsWith('/')) {
        const pathOnly = raw.split('?')[0].split('#')[0];
        if (
          pathOnly.startsWith('/messages') ||
          pathOnly.startsWith('/orders') ||
          pathOnly.startsWith('/profile') ||
          pathOnly.startsWith('/products') ||
          pathOnly.startsWith('/product') ||
          pathOnly.startsWith('/listings') ||
          pathOnly.startsWith('/delivery') ||
          pathOnly.startsWith('/deal-review') ||
          pathOnly.startsWith('/delivery-review') ||
          pathOnly.startsWith('/verkoper') ||
          pathOnly.startsWith('/bezorger') ||
          pathOnly.startsWith('/user') ||
          pathOnly.startsWith('/notifications') ||
          pathOnly.startsWith('/settings')
        ) {
          return raw.startsWith('/') ? raw : pathOnly;
        }
      }
      const u = new URL(raw, self.location.origin);
      if (u.origin === self.location.origin && u.pathname.startsWith('/')) {
        return `${u.pathname}${u.search}`;
      }
    } catch {
      /* ignore */
    }
  }
  const cid = data.conversationId;
  if (typeof cid === 'string' && /^[a-zA-Z0-9_-]{6,}$/.test(cid)) {
    return `/messages/${cid}/`;
  }
  const oid = data.orderId;
  if (typeof oid === 'string' && /^[a-zA-Z0-9_-]{6,}$/.test(oid)) {
    return `/orders/${oid}`;
  }
  return null;
}

// Push notifications (FCM web / Web Push payload)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    try {
      payload = { body: event.data.text(), title: 'HomeCheff' };
    } catch {
      return;
    }
  }

  // FCM web often nests under notification + data
  const nested = payload.data && typeof payload.data === 'object' ? payload.data : {};
  const title =
    (payload.notification && payload.notification.title) ||
    payload.title ||
    'HomeCheff';
  const body =
    (payload.notification && payload.notification.body) ||
    payload.body ||
    '';
  const route = resolvePushDeepLink({ ...nested, ...payload });

  const options = {
    body,
    icon: '/icon-192.png',
    badge: '/favicon-48.png',
    vibrate: [100, 50, 100],
    tag: nested.conversationId || nested.orderId || nested.notificationType || 'homecheff',
    renotify: true,
    data: {
      dateOfArrival: Date.now(),
      route: route || null,
      conversationId: nested.conversationId || payload.conversationId || null,
      orderId: nested.orderId || payload.orderId || null,
      type: nested.type || payload.type || null,
      actionUrl: nested.actionUrl || route || null,
    },
    actions: [
      {
        action: 'open',
        title: 'Openen',
      },
      {
        action: 'close',
        title: 'Sluiten',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks — open exact deep link when present
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const nd = event.notification.data || {};
  const target =
    resolvePushDeepLink(nd) ||
    (typeof nd.route === 'string' ? nd.route : null) ||
    (typeof nd.actionUrl === 'string' ? nd.actionUrl : null);

  if (!target) {
    // Destination missing: stay on messages hub, not homepage
    event.waitUntil(clients.openWindow('/messages'));
    return;
  }

  const absolute = new URL(target, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.startsWith(self.location.origin)) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(absolute);
          }
          return clients.openWindow(absolute);
        }
      }
      return clients.openWindow(absolute);
    })
  );
});

// Helper function for background sync
async function processQueuedActions() {
  // Process any queued messages or actions
}
