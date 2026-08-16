/**
 * Read-only dry-run for an Order refund/reversal plan.
 * NEVER calls Stripe refunds or transfer reversals.
 *
 * Usage:
 *   npx tsx scripts/dry-run-refund-order.ts b7df063b-a305-4129-a63f-3418bb6846df
 *   npx tsx scripts/dry-run-refund-order.ts <orderId> --mode=SELLER_CONSIDERATION --cents=50
 */
import {
  dryRunRefundSettlement,
  type RefundMode,
} from '../lib/payments/refund-settlement';
import { prisma } from '../lib/prisma';

async function main() {
  const orderId = process.argv[2];
  if (!orderId) {
    console.error('Usage: npx tsx scripts/dry-run-refund-order.ts <orderId>');
    process.exit(1);
  }

  let mode: RefundMode = 'FULL_BUYER_GROSS';
  let considerationCents: number | null = null;
  for (const arg of process.argv.slice(3)) {
    if (arg.startsWith('--mode=')) {
      mode = arg.slice('--mode='.length) as RefundMode;
    }
    if (arg.startsWith('--cents=')) {
      considerationCents = parseInt(arg.slice('--cents='.length), 10);
    }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    console.error('Order not found');
    process.exit(1);
  }

  const allocations =
    mode === 'SELLER_CONSIDERATION' || mode === 'EXPLICIT_ALLOCATION'
      ? order.items.map((item) => ({
          productId: item.productId,
          sellerConsiderationCents:
            considerationCents ?? item.priceCents * item.quantity,
        }))
      : undefined;

  // For multi-item + single --cents, apply to first item only
  if (
    allocations &&
    considerationCents != null &&
    allocations.length > 1
  ) {
    allocations[0].sellerConsiderationCents = considerationCents;
    for (let i = 1; i < allocations.length; i++) {
      allocations[i].sellerConsiderationCents = 0;
    }
  }

  const plan = await dryRunRefundSettlement({
    orderId,
    mode,
    allocations,
  });

  console.log(
    JSON.stringify(
      {
        dryRun: true,
        stripeMutated: false,
        LIVE_FINANCIAL_MUTATION: false,
        mode,
        orderId,
        preview: {
          buyerRefundCents: plan.buyerRefundCents,
          sellerReversalCents: plan.totals.sellerReversalCents,
          affiliateReversalCents: plan.totals.affiliateReversalCents,
          courierReversalCents: plan.totals.courierReversalCents,
          platformEconomicImpactCents: plan.totals.platformEconomicImpactCents,
          stripeFeeTreatment: plan.stripeFeeRefundTreatment,
        },
        sellerLegs: plan.sellerLegs,
        reconciliation: plan.reconciliation,
        policyFlags: plan.policyFlags,
        warnings: plan.warnings,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
