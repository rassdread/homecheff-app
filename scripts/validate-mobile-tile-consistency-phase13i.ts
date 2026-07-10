#!/usr/bin/env npx tsx
/**
 * Phase 13I — Mobile tile visual consistency & regression guard.
 *
 * Run: npx tsx scripts/validate-mobile-tile-consistency-phase13i.ts
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

const PRIOR = ['scripts/validate-mobile-filter-scroll-phase13h.ts'];

const TILE_COMPONENTS = [
  'components/marketplace/tiles/MarketplaceTileCompact.tsx',
  'components/marketplace/tiles/MarketplaceTileStandard.tsx',
  'components/marketplace/tiles/MarketplaceTileMini.tsx',
];

console.log('=== Phase 13I — Mobile Tile Visual Consistency ===\n');

console.log('13I.1 Deliverables');
assert(
  exists('docs/audits/MOBILE_TILE_VISUAL_CONSISTENCY_PHASE13I_AUDIT.md'),
  'audit doc',
);
assert(
  exists('docs/progress/UX_FINALIZATION_PHASE13I_MOBILE_TILE_CONSISTENCY.md'),
  'progress doc',
);
assert(exists('scripts/validate-mobile-tile-consistency-phase13i.ts'), 'validator');
assert(exists('lib/marketplace/tiles/legacy-feed-settlement.ts'), 'legacy feed settlement helper');

const audit = read('docs/audits/MOBILE_TILE_VISUAL_CONSISTENCY_PHASE13I_AUDIT.md');
const feedRoute = read('app/api/feed/route.ts');
const settlementRow = read('lib/marketplace/tiles/build-tile-settlement-row.ts');
const legacySettlement = read('lib/marketplace/tiles/legacy-feed-settlement.ts');
const feedMedia = read('components/feed/feedMedia.tsx');
const safeRoute = read('lib/native/safeRoute.ts');
const toolbar = read('components/feed/FeedMobileToolbar.tsx');
const sticky = read('lib/feed/mobile-filter-sticky.ts');
const hook = read('hooks/useMobileFeedFilterScroll.ts');
const geoFeed = read('components/feed/GeoFeed.tsx');
const bottomNav = read('components/navigation/BottomNavigation.tsx');
const bottomSpacer = read('lib/layout/bottomNavVisibility.ts');

console.log('\n13I.2 Settlement SSOT on tiles');
for (const tile of TILE_COMPONENTS) {
  const src = read(tile);
  assert(src.includes('buildTileSettlementRow'), `${path.basename(tile)} uses buildTileSettlementRow`);
  assert(src.includes('TileSettlementRow'), `${path.basename(tile)} renders TileSettlementRow`);
}
assert(
  settlementRow.includes('homeCheffCheckoutNeedsConnect'),
  'settlement row shows direct when Connect pending',
);
assert(legacySettlement.includes('resolveSettlementOptions'), 'legacy helper uses resolveSettlementOptions');

console.log('\n13I.3 Legacy feed parity');
assert(feedRoute.includes('legacyFeedSettlementBooleans'), 'feed route imports legacy helper');
assert(
  feedRoute.includes('acceptHomeCheffPayment: dishSettlement.acceptHomeCheffPayment'),
  'dish rows get settlement booleans',
);
assert(
  feedRoute.includes('acceptHomeCheffPayment: listingSettlement.acceptHomeCheffPayment'),
  'listing rows get settlement booleans',
);
assert(
  !feedRoute.includes('acceptHomeCheffPayment: null'),
  'no null settlement booleans on legacy rows',
);

console.log('\n13I.4 Native tap / href safety');
assert(
  feedMedia.includes('lightboxEligible = coarsePointer && !nativeMounted'),
  'native skips lightbox overlay on media',
);
assert(feedMedia.includes("navDebug('feed-tile:media-link'"), 'dev tap logging on media link');
assert(safeRoute.includes('normalized.startsWith("/request/")'), '/request/ safe route');
assert(safeRoute.includes('normalized.startsWith("/recipe/")'), '/recipe/ safe route');
assert(safeRoute.includes('normalized.startsWith("/inspiratie/")'), '/inspiratie/ safe route');

console.log('\n13I.5 Collapsed filter positioning');
assert(exists('lib/feed/mobile-filter-sticky.ts'), 'sticky offset SSOT');
assert(sticky.includes('--hc-navbar-height'), 'navbar height CSS var in sticky offset');
assert(sticky.includes('safe-area-inset-top'), 'safe-area top in sticky offset');
assert(toolbar.includes('MOBILE_FEED_FILTER_STICKY_BELOW_NAV'), 'toolbar uses below-nav sticky');
assert(toolbar.includes('MOBILE_FEED_FILTER_STICKY_TOP'), 'toolbar uses top sticky when nav scrolled');
assert(toolbar.includes('navPinned'), 'toolbar navPinned prop');
assert(hook.includes('navPinned'), 'hook exports navPinned');
assert(geoFeed.includes('mobileFilterNavPinned'), 'GeoFeed passes navPinned');
assert(!toolbar.includes('top-[3.25rem]'), 'old floating sticky offset removed');
assert(toolbar.includes('bg-white') && !toolbar.includes('bg-white/95'), 'collapsed bar solid background');

console.log('\n13I.6 No GeoFeed remount / desktop safety');
assert(!hook.includes('fetch('), 'scroll hook has no fetch');
assert(geoFeed.includes('isDesktopSplit'), 'desktop split guard preserved');
assert(audit.includes('Desktop'), 'desktop unchanged documented');

console.log('\n13I.7 Bottom nav safe area');
assert(
  bottomNav.includes('pb-[env(safe-area-inset-bottom,0px)]') &&
    bottomNav.includes('isNativeShell'),
  'native inner bar applies safe-area once',
);
assert(
  !bottomNav.includes('safe-area-inset-bottom,0px)+10px)'),
  'no extra +10px bottom padding on native',
);
assert(bottomSpacer.includes('h-[5.75rem]'), 'native flow spacer aligned to chrome');
assert(audit.includes('Bottom navigation'), 'bottom nav audit section');

console.log('\n13I.8 UX intent & pixel review sections');
assert(audit.includes('PART 8'), 'UX intent audit');
assert(audit.includes('PART 9'), 'pixel perfect review');
assert(audit.includes('P0'), 'severity classification');
assert(audit.includes('P1'), 'P1 classification');
assert(audit.includes('P2'), 'P2 classification');

console.log('\n13I.10 Profile mobile hero');
const profileHeader = read('components/profile/v2/ProfileV2Header.tsx');
const profileCss = read('app/globals.css');
assert(profileHeader.includes('hc-profile-v2-hero-main'), 'profile hero main wrapper');
assert(profileHeader.includes('hc-profile-v2-hero-identity'), 'profile hero identity block');
assert(profileHeader.includes('break-words'), 'long name wrapping');
assert(profileHeader.includes('xl:text-left'), 'desktop-only left align breakpoint');
assert(!profileHeader.includes('lg:grid-cols-'), 'no lg side-by-side grid on profile');
assert(profileCss.includes('.hc-profile-v2-hero-main'), 'hero main CSS');
assert(profileCss.includes('max-width: 1279px'), 'mobile stacked hero CSS');
assert(profileCss.includes('1280px'), 'xl desktop profile grid');
assert(audit.includes('Profile mobile') || audit.includes('PART 10'), 'profile mobile audit section');

console.log('\n13I.11 Mobile detail navigation (P0)');
assert(
  fs.existsSync('docs/audits/MOBILE_DETAIL_NAVIGATION_PHASE13I_AUDIT.md'),
  'detail navigation audit',
);
assert(
  fs.existsSync('scripts/validate-mobile-detail-navigation-phase13i.ts'),
  'detail navigation validator',
);
const detailPage = read('components/product/ListingDetailPage.tsx');
assert(detailPage.includes('ListingDetailUnavailable'), 'detail unavailable UI');
assert(!detailPage.includes("router.push('/')"), 'no home redirect on detail fetch fail');
assert(
  fs.existsSync('app/product/[id]/error.tsx') && fs.existsSync('app/request/[slug]/error.tsx'),
  'detail error boundaries',
);

console.log('\n13I.9 Chained validators');
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
