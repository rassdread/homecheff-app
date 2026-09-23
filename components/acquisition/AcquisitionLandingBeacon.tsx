'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/components/GoogleAnalytics';

const CONSENT_KEY = 'privacy-notice-accepted';

/**
 * One consented landing view per browser session.
 * Waits until gtag exists so the event is not dropped on a race with the loader.
 */
export default function AcquisitionLandingBeacon({
  eventName,
}: {
  eventName: 'seller_landing_view' | 'affiliate_landing_view' | 'growth_landing_view';
}) {
  useEffect(() => {
    let stopped = false;
    const storageKey = `hc_acq_${eventName}`;

    const attempt = () => {
      if (stopped) return;
      const consent = localStorage.getItem(CONSENT_KEY);
      if (consent !== 'true' && consent !== 'all') return;
      if (sessionStorage.getItem(storageKey) === '1') return;
      if (typeof window.gtag !== 'function') return;
      trackEvent(eventName, { path: window.location.pathname });
      sessionStorage.setItem(storageKey, '1');
    };

    attempt();
    window.addEventListener('hc-consent-changed', attempt);
    const timer = window.setInterval(attempt, 500);
    const stop = window.setTimeout(() => window.clearInterval(timer), 8000);
    return () => {
      stopped = true;
      window.removeEventListener('hc-consent-changed', attempt);
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [eventName]);

  return null;
}
