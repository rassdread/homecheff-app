'use client';

import { useEffect, useState } from 'react';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';

/**
 * Stripe refresh_url: account link expired or user must reopen onboarding.
 * Re-issue a fresh Account Link instead of a dead-end dashboard redirect.
 */
export default function StripeConnectRefresh() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await startStripeConnectOnboarding({
        returnPath: '/mijn-homecheff',
      });
      if (cancelled) return;
      if (!result.ok) {
        setError(
          result.error ||
            'We konden je betaalaccount niet opnieuw openen. Ga naar Instellingen → Betalingen.'
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <p className="text-slate-700">{error}</p>
          <a
            href="/settings?tab=payments"
            className="inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Naar betalingen
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
        <p className="text-slate-600">Je betaalaccount wordt opnieuw geopend…</p>
      </div>
    </div>
  );
}
