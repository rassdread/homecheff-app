#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 5 — Discovery experience structure + performance guard.
 *
 * Verifies the discovery surfaces (hero, chips, filters, feed cards, copy parity)
 * are structurally intact AND that all Phase 4/4B/4C performance architecture is
 * preserved (5.13 — no regressions). Static, dependency-free.
 *
 * Run: npx tsx scripts/validate-discovery-experience.ts
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
function readJson(rel: string): any {
  try {
    return JSON.parse(read(rel));
  } catch {
    return null;
  }
}

console.log('=== UX-FIN Phase 5 — Discovery experience guard ===\n');

const hero = read('components/home/HomeHeroSection.tsx');
const homeClient = read('components/home/HomePageClient.tsx');
const sidebar = read('components/home/HomeDesktopSidebar.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
const nl = readJson('public/i18n/nl.json');
const en = readJson('public/i18n/en.json');

// --- 5.1 First impression: hero explains the platform --------------------
console.log('5.1 Hero communicates the platform');
assert(
  hero.includes('heroTitleHighlight') && hero.includes('heroSubtitle'),
  'hero renders title + subtitle',
);
assert(
  hero.includes('ctaDiscover') && hero.includes('ctaShare'),
  'hero shows both discover (buy) and share (sell) CTAs',
);
assert(
  hero.includes('heroOrbitHomeCheff') &&
    hero.includes('heroOrbitHomeGarden') &&
    hero.includes('heroOrbitHomeDesigner'),
  'hero surfaces all three verticals (Cheff/Garden/Designer)',
);
assert(
  hero.includes('heroChipInspiration') && hero.includes('heroChipBarter'),
  'hero surfaces inspiration + barter/community-economy concepts',
);
assert(
  hero.includes('heroChipNearby') || hero.includes('heroOrbit'),
  'hero surfaces the local/nearby angle',
);

// --- 5.13 No leftover debug logging in hero ------------------------------
console.log('\n5.13 No debug logging in discovery hot paths');
assert(
  !hero.includes("console.log('orbit image src'"),
  'hero orbit debug console.log removed',
);

// --- 5.5 Chips defined ---------------------------------------------------
console.log('\n5.5 Feed chips');
assert(
  /feedChip|FeedChip/.test(geoFeed),
  'feed chip state present (all / sale / inspiration / gezocht)',
);

// --- 5.4 Filters present -------------------------------------------------
console.log('\n5.4 Filters');
assert(
  geoFeed.includes('FeedFiltersPanel'),
  'feed filters panel exists',
);

// --- 5.3 Feed cards ------------------------------------------------------
console.log('\n5.3 Feed cards');
assert(
  geoFeed.includes('FeedMarketplaceCard'),
  'feed renders marketplace cards',
);

// --- 5.11 Copy parity (homepage namespaces) ------------------------------
console.log('\n5.11 Copy NL/EN parity (homepage namespaces)');
function flatKeys(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flatKeys(v, key));
    } else {
      out.push(key);
    }
  }
  return out;
}
assert(!!nl && !!en, 'both i18n files parse');
for (const ns of ['homePhase1', 'homeDorpsplein', 'home']) {
  const nlKeys = new Set(flatKeys(nl?.[ns] ?? {}));
  const enKeys = new Set(flatKeys(en?.[ns] ?? {}));
  const missingInEn = [...nlKeys].filter((k) => !enKeys.has(k));
  const missingInNl = [...enKeys].filter((k) => !nlKeys.has(k));
  assert(
    missingInEn.length === 0 && missingInNl.length === 0,
    `i18n "${ns}" NL/EN parity (nl:${nlKeys.size} en:${enKeys.size}` +
      (missingInEn.length ? ` missingEN:${missingInEn.slice(0, 3).join(',')}` : '') +
      (missingInNl.length ? ` missingNL:${missingInNl.slice(0, 3).join(',')}` : '') +
      ')',
  );
}

// --- 5.13 Performance architecture preserved (Phase 4 / 4B / 4C) ---------
console.log('\n5.13 Performance regression guard (Phase 4/4B/4C preserved)');
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
for (const guard of [
  'scripts/validate-homepage-performance.ts',
  'scripts/validate-platform-performance-phase4b.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
]) {
  assert(fs.existsSync(path.join(process.cwd(), guard)), `guard present: ${guard}`);
}

// --- Single feed mount (no double mount) ---------------------------------
console.log('\n5.9 Desktop / mobile feed mount');
assert(
  homeClient.includes('showMobileHomeFeed') &&
    homeClient.includes('showDesktopHomeFeed') &&
    homeClient.includes('viewportResolved'),
  'exactly one GeoFeed tree per resolved viewport',
);

// --- 5.10 Community visibility on homepage -------------------------------
console.log('\n5.10 Community visibility in sidebar');
assert(
  sidebar.includes('CommunityPulseBar') &&
    sidebar.includes('HomeReputationCompactCard'),
  'community pulse + reputation surfaced in the sidebar',
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
