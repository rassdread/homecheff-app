/**
 * Profile surface stack — partner, community, activation, trust (Phase 3F).
 */

import type {
  OpportunityModuleContract,
  ProfileStackSection,
  ResolvedSurfaceModule,
} from './surface-contract';
import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import type { ActivityCardType } from '@/lib/discovery/activity-cards/activity-card-contract';
import type { CommunityModuleContract } from './surface-contract';
import type { SurfaceRouterContext } from './surface-context';
import { filterModulesForTarget } from './surface-visibility';

const TRUST_TYPES = new Set<ActivityCardType>([
  'REQUEST_REVIEW',
  'COMPLETE_WORKSPACE',
  'VERIFY_ACCOUNT',
]);

const ACTIVATION_TYPES = new Set<ActivityCardType>([
  'PROFILE_COMPLETION',
  'UPLOAD_FIRST_LISTING',
  'UPLOAD_FIRST_INSPIRATION',
  'SHARE_QR',
  'NEARBY_HELP_REQUEST',
  'BECOME_COURIER',
  'ADD_WORKSHOP',
]);

function toActivityModule(
  item: ActivityCardFeedItem,
): ResolvedSurfaceModule {
  return { kind: 'ACTIVITY', size: 'compact', contract: item };
}

function toOpportunityModule(
  contract: OpportunityModuleContract,
): ResolvedSurfaceModule {
  if (contract.moduleId === 'INVITE_LOCAL_BUSINESS' || contract.moduleId === 'INVITE_SPORTS_CLUB') {
    return {
      kind: 'PARTNER',
      size: 'compact',
      contract: contract as import('./surface-contract').PartnerModuleContract,
    };
  }
  return { kind: 'OPPORTUNITY', size: 'compact', contract };
}

function toCommunityModule(
  contract: CommunityModuleContract,
): ResolvedSurfaceModule {
  return { kind: 'COMMUNITY', size: 'compact', contract };
}

export type BuildProfileStackInput = {
  ctx: SurfaceRouterContext;
  activityItems: ActivityCardFeedItem[];
  opportunities: OpportunityModuleContract[];
  communityModules: CommunityModuleContract[];
};

export function buildProfileStack(
  input: BuildProfileStackInput,
): ProfileStackSection[] {
  const { ctx, activityItems, opportunities, communityModules } = input;

  const partnerOpps = opportunities
    .filter((o) =>
      ['BECOME_PARTNER', 'BECOME_AMBASSADOR', 'INVITE_LOCAL_BUSINESS', 'INVITE_SPORTS_CLUB'].includes(
        o.moduleId,
      ),
    )
    .map(toOpportunityModule);

  const communityOpps = [
    ...communityModules.map(toCommunityModule),
    ...opportunities
      .filter((o) => o.moduleId === 'SUPPORT_NEARBY')
      .map(toOpportunityModule),
  ];

  const activation = activityItems
    .filter((c) => c.type && ACTIVATION_TYPES.has(c.type))
    .map(toActivityModule);

  const trust = activityItems
    .filter((c) => c.type && TRUST_TYPES.has(c.type))
    .map(toActivityModule);

  const sections: ProfileStackSection[] = [
    {
      sectionId: 'partner_opportunities',
      modules: filterModulesForTarget(partnerOpps, 'profile_owner', ctx),
    },
    {
      sectionId: 'community_opportunities',
      modules: filterModulesForTarget(communityOpps, 'profile_owner', ctx),
    },
    {
      sectionId: 'activation_suggestions',
      modules: filterModulesForTarget(activation, 'profile_owner', ctx),
    },
    {
      sectionId: 'trust_growth',
      modules: filterModulesForTarget(trust, 'profile_owner', ctx),
    },
  ];

  return sections.filter((s) => s.modules.length > 0);
}

export function flattenProfileStack(
  stack: ProfileStackSection[],
): ResolvedSurfaceModule[] {
  return stack.flatMap((s) => s.modules);
}
