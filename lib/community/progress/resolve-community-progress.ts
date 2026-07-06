/**
 * Community Progress resolver — Phase 3L.
 */

import type {
  CommunityProgressPlan,
  ProgressEligibilityInput,
} from './progress-contract';
import { buildCommunityProgressSidebarPlan } from './progress-sidebar-integration';
import { buildCommunityProgressProfilePlan } from './progress-profile-integration';
import { completedMilestoneCount, resolveMilestoneStates } from './progress-milestones';

export function resolveCommunityProgress(
  input: ProgressEligibilityInput,
): CommunityProgressPlan {
  const sidebar = buildCommunityProgressSidebarPlan(input);
  const profile = buildCommunityProgressProfilePlan(input);
  const milestones = resolveMilestoneStates(input);

  const totalVerified =
    input.completedHelps +
    input.completedWorkshops +
    input.completedInvites +
    input.completedDiscoveries +
    input.completedSupports;

  return {
    sidebar,
    profile,
    meta: {
      totalVerifiedActions: Math.max(totalVerified, completedMilestoneCount(milestones)),
      recognitionOnly: true,
    },
  };
}

export function buildDefaultProgressInput(
  userId: string,
  partial: Partial<ProgressEligibilityInput> = {},
): ProgressEligibilityInput {
  return {
    userId,
    loggedIn: true,
    hasLocation: false,
    completenessPercent: 0,
    completedDealWithoutReview: false,
    hasWorkshopListing: false,
    hasSellerRole: false,
    productCount: 0,
    nearbyRequestCount: 0,
    completedHelps: 0,
    completedWorkshops: 0,
    completedInvites: 0,
    completedDiscoveries: 0,
    completedSupports: 0,
    categoryCounts: {},
    streakWeekKeys: {},
    ...partial,
  };
}
