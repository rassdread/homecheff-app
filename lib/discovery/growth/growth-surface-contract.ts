/**
 * Growth Surface contracts — Phase 3M.
 * Unifies activity, opportunity, community progress, and HCP into one growth layer.
 * Recognition only — no ranking, trust, or sponsored effects.
 */

import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import type { EconomyOpportunitySurfaceContract } from '@/lib/discovery/surfaces/map-economy-opportunity-surface';
import type { CommunityProgressPlan } from '@/lib/community/progress/progress-contract';
import type { HcpSidebarIntegrationPlan } from '@/lib/hcp/economy/hcp-reward-contract';
import type {
  ProgressAchievement,
  ProgressMilestoneState,
  ProgressStreakState,
  CommunityLevelState,
} from '@/lib/community/progress/progress-contract';

/** Canonical desktop GrowthActionStack slot order (7). */
export const GROWTH_ACTION_STACK_SLOT_IDS = [
  'current_action',
  'opportunity',
  'progress',
  'current_streak',
  'next_milestone',
  'community_achievement',
  'hcp_progress',
] as const;

export type GrowthActionStackSlotId =
  (typeof GROWTH_ACTION_STACK_SLOT_IDS)[number];

export type GrowthActionSource =
  | 'activity'
  | 'opportunity'
  | 'community_progress'
  | 'hcp';

export type UnifiedRecommendedAction = {
  id: string;
  source: GrowthActionSource;
  titleKey: string;
  descriptionKey: string;
  href: string;
  priority: number;
  cooldownDays: number;
};

export type RecommendedActionPair = {
  primary: UnifiedRecommendedAction | null;
  secondary: UnifiedRecommendedAction | null;
};

export const COMMUNITY_ACHIEVEMENT_FEED_KINDS = [
  'FIRST_WORKSHOP',
  'FIRST_HELPER_ACTION',
  'FIRST_PARTNER_INVITE',
  'COMMUNITY_CONTRIBUTOR',
  'LOCAL_CONNECTOR',
] as const;

export type CommunityAchievementFeedKind =
  (typeof COMMUNITY_ACHIEVEMENT_FEED_KINDS)[number];

export type CommunityAchievementFeedItem = {
  id: string;
  kind: CommunityAchievementFeedKind;
  labelKey: string;
  descriptionKey: string;
  earnedAt: string | null;
  /** Recognition only — never affects ranking or trust. */
  recognitionOnly: true;
};

export type GrowthActionStackSlot = {
  slotId: GrowthActionStackSlotId;
  visible: boolean;
  /** Slot-specific payload — only one populated per slot. */
  currentAction?: UnifiedRecommendedAction | null;
  opportunity?: EconomyOpportunitySurfaceContract | null;
  progress?: {
    level: CommunityLevelState;
    milestonesCompleted: number;
  } | null;
  streak?: ProgressStreakState | null;
  milestone?: ProgressMilestoneState | null;
  achievement?: CommunityAchievementFeedItem | null;
  hcpProgress?: Pick<
    HcpSidebarIntegrationPlan,
    'progressPercent' | 'dailyHcpEarned' | 'dailyCapRemaining' | 'nextMilestone'
  > | null;
};

export type GrowthMobileInsertKind =
  | 'growth_action'
  | 'growth_progress';

export type GrowthMobileInsert = {
  afterSaleIndex: number;
  kind: GrowthMobileInsertKind;
  action?: UnifiedRecommendedAction | null;
  progressNudge?: {
    levelTitleKey: string;
    streakWeeks: number;
    milestoneTitleKey: string | null;
  } | null;
  cooldownDays: number;
};

export type GrowthProfileModulePlan = {
  currentLevel: CommunityLevelState;
  primaryStreak: ProgressStreakState | null;
  nextMilestone: ProgressMilestoneState | null;
  activeOpportunities: EconomyOpportunitySurfaceContract[];
  recentAchievements: ProgressAchievement[];
  recommendedActions: UnifiedRecommendedAction[];
};

export type GrowthSurfaceBundle = {
  recommendedActions: RecommendedActionPair;
  communityProgress: CommunityProgressPlan;
  hcpProgress: HcpSidebarIntegrationPlan;
  achievementFeed: CommunityAchievementFeedItem[];
  topActivity: ActivityCardFeedItem | null;
  opportunity: EconomyOpportunitySurfaceContract | null;
};

export type GrowthSurfacePlan = {
  bundle: GrowthSurfaceBundle;
  desktopStack: GrowthActionStackSlot[];
  mobileInserts: GrowthMobileInsert[];
  profile: GrowthProfileModulePlan | null;
  meta: {
    recognitionOnly: true;
    maxMobileInserts: number;
    actionCooldownDays: number;
  };
};

export const GROWTH_SURFACE_SPEC_VERSION = 1 as const;

export const GROWTH_MOBILE_MAX_INSERTS = 2 as const;
export const GROWTH_ACTION_COOLDOWN_DAYS = 7 as const;

export const FORBIDDEN_GROWTH_EFFECTS = [
  'feed_rank_boost',
  'trust_tier_boost',
  'seller_reputation_boost',
  'visibility_boost',
  'recommendation_ml_boost',
  'sponsored_placement',
  'passive_screen_time',
] as const;

export function isCanonicalGrowthStackOrder(
  slots: readonly GrowthActionStackSlotId[],
): boolean {
  if (slots.length !== GROWTH_ACTION_STACK_SLOT_IDS.length) return false;
  return slots.every((id, i) => id === GROWTH_ACTION_STACK_SLOT_IDS[i]);
}

export function growthInstanceId(userId: string, suffix: string): string {
  return `growth-surface:${suffix}:${userId}`;
}
