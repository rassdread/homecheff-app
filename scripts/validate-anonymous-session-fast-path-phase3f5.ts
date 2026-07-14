#!/usr/bin/env npx tsx
/**
 * Phase 3F.5 — Anonymous session fast-path guard.
 *
 * Run: npx tsx scripts/validate-anonymous-session-fast-path-phase3f5.ts
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

console.log('=== Phase 3F.5 — Anonymous session fast-path ===\n');

const fastPath = read('lib/feed/anonymous-session-fast-path.ts');
const homePage = read('app/page.tsx');
const geoFeed = read('components/feed/GeoFeed.tsx');
const baseline = read('lib/feed/feed-performance-baseline.ts');

console.log('3F.5 Helper module');
assert(
  fs.existsSync(path.join(process.cwd(), 'lib/feed/anonymous-session-fast-path.ts')),
  'anonymous-session-fast-path module exists',
);
assert(
  fastPath.includes('shouldBypassSessionLoadingGate'),
  'shouldBypassSessionLoadingGate exported',
);
assert(
  fastPath.includes("ssrAuthHint === 'anonymous'"),
  'fast-path requires SSR anonymous confirmation',
);
assert(
  fastPath.includes('anonFastPathUsed'),
  'observability fields present',
);

console.log('\n3F.5 Homepage SSR auth hint');
assert(
  homePage.includes('getServerSession') && homePage.includes('ssrAuthHint'),
  'homepage derives ssrAuthHint from server session',
);

console.log('\n3F.5 GeoFeed gate');
assert(
  geoFeed.includes('isAwaitingSessionResolution'),
  'GeoFeed uses isAwaitingSessionResolution (not raw sessionStatus loading)',
);
assert(
  !geoFeed.includes('sessionStatus === "loading" ||') ||
    geoFeed.includes('isAwaitingSessionResolution(sessionStatus, ssrAuthHint)'),
  'session loading gate is SSR-hint aware',
);
assert(
  geoFeed.includes('session:anon-fast-path'),
  'anon fast-path perf milestone recorded',
);
assert(
  geoFeed.includes('nearbyScopeAwaitingProfileCoords'),
  'logged-in nearby bootstrap gate preserved',
);

console.log('\n3F.5 Observability');
assert(
  baseline.includes('sessionFastPath'),
  'feed perf reporter exposes sessionFastPath',
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
