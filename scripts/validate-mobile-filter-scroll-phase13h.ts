#!/usr/bin/env npx tsx
/**
 * Phase 13H — Mobile filter scroll behavior guard.
 *
 * Run: npx tsx scripts/validate-mobile-filter-scroll-phase13h.ts
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

const PRIOR = ['scripts/validate-pilot-readiness-phase13g.ts'];

console.log('=== Phase 13H — Mobile Filter Scroll ===\n');

console.log('13H.1 Deliverables');
assert(exists('docs/audits/MOBILE_FILTER_SCROLL_PHASE13H_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE13H_MOBILE_FILTER_SCROLL.md'), 'progress doc');
assert(exists('scripts/validate-mobile-filter-scroll-phase13h.ts'), 'validator');
assert(exists('hooks/useMobileFeedFilterScroll.ts'), 'scroll hook');

const hook = read('hooks/useMobileFeedFilterScroll.ts');
const toolbar = read('components/feed/FeedMobileToolbar.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');
const audit = read('docs/audits/MOBILE_FILTER_SCROLL_PHASE13H_AUDIT.md');

console.log('\n13H.2 Collapse logic');
assert(hook.includes('useMobileFeedFilterScroll'), 'hook export');
assert(hook.includes('passive: true'), 'passive scroll listener');
assert(hook.includes('MOBILE_FEED_FILTER_TOP_EXPAND_PX'), 'top expand threshold');
assert(hook.includes('MOBILE_FEED_FILTER_COLLAPSE_AFTER_PX'), 'collapse threshold');
assert(hook.includes('setCollapsed(true)'), 'collapse on scroll down');
assert(hook.includes('setCollapsed(false)'), 'expand at top');

console.log('\n13H.3 Minimized affordance');
assert(toolbar.includes('collapsed'), 'collapsed prop');
assert(toolbar.includes('data-mobile-filter-collapsed'), 'collapsed marker');
assert(toolbar.includes('onOpenFilters'), 'open filters handler');
assert(toolbar.includes('activeFilterCount'), 'active filter count');

console.log('\n13H.4 GeoFeed wiring');
assert(geoFeed.includes('useMobileFeedFilterScroll'), 'GeoFeed uses hook');
assert(geoFeed.includes('mobileFilterCollapsed'), 'collapsed state passed');
assert(geoFeed.includes('mobileFilterScrollEnabled'), 'mobile-only enable gate');
assert(geoFeed.includes('activeFilterCount={mobileActiveFilterCount}'), 'filter count wired');

console.log('\n13H.5 No new fetch / feed state regression');
assert(!hook.includes('fetch('), 'hook has no fetch');
assert(!toolbar.includes('fetch('), 'toolbar has no fetch');
assert(
  geoFeed.includes('home-feed-return-cache') || geoFeed.includes('feedSurfaceState'),
  'feed persistence SSOT still in GeoFeed',
);

console.log('\n13H.6 Desktop safety');
assert(toolbar.includes('collapsed') && toolbar.includes('if (collapsed)'), 'collapsed branch in toolbar only');
assert(geoFeed.includes('isDesktopSplit'), 'desktop split guard preserved');
assert(audit.includes('Desktop'), 'desktop unchanged documented');

console.log('\n13H.7 Accessibility');
assert(toolbar.includes('aria-label'), 'aria-label on collapsed button');
assert(toolbar.includes('mobileFilterCollapsedAria'), 'i18n aria keys');
assert(read('components/feed/FeedMobileFilterSheet.tsx').includes('aria-modal'), 'sheet modal unchanged');

console.log('\n13H.8 i18n');
assert(read('public/i18n/en.json').includes('mobileFilterCollapsedAria'), 'en strings');
assert(read('public/i18n/nl.json').includes('mobileFilterCollapsedAria'), 'nl strings');

console.log('\n13H.9 Chained validators');
for (const script of PRIOR) {
  assert(exists(script), script);
  try {
    execSync(`npx tsx ${script}`, { stdio: 'pipe', cwd: process.cwd() });
    assert(true, `${path.basename(script)} passed`);
  } catch {
    assert(false, `${path.basename(script)} passed`);
  }
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
