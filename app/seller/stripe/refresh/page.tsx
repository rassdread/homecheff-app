'use client';

import { useEffect, useState } from 'react';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import { readStripeConnectReturnPath } from '@/lib/stripe/stripe-connect-return-path';
import { connectRefreshPhase, stripeIncompleteReturn } from '@/lib/stripe/stripe-return-actions';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

/**
 * Stripe refresh_url: the account link expired or the person left Stripe.
 * Show the next step here. Do not open Stripe again by itself, and do not
 * create a second Connect account.
 */
export default function StripeConnectRefresh() {
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'checking' | 'choose'>('checking');
  const [returnPath, setReturnPath] = useState('/mijn-homecheff');
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = readStripeConnectReturnPath('/mijn-homecheff');
    setReturnPath(stored);
    (async () => {
      try {
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

        if (connectRefreshPhase(status) === 'success') {
          window.location.replace('/seller/stripe/success');
          return;
        }

        setPhase('choose');
      } catch {
        if (!cancelled) {
          setError(
            'We konden je betaalaccount niet controleren. Je bestaande account blijft staan.',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const choice = stripeIncompleteReturn({
    uiStatus: 'INCOMPLETE',
    canCreateLink: true,
    returnPath,
  });

  const resume = async () => {
    if (opening) return;
    setOpening(true);
    setError(null);
    try {
      const storedReturn = readStripeConnectReturnPath('');
      const result = await startStripeConnectOnboarding(
        storedReturn ? { returnPath: storedReturn } : undefined,
      );
      if (result.statusOnly) {
        window.location.replace('/seller/stripe/success');
        return;
      }
      if (!result.ok) {
        setOpening(false);
        setError(
          result.error ||
            'We konden je bestaande betaalaccount niet opnieuw openen.',
        );
      }
    } catch {
      setOpening(false);
      setError('We konden je bestaande betaalaccount niet opnieuw openen.');
    }
  };

  if (phase === 'checking' && !error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Je betaalaccount wordt gecontroleerd…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Betaalstappen nog niet af</h1>
        <p className="mt-2 text-sm text-slate-600">
          Je bent terug uit Stripe. Je bestaande betaalaccount blijft gekoppeld. Je kunt die stappen later afronden.
        </p>
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => void resume()}
            disabled={opening}
            className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {opening ? 'Stripe wordt geopend…' : choice.resumeLabelNl}
          </button>
          <a
            href={choice.leavePath}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800"
          >
            {choice.leaveLabelNl}
          </a>
        </div>
      </div>
    </div>
  );
}
