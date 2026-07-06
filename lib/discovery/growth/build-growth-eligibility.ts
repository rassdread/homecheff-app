/**
 * Build community progress eligibility from SurfaceRouter context — Phase 3M.
 */

import type { SurfaceRouterContext } from '@/lib/discovery/surfaces/surface-context';
import type { ProgressEligibilityInput } from '@/lib/community/progress/progress-contract';
import { buildDefaultProgressInput } from '@/lib/community/progress/resolve-community-progress';

export function buildProgressEligibilityFromSurface(
  ctx: SurfaceRouterContext,
): ProgressEligibilityInput {
  const e = ctx.activityCardEligibility;
  const o = ctx.opportunityEligibility;

  return buildDefaultProgressInput(e.userId, {
    loggedIn: e.loggedIn,
    hasLocation: e.hasLocation,
    completenessPercent: e.completenessPercent,
    completedDealWithoutReview: e.completedDealWithoutReview,
    hasWorkshopListing: e.hasWorkshopListing,
    hasSellerRole: e.hasSellerRole,
    productCount: e.productCount,
    nearbyRequestCount: e.nearbyRequestCount,
    completedHelps: 0,
    completedWorkshops: 0,
    completedInvites: 0,
    completedDiscoveries: 0,
    completedSupports: Math.min(o.activeNeighboursCount ?? 0, 5),
    categoryCounts: {},
    streakWeekKeys: {},
    now: ctx.now,
  });
}

export function buildHcpSidebarInputFromSurface(ctx: SurfaceRouterContext) {
  const o = ctx.opportunityEligibility;
  return {
    userId: ctx.activityCardEligibility.userId,
    completedActivationCount: 0,
    completedOpportunityCount: 0,
    currentStreak: 0,
    now: ctx.now,
    pendingOpportunityType: null as import('@/lib/discovery/opportunities/opportunity-contract').OpportunityType | null,
    pendingActivationCategory: null as import('@/lib/discovery/activations/activation-contract').RealWorldActivationCategory | null,
    earnedAchievements: [] as Array<{ id: string; labelKey: string; earnedAt: string }>,
    dailyHcpEarned: 0,
    communitySignals: {
      activeNeighbours: o.activeNeighboursCount ?? 0,
      newMakers: o.newMakersNearbyCount ?? 0,
    },
  };
}
