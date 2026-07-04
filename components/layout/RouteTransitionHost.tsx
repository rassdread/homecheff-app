'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { trackOnboardingEvent } from '@/lib/onboarding/onboarding-analytics';

const BAR_MS = 220;

const ROUTE_PENDING_STYLES = `
@keyframes hcRoutePending {
  0% { transform: scaleX(0.08); opacity: 0.65; }
  55% { transform: scaleX(0.72); opacity: 1; }
  100% { transform: scaleX(1); opacity: 0.35; }
}
.hc-route-pending-bar {
  animation: hcRoutePending 0.22s ease-out forwards;
}
@media (prefers-reduced-motion: reduce) {
  .hc-route-pending-bar,
  .animate-hc-route-tint {
    animation: none !important;
  }
}
`;

/**
 * Subtle route-change feedback: top progress bar + light tint — avoids harsh white flashes
 * without heavy animation. Respects prefers-reduced-motion.
 */
export default function RouteTransitionHost() {
  const pathname = usePathname() ?? '';
  const prevPath = useRef(pathname);
  const [active, setActive] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    startRef.current = typeof performance !== 'undefined' ? performance.now() : null;
    setActive(true);
    const duration = reducedMotion ? 0 : BAR_MS;
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
    }, duration);
    return () => window.clearTimeout(t);
  }, [pathname, reducedMotion]);

  if (!active) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ROUTE_PENDING_STYLES }} />
      <div
        className={`hc-route-pending-bar pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 ${
          reducedMotion ? 'opacity-80' : ''
        }`}
        aria-hidden
      />
      {!reducedMotion ? (
        <div
          className="pointer-events-none fixed inset-0 z-[3] animate-hc-route-tint bg-gradient-to-b from-emerald-900/[0.06] via-transparent to-teal-900/[0.04]"
          aria-hidden
        />
      ) : null}
    </>
  );
}
