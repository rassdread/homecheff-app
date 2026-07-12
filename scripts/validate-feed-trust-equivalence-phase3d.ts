#!/usr/bin/env npx tsx
/**
 * Phase 3D — Cached trust snapshots must match uncached (tile fields).
 */
import { fetchSellerTrustBundlesWithReport } from '../lib/discovery/trust/batch-enrichment';
import { resetTrustSnapshotCacheForTests } from '../lib/discovery/trust/trust-snapshot-cache';
import type { SellerTrustSnapshot } from '../lib/discovery/trust/types';
import { prisma } from '../lib/prisma';

const TILE_FIELDS: (keyof SellerTrustSnapshot)[] = [
  'productReviewCountSeller',
  'dealReviewCount',
  'courierReviewCount',
  'completedDealsAsSeller',
  'completedDeliveries',
  'completedProductOrders',
  'repeatCustomers',
  'hasSellerProfile',
  'hasDeliveryProfile',
  'hasActiveListing',
  'businessPlan',
  'trustBadgeSlugs',
];

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

function snapshotTileFingerprint(s: SellerTrustSnapshot): string {
  const pick: Record<string, unknown> = { userId: s.userId };
  for (const key of TILE_FIELDS) {
    pick[key] = s[key];
  }
  return JSON.stringify(pick);
}

console.log('=== Phase 3D — Trust equivalence ===\n');

async function main() {
  const sellers = await prisma.user.findMany({ take: 4, select: { id: true } });
  const ids = sellers.map((s) => s.id);
  if (ids.length === 0) {
    ok('equivalence check (skipped — no users)', true);
    return;
  }

  resetTrustSnapshotCacheForTests();
  const uncached = await fetchSellerTrustBundlesWithReport(ids, undefined, {
    mode: 'minimal',
    useCache: false,
  });

  resetTrustSnapshotCacheForTests();
  const cached = await fetchSellerTrustBundlesWithReport(ids, undefined, {
    mode: 'minimal',
    useCache: true,
  });

  for (const id of ids) {
    const a = uncached.bundles.get(id)?.snapshot;
    const b = cached.bundles.get(id)?.snapshot;
    ok(`bundle exists for ${id.slice(0, 8)}`, Boolean(a && b));
    if (a && b) {
      ok(
        `tile fingerprint match ${id.slice(0, 8)}`,
        snapshotTileFingerprint(a) === snapshotTileFingerprint(b),
      );
    }
  }
}

main()
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
