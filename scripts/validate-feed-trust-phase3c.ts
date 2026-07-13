#!/usr/bin/env npx tsx
/**
 * Phase 3C — trust sub-timing + minimal tile path.
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

console.log('=== Phase 3C — Trust ===\n');

const snapshots = read('lib/discovery/trust/fetch-seller-trust-snapshots.ts');
ok('trust snapshots supports minimal mode', snapshots.includes("mode?: 'minimal' | 'full'"));
ok('trust snapshots collects per-query timing', snapshots.includes('TrustSnapshotQueryTiming'));
ok('minimal skips buyer repeat', snapshots.includes('repeat_customers_buyer') && snapshots.includes('includeExtended'));
ok('minimal skips reviews-left queries', snapshots.includes('reviews_left_product'));

const timing = read('lib/feed/trust-enrichment-timing.ts');
ok('feed uses minimal trust mode', timing.includes("const trustMode = 'minimal'"));
ok('tile trust fields documented', timing.includes('FEED_TILE_TRUST_FIELDS'));
ok('extended trust fields documented', timing.includes('FEED_EXTENDED_TRUST_FIELDS'));
ok('minimal defaults documented', timing.includes('FEED_MINIMAL_TRUST_DEFAULTS'));

const snapshotTiming = read('lib/discovery/trust/trust-snapshot-timing.ts');
ok('minimal query keys defined', snapshotTiming.includes('TRUST_MINIMAL_TILE_QUERY_KEYS'));
ok('extended query keys defined', snapshotTiming.includes('TRUST_EXTENDED_QUERY_KEYS'));

const feedRoute = read('app/api/feed/route.ts');
ok('feed uses trust timing wrapper', feedRoute.includes('fetchSellerTrustBundlesWithTiming'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
