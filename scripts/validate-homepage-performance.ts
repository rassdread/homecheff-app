#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 4 — Homepage / Feed performance regression guard.
 *
 * Static architecture checks that protect the perceived-performance wins:
 *   - SSR seeds first content (no empty first paint)
 *   - single feed fetch (no duplicate fetch)
 *   - in-memory return cache present (instant back-navigation)
 *   - stale-while-revalidate background refresh (feed stays visible)
 *   - filter/surface state persisted (filter restore)
 *   - scroll restore keys present (scroll restore)
 *   - feed images lazy/async/responsive (media never blocks the feed)
 *   - secondary work deferred (background prioritisation, non-blocking modules)
 *   - exactly one GeoFeed tree per viewport (no double mount)
 *
 * Run: npx tsx scripts/validate-homepage-performance.ts
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

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

console.log('=== UX-FIN Phase 4 — Homepage / Feed performance guard ===\n');

const homePage = read('app/page.tsx');
const homeClient = read('components/home/HomePageClient.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');
const returnCache = read('lib/feed/home-feed-return-cache.ts');
const feedMedia = read('components/feed/feedMedia.tsx');
const resumeCache = read('lib/appResumeCache.ts');

// --- Server seed (no empty first paint) ---------------------------------
console.log('4.1/4.3 Server-seeded first content');
assert(
  homePage.includes('HomePageClient') && homePage.includes('getServerSession'),
  'homepage server component passes SSR auth hint (no heavy inspiratie SSR)',
);
assert(/export const revalidate\s*=/.test(homePage), 'homepage sets ISR revalidate');

// --- Single feed fetch (no duplicate fetch) -----------------------------
console.log('\n4.1/4.4 Single, abortable feed fetch');
assert(count(geoFeed, 'fetch(feedUrl') === 1, 'exactly one /api/feed fetch call');
assert(
  count(geoFeed, 'const feedUrl = `/api/feed?${') === 1,
  'exactly one primary /api/feed URL builder',
);
assert(geoFeed.includes('new AbortController()'), 'feed fetch is abortable');
assert(
  geoFeed.includes('/api/inspiratie?') && geoFeed.includes('feedHydrated'),
  'inspiration deferred until feed hydrated (not serial with feed fetch)',
);

// --- Instant return cache + stale-while-revalidate ----------------------
console.log('\n4.2/4.3/4.9 Instant return cache + background refresh');
assert(
  fs.existsSync(path.join(process.cwd(), 'lib/feed/home-feed-return-cache.ts')),
  'in-memory home feed return cache module exists',
);
assert(returnCache.includes('let memoryCache'), 'return cache is in-tab memory (survives client nav)');
assert(
  returnCache.includes('isHomeFeedReturnCacheStale') &&
    returnCache.includes('HOME_FEED_STALE_MS'),
  'return cache exposes staleness window',
);
assert(
  geoFeed.includes('readHomeFeedReturnCache(requestKey)') &&
    geoFeed.includes('clearHomeFeedReturnCache'),
  'GeoFeed reads keyed return cache and clears on scope change',
);
assert(
  !geoFeed.includes('peekFreshHomeFeedReturnCache()'),
  'GeoFeed must not cross-key peekFresh (scope bleed)',
);
assert(
  geoFeed.includes('saveHomeFeedReturnCache'),
  'GeoFeed writes the return cache on unmount (feed stays warm)',
);
assert(
  geoFeed.includes('let backgroundRefresh = false') &&
    geoFeed.includes('isHomeFeedReturnCacheStale(cached)'),
  'stale-while-revalidate: cache hit refreshes only when stale',
);
assert(
  geoFeed.includes('feedInteractionStartedRef.current && !backgroundRefresh'),
  'background refresh never triggers a loading flash',
);

// --- Filter restore -----------------------------------------------------
console.log('\n4.2 Filter / surface restore');
assert(
  fs.existsSync(path.join(process.cwd(), 'lib/feed/feedSurfaceState.ts')),
  'feed surface state module exists',
);
assert(
  geoFeed.includes('saveFeedSurfaceState') &&
    (geoFeed.includes('"home"') || geoFeed.includes("'home'")),
  'GeoFeed persists home filter state',
);

// --- Scroll restore -----------------------------------------------------
console.log('\n4.2 Scroll restore');
assert(
  resumeCache.includes('HOME_FEED_WINDOW_SCROLL_KEY') &&
    resumeCache.includes('HOME_FEED_DESKTOP_SCROLL_KEY'),
  'home scroll keys defined',
);
assert(
  homeClient.includes('readScrollPosition'),
  'homepage reads saved scroll position on return',
);

// --- Media performance --------------------------------------------------
console.log('\n4.7 Image & media performance');
assert(count(feedMedia, 'loading="lazy"') >= 1, 'feed images use lazy loading');
assert(count(feedMedia, 'decoding="async"') >= 1, 'feed images decode async');
assert(feedMedia.includes('FEED_CARD_IMG_SIZES'), 'feed images ship responsive sizes');
assert(
  feedMedia.includes('shouldDeferVideoMount') &&
    feedMedia.includes('IntersectionObserver'),
  'feed video mounts are deferred until near viewport',
);

// --- Background prioritisation / non-blocking modules -------------------
console.log('\n4.6 Background prioritisation');
assert(
  geoFeed.includes('requestIdleCallback'),
  'non-critical work (profile location) deferred to idle time',
);
assert(
  geoFeed.includes('Geen automatische GPS'),
  'no blocking auto-GPS before the first feed paint',
);
assert(
  count(homeClient, 'autoStart={false}') >= 1,
  'onboarding tours do not auto-start before the feed',
);

// --- No double mount ----------------------------------------------------
console.log('\n4.5 No double feed mount');
assert(
  count(homeClient, '<GeoFeed') === 1,
  'exactly one GeoFeed instance on homepage',
);
assert(
  homeClient.includes('homeComposedLayout={showDesktopComposedLayout}'),
  'viewport layout toggles via prop (no dual mount trees)',
);

// --- summary -------------------------------------------------------------
console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
