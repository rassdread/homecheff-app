/**
 * PHASE 8B.2 §18 — is any other Refund row mis-scoped? READ ONLY.
 * Repairs nothing. Reports counts so a second case would stop certification.
 *
 *   npx tsx --env-file=.env.local docs/.../scan.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../../lib/prisma';

const OUT = 'docs/audits/seller-financial-guidance-8b2-refund-repair';

async function main() {
  const txns = await prisma.transaction.findMany({
    select: {
      id: true,
      sellerId: true,
      amountCents: true,
      platformFeeBps: true,
      createdAt: true,
      Refund: { select: { id: true, amountCents: true, providerRef: true, createdAt: true } },
    },
  });

  const withRefunds = txns.filter((t) => t.Refund.length > 0);
  const allRows = withRefunds.flatMap((t) =>
    t.Refund.map((r) => ({ ...r, txn: t })),
  );

  const exceeds = withRefunds.filter(
    (t) => t.Refund.reduce((s, r) => s + r.amountCents, 0) > t.amountCents,
  );

  // A transfer reversal mirrored as a refund: providerRef is a Stripe reversal.
  const reversalMirrors = allRows.filter((r) => r.providerRef?.startsWith('trr_'));

  // The webhook's old duplicate shape.
  const webhookMirrors = allRows.filter((r) => r.id.startsWith('refund_reversal_'));

  // Buyer-level leakage: a row that matches neither the leg's gross nor a
  // plausible partial, i.e. strictly greater than the seller's consideration.
  const buyerLeakage = allRows.filter((r) => r.amountCents > r.txn.amountCents);

  // Same reversal represented more than once on a leg.
  const duplicateProviderRefs = Object.entries(
    allRows.reduce<Record<string, number>>((acc, r) => {
      const k = `${r.txn.id}|${r.providerRef ?? 'null'}`;
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).filter(([, n]) => n > 1);

  const out = {
    readOnly: true,
    writes: 0,
    scannedTransactions: txns.length,
    transactionsWithRefunds: withRefunds.length,
    refundRows: allRows.length,
    REFUND_EXCEEDS_SALE_CASES: exceeds.length,
    duplicateTransferReversalRefundRows: reversalMirrors.length,
    webhookReversalRefundRows: webhookMirrors.length,
    buyerLevelLeakageRows: buyerLeakage.length,
    duplicateProviderRefPerTransaction: duplicateProviderRefs.length,
    yearsAffected: [...new Set(exceeds.map((t) => t.createdAt.getUTCFullYear()))].sort(),
    sellersAffected: [...new Set(exceeds.map((t) => t.sellerId))].length,
    rows: allRows.map((r) => ({
      idShape: r.id.replace(/[0-9a-f-]{36}/gi, '<uuid>'),
      amountCents: r.amountCents,
      legGrossCents: r.txn.amountCents,
      providerRefKind: r.providerRef?.split('_')[0] ?? null,
      scope:
        r.amountCents === r.txn.amountCents
          ? 'EQUALS_SELLER_GROSS'
          : r.amountCents < r.txn.amountCents
            ? 'PARTIAL_OF_SELLER_GROSS'
            : 'EXCEEDS_SELLER_GROSS',
    })),
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'scan.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
