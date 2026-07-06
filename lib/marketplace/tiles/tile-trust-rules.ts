/**
 * Trust channel selection rules per ListingKind.
 * @see docs/audits/MARKETPLACE_DISCOVERY_CARD_RULES.md
 */

import type { ListingKind } from '@/lib/marketplace/contracts/listing-kind-contract';
import type { MarketplaceTileTrust } from './types';

export const TILE_TRUST_FORBIDDEN_FIELDS = [
  'averageRating',
  'viewCount',
  'propsCount',
  'fansCount',
  'hcpPoints',
  'workspacePropsCount',
] as const;

/** Primary review/deal count for trust cue by kind. */
export function getPrimaryTrustCount(
  kind: ListingKind,
  trust: MarketplaceTileTrust,
): number {
  switch (kind) {
    case 'PRODUCT':
      return trust.productReviewCount;
    case 'INSPIRATION':
      return 0;
    case 'REQUEST':
    case 'SERVICE':
    case 'TASK':
    case 'WORKSHOP':
    case 'COACHING':
      return trust.dealReviewCount > 0
        ? trust.dealReviewCount
        : trust.completedDeals;
    default:
      return trust.dealReviewCount;
  }
}

export function shouldShowTrustCue(kind: ListingKind): boolean {
  return kind !== 'INSPIRATION';
}

export function usesProductTrustChannel(kind: ListingKind): boolean {
  return kind === 'PRODUCT';
}

export function usesDealTrustChannel(kind: ListingKind): boolean {
  return (
    kind === 'SERVICE' ||
    kind === 'TASK' ||
    kind === 'WORKSHOP' ||
    kind === 'COACHING' ||
    kind === 'REQUEST'
  );
}
