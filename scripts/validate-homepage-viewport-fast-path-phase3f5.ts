#!/usr/bin/env npx tsx
/**
 * Phase 3F.5 — Homepage viewport fast-path guard.
 *
 * Run: npx tsx scripts/validate-homepage-viewport-fast-path-phase3f5.ts
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

console.log('=== Phase 3F.5 — Homepage viewport fast-path ===\n');

const hook = read('hooks/useNarrowViewport.ts');
const homeClient = read('components/home/HomePageClient.tsx');

console.log('3F.5 Viewport hook');
assert(
  hook.includes('resolved: true'),
  'useNarrowViewportResolved starts resolved (no mount gate)',
);
assert(
  hook.includes('useLayoutEffect'),
  'useLayoutEffect still refines narrow before paint',
);

console.log('\n3F.5 Single GeoFeed mount');
assert(
  count(homeClient, '<GeoFeed') === 1,
  'exactly one GeoFeed element in HomePageClient',
);
assert(
  !homeClient.includes('HomeFeedViewportShell'),
  'viewport skeleton shell removed from critical path',
);
assert(
  !homeClient.includes('showMobileHomeFeed') &&
    !homeClient.includes('showDesktopHomeFeed'),
  'no dual mobile/desktop GeoFeed branches',
);
assert(
  homeClient.includes('homeComposedLayout={showDesktopComposedLayout}'),
  'layout toggles via prop on single GeoFeed instance',
);

console.log('\n3F.5 Desktop default');
assert(
  homeClient.includes('showDesktopComposedLayout = !isNarrowHome'),
  'desktop composed layout when not narrow',
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
