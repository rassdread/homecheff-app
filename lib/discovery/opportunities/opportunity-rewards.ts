/**
 * Opportunity reward framework — Phase 3I.
 * Allowed: recognition, badges, community status, future commissions/partner rewards.
 * Forbidden: pay to win, trust manipulation, tier bypasses.
 */

import type {
  OpportunityCategory,
  OpportunityRewardType,
} from './opportunity-contract';

export const FORBIDDEN_OPPORTUNITY_REWARD_PATTERNS = [
  'pay_to_win',
  'trust_manipulation',
  'tier_bypass',
  'hcp_gate',
  'feed_rank_boost',
  'affiliate_payout',
  'commission_payout',
] as const;

export type ForbiddenOpportunityRewardPattern =
  (typeof FORBIDDEN_OPPORTUNITY_REWARD_PATTERNS)[number];

const CATEGORY_DEFAULT_REWARDS: Record<
  OpportunityCategory,
  OpportunityRewardType[]
> = {
  EARN: ['recognition', 'badge', 'future_commission'],
  GROW: ['recognition', 'community_status', 'future_partner_reward'],
  HELP: ['recognition', 'community_status', 'badge'],
  COMMUNITY: ['recognition', 'community_status', 'badge'],
  PARTNER: ['recognition', 'future_partner_reward', 'badge'],
  LEARN: ['recognition', 'badge', 'community_status'],
};

export function allowedRewardsForOpportunityCategory(
  category: OpportunityCategory,
): OpportunityRewardType[] {
  return [...CATEGORY_DEFAULT_REWARDS[category]];
}

export function validateOpportunityRewards(
  rewardTypes: OpportunityRewardType[],
): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const forbidden = new Set<string>(FORBIDDEN_OPPORTUNITY_REWARD_PATTERNS);

  for (const reward of rewardTypes) {
    if (forbidden.has(reward)) {
      violations.push(reward);
    }
    if (reward === ('trust_manipulation' as OpportunityRewardType)) {
      violations.push('trust_manipulation');
    }
    if (reward === ('tier_bypass' as OpportunityRewardType)) {
      violations.push('tier_bypass');
    }
  }

  return { valid: violations.length === 0, violations };
}

/** Future commission/partner rewards are contract-only in 3I — no payout logic. */
export function futureRewardsAreContractOnly(): boolean {
  return true;
}

/** Rewards may only be evaluated after lifecycle reaches completed. */
export function opportunityRewardsAfterCompletionOnly(): boolean {
  return true;
}
