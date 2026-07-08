'use client';

import Link from 'next/link';
import {
  computeVisibilityScore,
  growthStatusLabelKey,
  listComingSoonFeatureKeys,
  listLockedFeatureKeys,
  listUnlockedFeatureKeys,
  nextUpgradePlan,
} from '@/lib/business/dna-preview';
import {
  getBusinessVisibilityProfile,
  type BusinessPlanId,
} from '@/lib/business/visibility-profile';
import BusinessPlanBadge from '@/components/business/BusinessPlanBadge';
import BusinessDnaProductPreview from '@/components/business/BusinessDnaProductPreview';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowUpRight, Sparkles } from 'lucide-react';

type Props = {
  plan: BusinessPlanId;
  companyName?: string | null;
  sellerName?: string | null;
  className?: string;
};

export default function BusinessDnaDashboardWidget({
  plan,
  companyName,
  sellerName,
  className = '',
}: Props) {
  const { t } = useTranslation();
  const dna = getBusinessVisibilityProfile(plan);
  const score = computeVisibilityScore(dna);
  const unlocked = listUnlockedFeatureKeys(plan);
  const locked = listLockedFeatureKeys(plan);
  const comingSoon = listComingSoonFeatureKeys(plan);
  const upgrade = nextUpgradePlan(plan);

  return (
    <section
      className={`rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white p-5 shadow-sm ${className}`}
      data-business-dna-widget
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <Sparkles className="h-5 w-5 text-emerald-600" aria-hidden />
            {t('business.dna.widget.title')}
          </h2>
          <p className="mt-1 text-sm text-gray-600">{t('business.dna.widget.subtitle')}</p>
        </div>
        {plan !== 'individual' ? <BusinessPlanBadge plan={plan} t={t} size="md" /> : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/80 bg-white/90 p-3">
          <p className="text-xs text-gray-500">{t('business.dna.widget.currentPlan')}</p>
          <p className="mt-1 font-semibold text-gray-900">{t(`business.dna.plan.${plan}`)}</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/90 p-3">
          <p className="text-xs text-gray-500">{t('business.dna.widget.visibilityScore')}</p>
          <p className="mt-1 font-semibold text-emerald-700">{score}/100</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/90 p-3">
          <p className="text-xs text-gray-500">{t('business.dna.widget.commission')}</p>
          <p className="mt-1 font-semibold text-gray-900">{dna.commissionPercent}%</p>
        </div>
        <div className="rounded-xl border border-white/80 bg-white/90 p-3">
          <p className="text-xs text-gray-500">{t('business.dna.widget.growthStatus')}</p>
          <p className="mt-1 font-semibold text-gray-900">{t(growthStatusLabelKey(plan))}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t('business.dna.widget.unlocked')}</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-700">
            {unlocked.length === 0 ? (
              <li className="text-gray-500">{t('business.dna.widget.unlockedEmpty')}</li>
            ) : (
              unlocked.slice(0, 6).map((key) => (
                <li key={key} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  {t(key)}
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{t('business.dna.widget.locked')}</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {locked.length === 0 ? (
              <li className="text-gray-500">{t('business.dna.widget.lockedEmpty')}</li>
            ) : (
              locked.slice(0, 5).map((key) => (
                <li key={key} className="flex gap-2">
                  <span>○</span>
                  {t(key)}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {comingSoon.length > 0 ? (
        <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2">
          <p className="text-xs font-semibold text-violet-800">{t('business.dna.preview.comingSoonTitle')}</p>
          <p className="mt-1 text-xs text-violet-700">
            {comingSoon.map((k) => t(k)).join(' · ')}
          </p>
        </div>
      ) : null}

      {upgrade ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-700">
            {t('business.dna.widget.upgradeCta', { plan: t(`business.dna.plan.${upgrade}`) })}
          </p>
          <Link
            href="/sell"
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            {t('business.dna.widget.upgradeButton')}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : null}

      <div className="mt-6 border-t border-emerald-100 pt-4">
        <BusinessDnaProductPreview
          plan={plan}
          sellerName={sellerName ?? undefined}
          companyName={companyName}
        />
      </div>
    </section>
  );
}
