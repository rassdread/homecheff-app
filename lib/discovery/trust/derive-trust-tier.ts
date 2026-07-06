/**
 * Trust tier derivation — exact rules from TRUST_TIER_SPEC.md (Phase 2A).
 * No reputationScore. No blended ratings.
 */

import type { TrustTierLevel } from '../contracts/discovery-trust-contract';
import {
  TRUST_TIER_ACTIVE,
  TRUST_TIER_ESTABLISHED,
  TRUST_TIER_EXPERT,
  TRUST_TIER_PRESENT,
  TRUST_TIER_REVIEWED,
  TRUST_TIER_UNKNOWN,
} from '../contracts/discovery-trust-contract';
import type { SellerTrustSnapshot, TrustTierEvidence } from './types';
import { maxTier } from './trust-channel-utils';

function hasSlug(slugs: string[], target: string): boolean {
  const t = target.toLowerCase();
  return slugs.some((s) => s.toLowerCase() === t);
}

function applySellerBadgeFloors(
  tier: TrustTierLevel,
  slugs: string[],
): TrustTierLevel {
  let t = tier;
  if (hasSlug(slugs, 'eerste-verkoop') || hasSlug(slugs, 'eerste-afspraak')) {
    t = maxTier(t, TRUST_TIER_ACTIVE);
  }
  if (hasSlug(slugs, 'eerste-review')) {
    t = maxTier(t, TRUST_TIER_REVIEWED);
  }
  if (hasSlug(slugs, 'betrouwbare-verkoper')) {
    t = maxTier(t, TRUST_TIER_ESTABLISHED);
  }
  return t;
}

function applyBuyerBadgeFloors(
  tier: TrustTierLevel,
  slugs: string[],
): TrustTierLevel {
  if (hasSlug(slugs, 'vaste-klant')) {
    return maxTier(tier, TRUST_TIER_EXPERT);
  }
  return tier;
}

function applyCourierBadgeFloors(
  tier: TrustTierLevel,
  slugs: string[],
): TrustTierLevel {
  if (hasSlug(slugs, 'betrouwbare-bezorger')) {
    return maxTier(tier, TRUST_TIER_ESTABLISHED);
  }
  return tier;
}

/**
 * Seller tier — product + deal channels (never blended averages).
 */
export function deriveSellerTier(
  snapshot: SellerTrustSnapshot,
  listingIsActive: boolean,
): TrustTierLevel {
  const {
    hasSellerProfile,
    productReviewCountSeller,
    dealReviewCount,
    completedDealsAsSeller,
    completedProductOrders,
    repeatCustomers,
    trustBadgeSlugs,
  } = snapshot;

  const totalReviews = productReviewCountSeller + dealReviewCount;

  if (!hasSellerProfile && !listingIsActive) {
    return TRUST_TIER_UNKNOWN;
  }

  let tier: TrustTierLevel = TRUST_TIER_PRESENT;

  if (listingIsActive || hasSellerProfile) {
    tier = TRUST_TIER_PRESENT;
  }

  if (completedDealsAsSeller >= 1 || completedProductOrders >= 1) {
    tier = maxTier(tier, TRUST_TIER_ACTIVE);
  }

  if (productReviewCountSeller >= 1 || dealReviewCount >= 1) {
    tier = maxTier(tier, TRUST_TIER_REVIEWED);
  }

  if (
    totalReviews >= 3 ||
    repeatCustomers >= 2 ||
    hasSlug(trustBadgeSlugs, 'betrouwbare-verkoper')
  ) {
    tier = maxTier(tier, TRUST_TIER_ESTABLISHED);
  }

  if (
    (totalReviews >= 10 && repeatCustomers >= 3) ||
    completedDealsAsSeller >= 5
  ) {
    tier = maxTier(tier, TRUST_TIER_EXPERT);
  }

  return applySellerBadgeFloors(tier, trustBadgeSlugs);
}

/** Buyer tier — gates request/barter matching (not listing rank). */
export function deriveBuyerTier(snapshot: SellerTrustSnapshot): TrustTierLevel {
  const {
    completedDealsAsBuyer,
    completedProductOrders,
    reviewsLeftCount,
    repeatCustomers,
    trustBadgeSlugs,
  } = snapshot;

  // Registered account baseline
  let tier: TrustTierLevel = TRUST_TIER_PRESENT;

  if (completedDealsAsBuyer >= 1 || completedProductOrders >= 1) {
    tier = maxTier(tier, TRUST_TIER_ACTIVE);
  }

  if (reviewsLeftCount >= 1) {
    tier = maxTier(tier, TRUST_TIER_REVIEWED);
  }

  if (completedDealsAsBuyer >= 2) {
    tier = maxTier(tier, TRUST_TIER_ESTABLISHED);
  }

  if (completedDealsAsBuyer >= 3 && repeatCustomers >= 1) {
    tier = maxTier(tier, TRUST_TIER_EXPERT);
  }

  return applyBuyerBadgeFloors(tier, trustBadgeSlugs);
}

/** Courier tier — DeliveryReview + CourierAssignment only. */
export function deriveCourierTier(snapshot: SellerTrustSnapshot): TrustTierLevel {
  const {
    hasDeliveryProfile,
    courierReviewCount,
    completedDeliveries,
    trustBadgeSlugs,
  } = snapshot;

  if (!hasDeliveryProfile) {
    return TRUST_TIER_UNKNOWN;
  }

  let tier: TrustTierLevel = TRUST_TIER_PRESENT;

  if (completedDeliveries >= 1) {
    tier = maxTier(tier, TRUST_TIER_ACTIVE);
  }

  if (courierReviewCount >= 1) {
    tier = maxTier(tier, TRUST_TIER_REVIEWED);
  }

  if (
    courierReviewCount >= 3 ||
    hasSlug(trustBadgeSlugs, 'betrouwbare-bezorger')
  ) {
    tier = maxTier(tier, TRUST_TIER_ESTABLISHED);
  }

  if (completedDeliveries >= 10 && courierReviewCount >= 5) {
    tier = maxTier(tier, TRUST_TIER_EXPERT);
  }

  return applyCourierBadgeFloors(tier, trustBadgeSlugs);
}

/** Product channel tier for listing trust block. */
export function deriveProductChannelTier(
  evidence: TrustTierEvidence,
): TrustTierLevel {
  const { listingProductReviewCount, listingIsActive, snapshot } = evidence;
  const sellerTier = deriveSellerTier(snapshot, listingIsActive);

  if (!listingIsActive && listingProductReviewCount === 0) {
    return TRUST_TIER_UNKNOWN;
  }

  let tier: TrustTierLevel = listingIsActive
    ? TRUST_TIER_PRESENT
    : TRUST_TIER_UNKNOWN;

  if (
    snapshot.completedProductOrders >= 1 ||
    snapshot.completedDealsAsSeller >= 1
  ) {
    tier = maxTier(tier, TRUST_TIER_ACTIVE);
  }

  if (listingProductReviewCount >= 1 || snapshot.productReviewCountSeller >= 1) {
    tier = maxTier(tier, TRUST_TIER_REVIEWED);
  }

  if (
    listingProductReviewCount >= 3 ||
    snapshot.repeatCustomers >= 2 ||
    hasSlug(snapshot.trustBadgeSlugs, 'betrouwbare-verkoper')
  ) {
    tier = maxTier(tier, TRUST_TIER_ESTABLISHED);
  }

  if (
    listingProductReviewCount >= 10 ||
    sellerTier >= TRUST_TIER_EXPERT
  ) {
    tier = maxTier(tier, TRUST_TIER_EXPERT);
  }

  return tier;
}

/** Deal channel tier (seller-scoped). */
export function deriveDealChannelTier(
  snapshot: SellerTrustSnapshot,
): TrustTierLevel {
  if (!snapshot.hasSellerProfile && snapshot.completedDealsAsSeller === 0) {
    return TRUST_TIER_UNKNOWN;
  }

  let tier: TrustTierLevel = TRUST_TIER_PRESENT;

  if (snapshot.completedDealsAsSeller >= 1) {
    tier = maxTier(tier, TRUST_TIER_ACTIVE);
  }

  if (snapshot.dealReviewCount >= 1) {
    tier = maxTier(tier, TRUST_TIER_REVIEWED);
  }

  if (
    snapshot.dealReviewCount >= 3 ||
    snapshot.repeatCustomers >= 2 ||
    hasSlug(snapshot.trustBadgeSlugs, 'betrouwbare-verkoper')
  ) {
    tier = maxTier(tier, TRUST_TIER_ESTABLISHED);
  }

  if (snapshot.dealReviewCount >= 10 || snapshot.completedDealsAsSeller >= 5) {
    tier = maxTier(tier, TRUST_TIER_EXPERT);
  }

  return tier;
}

/** Courier channel tier (seller/courier-scoped). */
export function deriveCourierChannelTier(
  snapshot: SellerTrustSnapshot,
): TrustTierLevel {
  return deriveCourierTier(snapshot);
}
