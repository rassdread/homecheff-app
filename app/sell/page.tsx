
'use client';
import React from "react";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { useTranslation } from '@/hooks/useTranslation';
import SubscriptionComparisonTable from '@/components/business/SubscriptionComparisonTable';
import SubscriptionPlanCards from '@/components/business/SubscriptionPlanCards';
import SubscriptionLivePreview from '@/components/business/SubscriptionLivePreview';
import BusinessDnaProductPreview from '@/components/business/BusinessDnaProductPreview';
import SubscriptionWhatChangesPanel, {
  SubscriptionLockedFeatures,
} from '@/components/business/SubscriptionWhatChangesPanel';
import { getBusinessVisibilityProfile, type BusinessPlanId } from '@/lib/business/visibility-profile';

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

  const stripePlans = ['BASIC', 'PRO', 'PREMIUM'] as const;

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
        stripePlans={stripePlans}
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
  stripePlans,
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
  stripePlans: readonly Plan[];
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
  const individualDna = getBusinessVisibilityProfile('individual');
  const [previewPlan, setPreviewPlan] = useState<BusinessPlanId>('basic');
  const [currentPlan, setCurrentPlan] = useState<BusinessPlanId>('individual');
  const params = useSearchParams();
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationHandled, setConfirmationHandled] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/seller/dashboard/stats?period=30d');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.businessPlan) {
          setCurrentPlan(data.businessPlan as BusinessPlanId);
          setPreviewPlan(data.businessPlan as BusinessPlanId);
        }
      } catch {
        /* guest or no seller profile */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <h1 className="text-3xl font-bold mb-6 text-center">{t('sell.pageTitle') || 'Verkopen op HomeCheff'}</h1>

      {/* Primary path for individual sellers: free listing / create flow */}
      <div className="mb-10 max-w-2xl mx-auto rounded-2xl border-2 border-primary-brand/30 bg-primary-50/50 p-5 sm:p-6 text-center shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {t('sell.freeTitle') || 'Als particulier plaats en verkoop je gratis'}
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4 max-w-xl mx-auto">
          {t('sell.freeBody') || 'Plaats je maaltijden, oogst, creaties of een dienst zonder abonnement. Je betaalt alleen een kleine fee per verkoop.'}
        </p>
        <Button onClick={() => router.push('/sell/new')} className="w-full sm:w-auto">
          {t('sell.freeCta') || 'Gratis iets plaatsen'}
        </Button>
      </div>

      <div className="mb-6 max-w-2xl mx-auto text-center border-t border-gray-200 pt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('business.dna.growthTitle')}
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
          {t('business.dna.growthSubtitle')}
        </p>
      </div>

      <div className="mb-8 max-w-3xl mx-auto rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5 text-sm text-gray-800 text-left space-y-3 shadow-sm">
        <p className="leading-relaxed font-medium text-gray-900">{t('business.dna.growthPitch')}</p>
        <ul className="grid gap-2 sm:grid-cols-2 text-gray-700">
          <li>✓ {t('business.dna.pillar.visibility')}</li>
          <li>✓ {t('business.dna.pillar.trust')}</li>
          <li>✓ {t('business.dna.pillar.customers')}</li>
          <li>✓ {t('business.dna.pillar.automation')}</li>
        </ul>
        <p className="text-xs text-gray-600 border-t border-emerald-100 pt-3">
          {t('business.dna.commissionNote', { percent: individualDna.commissionPercent })}{' '}
          {t('sell.buyersNoSubscription')}
        </p>
      </div>

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

      <div className="mb-10 grid gap-6 lg:grid-cols-2">
        <SubscriptionLivePreview plan={previewPlan} onPlanChange={setPreviewPlan} />
        <div className="space-y-4">
          <SubscriptionWhatChangesPanel targetPlan={previewPlan} fromPlan={currentPlan} />
          <SubscriptionLockedFeatures plan={previewPlan} />
          <BusinessDnaProductPreview plan={previewPlan} />
        </div>
      </div>

      <SubscriptionPlanCards
        plans={[...stripePlans]}
        loading={loading}
        planAvailability={planAvailability}
        promoCodeValid={promoCodeValid}
        promoCodeData={promoCodeData}
        onSelect={start}
        previewPlan={previewPlan}
        onPreviewPlan={setPreviewPlan}
        currentPlan={currentPlan}
      />

      <div className="mt-12 max-w-5xl mx-auto">
        <h2 className="mb-2 text-center text-xl font-bold text-gray-900">
          {t('business.dna.compare.title')}
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600 max-w-2xl mx-auto">
          {t('business.dna.compare.subtitle')}
        </p>
        <SubscriptionComparisonTable />
      </div>
    </main>
  );
}
