'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  flushPendingMetaEvents,
  revokeMetaPixelConsent,
  trackMetaPageView,
} from '@/lib/meta/browser';
import { MARKETING_CONSENT_KEY, resolveMetaPixelId } from '@/lib/meta/commerce';

/**
 * Mounted only after marketing consent. Pathname changes emit one PageView.
 * Search params are intentionally not subscribed to.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const pixelId = resolveMetaPixelId(process.env.NEXT_PUBLIC_META_PIXEL_ID);

  useEffect(() => {
    if (!pixelId) return;
    try {
      flushPendingMetaEvents();
      trackMetaPageView(pathname);
    } catch {
      /* ignore */
    }
  }, [pathname, pixelId]);

  useEffect(() => {
    return () => {
      try {
        const current = window.localStorage.getItem(MARKETING_CONSENT_KEY);
        if (current !== 'granted') revokeMetaPixelConsent();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}
