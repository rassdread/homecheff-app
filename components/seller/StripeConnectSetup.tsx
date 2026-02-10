'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { CheckCircle, AlertCircle, ExternalLink, CreditCard, Shield, Euro } from 'lucide-react';

interface StripeConnectStatus {
  hasAccount: boolean;
  isCompleted: boolean;
  accountId?: string;
}

export default function StripeConnectSetup() {
  const [status, setStatus] = useState<StripeConnectStatus>({
    hasAccount: false,
    isCompleted: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/stripe/connect/onboard');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  };

  const startOnboarding = async () => {
    setIsLoading(true);
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
        setError('Er is een probleem opgetreden. Probeer het later opnieuw.');
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
        const errorMsg = data?.error || data?.message || 'Er is een probleem opgetreden. Probeer het later opnieuw.';
        console.error('❌ Error message:', errorMsg);
        setError(errorMsg);
        return;
      }

      // Check for onboardingUrl in response
      if (data.onboardingUrl) {
        console.log('✅ Redirecting to Stripe onboarding:', data.onboardingUrl);
        window.location.href = data.onboardingUrl;
      } else if (data.success && data.message) {
        // Account already set up
        console.log('ℹ️ Account already set up');
        await checkStatus(); // Refresh status
      } else {
        console.error('❌ No onboardingUrl in response:', data);
        setError('Er is een probleem opgetreden. Probeer het later opnieuw.');
      }

    } catch (error: any) {
      console.error('❌ Exception during onboarding:', error);
      setError(error.message || 'Er is een probleem opgetreden. Probeer het later opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status.isCompleted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              Stripe Connect is geconfigureerd
            </h3>
            <p className="text-green-600">
              Je kunt nu betalingen ontvangen via Stripe
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <CreditCard className="h-8 w-8 text-blue-600" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Stripe Connect Setup
          </h3>
          <p className="text-gray-600 mb-4">
            Configureer je uitbetalingen om betalingen te kunnen ontvangen van kopers.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                <div className="ml-3 flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  <p className="text-xs text-red-600 mt-2">
                    Neem contact op met de beheerder als dit probleem aanhoudt.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center text-sm text-gray-600">
              <Shield className="h-4 w-4 text-green-500 mr-2" />
              <span>Veilige betalingen</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Euro className="h-4 w-4 text-green-500 mr-2" />
              <span>Directe uitbetalingen</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>GDPR compliant</span>
            </div>
          </div>

          {/* Setup Button */}
          <Button
            onClick={startOnboarding}
            disabled={isLoading}
            className="inline-flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Bezig met laden...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Start Stripe Connect Setup
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 mt-3">
            Je wordt doorgestuurd naar Stripe om je bankgegevens en identiteit te verifiëren.
            Dit proces duurt meestal 2-3 minuten.
          </p>
        </div>
      </div>
    </div>
  );
}

