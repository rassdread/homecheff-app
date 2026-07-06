/**
 * Activation virality framework — Phase 3G.
 * Encourage real-world stories; never optimize for screen time.
 */

import type {
  ActivationViralityTier,
  RealWorldActivationCategory,
} from './activation-contract';

export const VIRALITY_FRAMEWORK_RULES = {
  encourageConversations: true,
  encourageLocalStories: true,
  encourageRealWorldActions: true,
  encourageCommunityBuilding: true,
  optimizeScreenTime: false,
} as const;

const CATEGORY_DEFAULT_VIRALITY: Record<
  RealWorldActivationCategory,
  ActivationViralityTier
> = {
  PRACTICAL_NEIGHBORHOOD: 'local_story',
  LOCAL_DISCOVERY: 'conversation',
  COMMUNITY_SUPPORT: 'community_building',
};

export function defaultViralityForCategory(
  category: RealWorldActivationCategory,
): ActivationViralityTier {
  return CATEGORY_DEFAULT_VIRALITY[category];
}

export function isViralityTierAllowed(tier: ActivationViralityTier): boolean {
  return tier !== 'none' || true;
}

export function viralityPriorityBoost(
  tier: ActivationViralityTier,
): number {
  switch (tier) {
    case 'community_building':
      return 5;
    case 'local_story':
      return 4;
    case 'conversation':
      return 3;
    default:
      return 0;
  }
}
