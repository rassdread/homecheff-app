'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isNativeApp } from '@/lib/native/capacitor';
import {
  getWebFcmToken,
  isWebPushSupportedInBrowser,
  subscribeWebFcmForeground,
} from '@/lib/firebase/web-messaging';
import { isFirebaseWebPushConfigured } from '@/lib/firebase/web-public-config';
import {
  registerFcmTokenWithServer,
  unregisterFcmTokenWithServer,
} from '@/lib/native/pushTokenServer';
import { setCachedPushRegistrationId } from '@/lib/native/pushRegistrationCache';

const WEB_DEVICE_ID_KEY = 'hc_web_push_device_id';

function getOrCreateWebDeviceId(): string {
  try {
    const existing = localStorage.getItem(WEB_DEVICE_ID_KEY);
    if (existing) return existing;
    const id = `web_${crypto.randomUUID()}`;
    localStorage.setItem(WEB_DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `web_${Date.now()}`;
  }
}

/**
 * Browser FCM registration. Permission only requested via enableBrowserPush().
 * Silent refresh when permission already granted (login / resume).
 */
export async function enableBrowserPush(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (isNativeApp()) return { ok: false, reason: 'native' };
  if (!isFirebaseWebPushConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }
  if (!(await isWebPushSupportedInBrowser())) {
    return { ok: false, reason: 'unsupported' };
  }
  try {
    const token = await getWebFcmToken({ requestPermission: true });
    if (!token) return { ok: false, reason: 'no_token' };
    const result = await registerFcmTokenWithServer(
      token,
      'web',
      getOrCreateWebDeviceId(),
      { force: true, diagReason: 'post_permission' }
    );
    if (result !== 'ok') return { ok: false, reason: result };
    setCachedPushRegistrationId(token);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : 'error',
    };
  }
}

export async function refreshBrowserPushIfGranted(): Promise<void> {
  if (isNativeApp()) return;
  if (!isFirebaseWebPushConfigured()) return;
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    const token = await getWebFcmToken({ requestPermission: false });
    if (!token) return;
    await registerFcmTokenWithServer(
      token,
      'web',
      getOrCreateWebDeviceId(),
      { diagReason: 'token_refresh' }
    );
  } catch {
    /* ignore */
  }
}

export async function disableBrowserPush(): Promise<void> {
  try {
    const token = await getWebFcmToken({ requestPermission: false });
    if (token) await unregisterFcmTokenWithServer(token);
  } catch {
    /* ignore */
  }
}

export default function WebPushRegistration() {
  const { data: session, status } = useSession();
  const [ready, setReady] = useState(false);

  const sync = useCallback(async () => {
    if (status !== 'authenticated' || !session?.user) return;
    await refreshBrowserPushIfGranted();
    setReady(true);
  }, [session?.user, status]);

  useEffect(() => {
    void sync();
  }, [sync]);

  useEffect(() => {
    if (!ready) return;
    let unsub: (() => void) | null = null;
    let cancelled = false;
    void (async () => {
      const u = await subscribeWebFcmForeground(() => {
        try {
          window.dispatchEvent(new CustomEvent('notificationsUpdated'));
        } catch {
          /* ignore */
        }
      });
      if (!cancelled) unsub = u;
    })();
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [ready]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [sync]);

  return null;
}
