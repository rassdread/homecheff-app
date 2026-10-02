'use client';

import { Suspense, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { ANALYTICS_CONSENT_KEY, analyticsConsentGranted, MARKETING_CONSENT_KEY, marketingConsentState } from '@/lib/meta/commerce';

const VercelAnalytics = dynamic(() => import('@/components/VercelAnalytics'), { ssr: false });
const MetaPixel = dynamic(() => import('@/components/meta/MetaPixel'), { ssr: false });

/**
 * Analytics (Vercel, GA4) loads only after analytics consent.
 * Meta advertising loads only after a separate marketing consent.
 * "Accept all" for analytics does not grant Meta.
 */
export default function ConsentAwareAnalytics() {
  const [analyticsConsent, setAnalyticsConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    const read = () => {
      setAnalyticsConsent(analyticsConsentGranted(localStorage.getItem(ANALYTICS_CONSENT_KEY)));
      setMarketingConsent(marketingConsentState(localStorage.getItem(MARKETING_CONSENT_KEY)) === 'granted');
    };
    read();
    window.addEventListener('hc-consent-changed', read);
    return () => window.removeEventListener('hc-consent-changed', read);
  }, []);

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  return (
    <>
      {analyticsConsent ? (
        <>
          <VercelAnalytics />
          {gaId ? (
            <Suspense fallback={null}>
              <GoogleAnalytics measurementId={gaId} />
            </Suspense>
          ) : null}
        </>
      ) : null}
      {marketingConsent ? <MetaPixel /> : null}
    </>
  );
}
