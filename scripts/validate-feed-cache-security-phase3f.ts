#!/usr/bin/env npx tsx
/**
 * Phase 3F — Cache security / poisoning guards.
 */
import {
  classifyFeedCachePolicy,
  isAnonymousNationalFirstPageTierA,
} from '../lib/feed/feed-cache-policy';
import { buildFeedOriginCacheKey } from '../lib/feed/feed-cache-keys';

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

console.log('=== Phase 3F — Cache security ===\n');

const base = {
  userId: null as string | null,
  q: '',
  placeParam: '',
  vertical: 'all',
  lat: null as string | null,
  lng: null as string | null,
  hasSubfilters: false,
  feedScope: 'national',
  skip: 0,
  radiusKm: 0,
  searchParams: new URLSearchParams(),
};

ok('logged-in bypasses origin path', !isAnonymousNationalFirstPageTierA({ ...base, userId: 'u1' }));
ok('perfBust → Tier D', classifyFeedCachePolicy({
  ...base,
  searchParams: new URLSearchParams('perfBust=1'),
}).tier === 'D');
{
  const prevNode = process.env.NODE_ENV;
  const prevPerf = process.env.FEED_PERF_TIMING;
  process.env.NODE_ENV = 'production';
  process.env.FEED_PERF_TIMING = '1';
  ok('perfProbe prod gate → D', classifyFeedCachePolicy({
    ...base,
    searchParams: new URLSearchParams('perfProbe=1'),
  }).tier === 'D');
  process.env.NODE_ENV = prevNode;
  process.env.FEED_PERF_TIMING = prevPerf;
}
ok('unknown _bust → D', classifyFeedCachePolicy({
  ...base,
  searchParams: new URLSearchParams('_bust=1'),
}).tier === 'D');

const key1 = buildFeedOriginCacheKey({
  feedScope: 'national',
  take: 10,
  skip: 0,
  vertical: 'all',
});
const keyPoison = buildFeedOriginCacheKey({
  feedScope: 'national',
  take: 10,
  skip: 0,
  vertical: 'all',
  listingIntent: 'OFFER',
});
ok('filter change changes cache key', key1 !== keyPoison);
ok('coords not in cache key', !key1.includes('52'));

ok(
  'pagination bypasses Tier A',
  classifyFeedCachePolicy({ ...base, skip: 10 }).tier === 'C',
);
ok(
  'search bypasses Tier A',
  classifyFeedCachePolicy({ ...base, q: 'tomato' }).tier === 'C',
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
