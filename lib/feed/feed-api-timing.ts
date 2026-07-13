/**
 * Server-side feed API phase timing (Phase 13K + Phase 2).
 * No PII — counts and milliseconds only.
 *
 * Enabled: NODE_ENV=development OR FEED_PERF_TIMING=1
 */

import type { PrismaPerfSnapshot } from '@/lib/performance/prisma-perf-types';
import type { TrustTimingDebugPayload } from '@/lib/feed/trust-timing-debug';

export type FeedApiTimingPhase =
  | 'request_received'
  | 'params_parsed'
  | 'session_resolved'
  | 'viewer_geo_resolved'
  | 'db_product_listing_done'
  | 'db_dish_linked_done'
  | 'db_parallel_done'
  | 'transform_done'
  | 'stats_enrichment_done'
  | 'trust_business_dna_done'
  | 'discovery_attach_done'
  | 'discovery_sections_done'
  | 'activity_slots_done'
  | 'discovery_done'
  | 'response_mapped'
  | 'stats_preview_done'
  | 'serialize_done'
  | 'response_sent';

/** Server-Timing friendly buckets (Phase 2 + 3A sub-phases). */
export type FeedApiTimingBucket =
  | 'auth'
  | 'geo'
  | 'feed-db'
  | 'db-product'
  | 'db-listing'
  | 'db-dish'
  | 'db-linked-media'
  | 'transform'
  | 'stats'
  | 'trust'
  | 'discovery-attach'
  | 'discovery-sections'
  | 'discovery-activity'
  | 'stats-preview'
  | 'discovery'
  | 'mapping'
  | 'serialize'
  | 'prisma'
  | 'total';

export type FeedApiTimingPayload = {
  totalMs: number;
  phases: Partial<Record<FeedApiTimingPhase, number>>;
  buckets: Partial<Record<FeedApiTimingBucket, number>>;
  counts: {
    productsDb: number;
    listingsDb: number;
    dishesDb: number;
    responseItems: number;
    discoveryPool: number;
    sellerTrustLookups: number;
    prismaQueryBatches: number;
    prismaQueryCount?: number;
    prismaTotalMs?: number;
    dbProductMs?: number;
    dbListingMs?: number;
    dbDishMs?: number;
    dbLinkedMediaMs?: number;
    productMetadataMs?: number;
    dishMetadataMs?: number;
    trustTotalMs?: number;
    statsPreviewDeferred?: boolean;
  };
  prisma?: PrismaPerfSnapshot;
  responseBytesEstimate?: number;
  trustTiming?: TrustTimingDebugPayload | null;
};

export function isFeedApiTimingEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.FEED_PERF_TIMING === '1'
  );
}

function phaseDelta(
  phases: Partial<Record<FeedApiTimingPhase, number>>,
  from: FeedApiTimingPhase,
  to: FeedApiTimingPhase,
): number | null {
  const a = phases[from];
  const b = phases[to];
  if (a == null || b == null) return null;
  return Math.max(0, Math.round(b - a));
}

function buildBuckets(
  phases: Partial<Record<FeedApiTimingPhase, number>>,
  prisma?: PrismaPerfSnapshot | null,
): Partial<Record<FeedApiTimingBucket, number>> {
  const buckets: Partial<Record<FeedApiTimingBucket, number>> = {};
  const put = (key: FeedApiTimingBucket, from: FeedApiTimingPhase, to: FeedApiTimingPhase) => {
    const d = phaseDelta(phases, from, to);
    if (d != null) buckets[key] = d;
  };

  put('auth', 'params_parsed', 'session_resolved');
  put('geo', 'session_resolved', 'viewer_geo_resolved');
  put('db-product', 'viewer_geo_resolved', 'db_product_listing_done');
  put('db-dish', 'db_product_listing_done', 'db_dish_linked_done');
  put('db-linked-media', 'db_product_listing_done', 'db_dish_linked_done');
  put('feed-db', 'viewer_geo_resolved', 'db_parallel_done');
  put('transform', 'db_parallel_done', 'transform_done');
  put('stats', 'transform_done', 'stats_enrichment_done');
  put('trust', 'stats_enrichment_done', 'trust_business_dna_done');
  put('discovery-attach', 'trust_business_dna_done', 'discovery_attach_done');
  put('discovery-sections', 'discovery_attach_done', 'discovery_sections_done');
  put('discovery-activity', 'discovery_sections_done', 'activity_slots_done');
  put('mapping', 'activity_slots_done', 'response_mapped');
  put('serialize', 'response_mapped', 'serialize_done');

  // Legacy aggregate bucket (trust → discovery_done) for preview dashboards.
  put('discovery', 'trust_business_dna_done', 'discovery_done');

  if (prisma?.totalMs != null) {
    buckets.prisma = Math.round(prisma.totalMs);
  }

  const end = phases.serialize_done ?? phases.response_sent;
  if (end != null) buckets.total = end;

  return buckets;
}

export function createFeedApiTiming() {
  const start = performance.now();
  const phases: Partial<Record<FeedApiTimingPhase, number>> = {
    request_received: 0,
  };
  const counts = {
    productsDb: 0,
    listingsDb: 0,
    dishesDb: 0,
    responseItems: 0,
    discoveryPool: 0,
    sellerTrustLookups: 0,
    prismaQueryBatches: 0,
  };
  let prismaSnapshot: PrismaPerfSnapshot | null = null;

  function mark(phase: FeedApiTimingPhase): void {
    phases[phase] = Math.round(performance.now() - start);
  }

  function setCounts(partial: Partial<typeof counts>): void {
    Object.assign(counts, partial);
  }

  function setPrismaSnapshot(snapshot: PrismaPerfSnapshot | null): void {
    prismaSnapshot = snapshot;
    if (snapshot) {
      counts.prismaQueryCount = snapshot.queryCount;
      counts.prismaTotalMs = snapshot.totalMs;
    }
  }

  function toPayload(
    responseBytesEstimate?: number,
    options?: { finalize?: boolean },
  ): FeedApiTimingPayload {
    if (options?.finalize !== false) {
      if (phases.serialize_done == null && phases.response_mapped != null) {
        phases.serialize_done = Math.round(performance.now() - start);
      }
      mark('response_sent');
    }
    const buckets = buildBuckets(phases, prismaSnapshot);
    return {
      totalMs: Math.round(performance.now() - start),
      phases: { ...phases },
      buckets,
      counts: { ...counts },
      ...(prismaSnapshot ? { prisma: prismaSnapshot } : {}),
      ...(responseBytesEstimate != null
        ? { responseBytesEstimate }
        : {}),
    };
  }

  function toServerTimingHeader(): string | null {
    if (!isFeedApiTimingEnabled()) return null;
    const payload = toPayload(undefined, { finalize: false });
    const entries: string[] = [];

    const bucketOrder: FeedApiTimingBucket[] = [
      'auth',
      'geo',
      'feed-db',
      'transform',
      'stats',
      'trust',
      'discovery-attach',
      'discovery-sections',
      'discovery-activity',
      'mapping',
      'serialize',
      'db-product',
      'db-dish',
      'db-linked-media',
      'discovery',
      'prisma',
      'total',
    ];

    for (const key of bucketOrder) {
      const dur = payload.buckets[key];
      if (dur == null) continue;
      entries.push(`${key};dur=${dur}`);
    }

    if (payload.counts.prismaQueryCount != null) {
      entries.push(`prisma-count;dur=0;desc="${payload.counts.prismaQueryCount} queries"`);
    }

    return entries.length ? entries.join(', ') : null;
  }

  return { mark, setCounts, setPrismaSnapshot, toPayload, toServerTimingHeader };
}
