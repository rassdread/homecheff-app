import type { DiscoveryTrustBadge } from '../contracts/discovery-read-model';
import type { DiscoveryEnrichment } from '../mappers/enrichment';
import { fetchSellerTrustSnapshots } from './fetch-seller-trust-snapshots';
import { emptySellerTrustSnapshot, type SellerTrustSnapshot } from './types';

export type SellerTrustBundle = {
  snapshot: SellerTrustSnapshot;
  trustBadges: DiscoveryTrustBadge[];
};

/**
 * Batch-fetch seller trust snapshots + optional badge map merge.
 * Fixed query rounds — see TRUST_ENRICHMENT_PERFORMANCE.md.
 */
export async function fetchSellerTrustBundles(
  userIds: string[],
  badgeMap?: Map<string, DiscoveryTrustBadge[]>,
): Promise<Map<string, SellerTrustBundle>> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out = new Map<string, SellerTrustBundle>();
  if (unique.length === 0) return out;

  try {
    const snapshots = await fetchSellerTrustSnapshots(unique);
    for (const [uid, snapshot] of snapshots) {
      out.set(uid, {
        snapshot,
        trustBadges: badgeMap?.get(uid) ?? [],
      });
    }
    for (const uid of unique) {
      if (out.has(uid)) continue;
      out.set(uid, {
        snapshot: emptySellerTrustSnapshot(uid),
        trustBadges: badgeMap?.get(uid) ?? [],
      });
    }
    return out;
  } catch (error) {
    console.error('[discovery/trust] fetchSellerTrustBundles failed:', error);
    for (const uid of unique) {
      out.set(uid, {
        snapshot: emptySellerTrustSnapshot(uid),
        trustBadges: badgeMap?.get(uid) ?? [],
      });
    }
    return out;
  }
}

export function discoveryEnrichmentFromBundle(
  bundle: SellerTrustBundle | null | undefined,
  options: {
    productReviewCount?: number;
    listingIsActive?: boolean;
  } = {},
): DiscoveryEnrichment {
  if (!bundle) {
    return {
      productReviewCount: options.productReviewCount,
      listingIsActive: options.listingIsActive,
    };
  }
  return {
    productReviewCount: options.productReviewCount,
    listingIsActive: options.listingIsActive,
    sellerTrustSnapshot: bundle.snapshot,
    trustBadges: bundle.trustBadges,
  };
}
