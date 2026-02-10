
'use client';
import React from "react";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

type Plan = 'BASIC' | 'PRO' | 'PREMIUM';

export default function SellPage() {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);
  const [planAvailability, setPlanAvailability] = useState<Record<Plan, boolean | null>>({
    BASIC: null,
    PRO: null,
    PREMIUM: null,
  });
  const { data: session, status } = useSession();
  const router = useRouter();

  // Business plans - alleen zichtbaar voor KVK gebruikers
  const businessPlans: { key: Plan; title: string; price: string; fee: string; perks: string[]; highlight?: boolean }[] = [
    { key: 'BASIC', title: 'Basic', price: '€39 / maand', fee: '7% platform fee', perks: ['Start voor buurtverkoop', 'Essentiële statistieken', 'Community support'] },
    { key: 'PRO', title: 'Pro', price: '€99 / maand', fee: '4% platform fee', perks: ['Uitgelichte zichtbaarheid', 'Premium statistieken', 'Voorrang bij support'], highlight: true },
    { key: 'PREMIUM', title: 'Premium', price: '€199 / maand', fee: '2% platform fee', perks: ['Toppositie in zoekresultaten', 'Eigen accountmanager', 'Marketingcampagnes op maat'] },
  ];

  // Validate plan availability on mount
  useEffect(() => {
    if (status === 'authenticated') {
      const plans: Plan[] = ['BASIC', 'PRO', 'PREMIUM'];
      plans.forEach(plan => {
        fetch(`/api/subscribe/validate?plan=${plan}`)
          .then(res => res.json())
          .then(data => {
            setPlanAvailability(prev => ({
              ...prev,
              [plan]: data.valid === true
            }));
          })
          .catch(() => {
            setPlanAvailability(prev => ({
              ...prev,
              [plan]: false
            }));
          });
      });
    }
  }, [status]);

  async function start(plan: Plan) {
    setError(null);
    setInlineSuccess(null);

    setLoading(plan);
    
    try {
      const userId = (session as any)?.user?.id;
      if (!userId) {
        router.push('/api/auth/signin');
        return;
      }

      // Validate plan first
      const validateRes = await fetch(`/api/subscribe/validate?plan=${plan}`);
      const validateData = await validateRes.json();
      
      if (!validateData.valid) {
        setError(validateData.error || `Abonnement ${plan} is niet beschikbaar. Neem contact op met support.`);
        setLoading(null);
        return;
      }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId }),
      });
      
      const data = await res.json();
      
      if (data?.error) {
        setError(data.error);
        setLoading(null);
        return;
      }

      if (data?.ok) {
        const message =
          data.message ??
          `Abonnement bijgewerkt naar ${plan}. Stripe verrekent eventuele verschillen automatisch.`;
        setInlineSuccess(message);
        setLoading(null);
        router.refresh();
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Kon geen betalingssessie starten. Probeer het opnieuw.');
        setLoading(null);
      }
    } catch (err: any) {
      setError(err.message || 'Er ging iets mis. Probeer het opnieuw.');
      setLoading(null);
    }
  }
  return (
    <React.Suspense fallback={null}>
      <SellPageContent
        plans={businessPlans}
        loading={loading}
        router={router}
        start={start}
        error={error}
        inlineSuccessMessage={inlineSuccess}
        planAvailability={planAvailability}
      />
    </React.Suspense>
  );
}

// Verwijderd: dubbele declaratie SellPageContent
function SellPageContent({ plans, loading, router, start, error, planAvailability, inlineSuccessMessage }: {
  plans: { key: Plan; title: string; price: string; fee: string; perks: string[]; highlight?: boolean }[];
  loading: Plan | null;
  router: any;
  start: (plan: Plan) => void;
  error: string | null;
  planAvailability: Record<Plan, boolean | null>;
  inlineSuccessMessage: string | null;
}) {
  const params = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationHandled, setConfirmationHandled] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    const success = params?.get('success');
    const sessionId = params?.get('session_id');

    if (success === '1' && sessionId && !confirmationHandled && !isConfirming) {
      setIsConfirming(true);
      fetch('/api/subscribe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Bevestigen mislukt');
          }
          setSuccessMessage('🎉 Je abonnement is geactiveerd! Je kunt nu beginnen met verkopen.');
          setConfirmError(null);
        })
        .catch((err: any) => {
          setConfirmError(err.message || 'Kon abonnement niet bevestigen. Neem contact op met support.');
        })
        .finally(() => {
          setIsConfirming(false);
          setConfirmationHandled(true);
          router.replace('/sell');
        });
    } else if (success === '1' && !sessionId && !confirmationHandled) {
      setSuccessMessage('Betaling ontvangen! We verwerken je abonnement.');
      setConfirmationHandled(true);
      router.replace('/sell');
    }
  }, [params, router, confirmationHandled, isConfirming]);
  
  return (
    <main className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Zet je bedrijf op de kaart — groei met je lokale community</h1>
      <p className="text-center text-gray-600 mb-10">
        Kies het abonnement dat bij jouw bedrijf past. Transparante prijzen, maandelijks opzegbaar en zonder verborgen kosten.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {isConfirming && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          We bevestigen je abonnement, een moment geduld...
        </div>
      )}

      {inlineSuccessMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {inlineSuccessMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {successMessage}
        </div>
      )}

      {confirmError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {confirmError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isAvailable = planAvailability[p.key];
          const isLoading = loading === p.key;
          const isDisabled = isLoading || isAvailable === false;
          
          return (
            <div
              key={p.key}
              className={`rounded-2xl border shadow-sm p-6 flex flex-col items-center text-center transition-all ${
                p.highlight ? 'border-primary-brand shadow-lg bg-primary-50/40' : 'bg-white'
              } ${isAvailable === false ? 'opacity-60' : ''}`}
            >
              <h2 className="text-xl font-semibold mb-2">{p.title}</h2>
              <p className="text-3xl font-bold mb-1">{p.price}</p>
              <p className="text-sm text-gray-600 mb-4">{p.fee}</p>
              <ul className="text-sm text-gray-700 space-y-1 mb-6 w-full">
                {p.perks.map((x) => (
                  <li key={x} className="flex items-start gap-2 justify-center">
                    <span className="mt-1 text-primary-brand">•</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              
              {isAvailable === false && (
                <p className="text-xs text-red-600 mb-2 text-center">
                  Niet beschikbaar
                </p>
              )}
              
              <Button 
                onClick={() => start(p.key)} 
                disabled={isDisabled} 
                className="mt-auto w-full"
              >
                {isLoading
                  ? 'Bezig...'
                  : isAvailable === false
                    ? 'Niet beschikbaar'
                    : 'Kies ' + p.title}
              </Button>
            </div>
          );
        })}
      </div>
    </main>
  );
}
