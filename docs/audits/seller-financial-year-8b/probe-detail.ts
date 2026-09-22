/**
 * PHASE 8B — inspect the legs behind a seller-year. Read-only.
 *   npx tsx --env-file=.env.local docs/audits/seller-financial-year-8b/probe-detail.ts <sellerIdPrefix> [year]
 */
import { prisma } from '../../../lib/prisma';

async function main() {
  const prefix = process.argv[2] ?? '';
  const year = Number(process.argv[3] ?? new Date().getUTCFullYear());

  const seller = await prisma.transaction.findFirst({
    where: { sellerId: { startsWith: prefix } },
    select: { sellerId: true },
  });
  if (!seller?.sellerId) {
    console.log('no seller found');
    return prisma.$disconnect();
  }

  const txns = await prisma.transaction.findMany({
    where: { sellerId: seller.sellerId },
    select: {
      id: true,
      amountCents: true,
      platformFeeBps: true,
      status: true,
      createdAt: true,
      providerRef: true,
      Refund: { select: { id: true, amountCents: true, createdAt: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const t of txns) {
    const refunds = t.Refund.reduce((s, r) => s + r.amountCents, 0);
    console.log(
      [
        t.id.slice(0, 44).padEnd(44),
        t.status.padEnd(9),
        `amt=${String(t.amountCents).padStart(7)}`,
        `bps=${String(t.platformFeeBps).padStart(5)}`,
        `refund=${String(refunds).padStart(7)}`,
        `y=${t.createdAt.getUTCFullYear()}`,
        `ref=${(t.providerRef ?? '-').slice(0, 12)}`,
        refunds > t.amountCents + 1 ? '  <== REFUND_EXCEEDS_SALE' : '',
      ].join(' '),
    );
  }

  const hc = await prisma.marketplaceHcSettlementExposure.findMany({
    where: { sellerUserId: seller.sellerId },
    select: {
      id: true,
      status: true,
      sellerGrossEntitlementCents: true,
      effectiveSellerFeeBps: true,
      createdAt: true,
    },
  });
  console.log(`\nHC exposures: ${hc.length}`);
  for (const h of hc) {
    console.log(
      `  ${h.id.slice(0, 8)} ${h.status.padEnd(14)} gross=${h.sellerGrossEntitlementCents} bps=${h.effectiveSellerFeeBps ?? '-'} y=${h.createdAt.getUTCFullYear()}`,
    );
  }
  console.log(`\nyear requested: ${year}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
