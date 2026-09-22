/**
 * PHASE 8B — live query probe.
 *   npx tsx --env-file=.env.local docs/audits/seller-financial-year-8b/probe.ts
 *
 * Read-only. Exercises the real Prisma queries in the canonical loader against
 * whichever sellers actually have settled transactions, and checks idempotency.
 */
import { prisma } from '../../../lib/prisma';
import { deriveSellerFinancialYear } from '../../../lib/finance/seller-financial-year.server';
import { deriveSellerDac7Year } from '../../../lib/compliance/dac7-derive';

async function main() {
  const year = Number(process.argv[2] ?? new Date().getUTCFullYear());

  const sellers = await prisma.transaction.groupBy({
    by: ['sellerId'],
    _count: { _all: true },
    orderBy: { _count: { sellerId: 'desc' } },
    take: 5,
  });

  console.log(`sellers with transactions: ${sellers.length}`);

  for (const s of sellers) {
    if (!s.sellerId) continue;
    const t0 = Date.now();
    const a = await deriveSellerFinancialYear(s.sellerId, year);
    const ms = Date.now() - t0;
    const b = await deriveSellerFinancialYear(s.sellerId, year);
    const idempotent =
      JSON.stringify(a) === JSON.stringify(b) ? 'IDEMPOTENT' : 'NON_DETERMINISTIC';

    let dac7 = 'n/a';
    try {
      const d = await deriveSellerDac7Year(s.sellerId, year);
      dac7 = `goodsGross=${d.goods.grossConsiderationCents} svcGross=${d.personalService.grossConsiderationCents} recon=${d.refundReconciliation.state}`;
    } catch (e) {
      dac7 = `ERROR ${(e as Error).message}`;
    }

    console.log(
      [
        `seller=${s.sellerId.slice(0, 8)}`,
        `txnRows=${s._count._all}`,
        `year=${year}`,
        `gross=${a.sellerGrossSalesCents}`,
        `refund=${a.refundCents}`,
        `net=${a.netSalesCents}`,
        `fees=${a.netPlatformFeesCents}`,
        `proceeds=${a.sellerNetProceedsCents}`,
        `count=${a.transactionCount}`,
        `courier=${a.courierDeliveryGrossCents}`,
        `events=${a.events.length}`,
        `completeness=${a.completeness}`,
        `warnings=${a.warnings.map((w) => w.code).join('|') || '-'}`,
        idempotent,
        `${ms}ms`,
        `dac7[${dac7}]`,
      ].join(' '),
    );
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
