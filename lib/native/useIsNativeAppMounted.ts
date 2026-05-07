'use client';

import { useEffect, useState } from 'react';
import { isNativeApp } from '@/lib/native/capacitor';

/**
 * Always false for SSR and for the first client React render; after mount, true only in
 * the Capacitor native WebView. Use to gate native-only markup/classes so hydration
 * matches server HTML.
 */
export function useIsNativeAppMounted(): boolean {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);
  return isNative;
}
