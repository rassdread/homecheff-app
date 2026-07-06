/**
 * HCP Economy reward contracts — Phase 3K.
 * HCP may reward participation; must never affect ranking, trust, reviews, or visibility.
 */

/** HCP reward categories (7). */
export const HCP_REWARD_CATEGORIES = [
  'ACTIVATION',
  'COMMUNITY',
  'PARTNER',
  'WORKSHOP',
  'COURIER',
  'HELPER',
  'EVENT',
] as const;

export type HcpRewardCategory = (typeof HCP_REWARD_CATEGORIES)[number];

/** Canonical reward actions for activations and opportunities. */
export const HCP_REWARD_ACTIONS = [
  'COMPLETE_ACTIVATION',
  'HELP_NEIGHBOR',
  'HOST_WORKSHOP',
  'INVITE_BUSINESS',
  'INVITE_SPORTS_CLUB',
  'INVITE_SCHOOL',
  'BECOME_PARTNER',
  'BECOME_AMBASSADOR',
  'COMMUNITY_HELPER_COMPLETION',
  'BECOME_COURIER',
  'ORGANIZE_EVENT',
  'INVITE_MUNICIPALITY',
] as const;

export type HcpRewardAction = (typeof HCP_REWARD_ACTIONS)[number];

/** Recognition types — optional HCP allowed; no trust/ranking/visibility boosts. */
export const HCP_RECOGNITION_TYPES = [
  'badge',
  'milestone',
  'streak',
  'community_status',
  'achievement_history',
  'hcp_optional',
] as const;

export type HcpRecognitionType = (typeof HCP_RECOGNITION_TYPES)[number];

/** Effects HCP rewards must never grant. */
export const FORBIDDEN_HCP_EFFECTS = [
  'feed_rank_boost',
  'trust_tier_boost',
  'review_boost',
  'seller_reputation_boost',
  'visibility_boost',
  'recommendation_boost',
  'trust_manipulation',
  'discovery_section_boost',
] as const;

export type ForbiddenHcpEffect = (typeof FORBIDDEN_HCP_EFFECTS)[number];

export type HcpRewardLimitsSpec = {
  dailyCap: number;
  weeklyCap: number;
  cooldownHours: number;
  maxPerSourcePerDay: number;
};

export type HcpRewardContract = {
  id: string;
  action: HcpRewardAction;
  category: HcpRewardCategory;
  titleKey: string;
  descriptionKey: string;
  /** Optional HCP points on verified completion — never a gate. */
  hcpPoints: number | null;
  recognition: HcpRecognitionType[];
  limits: HcpRewardLimitsSpec;
  /** Source kind for idempotent ledger keys. */
  sourceKind: 'activation' | 'opportunity' | 'community_action';
  requiresVerification: boolean;
};

export type HcpRewardEligibilityResult = {
  eligible: boolean;
  reason: string;
};

export type HcpRewardCooldownState = Partial<
  Record<
    string,
    {
      lastAwardedAt: string | null;
      dailyCount: number;
      weeklyCount: number;
      dayKey: string;
      weekKey: string;
    }
  >
>;

export type HcpMilestone = {
  id: string;
  labelKey: string;
  target: number;
  current: number;
  completed: boolean;
  hcpBonus: number | null;
};

export type HcpRecommendedAction = {
  action: HcpRewardAction;
  titleKey: string;
  href: string;
  hcpPoints: number | null;
};

export type HcpCommunityAchievement = {
  id: string;
  labelKey: string;
  earnedAt: string | null;
  recognition: HcpRecognitionType;
};

/** HCP sidebar integration model — Phase 3K (contract only; UI wiring later). */
export type HcpSidebarIntegrationPlan = {
  progressPercent: number;
  nextMilestone: HcpMilestone | null;
  currentStreak: number;
  recommendedAction: HcpRecommendedAction | null;
  communityAchievements: HcpCommunityAchievement[];
  dailyHcpEarned: number;
  weeklyHcpEarned: number;
  dailyCapRemaining: number;
};

export function hcpRewardInstanceId(
  action: HcpRewardAction,
  sourceId: string,
  userId: string,
): string {
  return `hcp-economy:${action}:${sourceId}:${userId}`;
}
