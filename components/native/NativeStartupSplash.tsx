'use client';

import { useEffect, useState, useRef } from 'react';
import { isNativeApp } from '@/lib/native/capacitor';

const MIN_VISIBLE_MS = 700;
const FADE_OUT_MS = 260;

/**
 * WebView-branded splash bovenop de app (alleen Capacitor).
 * Native Android splash mag wit blijven; deze overlay toont direct daarna het merkbeeld.
 */
export default function NativeStartupSplash() {
  const [isNative, setIsNative] = useState(() => isNativeApp());
  const [phase, setPhase] = useState<'show' | 'fade' | 'gone'>('show');
  const startedRef = useRef(false);
  const mountedAtRef = useRef<number>(0);
  if (mountedAtRef.current === 0 && typeof performance !== 'undefined') {
    mountedAtRef.current = performance.now();
  }

  useEffect(() => {
    setIsNative(isNativeApp());
  }, []);

  useEffect(() => {
    if (!isNative || startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const t0 = mountedAtRef.current || performance.now();
    let hideTimer: ReturnType<typeof window.setTimeout> | undefined;
    let fadeTimer: ReturnType<typeof window.setTimeout> | undefined;
    let raf2 = 0;

    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        const elapsed = performance.now() - t0;
        const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
        hideTimer = window.setTimeout(() => {
          if (cancelled) return;
          setPhase('fade');
          fadeTimer = window.setTimeout(() => {
            if (!cancelled) setPhase('gone');
          }, FADE_OUT_MS);
        }, wait);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
    };
  }, [isNative]);

  if (!isNative || phase === 'gone') {
    return null;
  }

  return (
    <div
      className={`native-startup-splash fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity ease-out motion-reduce:transition-none ${
        phase === 'show' ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{
        transitionDuration: `${FADE_OUT_MS}ms`,
      }}
      aria-hidden
    >
      <div className="relative mx-auto h-[min(78vh,800px)] w-[min(92vw,420px)]">
        <img
          src="/homecheff-native-splash.png"
          alt=""
          className="h-full w-full object-contain object-center"
          decoding="sync"
          fetchPriority="high"
          draggable={false}
        />
      </div>
    </div>
  );
}
