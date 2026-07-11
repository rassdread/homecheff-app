#!/usr/bin/env npx tsx
/**
 * Phase 13N — Instant Experience & Perceived Performance guard.
 *
 * Run: npx tsx scripts/validate-instant-experience-phase13n.ts
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

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function read(rel: string): string {
  const p = path.join(process.cwd(), rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function main() {
  console.log('=== Phase 13N — Instant Experience & Perceived Performance ===\n');

  console.log('13N.1 Deliverables');
  assert(exists('docs/audits/INSTANT_EXPERIENCE_PHASE13N_AUDIT.md'), 'audit doc');
  assert(exists('docs/progress/UX_FINALIZATION_PHASE13N_INSTANT_EXPERIENCE.md'), 'progress doc');
  assert(exists('scripts/validate-instant-experience-phase13n.ts'), 'validator');

  console.log('\n13N.2 Instant-experience modules');
  assert(exists('lib/instant-experience/route-loading-handoff.ts'), 'route loading handoff');
  assert(exists('lib/instant-experience/listing-detail-return-cache.ts'), 'listing detail return cache');
  assert(exists('components/navigation/RouteLoadingBoundaryMarker.tsx'), 'RouteLoadingBoundaryMarker');

  const handoff = read('lib/instant-experience/route-loading-handoff.ts');
  assert(handoff.includes('markRouteLoadingBoundaryShown'), 'handoff mark fn');
  assert(handoff.includes('consumeRouteLoadingHandoff'), 'handoff consume fn');

  const detailCache = read('lib/instant-experience/listing-detail-return-cache.ts');
  assert(detailCache.includes('saveListingDetailReturnCache'), 'detail cache save');
  assert(detailCache.includes('readListingDetailReturnCache'), 'detail cache read');
  assert(detailCache.includes('TTL_MS'), 'detail cache TTL');

  console.log('\n13N.3 Shared skeletons');
  const skeletons = read('components/navigation/RouteLoadingSkeletons.tsx');
  assert(skeletons.includes('FeedTileGridLoadingSkeleton'), 'tile grid skeleton');
  assert(skeletons.includes('HomeFeedViewportShell'), 'home feed viewport shell');
  assert(skeletons.includes('ProfileShellLoadingSkeleton'), 'profile shell skeleton');
  assert(skeletons.includes('NotificationsLoadingSkeleton'), 'notifications skeleton');
  assert(skeletons.includes('ProductDetailLoadingSkeleton'), 'product detail skeleton');

  console.log('\n13N.4 Route loading boundaries');
  const productLoading = read('app/product/[id]/loading.tsx');
  assert(productLoading.includes('RouteLoadingBoundaryMarker'), 'product loading handoff marker');
  assert(productLoading.includes('ProductDetailLoadingSkeleton'), 'product route skeleton');

  assert(exists('app/profile/loading.tsx'), 'profile loading.tsx');
  assert(exists('app/user/[username]/loading.tsx'), 'public profile loading.tsx');
  assert(exists('app/notifications/loading.tsx'), 'notifications loading.tsx');

  const profileLoading = read('app/profile/loading.tsx');
  assert(profileLoading.includes('ProfileShellLoadingSkeleton'), 'profile route skeleton');

  console.log('\n13N.5 Page wiring');
  const geoFeed = read('components/feed/GeoFeed.tsx');
  assert(geoFeed.includes('FeedTileGridLoadingSkeleton'), 'GeoFeed tile-shaped cold skeleton');
  assert(geoFeed.includes('home-feed-return-cache') || geoFeed.includes('feedHydrated'), 'GeoFeed return cache preserved');

  const homeClient = read('components/home/HomePageClient.tsx');
  assert(homeClient.includes('HomeFeedViewportShell'), 'home viewport placeholder');
  assert(homeClient.includes('viewportResolved'), 'home waits for viewport resolution');

  const listingDetail = read('components/product/ListingDetailPage.tsx');
  assert(listingDetail.includes('readListingDetailReturnCache'), 'detail return cache read');
  assert(listingDetail.includes('saveListingDetailReturnCache'), 'detail return cache write');
  assert(listingDetail.includes('consumeRouteLoadingHandoff'), 'detail handoff skip');
  assert(listingDetail.includes('ProductDetailLoadingSkeleton'), 'detail shared skeleton');

  const notifications = read('app/notifications/page.tsx');
  assert(notifications.includes('useSessionSwr'), 'notifications session SWR');
  assert(notifications.includes('NotificationsLoadingSkeleton'), 'notifications shared skeleton');

  console.log('\n13N.6 Persistent navigation');
  const providers = read('components/Providers.tsx');
  assert(providers.includes('RouteTransitionHost'), 'route transition host mounted');

  const routeHost = read('components/layout/RouteTransitionHost.tsx');
  assert(routeHost.includes('hc-route-pending-bar'), 'subtle route progress bar');

  console.log('\n13N.7 Audit completeness');
  const audit = read('docs/audits/INSTANT_EXPERIENCE_PHASE13N_AUDIT.md');
  assert(audit.includes('Home → Detail'), 'audit covers Home → Detail');
  assert(audit.includes('Detail → Back'), 'audit covers Detail → Back');
  assert(audit.includes('Remaining bottlenecks'), 'audit lists remaining bottlenecks');

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) process.exit(1);
}

main();
