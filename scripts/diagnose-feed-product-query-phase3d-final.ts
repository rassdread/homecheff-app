#!/usr/bin/env npx tsx
/**
 * Phase 3D-Final — Product feed query diagnosis (read-only).
 *
 * Usage: npx tsx --env-file=.env.local scripts/diagnose-feed-product-query-phase3d-final.ts
 */
import { prisma } from '../lib/prisma';

const FEED_DB_PRODUCT_CAP = 40;

function parseHost(url: string): string {
  try {
    return new URL(url.replace('postgresql://', 'http://')).hostname;
  } catch {
    return 'unknown';
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const directUrl = process.env.DIRECT_URL ?? '';
  console.log('database_host_pooler', parseHost(dbUrl));
  console.log('database_host_direct', parseHost(directUrl));

  const counts = await prisma.$queryRaw<
    { active: number; inactive: number; total: number }[]
  >`
    SELECT
      count(*) FILTER (WHERE "isActive")::int AS active,
      count(*) FILTER (WHERE NOT "isActive")::int AS inactive,
      count(*)::int AS total
    FROM "Product"
  `;
  console.log('product_counts', counts[0]);

  const indexes = await prisma.$queryRaw<{ indexname: string; indexdef: string }[]>`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'Product'
    ORDER BY indexname
  `;
  console.log('product_indexes', indexes.map((r) => r.indexname));

  const explainActive = await prisma.$queryRaw<{ 'QUERY PLAN': string }[]>`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT p.id
    FROM "Product" p
    WHERE p."isActive" = true
    ORDER BY p."createdAt" DESC
    LIMIT ${FEED_DB_PRODUCT_CAP}
  `;
  console.log('\nEXPLAIN active-only:');
  for (const row of explainActive) console.log(row['QUERY PLAN']);

  const explainOr = await prisma.$queryRaw<{ 'QUERY PLAN': string }[]>`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT p.id
    FROM "Product" p
    WHERE (
      p."isActive" = true
      OR EXISTS (
        SELECT 1
        FROM "OrderItem" oi
        JOIN "Order" o ON o.id = oi."orderId"
        WHERE oi."productId" = p.id
          AND o."stripeSessionId" IS NOT NULL
      )
    )
    ORDER BY p."createdAt" DESC
    LIMIT ${FEED_DB_PRODUCT_CAP}
  `;
  console.log('\nEXPLAIN feed OR (active + paid inactive):');
  for (const row of explainOr) console.log(row['QUERY PLAN']);

  const runs: number[] = [];
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    await prisma.product.findMany({
      where: {
        OR: [
          { isActive: true },
          {
            isActive: false,
            orderItems: {
              some: { Order: { stripeSessionId: { not: null } } },
            },
          },
        ],
      },
      orderBy: [{ createdAt: 'desc' }],
      take: FEED_DB_PRODUCT_CAP,
      select: {
        id: true,
        title: true,
        createdAt: true,
        seller: {
          select: {
            id: true,
            User: { select: { id: true, name: true, username: true, profileImage: true } },
          },
        },
        Image: { select: { sortOrder: true }, orderBy: { sortOrder: 'asc' } },
        Video: { select: { url: true, thumbnail: true } },
      },
    });
    runs.push(Math.round(performance.now() - start));
  }
  runs.sort((a, b) => a - b);
  const p50 = runs[Math.floor(runs.length / 2)];
  const p95 = runs[Math.ceil(runs.length * 0.95) - 1];
  console.log('\nprisma_product_findMany_ms', { runs, p50, p95, min: runs[0], max: runs[runs.length - 1] });

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
