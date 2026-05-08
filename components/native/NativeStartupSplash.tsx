'use client';

import { useEffect, useRef } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { isNativeApp } from '@/lib/native/capacitor';

const MIN_NATIVE_VISIBLE_MS = 850;
const APP_READY_TIMEOUT_MS = 6000;

function isMainContentReady(): boolean {
  const root = document.getElementById('main-content');
  if (!root) return false;
  // Zodra React children heeft geplaatst is dit scherm klaar om te tonen.
  return root.childElementCount > 0 || root.textContent?.trim().length! > 0;
}

async function waitForMainContentReady(): Promise<void> {
  if (isMainContentReady()) return;

  await new Promise<void>((resolve) => {
    let done = false;
    const observer = new MutationObserver(() => {
      if (isMainContentReady()) finish();
    });

    const onLoad = () => {
      if (isMainContentReady()) finish();
    };
    const onReadyState = () => {
      if (isMainContentReady()) finish();
    };
    const timeoutId = window.setTimeout(() => finish(), APP_READY_TIMEOUT_MS);

    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeoutId);
      observer.disconnect();
      window.removeEventListener('load', onLoad);
      document.removeEventListener('readystatechange', onReadyState);
      resolve();
    };

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    window.addEventListener('load', onLoad);
    document.addEventListener('readystatechange', onReadyState);
    if (isMainContentReady()) finish();
  });
}

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
        void waitForMainContentReady().finally(() => {
          const elapsed = performance.now() - t0;
          const wait = Math.max(0, MIN_NATIVE_VISIBLE_MS - elapsed);
          hideTimer = window.setTimeout(() => {
            if (cancelled) return;
            void SplashScreen.hide({ fadeOutDuration: 260 }).catch(() => {
              /* no-op */
            });
          }, wait);
        });
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
