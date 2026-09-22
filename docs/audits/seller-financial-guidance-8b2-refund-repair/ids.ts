/**
 * PHASE 8B.2 — capture the exact primary keys of the anomaly. READ ONLY.
 *   npx tsx --env-file=.env.local docs/audits/seller-financial-guidance-8b2-refund-repair/ids.ts
 */
import { prisma } from '../../../lib/prisma';

const TXN = 'txn_b7df063b-a305-4129-a63f-3418bb6846df_fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';

async function main() {
  const rows = await prisma.refund.findMany({
    where: { transactionId: TXN },
    orderBy: { createdAt: 'asc' },
  });
  for (const r of rows) {
    console.log(JSON.stringify(r));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
