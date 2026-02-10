'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

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

      const data = await response.json();

      if (data.success && data.onboardingUrl) {
        // Redirect naar Stripe onboarding
        window.location.href = data.onboardingUrl;
      } else {
        setError(data.error || 'Er is een fout opgetreden');
      }
    } catch (err) {
      setError('Er is een fout opgetreden bij het opzetten van Stripe Connect');
    } finally {
      setLoading(false);
    }
  };

  if (stripeConnectOnboardingCompleted) {
    return (
      <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-2 rounded-full text-sm font-medium">
        <CheckCircle className="h-4 w-4" />
        <span>Stripe Connect actief</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-2 rounded-full text-sm font-medium">
        <AlertCircle className="h-4 w-4" />
        <span>Stripe Connect vereist</span>
      </div>
      
      <button
        onClick={handleOnboard}
        disabled={loading}
        className="inline-flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
      >
        <CreditCard className="h-3 w-3" />
        {loading ? 'Bezig...' : 'Instellen'}
      </button>
      
      {error && (
        <div className="text-red-600 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}

