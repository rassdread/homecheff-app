/**
 * HC Pilot / certification marketplace cleanup — inventory + optional soft-deactivate.
 *
 * Default: DRY RUN (report only).
 * Apply:   npx tsx scripts/marketplace-hc-pilot-cleanup.ts --apply
 *
 * Deletes/deactivates ONLY rows with strong HC Pilot / MediaCert test markers.
 * Never touches uncertain real-user listings (e.g. Lioness "Kᴇᴋsɪ" used in pilot scripts).
 */

import { PrismaClient } from '@prisma/client';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

type Classification = 'CONFIRMED_HC_PILOT_TEST_DATA' | 'UNCERTAIN' | 'REAL_USER_DATA';

type InventoryRow = {
  id: string;
  title: string;
  sellerId: string | null;
  classification: Classification;
  reason: string;
  isActive: boolean;
};

function classifyProduct(row: {
  id: string;
  title: string;
  description: string | null;
  sellerId: string | null;
  isActive: boolean;
}): InventoryRow | null {
  const title = (row.title || '').trim();
  const desc = (row.description || '').trim();
  const t = title.toLowerCase();
  const d = desc.toLowerCase();

  if (title.startsWith('MediaCert')) {
    return {
      id: row.id,
      title,
      sellerId: row.sellerId,
      classification: 'CONFIRMED_HC_PILOT_TEST_DATA',
      reason: 'MediaCert certification prefix',
      isActive: row.isActive,
    };
  }

  if (/hc\s*pilot/i.test(title) || title.includes('HomeCheff Design HC Pilot')) {
    return {
      id: row.id,
      title,
      sellerId: row.sellerId,
      classification: 'CONFIRMED_HC_PILOT_TEST_DATA',
      reason: 'Explicit HC Pilot listing title',
      isActive: row.isActive,
    };
  }

  if (
    d.includes('hc_only seller-payout certification') ||
    d.includes('controlled product owner design test offer') ||
    d.includes('sergio-owned homecheff design hc pilot')
  ) {
    return {
      id: row.id,
      title,
      sellerId: row.sellerId,
      classification: 'CONFIRMED_HC_PILOT_TEST_DATA',
      reason: 'HC pilot certification description marker',
      isActive: row.isActive,
    };
  }

  return null;
}

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      sellerId: true,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const inventory: InventoryRow[] = [];
  for (const p of products) {
    const row = classifyProduct(p);
    if (row) inventory.push(row);
  }

  const confirmed = inventory.filter((r) => r.classification === 'CONFIRMED_HC_PILOT_TEST_DATA');
  const report = {
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    totalProductsScanned: products.length,
    confirmedCount: confirmed.length,
    confirmedIds: confirmed.map((r) => r.id),
    inventory,
    preservedUncertain: [
      {
        id: '3b85deeb-5801-417a-a087-5b6027130ae0',
        title: 'Kᴇᴋsɪ',
        classification: 'UNCERTAIN',
        reason: 'Used in HC pilot scripts but owned by real seller Lioness — not auto-deleted',
      },
    ],
  };

  const outDir = join(process.cwd(), 'docs/audits/marketplace-hc-pilot-cleanup');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, APPLY ? 'apply-report.json' : 'inventory.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`Scanned ${products.length} products`);
  console.log(`CONFIRMED_HC_PILOT_TEST_DATA: ${confirmed.length}`);
  for (const row of confirmed) {
    console.log(`  [${row.classification}] ${row.id} | ${row.title} | ${row.reason}`);
  }

  if (!APPLY) {
    console.log('\nDry run — pass --apply to soft-deactivate confirmed rows (isActive=false).');
    await prisma.$disconnect();
    return;
  }

  if (confirmed.length === 0) {
    console.log('Nothing to deactivate.');
    await prisma.$disconnect();
    return;
  }

  const ids = confirmed.map((r) => r.id);
  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${result.count} confirmed HC Pilot test listings.`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
