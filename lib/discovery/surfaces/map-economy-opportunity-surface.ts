/**
 * Economy opportunity → surface module bridge — Phase 3J.
 */

import type {
  OpportunityBenefit,
  OpportunityCategory,
  OpportunityRequirement,
  OpportunityRewardType,
  OpportunityType,
} from '@/lib/discovery/opportunities/opportunity-contract';
import type { OpportunityProgressContract } from '@/lib/discovery/opportunities/opportunity-progress';
import type { CommunityHelperVariantId } from '@/lib/discovery/opportunities/community-helper-variants';
import type { ActivityCardCtaKind } from '@/lib/discovery/activity-cards/activity-card-types';
import type { SurfaceModuleSize } from './surface-contract';

export type EconomyOpportunitySurfaceContract = {
  id: string;
  instanceId: string;
  opportunityType: OpportunityType;
  category: OpportunityCategory;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: ActivityCardCtaKind;
  benefits: OpportunityBenefit[];
  requirements: OpportunityRequirement[];
  rewardTypes: OpportunityRewardType[];
  progress: OpportunityProgressContract;
  helperVariant?: CommunityHelperVariantId;
  effectivePriority: number;
};

export type ResolvedEconomyOpportunityModule = {
  kind: 'ECONOMY_OPPORTUNITY';
  size: SurfaceModuleSize;
  contract: EconomyOpportunitySurfaceContract;
};

export type OpportunityEconomySurfacePlan = {
  desktopSidebar: EconomyOpportunitySurfaceContract | null;
  mobileInserts: EconomyOpportunitySurfaceContract[];
  profileModules: EconomyOpportunitySurfaceContract[];
};

export function toEconomyOpportunityModule(
  contract: EconomyOpportunitySurfaceContract,
  size: SurfaceModuleSize = 'standard',
): ResolvedEconomyOpportunityModule {
  return { kind: 'ECONOMY_OPPORTUNITY', size, contract };
}

export function isPartnerEconomyType(type: OpportunityType): boolean {
  return (
    type === 'LOCAL_BUSINESS_INVITER' ||
    type === 'SPORTS_CLUB_INVITER' ||
    type === 'SCHOOL_INVITER' ||
    type === 'MUNICIPALITY_INVITER'
  );
}
