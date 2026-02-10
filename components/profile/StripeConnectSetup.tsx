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
  stripeConnectAccountId, 
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
      console.log('🔍 Starting Stripe Connect onboarding...');
      const response = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse response:', parseError);
        setError(t('admin.stripeError'));
        return;
      }

      console.log('📥 Response:', { ok: response.ok, status: response.status, data });
      
      // Log full error details for debugging (visible in browser console)
      if (!response.ok) {
        console.error('❌ Full error response:', JSON.stringify(data, null, 2));
        console.error('❌ Error details:', {
          status: response.status,
          statusText: response.statusText,
          error: data?.error,
          details: data?.details,
          stripeErrorCode: data?.stripeErrorCode,
          stripeErrorType: data?.stripeErrorType
        });
      }

      if (!response.ok) {
        // Don't show technical details or links to Stripe Dashboard
        const errorMsg = data?.error || data?.message || 'Er is een fout opgetreden. Probeer het later opnieuw.';
        console.error('❌ Error message:', errorMsg);
        setError(errorMsg);
        return;
      }

      if (data.onboardingUrl) {
        // Redirect naar Stripe onboarding
        console.log('✅ Redirecting to Stripe onboarding:', data.onboardingUrl);
        window.location.href = data.onboardingUrl;
      } else if (data.success && data.message) {
        // Account already set up
        console.log('ℹ️ Account already set up');
        onUpdate(); // Refresh parent component
      } else {
        console.error('❌ No onboardingUrl in response:', data);
        setError(t('admin.stripeError'));
      }
    } catch (err) {
      console.error('❌ Exception during onboarding:', err);
        setError(t('admin.stripeSetupError'));
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
              Stripe Connect Ingesteld
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Uitbetalingen automatisch
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
            Stripe Connect Vereist
          </span>
        </div>
      </div>
      
      <p className="text-xs text-gray-600 mb-3">
        Om betalingen te ontvangen, zet je Stripe Connect op (5 minuten).
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          <p className="text-red-700 text-xs">{error}</p>
          <p className="text-red-600 text-xs mt-1">
            Neem contact op met de beheerder als dit probleem aanhoudt.
          </p>
        </div>
      )}

      <Button 
        onClick={handleOnboard}
        disabled={loading}
        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white text-sm py-2 px-4"
      >
        <CreditCard className="h-3 w-3 mr-2" />
        {loading ? 'Bezig...' : 'Stripe Connect Opzetten'}
      </Button>
    </div>
  );
}

