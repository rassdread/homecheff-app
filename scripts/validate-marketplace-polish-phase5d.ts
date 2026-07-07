#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 5D — Marketplace UX polish & consistency guard.
 *
 * Phase 5D is a polish/consistency phase (no redesign, no new functionality).
 * It applies targeted, safe consistency fixes and documents the broader audit:
 *  - restores the missing ShareButton import on the inspiration card (latent crash),
 *  - routes PropsButton through i18n (was hardcoded "Props"/"Props geven" + a
 *    hardcoded Dutch error alert),
 *  - standardises the "Mijn Afspraken" navigation label casing (NL + EN).
 *
 * This validator pins those facts + i18n parity for touched namespaces and
 * re-asserts the Phase 4/4B/4C/5C performance architecture (no regression).
 *
 * Static, dependency-free. Run: npx tsx scripts/validate-marketplace-polish-phase5d.ts
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

console.log('=== UX-FIN Phase 5D — Marketplace UX polish guard ===\n');

const propsBtn = read('components/props/PropsButton.tsx');
const inspirationCard = read('components/inspiratie/InspirationCard.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
const nl = readJson('public/i18n/nl.json');
const en = readJson('public/i18n/en.json');

// --- 5D.3 Inspiration card no longer references an unimported ShareButton ----
console.log('5D.3 Card consistency — inspiration card fix');
assert(
  inspirationCard.includes("import ShareButton from '@/components/ui/ShareButton'"),
  'InspirationCard imports ShareButton (fixes latent ReferenceError on render)',
);
assert(
  !/<ShareButton/.test(inspirationCard) ||
    inspirationCard.includes("import ShareButton from '@/components/ui/ShareButton'"),
  'InspirationCard: every ShareButton usage has a matching import',
);

// --- 5D.1 / 5D.9 Props terminology through i18n ------------------------------
console.log('\n5D.1/5D.9 Props copy routed through i18n');
assert(
  propsBtn.includes("t('props.giveProps')") &&
    propsBtn.includes("t('props.propsButton')") &&
    propsBtn.includes("t('props.propsGiven')") &&
    propsBtn.includes("t('props.retract')"),
  'PropsButton labels/titles use i18n keys',
);
assert(
  !propsBtn.includes("'Props geven'") &&
    !propsBtn.includes("'Props!'") &&
    !propsBtn.includes("'Props ingetrekken'"),
  'PropsButton no longer hardcodes "Props"/"Props geven"/"Props ingetrekken"',
);
assert(
  !propsBtn.includes("'Er is een fout opgetreden'"),
  'PropsButton no longer hardcodes a Dutch error string (uses errors.propsError)',
);
assert(
  !/if \(data\.propsGiven\) \{\s*\}\s*else \{\s*\}/.test(propsBtn),
  'PropsButton dead empty success branches removed',
);
for (const key of ['props.giveProps', 'props.propsButton', 'props.propsGiven', 'props.retract', 'errors.propsError']) {
  assert(!!get(nl, key) && !!get(en, key), `i18n key present NL + EN: ${key}`);
}

// --- 5D.1 "Mijn Afspraken" nav label casing consistent -----------------------
console.log('\n5D.1 Terminology — "Mijn Afspraken" nav label casing');
{
  const nlLabels = [
    get(nl, 'profile.deals.navLabel'),
    get(nl, 'community.agreements.navLabel'),
    get(nl, 'roleQuickLinks.agreements'),
    get(nl, 'agreements.myAgreements'),
  ];
  const enLabels = [
    get(en, 'profile.deals.navLabel'),
    get(en, 'community.agreements.navLabel'),
    get(en, 'roleQuickLinks.agreements'),
    get(en, 'agreements.myAgreements'),
  ];
  assert(
    nlLabels.every((l) => l === 'Mijn Afspraken'),
    `NL: every Afspraken nav label reads "Mijn Afspraken" (${nlLabels.join(' | ')})`,
  );
  assert(
    enLabels.every((l) => l === 'My Agreements'),
    `EN: every Agreements nav label reads "My Agreements" (${enLabels.join(' | ')})`,
  );
}

// --- i18n parity for touched namespaces --------------------------------------
console.log('\ni18n NL/EN parity (touched namespaces)');
assert(!!nl && !!en, 'both i18n files parse');
for (const ns of ['props', 'agreements', 'roleQuickLinks', 'community', 'profile', 'feed', 'home']) {
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

// --- 5D.3 Unified tile system still the single card family -------------------
console.log('\n5D.3 Unified marketplace tile system intact');
assert(
  fs.existsSync(path.join(process.cwd(), 'components/marketplace/tiles/MarketplaceTileRouter.tsx')),
  'MarketplaceTileRouter (single card family) present',
);
assert(
  fs.existsSync(path.join(process.cwd(), 'components/ui/EmptyState.tsx')),
  'shared EmptyState component available for empty-state reuse',
);

// --- 5D.13 Performance architecture preserved (Phase 4 / 4B / 4C / 5C) -------
console.log('\n5D.13 Performance regression guard');
assert(
  density.includes('useSyncExternalStore') && density.includes('return 2'),
  'density: external store + desktop default 2 columns',
);
assert(
  geoFeed.includes('flex flex-col gap-4 hc-feed-cards-column'),
  'mobile feed default single column',
);
{
  const depsStart = geoFeed.indexOf('viewerPlaceForApi,\n    apiLocationSource,');
  const depsWindow = depsStart >= 0 ? geoFeed.slice(depsStart, depsStart + 400) : '';
  assert(
    depsWindow.length > 0 &&
      !depsWindow.includes('feedChip') &&
      !depsWindow.includes('desktopFeedColumns'),
    'chip switch + density never trigger a feed refetch',
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
  const homeClient = read('components/home/HomePageClient.tsx');
  const mounts = (homeClient.match(/<GeoFeed\b/g) ?? []).length;
  assert(
    mounts <= 2 && homeClient.includes('viewportResolved'),
    `single GeoFeed mount preserved (found ${mounts} guarded refs)`,
  );
}
for (const guard of [
  'scripts/validate-discovery-pillars-phase5c.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
  'scripts/validate-discovery2-information-architecture.ts',
]) {
  assert(fs.existsSync(path.join(process.cwd(), guard)), `guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
