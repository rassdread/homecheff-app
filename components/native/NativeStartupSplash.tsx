'use client';

import { useEffect, useRef, useState } from 'react';
import { isNativeApp } from '@/lib/native/capacitor';

const MIN_VISIBLE_MS = 850;
const FADE_OUT_MS = 260;

/**
 * Stuurt static HTML startup splash lifecycle (alleen native).
 */
export default function NativeStartupSplash() {
  const [isNative, setIsNative] = useState(() => isNativeApp());
  const startedRef = useRef(false);
  const mountedAtRef = useRef<number>(0);

  if (mountedAtRef.current === 0 && typeof performance !== 'undefined') {
    mountedAtRef.current = performance.now();
  }

  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  useEffect(() => {
    if (!isNative) return;
    document.documentElement.classList.add('hc-native-splash-active');
    document.documentElement.classList.remove('hc-native-splash-done');
    return () => {
      document.documentElement.classList.remove('hc-native-splash-active');
      document.documentElement.classList.remove('hc-native-splash-fade');
    };
  }, [isNative]);

  useEffect(() => {
    if (!isNative || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    let hideTimer: ReturnType<typeof window.setTimeout> | undefined;
    let doneTimer: ReturnType<typeof window.setTimeout> | undefined;
    let raf2 = 0;
    const t0 = mountedAtRef.current || performance.now();

    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const elapsed = performance.now() - t0;
        const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
        hideTimer = window.setTimeout(() => {
          if (cancelled) return;
          document.documentElement.classList.add('hc-native-splash-fade');
          doneTimer = window.setTimeout(() => {
            if (cancelled) return;
            document.documentElement.classList.remove('hc-native-splash-active');
            document.documentElement.classList.remove('hc-native-splash-fade');
            document.documentElement.classList.add('hc-native-splash-done');
          }, FADE_OUT_MS);
        }, wait);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
      if (doneTimer !== undefined) window.clearTimeout(doneTimer);
    };
  }, [isNative]);

  return null;
}
