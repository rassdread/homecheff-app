'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import { isSidebarSlotRenderable } from '@/lib/discovery/surfaces/resolve-sidebar-visibility';
import { isDeliveryEconomyOpportunity } from '@/lib/home/sidebar-cta-priority';
import OpportunityEconomyCard from './OpportunityEconomyCard';
import OpportunityModuleCard from './OpportunityModuleCard';

export type OpportunitySurfaceStackProps = {
  plan: ResolvedSurfacePlan | null;
  className?: string;
  /** Phase 7G — skip economy COURIER when GrowthActionStack already shows it. */
  suppressEconomyCourier?: boolean;
};

/**
 * Desktop opportunity stack — Phase 3J.
 * Max 1 visible; economy contracts preferred over legacy modules.
 */
export default function OpportunitySurfaceStack({
  plan,
  className = '',
  suppressEconomyCourier = false,
}: OpportunitySurfaceStackProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const economyContract = plan?.opportunityEconomy?.desktopSidebar ?? null;

  const legacySlot = useMemo(
    () => plan?.sidebarStack.find((s) => s.slotId === 'opportunity_module'),
    [plan],
  );

  if (dismissed) return null;

  if (
    economyContract &&
    !(suppressEconomyCourier && isDeliveryEconomyOpportunity(economyContract))
  ) {
    return (
      <div className={className} data-surface-stack="opportunity-economy">
        <OpportunityEconomyCard
          contract={economyContract}
          t={t}
          surface="desktop_sidebar"
          onDismiss={() => setDismissed(true)}
        />
      </div>
    );
  }

  if (
    !legacySlot ||
    !isSidebarSlotRenderable(legacySlot.visibility) ||
    legacySlot.module?.kind !== 'OPPORTUNITY'
  ) {
    return null;
  }

  return (
    <div className={className} data-surface-stack="opportunity-legacy">
      <OpportunityModuleCard
        contract={legacySlot.module.contract}
        t={t}
        surface="desktop_sidebar"
        onDismiss={() => setDismissed(true)}
      />
    </div>
  );
}
