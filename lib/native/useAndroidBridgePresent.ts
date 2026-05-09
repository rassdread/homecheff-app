'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * `true` alleen in Capacitor **Android** WebView (native zet `window.androidBridge`).
 * Harde schakel: web-Google / signIn('google') nooit tonen als dit `true` is.
 */
export function useAndroidBridgePresent(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () =>
      typeof window !== 'undefined' &&
      !!(window as unknown as { androidBridge?: unknown }).androidBridge,
    () => false,
  );
}
