'use client';

import {
  formatMonthlyPrice,
  growthBenefitKeysForPlan,
} from '@/lib/business/subscription-comparison';
import {
  getBusinessVisibilityProfile,
  stripePlanKeyToBusinessPlanId,
  type BusinessPlanId,
  type StripeBusinessPlanId,
} from '@/lib/business/visibility-profile';
import SubscriptionWhatChangesPanel from '@/components/business/SubscriptionWhatChangesPanel';
import BusinessPlanBadge from '@/components/business/BusinessPlanBadge';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

type StripePlanKey = 'BASIC' | 'PRO' | 'PREMIUM';

type Props = {
  plans: StripePlanKey[];
  loading: StripePlanKey | null;
  planAvailability: Record<StripePlanKey, boolean | null>;
  promoCodeValid: boolean | null;
  promoCodeData: { discountSharePct: number; hasL2: boolean } | null;
  onSelect: (plan: StripePlanKey) => void;
  previewPlan: import('@/lib/business/visibility-profile').BusinessPlanId;
  onPreviewPlan: (plan: import('@/lib/business/visibility-profile').BusinessPlanId) => void;
  currentPlan?: import('@/lib/business/visibility-profile').BusinessPlanId;
};

function planIdFromKey(key: StripePlanKey): StripeBusinessPlanId {
  return stripePlanKeyToBusinessPlanId(key) as StripeBusinessPlanId;
}

export default function SubscriptionPlanCards({
  plans,
  loading,
  planAvailability,
  promoCodeValid,
  promoCodeData,
  onSelect,
  previewPlan,
  onPreviewPlan,
  currentPlan = 'individual',
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {plans.map((key) => {
        const planId = planIdFromKey(key);
        const dna = getBusinessVisibilityProfile(planId);
        const isAvailable = planAvailability[key];
        const isLoading = loading === key;
        const isDisabled = isLoading || isAvailable === false;
        const isHighlight = planId === 'pro';
        const isPreviewing = previewPlan === planId;
        const benefits = growthBenefitKeysForPlan(planId);

        const basePriceCents = dna.monthlyPriceCents;
        let displayPrice = basePriceCents / 100;
        let discountAmount = 0;

        if (promoCodeValid && promoCodeData && basePriceCents > 0) {
          const affiliateCommission = displayPrice * 0.5;
          discountAmount = Math.round(affiliateCommission * (promoCodeData.discountSharePct / 100));
          displayPrice = displayPrice - discountAmount;
        }

        return (
          <div
            key={key}
            onMouseEnter={() => onPreviewPlan(planId)}
            onFocus={() => onPreviewPlan(planId)}
            className={`flex flex-col rounded-2xl border p-6 text-center shadow-sm transition-all ${
              isHighlight
                ? 'border-primary-brand bg-primary-50/40 shadow-lg'
                : 'bg-white'
            } ${isPreviewing ? 'ring-2 ring-emerald-500 border-emerald-400' : 'border-gray-200'} ${
              isAvailable === false ? 'opacity-60' : ''
            }`}
          >
            <div className="mb-2 flex justify-center">
              <BusinessPlanBadge plan={planId} t={t} size="md" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{t(`business.dna.plan.${planId}`)}</h2>
            <p className="mt-1 text-xs text-gray-600">{t(dna.purposeKey)}</p>

            <div className="my-4">
              {promoCodeValid && discountAmount > 0 ? (
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xl font-bold text-gray-400 line-through">
                      {formatMonthlyPrice(planId)}
                    </p>
                    <p className="text-3xl font-bold text-emerald-600">€{displayPrice}</p>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600">{t('business.dna.perMonth')}</p>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">{formatMonthlyPrice(planId)}</p>
                  <p className="text-xs text-gray-500">{t('business.dna.perMonth')}</p>
                </>
              )}
            </div>

            <p className="mb-4 text-xs text-gray-500">
              {t('business.dna.commissionNote', { percent: dna.commissionPercent })}
            </p>

            <ul className="mb-4 w-full space-y-2 text-left text-sm text-gray-700">
              {benefits.map((benefitKey) => (
                <li key={benefitKey} className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-emerald-600">✓</span>
                  <span>{t(benefitKey)}</span>
                </li>
              ))}
            </ul>

            <SubscriptionWhatChangesPanel
              targetPlan={planId}
              fromPlan={currentPlan}
              className="mb-4 text-left"
            />

            {isAvailable === false && (
              <p className="mb-2 text-center text-xs text-red-600">{t('business.dna.unavailable')}</p>
            )}

            <Button
              onClick={() => onSelect(key)}
              disabled={isDisabled}
              className="mt-auto w-full"
            >
              {isLoading
                ? t('common.loading')
                : isAvailable === false
                  ? t('business.dna.unavailable')
                  : t('business.dna.choosePlan', { plan: t(`business.dna.plan.${planId}`) })}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
