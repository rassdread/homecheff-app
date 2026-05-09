'use client';

import { useSyncExternalStore } from 'react';
import { isNativeAndroid } from '@/lib/native/capacitor';

const emptySubscribe = () => () => {};

export type GoogleLoginUiMode = 'pending' | 'android_native' | 'web';

/**
 * `pending` op server + eerste hydration: géén web-Google-knop in HTML (voorkomt tap vóór JS).
 * Daarna: native op Android WebView, web elders.
 */
export function useGoogleLoginUiMode(): GoogleLoginUiMode {
  return useSyncExternalStore(
    emptySubscribe,
    (): GoogleLoginUiMode => {
      if (typeof window === 'undefined') return 'pending';
      return isNativeAndroid() ? 'android_native' : 'web';
    },
    (): GoogleLoginUiMode => 'pending',
  );
}
