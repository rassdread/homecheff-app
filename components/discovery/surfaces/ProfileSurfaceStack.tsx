'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import ActivityCard from '@/components/discovery/activity-cards/ActivityCard';
import OpportunityModuleCard from './OpportunityModuleCard';

export type ProfileSurfaceStackProps = {
  plan: ResolvedSurfacePlan | null;
  className?: string;
};

/**
 * Profile owner surface modules from SurfaceRouter profileStack.
 */
export default function ProfileSurfaceStack({
  plan,
  className = '',
}: ProfileSurfaceStackProps) {
  const { t } = useTranslation();

  const sections = useMemo(() => plan?.profileStack ?? [], [plan]);

  if (sections.length === 0) return null;

  return (
    <div className={`flex flex-col gap-4 ${className}`} data-surface-stack="profile">
      {sections.map((section) => (
        <section key={section.sectionId} data-profile-section={section.sectionId}>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            {t(`surfaces.profile.sections.${section.sectionId}`)}
          </h3>
          <div className="flex flex-col gap-2">
            {section.modules.map((mod) => {
              if (mod.kind === 'ACTIVITY') {
                return (
                  <ActivityCard
                    key={mod.contract.id}
                    card={mod.contract}
                    t={t}
                    surface="profile_owner"
                    className="p-3"
                  />
                );
              }
              if (mod.kind === 'OPPORTUNITY' || mod.kind === 'PARTNER') {
                return (
                  <OpportunityModuleCard
                    key={mod.contract.id}
                    contract={mod.contract}
                    t={t}
                    surface="profile_owner"
                  />
                );
              }
              return null;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
