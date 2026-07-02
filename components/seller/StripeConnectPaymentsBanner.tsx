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
    'Betalingen instellen';
  const hint =
    t('seller.stripeConnectPaymentsBanner.hint') ||
    'Wil je dat mensen via HomeCheff kunnen betalen? Stel dan veilig je betalingen in.';

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
            <p className="break-words text-sm leading-relaxed text-amber-950">
              {message}
            </p>
            <p className="mt-1.5 break-words text-xs leading-relaxed text-amber-900/80">
              {hint}
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
