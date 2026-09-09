'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';
import { connectCtaModelForStatus } from '@/lib/stripe/connect-account-status';

export default function StripeConnectPaymentsBanner() {
  const { t, tOr } = useTranslation();
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
      setUiStatus(
        (data.uiStatus as HomecheffConnectUiStatus) ||
          (data.isCompleted || data.paymentReady
            ? 'PAYMENT_READY'
            : data.hasAccount
              ? 'INCOMPLETE'
              : 'NOT_STARTED')
      );
    } catch {
      setUiStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startOnboarding = async () => {
    setCtaLoading(true);
    setError(null);
    try {
      const result = await startStripeConnectOnboarding();
      if (!result.ok) {
        setError(
          result.error ||
            tOr(
              'seller.stripeConnectPaymentsBanner.error',
              'Something went wrong. Please try again.',
              'Er ging iets mis. Probeer het opnieuw.'
            )
        );
        await refresh();
        return;
      }
      if (!result.redirected) {
        await refresh();
      }
    } catch {
      setError(
        tOr(
          'seller.stripeConnectPaymentsBanner.error',
          'Something went wrong. Please try again.',
          'Er ging iets mis. Probeer het opnieuw.'
        )
      );
    } finally {
      setCtaLoading(false);
    }
  };

  if (loading || !uiStatus || uiStatus === 'PAYMENT_READY') {
    return null;
  }

  if (uiStatus === 'PENDING_VERIFICATION') {
    const model = connectCtaModelForStatus('PENDING_VERIFICATION');
    return (
      <div
        className="mb-4 w-full min-w-0 rounded-xl border border-sky-200 bg-sky-50 p-4 sm:p-5"
        role="status"
      >
        <div className="flex min-w-0 gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sky-950">{model.titleNl}</p>
            <p className="mt-1 break-words text-xs leading-relaxed text-sky-900/80">
              {model.bodyNl}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const model = connectCtaModelForStatus(uiStatus);
  const message =
    model.bodyNl ||
    t('seller.stripeConnectPaymentsBanner.message') ||
    'Je producten kunnen zichtbaar zijn, maar klanten kunnen pas afrekenen zodra je betalingen hebt ingesteld.';
  const cta =
    model.ctaLabelNl ||
    t('seller.stripeConnectPaymentsBanner.cta') ||
    'Betalingen instellen';

  if (!model.showOnboardingCta) {
    return null;
  }

  return (
    <div
      className="mb-4 w-full min-w-0 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5"
      role="status"
    >
      <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex min-w-0 flex-1 gap-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-medium leading-relaxed text-amber-950">
              {model.titleNl}
            </p>
            <p className="mt-1 break-words text-xs leading-relaxed text-amber-900/80">
              {message}
            </p>
          </div>
        </div>
        <div className="w-full shrink-0 sm:w-auto sm:self-center">
          <Button
            type="button"
            onClick={() => void startOnboarding()}
            disabled={ctaLoading}
            className="w-full whitespace-normal px-4 py-2.5 sm:w-auto sm:max-w-[min(100%,22rem)]"
          >
            {ctaLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                …
              </span>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                <span className="text-center">{cta}</span>
              </>
            )}
          </Button>
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
