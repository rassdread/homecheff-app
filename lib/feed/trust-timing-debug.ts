/**
 * Stable trust timing shape for debug.perf (Phase 3D-Final).
 */

import type { TrustEnrichmentTiming } from '@/lib/feed/trust-enrichment-timing';
import type { TrustSnapshotTimingReport } from '@/lib/discovery/trust/trust-snapshot-timing';

export type TrustCacheStatsDebug = {
  hits: number;
  misses: number;
  expired: number;
  entries: number;
  ttlMs: number;
  version: string;
  missSellerCount: number;
  evictions: number;
};

export type TrustTimingDebugPayload = {
  mode: 'minimal' | 'full';
  totalMs: number;
  bundlesMs: number;
  sellerCount: number;
  cacheStats: TrustCacheStatsDebug | null;
  snapshotTiming: TrustSnapshotTimingReport | null;
};

export function buildTrustTimingDebugPayload(
  timing: TrustEnrichmentTiming | null | undefined,
): TrustTimingDebugPayload | null {
  if (!timing) return null;

  const cacheStats = timing.cacheStats
    ? {
        hits: timing.cacheStats.hits,
        misses: timing.cacheStats.misses,
        expired: timing.cacheStats.expired ?? 0,
        entries: timing.cacheStats.size,
        ttlMs: timing.cacheStats.ttlMs,
        version: timing.cacheStats.version,
        missSellerCount: timing.cacheStats.missSellerCount,
        evictions: timing.cacheStats.evictions,
      }
    : null;

  return {
    mode: timing.mode,
    totalMs: timing.totalMs,
    bundlesMs: timing.bundlesMs,
    sellerCount: timing.sellerCount,
    cacheStats,
    snapshotTiming: timing.snapshotTiming ?? null,
  };
}
