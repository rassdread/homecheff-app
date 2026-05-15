'use client';

import { useSyncExternalStore } from 'react';
import { readNativeShellSnapshot, subscribeNativeShell } from '@/lib/native/subscribeNativeShell';

export type GoogleLoginUiMode = 'pending' | 'android_native' | 'web';

/**
 * `pending` only on server / pre-hydration snapshot.
 * Client re-evaluates when Capacitor / androidBridge becomes available.
 */
export function useGoogleLoginUiMode(): GoogleLoginUiMode {
  return useSyncExternalStore(
    subscribeNativeShell,
    (): GoogleLoginUiMode => {
      if (typeof window === 'undefined') return 'pending';
      return readNativeShellSnapshot().nativeAndroid ? 'android_native' : 'web';
    },
    (): GoogleLoginUiMode => 'pending',
  );
}
