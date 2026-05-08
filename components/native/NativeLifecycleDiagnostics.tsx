'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isNativeApp } from '@/lib/native/capacitor';

/**
 * Houdt laatste route bij in sessionStorage (native cold start / debugging).
 * Optioneel: `NEXT_PUBLIC_NATIVE_LIFECYCLE_DEBUG=true` → console logs bij visibility/pageshow.
 */
export default function NativeLifecycleDiagnostics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isNativeApp() || typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('hc_native_last_path', pathname || '/');
    } catch {
      /* ignore */
    }

    const dbg = process.env.NEXT_PUBLIC_NATIVE_LIFECYCLE_DEBUG === 'true';
    if (!dbg) return;

    const log = (...args: unknown[]) =>
      console.log('[hc-native-lifecycle]', ...args);

    const onVis = () => {
      log('visibilitychange', {
        hidden: document.hidden,
        path: pathname,
      });
    };

    const onPageShow = (e: PageTransitionEvent) => {
      log('pageshow', { persisted: e.persisted, path: pathname });
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onPageShow);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [pathname]);

  return null;
}
