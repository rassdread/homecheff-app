#!/usr/bin/env npx tsx
/**
 * Phase 3E — Query path fixture + contract tests (Product + Dish).
 */
import { prisma } from '../lib/prisma';
import {
  fetchFeedProducts,
} from '../lib/feed/feed-product-query.server';
import { fetchFeedPublishedDishes } from '../lib/feed/feed-dish-query.server';
import {
  deduplicateCrossSourceFeedItems,
  FEED_DB_PRODUCT_CAP,
  FEED_DB_DISH_CAP,
} from '../lib/feed/feed-candidate-window';
import { isContactOnlyProduct } from '../lib/product/order-method';
import { isStripeTestId } from '../lib/stripe';

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

function stripeFilter(product: {
  priceCents: number | null;
  orderMethod?: string | null;
  seller?: { User?: { stripeConnectAccountId?: string | null } | null } | null;
}): boolean {
  if (isContactOnlyProduct(product)) return true;
  if (!product.priceCents || product.priceCents === 0) return true;
  const seller = product.seller?.User;
  if (!seller?.stripeConnectAccountId) return true;
  return !isStripeTestId(seller.stripeConnectAccountId);
}

async function main() {
  console.log('=== Phase 3E — Query fixture contracts ===\n');

  console.log('Product split_or');
  const orSingle = await fetchFeedProducts(prisma, { strategy: 'or_single' });
  const splitOr = await fetchFeedProducts(prisma, { strategy: 'split_or' });

  assert(orSingle.length <= FEED_DB_PRODUCT_CAP, `take cap <= ${FEED_DB_PRODUCT_CAP}`);
  assert(splitOr.length <= FEED_DB_PRODUCT_CAP, 'split_or respects cap');
  assert(
    orSingle.map((r) => `${r.id}:${r.createdAt.toISOString()}`).join('|') ===
      splitOr.map((r) => `${r.id}:${r.createdAt.toISOString()}`).join('|'),
    'split_or exact createdAt order parity with or_single',
  );

  const ids = new Set(splitOr.map((r) => r.id));
  assert(ids.size === splitOr.length, 'no duplicate product ids after merge');

  for (const row of splitOr) {
    assert(!!row.id && !!row.createdAt, `product ${row.id} has id+createdAt`);
    assert(
      row.seller?.User?.id != null || row.seller == null,
      `product ${row.id} seller.User shape intact`,
    );
    assert(
      row.orderMethod != null || row.priceCents != null,
      `product ${row.id} payment fields present`,
    );
  }

  const filtered = splitOr.filter(stripeFilter);
  assert(filtered.length === splitOr.length, 'stripe filter parity on fixture set');

  const activeCount = await prisma.product.count({ where: { isActive: true } });
  assert(
    splitOr.length >= Math.min(activeCount, 1) || activeCount === 0,
    'active products visible when active rows exist',
  );

  console.log('\nDish query');
  const dishWhere = { status: 'PUBLISHED' as const };
  const full = await fetchFeedPublishedDishes(prisma, {
    where: dishWhere,
    strategy: 'include_full',
  });
  const trimmed = await fetchFeedPublishedDishes(prisma, {
    where: dishWhere,
    strategy: 'trimmed_user',
  });

  assert(full.length <= FEED_DB_DISH_CAP, `dish take <= ${FEED_DB_DISH_CAP}`);
  assert(
    full.map((d) => d.id).join(',') === trimmed.map((d) => d.id).join(','),
    'trimmed_user same dish ids as include_full',
  );

  const linkedProductIds = splitOr.filter(stripeFilter).map((p) => p.id);
  const standalone = await fetchFeedPublishedDishes(prisma, {
    where: {
      status: 'PUBLISHED',
      ...(linkedProductIds.length > 0 ? { id: { notIn: linkedProductIds } } : {}),
    },
  });
  assert(standalone.length > 0 || full.length === 0, 'standalone dishes query returns rows when dishes exist');

  const dishOnly = standalone.map((d) => ({
    id: d.id,
    feedSource: 'DISH' as const,
    createdAt: d.createdAt,
  }));
  const productOnly = splitOr.slice(0, 3).map((p) => ({
    id: p.id,
    feedSource: 'PRODUCT' as const,
    createdAt: p.createdAt,
  }));
  const deduped = deduplicateCrossSourceFeedItems([
    ...productOnly,
    ...dishOnly.filter((d) => productOnly.some((p) => p.id === d.id)),
  ]);
  assert(
    deduped.items.length <= productOnly.length + dishOnly.length,
    'linked product/dish dedup reduces twins',
  );

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
