'use client';

import { useEffect } from 'react';

/**
 * Registers the marketplace service worker in production.
 * Development skips registration so Next's dev server is not cached.
 */
export default function PwaServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // A failed registration must not block the marketplace.
    });
  }, []);
  return null;
}
