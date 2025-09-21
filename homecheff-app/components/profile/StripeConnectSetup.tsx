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
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          <h3 className="text-lg font-semibold text-green-800">
            Stripe Connect Ingesteld
          </h3>
        </div>
        <p className="text-green-700 mb-4">
          Je kunt nu betalingen ontvangen via HomeCheff. Uitbetalingen gebeuren automatisch naar je opgegeven bankrekening.
        </p>
        <div className="text-sm text-green-600">
          <p>• Uitbetalingstermijn: 7 dagen (nieuwe accounts)</p>
          <p>• Automatische uitbetalingen na elke verkoop</p>
          <p>• Transparante fee structuur</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
      <div className="flex items-center mb-4">
        <AlertCircle className="h-6 w-6 text-amber-600 mr-3" />
        <h3 className="text-lg font-semibold text-amber-800">
          Stripe Connect Vereist
        </h3>
      </div>
      
      <p className="text-amber-700 mb-4">
        Om betalingen te kunnen ontvangen, moet je eerst je Stripe Connect account opzetten. 
        Dit is een eenmalige setup die 5 minuten duurt.
      </p>

      <div className="text-sm text-amber-600 mb-6">
        <p>• Veilige betalingsverwerking via Stripe</p>
        <p>• Automatische uitbetalingen naar je bankrekening</p>
        <p>• Transparante fee structuur (12% voor particulieren)</p>
        <p>• Geen maandelijkse kosten</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <Button 
        onClick={handleOnboard}
        disabled={loading}
        className="bg-amber-600 hover:bg-amber-700 text-white"
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {loading ? 'Bezig...' : 'Stripe Connect Opzetten'}
      </Button>
    </div>
  );
}



