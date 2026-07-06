/**
 * Real-world activation contracts — Phase 3G.
 * Separate from ActivityCardType (3B); maps to surfaces via SurfaceRouter later.
 */

import type { ActivityCardCtaKind } from '@/lib/discovery/activity-cards/activity-card-types';

/** Phase 3G expansion categories (additive to 3C taxonomy). */
export const REAL_WORLD_ACTIVATION_CATEGORIES = [
  'PRACTICAL_NEIGHBORHOOD',
  'LOCAL_DISCOVERY',
  'COMMUNITY_SUPPORT',
] as const;

export type RealWorldActivationCategory =
  (typeof REAL_WORLD_ACTIVATION_CATEGORIES)[number];

export const ACTIVATION_LIFECYCLE_STATES = [
  'eligible',
  'shown',
  'dismissed',
  'accepted',
  'completed',
  'expired',
  'rewarded',
] as const;

export type ActivationLifecycleState =
  (typeof ACTIVATION_LIFECYCLE_STATES)[number];

export const ACTIVATION_VIRALITY_TIERS = [
  'none',
  'conversation',
  'local_story',
  'community_building',
] as const;

export type ActivationViralityTier =
  (typeof ACTIVATION_VIRALITY_TIERS)[number];

export const ACTIVATION_REWARD_TYPES = [
  'recognition',
  'trust_badge',
  'community_badge',
  'completion_milestone',
  'hcp_optional',
] as const;

export type ActivationRewardType = (typeof ACTIVATION_REWARD_TYPES)[number];

export const FORBIDDEN_ACTIVATION_SIGNALS = [
  'view_count',
  'follower_count',
  'fan_count',
  'hcp_balance',
  'hcp_gate',
  'session_depth',
  'scroll_time',
  'engagement_score',
  'recommendation_ml',
  'feed_rank_boost',
] as const;

export type ForbiddenActivationSignal =
  (typeof FORBIDDEN_ACTIVATION_SIGNALS)[number];

export type RealWorldActivationId =
  | `PN${string}`
  | `LD${string}`
  | `CS${string}`;

export type RealWorldActivationContract = {
  id: RealWorldActivationId;
  category: RealWorldActivationCategory;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: ActivityCardCtaKind;
  viralityTier: ActivationViralityTier;
  allowedRewards: ActivationRewardType[];
  safetyTags: string[];
};

export type RealWorldActivationDefinition = RealWorldActivationContract & {
  isEligible: (input: import('./activation-signals').ActivationEligibilityInput) => boolean;
  eligibilityReason: (input: import('./activation-signals').ActivationEligibilityInput) => string;
  /** Maps to 3C library ID when applicable. */
  libraryRef?: string;
};

export function activationInstanceId(
  activationId: RealWorldActivationId,
  userId: string,
): string {
  return `activation:${activationId}:${userId}`;
}
