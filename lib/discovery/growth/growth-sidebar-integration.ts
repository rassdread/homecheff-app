/**
 * Growth desktop sidebar stack — Phase 3M.
 */

import type { GrowthSurfaceBundle } from './growth-surface-contract';
import {
  GROWTH_ACTION_STACK_SLOT_IDS,
  type GrowthActionStackSlot,
} from './growth-surface-contract';

export function buildGrowthActionStack(
  bundle: GrowthSurfaceBundle,
): GrowthActionStackSlot[] {
  const { communityProgress, hcpProgress, achievementFeed } = bundle;
  const sidebar = communityProgress.sidebar;

  const latestAchievement = achievementFeed[achievementFeed.length - 1] ?? null;

  return GROWTH_ACTION_STACK_SLOT_IDS.map((slotId): GrowthActionStackSlot => {
    switch (slotId) {
      case 'current_action':
        return {
          slotId,
          visible: bundle.recommendedActions.primary !== null,
          currentAction: bundle.recommendedActions.primary,
        };
      case 'opportunity':
        return {
          slotId,
          visible: bundle.opportunity !== null,
          opportunity: bundle.opportunity,
        };
      case 'progress':
        return {
          slotId,
          visible: sidebar.currentLevel !== null,
          progress: {
            level: sidebar.currentLevel,
            milestonesCompleted: communityProgress.meta.totalVerifiedActions,
          },
        };
      case 'current_streak':
        return {
          slotId,
          visible: sidebar.primaryStreak?.active === true,
          streak: sidebar.primaryStreak,
        };
      case 'next_milestone':
        return {
          slotId,
          visible: sidebar.nextMilestone !== null && !sidebar.nextMilestone.completed,
          milestone: sidebar.nextMilestone,
        };
      case 'community_achievement':
        return {
          slotId,
          visible: latestAchievement !== null,
          achievement: latestAchievement,
        };
      case 'hcp_progress':
        return {
          slotId,
          visible: hcpProgress.recommendedAction !== null,
          hcpProgress: {
            progressPercent: hcpProgress.progressPercent,
            dailyHcpEarned: hcpProgress.dailyHcpEarned,
            dailyCapRemaining: hcpProgress.dailyCapRemaining,
            nextMilestone: hcpProgress.nextMilestone,
          },
        };
      default:
        return { slotId, visible: false };
    }
  });
}

export function visibleGrowthStackSlots(
  stack: GrowthActionStackSlot[],
): GrowthActionStackSlot[] {
  return stack.filter((s) => s.visible);
}
