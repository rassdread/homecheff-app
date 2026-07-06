'use client';

import Link from 'next/link';
import { Flame, Target, TrendingUp, X } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { GrowthMobileInsert } from '@/lib/discovery/growth/growth-surface-contract';

export type GrowthMobileInsertCardProps = {
  insert: GrowthMobileInsert;
  className?: string;
  onDismiss?: () => void;
};

export default function GrowthMobileInsertCard({
  insert,
  className = '',
  onDismiss,
}: GrowthMobileInsertCardProps) {
  const { t } = useTranslation();

  if (insert.kind === 'growth_action' && insert.action) {
    return (
      <article
        className={`relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm ${className}`}
        data-surface-module="growth_mobile_action"
      >
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="absolute right-2 top-2 rounded-full p-1.5 text-gray-400 hover:bg-white/80"
            aria-label={t('buttons.close')}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <div className="flex gap-3 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Target className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {t('growth.surfaces.currentAction.label')}
            </p>
            <h3 className="text-sm font-bold text-gray-900">
              {t(insert.action.titleKey)}
            </h3>
            <Link
              href={insert.action.href}
              className="mt-2 inline-flex text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {t('growth.surfaces.currentAction.cta')} →
            </Link>
          </div>
        </div>
      </article>
    );
  }

  if (insert.kind === 'growth_progress' && insert.progressNudge) {
    const nudge = insert.progressNudge;
    return (
      <article
        className={`rounded-2xl border border-sky-200/80 bg-sky-50/60 p-4 ${className}`}
        data-surface-module="growth_mobile_progress"
      >
        <div className="flex gap-3">
          {nudge.streakWeeks > 0 ? (
            <Flame className="h-5 w-5 text-orange-600 shrink-0" aria-hidden />
          ) : (
            <TrendingUp className="h-5 w-5 text-sky-700 shrink-0" aria-hidden />
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {t(nudge.levelTitleKey)}
            </p>
            {nudge.streakWeeks > 0 ? (
              <p className="text-xs text-gray-600 mt-0.5">
                {t('growth.surfaces.streak.weeks', {
                  count: String(nudge.streakWeeks),
                })}
              </p>
            ) : (
              <p className="text-xs text-gray-600 mt-0.5">
                {t('growth.surfaces.milestone.next')}
              </p>
            )}
          </div>
        </div>
      </article>
    );
  }

  return null;
}
