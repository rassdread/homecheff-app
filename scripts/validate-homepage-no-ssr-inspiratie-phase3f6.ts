#!/usr/bin/env npx tsx
/**
 * Phase 3F.6 — Homepage must not SSR-serialize inspiratie items.
 *
 * Run: npx tsx scripts/validate-homepage-no-ssr-inspiratie-phase3f6.ts
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

console.log('=== Phase 3F.6 — No SSR inspiratie on homepage ===\n');

const homePage = read('app/page.tsx');
const homeClient = read('components/home/HomePageClient.tsx');

console.log('3F.6 Homepage SSR');
assert(
  !homePage.includes('getInspiratieItems'),
  'app/page.tsx does not call getInspiratieItems',
);
assert(
  !homePage.includes('initialInspiratieItems'),
  'app/page.tsx does not pass initialInspiratieItems',
);
assert(
  homePage.includes('getServerSession'),
  'app/page.tsx uses getServerSession for SSR auth hint only',
);
assert(
  homePage.includes('ssrAuthHint'),
  'app/page.tsx passes ssrAuthHint (lightweight SSR)',
);
assert(/export const revalidate\s*=/.test(homePage), 'homepage ISR revalidate preserved');

console.log('\n3F.6 Client props');
assert(
  !homeClient.includes('initialInspiratieItems'),
  'HomePageClient does not accept initialInspiratieItems prop',
);
assert(
  homeClient.includes('ssrAuthHint'),
  'HomePageClient forwards ssrAuthHint to GeoFeed',
);

console.log('\n3F.6 Deferred inspiratie');
const geoFeed = read('components/feed/GeoFeed.tsx');
assert(
  geoFeed.includes('/api/inspiratie?'),
  'GeoFeed loads inspiratie client-side after feed hydration',
);
assert(
  geoFeed.includes('feedHydrated'),
  'deferred inspiratie gated on feedHydrated',
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
