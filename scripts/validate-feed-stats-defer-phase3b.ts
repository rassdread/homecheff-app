#!/usr/bin/env npx tsx
/**
 * Phase 3B — stats preview deferral guards.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  FEED_STATS_PREVIEW_MAX_IDS,
  parseFeedStatsPreviewSellerIds,
} from '../lib/feed/feed-stats-preview';

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

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

console.log('=== Phase 3B — Stats preview defer ===\n');

ok('stats-preview route exists', fs.existsSync('app/api/feed/stats-preview/route.ts'));
ok('deferred client module exists', fs.existsSync('lib/feed/feed-deferred-stats-preview.ts'));

const feedRoute = read('app/api/feed/route.ts');
ok('feed route does not await batchComputeUserStatsPreview', !feedRoute.includes('batchComputeUserStatsPreview'));
ok('feed marks statsPreviewDeferred', feedRoute.includes('statsPreviewDeferred: STATS_PREVIEW_DEFERRED'));
ok('feed body omits statsPreview spread', !feedRoute.includes('statsPreview ? { statsPreview }'));

const geoFeed = read('components/feed/GeoFeed.tsx');
ok('GeoFeed schedules deferred stats', geoFeed.includes('scheduleDeferredFeedStatsPreview'));
ok('GeoFeed does not seed from feed statsPreview', !geoFeed.includes('data.statsPreview'));
ok('GeoFeed aborts stats on unmount', geoFeed.includes('ac.abort()'));
ok('GeoFeed passes AbortSignal', geoFeed.includes('ac.signal'));

const deferred = read('lib/feed/feed-deferred-stats-preview.ts');
ok('deferred uses requestIdleCallback', deferred.includes('requestIdleCallback'));
ok('deferred dedupes completed seller sets', deferred.includes('completedStatsPreviewKeys'));
ok('deferred handles AbortError', deferred.includes('AbortError'));

const statsRoute = read('app/api/feed/stats-preview/route.ts');
ok('stats route rate limited', statsRoute.includes('checkRateLimit'));
ok('stats route no-store cache', statsRoute.includes("'Cache-Control': 'private, no-store'"));

const parsed = parseFeedStatsPreviewSellerIds({
  sellerIds: ['1823cae9-2aae-400f-9a28-eadbdcded3bc'],
});
ok('valid seller id parses', 'sellerIds' in parsed);

const empty = parseFeedStatsPreviewSellerIds({ sellerIds: [] });
ok('empty sellerIds allowed', 'sellerIds' in empty && empty.sellerIds.length === 0);

const tooMany = parseFeedStatsPreviewSellerIds({
  sellerIds: Array.from({ length: FEED_STATS_PREVIEW_MAX_IDS + 1 }, (_, i) =>
    `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
  ),
});
ok('over max ids rejected', 'error' in tooMany);

const dupes = parseFeedStatsPreviewSellerIds({
  sellerIds: [
    '1823cae9-2aae-400f-9a28-eadbdcded3bc',
    '1823cae9-2aae-400f-9a28-eadbdcded3bc',
  ],
});
ok(
  'duplicate ids deduped',
  'sellerIds' in dupes && dupes.sellerIds.length === 1,
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
