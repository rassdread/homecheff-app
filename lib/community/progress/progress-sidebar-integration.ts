/**
 * Community progress sidebar integration — Phase 3L.
 */

import type {
  CommunityProgressSidebarPlan,
  ProgressAchievement,
  ProgressEligibilityInput,
} from './progress-contract';
import { resolveCommunityLevel } from './progress-levels';
import {
  resolveMilestoneStates,
  nextIncompleteMilestone,
  completedMilestoneCount,
} from './progress-milestones';
import { resolveAllStreaks, primaryStreak } from './progress-streaks';
import { topProgressRecommendation } from './progress-recommendations';

export function buildCommunityProgressSidebarPlan(
  input: ProgressEligibilityInput,
): CommunityProgressSidebarPlan {
  if (!input.loggedIn) {
    return emptySidebarPlan();
  }

  const milestones = resolveMilestoneStates(input);
  const completed = completedMilestoneCount(milestones);
  const level = resolveCommunityLevel(completed);
  const streaks = resolveAllStreaks(input);
  const streak = primaryStreak(streaks);
  const nextMilestone = nextIncompleteMilestone(milestones);
  const recommendedAction = topProgressRecommendation(input);
  const recentAchievements = (input.earnedAchievements ?? []).slice(0, 3);

  return {
    currentLevel: level,
    primaryStreak: streak,
    nextMilestone,
    recommendedAction,
    recentAchievements,
  };
}

export function emptySidebarPlan(): CommunityProgressSidebarPlan {
  const level = resolveCommunityLevel(0);
  return {
    currentLevel: level,
    primaryStreak: null,
    nextMilestone: null,
    recommendedAction: null,
    recentAchievements: [],
  };
}

export function recentAchievementsFromMilestones(
  milestones: ReturnType<typeof resolveMilestoneStates>,
): ProgressAchievement[] {
  return milestones
    .filter((m) => m.completed && m.completedAt)
    .map((m) => ({
      id: m.milestoneId,
      labelKey: `community.progress.milestones.${m.category.toLowerCase()}.earned`,
      category: m.category,
      earnedAt: m.completedAt!,
    }));
}
