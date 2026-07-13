#!/usr/bin/env npx tsx
/**
 * Phase 3E — Product query variant benchmark (read-only).
 */
import { prisma } from '../lib/prisma';
import {
  fetchFeedProducts,
  type FeedProductQueryStrategy,
} from '../lib/feed/feed-product-query.server';
import { isContactOnlyProduct } from '../lib/product/order-method';
import { isStripeTestId } from '../lib/stripe';

const STRATEGIES: FeedProductQueryStrategy[] = [
  'or_single',
  'split_or',
  'trimmed_or',
];

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

async function bench(strategy: FeedProductQueryStrategy, runs = 5) {
  const times: number[] = [];
  let lastRows: Awaited<ReturnType<typeof fetchFeedProducts>> = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    lastRows = await fetchFeedProducts(prisma, { strategy });
    times.push(Math.round(performance.now() - start));
  }
  times.sort((a, b) => a - b);
  const filtered = lastRows.filter(stripeFilter);
  return {
    strategy,
    runs: times,
    p50: times[Math.floor(times.length / 2)],
    rowCount: lastRows.length,
    afterStripeFilter: filtered.length,
    ids: lastRows.map((r) => r.id),
  };
}

async function main() {
  console.log('Phase 3E product query variants\n');
  const results = [];
  for (const s of STRATEGIES) {
    const r = await bench(s);
    results.push(r);
    console.log(
      `${s}: p50=${r.p50}ms rows=${r.rowCount} stripeOk=${r.afterStripeFilter}`,
    );
  }
  const ref = results[0].ids.join(',');
  const parity = results.every((r) => r.ids.join(',') === ref);
  console.log('\nfull_id_order_parity', parity);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
