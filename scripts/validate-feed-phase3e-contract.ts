#!/usr/bin/env npx tsx
/**
 * Phase 3E — Contract guard (no migration changes, probe gating, modules).
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

function migrationCount(): number {
  const dir = path.join(process.cwd(), 'prisma/migrations');
  return fs.readdirSync(dir).filter((f) => {
    const p = path.join(dir, f);
    return fs.statSync(p).isDirectory();
  }).length;
}

async function main() {
  console.log('=== Phase 3E — Contract guard ===\n');

  assert(migrationCount() === 1, 'single active baseline migration only');
  assert(read('scripts/vercel-build.js').includes('prisma generate'), 'vercel build no migrate deploy');
  assert(!read('scripts/vercel-build.js').includes('migrate deploy'), 'no auto migrate in build');

  const route = read('app/api/feed/route.ts');
  assert(route.includes('fetchFeedProducts'), 'uses feed product query module');
  assert(route.includes('fetchFeedPublishedDishes'), 'uses feed dish query module');
  assert(route.includes('shouldRunFeedApiTiming'), 'probe timing gate in route');
  assert(route.includes('STATS_PREVIEW_DEFERRED = true'), 'stats still deferred');

  const geo = read('components/feed/GeoFeed.tsx');
  assert(geo.includes('feedRequestKeyInFlightRef') || geo.includes('feedFetchCount'), 'single fetch guard');

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
