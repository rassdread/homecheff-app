/**
 * Read-only historical €1.27 dispute capacity check.
 * Order is fully refunded + transfer fully reversed → additional recovery MUST be 0.
 * No Stripe financial mutation.
 */
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { planDisputeRecovery } from '../lib/payments/dispute-settlement';

const ORDER_ID = 'b7df063b-a305-4129-a63f-3418bb6846df';
const TRANSFER_ID = 'tr_3U55jB2KvmKfeN9t1L9OEvJn';

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  });

  const tr = await stripe.transfers.retrieve(TRANSFER_ID);
  const plan = await planDisputeRecovery({
    orderId: ORDER_ID,
    stripeDisputeId: 'dp_hypothetical_e1_readonly',
    disputeAmountCents: 127,
    stripeAmountReversedByTransferId: {
      [TRANSFER_ID]: tr.amount_reversed,
    },
  });

  console.log(
    JSON.stringify(
      {
        dryRun: true,
        stripeMutated: false,
        LIVE_FINANCIAL_MUTATION: false,
        transfer_amount: tr.amount,
        transfer_amount_reversed: tr.amount_reversed,
        plan: {
          sellerRecoveryCents: plan.sellerRecoveryCents,
          alreadyReversedSellerCents: plan.alreadyReversedSellerCents,
          affiliateRecoveryCents: plan.affiliateRecoveryCents,
          courierRecoveryCents: plan.courierRecoveryCents,
          platformExposureCents: plan.platformExposureCents,
          sellerLegs: plan.sellerLegs,
          reconciliation: plan.reconciliation,
          warnings: plan.warnings,
        },
        ADDITIONAL_SELLER_REVERSAL_CAPACITY: plan.sellerRecoveryCents,
        expected_capacity: 0,
        pass: plan.sellerRecoveryCents === 0 && tr.amount_reversed === 88,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
  process.exit(plan.sellerRecoveryCents === 0 && tr.amount_reversed === 88 ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
