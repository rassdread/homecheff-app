#!/usr/bin/env npx tsx
/**
 * Phase 3C — Product/Dish query shape guards.
 */
import * as fs from 'node:fs';

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

const feedRoute = fs.readFileSync('app/api/feed/route.ts', 'utf8');

console.log('=== Phase 3C — Feed queries ===\n');

ok('product Image omits fileUrl in select', feedRoute.includes('select: { sortOrder: true }'));
ok('product metadata loader used', feedRoute.includes('loadProductImageMetadata'));
ok('dish photos omit url in include', feedRoute.includes('select: { idx: true }'));
ok('dish metadata loader used', feedRoute.includes('loadDishPhotoMetadata'));
ok('resolveFeedUrlsFromMetadata used', feedRoute.includes('resolveFeedUrlsFromMetadata'));
ok('linked donor filter present', feedRoute.includes('productNeedsLinkedDishMedia'));
ok('linked ids subset not all products', feedRoute.includes('linkedIdsNeedingDonor'));

const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
ok('product has isActive+createdAt index', schema.includes('@@index([isActive, createdAt(sort: Desc)])'));
ok('dish missing status+createdAt index (proposal only)', !schema.includes('@@index([status, createdAt'));

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
