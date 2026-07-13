#!/usr/bin/env npx tsx
/**
 * Phase 3E — Dish query parity + index presence.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { prisma } from '../lib/prisma';
import {
  fetchFeedPublishedDishes,
} from '../lib/feed/feed-dish-query.server';

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

async function main() {
  console.log('=== Phase 3E — Dish query parity ===\n');

  assert(
    fs.existsSync(path.join(process.cwd(), 'lib/feed/feed-dish-query.server.ts')),
    'dish query module exists',
  );

  const full = await fetchFeedPublishedDishes(prisma, {
    where: { status: 'PUBLISHED' },
    strategy: 'include_full',
  });
  const trimmed = await fetchFeedPublishedDishes(prisma, {
    where: { status: 'PUBLISHED' },
    strategy: 'trimmed_user',
  });
  assert(
    full.map((r) => r.id).join(',') === trimmed.map((r) => r.id).join(','),
    'trimmed_user same ids as include_full',
  );

  const indexes = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes WHERE tablename = 'Dish'
  `;
  const names = indexes.map((r) => r.indexname);
  assert(
    names.some((n) => n.includes('status') && n.includes('createdAt')),
    'Dish_status_createdAt index present',
  );

  console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
