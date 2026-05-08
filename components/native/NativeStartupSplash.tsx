'use client';

import { useEffect, useRef } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativeApp } from '@/lib/native/capacitor';

const MIN_NATIVE_VISIBLE_MS = 850;

/**
 * Stuurt native Capacitor SplashScreen lifecycle:
 * - native splash is de startup source-of-truth
 * - hide pas na eerste paint + minimum zichtduur
 */
export default function NativeStartupSplash() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isNativeApp() || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const t0 = performance.now();
    let hideTimer: ReturnType<typeof window.setTimeout> | undefined;
    let raf2 = 0;

    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const elapsed = performance.now() - t0;
        const wait = Math.max(0, MIN_NATIVE_VISIBLE_MS - elapsed);
        hideTimer = window.setTimeout(() => {
          if (cancelled) return;
          void SplashScreen.hide().catch(() => {
            /* no-op */
          });
        }, wait);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, []);

  return null;
}
