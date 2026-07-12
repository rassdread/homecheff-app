#!/usr/bin/env npx tsx
/**
 * Phase 3D — Trust snapshot bounded TTL cache guards.
 */
import * as fs from 'node:fs';

import {
  TRUST_SNAPSHOT_CACHE_MAX_ENTRIES,
  TRUST_SNAPSHOT_CACHE_TTL_MS,
  TRUST_SNAPSHOT_CACHE_VERSION,
  resetTrustSnapshotCacheForTests,
  fetchSellerTrustSnapshotsWithReportCached,
} from '../lib/discovery/trust/trust-snapshot-cache';
import { prisma } from '../lib/prisma';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

const cacheModule = fs.readFileSync('lib/discovery/trust/trust-snapshot-cache.ts', 'utf8');
const batchModule = fs.readFileSync('lib/discovery/trust/batch-enrichment.ts', 'utf8');
const timingModule = fs.readFileSync('lib/feed/trust-enrichment-timing.ts', 'utf8');
const auditPath = 'docs/audits/homecheff-performance-phase3d-trust-cache.md';

console.log('=== Phase 3D — Trust cache ===\n');

ok('cache version constant', cacheModule.includes('TRUST_SNAPSHOT_CACHE_VERSION'));
ok('key includes version and mode', cacheModule.includes('`${TRUST_SNAPSHOT_CACHE_VERSION}:${mode}:${userId}`'));
ok('bounded max entries', TRUST_SNAPSHOT_CACHE_MAX_ENTRIES > 0 && TRUST_SNAPSHOT_CACHE_MAX_ENTRIES <= 500);
ok('TTL between 30s and 120s', TRUST_SNAPSHOT_CACHE_TTL_MS >= 30_000 && TRUST_SNAPSHOT_CACHE_TTL_MS <= 120_000);
ok('eviction on overflow', cacheModule.includes('evictIfNeeded'));
ok('batch enrichment useCache default', batchModule.includes('useCache !== false'));
ok('timing exposes cacheStats', timingModule.includes('cacheStats'));
ok('feed debug includes trustTiming', fs.readFileSync('app/api/feed/route.ts', 'utf8').includes('buildTrustTimingDebugPayload'));
ok('perf.trustTiming nested under debug.perf', fs.readFileSync('app/api/feed/route.ts', 'utf8').includes('perfPayload.trustTiming'));
ok('audit doc exists', fs.existsSync(auditPath));

async function runtimeChecks() {
  resetTrustSnapshotCacheForTests();
  const sellers = await prisma.user.findMany({ take: 2, select: { id: true } });
  const ids = sellers.map((s) => s.id);
  if (ids.length === 0) {
    ok('runtime warm cache hit (skipped — no users)', true);
    return;
  }

  await fetchSellerTrustSnapshotsWithReportCached(ids, { mode: 'minimal' });
  const warmStart = performance.now();
  const warm = await fetchSellerTrustSnapshotsWithReportCached(ids, { mode: 'minimal' });
  const warmMs = performance.now() - warmStart;

  ok('warm cache hits sellers', warm.cacheStats.hits >= ids.length);
  ok('warm fetch under 50ms', warmMs < 50);
  ok('cache version in stats', warm.cacheStats.version === TRUST_SNAPSHOT_CACHE_VERSION);
}

runtimeChecks()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
