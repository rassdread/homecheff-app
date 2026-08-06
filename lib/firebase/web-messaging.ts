'use client';

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from 'firebase/messaging';
import {
  getFirebaseWebPublicConfig,
  type FirebaseWebPublicConfig,
} from '@/lib/firebase/web-public-config';
import { isNativeApp } from '@/lib/native/capacitor';

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function getOrInitApp(config: FirebaseWebPublicConfig): FirebaseApp {
  if (app) return app;
  app =
    getApps().length > 0
      ? getApps()[0]!
      : initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId,
        });
  return app;
}

export async function isWebPushSupportedInBrowser(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isNativeApp()) return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

async function ensureMessagingSw(): Promise<ServiceWorkerRegistration> {
  // Dedicated FCM SW — does not replace /sw.js caching worker.
  const existing = await navigator.serviceWorker.getRegistration(
    '/firebase-messaging-sw.js'
  );
  if (existing) return existing;
  return navigator.serviceWorker.register('/firebase-messaging-sw.js', {
    scope: '/firebase-cloud-messaging-push-scope',
  });
}

export async function getWebFcmToken(options?: {
  requestPermission?: boolean;
}): Promise<string | null> {
  const config = getFirebaseWebPublicConfig();
  if (!config) return null;
  if (!(await isWebPushSupportedInBrowser())) return null;

  if (Notification.permission === 'denied') return null;
  if (Notification.permission === 'default') {
    if (!options?.requestPermission) return null;
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
  }

  const firebaseApp = getOrInitApp(config);
  messaging = messaging || getMessaging(firebaseApp);
  const registration = await ensureMessagingSw();
  const token = await getToken(messaging, {
    ...(config.vapidKey ? { vapidKey: config.vapidKey } : {}),
    serviceWorkerRegistration: registration,
  });
  return token || null;
}

/**
 * Foreground FCM — suppress system duplicate when tab visible (Pusher toast owns UX).
 * Returns unsubscribe.
 */
export async function subscribeWebFcmForeground(
  onPayload: (payload: {
    title: string;
    body: string;
    data: Record<string, string>;
  }) => void
): Promise<(() => void) | null> {
  const config = getFirebaseWebPublicConfig();
  if (!config) return null;
  if (!(await isWebPushSupportedInBrowser())) return null;
  if (Notification.permission !== 'granted') return null;

  const firebaseApp = getOrInitApp(config);
  messaging = messaging || getMessaging(firebaseApp);
  return onMessage(messaging, (payload) => {
    const title =
      payload.notification?.title ||
      (payload.data?.title as string | undefined) ||
      'HomeCheff';
    const body =
      payload.notification?.body ||
      (payload.data?.body as string | undefined) ||
      '';
    const data: Record<string, string> = {};
    if (payload.data) {
      for (const [k, v] of Object.entries(payload.data)) {
        if (typeof v === 'string') data[k] = v;
      }
    }
    // Visible tab: no OS notification — avoids duplicate with in-app toast.
    if (document.visibilityState === 'visible') {
      onPayload({ title, body, data });
      return;
    }
    try {
      const n = new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/favicon-48.png',
        tag: data.conversationId || data.orderId || data.type || 'homecheff-fcm',
        data,
      });
      n.onclick = () => {
        window.focus();
        const route = data.route || data.actionUrl;
        if (route) window.location.assign(route);
        n.close();
      };
    } catch {
      onPayload({ title, body, data });
    }
  });
}
