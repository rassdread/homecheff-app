'use client';

import { publicPlanFacts } from '@/lib/business/plan-presentation';
import {
  listBusinessPlanIds,
  type BusinessPlanId,
} from '@/lib/business/visibility-profile';
import { useTranslation } from '@/hooks/useTranslation';

type Props = {
  plan: BusinessPlanId;
  onPlanChange: (plan: BusinessPlanId) => void;
  className?: string;
};

export default function SubscriptionLivePreview({ plan, onPlanChange, className = '' }: Props) {
  const { t, language } = useTranslation();
  const facts = publicPlanFacts(language === 'en' ? 'en' : 'nl');
  const fact = facts.find((row) => row.id === plan) ?? facts[0];
  const plans = listBusinessPlanIds();
  const feeLabel = language === 'en' ? 'Platform fee' : 'Platformfee';

  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
      aria-live="polite"
      data-dna-preview-plan={plan}
    >
      <h2 className="text-lg font-bold text-gray-900">{t('business.dna.preview.liveTitle')}</h2>
      <p className="mt-1 text-sm text-gray-600">{t('business.dna.preview.liveSubtitle')}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {plans.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onPlanChange(id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              plan === id
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t(`business.dna.plan.${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-800">
        <p className="font-semibold text-gray-900">{fact.name}</p>
        <p className="mt-1">{fact.priceLabel}</p>
        <p className="mt-1">
          {feeLabel}: {fact.commissionPercent}%
        </p>
        <p className="mt-2">{fact.sponsored}</p>
      </div>
    </section>
  );
}
