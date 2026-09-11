'use client';

import { useEffect, useState } from 'react';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

/**
 * Stripe refresh_url: Account Link expired.
 * Fresh-retrieve status first; only re-issue a link when actionable.
 * Never mint a duplicate account; never loop when pending/ready.
 */
export default function StripeConnectRefresh() {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1) Fresh status (Stripe SoT) before any Account Link
        const statusRes = await fetch(
          `/api/stripe/connect/onboard?ts=${Date.now()}`,
          { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } },
        );
        const status = (await statusRes.json().catch(() => ({}))) as {
          uiStatus?: HomecheffConnectUiStatus;
          paymentReady?: boolean;
          canCreateOnboardingLink?: boolean;
        };
        if (cancelled) return;

        if (
          status.paymentReady ||
          status.uiStatus === 'PAYMENT_READY' ||
          status.uiStatus === 'PENDING_VERIFICATION' ||
          status.canCreateOnboardingLink === false
        ) {
          window.location.replace('/seller/stripe/success');
          return;
        }

        if (status.canCreateOnboardingLink === false) {
          setInfo(
            'Er staan geen openstaande Stripe-stappen. Je wordt doorgestuurd…',
          );
          window.location.replace('/seller/stripe/success');
          return;
        }

        // 2) Actionable → re-issue Account Link for SAME current account
        const result = await startStripeConnectOnboarding({
          returnPath: '/mijn-homecheff',
        });
        if (cancelled) return;
        if (result.statusOnly) {
          window.location.replace('/seller/stripe/success');
          return;
        }
        if (!result.ok) {
          setError(
            result.error ||
              'We konden je betaalaccount niet opnieuw openen. Ga naar Instellingen → Betalingen.',
          );
        }
      } catch {
        if (!cancelled) {
          setError(
            'We konden je betaalaccount niet opnieuw openen. Ga naar Instellingen → Betalingen.',
          );
        }
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
        <p className="text-slate-600">
          {info || 'Je betaalaccount wordt gecontroleerd…'}
        </p>
      </div>
    </div>
  );
}
