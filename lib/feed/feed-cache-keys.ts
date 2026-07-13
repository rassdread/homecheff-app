/**
 * Phase 3F — Normalized feed cache keys (no lat/lng for national Tier A).
 */

import { normalizeFeedScope } from '@/lib/feed/feed-scope';

export const FEED_ORIGIN_CACHE_KEY_VERSION = 'v1';

export const PUBLIC_FEED_CACHE_TAGS = [
  'homecheff-feed',
  'homecheff-feed:national',
] as const;

export type FeedOriginCacheKeyInput = {
  feedScope: string;
  take: number;
  skip: number;
  vertical: string;
  listingIntent?: string | null;
  listingKind?: string | null;
};

/** Stable origin cache key — excludes lat/lng, cookies, perf params. */
export function buildFeedOriginCacheKey(input: FeedOriginCacheKeyInput): string {
  const scope = normalizeFeedScope(input.feedScope);
  const parts = [
    FEED_ORIGIN_CACHE_KEY_VERSION,
    scope,
    'r0',
    `take${input.take}`,
    `skip${input.skip}`,
    `v${input.vertical || 'all'}`,
    input.listingIntent ? `li${input.listingIntent}` : 'li-',
    input.listingKind ? `lk${input.listingKind}` : 'lk-',
  ];
  return parts.join(':');
}
