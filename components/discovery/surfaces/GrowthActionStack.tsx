'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Flame,
  MapPin,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import { visibleGrowthStackSlots } from '@/lib/discovery/growth/growth-sidebar-integration';
import OpportunityEconomyCard from './OpportunityEconomyCard';

export type GrowthActionStackProps = {
  plan: ResolvedSurfacePlan | null;
  className?: string;
};

/**
 * Unified desktop growth stack — Phase 3M.
 * Order: action → opportunity → progress → streak → milestone → achievement → HCP.
 */
export default function GrowthActionStack({
  plan,
  className = '',
}: GrowthActionStackProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  const slots = useMemo(
    () => visibleGrowthStackSlots(plan?.growthSurfaces?.desktopStack ?? []),
    [plan?.growthSurfaces?.desktopStack],
  );

  if (slots.length === 0) return null;

  const dismiss = (key: string) =>
    setDismissed((prev) => ({ ...prev, [key]: true }));

  return (
    <div className={className} data-surface-stack="growth-action">
      {slots.map((slot) => {
        if (dismissed[slot.slotId]) return null;

        switch (slot.slotId) {
          case 'current_action':
            if (!slot.currentAction) return null;
            return (
              <article
                key={slot.slotId}
                className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm"
                data-growth-slot={slot.slotId}
              >
                <button
                  type="button"
                  onClick={() => dismiss(slot.slotId)}
                  className="absolute right-2 top-2 rounded-full p-1.5 text-gray-400 hover:bg-white/80 hover:text-gray-600"
                  aria-label={t('buttons.close')}
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex gap-3 pr-8">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Target className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      {t('growth.surfaces.currentAction.label')}
                    </p>
                    <h3 className="text-base font-bold leading-snug text-gray-900">
                      {t(slot.currentAction.titleKey)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {t(slot.currentAction.descriptionKey)}
                    </p>
                    <Link
                      href={slot.currentAction.href}
                      className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      {t('growth.surfaces.currentAction.cta')}
                    </Link>
                  </div>
                </div>
              </article>
            );

          case 'opportunity':
            if (!slot.opportunity) return null;
            return (
              <div key={slot.slotId} data-growth-slot={slot.slotId}>
                <OpportunityEconomyCard
                  contract={slot.opportunity}
                  t={t}
                  surface="desktop_sidebar_growth"
                  onDismiss={() => dismiss(slot.slotId)}
                />
              </div>
            );

          case 'progress':
            if (!slot.progress) return null;
            return (
              <article
                key={slot.slotId}
                className="rounded-2xl border border-sky-200/80 bg-sky-50/60 px-4 py-3"
                data-growth-slot={slot.slotId}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-sky-700" aria-hidden />
                  <p className="text-sm font-semibold text-gray-900">
                    {t(slot.progress.level.titleKey)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {t('growth.surfaces.progress.milestones', {
                    count: String(slot.progress.milestonesCompleted),
                  })}
                </p>
              </article>
            );

          case 'current_streak':
            if (!slot.streak) return null;
            return (
              <article
                key={slot.slotId}
                className="rounded-2xl border border-orange-200/80 bg-orange-50/60 px-4 py-3"
                data-growth-slot={slot.slotId}
              >
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-600" aria-hidden />
                  <p className="text-sm font-semibold text-gray-900">
                    {t(slot.streak.kind === 'weekly_helper'
                      ? 'community.progress.streaks.weeklyHelper.title'
                      : `community.progress.streaks.${slot.streak.kind}.title`)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {t('growth.surfaces.streak.weeks', {
                    count: String(slot.streak.currentWeeks),
                  })}
                </p>
              </article>
            );

          case 'next_milestone':
            if (!slot.milestone) return null;
            return (
              <article
                key={slot.slotId}
                className="rounded-2xl border border-violet-200/80 bg-violet-50/50 px-4 py-3"
                data-growth-slot={slot.slotId}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-violet-700" aria-hidden />
                  <p className="text-sm font-semibold text-gray-900">
                    {t('growth.surfaces.milestone.next')}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {slot.milestone.current}/{slot.milestone.target}
                </p>
              </article>
            );

          case 'community_achievement':
            if (!slot.achievement) return null;
            return (
              <article
                key={slot.slotId}
                className="rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-3"
                data-growth-slot={slot.slotId}
              >
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-700" aria-hidden />
                  <p className="text-sm font-semibold text-gray-900">
                    {t(slot.achievement.labelKey)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                  {t(slot.achievement.descriptionKey)}
                </p>
              </article>
            );

          case 'hcp_progress':
            if (!slot.hcpProgress) return null;
            return (
              <article
                key={slot.slotId}
                className="rounded-2xl border border-teal-200/80 bg-teal-50/50 px-4 py-3"
                data-growth-slot={slot.slotId}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-teal-700" aria-hidden />
                  <p className="text-sm font-semibold text-gray-900">
                    {t('growth.surfaces.hcp.label')}
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-teal-100">
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all"
                    style={{ width: `${slot.hcpProgress.progressPercent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {t('growth.surfaces.hcp.daily', {
                    earned: String(slot.hcpProgress.dailyHcpEarned),
                    remaining: String(slot.hcpProgress.dailyCapRemaining),
                  })}
                </p>
              </article>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
