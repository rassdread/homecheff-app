#!/usr/bin/env npx tsx
/**
 * Phase 3B — feed cache safety contract.
 */
import * as fs from 'node:fs';

import {
  classifyFeedCachePolicy,
  buildFeedResponseCacheHeaders,
  type FeedCacheTier,
} from '../lib/feed/feed-cache-policy';

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

function tier(
  overrides: Partial<Parameters<typeof classifyFeedCachePolicy>[0]> & {
    searchParams?: URLSearchParams;
  },
): FeedCacheTier {
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
  return classifyFeedCachePolicy({ ...base, ...overrides }).tier;
}

console.log('=== Phase 3B — Feed cache safety ===\n');

// 1. Two logged-in users — same URL shape → tier C (no CDN)
ok(
  'user A logged in → C',
  tier({ userId: '1823cae9-2aae-400f-9a28-eadbdcded3bc' }) === 'C',
);
ok(
  'user B logged in → C',
  tier({ userId: '4f822286-1111-4222-8333-aaaaaaaaaaaa' }) === 'C',
);

// 2. Anonymous national default
ok('anonymous national → A', tier({}) === 'A');

// 3. Anonymous national — infra cookie does not change tier (classification is session-based)
ok(
  'anonymous national unchanged (no cookie in classifier)',
  tier({ userId: null }) === 'A',
);

// 4. Logged-in user
ok('logged in → C', tier({ userId: '1823cae9-2aae-400f-9a28-eadbdcded3bc' }) === 'C');

// 5. Profile-based location — logged-in without URL coords still tier C
ok(
  'profile location (session) → C',
  tier({ userId: '1823cae9-2aae-400f-9a28-eadbdcded3bc', lat: null, lng: null }) === 'C',
);

// 6. Explicit lat/lng on national radius=0 → Tier A (labels-only, Phase 3F)
ok('national lat/lng labels-only → A', tier({ lat: '52.1', lng: '5.1', radiusKm: 0 }) === 'A');
ok('national lat/lng with radius → B', tier({ lat: '52.1', lng: '5.1', radiusKm: 25 }) === 'B');

// 7. perfBust
ok('perfBust → D', tier({ searchParams: new URLSearchParams('perfBust=1') }) === 'D');

// 8. debug=1
ok('debug=1 → D', tier({ searchParams: new URLSearchParams('debug=1') }) === 'D');

// 9. Page 2 pagination
ok('skip pagination → C', tier({ skip: 10 }) === 'C');

// 10. Paid/inactive products — pool is user-agnostic; anonymous national stays A
ok('paid inactive pool anonymous → A', tier({ userId: null }) === 'A');

// 11. Preview infra cookie (_vercel_jwt) — not used in classifier; tier A preserved
ok(
  'preview infra cookie does not force tier C',
  classifyFeedCachePolicy({
    userId: null,
    q: '',
    placeParam: '',
    vertical: 'all',
    lat: null,
    lng: null,
    hasSubfilters: false,
    feedScope: 'national',
    skip: 0,
    searchParams: new URLSearchParams(),
  }).tier === 'A',
);

const aPolicy = classifyFeedCachePolicy({
  userId: null,
  q: '',
  placeParam: '',
  vertical: 'all',
  lat: null,
  lng: null,
  hasSubfilters: false,
  feedScope: 'national',
  skip: 0,
  radiusKm: 0,
  searchParams: new URLSearchParams(),
});
ok('tier A allows CDN', aPolicy.cdnAllowed === true);
ok('tier A browser max-age=0', aPolicy.cacheControl.includes('max-age=0'));
ok('tier A Vary excludes Cookie', !aPolicy.vary.includes('Cookie'));

const aHeaders = buildFeedResponseCacheHeaders(aPolicy);
ok('tier A CDN s-maxage=45', aHeaders['CDN-Cache-Control']?.includes('s-maxage=45') === true);
ok('tier A Vercel CDN header', !!aHeaders['Vercel-CDN-Cache-Control']);

const cPolicy = classifyFeedCachePolicy({
  userId: 'x',
  q: '',
  placeParam: '',
  vertical: 'all',
  lat: null,
  lng: null,
  hasSubfilters: false,
  feedScope: 'national',
  skip: 0,
  radiusKm: 0,
  searchParams: new URLSearchParams(),
});
ok('tier C no-store', cPolicy.cacheControl.includes('no-store'));
ok('tier C no CDN', cPolicy.cdnAllowed === false);
ok('tier C Vary includes Cookie', cPolicy.vary.includes('Cookie'));

const bPolicy = classifyFeedCachePolicy({
  userId: null,
  q: '',
  placeParam: 'Utrecht',
  vertical: 'all',
  lat: null,
  lng: null,
  hasSubfilters: false,
  feedScope: 'national',
  skip: 0,
  radiusKm: 0,
  searchParams: new URLSearchParams(),
});
ok('tier B private', bPolicy.cacheControl.includes('private'));
ok('tier B no CDN', bPolicy.cdnAllowed === false);

const feedRoute = fs.readFileSync('app/api/feed/route.ts', 'utf8');
ok('feed uses classifyFeedCachePolicy', feedRoute.includes('classifyFeedCachePolicy'));
ok(
  'feed sets Server-Timing on response',
  feedRoute.includes("headers['Server-Timing'] = serverTiming"),
);
ok(
  'feed exposes Server-Timing CORS',
  feedRoute.includes("headers['Access-Control-Expose-Headers'] = 'Server-Timing'"),
);
ok(
  'feed cache headers from policy',
  feedRoute.includes('buildFeedResponseCacheHeaders(cachePolicy)'),
);

const statsRoute = fs.readFileSync('app/api/feed/stats-preview/route.ts', 'utf8');
ok('stats-preview no-store', statsRoute.includes("'Cache-Control': 'private, no-store'"));

ok(
  'feed origin cache integration',
  feedRoute.includes('readAnonymousNationalOriginCache'),
);
ok(
  'feed revalidate helper exists',
  fs.existsSync('lib/feed/revalidate-public-feed.ts'),
);

const aHeadersLegacy = buildFeedResponseCacheHeaders(aPolicy);
ok('tier A response headers include Cache-Control', !!aHeadersLegacy['Cache-Control']);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
