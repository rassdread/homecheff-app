/**
 * Seller trust evidence — batch-fetched, no blended ratings.
 * @see docs/audits/TRUST_ENRICHMENT_AUDIT.md
 */

import type { BusinessPlanId } from '@/lib/business/visibility-profile';

export type SellerTrustSnapshot = {
  userId: string;
  hasSellerProfile: boolean;
  hasDeliveryProfile: boolean;
  /** Seller has ≥1 active product listing. */
  hasActiveListing: boolean;
  /** All verified product reviews across seller catalog. */
  productReviewCountSeller: number;
  dealReviewCount: number;
  courierReviewCount: number;
  completedDealsAsSeller: number;
  completedDealsAsBuyer: number;
  completedDeliveries: number;
  /** Delivered/shipped Stripe orders containing seller products. */
  completedProductOrders: number;
  repeatCustomers: number;
  /** Reviews authored by this user (any trust channel). */
  reviewsLeftCount: number;
  trustBadgeSlugs: string[];
  /** Active business subscription plan — from visibility-profile SSOT. */
  businessPlan: BusinessPlanId;
};

export function emptySellerTrustSnapshot(userId: string): SellerTrustSnapshot {
  return {
    userId,
    hasSellerProfile: false,
    hasDeliveryProfile: false,
    hasActiveListing: false,
    productReviewCountSeller: 0,
    dealReviewCount: 0,
    courierReviewCount: 0,
    completedDealsAsSeller: 0,
    completedDealsAsBuyer: 0,
    completedDeliveries: 0,
    completedProductOrders: 0,
    repeatCustomers: 0,
    reviewsLeftCount: 0,
    trustBadgeSlugs: [],
    businessPlan: 'individual',
  };
}

/** Input for tier derivation — listing + seller snapshot. */
export type TrustTierEvidence = {
  listingProductReviewCount: number;
  listingIsActive: boolean;
  snapshot: SellerTrustSnapshot;
};
