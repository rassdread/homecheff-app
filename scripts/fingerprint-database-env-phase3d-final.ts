#!/usr/bin/env npx tsx
/**
 * Phase 3D-Final — Preview vs production database fingerprint (no secrets logged).
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/fingerprint-database-env-phase3d-final.ts
 *   DATABASE_URL=... npx tsx scripts/fingerprint-database-env-phase3d-final.ts
 */
import { prisma } from '../lib/prisma';

function fingerprintUrl(url: string | undefined, label: string) {
  if (!url) {
    console.log(label, { present: false });
    return null;
  }
  try {
    const parsed = new URL(url.replace('postgresql://', 'http://'));
    const endpoint = parsed.hostname.replace('.eu-central-1.aws.neon.tech', '').replace('.pooler', '');
    return {
      label,
      host: parsed.hostname,
      endpointId: endpoint,
      database: parsed.pathname.replace('/', ''),
      pooled: url.includes('pooler'),
      ssl: parsed.searchParams.get('sslmode') ?? null,
    };
  } catch {
    console.log(label, { present: true, parseError: true });
    return null;
  }
}

async function main() {
  const pooler = fingerprintUrl(process.env.DATABASE_URL, 'DATABASE_URL');
  const direct = fingerprintUrl(process.env.DIRECT_URL, 'DIRECT_URL');
  console.log(JSON.stringify({ pooler, direct }, null, 2));

  const dishIndex = await prisma.$queryRaw<{ indexname: string }[]>`
    SELECT indexname FROM pg_indexes
    WHERE tablename = 'Dish' AND indexname = 'Dish_status_createdAt_idx'
  `;
  const rowCounts = await prisma.$queryRaw<
    { products: number; dishes: number; users: number }[]
  >`
    SELECT
      (SELECT count(*)::int FROM "Product") AS products,
      (SELECT count(*)::int FROM "Dish") AS dishes,
      (SELECT count(*)::int FROM "User") AS users
  `;

  console.log('live_row_counts', rowCounts[0]);
  console.log('dish_status_index_present', dishIndex.length > 0);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
