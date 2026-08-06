/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging service worker (browser closed / background).
 * Separate from /sw.js so caching behaviour is not regressed.
 */
/* global importScripts, firebase, clients, self */

importScripts(
  'https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js'
);

let messagingInitialized = false;

async function ensureFirebase() {
  if (messagingInitialized) return;
  try {
    const res = await fetch('/api/public/firebase-web-config', {
      credentials: 'same-origin',
    });
    if (!res.ok) return;
    const cfg = await res.json();
    if (!cfg?.apiKey || !cfg?.projectId || !cfg?.appId) return;
    firebase.initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain,
      projectId: cfg.projectId,
      messagingSenderId: cfg.messagingSenderId,
      appId: cfg.appId,
    });
    messagingInitialized = true;
  } catch (e) {
    console.warn('[hc-fcm-sw] init failed', e);
  }
}

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
          pathOnly.startsWith('/product') ||
          pathOnly.startsWith('/delivery') ||
          pathOnly.startsWith('/deal-review') ||
          pathOnly.startsWith('/delivery-review') ||
          pathOnly.startsWith('/verkoper') ||
          pathOnly.startsWith('/bezorger') ||
          pathOnly.startsWith('/user') ||
          pathOnly.startsWith('/notifications') ||
          pathOnly.startsWith('/settings')
        ) {
          return raw;
        }
      }
      const u = new URL(raw, self.location.origin);
      if (u.origin === self.location.origin && u.pathname.startsWith('/')) {
        return `${u.pathname}${u.search}`;
      }
    } catch (_) {
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

self.addEventListener('install', (event) => {
  event.waitUntil(ensureFirebase().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    ensureFirebase().then(() => self.clients.claim())
  );
});

ensureFirebase().then(() => {
  try {
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title =
        (payload.notification && payload.notification.title) ||
        (payload.data && payload.data.title) ||
        'HomeCheff';
      const body =
        (payload.notification && payload.notification.body) ||
        (payload.data && payload.data.body) ||
        '';
      const nested = payload.data || {};
      const route = resolvePushDeepLink(nested);
      const options = {
        body,
        icon: '/icon-192.png',
        badge: '/favicon-48.png',
        tag:
          nested.conversationId ||
          nested.orderId ||
          nested.notificationType ||
          'homecheff-fcm',
        renotify: true,
        data: {
          ...nested,
          route: route || nested.route || null,
          actionUrl: nested.actionUrl || route || null,
        },
      };
      return self.registration.showNotification(title, options);
    });
  } catch (e) {
    console.warn('[hc-fcm-sw] onBackgroundMessage failed', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const nd = event.notification.data || {};
  const target =
    resolvePushDeepLink(nd) ||
    (typeof nd.route === 'string' ? nd.route : null) ||
    (typeof nd.actionUrl === 'string' ? nd.actionUrl : null) ||
    '/messages';

  const absolute = new URL(target, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
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
