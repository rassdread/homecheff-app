#!/usr/bin/env npx tsx
/**
 * UX Finalization Phase 7F — Homepage sidebar IA guard.
 *
 * Run: npx tsx scripts/validate-homepage-sidebar-phase7f.ts
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

console.log('=== UX-FIN Phase 7F — Homepage sidebar IA ===\n');

const left = read('components/home/HomeDesktopLeftSidebar.tsx');
const right = read('components/home/HomeDesktopSidebar.tsx');
const page = read('components/home/HomePageClient.tsx');
const mobile = read('components/home/HomeMobileEcosystemStrip.tsx');
const ia = read('lib/home/home-desktop-sidebar-ia.ts');
const stack = read('components/discovery/surfaces/DesktopRightSidebarSurfaceStack.tsx');

console.log('7F.1 Left workspace column');
assert(exists('components/home/HomeDesktopLeftSidebar.tsx'), 'HomeDesktopLeftSidebar exists');
assert(left.includes('RoleQuickLinksSection'), 'left: Quick Actions via RoleQuickLinksSection');
assert(left.includes('HOME_DESKTOP_ENVIRONMENT_LINKS'), 'left: Mijn omgeving nav');
assert(left.includes('HOME_DESKTOP_MARKETPLACE_LINKS'), 'left: Marketplace nav');
assert(left.includes('FeedFiltersPanel'), 'left: discovery filters at bottom');
assert(left.includes('filtersOpen'), 'left: collapsible filters (default open)');

console.log('\n7F.2 Right community cockpit');
assert(right.includes('data-home-sidebar="community-cockpit"'), 'right: community cockpit marker');
assert(right.includes('GrowthActionStack'), 'right: HCP/growth progress');
assert(right.includes('CommunityPulseBar'), 'right: community moments');
assert(right.includes('HomeRecommendedPromotions'), 'right: promotions last');
assert(!right.includes('RoleQuickLinksSection'), 'right: no Quick Actions duplicate');
assert(!right.includes('quickActionsTitle'), 'right: no duplicate quick-actions card');
assert(!right.includes('spotlightCta'), 'right: no duplicate Gezocht spotlight card');

console.log('\n7F.3 Component placement (HomePageClient)');
assert(page.includes('HomeDesktopLeftSidebar'), 'desktop left uses workspace sidebar');
assert(!page.includes('<FeedFiltersPanel />'), 'filters not mounted standalone in page grid');
assert(page.includes('HomeDesktopSidebar'), 'desktop right uses community sidebar');
assert(page.includes('showMobileHomeFeed'), 'mobile branch preserved');
assert(page.includes('HomeMobileEcosystemStrip'), 'mobile ecosystem strip unchanged');

console.log('\n7F.4 Mobile regression guard');
assert(mobile.includes('md:hidden'), 'ecosystem strip remains mobile-only');

console.log('\n7F.5 Marketplace nav includes services + wanted');
assert(ia.includes("vertical=services"), 'marketplace nav: services category link');
assert(ia.includes("chip=gezocht"), 'marketplace nav: wanted view link');

console.log('\n7F.6 Activity stack split (no growth duplicate on right)');
assert(stack.includes("mode?: 'full' | 'activity-modules'"), 'surface stack supports activity-only mode');
assert(right.includes('mode="activity-modules"'), 'right uses activity-only stack slice');

console.log('\n7F.7 Performance — no extra fetch in sidebar IA');
for (const src of [left, right, ia]) {
  assert(!/\bfetch\s*\(/.test(src), 'sidebar IA module has no fetch()');
}

console.log('\nDeliverables');
assert(exists('docs/audits/HOMEPAGE_SIDEBAR_PHASE7F_AUDIT.md'), 'audit doc');
assert(exists('docs/progress/UX_FINALIZATION_PHASE7F_HOMEPAGE_SIDEBAR.md'), 'progress doc');

console.log(`\n=== ${passed} passed, ${failed} failed ===`);
process.exit(failed === 0 ? 0 : 1);
