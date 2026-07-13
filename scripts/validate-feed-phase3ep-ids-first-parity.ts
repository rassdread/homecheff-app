#!/usr/bin/env npx tsx
/**
 * Phase 3E+ — IDs-first parity vs legacy query strategies.
 */
import { prisma } from '../lib/prisma';
import {
  fetchFeedProducts,
  fetchFeedProductIdRows,
  hydrateFeedProductsFromIdRows,
} from '../lib/feed/feed-product-query.server';
import { fetchFeedPublishedDishes } from '../lib/feed/feed-dish-query.server';
import { batchHydrateFeedSellers } from '../lib/feed/feed-seller-hydration.server';

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

function productKey(rows: { id: string; createdAt: Date }[]) {
  return rows.map((r) => `${r.id}:${r.createdAt.toISOString()}`).join('|');
}

function sellerUserKey(
  rows: { seller?: { User?: { id: string } | null } | null }[],
) {
  return rows
    .map((r) => r.seller?.User?.id ?? 'none')
    .join(',');
}

async function main() {
  console.log('=== Phase 3E+ — IDs-first parity ===\n');

  const splitOr = await fetchFeedProducts(prisma, { strategy: 'split_or' });
  const idsFirst = await fetchFeedProducts(prisma, { strategy: 'ids_first' });

  assert(
    productKey(splitOr.rows) === productKey(idsFirst.rows),
    'product ids_first order matches split_or',
  );
  assert(
    splitOr.rows.length === idsFirst.rows.length,
    'product ids_first row count matches split_or',
  );

  const { idRows } = await fetchFeedProductIdRows(prisma);
  const hydrated = await hydrateFeedProductsFromIdRows(prisma, idRows);
  assert(
    productKey(hydrated.rows) === productKey(idsFirst.rows),
    'split hydrate path matches full ids_first',
  );
  assert(
    sellerUserKey(splitOr.rows) === sellerUserKey(idsFirst.rows),
    'product seller.User ids parity',
  );

  const sellerIds = [
    ...new Set(
      idsFirst.rows
        .map((r) => r.seller?.id)
        .filter((id): id is string => !!id),
    ),
  ];
  const sellers = await batchHydrateFeedSellers(prisma, sellerIds);
  assert(sellers.size === sellerIds.length, 'seller batch covers all unique seller profiles');

  const dishWhere = { status: 'PUBLISHED' as const };
  const full = await fetchFeedPublishedDishes(prisma, {
    where: dishWhere,
    strategy: 'include_full',
  });
  const idsDish = await fetchFeedPublishedDishes(prisma, {
    where: dishWhere,
    strategy: 'ids_first',
  });
  assert(
    full.rows.map((d) => d.id).join(',') === idsDish.rows.map((d) => d.id).join(','),
    'dish ids_first ids match include_full',
  );
  assert(
    full.rows.every((d, i) => {
      const other = idsDish.rows[i];
      return (
        other &&
        d.user.id === other.user.id &&
        d.photos.length === other.photos.length &&
        d.videos.length === other.videos.length
      );
    }),
    'dish user/media shape parity',
  );

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
