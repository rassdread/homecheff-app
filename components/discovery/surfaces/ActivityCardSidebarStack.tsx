'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import { getSidebarActivityModules } from '@/lib/discovery/surfaces/surface-discovery-helpers';
import { filterCardsForSession } from '@/lib/discovery/activity-cards/activity-card-client-storage';
import { ACTIVITY_CARD_SESSION_MAX } from '@/lib/discovery/activity-cards/resolve-activity-card-contracts';
import ActivityCard from '@/components/discovery/activity-cards/ActivityCard';

export type ActivityCardSidebarStackProps = {
  plan: ResolvedSurfacePlan | null;
  className?: string;
};

/** Activity-only sidebar stack (use DesktopRightSidebarSurfaceStack for full stack). */
export default function ActivityCardSidebarStack({
  plan,
  className = '',
}: ActivityCardSidebarStackProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  const activityModules = useMemo(
    () => getSidebarActivityModules(plan),
    [plan],
  );

  const activityCards = useMemo(
    () =>
      filterCardsForSession(
        activityModules.map((m) => m.contract),
        ACTIVITY_CARD_SESSION_MAX,
        plan?.meta.activitySidebarMaxStacked ?? 3,
      ),
    [activityModules, plan?.meta.activitySidebarMaxStacked],
  );

  const collapseThreshold = plan?.meta.activitySidebarCollapseThreshold ?? 2;
  const showCollapse = activityCards.length > collapseThreshold;
  const visibleActivityCards =
    showCollapse && collapsed ? activityCards.slice(0, 1) : activityCards;

  if (visibleActivityCards.length === 0) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`} data-surface-stack="activity">
      {visibleActivityCards.map((card) => (
        <ActivityCard
          key={card.id}
          card={card}
          t={t}
          surface="desktop_sidebar"
        />
      ))}
      {showCollapse ? (
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 text-left px-1"
        >
          {collapsed
            ? t('surfaces.sidebar.showMore')
            : t('surfaces.sidebar.showLess')}
        </button>
      ) : null}
    </div>
  );
}
