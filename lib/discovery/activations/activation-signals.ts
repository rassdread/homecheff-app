/**
 * Activation eligibility signals — Phase 3G.
 * Allowed signals only; no views, followers, HCP gates, or engagement farming.
 */

import type { ActivityCardEligibilityInput } from '@/lib/discovery/activity-cards/activity-card-contract';

export type ActivationRole =
  | 'buyer'
  | 'seller'
  | 'courier'
  | 'creator'
  | 'mixed';

export type ActivationEligibilityInput = ActivityCardEligibilityInput & {
  accountAgeDays: number;
  feedScope: 'nearby' | 'national' | 'international' | string;
  sellerTier: number;
  buyerTier: number;
  completedDeals: number;
  favoriteCount: number;
  favoritesWithoutConversations: number;
  repeatSellerIds: string[];
  nearbyWorkshopCount: number;
  upcomingWorkshopCount: number;
  newMakersNearbyCount: number;
  activeNeighboursCount: number;
  pickupAvailableNearby: boolean;
  hasOpenPickupOrder: boolean;
  newUsersNearby7d: number;
  practicalServiceRequestCount: number;
};

export type ActivationCooldownState = Partial<
  Record<string, { dismissedAt: string | null; lastShownAt: string | null }>
>;

export function deriveActivationRole(
  input: ActivationEligibilityInput,
): ActivationRole {
  if (input.hasDeliveryProfile && !input.hasSellerRole) return 'courier';
  if (input.hasSellerRole && input.productCount > 0) return 'seller';
  if (input.dishCount > 0 || input.hasSellerRole) return 'creator';
  if (input.completedDeals > 0) return 'buyer';
  return 'buyer';
}

export function localScopeBoost(input: ActivationEligibilityInput): number {
  return input.feedScope === 'nearby' && input.hasLocation ? 15 : 0;
}
