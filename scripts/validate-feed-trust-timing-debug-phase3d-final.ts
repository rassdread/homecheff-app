#!/usr/bin/env npx tsx
/**
 * Phase 3D-Final — debug.perf.trustTiming contract guards.
 */
import * as fs from 'node:fs';

import { buildTrustTimingDebugPayload } from '../lib/feed/trust-timing-debug';

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

const feedRoute = fs.readFileSync('app/api/feed/route.ts', 'utf8');
const timingModule = fs.readFileSync('lib/feed/trust-enrichment-timing.ts', 'utf8');

console.log('=== Phase 3D-Final — Trust timing debug contract ===\n');

ok('buildTrustTimingDebugPayload used in feed route', feedRoute.includes('buildTrustTimingDebugPayload'));
ok('perf.trustTiming assigned on perf payload', feedRoute.includes('perfPayload.trustTiming'));
ok('debug.trustTiming uses normalized payload', feedRoute.includes('trustTiming: buildTrustTimingDebugPayload'));
ok('feed-api-timing payload has trustTiming field', fs.readFileSync('lib/feed/feed-api-timing.ts', 'utf8').includes('trustTiming?: TrustTimingDebugPayload'));
ok('cacheStats includes expired', fs.readFileSync('lib/discovery/trust/trust-snapshot-cache.ts', 'utf8').includes('expired: number'));
ok('cache always fetched before timing null check', timingModule.includes('cacheStats'));

const sample = buildTrustTimingDebugPayload({
  totalMs: 12,
  badgesMs: 0,
  bundlesMs: 12,
  sellerCount: 4,
  mode: 'minimal',
  cacheStats: {
    version: '1',
    ttlMs: 60000,
    maxEntries: 200,
    hits: 4,
    misses: 0,
    expired: 0,
    evictions: 0,
    size: 4,
    missSellerCount: 0,
  },
});

ok('normalized cacheStats shape', sample?.cacheStats?.entries === 4);
ok('cacheStats not null when timing present', sample?.cacheStats != null);
ok('snapshotTiming nullable', sample?.snapshotTiming === null);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
