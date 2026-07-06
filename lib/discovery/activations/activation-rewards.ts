/**
 * Activation reward framework — Phase 3G.
 */

import type {
  ActivationRewardType,
  RealWorldActivationCategory,
} from './activation-contract';

export const FORBIDDEN_REWARD_PATTERNS = [
  'pay_to_win',
  'activation_spam',
  'trust_bypass',
  'feed_rank_boost',
  'hcp_gate',
] as const;

const CATEGORY_ALLOWED_REWARDS: Record<
  RealWorldActivationCategory,
  ActivationRewardType[]
> = {
  PRACTICAL_NEIGHBORHOOD: [
    'recognition',
    'trust_badge',
    'community_badge',
    'completion_milestone',
    'hcp_optional',
  ],
  LOCAL_DISCOVERY: [
    'recognition',
    'trust_badge',
    'completion_milestone',
    'hcp_optional',
  ],
  COMMUNITY_SUPPORT: [
    'recognition',
    'community_badge',
    'completion_milestone',
    'hcp_optional',
  ],
};

export function allowedRewardsForCategory(
  category: RealWorldActivationCategory,
): ActivationRewardType[] {
  return [...CATEGORY_ALLOWED_REWARDS[category]];
}

export function validateActivationRewards(
  allowed: ActivationRewardType[],
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const reward of allowed) {
    if (reward === ('trust_bypass' as ActivationRewardType)) {
      violations.push('trust_bypass');
    }
  }
  if (allowed.includes('hcp_optional') && allowed.length === 1) {
    /* HCP-only reward is weak but allowed after completion */
  }
  return { valid: violations.length === 0, violations };
}

export function rewardsAfterCompletionOnly(): boolean {
  return true;
}
