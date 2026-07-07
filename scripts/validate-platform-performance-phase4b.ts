#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 4B — Platform performance / navigation regression guard.
 *
 * Static architecture checks across the whole app that protect the perceived-
 * performance wins and prevent regressions. Complements (does not replace)
 * scripts/validate-homepage-performance.ts.
 *
 * Run: npx tsx scripts/validate-platform-performance-phase4b.ts
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
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

console.log('=== UX-FIN Phase 4B — Platform performance guard ===\n');

const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
const layout = read('app/layout.tsx');
const perfMon = read('components/PerformanceMonitor.tsx');
const diag = read('lib/diagnostics/appDiagnostics.ts');
const returnCache = read('lib/feed/home-feed-return-cache.ts');

// --- Preserve Phase 4 homepage wins -------------------------------------
console.log('4B.3 Homepage / feed wins preserved (no regression)');
assert(
  exists('lib/feed/home-feed-return-cache.ts') &&
    returnCache.includes('isHomeFeedReturnCacheStale'),
  'in-memory return cache + stale-while-revalidate still present',
);
assert(
  geoFeed.includes('let backgroundRefresh = false') &&
    geoFeed.includes('isHomeFeedReturnCacheStale(cached)'),
  'GeoFeed still uses SWR background refresh without loading flash',
);
assert(
  geoFeed.split('fetch(feedUrl').length - 1 === 1,
  'still exactly one /api/feed fetch (no duplicate fetch)',
);
assert(
  exists('scripts/validate-homepage-performance.ts'),
  'Phase 4 homepage regression guard still present',
);

// --- 4B.4 Feed density defaults -----------------------------------------
console.log('\n4B.4 Feed density defaults (no refetch / no remount on switch)');
assert(
  density.includes('useSyncExternalStore'),
  'density uses an external store (switch never remounts GeoFeed)',
);
assert(
  density.includes('return 2') && !density.includes('return 4'),
  'desktop density default is 2 columns',
);
assert(
  density.includes('"1"') && density.includes('"3"'),
  'desktop density offers choices 1 / 2 / 3',
);
assert(
  geoFeed.includes('useHomeDesktopFeedColumns'),
  'GeoFeed consumes the density store',
);
{
  // The feed fetch effect dependency array must NOT contain desktopFeedColumns,
  // otherwise switching density would trigger a refetch.
  const depsStart = geoFeed.indexOf('viewerPlaceForApi,\n    apiLocationSource,');
  const depsWindow =
    depsStart >= 0 ? geoFeed.slice(depsStart, depsStart + 400) : '';
  assert(
    depsWindow.length > 0 && !depsWindow.includes('desktopFeedColumns'),
    'density is NOT a feed-fetch dependency (switch causes no new fetch)',
  );
}
assert(
  geoFeed.includes('flex flex-col gap-4 hc-feed-cards-column'),
  'mobile feed default is single column',
);

// --- 4B.16 Media hints ---------------------------------------------------
console.log('\n4B.16 Media resource hints');
assert(
  layout.includes('dns-prefetch') &&
    layout.includes('blob.vercel-storage.com'),
  'DNS-prefetch for the primary media CDN present',
);

// --- 4B.1 Real timings ---------------------------------------------------
console.log('\n4B.1 Real performance timings captured');
assert(
  perfMon.includes('perf_web_vital') && perfMon.includes('perf_navigation'),
  'PerformanceMonitor emits real web-vital + navigation timings',
);
assert(
  perfMon.includes('largest-contentful-paint') &&
    perfMon.includes('layout-shift') &&
    perfMon.includes('first-input'),
  'LCP / CLS / FID observed',
);
assert(
  diag.includes("'perf_web_vital'") && diag.includes("'perf_navigation'"),
  'diagnostics channel knows the perf codes (rate-limited, privacy-safe)',
);

// --- 4B.2 Non-blocking chrome (lazy providers) --------------------------
console.log('\n4B.2 Non-critical chrome deferred');
assert(
  layout.split('dynamic(').length - 1 >= 8,
  'root layout lazy-loads non-critical chrome (dynamic imports, ssr:false)',
);
assert(
  layout.includes('ssr: false'),
  'deferred chrome does not block SSR / first paint',
);

// --- 4B.6/4B.7/4B.9/4B.10 Surface optimizations ------------------------
console.log('\n4B.6–4B.10 Cross-surface safe wins');
assert(
  read('components/chat/ChatThreadMessageRow.tsx').includes('memo(ChatThreadMessageRow)'),
  'chat message rows memoized (typing no longer rerenders whole thread)',
);
assert(
  read('app/verkoper/dashboard/page-client.tsx').includes('Promise.all'),
  'seller dashboard stats/orders/products fetched in parallel',
);
assert(
  read('app/notifications/page.tsx').includes('isRead: true') &&
    !read('app/notifications/page.tsx').includes('if (res.ok) {\n      await load();'),
  'notifications mark-as-read is optimistic (no full refetch on success)',
);
assert(
  read('components/settings/SettingsHubClient.tsx').includes('router.refresh()') &&
    !read('components/settings/SettingsHubClient.tsx').includes('window.location.reload()'),
  'settings profile save uses router.refresh instead of full reload',
);

// --- summary -------------------------------------------------------------
console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
