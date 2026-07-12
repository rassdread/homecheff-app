import type { DiscoveryTrustBadge } from '../contracts/discovery-read-model';
import type { DiscoveryEnrichment } from '../mappers/enrichment';
import {
  fetchSellerTrustSnapshotsWithReport,
  type FetchSellerTrustSnapshotsOptions,
} from './fetch-seller-trust-snapshots';
import type { TrustSnapshotTimingReport } from './trust-snapshot-timing';
import { emptySellerTrustSnapshot, type SellerTrustSnapshot } from './types';

export type SellerTrustBundle = {
  snapshot: SellerTrustSnapshot;
  trustBadges: DiscoveryTrustBadge[];
};

export type FetchSellerTrustBundlesResult = {
  bundles: Map<string, SellerTrustBundle>;
  snapshotTiming: TrustSnapshotTimingReport | null;
};

/**
 * Batch-fetch seller trust snapshots + optional badge map merge.
 */
export async function fetchSellerTrustBundles(
  userIds: string[],
  badgeMap?: Map<string, DiscoveryTrustBadge[]>,
  options: FetchSellerTrustSnapshotsOptions = {},
): Promise<Map<string, SellerTrustBundle>> {
  const result = await fetchSellerTrustBundlesWithReport(userIds, badgeMap, options);
  return result.bundles;
}

export async function fetchSellerTrustBundlesWithReport(
  userIds: string[],
  badgeMap?: Map<string, DiscoveryTrustBadge[]>,
  options: FetchSellerTrustSnapshotsOptions = {},
): Promise<FetchSellerTrustBundlesResult> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const out = new Map<string, SellerTrustBundle>();
  if (unique.length === 0) {
    return { bundles: out, snapshotTiming: null };
  }

  try {
    const { snapshots, timing } = await fetchSellerTrustSnapshotsWithReport(
      unique,
      options,
    );
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
    return { bundles: out, snapshotTiming: timing };
  } catch (error) {
    console.error('[discovery/trust] fetchSellerTrustBundles failed:', error);
    for (const uid of unique) {
      out.set(uid, {
        snapshot: emptySellerTrustSnapshot(uid),
        trustBadges: badgeMap?.get(uid) ?? [],
      });
    }
    return { bundles: out, snapshotTiming: null };
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
