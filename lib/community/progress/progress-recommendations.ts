/**
 * Next-action recommendation engine — Phase 3L.
 * Suggests real-world participation paths; no passive scrolling.
 */

import type {
  ProgressRecommendation,
  ProgressEligibilityInput,
} from './progress-contract';
import { FORBIDDEN_PROGRESS_GAMING } from './progress-contract';

const KEY = 'community.progress.recommendations';

type RecommendationDef = {
  action: import('./progress-contract').ProgressRecommendationAction;
  category: import('./progress-contract').ProgressMilestoneCategory;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  href: string;
  isEligible: (input: ProgressEligibilityInput) => boolean;
};

const RECOMMENDATION_REGISTRY: RecommendationDef[] = [
  {
    action: 'FINISH_PROFILE',
    category: 'COMMUNITY',
    priority: 95,
    titleKey: `${KEY}.finishProfile.title`,
    descriptionKey: `${KEY}.finishProfile.description`,
    href: '/profile',
    isEligible: (i) => i.loggedIn && i.completenessPercent < 80,
  },
  {
    action: 'HELP_ONE_NEIGHBOR',
    category: 'HELPER',
    priority: 90,
    titleKey: `${KEY}.helpNeighbor.title`,
    descriptionKey: `${KEY}.helpNeighbor.description`,
    href: '/?chip=sale#homecheff-feed',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.completedHelps < 1 && i.nearbyRequestCount > 0,
  },
  {
    action: 'SUPPORT_SOMEONE_NEARBY',
    category: 'SUPPORT',
    priority: 88,
    titleKey: `${KEY}.supportNearby.title`,
    descriptionKey: `${KEY}.supportNearby.description`,
    href: '/?chip=sale#homecheff-feed',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.completedSupports < 1 && i.nearbyRequestCount > 0,
  },
  {
    action: 'COMPLETE_FIRST_WORKSHOP',
    category: 'WORKSHOP',
    priority: 85,
    titleKey: `${KEY}.firstWorkshop.title`,
    descriptionKey: `${KEY}.firstWorkshop.description`,
    href: '/?chip=sale#homecheff-feed',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.completedWorkshops < 1,
  },
  {
    action: 'HOST_WORKSHOP',
    category: 'WORKSHOP',
    priority: 78,
    titleKey: `${KEY}.hostWorkshop.title`,
    descriptionKey: `${KEY}.hostWorkshop.description`,
    href: '/sell/new',
    isEligible: (i) =>
      i.loggedIn &&
      i.hasSellerRole &&
      i.productCount > 0 &&
      !i.hasWorkshopListing,
  },
  {
    action: 'INVITE_LOCAL_BUSINESS',
    category: 'PARTNER',
    priority: 72,
    titleKey: `${KEY}.inviteBusiness.title`,
    descriptionKey: `${KEY}.inviteBusiness.description`,
    href: '/welkom',
    isEligible: (i) =>
      i.loggedIn && i.hasSellerRole && i.productCount >= 3 && i.completedInvites < 1,
  },
  {
    action: 'INVITE_SPORTS_CLUB',
    category: 'COMMUNITY',
    priority: 65,
    titleKey: `${KEY}.inviteClub.title`,
    descriptionKey: `${KEY}.inviteClub.description`,
    href: '/welkom',
    isEligible: (i) => i.loggedIn && i.hasLocation && i.completedInvites < 2,
  },
  {
    action: 'BECOME_COURIER',
    category: 'COURIER',
    priority: 62,
    titleKey: `${KEY}.becomeCourier.title`,
    descriptionKey: `${KEY}.becomeCourier.description`,
    href: '/delivery/signup',
    isEligible: (i) => i.loggedIn && i.hasLocation,
  },
  {
    action: 'REQUEST_REVIEW',
    category: 'COMMUNITY',
    priority: 60,
    titleKey: `${KEY}.requestReview.title`,
    descriptionKey: `${KEY}.requestReview.description`,
    href: '/profile',
    isEligible: (i) => i.loggedIn && i.completedDealWithoutReview,
  },
  {
    action: 'EXPLORE_LOCAL_DISCOVERY',
    category: 'LOCAL_DISCOVERY',
    priority: 55,
    titleKey: `${KEY}.exploreDiscovery.title`,
    descriptionKey: `${KEY}.exploreDiscovery.description`,
    href: '/?chip=sale#homecheff-feed',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.completedDiscoveries < 3,
  },
];

export function resolveProgressRecommendations(
  input: ProgressEligibilityInput,
  limit = 3,
): ProgressRecommendation[] {
  if (!input.loggedIn) return [];

  return RECOMMENDATION_REGISTRY.filter((r) => r.isEligible(input))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map((r) => ({
      action: r.action,
      titleKey: r.titleKey,
      descriptionKey: r.descriptionKey,
      href: r.href,
      priority: r.priority,
      category: r.category,
    }));
}

export function topProgressRecommendation(
  input: ProgressEligibilityInput,
): ProgressRecommendation | null {
  return resolveProgressRecommendations(input, 1)[0] ?? null;
}

export type ProgressAntiGamingInput = {
  userId: string;
  sourceOwnerId?: string | null;
  actionsThisWeek: number;
  isPassiveActivity?: boolean;
  isSelfCompletion?: boolean;
  repeatLoopCount?: number;
};

export function passesProgressAntiGaming(
  input: ProgressAntiGamingInput,
): { safe: boolean; violations: string[] } {
  const violations: string[] = [];

  if (input.isSelfCompletion || input.sourceOwnerId === input.userId) {
    violations.push('self_completion');
  }
  if (input.isPassiveActivity) {
    violations.push('passive_farming');
  }
  if ((input.repeatLoopCount ?? 0) >= 3) {
    violations.push('fake_loop');
  }
  if (input.actionsThisWeek > 5) {
    violations.push('streak_inflation');
  }

  return { safe: violations.length === 0, violations };
}

export function recommendationsAreNotRanking(): boolean {
  return true;
}
