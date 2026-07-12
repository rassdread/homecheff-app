/**
 * Bounded in-memory TTL cache for seller trust snapshots (Phase 3D).
 * Best-effort on Vercel serverless — no cross-instance consistency.
 */

import type { SellerTrustSnapshot } from './types';
import {
  fetchSellerTrustSnapshotsWithReport,
  type FetchSellerTrustSnapshotsOptions,
} from './fetch-seller-trust-snapshots';
import type { TrustSnapshotTimingReport } from './trust-snapshot-timing';

/** Bump when SellerTrustSnapshot semantics change. */
export const TRUST_SNAPSHOT_CACHE_VERSION = '1';

export const TRUST_SNAPSHOT_CACHE_TTL_MS = 60_000;
export const TRUST_SNAPSHOT_CACHE_MAX_ENTRIES = 200;

export type TrustSnapshotCacheStats = {
  version: string;
  ttlMs: number;
  maxEntries: number;
  hits: number;
  misses: number;
  expired: number;
  evictions: number;
  size: number;
  missSellerCount: number;
};

type CacheEntry = {
  snapshot: SellerTrustSnapshot;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();
let hits = 0;
let misses = 0;
let expired = 0;
let evictions = 0;

function cacheKey(userId: string, mode: 'minimal' | 'full'): string {
  return `${TRUST_SNAPSHOT_CACHE_VERSION}:${mode}:${userId}`;
}

function pruneExpired(now: number): void {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
      expired += 1;
    }
  }
}

function evictIfNeeded(): void {
  while (cache.size > TRUST_SNAPSHOT_CACHE_MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    cache.delete(oldestKey);
    evictions += 1;
  }
}

export function getTrustSnapshotCacheStats(): TrustSnapshotCacheStats {
  return {
    version: TRUST_SNAPSHOT_CACHE_VERSION,
    ttlMs: TRUST_SNAPSHOT_CACHE_TTL_MS,
    maxEntries: TRUST_SNAPSHOT_CACHE_MAX_ENTRIES,
    hits,
    misses,
    expired,
    evictions,
    size: cache.size,
    missSellerCount: 0,
  };
}

/** Test helper */
export function resetTrustSnapshotCacheForTests(): void {
  cache.clear();
  hits = 0;
  misses = 0;
  expired = 0;
  evictions = 0;
}

export async function fetchSellerTrustSnapshotsWithReportCached(
  userIds: string[],
  options: FetchSellerTrustSnapshotsOptions = {},
): Promise<{
  snapshots: Map<string, SellerTrustSnapshot>;
  timing: TrustSnapshotTimingReport | null;
  cacheStats: TrustSnapshotCacheStats;
}> {
  const mode = options.mode ?? 'full';
  const unique = [...new Set(userIds.filter(Boolean))];
  const now = Date.now();
  pruneExpired(now);

  const snapshots = new Map<string, SellerTrustSnapshot>();
  const missIds: string[] = [];

  for (const uid of unique) {
    const entry = cache.get(cacheKey(uid, mode));
    if (entry && entry.expiresAt > now) {
      snapshots.set(uid, entry.snapshot);
      hits += 1;
    } else {
      missIds.push(uid);
      misses += 1;
    }
  }

  let timing: TrustSnapshotTimingReport | null = null;

  if (missIds.length > 0) {
    const fetched = await fetchSellerTrustSnapshotsWithReport(missIds, options);
    timing = fetched.timing;
    const expiresAt = now + TRUST_SNAPSHOT_CACHE_TTL_MS;
    for (const [uid, snapshot] of fetched.snapshots) {
      snapshots.set(uid, snapshot);
      cache.set(cacheKey(uid, mode), { snapshot, expiresAt });
    }
    evictIfNeeded();
  }

  const stats = getTrustSnapshotCacheStats();
  stats.missSellerCount = missIds.length;
  return { snapshots, timing, cacheStats: stats };
}
