#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 5E — Unified feedback, empty states & trust guard.
 *
 * Phase 5E makes feedback/empty/error experiences emotionally consistent, reusing
 * existing architecture (no redesign, no new functionality). Concrete safe fixes:
 *  - dead-end profile empty states (FavoritesGrid / OrderList / FansList) now use
 *    the shared EmptyState component + i18n (explain / why / next step),
 *  - DishReviewSection's alert() errors become inline, role="alert" feedback,
 *  - a centralised emptyStates.* i18n namespace with NL/EN parity.
 *
 * Re-asserts Phase 5D (props i18n, ShareButton) and the Phase 4/4B/4C/5C
 * performance architecture (no regression).
 *
 * Static, dependency-free. Run: npx tsx scripts/validate-unified-feedback-phase5e.ts
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

console.log('=== UX-FIN Phase 5E — Unified feedback & empty states guard ===\n');

const favGrid = read('components/FavoritesGrid.tsx');
const orderList = read('components/profile/OrderList.tsx');
const fansList = read('components/profile/FansList.tsx');
const dishReview = read('components/inspiratie/DishReviewSection.tsx');
const propsBtn = read('components/props/PropsButton.tsx');
const inspirationCard = read('components/inspiratie/InspirationCard.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
const nl = readJson('public/i18n/nl.json');
const en = readJson('public/i18n/en.json');

// --- 5E.3 Empty state unification --------------------------------------------
console.log('5E.3 Empty states unified via shared EmptyState');
assert(
  fs.existsSync(path.join(process.cwd(), 'components/ui/EmptyState.tsx')),
  'shared EmptyState component present',
);
for (const [label, src, key] of [
  ['FavoritesGrid', favGrid, 'emptyStates.favorites.title'],
  ['profile/OrderList', orderList, 'emptyStates.orders.title'],
  ['profile/FansList', fansList, 'emptyStates.fans.title'],
] as const) {
  assert(
    src.includes("from '@/components/ui/EmptyState'") ||
      src.includes('from "@/components/ui/EmptyState"'),
    `${label} imports shared EmptyState`,
  );
  assert(src.includes(`t("${key}")`) || src.includes(`t('${key}')`), `${label} uses ${key}`);
}
assert(
  !favGrid.includes('Nog geen favorieten') &&
    !orderList.includes('Nog geen bestellingen') &&
    !fansList.includes('Nog geen fans. Zodra'),
  'hardcoded Dutch dead-end empty strings removed from the unified grids',
);

// --- 5E.2 alert() → inline feedback ------------------------------------------
console.log('\n5E.2 alert() removed from the inspiration review flow');
assert(!/\balert\(/.test(dishReview), 'DishReviewSection no longer uses alert()');
assert(
  dishReview.includes('feedbackError') &&
    dishReview.includes('role="alert"') &&
    dishReview.includes("t('communityFeedback.submitError')"),
  'DishReviewSection shows an inline, role="alert" error using i18n',
);

// --- 5E.4 Success/empty language + parity ------------------------------------
console.log('\n5E.4 emptyStates copy present + NL/EN parity');
for (const key of [
  'emptyStates.favorites.title',
  'emptyStates.favorites.description',
  'emptyStates.favorites.cta',
  'emptyStates.orders.title',
  'emptyStates.orders.cta',
  'emptyStates.fans.title',
]) {
  assert(!!get(nl, key) && !!get(en, key), `i18n key present NL + EN: ${key}`);
}
for (const ns of ['emptyStates', 'favorites', 'communityFeedback', 'props', 'feed', 'home', 'agreements']) {
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

// --- 5E.1 Feedback standard documented (existing architecture reused) --------
console.log('\n5E.1 Feedback architecture available');
assert(
  fs.existsSync(path.join(process.cwd(), 'components/notifications/NotificationProvider.tsx')),
  'typed toast provider (NotificationProvider) available for opt-in toast feedback',
);

// --- Phase 5D regression guard (props i18n + inspiration card) ---------------
console.log('\nPhase 5D fixes still in place');
assert(
  propsBtn.includes("t('props.giveProps')") && !propsBtn.includes("'Props geven'"),
  'PropsButton copy still routed through i18n',
);
assert(
  inspirationCard.includes("import ShareButton from '@/components/ui/ShareButton'"),
  'InspirationCard still imports ShareButton',
);

// --- 5E.12 Performance architecture preserved --------------------------------
console.log('\n5E.12 Performance regression guard');
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
  read('lib/runtime/sessionSwrCache.ts').includes('SWR_FRESH_MS'),
  'unified SWR cache (4C) preserved',
);
for (const guard of [
  'scripts/validate-marketplace-polish-phase5d.ts',
  'scripts/validate-discovery-pillars-phase5c.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
  'scripts/validate-discovery2-information-architecture.ts',
]) {
  assert(fs.existsSync(path.join(process.cwd(), guard)), `guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
