'use client';

import { useSyncExternalStore } from 'react';
import { isNativeAndroid } from '@/lib/native/capacitor';

const emptySubscribe = () => () => {};

/**
 * Zelfde detectie als isNativeAndroid(), maar hydration-safe:
 * server snapshot = false; client leest androidBridge / Capacitor zonder te wachten op useEffect.
 * Voorkomt dat de WebView-Google-knop één frame zichtbaar is vóór native CTA.
 */
export function useNativeAndroid(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => (typeof window !== 'undefined' ? isNativeAndroid() : false),
    () => false,
  );
}
