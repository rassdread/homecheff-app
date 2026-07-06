'use client';

import Link from 'next/link';
import { Award, Flame, Target, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { GrowthProfileModulePlan } from '@/lib/discovery/growth/growth-surface-contract';
import OpportunityEconomyCard from './OpportunityEconomyCard';

export type GrowthProgressProfileModuleProps = {
  plan: GrowthProfileModulePlan;
  className?: string;
};

/**
 * Profile Growth & Progress module — Phase 3M.
 */
export default function GrowthProgressProfileModule({
  plan,
  className = '',
}: GrowthProgressProfileModuleProps) {
  const { t } = useTranslation();

  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
      data-profile-section="growth_progress"
    >
      <h3 className="text-sm font-semibold text-gray-900 mb-3">
        {t('growth.surfaces.profile.title')}
      </h3>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-xl bg-sky-50 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-sky-700 shrink-0" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {t(plan.currentLevel.titleKey)}
            </p>
            <p className="text-xs text-gray-600">
              {t('growth.surfaces.profile.levelProgress', {
                percent: String(plan.currentLevel.progressToNext),
              })}
            </p>
          </div>
        </div>

        {plan.primaryStreak?.active ? (
          <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2">
            <Flame className="h-4 w-4 text-orange-600 shrink-0" aria-hidden />
            <p className="text-sm text-gray-800">
              {t('growth.surfaces.streak.weeks', {
                count: String(plan.primaryStreak.currentWeeks),
              })}
            </p>
          </div>
        ) : null}

        {plan.nextMilestone && !plan.nextMilestone.completed ? (
          <div className="rounded-xl border border-violet-100 bg-violet-50/50 px-3 py-2">
            <p className="text-xs font-semibold text-violet-800">
              {t('growth.surfaces.milestone.next')}
            </p>
            <p className="text-sm text-gray-700 mt-0.5">
              {plan.nextMilestone.current}/{plan.nextMilestone.target}
            </p>
          </div>
        ) : null}

        {plan.activeOpportunities.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              {t('growth.surfaces.profile.opportunities')}
            </p>
            <div className="flex flex-col gap-2">
              {plan.activeOpportunities.map((opp) => (
                <OpportunityEconomyCard
                  key={opp.instanceId}
                  contract={opp}
                  t={t}
                  surface="profile_growth"
                  compact
                />
              ))}
            </div>
          </div>
        ) : null}

        {plan.recentAchievements.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              {t('growth.surfaces.profile.achievements')}
            </p>
            <ul className="space-y-1">
              {plan.recentAchievements.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <Award className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden />
                  {t(a.labelKey)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {plan.recommendedActions.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">
              {t('growth.surfaces.profile.actions')}
            </p>
            <div className="flex flex-col gap-2">
              {plan.recommendedActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-2 hover:bg-emerald-50"
                >
                  <Target className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden />
                  <span className="text-sm font-medium text-gray-900">
                    {t(action.titleKey)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
