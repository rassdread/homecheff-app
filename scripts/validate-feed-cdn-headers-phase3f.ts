#!/usr/bin/env npx tsx
/**
 * Phase 3F.2 — CDN cache headers contract.
 */
import {
  buildFeedResponseCacheHeaders,
  classifyFeedCachePolicy,
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

console.log('=== Phase 3F.2 — CDN headers ===\n');

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

const tierA = classifyFeedCachePolicy(base);
const tierAHeaders = buildFeedResponseCacheHeaders(tierA);
ok('Tier A CDN allowed', tierA.cdnAllowed);
ok('Tier A browser max-age=0', tierAHeaders['Cache-Control']?.includes('max-age=0') === true);
ok('Tier A CDN s-maxage=45', tierAHeaders['CDN-Cache-Control']?.includes('s-maxage=45') === true);
ok('Tier A SWR 90', tierAHeaders['CDN-Cache-Control']?.includes('stale-while-revalidate=90') === true);
ok('Tier A Vercel CDN header', !!tierAHeaders['Vercel-CDN-Cache-Control']);
ok('Tier A no Vary Cookie', !tierA.vary.includes('Cookie'));

const tierB = classifyFeedCachePolicy({
  ...base,
  feedScope: 'nearby',
  lat: '52.1',
  lng: '5.1',
  radiusKm: 25,
});
const tierBHeaders = buildFeedResponseCacheHeaders(tierB);
ok('Tier B no CDN', !tierB.cdnAllowed);
ok('Tier B private', tierBHeaders['Cache-Control']?.includes('private') === true);
ok('Tier B no CDN-Cache-Control', tierBHeaders['CDN-Cache-Control'] == null);

const tierC = classifyFeedCachePolicy({ ...base, userId: 'user-1' });
const tierCHeaders = buildFeedResponseCacheHeaders(tierC);
ok('Tier C no-store', tierCHeaders['Cache-Control']?.includes('no-store') === true);
ok('Tier C Vary Cookie', tierC.vary.includes('Cookie'));

const tierD = classifyFeedCachePolicy({
  ...base,
  searchParams: new URLSearchParams('perfBust=1'),
});
const tierDHeaders = buildFeedResponseCacheHeaders(tierD);
ok('Tier D no-store', tierDHeaders['Cache-Control']?.includes('no-store') === true);
ok('Tier D no CDN', !tierD.cdnAllowed);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
