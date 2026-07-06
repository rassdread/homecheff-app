/**
 * Opportunity eligibility system — Phase 3I.
 * Allowed signals: seller tier, courier capability, location, deals, community, workshops.
 * Forbidden: HCP gates, follower counts, ranking boosts.
 */

import type { ActivityCardEligibilityInput } from '@/lib/discovery/activity-cards/activity-card-contract';
import type {
  OpportunityEligibilitySpec,
  OpportunityType,
} from './opportunity-contract';

export type OpportunityEligibilityInput = ActivityCardEligibilityInput & {
  accountAgeDays: number;
  sellerTier: number;
  buyerTier: number;
  completedDeals: number;
  activeNeighboursCount: number;
  newMakersNearbyCount: number;
  nearbyWorkshopCount: number;
  upcomingWorkshopCount: number;
  workshopHistoryCount: number;
  hasSportsClubInterest: boolean;
  communityActivityScore: number;
  practicalServiceRequestCount: number;
  feedScope: 'nearby' | 'national' | 'international' | string;
};

export type OpportunityEligibilityResult = {
  eligible: boolean;
  reason: string;
  evaluatedSignals: string[];
};

export type OpportunityCooldownState = Partial<
  Record<
    OpportunityType,
    {
      dismissedAt: string | null;
      lastShownAt: string | null;
      acceptedAt: string | null;
      completedAt: string | null;
      lifecycle: string;
    }
  >
>;

function hasCommunityActivity(input: OpportunityEligibilityInput): boolean {
  return (
    input.activeNeighboursCount > 0 ||
    input.newMakersNearbyCount > 0 ||
    input.communityActivityScore > 0 ||
    input.nearbyRequestCount > 0
  );
}

function hasWorkshopHistory(input: OpportunityEligibilityInput): boolean {
  return (
    input.hasWorkshopListing ||
    input.workshopHistoryCount > 0 ||
    input.upcomingWorkshopCount > 0 ||
    input.nearbyWorkshopCount > 0
  );
}

export function evaluateOpportunityEligibility(
  spec: OpportunityEligibilitySpec,
  input: OpportunityEligibilityInput,
  opportunityType: OpportunityType,
): OpportunityEligibilityResult {
  if (!input.loggedIn) {
    return { eligible: false, reason: 'guest', evaluatedSignals: [] };
  }

  const evaluated: string[] = [];

  for (const signal of spec.signals) {
    evaluated.push(signal);

    switch (signal) {
      case 'location':
        if (!input.hasLocation) {
          return { eligible: false, reason: 'no_location', evaluatedSignals: evaluated };
        }
        break;

      case 'seller_tier': {
        const min = spec.minSellerTier ?? 0;
        if (input.sellerTier < min) {
          return {
            eligible: false,
            reason: `seller_tier_below_${min}`,
            evaluatedSignals: evaluated,
          };
        }
        break;
      }

      case 'courier_capability':
        if (spec.requiresNoCourierProfile && input.hasDeliveryProfile) {
          return {
            eligible: false,
            reason: 'already_courier',
            evaluatedSignals: evaluated,
          };
        }
        break;

      case 'completed_deals': {
        const min = spec.minCompletedDeals ?? 1;
        if (input.completedDeals < min) {
          return {
            eligible: false,
            reason: `deals_below_${min}`,
            evaluatedSignals: evaluated,
          };
        }
        break;
      }

      case 'community_activity':
        if (!hasCommunityActivity(input)) {
          return {
            eligible: false,
            reason: 'no_community_activity',
            evaluatedSignals: evaluated,
          };
        }
        break;

      case 'workshop_history':
        if (spec.requiresNoWorkshopListing && input.hasWorkshopListing) {
          return {
            eligible: false,
            reason: 'already_hosts_workshop',
            evaluatedSignals: evaluated,
          };
        }
        if (
          opportunityType === 'EVENT_ORGANIZER' &&
          !hasWorkshopHistory(input)
        ) {
          return {
            eligible: false,
            reason: 'no_workshop_history',
            evaluatedSignals: evaluated,
          };
        }
        break;

      case 'account_age': {
        const min = spec.minAccountAgeDays ?? 7;
        if (input.accountAgeDays < min) {
          return {
            eligible: false,
            reason: `account_too_young_${min}d`,
            evaluatedSignals: evaluated,
          };
        }
        break;
      }

      case 'profile_complete': {
        const min = spec.minProfilePercent ?? 50;
        if (input.completenessPercent < min) {
          return {
            eligible: false,
            reason: `profile_below_${min}`,
            evaluatedSignals: evaluated,
          };
        }
        break;
      }

      case 'seller_role':
        if (!input.hasSellerRole && opportunityType !== 'PARTNER') {
          return {
            eligible: false,
            reason: 'not_seller',
            evaluatedSignals: evaluated,
          };
        }
        break;

      case 'product_count': {
        const min = spec.minProductCount ?? 1;
        if (input.productCount < min) {
          return {
            eligible: false,
            reason: `products_below_${min}`,
            evaluatedSignals: evaluated,
          };
        }
        break;
      }

      case 'nearby_requests':
        if (input.nearbyRequestCount <= 0) {
          return {
            eligible: false,
            reason: 'no_nearby_requests',
            evaluatedSignals: evaluated,
          };
        }
        break;

      default:
        break;
    }
  }

  return { eligible: true, reason: `${opportunityType.toLowerCase()}_ready`, evaluatedSignals: evaluated };
}

/** Type-specific eligibility beyond shared signal evaluation. */
export function evaluateOpportunityTypeRules(
  type: OpportunityType,
  input: OpportunityEligibilityInput,
): OpportunityEligibilityResult {
  switch (type) {
    case 'PARTNER':
      if (input.hasSellerRole && input.productCount > 0) {
        return { eligible: false, reason: 'already_partner', evaluatedSignals: ['seller_role'] };
      }
      return { eligible: true, reason: 'partner_onboarding', evaluatedSignals: ['seller_role'] };

    case 'AMBASSADOR':
      if (
        input.completenessPercent >= 50 ||
        input.productCount + input.dishCount >= 1
      ) {
        return { eligible: true, reason: 'ambassador_ready', evaluatedSignals: ['profile_complete'] };
      }
      return { eligible: false, reason: 'profile_incomplete', evaluatedSignals: ['profile_complete'] };

    case 'COURIER':
      if (!input.hasDeliveryProfile) {
        return { eligible: true, reason: 'courier_onboarding', evaluatedSignals: ['courier_capability'] };
      }
      return { eligible: false, reason: 'already_courier', evaluatedSignals: ['courier_capability'] };

    case 'WORKSHOP_HOST':
      if (input.hasSellerRole && input.productCount > 0 && !input.hasWorkshopListing) {
        return { eligible: true, reason: 'host_workshop', evaluatedSignals: ['workshop_history'] };
      }
      return { eligible: false, reason: 'not_ready_workshop', evaluatedSignals: ['workshop_history'] };

    case 'COMMUNITY_HELPER':
      return input.nearbyRequestCount > 0
        ? { eligible: true, reason: 'support_nearby', evaluatedSignals: ['nearby_requests'] }
        : { eligible: false, reason: 'no_nearby_requests', evaluatedSignals: ['nearby_requests'] };

    case 'LOCAL_BUSINESS_INVITER':
      return input.hasSellerRole && input.productCount >= 3
        ? { eligible: true, reason: 'invite_business', evaluatedSignals: ['product_count'] }
        : { eligible: false, reason: 'seller_not_established', evaluatedSignals: ['product_count'] };

    case 'SPORTS_CLUB_INVITER':
      if (input.hasSportsClubInterest || input.dishCount > 0) {
        return { eligible: true, reason: 'invite_club', evaluatedSignals: ['community_activity'] };
      }
      return { eligible: false, reason: 'no_club_signal', evaluatedSignals: ['community_activity'] };

    case 'SCHOOL_INVITER':
      if (input.accountAgeDays >= 14 && hasCommunityActivity(input)) {
        return { eligible: true, reason: 'invite_school', evaluatedSignals: ['community_activity'] };
      }
      return { eligible: false, reason: 'school_invite_not_ready', evaluatedSignals: ['community_activity'] };

    case 'MUNICIPALITY_INVITER':
      if (input.sellerTier >= 2 && input.completedDeals >= 5) {
        return { eligible: true, reason: 'invite_municipality', evaluatedSignals: ['seller_tier', 'completed_deals'] };
      }
      return { eligible: false, reason: 'municipality_not_ready', evaluatedSignals: ['seller_tier', 'completed_deals'] };

    case 'EVENT_ORGANIZER':
      if (hasWorkshopHistory(input) || input.nearbyWorkshopCount > 0) {
        return { eligible: true, reason: 'organize_event', evaluatedSignals: ['workshop_history'] };
      }
      return { eligible: false, reason: 'no_event_signal', evaluatedSignals: ['workshop_history'] };

    default:
      return { eligible: false, reason: 'unknown_type', evaluatedSignals: [] };
  }
}

export function isOpportunityEligible(
  type: OpportunityType,
  spec: OpportunityEligibilitySpec,
  input: OpportunityEligibilityInput,
): OpportunityEligibilityResult {
  const signalResult = evaluateOpportunityEligibility(spec, input, type);
  if (!signalResult.eligible) return signalResult;
  return evaluateOpportunityTypeRules(type, input);
}

export function buildOpportunityEligibilityFromSurface(
  base: ActivityCardEligibilityInput,
  extras: Partial<OpportunityEligibilityInput> = {},
): OpportunityEligibilityInput {
  return {
    ...base,
    accountAgeDays: 30,
    sellerTier: 0,
    buyerTier: 0,
    completedDeals: 0,
    activeNeighboursCount: 0,
    newMakersNearbyCount: 0,
    nearbyWorkshopCount: 0,
    upcomingWorkshopCount: 0,
    workshopHistoryCount: 0,
    hasSportsClubInterest: false,
    communityActivityScore: 0,
    feedScope: 'nearby',
    practicalServiceRequestCount: 0,
    ...extras,
  };
}
