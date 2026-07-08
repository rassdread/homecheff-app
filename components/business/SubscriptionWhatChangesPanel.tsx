'use client';

import {
  computeUpgradeDelta,
  listComingSoonFeatureKeys,
  listImmediateUpgradeBenefits,
  type DnaFeatureItem,
} from '@/lib/business/dna-preview';
import type { BusinessPlanId } from '@/lib/business/visibility-profile';
import { useTranslation } from '@/hooks/useTranslation';
import { Lock } from 'lucide-react';

type Props = {
  targetPlan: BusinessPlanId;
  /** When set, show delta from this plan instead of individual. */
  fromPlan?: BusinessPlanId;
  className?: string;
};

function FeatureList({
  items,
  t,
  prefix,
}: {
  items: DnaFeatureItem[];
  t: (k: string) => string;
  prefix: '+' | '✓';
}) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1.5 text-sm text-gray-800">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-2">
          <span className="mt-0.5 shrink-0 text-emerald-600">{prefix}</span>
          <span>
            {t(item.key)}
            {item.comingSoon ? (
              <span className="ml-1.5 text-xs font-medium text-violet-600">
                ({t('business.dna.status.future')})
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function SubscriptionWhatChangesPanel({
  targetPlan,
  fromPlan,
  className = '',
}: Props) {
  const { t } = useTranslation();
  const base = fromPlan ?? 'individual';
  const items =
    base === 'individual'
      ? listImmediateUpgradeBenefits(targetPlan)
      : computeUpgradeDelta(base, targetPlan);

  if (targetPlan === 'individual' || items.length === 0) {
    return (
      <div className={`rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 ${className}`}>
        {targetPlan === 'individual'
          ? t('business.dna.preview.individualNote')
          : t('business.dna.preview.noChanges')}
      </div>
    );
  }

  return (
    <section className={`rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">
        {t('business.dna.preview.whatChangesTitle')}
      </h3>
      <p className="mt-1 text-xs text-gray-600">
        {fromPlan && fromPlan !== 'individual'
          ? t('business.dna.preview.deltaFrom', {
              from: t(`business.dna.plan.${fromPlan}`),
              to: t(`business.dna.plan.${targetPlan}`),
            })
          : t('business.dna.preview.whatChangesSubtitle')}
      </p>
      <div className="mt-3">
        <FeatureList items={items} t={t} prefix="✓" />
      </div>
    </section>
  );
}

export function SubscriptionUpgradeDelta({
  fromPlan,
  toPlan,
  className = '',
}: {
  fromPlan: BusinessPlanId;
  toPlan: BusinessPlanId;
  className?: string;
}) {
  const { t } = useTranslation();
  const items = computeUpgradeDelta(fromPlan, toPlan);
  if (items.length === 0) return null;

  return (
    <section className={`rounded-xl border border-blue-100 bg-blue-50/60 p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-900">
        {t('business.dna.preview.upgradeDeltaTitle', {
          from: t(`business.dna.plan.${fromPlan}`),
          to: t(`business.dna.plan.${toPlan}`),
        })}
      </h3>
      <div className="mt-2">
        <FeatureList items={items} t={t} prefix="+" />
      </div>
    </section>
  );
}

export function SubscriptionLockedFeatures({
  plan,
  className = '',
}: {
  plan: BusinessPlanId;
  className?: string;
}) {
  const { t } = useTranslation();
  const coming = listComingSoonFeatureKeys(plan);
  if (coming.length === 0) return null;

  return (
    <section className={`rounded-xl border border-violet-100 bg-violet-50/40 p-4 ${className}`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Lock className="h-4 w-4 text-violet-600" aria-hidden />
        {t('business.dna.preview.comingSoonTitle')}
      </h3>
      <ul className="mt-2 space-y-1 text-sm text-gray-700">
        {coming.map((key) => (
          <li key={key}>• {t(key)}</li>
        ))}
      </ul>
    </section>
  );
}
