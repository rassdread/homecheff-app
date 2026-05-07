'use client';

import { useEffect } from 'react';
import { isNativeApp } from '@/lib/native/capacitor';

const ROOT_CLASS = 'hc-native-capacitor';

/**
 * Zet alleen op document.documentElement een class voor Capacitor native shell,
 * zodat globals.css gerichte native layout kan toepassen zonder SSR/hydratie-risico.
 */
export default function NativeAppRootClass() {
  useEffect(() => {
    if (!isNativeApp()) return;
    document.documentElement.classList.add(ROOT_CLASS);
    return () => {
      document.documentElement.classList.remove(ROOT_CLASS);
    };
  }, []);

  return null;
}
