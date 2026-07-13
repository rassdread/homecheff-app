/**
 * Phase 3F — Origin Data Cache for anonymous national first-page feed.
 */

import { unstable_cache } from 'next/cache';
import type { DiscoveryFeedPayload } from '@/lib/feed/discovery-feed-contract';
import type { FeedPaginationMeta } from '@/lib/feed/feed-pagination';
import {
  FEED_ORIGIN_CACHE_KEY_VERSION,
  PUBLIC_FEED_CACHE_TAGS,
} from '@/lib/feed/feed-cache-keys';

export const FEED_ORIGIN_CACHE_TTL_SECONDS = 45;

export type FeedOriginCachePayload = {
  items: Record<string, unknown>[];
  discovery: DiscoveryFeedPayload | null;
  pagination: FeedPaginationMeta;
  feedTotal: number;
};

export type FeedOriginCacheStatus = 'hit' | 'miss' | 'bypass';

export async function readAnonymousNationalOriginCache(
  cacheKey: string,
  builder: () => Promise<FeedOriginCachePayload>,
): Promise<{ payload: FeedOriginCachePayload; status: FeedOriginCacheStatus }> {
  const probe = { miss: false };
  const cachedFn = unstable_cache(
    async () => {
      probe.miss = true;
      const payload = await builder();
      if (!payload || !Array.isArray(payload.items)) {
        throw new Error('feed origin cache builder returned invalid payload');
      }
      return payload;
    },
    [cacheKey, FEED_ORIGIN_CACHE_KEY_VERSION],
    {
      revalidate: FEED_ORIGIN_CACHE_TTL_SECONDS,
      tags: [...PUBLIC_FEED_CACHE_TAGS],
    },
  );
  const payload = await cachedFn();
  return {
    payload,
    status: probe.miss ? 'miss' : 'hit',
  };
}

export function isValidOriginCachePayload(
  payload: unknown,
): payload is FeedOriginCachePayload {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as FeedOriginCachePayload;
  return Array.isArray(p.items) && p.pagination != null;
}
