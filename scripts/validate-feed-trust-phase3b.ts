#!/usr/bin/env npx tsx
/**
 * Phase 3B — trust enrichment + media endpoint guards.
 */
import * as fs from 'node:fs';

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

const read = (p: string) => fs.readFileSync(p, 'utf8');

console.log('=== Phase 3B — Trust + media ===\n');

ok('trust timing module exists', fs.existsSync('lib/feed/trust-enrichment-timing.ts'));
ok('feed uses trust timing wrapper', read('app/api/feed/route.ts').includes('fetchSellerTrustBundlesWithTiming'));
ok('tile trust fields documented', read('lib/feed/trust-enrichment-timing.ts').includes('FEED_TILE_TRUST_FIELDS'));
ok('extended trust fields documented', read('lib/feed/trust-enrichment-timing.ts').includes('FEED_EXTENDED_TRUST_FIELDS'));

ok('media route exists', fs.existsSync('app/api/feed/media/route.ts'));
ok('media access server exists', fs.existsSync('lib/feed/feed-media-access.server.ts'));
const mediaRoute = read('app/api/feed/media/route.ts');
ok('media uses visibility loader', mediaRoute.includes('loadVisibleFeedMediaUrl'));
ok('media parses inline safely', mediaRoute.includes('parseFeedInlineDataUrl'));

const geoFeed = read('components/feed/GeoFeed.tsx');
ok('deferred stats does not add image fetches', !geoFeed.includes('/api/feed/media'));
ok('single feed fetch guard retained', geoFeed.includes('feedRequestKeyInFlightRef'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
