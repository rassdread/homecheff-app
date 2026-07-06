import type { DiscoveryTrustContract } from '../contracts/discovery-trust-contract';
import { EMPTY_DISCOVERY_TRUST_CONTRACT } from '../contracts/discovery-trust-contract';
import type { DiscoveryTrustBadge } from '../contracts/discovery-read-model';
import {
  deriveBuyerTier,
  deriveCourierChannelTier,
  deriveCourierTier,
  deriveDealChannelTier,
  deriveProductChannelTier,
  deriveSellerTier,
} from './derive-trust-tier';
import { trustChannelBlock } from './trust-channel-utils';
import { filterTrustBadges } from './trust-badge-utils';
import type { SellerTrustSnapshot, TrustTierEvidence } from './types';
import { emptySellerTrustSnapshot } from './types';

export type BuildDiscoveryTrustInput = {
  /** Listing-level product review count (this product/dish). */
  listingProductReviewCount?: number;
  listingIsActive?: boolean;
  sellerSnapshot?: SellerTrustSnapshot | null;
  trustBadges?: DiscoveryTrustBadge[];
  /** Override deal/courier counts when snapshot absent (defaults 0). */
  dealReviewCount?: number;
  courierReviewCount?: number;
  completedDeals?: number;
  completedDeliveries?: number;
  repeatCustomers?: number;
};

/**
 * Build canonical DiscoveryTrustContract from seller snapshot + listing context.
 * No ranking. No blended ratings.
 */
export function buildDiscoveryTrust(
  input: BuildDiscoveryTrustInput = {},
): DiscoveryTrustContract {
  const listingProductReviewCount = input.listingProductReviewCount ?? 0;
  const listingIsActive = input.listingIsActive ?? true;
  const snapshot =
    input.sellerSnapshot ??
    emptySellerTrustSnapshot('');

  const evidence: TrustTierEvidence = {
    listingProductReviewCount,
    listingIsActive,
    snapshot,
  };

  const productTier = deriveProductChannelTier(evidence);
  const dealTier = deriveDealChannelTier(snapshot);
  const courierTier = deriveCourierChannelTier(snapshot);

  const badges = filterTrustBadges(input.trustBadges ?? []);

  const completedDeals =
    input.completedDeals ??
    snapshot.completedDealsAsSeller + snapshot.completedDealsAsBuyer;
  const completedDeliveries =
    input.completedDeliveries ?? snapshot.completedDeliveries;
  const repeatCustomers = input.repeatCustomers ?? snapshot.repeatCustomers;

  return {
    product: trustChannelBlock(listingProductReviewCount, productTier),
    deal: trustChannelBlock(
      input.dealReviewCount ?? snapshot.dealReviewCount,
      dealTier,
    ),
    courier: trustChannelBlock(
      input.courierReviewCount ?? snapshot.courierReviewCount,
      courierTier,
    ),
    completedDeals,
    completedDeliveries,
    repeatCustomers,
    trustBadges: badges,
    sellerTier: deriveSellerTier(snapshot, listingIsActive),
    buyerTier: deriveBuyerTier(snapshot),
    courierTier: deriveCourierTier(snapshot),
  };
}

export { EMPTY_DISCOVERY_TRUST_CONTRACT };
