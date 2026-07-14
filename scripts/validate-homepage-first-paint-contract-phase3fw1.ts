#!/usr/bin/env npx tsx
/**
 * Phase 3F Wave 1 — Homepage first-paint contract guard.
 *
 * Run: npx tsx scripts/validate-homepage-first-paint-contract-phase3fw1.ts
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

function exists(rel: string): boolean {
  return fs.existsSync(path.join(process.cwd(), rel));
}

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

console.log('=== Phase 3F Wave 1 — First-paint contract ===\n');

const homePage = read('app/page.tsx');
const homeClient = read('components/home/HomePageClient.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');
const feedRoute = read('app/api/feed/route.ts');
const schema = read('prisma/schema.prisma');

console.log('Wave 1 scope — no feed/API/DB changes');
assert(
  !feedRoute.includes('Phase 3F Wave 1'),
  'feed route unchanged by wave marker (sanity)',
);
assert(
  !exists('prisma/migrations/20260714_phase3fw1'),
  'no new Prisma migration for Wave 1',
);

console.log('\nWave 1 HTML reduction');
assert(!homePage.includes('getInspiratieItems'), 'no SSR inspiratie fetch');
assert(
  exists('scripts/validate-homepage-no-ssr-inspiratie-phase3f6.ts'),
  '3F.6 validator present',
);

console.log('\nWave 1 session fast-path');
assert(
  exists('scripts/validate-anonymous-session-fast-path-phase3f5.ts'),
  '3F.5 session validator present',
);
assert(homePage.includes('ssrAuthHint'), 'SSR auth hint wired');

console.log('\nWave 1 viewport fast-path');
assert(
  exists('scripts/validate-homepage-viewport-fast-path-phase3f5.ts'),
  '3F.5 viewport validator present',
);
assert(count(homeClient, '<GeoFeed') === 1, 'single GeoFeed mount');

console.log('\nWave 1 feed invariants');
assert(count(geoFeed, 'fetch(feedUrl') === 1, 'exactly one feed fetch call');
assert(
  geoFeed.includes('feedPerfIncrementGeoFeedMount'),
  'GeoFeed mount counter preserved',
);
assert(
  geoFeed.includes('feedPerfIncrementFeedFetch'),
  'feed fetch counter preserved',
);

console.log('\nWave 1 inspiratie deferred');
assert(geoFeed.includes('/api/inspiratie?'), 'client inspiratie fetch preserved');
assert(
  !geoFeed.includes('Promise.all([feedP, inspP])'),
  'inspiratie not parallel-fetched with feed (deferred post-hydration)',
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
