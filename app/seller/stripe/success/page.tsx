'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function StripeConnectSuccess() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Check if onboarding was completed
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/stripe/connect/onboard');
        const data = await response.json();

        if (data.isCompleted) {
          setStatus('success');
          setMessage('Stripe Connect is succesvol geconfigureerd! Je kunt nu betalingen ontvangen.');
        } else {
          setStatus('error');
          setMessage('Stripe Connect setup is niet voltooid. Probeer het opnieuw.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Er is een fout opgetreden bij het controleren van je status.');
      }
    };

    checkStatus();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Bezig met controleren van je Stripe Connect status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'success' ? (
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        ) : (
          <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        )}

        <h1 className={`text-2xl font-bold mb-4 ${
          status === 'success' ? 'text-green-800' : 'text-red-800'
        }`}>
          {status === 'success' ? 'Setup Voltooid!' : 'Setup Onvoltooid'}
        </h1>

        <p className="text-gray-600 mb-6">
          {message}
        </p>

        <Button
          onClick={() => router.push('/verkoper/dashboard')}
          className="w-full inline-flex items-center justify-center"
        >
          Ga naar Dashboard
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

