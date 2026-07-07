#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 5C — Discovery Pillars implementation guard.
 *
 * Phase 5C implements the low-risk, presentational P0/P1 roadmap items from the
 * Phase 5B IA audit:
 *  - a first-class Diensten (Services) discovery pillar (SERVICE/TASK/WORKSHOP/COACHING),
 *  - a visible verticals axis (Eten/Tuin/Creaties),
 *  - a compact mobile ecosystem strip,
 *  - restored props-giving on the correct (workspace/inspiration) surface,
 *  - and better Mijn Afspraken visibility on mobile.
 *
 * This validator asserts those facts + NL/EN parity + that the full Phase 4/4B/4C
 * performance architecture is still preserved (no extra feed fetch on chip switch,
 * density defaults, single GeoFeed mount).
 *
 * Static, dependency-free. Run: npx tsx scripts/validate-discovery-pillars-phase5c.ts
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

console.log('=== UX-FIN Phase 5C — Discovery Pillars implementation guard ===\n');

const geoFeed = read('components/feed/GeoFeed.tsx');
const mobileToolbar = read('components/feed/FeedMobileToolbar.tsx');
const taxonomy = read('lib/feed/feed-taxonomy.ts');
const saleLib = read('lib/feed/marketplace-sale.ts');
const strip = read('components/home/HomeMobileEcosystemStrip.tsx');
const homeClient = read('components/home/HomePageClient.tsx');
const inspiration = read('components/inspiratie/InspiratieDetail.tsx');
const page = read('app/page.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
const nl = readJson('public/i18n/nl.json');
const en = readJson('public/i18n/en.json');

// --- 5C.2 Diensten discovery view --------------------------------------------
console.log('5C.2 Diensten discovery view');
assert(
  taxonomy.includes("'services'") && /filter === 'services'/.test(taxonomy),
  "feed taxonomy exposes a 'services' view filter",
);
assert(
  /tax\.kind === 'SERVICE'/.test(taxonomy) && /tax\.kind === 'TASK'/.test(taxonomy),
  'services filter includes SERVICE + TASK feed kinds (WORKSHOP/COACHING map to SERVICE)',
);
assert(
  saleLib.includes('isMarketplaceServiceItem') &&
    saleLib.includes("'SERVICE'") &&
    saleLib.includes("'TASK'") &&
    saleLib.includes("'WORKSHOP'") &&
    saleLib.includes("'COACHING'"),
  'SERVICE/TASK/WORKSHOP/COACHING listing kinds included in the Diensten classifier',
);
assert(
  geoFeed.includes('isMarketplaceServiceItem') &&
    geoFeed.includes('sortedServices'),
  'GeoFeed builds a Diensten pool from the existing sale pool (client-side, no new fetch)',
);
assert(
  /feedChip === "services"/.test(geoFeed),
  'GeoFeed renders a dedicated services branch',
);

// --- 5C.3 Discovery pillar chips ---------------------------------------------
console.log('\n5C.3 Discovery pillar chips (Alles / Te koop / Gezocht / Diensten / Inspiratie)');
assert(
  geoFeed.includes('feed.chipServices') && mobileToolbar.includes('feed.chipServices'),
  'Diensten chip present on both desktop chip row and mobile toolbar',
);
assert(
  geoFeed.includes('feed.chipSale') &&
    geoFeed.includes('feed.chipInspiration') &&
    geoFeed.includes('marketplace.discovery.requests.chip') &&
    geoFeed.includes('filters.all'),
  'existing chips (Alles / Te koop / Inspiratie / Gezocht) preserved',
);
{
  // Diensten must sit between Gezocht and Inspiratie in the intent axis.
  const gezocht = geoFeed.indexOf('marketplace.discovery.requests.chip');
  const services = geoFeed.indexOf('feed.chipServices');
  const inspiration = geoFeed.indexOf('feed.chipInspiration');
  assert(
    gezocht >= 0 && services > gezocht && inspiration > services,
    'intent axis order: Gezocht → Diensten → Inspiratie',
  );
}

// --- 5C.4 Verticals as visible discovery axis --------------------------------
console.log('\n5C.4 Verticals visible as a discovery axis (Eten/Tuin/Creaties)');
assert(
  geoFeed.includes('VERTICAL_CHIP_OPTIONS') &&
    geoFeed.includes('feed.verticalFood') &&
    geoFeed.includes('feed.verticalGarden') &&
    geoFeed.includes('feed.verticalCreations'),
  'vertical chip axis defined (Eten/Tuin/Creaties)',
);
assert(
  geoFeed.includes('selectVerticalChip') &&
    /selectVerticalChip = useCallback[\s\S]{0,120}setAppliedCategory/.test(geoFeed),
  'vertical chips mirror the category select state (same applied filter, no new axis)',
);

// --- 5C.5 Mobile ecosystem strip ---------------------------------------------
console.log('\n5C.5 Mobile ecosystem strip');
assert(
  strip.length > 0 && strip.includes('md:hidden'),
  'HomeMobileEcosystemStrip exists and is mobile-only',
);
assert(
  ['home.ecosystem.food', 'home.ecosystem.garden', 'home.ecosystem.creations', 'home.ecosystem.gezocht', 'home.ecosystem.services'].every(
    (k) => strip.includes(k),
  ),
  'strip communicates Eten · Tuin · Creaties · Gezocht · Diensten',
);
assert(
  homeClient.includes('HomeMobileEcosystemStrip') &&
    homeClient.includes('showMobileHomeFeed'),
  'strip is mounted in the mobile home surface',
);
assert(
  strip.includes('?vertical=') && strip.includes('?chip='),
  'strip reuses existing deep-link params (no new fetch path)',
);

// --- 5C.1 Props-giving on the correct surface --------------------------------
console.log('\n5C.1 Props-giving wired only to workspace/inspiration content');
assert(
  inspiration.includes('PropsButton') && inspiration.includes('dishId={item.id}'),
  'props-giving wired on inspiration detail (WorkspaceContentProp / dishId)',
);
assert(
  !read('components/feed/FeedItemCard.tsx').includes('PropsButton') &&
    !geoFeed.includes('PropsButton'),
  'props-giving NOT added to marketplace feed tiles (no clutter)',
);

// --- 5C.6 Mijn Afspraken visibility ------------------------------------------
console.log('\n5C.6 Mijn Afspraken visibility (canonical /profile/deals)');
assert(
  strip.includes('/profile/deals') && strip.includes('agreements.myAgreements'),
  'Mijn Afspraken surfaced for logged-in users on mobile, canonical route /profile/deals',
);
assert(
  !!get(nl, 'agreements.myAgreements') && !!get(en, 'agreements.myAgreements'),
  'agreements.myAgreements copy present in NL + EN',
);

// --- 5C.9 i18n parity for new copy -------------------------------------------
console.log('\n5C.9 i18n NL/EN parity (touched namespaces)');
assert(!!nl && !!en, 'both i18n files parse');
for (const key of [
  'feed.chipServices',
  'feed.verticalAxisLabel',
  'feed.verticalFood',
  'feed.verticalGarden',
  'feed.verticalCreations',
  'feed.emptyServicesTitle',
  'feed.emptyServicesBody',
  'home.ecosystem.title',
  'home.ecosystem.food',
  'home.ecosystem.services',
]) {
  assert(
    !!get(nl, key) && !!get(en, key),
    `i18n key present NL + EN: ${key}`,
  );
}
for (const ns of ['feed', 'home', 'agreements']) {
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

// --- Server deep-link mapping ------------------------------------------------
console.log('\nServer deep-link mapping (?chip=services|diensten)');
assert(
  page.includes("'services'") && /diensten/.test(page),
  'homepage normalizes ?chip=services|diensten to the services pillar',
);

// --- 5C.8 Performance architecture preserved (Phase 4 / 4B / 4C) -------------
console.log('\n5C.8 Performance regression guard (Phase 4/4B/4C preserved)');
assert(
  density.includes('useSyncExternalStore') && density.includes('return 2'),
  'density: external store + desktop default 2 columns',
);
assert(
  geoFeed.includes('flex flex-col gap-4 hc-feed-cards-column'),
  'mobile feed default single column',
);
{
  // The chip axis (incl. new services chip) must NOT be in the feed fetch deps.
  const depsStart = geoFeed.indexOf('viewerPlaceForApi,\n    apiLocationSource,');
  const depsWindow = depsStart >= 0 ? geoFeed.slice(depsStart, depsStart + 400) : '';
  assert(
    depsWindow.length > 0 &&
      !depsWindow.includes('feedChip') &&
      !depsWindow.includes('desktopFeedColumns'),
    'chip switch (incl. Diensten) + density never trigger a feed refetch',
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
{
  // Single GeoFeed mount: exactly one non-conditional-branch instantiation each
  // for mobile/desktop guarded by viewportResolved.
  const mounts = (homeClient.match(/<GeoFeed\b/g) ?? []).length;
  assert(
    mounts <= 2 && homeClient.includes('viewportResolved'),
    `single GeoFeed mount preserved (mobile XOR desktop, found ${mounts} guarded refs)`,
  );
}
for (const guard of [
  'scripts/validate-discovery2-information-architecture.ts',
  'scripts/validate-discovery-phase5a.ts',
  'scripts/validate-discovery-experience.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
]) {
  assert(fs.existsSync(path.join(process.cwd(), guard)), `guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
