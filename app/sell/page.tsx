
'use client';
import React from "react";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';

type Plan = 'BASIC' | 'PRO' | 'PREMIUM';

export default function SellPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inlineSuccess, setInlineSuccess] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState<string>('');
  const [promoCodeValid, setPromoCodeValid] = useState<boolean | null>(null);
  const [promoCodeError, setPromoCodeError] = useState<string | null>(null);
  const [validatingPromoCode, setValidatingPromoCode] = useState(false);
  const [promoCodeData, setPromoCodeData] = useState<{ discountSharePct: number; hasL2: boolean } | null>(null);
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

      // Validate promo code if provided
      let finalPromoCode = promoCode.trim() || undefined;
      if (finalPromoCode) {
        const validatePromoRes = await fetch('/api/affiliate/validate-promo-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: finalPromoCode }),
        });
        const validatePromoData = await validatePromoRes.json();
        if (!validatePromoData.valid) {
          setError(validatePromoData.error || 'Ongeldige promo code');
          setLoading(null);
          return;
        }
      }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, userId, promoCode: finalPromoCode }),
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
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        promoCodeValid={promoCodeValid}
        setPromoCodeValid={setPromoCodeValid}
        promoCodeError={promoCodeError}
        setPromoCodeError={setPromoCodeError}
        validatingPromoCode={validatingPromoCode}
        setValidatingPromoCode={setValidatingPromoCode}
        promoCodeData={promoCodeData}
        setPromoCodeData={setPromoCodeData}
      />
    </React.Suspense>
  );
}

// Verwijderd: dubbele declaratie SellPageContent
function SellPageContent({ 
  plans, 
  loading, 
  router, 
  start, 
  error, 
  planAvailability, 
  inlineSuccessMessage,
  promoCode,
  setPromoCode,
  promoCodeValid,
  setPromoCodeValid,
  promoCodeError,
  setPromoCodeError,
  validatingPromoCode,
  setValidatingPromoCode,
  promoCodeData,
  setPromoCodeData,
}: {
  plans: { key: Plan; title: string; price: string; fee: string; perks: string[]; highlight?: boolean }[];
  loading: Plan | null;
  router: any;
  start: (plan: Plan) => void;
  error: string | null;
  planAvailability: Record<Plan, boolean | null>;
  inlineSuccessMessage: string | null;
  promoCode: string;
  setPromoCode: (code: string) => void;
  promoCodeValid: boolean | null;
  setPromoCodeValid: (valid: boolean | null) => void;
  promoCodeError: string | null;
  setPromoCodeError: (error: string | null) => void;
  validatingPromoCode: boolean;
  setValidatingPromoCode: (validating: boolean) => void;
  promoCodeData: { discountSharePct: number; hasL2: boolean } | null;
  setPromoCodeData: (data: { discountSharePct: number; hasL2: boolean } | null) => void;
}) {
  const { t } = useTranslation();
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
            throw new Error(data.error || t('sell.confirmationFailed') || 'Bevestigen mislukt');
          }
          setSuccessMessage('🎉 Je abonnement is geactiveerd! Je kunt nu beginnen met verkopen.');
          setConfirmError(null);
        })
        .catch((err: any) => {
          setConfirmError(err.message || t('sell.cannotConfirmSubscription') || 'Kon abonnement niet bevestigen. Neem contact op met support.');
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
      <h1 className="text-3xl font-bold mb-4 text-center">{t('sell.title') || 'Zet je bedrijf op de kaart — groei met je lokale community'}</h1>
      <p className="text-center text-gray-600 mb-10">
        {t('sell.subtitle') || 'Kies het abonnement dat bij jouw bedrijf past. Transparante prijzen, maandelijks opzegbaar en zonder verborgen kosten.'}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {isConfirming && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
          {t('sell.confirmingSubscription') || 'We bevestigen je abonnement, een moment geduld...'}
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

      {/* Promo Code Input */}
      <div className="mb-8 max-w-md mx-auto">
        <label htmlFor="promo-code" className="block text-sm font-medium text-gray-700 mb-2">
          Heb je een promo code?
        </label>
        <div className="flex gap-2">
          <input
            id="promo-code"
            type="text"
            value={promoCode}
            onChange={async (e) => {
              const code = e.target.value.toUpperCase().trim();
              setPromoCode(code);
              setPromoCodeError(null);
              setPromoCodeValid(null);
              setPromoCodeData(null);

              if (code.length > 0) {
                setValidatingPromoCode(true);
                try {
                  const res = await fetch('/api/affiliate/validate-promo-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code }),
                  });
                  const data = await res.json();
                  if (data.valid) {
                    setPromoCodeValid(true);
                    setPromoCodeError(null);
                    setPromoCodeData(data.promoCode);
                  } else {
                    setPromoCodeValid(false);
                    setPromoCodeError(data.error || 'Ongeldige promo code');
                    setPromoCodeData(null);
                  }
                } catch (err) {
                  setPromoCodeValid(false);
                  setPromoCodeError('Kon promo code niet valideren');
                } finally {
                  setValidatingPromoCode(false);
                }
              }
            }}
            placeholder="Voer promo code in"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
          {validatingPromoCode && (
            <div className="flex items-center px-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
            </div>
          )}
          {promoCodeValid === true && (
            <div className="flex items-center px-4 text-green-600">
              <span className="text-sm">✓</span>
            </div>
          )}
          {promoCodeValid === false && promoCodeError && (
            <div className="flex items-center px-4 text-red-600">
              <span className="text-sm">✗</span>
            </div>
          )}
        </div>
        {promoCodeError && (
          <p className="mt-1 text-sm text-red-600">{promoCodeError}</p>
        )}
        {promoCodeValid === true && (
          <p className="mt-1 text-sm text-green-600">Promo code is geldig!</p>
        )}
      </div>

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
              {(() => {
                // Calculate price with promo code discount
                const basePrice = p.key === 'BASIC' ? 39 : p.key === 'PRO' ? 99 : 199;
                let displayPrice = basePrice;
                let discountAmount = 0;
                let originalPrice = basePrice;
                
                if (promoCodeValid && promoCodeData) {
                  // Calculate discount: affiliate gets 50% of base price, discount is percentage of that
                  const affiliateCommission = basePrice * 0.50; // 50% of base price
                  const discount = Math.round(affiliateCommission * (promoCodeData.discountSharePct / 100));
                  discountAmount = discount;
                  displayPrice = basePrice - discount;
                  originalPrice = basePrice;
                }
                
                return (
                  <>
                    {promoCodeValid && discountAmount > 0 ? (
                      <div className="mb-1">
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-xl font-bold text-gray-400 line-through">€{originalPrice}</p>
                          <p className="text-3xl font-bold text-emerald-600">€{displayPrice}</p>
                        </div>
                        <p className="text-sm text-emerald-600 font-semibold mt-1">
                          Je bespaart €{discountAmount}/maand!
                        </p>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold mb-1">{p.price}</p>
                    )}
                  </>
                );
              })()}
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
