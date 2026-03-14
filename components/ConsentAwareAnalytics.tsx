'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const VercelAnalytics = dynamic(() => import('@/components/VercelAnalytics'), { ssr: false });

const CONSENT_KEY = 'privacy-notice-accepted';
const CONSENT_FULL = 'true';
const CONSENT_ALL = 'all';

/**
 * Renders analytics (Vercel, and optionally GA) only when the user has given
 * full cookie consent ("Accept all" / "Accepteren"). "Only necessary" does not load analytics.
 */
export default function ConsentAwareAnalytics() {
  const [hasConsent, setHasConsent] = useState(false);

  useEffect(() => {
    const value = localStorage.getItem(CONSENT_KEY);
    setHasConsent(value === CONSENT_FULL || value === CONSENT_ALL);
  }, []);

  if (!hasConsent) return null;

  return <VercelAnalytics />;
}
