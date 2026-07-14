#!/usr/bin/env npx tsx
/**
 * Phase 3F Wave 2 — Critical render path optimization guard.
 *
 * Run: npx tsx scripts/validate-homepage-critical-render-path-phase3fw2.ts
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
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

console.log('=== Phase 3F Wave 2 — Critical render path ===\n');

const layout = read('app/layout.tsx');
const homeClient = read('components/home/HomePageClient.tsx');
const geoDynamic = read('components/home/HomeGeoFeedDynamic.tsx');
const providers = read('components/Providers.tsx');
const hero = read('components/home/HomeHeroSection.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');

console.log('Wave 2 GeoFeed code-split');
assert(
  fs.existsSync(path.join(process.cwd(), 'components/home/HomeGeoFeedDynamic.tsx')),
  'HomeGeoFeedDynamic wrapper exists',
);
assert(
  geoDynamic.includes("dynamic(() => import('@/components/feed/GeoFeed')"),
  'GeoFeed loaded via next/dynamic',
);
assert(
  geoDynamic.includes('HomeFeedViewportShell'),
  'GeoFeed loading skeleton present',
);
assert(
  homeClient.includes('HomeGeoFeedDynamic'),
  'HomePageClient imports split GeoFeed wrapper',
);
assert(count(homeClient, '<GeoFeed') === 1, 'exactly one GeoFeed mount on homepage');

console.log('\nWave 2 NavBar lazy');
assert(layout.includes("dynamic(() => import('@/components/NavBar')"), 'NavBar dynamic in layout');
assert(
  fs.existsSync(path.join(process.cwd(), 'components/navigation/NavBarShell.tsx')),
  'NavBarShell skeleton exists',
);
assert(layout.includes('NavBarShell'), 'NavBar loading uses NavBarShell');

console.log('\nWave 2 Hero / homepage deferrals');
assert(hero.includes('HomeHeroVisualCluster'), 'hero visual cluster deferred');
assert(hero.includes('GuestSalesInfoPanel'), 'guest sales panel deferred');
assert(homeClient.includes('dynamic('), 'HomePageClient uses dynamic imports for non-critical modules');

console.log('\nWave 2 provider deferral (interaction fix)');
assert(
  providers.includes("import { HcpRewardProvider } from '@/components/gamification/HcpRewardProvider'"),
  'HcpRewardProvider static import (intentional — avoids blocking layout children)',
);
assert(
  !providers.includes("import('@/components/gamification/HcpRewardProvider')"),
  'HcpRewardProvider not dynamic(ssr:false) around children',
);

console.log('\nWave 2 invariants');
assert(count(geoFeed, 'fetch(feedUrl') === 1, 'single feed fetch preserved');
assert(geoFeed.includes('feedPerfIncrementGeoFeedMount'), 'GeoFeed mount counter preserved');
assert(!geoFeed.includes('getInspiratieItems'), 'no SSR inspiratie in GeoFeed');

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
