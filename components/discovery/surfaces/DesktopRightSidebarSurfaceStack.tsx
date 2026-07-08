'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import { isSidebarSlotRenderable } from '@/lib/discovery/surfaces/resolve-sidebar-visibility';
import {
  getSidebarActivityModules,
} from '@/lib/discovery/surfaces/surface-discovery-helpers';
import {
  filterCardsForSession,
} from '@/lib/discovery/activity-cards/activity-card-client-storage';
import { ACTIVITY_CARD_SESSION_MAX } from '@/lib/discovery/activity-cards/resolve-activity-card-contracts';
import ActivityCard from '@/components/discovery/activity-cards/ActivityCard';
import CommunityModuleCard from './CommunityModuleCard';
import OpportunitySurfaceStack from './OpportunitySurfaceStack';
import GrowthActionStack from './GrowthActionStack';
import { ExchangeSuggestionsSidebarModule } from '@/components/marketplace/exchange-suggestions';
import WorkshopModuleCard from './WorkshopModuleCard';
import OpportunityModuleCard from './OpportunityModuleCard';
import { Calendar, X } from 'lucide-react';

export type DesktopRightSidebarSurfaceStackProps = {
  plan: ResolvedSurfacePlan | null;
  className?: string;
  /** Phase 7F — activity-only slice for community cockpit (growth/community rendered upstream). */
  mode?: 'full' | 'activity-modules';
};

function EventModuleCard({
  plan,
  t,
}: {
  plan: ResolvedSurfacePlan | null;
  t: (key: string) => string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const slot = plan?.sidebarStack.find((s) => s.slotId === 'event_module');
  if (
    dismissed ||
    !slot ||
    !isSidebarSlotRenderable(slot.visibility) ||
    slot.module?.kind !== 'EVENT'
  ) {
    return null;
  }
  const contract = slot.module.contract;
  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white p-4 shadow-sm"
      data-surface-module="event"
    >
      {contract.dismissible ? (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded-full p-1.5 text-gray-400 hover:bg-white/80 hover:text-gray-600"
          aria-label={t('buttons.close')}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
      <div className="flex gap-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Calendar className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-gray-900">
            {t(contract.titleKey)}
          </h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-3">
            {t(contract.descriptionKey)}
          </p>
          <Link
            href={contract.actionHref}
            className="mt-3 inline-flex min-h-9 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {t(contract.actionLabelKey)}
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Canonical desktop right-sidebar surface stack — Phase 3F.
 * Order: community → activity → opportunity → workshop → partner → event.
 */
export default function DesktopRightSidebarSurfaceStack({
  plan,
  className = '',
  mode = 'full',
}: DesktopRightSidebarSurfaceStackProps) {
  const { t } = useTranslation();
  const [dismissedCommunity, setDismissedCommunity] = useState(false);
  const [dismissedWorkshop, setDismissedWorkshop] = useState(false);
  const [dismissedPartner, setDismissedPartner] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const communitySlot = useMemo(
    () => plan?.sidebarStack.find((s) => s.slotId === 'community_pulse'),
    [plan],
  );

  const activitySlot = useMemo(
    () => plan?.sidebarStack.find((s) => s.slotId === 'activity_module'),
    [plan],
  );

  const workshopSlot = useMemo(
    () => plan?.sidebarStack.find((s) => s.slotId === 'workshop_module'),
    [plan],
  );

  const partnerSlot = useMemo(
    () => plan?.sidebarStack.find((s) => s.slotId === 'partner_module'),
    [plan],
  );

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
  const activityCollapsed =
    activitySlot?.visibility === 'collapsed' ||
    (activityCards.length > collapseThreshold && collapsed);

  const visibleActivityCards = activityCollapsed
    ? activityCards.slice(0, 1)
    : activityCards;

  const showCommunity =
    mode === 'full' &&
    !dismissedCommunity &&
    communitySlot &&
    isSidebarSlotRenderable(communitySlot.visibility) &&
    communitySlot.module?.kind === 'COMMUNITY';

  const showWorkshop =
    !dismissedWorkshop &&
    workshopSlot &&
    isSidebarSlotRenderable(workshopSlot.visibility) &&
    workshopSlot.module?.kind === 'WORKSHOP';

  const showPartner =
    !dismissedPartner &&
    partnerSlot &&
    isSidebarSlotRenderable(partnerSlot.visibility) &&
    partnerSlot.module?.kind === 'PARTNER';

  const hasContent =
    showCommunity ||
    visibleActivityCards.length > 0 ||
    showWorkshop ||
    (activitySlot && isSidebarSlotRenderable(activitySlot.visibility));

  if (!hasContent && !plan?.sidebarStack.length) return null;

  return (
    <div className={`flex flex-col gap-3 ${className}`} data-surface-stack="desktop-right">
      {showCommunity && communitySlot.module?.kind === 'COMMUNITY' ? (
        <CommunityModuleCard
          contract={communitySlot.module.contract}
          t={t}
          onDismiss={() => setDismissedCommunity(true)}
        />
      ) : null}

      {mode === 'full' ? <GrowthActionStack plan={plan} /> : null}

      {visibleActivityCards.map((card) => (
        <ActivityCard
          key={card.id}
          card={card}
          t={t}
          surface="desktop_sidebar"
        />
      ))}

      {activityCards.length > collapseThreshold ? (
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

      <OpportunitySurfaceStack plan={plan} />

      <ExchangeSuggestionsSidebarModule />

      {showWorkshop && workshopSlot.module?.kind === 'WORKSHOP' ? (
        <WorkshopModuleCard
          contract={workshopSlot.module.contract}
          t={t}
          onDismiss={() => setDismissedWorkshop(true)}
        />
      ) : null}

      {showPartner && partnerSlot.module?.kind === 'PARTNER' ? (
        <OpportunityModuleCard
          contract={partnerSlot.module.contract}
          t={t}
          surface="desktop_sidebar"
          onDismiss={() => setDismissedPartner(true)}
        />
      ) : null}

      <EventModuleCard plan={plan} t={t} />
    </div>
  );
}
