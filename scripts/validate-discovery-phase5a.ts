#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 5A — Discovery implementation guard.
 *
 * Phase 5 was a read-only audit. Phase 5A implements the safe, copy-first
 * discovery improvements that align the homepage with the capabilities that
 * ACTUALLY exist in the codebase (verticals + Gezocht/requests + services/
 * tasks + barter-openness + community deals/trust), and repurposes the
 * permanent "coming soon" sidebar placeholder into a live Gezocht surface.
 *
 * This validator asserts:
 *  - the Phase 5A copy/structure changes are present,
 *  - NL/EN parity for every touched namespace,
 *  - no leftover "coming soon"/"binnenkort" framing on features that exist,
 *  - and the full Phase 4/4B/4C performance architecture is still preserved.
 *
 * Static, dependency-free. Run: npx tsx scripts/validate-discovery-phase5a.ts
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
function flatKeys(obj: any, prefix = ''): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...flatKeys(v, key));
    else out.push(key);
  }
  return out;
}
function get(obj: any, dotted: string): any {
  return dotted.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

console.log('=== UX-FIN Phase 5A — Discovery implementation guard ===\n');

const hero = read('components/home/HomeHeroSection.tsx');
const sidebar = read('components/home/HomeDesktopSidebar.tsx');
const reputation = read('components/home/HomeReputationCompactCard.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
const nl = readJson('public/i18n/nl.json');
const en = readJson('public/i18n/en.json');

// --- 5A.1 / 5A.2 Hero surfaces the real ecosystem incl. Gezocht ----------
console.log('5A.1/5A.2 Hero reflects real capabilities');
assert(hero.includes('heroChipRequests'), 'hero surfaces the Gezocht/requests chip');
assert(
  !!get(nl, 'homePhase1.heroChipRequests') && !!get(en, 'homePhase1.heroChipRequests'),
  'heroChipRequests copy present in NL + EN',
);
assert(
  hero.includes('heroChipFood') &&
    hero.includes('heroChipGarden') &&
    hero.includes('heroChipCreations') &&
    hero.includes('heroChipInspiration') &&
    hero.includes('heroChipBarter'),
  'hero keeps all existing ecosystem chips (food/garden/creations/inspiration/barter)',
);

// --- 5A.4 CTA copy is no longer a pure "share" verb ----------------------
console.log('\n5A.4 CTA copy clarifies sell/earn');
{
  const nlShare = String(get(nl, 'homePhase1.ctaShare') ?? '');
  const enShare = String(get(en, 'homePhase1.ctaShare') ?? '');
  assert(/verkoop/i.test(nlShare), `ctaShare (NL) mentions selling — got "${nlShare}"`);
  assert(/sell/i.test(enShare), `ctaShare (EN) mentions selling — got "${enShare}"`);
}

// --- 5A.3 Guest copy is present-tense for features that EXIST ------------
console.log('\n5A.3 No "coming soon" framing on features that already exist');
{
  const earnNl = String(get(nl, 'guestBottomNav.earn.bullet4') ?? '');
  const createNl = String(get(nl, 'guestBottomNav.create.bullet4') ?? '');
  const earnEn = String(get(en, 'guestBottomNav.earn.bullet4') ?? '');
  const createEn = String(get(en, 'guestBottomNav.create.bullet4') ?? '');
  assert(
    !/binnenkort|straks/i.test(earnNl + createNl),
    'NL guest bullets drop "binnenkort/straks" for services/requests/barter',
  );
  assert(
    !/coming soon/i.test(earnEn + createEn),
    'EN guest bullets drop "coming soon" for services/requests/barter',
  );
}

// --- 5A.5 / 5A.8 Sidebar spotlight repurposed to a live Gezocht surface --
console.log('\n5A.5/5A.8 Sidebar placeholder repurposed to live community surface');
assert(
  sidebar.includes("href=\"/?chip=gezocht#homecheff-feed\""),
  'sidebar spotlight now links into the Gezocht feed',
);
assert(
  !sidebar.includes('aria-hidden\n        >\n          <p className="text-[11px] font-medium uppercase tracking-wide text-amber-800/70 mb-1">'),
  'sidebar spotlight is no longer an aria-hidden placeholder',
);
assert(
  sidebar.includes('spotlightCta') &&
    !!get(nl, 'homeDorpsplein.spotlightCta') &&
    !!get(en, 'homeDorpsplein.spotlightCta'),
  'spotlight CTA copy present in NL + EN',
);
{
  const nlSpot = String(get(nl, 'homeDorpsplein.spotlightPlaceholder') ?? '');
  assert(!/binnenkort/i.test(nlSpot), 'spotlight body no longer says "binnenkort"');
}

// --- 5A.8 Guest reputation card no longer says "your reputation" ---------
console.log('\n5A.8 Guest reputation label honest');
assert(
  reputation.includes('home.reputationCompact.guestTitle') &&
    reputation.includes('home.reputationCompact.guestCta'),
  'guest reputation row uses guest-specific title + cta',
);
assert(
  !!get(nl, 'home.reputationCompact.guestTitle') &&
    !!get(en, 'home.reputationCompact.guestTitle') &&
    !!get(nl, 'home.reputationCompact.guestCta') &&
    !!get(en, 'home.reputationCompact.guestCta'),
  'guest reputation copy present in NL + EN',
);

// --- 5A.7 Filter refine label clarifies scope (within results) -----------
console.log('\n5A.7 Filter refine label clarity');
{
  const nlRefine = String(get(nl, 'feed.refineSectionLabel') ?? '');
  const enRefine = String(get(en, 'feed.refineSectionLabel') ?? '');
  assert(/resultaten/i.test(nlRefine), `NL refine label scoped to results — got "${nlRefine}"`);
  assert(/results/i.test(enRefine), `EN refine label scoped to results — got "${enRefine}"`);
}

// --- Copy parity for every touched namespace -----------------------------
console.log('\nCopy NL/EN parity (touched namespaces)');
assert(!!nl && !!en, 'both i18n files parse');
for (const ns of ['homePhase1', 'homeDorpsplein', 'home', 'guestBottomNav', 'guestSalesPanels', 'feed']) {
  const nlKeys = new Set(flatKeys(get(nl, ns) ?? {}));
  const enKeys = new Set(flatKeys(get(en, ns) ?? {}));
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

// --- 5A.11 Performance architecture preserved (Phase 4 / 4B / 4C) --------
console.log('\n5A.11 Performance regression guard (Phase 4/4B/4C preserved)');
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
  !hero.includes("console.log('orbit image src'"),
  'no debug logging reintroduced in hero hot path',
);
for (const guard of [
  'scripts/validate-discovery-experience.ts',
  'scripts/validate-homepage-performance.ts',
  'scripts/validate-platform-performance-phase4b.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
]) {
  assert(fs.existsSync(path.join(process.cwd(), guard)), `guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
