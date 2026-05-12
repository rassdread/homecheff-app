'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

/**
 * Subtle full-viewport tint on client navigations — avoids harsh white flashes without heavy animation.
 */
export default function RouteTransitionHost() {
  const pathname = usePathname() ?? '';
  const prevPath = useRef(pathname);
  const [active, setActive] = useState(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    startRef.current = typeof performance !== 'undefined' ? performance.now() : null;
    setActive(true);
    const t = window.setTimeout(() => {
      try {
        setActive(false);
        const started = startRef.current;
        if (started != null && typeof performance !== 'undefined') {
          const ms = Math.round(performance.now() - started);
          trackOnboardingEvent('ROUTE_TRANSITION_MS', {
            ms,
            to: pathname.slice(0, 160),
          });
        }
        startRef.current = null;
      } catch {
        /* avoid uncaught errors from analytics / state during navigation */
      }
    }, 95);
    return () => window.clearTimeout(t);
  }, [pathname]);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[3] animate-hc-route-tint bg-gradient-to-b from-emerald-900/[0.06] via-transparent to-teal-900/[0.04]"
      aria-hidden
    />
  );
}
