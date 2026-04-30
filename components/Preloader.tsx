'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

/** Wacht tot de browser rustig is zodat eerste paint / feed niet concurreert met tientallen prefetch-JS downloads. */
function runWhenIdle(fn: () => void, timeoutMs: number) {
  if (typeof requestIdleCallback !== 'undefined') {
    const id = requestIdleCallback(() => fn(), { timeout: timeoutMs });
    return () => cancelIdleCallback(id);
  }
  const t = setTimeout(fn, Math.min(timeoutMs, 4000));
  return () => clearTimeout(t);
}

export default function Preloader() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Alleen kernroutes — geen admin/verkoper (zware bundles) voor elke bezoeker.
    const criticalRoutes = ['/login', '/register', '/inspiratie', '/messages', '/profile'];

    const cancel = runWhenIdle(() => {
      criticalRoutes.forEach((route) => {
        if (pathname !== route && !pathname?.startsWith(route)) {
          router.prefetch(route);
        }
      });
    }, 6000);

    return cancel;
  }, [router, pathname]);

  useEffect(() => {
    const cancel = runWhenIdle(() => {
      try {
        if (pathname !== '/login' && pathname !== '/register') {
          fetch('/api/profile/me', { method: 'HEAD' }).catch(() => {});
          fetch('/api/conversations', { method: 'HEAD', credentials: 'include' }).catch(
            () => {}
          );
        }
        if (pathname === '/' || pathname === '/inspiratie') {
          fetch('/api/products?limit=10', { method: 'HEAD' }).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }, 12000);

    return cancel;
  }, [pathname]);

  useEffect(() => {
    const preloadImages = () => {
      const criticalImages = ['/icon-192.png', '/avatar-placeholder.png'];

      criticalImages.forEach((src) => {
        const img = new Image();
        img.onerror = () => {};
        img.src = src;
      });
    };

    preloadImages();
  }, []);

  return null;
}
