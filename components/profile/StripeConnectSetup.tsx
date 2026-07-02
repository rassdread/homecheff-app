'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface StripeConnectSetupProps {
  stripeConnectAccountId?: string | null;
  stripeConnectOnboardingCompleted?: boolean;
  onUpdate: () => void;
}

export default function StripeConnectSetup({ 
  stripeConnectOnboardingCompleted,
  onUpdate 
}: StripeConnectSetupProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOnboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      let data;
      try {
        data = await response.json();
      } catch {
        setError(t('productOrder.payments.setupError'));
        return;
      }

      if (!response.ok) {
        setError(data?.error || data?.message || t('productOrder.payments.setupError'));
        return;
      }

      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else if (data.success && data.message) {
        onUpdate();
      } else {
        setError(t('productOrder.payments.setupError'));
      }
    } catch {
      setError(t('productOrder.payments.setupError'));
    } finally {
      setLoading(false);
    }
  };

  if (stripeConnectOnboardingCompleted) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              {t('productOrder.payments.readyTitle')}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {t('productOrder.payments.readySubtitle')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-gray-700">
            {t('productOrder.payments.setupTitle')}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-2">
        {t('productOrder.payments.setupIntro')}
      </p>
      <p className="text-xs text-gray-500 mb-3">
        {t('productOrder.payments.setupContactHint')}
      </p>

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
        {loading ? t('common.loading') : t('productOrder.payments.setupCta')}
      </Button>
    </div>
  );
}
