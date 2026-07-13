#!/usr/bin/env npx tsx
/**
 * Phase 3E — Product query parity (inactive paid access + order).
 */
import { prisma } from '../lib/prisma';
import {
  fetchFeedProducts,
  type FeedProductQueryStrategy,
} from '../lib/feed/feed-product-query.server';

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

async function idsFor(strategy: FeedProductQueryStrategy) {
  const rows = await fetchFeedProducts(prisma, { strategy });
  return rows.map((r) => `${r.id}:${r.createdAt.toISOString()}`);
}

async function main() {
  console.log('=== Phase 3E — Product query parity ===\n');
  const orSingle = await idsFor('or_single');
  const splitOr = await idsFor('split_or');
  assert(orSingle.join('|') === splitOr.join('|'), 'split_or matches or_single order+ids');
  assert(orSingle.length > 0, 'returns products');

  const inactivePaid = await prisma.product.findFirst({
    where: {
      isActive: false,
      orderItems: { some: { Order: { stripeSessionId: { not: null } } } },
    },
    select: { id: true },
  });
  if (inactivePaid) {
    const all = await fetchFeedProducts(prisma, { strategy: 'split_or' });
    assert(
      all.some((r) => r.id === inactivePaid.id),
      'inactive paid product included when present',
    );
  } else {
    console.log('  ℹ️  no inactive+paid product in DB — skip inclusion check');
  }

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
