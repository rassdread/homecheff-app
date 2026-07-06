/**
 * Detail trust block — Phase 4C.
 * Maps DiscoveryTrustContract to allowed detail display lines only.
 */

import type { DiscoveryTrustContract } from '@/lib/discovery/contracts/discovery-trust-contract';
import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import { DISCOVERY_TRUST_FORBIDDEN_SIGNALS } from '@/lib/discovery/contracts/discovery-trust-contract';

const KEY = 'marketplace.detail.trust';

export type DetailTrustLineKind =
  | 'product_reviews'
  | 'deal_reviews'
  | 'completed_deals'
  | 'deliveries'
  | 'repeat_customers'
  | 'trust_badge'
  | 'seller_tier';

export type DetailTrustLine = {
  kind: DetailTrustLineKind;
  labelKey: string;
  count?: number;
  badgeId?: string;
};

export type DetailTrustBlockPlan = {
  lines: DetailTrustLine[];
  primaryChannel: 'product' | 'deal' | 'courier';
};

/** Primary trust channel per ListingKind — aligns with LISTING_KIND_SPEC. */
export function primaryTrustChannelForKind(
  kind: ListingKind,
): DetailTrustBlockPlan['primaryChannel'] {
  switch (kind) {
    case 'PRODUCT':
      return 'product';
    case 'SERVICE':
    case 'TASK':
    case 'WORKSHOP':
    case 'COACHING':
    case 'REQUEST':
      return 'deal';
    default:
      return 'product';
  }
}

export function buildDetailTrustBlock(
  trust: DiscoveryTrustContract,
  kind: ListingKind,
): DetailTrustBlockPlan {
  const primaryChannel = primaryTrustChannelForKind(kind);
  const lines: DetailTrustLine[] = [];

  if (trust.product.reviewCount > 0) {
    lines.push({
      kind: 'product_reviews',
      labelKey: `${KEY}.productReviews`,
      count: trust.product.reviewCount,
    });
  }

  if (trust.deal.reviewCount > 0) {
    lines.push({
      kind: 'deal_reviews',
      labelKey: `${KEY}.dealReviews`,
      count: trust.deal.reviewCount,
    });
  }

  if (trust.completedDeals > 0) {
    lines.push({
      kind: 'completed_deals',
      labelKey: `${KEY}.completedDeals`,
      count: trust.completedDeals,
    });
  }

  if (trust.courier.reviewCount > 0 || trust.completedDeliveries > 0) {
    lines.push({
      kind: 'deliveries',
      labelKey: `${KEY}.deliveries`,
      count: trust.completedDeliveries,
    });
  }

  if (trust.repeatCustomers > 0) {
    lines.push({
      kind: 'repeat_customers',
      labelKey: `${KEY}.repeatCustomers`,
      count: trust.repeatCustomers,
    });
  }

  for (const badge of trust.trustBadges) {
    lines.push({
      kind: 'trust_badge',
      labelKey: `${KEY}.badge`,
      badgeId: badge.key,
    });
  }

  if (trust.sellerTier >= 4 && lines.length < 4) {
    lines.push({
      kind: 'seller_tier',
      labelKey: `${KEY}.establishedMaker`,
    });
  }

  return { lines: lines.slice(0, 5), primaryChannel };
}

export function detailTrustUsesForbiddenSignals(
  payload: Record<string, unknown>,
): string[] {
  const violations: string[] = [];
  for (const signal of DISCOVERY_TRUST_FORBIDDEN_SIGNALS) {
    if (signal in payload && payload[signal] != null) {
      violations.push(signal);
    }
  }
  return violations;
}
