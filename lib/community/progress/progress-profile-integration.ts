/**
 * Community progress profile integration — Phase 3L.
 */

import type {
  CommunityProgressProfilePlan,
  ProgressEligibilityInput,
} from './progress-contract';
import { resolveCommunityLevel } from './progress-levels';
import {
  resolveMilestoneStates,
  completedMilestoneCount,
} from './progress-milestones';
import { resolveAllStreaks } from './progress-streaks';
import { recentAchievementsFromMilestones } from './progress-sidebar-integration';

export function buildCommunityProgressProfilePlan(
  input: ProgressEligibilityInput,
): CommunityProgressProfilePlan {
  if (!input.loggedIn) {
    return emptyProfilePlan();
  }

  const milestones = resolveMilestoneStates(input);
  const completed = completedMilestoneCount(milestones);
  const level = resolveCommunityLevel(completed);
  const activeStreaks = resolveAllStreaks(input).filter((s) => s.active);
  const currentGoals = milestones.filter((m) => !m.completed).slice(0, 4);
  const milestoneHistory = milestones.filter((m) => m.completed);
  const fromMilestones = recentAchievementsFromMilestones(milestones);
  const achievementTimeline = [
    ...(input.earnedAchievements ?? []),
    ...fromMilestones,
  ].sort((a, b) => Date.parse(b.earnedAt) - Date.parse(a.earnedAt));

  return {
    currentLevel: level,
    milestoneHistory,
    achievementTimeline,
    currentGoals,
    activeStreaks,
  };
}

export function emptyProfilePlan(): CommunityProgressProfilePlan {
  return {
    currentLevel: resolveCommunityLevel(0),
    milestoneHistory: [],
    achievementTimeline: [],
    currentGoals: [],
    activeStreaks: [],
  };
}
