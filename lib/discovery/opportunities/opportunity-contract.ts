/**
 * Opportunity Economy contracts — Phase 3I foundation.
 * Canonical growth/participation paths; no payments, commissions, or ranking.
 */

import type { ActivityCardCtaKind } from '@/lib/discovery/activity-cards/activity-card-types';

/** Canonical opportunity types (11). */
export const OPPORTUNITY_TYPES = [
  'PARTNER',
  'AMBASSADOR',
  'COURIER',
  'WORKSHOP_HOST',
  'COMMUNITY_HELPER',
  'LOCAL_BUSINESS_INVITER',
  'SPORTS_CLUB_INVITER',
  'SCHOOL_INVITER',
  'MUNICIPALITY_INVITER',
  'EVENT_ORGANIZER',
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number];

/** Opportunity economy categories (6). */
export const OPPORTUNITY_CATEGORIES = [
  'EARN',
  'GROW',
  'HELP',
  'COMMUNITY',
  'PARTNER',
  'LEARN',
] as const;

export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];

/** Allowed reward types — evaluation only; no payout in 3I. */
export const OPPORTUNITY_REWARD_TYPES = [
  'recognition',
  'badge',
  'community_status',
  'future_commission',
  'future_partner_reward',
] as const;

export type OpportunityRewardType = (typeof OPPORTUNITY_REWARD_TYPES)[number];

/** Opportunity lifecycle states (7). */
export const OPPORTUNITY_LIFECYCLE_STATES = [
  'eligible',
  'shown',
  'accepted',
  'active',
  'completed',
  'archived',
] as const;

export type OpportunityLifecycleState =
  (typeof OPPORTUNITY_LIFECYCLE_STATES)[number];

/** Eligibility signal keys — no HCP or follower requirements. */
export const OPPORTUNITY_ELIGIBILITY_SIGNALS = [
  'seller_tier',
  'courier_capability',
  'location',
  'completed_deals',
  'community_activity',
  'workshop_history',
  'account_age',
  'profile_complete',
  'seller_role',
  'product_count',
  'nearby_requests',
] as const;

export type OpportunityEligibilitySignal =
  (typeof OPPORTUNITY_ELIGIBILITY_SIGNALS)[number];

export const FORBIDDEN_OPPORTUNITY_SIGNALS = [
  'hcp_balance',
  'hcp_gate',
  'follower_count',
  'fan_count',
  'view_count',
  'engagement_score',
  'feed_rank_boost',
  'affiliate_tier',
  'commission_balance',
] as const;

export type ForbiddenOpportunitySignal =
  (typeof FORBIDDEN_OPPORTUNITY_SIGNALS)[number];

export const OPPORTUNITY_SURFACE_TARGETS = [
  'desktop_sidebar',
  'mobile_insert',
  'profile_module',
] as const;

export type OpportunitySurfaceTarget =
  (typeof OPPORTUNITY_SURFACE_TARGETS)[number];

export type OpportunityEligibilitySpec = {
  /** Signals evaluated for this opportunity. */
  signals: OpportunityEligibilitySignal[];
  /** Minimum seller tier when seller_tier signal is used (0–5). */
  minSellerTier?: number;
  /** Minimum completed deals when completed_deals signal is used. */
  minCompletedDeals?: number;
  /** Minimum account age in days when account_age signal is used. */
  minAccountAgeDays?: number;
  /** Minimum profile completeness when profile_complete signal is used. */
  minProfilePercent?: number;
  /** Minimum product count when product_count signal is used. */
  minProductCount?: number;
  /** Requires courier capability absent when courier_capability signal is used. */
  requiresNoCourierProfile?: boolean;
  /** Requires workshop listing absent when workshop_history signal is used. */
  requiresNoWorkshopListing?: boolean;
};

export type OpportunityBenefit = {
  benefitKey: string;
  rewardType: OpportunityRewardType;
};

export type OpportunityRequirement = {
  requirementKey: string;
  signal: OpportunityEligibilitySignal;
};

export type OpportunityCooldownSpec = {
  showCooldownDays: number;
  dismissCooldownDays: number;
  acceptCooldownDays?: number;
};

export type OpportunityContract = {
  id: OpportunityType;
  type: OpportunityType;
  category: OpportunityCategory;
  titleKey: string;
  descriptionKey: string;
  eligibility: OpportunityEligibilitySpec;
  benefits: OpportunityBenefit[];
  requirements: OpportunityRequirement[];
  rewardTypes: OpportunityRewardType[];
  status: OpportunityLifecycleState;
  cooldowns: OpportunityCooldownSpec;
  priority: number;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  ctaKind: ActivityCardCtaKind;
  surfaceTargets: OpportunitySurfaceTarget[];
};

export function opportunityInstanceId(
  type: OpportunityType,
  userId: string,
): string {
  return `opportunity-economy:${type}:${userId}`;
}
