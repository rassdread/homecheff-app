/**
 * PHASE 8B.1 §8 — how wide is the mis-scoped refund row problem? READ ONLY.
 *
 *   npx tsx --env-file=.env.local docs/audits/seller-financial-guidance-8b1-refund/systemic.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../../lib/prisma';

const OUT = 'docs/audits/seller-financial-guidance-8b1-refund';

/** Which write path produced a row, inferred from its deterministic id prefix. */
function writePath(id: string, providerRef: string | null) {
  if (id.startsWith('refund_trr_')) return 'RECIPIENT_REVERSAL (seller net)';
  if (id.startsWith('refund_buyer_')) return 'REFUND_SETTLEMENT (buyer total on single leg)';
  if (id.startsWith('refund_reversal_')) return 'STRIPE_WEBHOOK (seller net)';
  if (id.startsWith('refund_delivery_ledger_')) return 'HC_DELIVERY (ledger clawback)';
  if (providerRef === 'ledger_clawback') return 'HC_DELIVERY (ledger clawback)';
  return 'UNKNOWN/LEGACY';
}

async function main() {
  const txns = await prisma.transaction.findMany({
    select: {
      id: true,
      sellerId: true,
      amountCents: true,
      platformFeeBps: true,
      status: true,
      createdAt: true,
      Refund: { select: { id: true, amountCents: true, providerRef: true } },
    },
  });

  const withRefunds = txns.filter((t) => t.Refund.length > 0);

  const rows = withRefunds.map((t) => {
    const total = t.Refund.reduce((s, r) => s + r.amountCents, 0);
    const netCents = t.amountCents - Math.round((t.amountCents * t.platformFeeBps) / 10_000);
    return {
      year: t.createdAt.getUTCFullYear(),
      sellerConsiderationCents: t.amountCents,
      sellerNetCents: netCents,
      refundTotalCents: total,
      exceedsConsideration: total > t.amountCents,
      excessCents: Math.max(0, total - t.amountCents),
      writePaths: t.Refund.map((r) => ({
        path: writePath(r.id, r.providerRef),
        amountCents: r.amountCents,
        scope:
          r.amountCents === t.amountCents
            ? 'EQUALS_SELLER_GROSS'
            : r.amountCents === netCents
              ? 'EQUALS_SELLER_NET'
              : 'NEITHER (buyer-level or partial)',
      })),
    };
  });

  // Every settlement ever planned: the single-leg branch is the defective one.
  const settlements = await prisma.refundSettlement.findMany({
    select: { id: true, orderId: true, status: true, mode: true, planJson: true },
  });

  const settlementShapes = settlements.map((s) => {
    let legs = -1;
    let consideration: number | null = null;
    let buyer: number | null = null;
    try {
      const p = JSON.parse(s.planJson);
      legs = Array.isArray(p.sellerLegs) ? p.sellerLegs.length : -1;
      consideration = Array.isArray(p.sellerLegs)
        ? p.sellerLegs.reduce(
            (a: number, l: any) => a + (l.sellerConsiderationRefundCents ?? 0),
            0,
          )
        : null;
      buyer = p.buyerRefundCents ?? null;
    } catch {
      /* keep defaults */
    }
    return {
      status: s.status,
      mode: s.mode,
      sellerLegCount: legs,
      sellerConsiderationRefundCents: consideration,
      buyerRefundCents: buyer,
      hitsSingleLegBranch: legs === 1,
      branchWouldMisstate: legs === 1 && buyer !== consideration,
    };
  });

  const out = {
    readOnly: true,
    writes: 0,
    transactionsTotal: txns.length,
    transactionsWithRefunds: withRefunds.length,
    refundExceedsSaleCases: rows.filter((r) => r.exceedsConsideration).length,
    yearsAffected: [
      ...new Set(rows.filter((r) => r.exceedsConsideration).map((r) => r.year)),
    ].sort(),
    sellersAffected: [
      ...new Set(
        withRefunds
          .filter((t) => t.Refund.reduce((s, r) => s + r.amountCents, 0) > t.amountCents)
          .map((t) => t.sellerId),
      ),
    ].length,
    totalExcessCents: rows.reduce((s, r) => s + r.excessCents, 0),
    perTransaction: rows,
    refundSettlements: {
      total: settlements.length,
      completed: settlementShapes.filter((s) => s.status === 'COMPLETED').length,
      singleSellerLeg: settlementShapes.filter((s) => s.hitsSingleLegBranch).length,
      singleLegWhereBuyerDiffersFromConsideration: settlementShapes.filter(
        (s) => s.branchWouldMisstate,
      ).length,
      shapes: settlementShapes,
    },
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'systemic.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
