#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 5B — Discovery 2.0 Information Architecture guard.
 *
 * Phase 5B is an AUDIT + roadmap phase (no runtime changes; filters audit-only).
 * This validator pins the IA facts the audit is grounded in so they cannot
 * silently drift, verifies the deliverables exist, and re-asserts that the full
 * Phase 4/4B/4C performance architecture (and the 5A copy improvements) are
 * preserved. Static, dependency-free.
 *
 * Run: npx tsx scripts/validate-discovery2-information-architecture.ts
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

console.log('=== UX-FIN Phase 5B — Discovery 2.0 IA guard ===\n');

const bottomNav = read('components/navigation/BottomNavigation.tsx');
const navbar = read('components/NavBar.tsx');
const roleLinks = read('lib/navigation/role-quick-links.ts');
const geoFeed = read('components/feed/GeoFeed.tsx');
const sidebar = read('components/home/HomeDesktopSidebar.tsx');
const hero = read('components/home/HomeHeroSection.tsx');
const homeClient = read('components/home/HomePageClient.tsx');
const listingKindContract = read('lib/marketplace/contracts/listing-kind-contract.ts');
const density = read('lib/feed/homeDesktopFeedColumns.ts');

// --- 5B.1 Ecosystem: real capabilities exist in code ---------------------
console.log('5B.1 Ecosystem inventory (verified in code)');
assert(
  listingKindContract.includes("'SERVICE'") &&
    listingKindContract.includes("'TASK'") &&
    listingKindContract.includes("'WORKSHOP'") &&
    listingKindContract.includes("'COACHING'") &&
    listingKindContract.includes("'REQUEST'"),
  'services + request listing kinds exist (SERVICE/TASK/WORKSHOP/COACHING/REQUEST)',
);
assert(
  listingKindContract.includes("INSPIRATION_LISTING_KIND = 'INSPIRATION'"),
  'inspiration listing kind exists',
);
assert(
  exists('lib/marketplace/listing-kind/derive-listing-kind.ts'),
  'listing kind is runtime-derived (future-proof classification)',
);
assert(
  exists('lib/proposals/proposal-service.ts') && exists('app/profile/deals/page.tsx'),
  'proposals + community deals hub exist',
);

// --- 5B.3 Navigation surfaces (mapped facts) -----------------------------
console.log('\n5B.3 Navigation surfaces present');
assert(
  bottomNav.includes('/#homecheff-feed') &&
    bottomNav.includes('/messages') &&
    bottomNav.includes('/mijn-hcp') &&
    bottomNav.includes('/profile'),
  'bottom nav slots present (discover / messages / hcp / profile)',
);
assert(
  navbar.includes('DEALS_PROFILE_PATH') &&
    navbar.includes('/orders') &&
    navbar.includes('/favorites') &&
    navbar.includes('/settings'),
  'header dropdown exposes deals / orders / favorites / settings',
);
assert(
  roleLinks.includes("id: 'agreements'") && roleLinks.includes("'/profile/deals'"),
  'role quick links surface the agreements/deals hub',
);

// --- 5B.4 Discovery categories (current model pinned) --------------------
console.log('\n5B.4 Discovery categories (current feed model)');
assert(
  /feedChip|FeedChip/.test(geoFeed),
  'feed view chips present (all / sale / inspiration / gezocht)',
);
assert(geoFeed.includes('FeedFiltersPanel'), 'feed filters panel present');
assert(geoFeed.includes('FeedMarketplaceCard'), 'feed renders marketplace cards');

// --- 5B.6 Community visibility (homepage surfaces) -----------------------
console.log('\n5B.6 Community visibility on homepage');
assert(
  sidebar.includes('CommunityPulseBar') && sidebar.includes('HomeReputationCompactCard'),
  'community pulse + reputation surfaced in the home sidebar',
);
assert(
  sidebar.includes('href="/?chip=gezocht#homecheff-feed"'),
  'homepage sidebar links into the Gezocht feed (5A)',
);
assert(
  exists('components/home/CommunityPulseBar.tsx'),
  'CommunityPulseBar component exists (guest-visible activity)',
);

// --- 5B.7 Services discoverability gap documented ------------------------
console.log('\n5B.7 Services discoverability');
assert(
  exists('lib/marketplace/listing-kind/derive-listing-kind.ts') &&
    !/chip.*service|serviceChip|chipService|chipDiensten/i.test(geoFeed),
  'services are classifiable but have NO dedicated feed chip today (documented gap)',
);

// --- Deliverables --------------------------------------------------------
console.log('\nDeliverables present');
for (const rel of [
  'docs/audits/DISCOVERY_2_INFORMATION_ARCHITECTURE_AUDIT.md',
  'docs/progress/UX_FINALIZATION_PHASE5B_DISCOVERY2.md',
]) {
  assert(exists(rel), `deliverable present: ${rel}`);
}

// --- 5B constraints: performance architecture preserved ------------------
console.log('\n5B constraints — Phase 4/4B/4C performance preserved');
assert(
  density.includes('useSyncExternalStore') && density.includes('return 2'),
  'density: external store + desktop default 2 (instant, no remount)',
);
assert(
  geoFeed.includes('flex flex-col gap-4 hc-feed-cards-column'),
  'mobile feed default single column',
);
{
  const depsStart = geoFeed.indexOf('viewerPlaceForApi,\n    apiLocationSource,');
  const depsWindow = depsStart >= 0 ? geoFeed.slice(depsStart, depsStart + 400) : '';
  assert(
    depsWindow.length > 0 && !depsWindow.includes('desktopFeedColumns'),
    'density switch never triggers a feed refetch',
  );
}
assert(
  read('lib/feed/home-feed-return-cache.ts').includes('isHomeFeedReturnCacheStale'),
  'homepage SWR return cache preserved',
);
assert(
  read('lib/runtime/sessionSwrCache.ts').includes('SWR_FRESH_MS') &&
    read('hooks/useSessionSwr.ts').includes('AbortController'),
  'unified SWR cache (4C) preserved',
);
assert(
  homeClient.includes('showMobileHomeFeed') &&
    homeClient.includes('showDesktopHomeFeed') &&
    homeClient.includes('viewportResolved'),
  'exactly one GeoFeed tree per resolved viewport (no duplicate mounts)',
);
assert(
  !hero.includes("console.log('orbit image src'"),
  'no debug logging in hero hot path',
);
for (const guard of [
  'scripts/validate-discovery-phase5a.ts',
  'scripts/validate-discovery-experience.ts',
  'scripts/validate-homepage-performance.ts',
  'scripts/validate-platform-performance-phase4b.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
]) {
  assert(exists(guard), `prior guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
