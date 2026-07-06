/**
 * Community Progress contracts — Phase 3L.
 * Motivates real-world participation; no screen time, ranking, or trust benefits.
 */

/** Milestone categories (8). */
export const PROGRESS_MILESTONE_CATEGORIES = [
  'COMMUNITY',
  'HELPER',
  'PARTNER',
  'AMBASSADOR',
  'WORKSHOP',
  'COURIER',
  'LOCAL_DISCOVERY',
  'SUPPORT',
] as const;

export type ProgressMilestoneCategory =
  (typeof PROGRESS_MILESTONE_CATEGORIES)[number];

/** Streak kinds — real verified actions only. */
export const PROGRESS_STREAK_KINDS = [
  'weekly_helper',
  'workshop',
  'community',
  'local_discovery',
  'support',
] as const;

export type ProgressStreakKind = (typeof PROGRESS_STREAK_KINDS)[number];

/** Recognition-only community levels (6). */
export const COMMUNITY_LEVEL_IDS = [
  'NEIGHBOR',
  'CONTRIBUTOR',
  'COMMUNITY_BUILDER',
  'CONNECTOR',
  'AMBASSADOR',
  'COMMUNITY_LEADER',
] as const;

export type CommunityLevelId = (typeof COMMUNITY_LEVEL_IDS)[number];

/** Next-action recommendation kinds. */
export const PROGRESS_RECOMMENDATION_ACTIONS = [
  'COMPLETE_FIRST_WORKSHOP',
  'HELP_ONE_NEIGHBOR',
  'INVITE_LOCAL_BUSINESS',
  'SUPPORT_SOMEONE_NEARBY',
  'FINISH_PROFILE',
  'REQUEST_REVIEW',
  'HOST_WORKSHOP',
  'BECOME_COURIER',
  'INVITE_SPORTS_CLUB',
  'EXPLORE_LOCAL_DISCOVERY',
] as const;

export type ProgressRecommendationAction =
  (typeof PROGRESS_RECOMMENDATION_ACTIONS)[number];

export const FORBIDDEN_PROGRESS_EFFECTS = [
  'feed_rank_boost',
  'trust_tier_boost',
  'seller_reputation_boost',
  'visibility_boost',
  'recommendation_ml_boost',
  'review_manipulation',
  'passive_screen_time',
  'scroll_streak',
] as const;

export type ForbiddenProgressEffect =
  (typeof FORBIDDEN_PROGRESS_EFFECTS)[number];

export const FORBIDDEN_PROGRESS_GAMING = [
  'self_completion',
  'fake_loop',
  'passive_farming',
  'streak_inflation',
] as const;

export type ForbiddenProgressGaming =
  (typeof FORBIDDEN_PROGRESS_GAMING)[number];

export type ProgressMilestoneContract = {
  id: string;
  category: ProgressMilestoneCategory;
  titleKey: string;
  descriptionKey: string;
  target: number;
  /** Minimum verified real-world completions to count. */
  requiresVerification: boolean;
  cooldownDays: number;
};

export type ProgressMilestoneState = {
  milestoneId: string;
  category: ProgressMilestoneCategory;
  current: number;
  target: number;
  completed: boolean;
  completedAt: string | null;
};

export type ProgressStreakContract = {
  kind: ProgressStreakKind;
  titleKey: string;
  descriptionKey: string;
  /** Consecutive weeks with at least one verified action. */
  weekTarget: number;
  /** Linked milestone categories that count toward streak. */
  linkedCategories: ProgressMilestoneCategory[];
  maxInflationPerWeek: number;
};

export type ProgressStreakState = {
  kind: ProgressStreakKind;
  currentWeeks: number;
  longestWeeks: number;
  lastVerifiedAt: string | null;
  active: boolean;
};

export type CommunityLevelContract = {
  id: CommunityLevelId;
  titleKey: string;
  descriptionKey: string;
  /** Minimum total verified milestones to reach level. */
  minMilestones: number;
  /** Recognition only — no ranking or trust benefits. */
  recognitionOnly: true;
};

export type CommunityLevelState = {
  levelId: CommunityLevelId;
  titleKey: string;
  progressToNext: number;
  milestonesCompleted: number;
};

export type ProgressRecommendation = {
  action: ProgressRecommendationAction;
  titleKey: string;
  descriptionKey: string;
  href: string;
  priority: number;
  category: ProgressMilestoneCategory;
};

export type ProgressAchievement = {
  id: string;
  labelKey: string;
  category: ProgressMilestoneCategory;
  earnedAt: string;
};

export type CommunityProgressSidebarPlan = {
  currentLevel: CommunityLevelState;
  primaryStreak: ProgressStreakState | null;
  nextMilestone: ProgressMilestoneState | null;
  recommendedAction: ProgressRecommendation | null;
  recentAchievements: ProgressAchievement[];
};

export type CommunityProgressProfilePlan = {
  currentLevel: CommunityLevelState;
  milestoneHistory: ProgressMilestoneState[];
  achievementTimeline: ProgressAchievement[];
  currentGoals: ProgressMilestoneState[];
  activeStreaks: ProgressStreakState[];
};

export type CommunityProgressPlan = {
  sidebar: CommunityProgressSidebarPlan;
  profile: CommunityProgressProfilePlan;
  meta: {
    totalVerifiedActions: number;
    recognitionOnly: true;
  };
};

export type ProgressCooldownState = Partial<
  Record<
    string,
    {
      lastCountedAt: string | null;
      count: number;
      dayKey: string;
      weekKey: string;
    }
  >
>;

export type ProgressEligibilityInput = {
  userId: string;
  loggedIn: boolean;
  hasLocation: boolean;
  completenessPercent: number;
  completedDealWithoutReview: boolean;
  hasWorkshopListing: boolean;
  hasSellerRole: boolean;
  productCount: number;
  nearbyRequestCount: number;
  completedHelps: number;
  completedWorkshops: number;
  completedInvites: number;
  completedDiscoveries: number;
  completedSupports: number;
  /** Per-category verified counts for milestones. */
  categoryCounts: Partial<Record<ProgressMilestoneCategory, number>>;
  /** Streak week keys with verified actions. */
  streakWeekKeys: Partial<Record<ProgressStreakKind, string[]>>;
  earnedAchievements?: ProgressAchievement[];
  cooldownState?: ProgressCooldownState;
  now?: number;
};

export function progressInstanceId(
  userId: string,
  suffix: string,
): string {
  return `community-progress:${suffix}:${userId}`;
}
