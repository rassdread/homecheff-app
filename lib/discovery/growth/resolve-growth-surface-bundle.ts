/**
 * Growth Surface bundle resolver — Phase 3M.
 */

import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import type { OpportunityEconomySurfacePlan } from '@/lib/discovery/surfaces/map-economy-opportunity-surface';
import type { SurfaceRouterContext } from '@/lib/discovery/surfaces/surface-context';
import {
  resolveCommunityProgress,
  buildDefaultProgressInput,
} from '@/lib/community/progress/resolve-community-progress';
import { resolveProgressRecommendations } from '@/lib/community/progress/progress-recommendations';
import { resolveHcpEconomy } from '@/lib/hcp/economy/resolve-hcp-economy';
import { emptyHcpSidebarPlan } from '@/lib/hcp/economy/hcp-sidebar-integration';
import {
  buildProgressEligibilityFromSurface,
  buildHcpSidebarInputFromSurface,
} from './build-growth-eligibility';
import { buildCommunityAchievementFeed } from './community-achievement-feed';
import {
  resolveRecommendedActionPair,
  recommendedActionsForProfile,
} from './resolve-recommended-action';
import { buildGrowthActionStack } from './growth-sidebar-integration';
import { buildGrowthProfileModule } from './growth-profile-integration';
import { buildGrowthMobileInserts } from './growth-mobile-inserts';
import type {
  GrowthSurfaceBundle,
  GrowthSurfacePlan,
} from './growth-surface-contract';
import {
  GROWTH_ACTION_COOLDOWN_DAYS,
  GROWTH_MOBILE_MAX_INSERTS,
} from './growth-surface-contract';

export type ResolveGrowthSurfaceBundleInput = {
  ctx: SurfaceRouterContext;
  activityItems: ActivityCardFeedItem[];
  opportunityEconomy: OpportunityEconomySurfacePlan;
  occupiedMobileSlots?: readonly number[];
};

export function resolveGrowthSurfaceBundle(
  input: ResolveGrowthSurfaceBundleInput,
): GrowthSurfaceBundle {
  const { ctx, activityItems, opportunityEconomy } = input;
  const loggedIn = ctx.viewer.loggedIn;

  const progressInput = buildProgressEligibilityFromSurface(ctx);
  const communityProgress = resolveCommunityProgress(progressInput);
  const progressRecs = resolveProgressRecommendations(progressInput, 3);

  const hcpInput = buildHcpSidebarInputFromSurface(ctx);
  const pendingOpp = opportunityEconomy.desktopSidebar?.opportunityType ?? null;
  const hcpEconomy = resolveHcpEconomy({
    userId: hcpInput.userId,
    loggedIn,
    opportunityType: pendingOpp ?? undefined,
    sidebar: {
      completedActivationCount: hcpInput.completedActivationCount,
      completedOpportunityCount: hcpInput.completedOpportunityCount,
      currentStreak: hcpInput.currentStreak,
      earnedAchievements: hcpInput.earnedAchievements,
      dailyHcpEarned: hcpInput.dailyHcpEarned,
    },
    now: ctx.now,
  });

  const opportunity = opportunityEconomy.desktopSidebar;
  const topActivity = activityItems[0] ?? null;

  const recommendedActions = resolveRecommendedActionPair({
    activityItems,
    opportunity,
    progressRecommendations: progressRecs,
    hcpRecommended: hcpEconomy.sidebarPlan.recommendedAction,
  });

  const achievementFeed = buildCommunityAchievementFeed(progressInput);

  return {
    recommendedActions,
    communityProgress,
    hcpProgress: hcpEconomy.sidebarPlan,
    achievementFeed,
    topActivity,
    opportunity,
  };
}

export function resolveGrowthSurfaces(
  input: ResolveGrowthSurfaceBundleInput,
): GrowthSurfacePlan {
  const bundle = resolveGrowthSurfaceBundle(input);
  const loggedIn = input.ctx.viewer.loggedIn;

  const progressInput = buildProgressEligibilityFromSurface(input.ctx);
  const progressRecs = resolveProgressRecommendations(progressInput, 3);

  const profileActions = recommendedActionsForProfile({
    activityItems: input.activityItems,
    opportunity: input.opportunityEconomy.desktopSidebar,
    progressRecommendations: progressRecs,
    hcpRecommended: bundle.hcpProgress.recommendedAction,
  });

  const mobileInserts = buildGrowthMobileInserts({
    bundle,
    occupiedSlots: input.occupiedMobileSlots,
  });

  return {
    bundle,
    desktopStack: buildGrowthActionStack(bundle),
    mobileInserts,
    profile: buildGrowthProfileModule({
      communityProgress: bundle.communityProgress,
      activeOpportunities: [
        ...(input.opportunityEconomy.desktopSidebar
          ? [input.opportunityEconomy.desktopSidebar]
          : []),
        ...input.opportunityEconomy.profileModules,
      ],
      recommendedActions: profileActions,
      loggedIn,
    }),
    meta: {
      recognitionOnly: true,
      maxMobileInserts: GROWTH_MOBILE_MAX_INSERTS,
      actionCooldownDays: GROWTH_ACTION_COOLDOWN_DAYS,
    },
  };
}

export function emptyGrowthSurfacePlan(): GrowthSurfacePlan {
  const guestProgress = resolveCommunityProgress(
    buildDefaultProgressInput('guest', { loggedIn: false }),
  );

  const emptyBundle: GrowthSurfaceBundle = {
    recommendedActions: { primary: null, secondary: null },
    communityProgress: guestProgress,
    hcpProgress: emptyHcpSidebarPlan(),
    achievementFeed: [],
    topActivity: null,
    opportunity: null,
  };

  return {
    bundle: emptyBundle,
    desktopStack: buildGrowthActionStack(emptyBundle),
    mobileInserts: [],
    profile: null,
    meta: {
      recognitionOnly: true,
      maxMobileInserts: GROWTH_MOBILE_MAX_INSERTS,
      actionCooldownDays: GROWTH_ACTION_COOLDOWN_DAYS,
    },
  };
}
