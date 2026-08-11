'use client';

import { useEffect } from 'react';
import { canonicalLogoPath } from '@/lib/brand/canonical-logo';

/**
 * Lightweight asset warm — do NOT prefetch /login|/register|/faq on homepage.
 * Those route chunks competed with GeoFeed critical JS on cold start.
 * Auth/FAQ load on navigation or interaction instead.
 */
export default function Preloader() {
  useEffect(() => {
    const criticalImages = [canonicalLogoPath('square'), '/avatar-placeholder.png'];
    criticalImages.forEach((src) => {
      const img = new Image();
      img.onerror = () => {};
      img.src = src;
    });
  }, []);

  return null;
}
