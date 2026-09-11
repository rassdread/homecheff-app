'use client';

import { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, ExternalLink, Clock } from 'lucide-react';
import { SettlementLucideIcon } from '@/components/marketplace/SettlementLucideIcon';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

/**
 * Phase 7C.4 — friendly Stripe Connect guidance where seller chooses
 * HomeCheff Checkout. Uses shared Connect uiStatus (never accountId alone).
 */
export default function SettlementConnectGuidance({
  active,
}: {
  active: boolean;
}) {
  const { t } = useTranslation();
  const [uiStatus, setUiStatus] = useState<HomecheffConnectUiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/stripe/connect/onboard?ts=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        setUiStatus(null);
        return;
      }
      const data = await res.json();
      const status = (data.uiStatus as HomecheffConnectUiStatus) || (
        data.isCompleted || data.paymentReady
          ? 'PAYMENT_READY'
          : data.hasAccount
            ? 'INCOMPLETE'
            : 'NOT_STARTED'
      );
      setUiStatus(status);
    } catch {
      setUiStatus(null);
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
      const result = await startStripeConnectOnboarding({
        returnPath:
          typeof window !== 'undefined'
            ? `${window.location.pathname}${window.location.search}`
            : '/sell/new',
      });
      if (!result.ok) {
        setError(result.error ?? t('marketplace.settlement.connectError'));
        await refresh();
      }
    } catch {
      setError(t('marketplace.settlement.connectError'));
    } finally {
      setCtaLoading(false);
    }
  };

  if (!active || loading || !uiStatus) return null;

  if (uiStatus === 'PAYMENT_READY') {
    return (
      <div
        className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
        role="status"
      >
        <SettlementLucideIcon kind="homecheff" size="md" className="mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed text-emerald-900">
          {t('marketplace.settlement.connectReady')}
        </p>
      </div>
    );
  }

  if (uiStatus === 'PENDING_VERIFICATION') {
    return (
      <div
        className="mt-3 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3"
        role="status"
      >
        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden />
        <p className="text-xs leading-relaxed text-sky-950">
          Je gegevens zijn ontvangen. Stripe controleert je betaalaccount — je hoeft
          niets opnieuw in te vullen. HomeCheff Checkout wordt beschikbaar zodra
          verificatie klaar is.
        </p>
      </div>
    );
  }

  const ctaLabel =
    uiStatus === 'ACTION_REQUIRED' || uiStatus === 'RESTRICTED'
      ? 'Actie nodig voor je betaalaccount'
      : uiStatus === 'INCOMPLETE'
        ? 'Gegevens afronden'
        : t('marketplace.settlement.setupConnectCta');

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
          <span>{ctaLabel}</span>
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
