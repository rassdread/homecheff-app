/**
 * Growth profile module plan — Phase 3M.
 */

import type { EconomyOpportunitySurfaceContract } from '@/lib/discovery/surfaces/map-economy-opportunity-surface';
import type { CommunityProgressPlan } from '@/lib/community/progress/progress-contract';
import type {
  GrowthProfileModulePlan,
  UnifiedRecommendedAction,
} from './growth-surface-contract';

export type BuildGrowthProfileInput = {
  communityProgress: CommunityProgressPlan;
  activeOpportunities: EconomyOpportunitySurfaceContract[];
  recommendedActions: UnifiedRecommendedAction[];
  loggedIn: boolean;
};

export function buildGrowthProfileModule(
  input: BuildGrowthProfileInput,
): GrowthProfileModulePlan | null {
  if (!input.loggedIn) return null;

  const profile = input.communityProgress.profile;

  return {
    currentLevel: profile.currentLevel,
    primaryStreak: profile.activeStreaks[0] ?? null,
    nextMilestone:
      profile.currentGoals.find((g) => !g.completed) ??
      profile.milestoneHistory.find((m) => !m.completed) ??
      null,
    activeOpportunities: input.activeOpportunities.slice(0, 3),
    recentAchievements: profile.achievementTimeline.slice(0, 5),
    recommendedActions: input.recommendedActions.slice(0, 3),
  };
}
