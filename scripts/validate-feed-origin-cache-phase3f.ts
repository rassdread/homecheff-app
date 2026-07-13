#!/usr/bin/env npx tsx
/**
 * Phase 3F.3 — Origin cache key + module contract.
 */
import * as fs from 'node:fs';

import {
  buildFeedOriginCacheKey,
  FEED_ORIGIN_CACHE_KEY_VERSION,
  PUBLIC_FEED_CACHE_TAGS,
} from '../lib/feed/feed-cache-keys';
import {
  FEED_ORIGIN_CACHE_TTL_SECONDS,
  isValidOriginCachePayload,
} from '../lib/feed/feed-origin-cache.server';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

console.log('=== Phase 3F.3 — Origin cache ===\n');

const keyA = buildFeedOriginCacheKey({
  feedScope: 'national',
  take: 10,
  skip: 0,
  vertical: 'all',
});
const keyB = buildFeedOriginCacheKey({
  feedScope: 'national',
  take: 10,
  skip: 0,
  vertical: 'all',
});
ok('cache key stable', keyA === keyB);
ok('cache key excludes coords', !keyA.includes('lat') && !keyA.includes('lng'));
ok('cache key version prefix', keyA.startsWith(`${FEED_ORIGIN_CACHE_KEY_VERSION}:`));
ok('TTL 45s', FEED_ORIGIN_CACHE_TTL_SECONDS === 45);
ok('tags include homecheff-feed', PUBLIC_FEED_CACHE_TAGS.includes('homecheff-feed'));
ok('tags include national', PUBLIC_FEED_CACHE_TAGS.includes('homecheff-feed:national'));

ok(
  'valid payload shape',
  isValidOriginCachePayload({
    items: [],
    discovery: null,
    pagination: { take: 10, skip: 0, hasMore: false, total: 0 },
    feedTotal: 0,
  }),
);
ok('invalid payload rejected', !isValidOriginCachePayload({ foo: 1 }));

const route = fs.readFileSync('app/api/feed/route.ts', 'utf8');
ok('route uses unstable_cache wrapper', route.includes('readAnonymousNationalOriginCache'));
ok('route strips distance before cache', route.includes('stripFeedViewerDistanceLabels'));
ok('route applies labels post-cache', route.includes('applyFeedViewerDistanceLabels'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
