'use client';

import { useSyncExternalStore } from 'react';
import { readNativeShellSnapshot, subscribeNativeShell } from '@/lib/native/subscribeNativeShell';

/**
 * Capacitor Android WebView (bridge or Capacitor platform).
 * Re-renders when native shell becomes ready.
 */
export function useNativeAndroid(): boolean {
  return useSyncExternalStore(
    subscribeNativeShell,
    () => readNativeShellSnapshot().nativeAndroid,
    () => false,
  );
}
