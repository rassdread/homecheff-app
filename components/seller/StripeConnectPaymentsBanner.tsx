'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

interface StripeConnectStatus {
  hasAccount: boolean;
  isCompleted: boolean;
}

export default function StripeConnectPaymentsBanner() {
  const { t, tOr } = useTranslation();
  const [status, setStatus] = useState<StripeConnectStatus | null>(null);
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
      setStatus({
        hasAccount: Boolean(data.hasAccount),
        isCompleted: Boolean(data.isCompleted),
      });
    } catch {
      setStatus(null);
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
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === 'string'
            ? data.error
            : tOr(
                'seller.stripeConnectPaymentsBanner.error',
                'Something went wrong. Please try again.',
                'Er ging iets mis. Probeer het opnieuw.'
              )
        );
        return;
      }
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl as string;
        return;
      }
      await refresh();
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

  if (loading || !status || status.isCompleted) {
    return null;
  }

  const message =
    t('seller.stripeConnectPaymentsBanner.message') ||
    'Je producten kunnen zichtbaar zijn, maar klanten kunnen pas afrekenen zodra je betalingen hebt ingesteld.';
  const cta =
    t('seller.stripeConnectPaymentsBanner.cta') ||
    'Betalingen instellen (Stripe Connect)';

  return (
    <div
      className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:p-5"
      role="status"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 min-w-0">
          <AlertTriangle
            className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5"
            aria-hidden
          />
          <p className="text-sm text-amber-950 leading-relaxed">{message}</p>
        </div>
        <Button
          type="button"
          onClick={() => void startOnboarding()}
          disabled={ctaLoading}
          className="inline-flex items-center justify-center shrink-0 whitespace-nowrap"
        >
          {ctaLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              …
            </span>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" aria-hidden />
              {cta}
            </>
          )}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
