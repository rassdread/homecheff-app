'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * Phase 7C.4 — friendly Stripe Connect guidance shown where the seller chooses
 * HomeCheff Checkout.
 *
 * - Connect ready   → reassuring green status (marketplace.settlement.connectReady)
 * - Connect missing → non-blocking guidance + CTA to the EXISTING onboarding
 *                     route (marketplace.settlement.needsConnect + setupConnectCta)
 *
 * Never blocks publishing; only explains that HomeCheff Checkout becomes
 * publicly available once the payout profile is finished.
 */
export default function SettlementConnectGuidance({
  active,
}: {
  /** Seller currently has HomeCheff Checkout selected. */
  active: boolean;
}) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<{ isCompleted: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/stripe/connect/onboard');
      if (!res.ok) {
        setStatus(null);
        return;
      }
      const data = await res.json();
      setStatus({ isCompleted: Boolean(data.isCompleted) });
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) void refresh();
  }, [active, refresh]);

  const startOnboarding = async () => {
    setCtaLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.onboardingUrl) {
        window.location.href = data.onboardingUrl as string;
        return;
      }
      await refresh();
    } catch {
      setError(t('marketplace.settlement.connectError'));
    } finally {
      setCtaLoading(false);
    }
  };

  if (!active || loading || !status) return null;

  if (status.isCompleted) {
    return (
      <div
        className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
        role="status"
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        <p className="text-xs leading-relaxed text-emerald-900">
          {t('marketplace.settlement.connectReady')}
        </p>
      </div>
    );
  }

  return (
    <div
      className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
      role="status"
    >
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-amber-950">
          {t('marketplace.settlement.needsConnect')}
        </p>
      </div>
      <div className="mt-2.5">
        <Button
          type="button"
          onClick={() => void startOnboarding()}
          disabled={ctaLoading}
          className="w-full whitespace-normal px-4 py-2 sm:w-auto"
        >
          <ExternalLink className="mr-2 h-4 w-4 shrink-0" aria-hidden />
          <span>{t('marketplace.settlement.setupConnectCta')}</span>
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-xs text-red-800" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
