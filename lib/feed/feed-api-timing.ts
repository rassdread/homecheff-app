/**
 * Server-side feed API phase timing (Phase 13K baseline).
 * No PII — counts and milliseconds only.
 *
 * Enabled: NODE_ENV=development OR FEED_PERF_TIMING=1
 */

export type FeedApiTimingPhase =
  | 'request_received'
  | 'params_parsed'
  | 'session_resolved'
  | 'viewer_geo_resolved'
  | 'db_parallel_done'
  | 'transform_done'
  | 'stats_enrichment_done'
  | 'trust_business_dna_done'
  | 'discovery_done'
  | 'response_mapped'
  | 'response_sent';

export type FeedApiTimingPayload = {
  totalMs: number;
  phases: Partial<Record<FeedApiTimingPhase, number>>;
  counts: {
    productsDb: number;
    listingsDb: number;
    dishesDb: number;
    responseItems: number;
    discoveryPool: number;
    sellerTrustLookups: number;
    prismaQueryBatches: number;
  };
  responseBytesEstimate?: number;
};

export function isFeedApiTimingEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.FEED_PERF_TIMING === '1'
  );
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

  function mark(phase: FeedApiTimingPhase): void {
    phases[phase] = Math.round(performance.now() - start);
  }

  function setCounts(partial: Partial<typeof counts>): void {
    Object.assign(counts, partial);
  }

  function toPayload(responseBytesEstimate?: number): FeedApiTimingPayload {
    mark('response_sent');
    return {
      totalMs: Math.round(performance.now() - start),
      phases: { ...phases },
      counts: { ...counts },
      ...(responseBytesEstimate != null
        ? { responseBytesEstimate }
        : {}),
    };
  }

  function toServerTimingHeader(): string | null {
    if (!isFeedApiTimingEnabled()) return null;
    const entries: string[] = [];
    const ordered: FeedApiTimingPhase[] = [
      'params_parsed',
      'session_resolved',
      'viewer_geo_resolved',
      'db_parallel_done',
      'transform_done',
      'stats_enrichment_done',
      'trust_business_dna_done',
      'discovery_done',
      'response_mapped',
      'response_sent',
    ];
    let prev = 0;
    for (const key of ordered) {
      const at = phases[key];
      if (at == null) continue;
      const dur = Math.max(0, at - prev);
      prev = at;
      entries.push(`${key};dur=${dur}`);
    }
    const total = Math.round(performance.now() - start);
    entries.push(`total;dur=${total}`);
    return entries.length ? entries.join(', ') : null;
  }

  return { mark, setCounts, toPayload, toServerTimingHeader };
}
