import type { DiscoveryTrustContract } from '@/lib/discovery/contracts/discovery-trust-contract';
import type { MarketplaceTileTrust } from '@/lib/marketplace/tiles/types';

export function mapDiscoveryTrustToTileTrust(
  trust: DiscoveryTrustContract,
): MarketplaceTileTrust {
  return {
    productReviewCount: trust.product.reviewCount,
    dealReviewCount: trust.deal.reviewCount,
    courierReviewCount: trust.courier.reviewCount,
    completedDeals: trust.completedDeals,
    completedDeliveries: trust.completedDeliveries,
    repeatCustomers: trust.repeatCustomers,
    trustBadges: trust.trustBadges,
    sellerTier: trust.sellerTier,
    businessPlan: trust.businessPlan,
  };
}

export const EMPTY_TILE_TRUST: MarketplaceTileTrust = {
  productReviewCount: 0,
  dealReviewCount: 0,
  courierReviewCount: 0,
  completedDeals: 0,
  completedDeliveries: 0,
  repeatCustomers: 0,
  trustBadges: [],
  sellerTier: 0,
};
