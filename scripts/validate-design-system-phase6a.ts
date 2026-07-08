#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 6A — Unified Design System Consolidation guard.
 *
 * Phase 6A consolidates the existing UI onto one design-system layer WITHOUT
 * redesign. The safe consolidations executed this phase:
 *   1. Removed the dead, never-adopted `Hc*` primitive family
 *      (HcButton/HcCard/HcInput/HcTextarea) — the canonical primitives are
 *      ui/Button, ui/Card, ui/Input.
 *   2. Unified the two parallel empty-state i18n namespaces onto the canonical
 *      singular `emptyState.*` (the plural `emptyStates.*` was removed) and
 *      routed 5 profile grids/lists through the shared `ui/EmptyState`.
 *
 * This guard also re-asserts the frozen Phase 4/4B/4C performance architecture.
 * Static, dependency-free. Run: npx tsx scripts/validate-design-system-phase6a.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

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
function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
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
/** repo-wide grep via git (fast, respects .gitignore); returns matching line count. */
function gitGrepCount(pattern: string): number {
  try {
    const out = execSync(`git grep -I -c -e ${JSON.stringify(pattern)} -- '*.ts' '*.tsx'`, {
      cwd: process.cwd(),
      encoding: 'utf8',
    });
    return out.split('\n').filter(Boolean).length;
  } catch {
    return 0; // git grep exits non-zero when there are no matches
  }
}

console.log('=== UX-FIN Phase 6A — Design System consolidation guard ===\n');

// --- Canonical design-system primitives present -----------------------------
console.log('Canonical primitives present');
for (const f of [
  'components/ui/Button.tsx',
  'components/ui/Card.tsx',
  'components/ui/Input.tsx',
  'components/ui/EmptyState.tsx',
  'components/ui/LoadingSkeleton.tsx',
  'components/navigation/RouteLoadingSkeletons.tsx',
  'components/ui/UserCircleAvatar.tsx',
  'components/ui/SafeImage.tsx',
  'components/ui/Tag.tsx',
  'components/ui/ChipToggle.tsx',
  'components/ui/ShareButton.tsx',
]) {
  assert(exists(f), `canonical primitive present: ${f}`);
}

// --- Dead Hc* duplicate family removed --------------------------------------
console.log('\nDead Hc* duplicate primitive family removed');
for (const f of [
  'components/ui/HcButton.tsx',
  'components/ui/HcCard.tsx',
  'components/ui/HcInput.tsx',
  'components/ui/HcTextarea.tsx',
]) {
  assert(!exists(f), `removed dead duplicate: ${f}`);
}
for (const sym of ['HcButton', 'HcCard', 'HcInput', 'HcTextarea']) {
  assert(gitGrepCount(sym) === 0, `no remaining code reference to ${sym}`);
}

// --- Empty-state i18n namespace consolidated --------------------------------
console.log('\nEmpty-state i18n unified on canonical singular namespace');
const nl = readJson('public/i18n/nl.json');
const en = readJson('public/i18n/en.json');
assert(!!nl && !!en, 'both i18n files parse');
assert(
  nl && en && !('emptyStates' in nl) && !('emptyStates' in en),
  'duplicate plural "emptyStates" namespace removed (NL + EN)',
);
assert(!!nl?.emptyState && !!en?.emptyState, 'canonical "emptyState" namespace present');
{
  const nlKeys = new Set(flatKeys(nl?.emptyState ?? {}));
  const enKeys = new Set(flatKeys(en?.emptyState ?? {}));
  const diff =
    [...nlKeys].filter((k) => !enKeys.has(k)).length +
    [...enKeys].filter((k) => !nlKeys.has(k)).length;
  assert(diff === 0, `emptyState NL/EN parity (nl:${nlKeys.size} en:${enKeys.size})`);
}
for (const key of ['favoritesTitle', 'favoritesDesc', 'ordersTitle', 'fansTitle', 'followsTitle']) {
  assert(!!nl?.emptyState?.[key] && !!en?.emptyState?.[key], `emptyState.${key} present NL + EN`);
}
assert(gitGrepCount("t('emptyStates.") === 0 && gitGrepCount('t("emptyStates.') === 0,
  'no component still calls the removed emptyStates.* keys');

// --- Shared EmptyState adoption (5 grids/lists) -----------------------------
console.log('\nShared EmptyState adoption across profile grids/lists');
const emptyAdopters: [string, string][] = [
  ['components/FavoritesGrid.tsx', 'emptyState.favoritesTitle'],
  ['components/profile/FavoritesGrid.tsx', 'emptyState.favoritesTitle'],
  ['components/profile/OrderList.tsx', 'emptyState.ordersTitle'],
  ['components/profile/FansList.tsx', 'emptyState.fansTitle'],
  ['components/FollowsList.tsx', 'emptyState.followsTitle'],
];
for (const [file, key] of emptyAdopters) {
  const src = read(file);
  assert(src.includes('@/components/ui/EmptyState'), `${file} imports shared EmptyState`);
  assert(src.includes(key), `${file} uses ${key}`);
  assert(
    !/text-muted-foreground">\s*Nog geen/.test(src),
    `${file} no longer renders a bare hardcoded dead-end empty`,
  );
}

// --- Performance architecture frozen (Phase 4/4B/4C) ------------------------
console.log('\nPerformance architecture frozen');
const geoFeed = read('components/feed/GeoFeed.tsx');
const density = read('lib/feed/homeDesktopFeedColumns.ts');
assert(
  density.includes('useSyncExternalStore') && density.includes('return 2'),
  'density: external store + desktop default 2 columns',
);
assert(
  geoFeed.includes('flex flex-col gap-4 hc-feed-cards-column'),
  'mobile feed default single column',
);
assert(
  read('lib/feed/home-feed-return-cache.ts').includes('isHomeFeedReturnCacheStale'),
  'homepage SWR return cache preserved',
);
assert(
  read('lib/runtime/sessionSwrCache.ts').includes('SWR_FRESH_MS'),
  'unified SWR cache (4C) preserved',
);
for (const guard of [
  'scripts/validate-unified-feedback-phase5e.ts',
  'scripts/validate-marketplace-polish-phase5d.ts',
  'scripts/validate-discovery-pillars-phase5c.ts',
  'scripts/validate-runtime-performance-phase4c.ts',
  'scripts/validate-discovery2-information-architecture.ts',
]) {
  assert(exists(guard), `prior guard present: ${guard}`);
}

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
