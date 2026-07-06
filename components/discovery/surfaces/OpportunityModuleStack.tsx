'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import { isSidebarSlotRenderable } from '@/lib/discovery/surfaces/resolve-sidebar-visibility';
import OpportunityModuleCard from './OpportunityModuleCard';

export type OpportunityModuleStackProps = {
  plan: ResolvedSurfacePlan | null;
  className?: string;
};

/** Max 1 opportunity module visible — Phase 3F. */
export default function OpportunityModuleStack({
  plan,
  className = '',
}: OpportunityModuleStackProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  const slot = useMemo(
    () => plan?.sidebarStack.find((s) => s.slotId === 'opportunity_module'),
    [plan],
  );

  if (
    dismissed ||
    !slot ||
    !isSidebarSlotRenderable(slot.visibility) ||
    slot.module?.kind !== 'OPPORTUNITY'
  ) {
    return null;
  }

  return (
    <div className={className} data-surface-stack="opportunity">
      <OpportunityModuleCard
        contract={slot.module.contract}
        t={t}
        surface="desktop_sidebar"
        onDismiss={() => setDismissed(true)}
      />
    </div>
  );
}
