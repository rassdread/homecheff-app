#!/usr/bin/env npx tsx
/**
 * Phase 3E — Dish query variant + index usage (read-only).
 */
import { prisma } from '../lib/prisma';
import {
  fetchFeedPublishedDishes,
  type FeedDishQueryStrategy,
} from '../lib/feed/feed-dish-query.server';

const STRATEGIES: FeedDishQueryStrategy[] = ['include_full', 'trimmed_user', 'ids_first'];

async function bench(strategy: FeedDishQueryStrategy, runs = 5) {
  const where = { status: 'PUBLISHED' as const };
  const times: number[] = [];
  let lastRows: { id: string }[] = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    const result = await fetchFeedPublishedDishes(prisma, { where, strategy });
    lastRows = result.rows;
    times.push(Math.round(performance.now() - start));
  }
  times.sort((a, b) => a - b);
  return {
    strategy,
    p50: times[Math.floor(times.length / 2)],
    rowCount: lastRows.length,
    ids: lastRows.map((r) => r.id),
  };
}

async function main() {
  const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes WHERE tablename = 'Dish' ORDER BY indexname
  `;
  console.log('dish_indexes', indexes.map((r) => r.indexname));

  const explain = await prisma.$queryRaw<{ 'QUERY PLAN': string }[]>`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT id FROM "Dish"
    WHERE status = 'PUBLISHED'
    ORDER BY "createdAt" DESC
    LIMIT 30
  `;
  console.log('\nEXPLAIN Dish feed scan:');
  for (const row of explain) console.log(row['QUERY PLAN']);

  console.log('\nVariants:');
  const results = [];
  for (const s of STRATEGIES) {
    const r = await bench(s);
    results.push(r);
    console.log(`${s}: p50=${r.p50}ms rows=${r.rowCount}`);
  }
  console.log(
    'id_parity',
    results[0].ids.join(',') === results[1].ids.join(','),
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
