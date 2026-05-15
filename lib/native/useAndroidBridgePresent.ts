'use client';

import { useSyncExternalStore } from 'react';
import { readNativeShellSnapshot, subscribeNativeShell } from '@/lib/native/subscribeNativeShell';

/**
 * `true` in Capacitor Android WebView when `window.androidBridge` is set.
 * Re-renders when the bridge appears (often after first paint).
 */
export function useAndroidBridgePresent(): boolean {
  return useSyncExternalStore(
    subscribeNativeShell,
    () => readNativeShellSnapshot().androidBridge,
    () => false,
  );
}
