export type {
  ProgressMilestoneCategory,
  ProgressStreakKind,
  CommunityLevelId,
  ProgressRecommendationAction,
  ForbiddenProgressEffect,
  ForbiddenProgressGaming,
  ProgressMilestoneContract,
  ProgressMilestoneState,
  ProgressStreakContract,
  ProgressStreakState,
  CommunityLevelContract,
  CommunityLevelState,
  ProgressRecommendation,
  ProgressAchievement,
  CommunityProgressSidebarPlan,
  CommunityProgressProfilePlan,
  CommunityProgressPlan,
  ProgressCooldownState,
  ProgressEligibilityInput,
} from './progress-contract';

export {
  PROGRESS_MILESTONE_CATEGORIES,
  PROGRESS_STREAK_KINDS,
  COMMUNITY_LEVEL_IDS,
  PROGRESS_RECOMMENDATION_ACTIONS,
  FORBIDDEN_PROGRESS_EFFECTS,
  FORBIDDEN_PROGRESS_GAMING,
  progressInstanceId,
} from './progress-contract';

export {
  PROGRESS_MILESTONE_REGISTRY,
  resolveMilestoneStates,
  nextIncompleteMilestone,
  completedMilestoneCount,
  milestonesByCategory,
  isMilestoneInCooldown,
} from './progress-milestones';

export {
  PROGRESS_STREAK_REGISTRY,
  weekKeyUtc,
  resolveStreakState,
  resolveAllStreaks,
  primaryStreak,
  passesStreakAntiInflation,
} from './progress-streaks';

export {
  COMMUNITY_LEVEL_REGISTRY,
  resolveCommunityLevel,
  levelsNeverAffectRanking,
  levelsNeverAffectTrust,
} from './progress-levels';

export type { ProgressAntiGamingInput } from './progress-recommendations';

export {
  resolveProgressRecommendations,
  topProgressRecommendation,
  passesProgressAntiGaming,
  recommendationsAreNotRanking,
} from './progress-recommendations';

export {
  buildCommunityProgressSidebarPlan,
  emptySidebarPlan,
  recentAchievementsFromMilestones,
} from './progress-sidebar-integration';

export {
  buildCommunityProgressProfilePlan,
  emptyProfilePlan,
} from './progress-profile-integration';

export {
  resolveCommunityProgress,
  buildDefaultProgressInput,
} from './resolve-community-progress';
