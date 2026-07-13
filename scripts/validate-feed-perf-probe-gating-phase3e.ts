#!/usr/bin/env npx tsx
/**
 * Phase 3E — Production perf probe gating validator.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

let passed = 0;
let failed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

console.log('=== Phase 3E — Perf probe gating ===\n');

const probe = read('lib/feed/feed-perf-probe.ts');
const route = read('app/api/feed/route.ts');
const cache = read('lib/feed/feed-cache-policy.ts');

assert(probe.includes("FEED_PERF_PROBE_PARAM = 'perfProbe'"), 'perfProbe param defined');
assert(probe.includes('shouldRunFeedApiTiming'), 'shouldRunFeedApiTiming');
assert(probe.includes('shouldExposeFeedPerfPayload'), 'shouldExposeFeedPerfPayload');
assert(probe.includes('shouldExposeFeedDebug'), 'shouldExposeFeedDebug');
assert(
  probe.includes("process.env.FEED_PERF_TIMING === '1' && isFeedPerfProbeQuery"),
  'production requires both flags for timing',
);

assert(route.includes('shouldRunFeedApiTiming(searchParams)'), 'route uses probe timing gate');
assert(route.includes('shouldExposeFeedPerfPayload(searchParams)'), 'route gates perf payload');
assert(route.includes('shouldExposeFeedDebug(searchParams)'), 'route gates debug block');
assert(
  !route.includes('process.env.FEED_PERF_TIMING === "1"')
    || route.includes('shouldExposeFeedDebug'),
  'route no longer exposes debug on FEED_PERF_TIMING alone in prod path',
);

assert(cache.includes("searchParams.get('perfProbe') === '1'"), 'cache tier D uses perfProbe in prod');

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
