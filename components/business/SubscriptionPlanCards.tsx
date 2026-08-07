'use client';

import {
  formatMonthlyPrice,
  growthBenefitKeysForPlan,
} from '@/lib/business/subscription-comparison';
import {
  getBusinessVisibilityProfile,
  stripePlanKeyToBusinessPlanId,
  type StripeBusinessPlanId,
} from '@/lib/business/visibility-profile';
import SubscriptionWhatChangesPanel from '@/components/business/SubscriptionWhatChangesPanel';
import BusinessPlanBadge from '@/components/business/BusinessPlanBadge';
import { Button } from '@/components/ui/Button';
import { useTranslation } from '@/hooks/useTranslation';

type StripePlanKey = 'BASIC' | 'PRO' | 'PREMIUM';

export type ServerPromoQuote = {
  plan: StripePlanKey;
  basePriceCents: number;
  discountCents: number;
  finalPriceCents: number;
  currency: 'eur';
  discountDurationCycles?: number | null;
  resumesAtListPrice?: boolean;
  endsAutomatically?: boolean;
  postPromotionAction?: 'CONTINUE' | 'END';
};

type Props = {
  plans: StripePlanKey[];
  loading: StripePlanKey | null;
  planAvailability: Record<StripePlanKey, boolean | null>;
  promoCodeValid: boolean | null;
  /** Server-authoritative quotes from /api/affiliate/validate-promo-code */
  promoQuotes: Partial<Record<StripePlanKey, ServerPromoQuote>> | null;
  onSelect: (plan: StripePlanKey) => void;
  previewPlan: import('@/lib/business/visibility-profile').BusinessPlanId;
  onPreviewPlan: (plan: import('@/lib/business/visibility-profile').BusinessPlanId) => void;
  currentPlan?: import('@/lib/business/visibility-profile').BusinessPlanId;
};

function planIdFromKey(key: StripePlanKey): StripeBusinessPlanId {
  return stripePlanKeyToBusinessPlanId(key) as StripeBusinessPlanId;
}

function formatEuroFromCents(cents: number): string {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export default function SubscriptionPlanCards({
  plans,
  loading,
  planAvailability,
  promoCodeValid,
  promoQuotes,
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

        const quote =
          promoCodeValid && promoQuotes?.[key] ? promoQuotes[key] : null;
        const hasDiscount = !!quote && quote.discountCents > 0;
        const isFree = !!quote && quote.finalPriceCents === 0;

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
            <h2 className="text-xl font-semibold text-gray-900">
              {t(`business.dna.plan.${planId}`)}
            </h2>
            <p className="mt-1 text-xs text-gray-600">{t(dna.purposeKey)}</p>

            <div className="my-4">
              {hasDiscount ? (
                <div>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-xl font-bold text-gray-400 line-through">
                      {formatEuroFromCents(quote!.basePriceCents)}
                    </p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {isFree ? '€0' : formatEuroFromCents(quote!.finalPriceCents)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-emerald-600">
                    {t('business.dna.perMonth')}
                    {isFree ? ' · 100% korting' : ` · −${formatEuroFromCents(quote!.discountCents)}`}
                  </p>
                  {quote!.discountDurationCycles != null && quote!.discountDurationCycles > 0 ? (
                    <p className="mt-2 text-xs text-gray-700">
                      Eerste {quote!.discountDurationCycles}{' '}
                      {quote!.discountDurationCycles === 1 ? 'maand' : 'maanden'}:{' '}
                      <strong>{isFree ? 'FREE / €0' : formatEuroFromCents(quote!.finalPriceCents)}</strong>
                      {quote!.endsAutomatically || quote!.postPromotionAction === 'END' ? (
                        <>
                          <br />
                          Daarna eindigt het abonnement automatisch na de
                          promotieperiode.
                          <br />
                          <span className="text-gray-500">
                            Subscription ends automatically after the promotional
                            period. No further charges.
                          </span>
                        </>
                      ) : quote!.resumesAtListPrice !== false ? (
                        <>
                          <br />
                          Daarna: {formatEuroFromCents(quote!.basePriceCents)} / maand
                          tot je opzegt.
                          <br />
                          <span className="text-gray-500">
                            After that: {formatEuroFromCents(quote!.basePriceCents)}
                            /month until cancelled.
                          </span>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatMonthlyPrice(planId)}
                  </p>
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
              <p className="mb-2 text-center text-xs text-red-600">
                {t('business.dna.unavailable')}
              </p>
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
                  : isFree
                    ? `Activeer ${t(`business.dna.plan.${planId}`)} gratis`
                    : t('business.dna.choosePlan', {
                        plan: t(`business.dna.plan.${planId}`),
                      })}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
