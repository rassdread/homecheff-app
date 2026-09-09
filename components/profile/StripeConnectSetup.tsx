'use client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { startStripeConnectOnboarding } from '@/lib/stripe/start-connect-onboarding-client';
import type { HomecheffConnectUiStatus } from '@/lib/stripe/connect-account-status';

interface StripeConnectSetupProps {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean;
  onUpdate: () => void;
}

export default function StripeConnectSetup({
  stripeConnectOnboardingCompleted: initialCompleted,
  onUpdate,
}: StripeConnectSetupProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uiStatus, setUiStatus] = useState<HomecheffConnectUiStatus | null>(
    initialCompleted ? 'PAYMENT_READY' : null
  );
  const [statusLoading, setStatusLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/stripe/connect/onboard?ts=${Date.now()}`, {
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setUiStatus(initialCompleted ? 'PAYMENT_READY' : 'NOT_STARTED');
        return;
      }
      const status = (data.uiStatus as HomecheffConnectUiStatus) || (
        data.isCompleted || data.paymentReady ? 'PAYMENT_READY' : data.hasAccount ? 'INCOMPLETE' : 'NOT_STARTED'
      );
      setUiStatus(status);
      if (status === 'PAYMENT_READY') {
        onUpdate();
      }
    } catch {
      setUiStatus(initialCompleted ? 'PAYMENT_READY' : 'NOT_STARTED');
    } finally {
      setStatusLoading(false);
    }
  }, [initialCompleted, onUpdate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleOnboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await startStripeConnectOnboarding({
        returnPath: '/settings?tab=payments',
      });
      if (!result.ok) {
        setError(result.error || t('productOrder.payments.setupError'));
        await refresh();
      } else if (!result.redirected) {
        await refresh();
        onUpdate();
      }
    } catch {
      setError(t('productOrder.payments.setupError'));
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading && !uiStatus) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
        {t('common.loading')}
      </div>
    );
  }

  if (uiStatus === 'PAYMENT_READY') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-900">
              Betaalaccount actief
            </span>
          </div>
          <span className="text-xs text-emerald-700">
            Je kunt betalingen ontvangen
          </span>
        </div>
      </div>
    );
  }

  if (uiStatus === 'PENDING_VERIFICATION') {
    return (
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 text-sky-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-sky-900">Verificatie loopt</p>
            <p className="text-xs text-sky-800 mt-1">
              Je gegevens zijn ontvangen. Stripe controleert je betaalaccount. Je hoeft
              nu niets opnieuw in te vullen.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isAction =
    uiStatus === 'ACTION_REQUIRED' || uiStatus === 'RESTRICTED';
  const title = isAction
    ? 'Actie nodig voor je betaalaccount'
    : uiStatus === 'INCOMPLETE'
      ? 'Betaalaccount afronden'
      : t('productOrder.payments.setupTitle');
  const cta = isAction
    ? 'Actie nodig voor je betaalaccount'
    : uiStatus === 'INCOMPLETE'
      ? 'Betaalaccount afronden'
      : t('productOrder.payments.setupCta');

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
      </div>

      <p className="text-xs text-gray-600 mb-2">
        {isAction
          ? 'Stripe heeft nog extra gegevens nodig.'
          : t('productOrder.payments.setupIntro')}
      </p>
      {!isAction && (
        <p className="text-xs text-gray-500 mb-3">
          {t('productOrder.payments.setupContactHint')}
        </p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          <p className="text-red-700 text-xs">{error}</p>
        </div>
      )}

      <Button
        onClick={handleOnboard}
        disabled={loading}
        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 px-4"
      >
        <CreditCard className="h-3 w-3 mr-2" />
        {loading ? t('common.loading') : cta}
      </Button>
    </div>
  );
}
