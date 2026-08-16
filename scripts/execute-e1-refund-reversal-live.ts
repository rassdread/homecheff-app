/**
 * APPROVE_E1_REFUND_REVERSAL_TEST — controlled live refund + transfer reversal.
 * Authorized: buyer 127¢, seller reverse 88¢ on tr_3U55jB2KvmKfeN9t1L9OEvJn only.
 */
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import {
  dryRunRefundSettlement,
  persistRefundPlan,
  executeRefundSettlement,
} from '../lib/payments/refund-settlement';

const ORDER_ID = 'b7df063b-a305-4129-a63f-3418bb6846df';
const EXPECTED = {
  buyerRefundCents: 127,
  sellerReversalCents: 88,
  transferId: 'tr_3U55jB2KvmKfeN9t1L9OEvJn',
  destination: 'acct_1Sj52gRyMYBvOmov',
};

async function stop(msg: string): Promise<never> {
  console.error('STOP:', msg);
  await prisma.$disconnect();
  process.exit(2);
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith('sk_live')) {
    await stop('STRIPE_SECRET_KEY is not live — refusing');
  }

  const stripe = new Stripe(key!, { apiVersion: '2025-08-27.basil' });

  const transfer = await stripe.transfers.retrieve(EXPECTED.transferId);
  if (transfer.amount !== 88) await stop(`transfer.amount=${transfer.amount} != 88`);
  if (transfer.amount_reversed !== 0) {
    await stop(`transfer already reversed: ${transfer.amount_reversed}`);
  }
  if (transfer.destination !== EXPECTED.destination) {
    await stop(`destination ${transfer.destination} != ${EXPECTED.destination}`);
  }

  const charge = await stripe.charges.retrieve('py_3U55jB2KvmKfeN9t1Qr93icB');
  if (charge.refunded || charge.amount_refunded > 0) {
    await stop(`charge already refunded: ${charge.amount_refunded}`);
  }
  if (charge.disputed) await stop('charge disputed');

  const piBefore = await stripe.paymentIntents.retrieve('pi_3U55jB2KvmKfeN9t1qgoZzLL');
  const chargeBeforeId =
    typeof piBefore.latest_charge === 'string'
      ? piBefore.latest_charge
      : piBefore.latest_charge?.id;

  const plan = await dryRunRefundSettlement({
    orderId: ORDER_ID,
    mode: 'FULL_BUYER_GROSS',
  });

  if (plan.buyerRefundCents !== EXPECTED.buyerRefundCents) {
    await stop(`buyerRefund ${plan.buyerRefundCents} != ${EXPECTED.buyerRefundCents}`);
  }
  if (plan.totals.sellerReversalCents !== EXPECTED.sellerReversalCents) {
    await stop(
      `sellerRev ${plan.totals.sellerReversalCents} != ${EXPECTED.sellerReversalCents}`,
    );
  }
  if (plan.totals.affiliateReversalCents !== 0) await stop('affiliate != 0');
  if (plan.totals.courierReversalCents !== 0) await stop('courier != 0');

  const leg = plan.sellerLegs[0];
  if (!leg || leg.transferId !== EXPECTED.transferId) {
    await stop(`transferId ${leg?.transferId} != ${EXPECTED.transferId}`);
  }
  if (leg.transferReversalCents !== 88) {
    await stop(`leg reversal ${leg.transferReversalCents} != 88`);
  }

  console.log(
    'PREFLIGHT_OK',
    JSON.stringify({
      buyerRefundCents: plan.buyerRefundCents,
      sellerReversalCents: plan.totals.sellerReversalCents,
      transferId: leg.transferId,
      platformImpact: plan.totals.platformEconomicImpactCents,
    }),
  );

  const settlementIdem = `hc_rset_${plan.orderId}_${plan.buyerRefundIdempotencyKey}`;
  const persisted = await persistRefundPlan({
    plan,
    idempotencyKey: settlementIdem,
    createdByAdminId: 'owner_APPROVE_E1_REFUND_REVERSAL_TEST',
    reason: 'APPROVE_E1_REFUND_REVERSAL_TEST controlled live',
  });

  const result = await executeRefundSettlement({
    stripe,
    plan,
    confirmLiveMutation: true,
    persist: false,
    settlementId: persisted.id,
    reason: 'APPROVE_E1_REFUND_REVERSAL_TEST',
    createdByAdminId: 'owner_APPROVE_E1_REFUND_REVERSAL_TEST',
  });

  const transferAfter = await stripe.transfers.retrieve(EXPECTED.transferId);
  const chargeAfter = await stripe.charges.retrieve('py_3U55jB2KvmKfeN9t1Qr93icB');
  const piAfter = await stripe.paymentIntents.retrieve('pi_3U55jB2KvmKfeN9t1qgoZzLL');
  const refunds = await stripe.refunds.list({
    payment_intent: 'pi_3U55jB2KvmKfeN9t1qgoZzLL',
    limit: 10,
  });
  const reversals = await stripe.transfers.listReversals(EXPECTED.transferId, {
    limit: 10,
  });

  const settlement = await prisma.refundSettlement.findUnique({
    where: { id: result.settlementId },
  });
  const order = await prisma.order.findUnique({ where: { id: ORDER_ID } });
  const txn = await prisma.transaction.findUnique({
    where: { id: leg.transactionId },
  });
  const payout = await prisma.payout.findUnique({ where: { id: leg.payoutId } });

  const chargeAfterId =
    typeof piAfter.latest_charge === 'string'
      ? piAfter.latest_charge
      : piAfter.latest_charge?.id;

  const report = {
    approval: 'APPROVE_E1_REFUND_REVERSAL_TEST',
    settlementId: result.settlementId,
    status: result.status,
    errors: result.errors,
    stripeRefundId: result.stripeRefundId,
    sellerReversals: result.sellerReversals,
    affiliate: result.affiliate,
    courierReversal: result.courierReversal,
    verify: {
      buyer_refund_count: refunds.data.length,
      buyer_refund_amounts: refunds.data.map((r) => ({
        id: r.id,
        amount: r.amount,
        status: r.status,
      })),
      transfer_amount: transferAfter.amount,
      transfer_amount_reversed: transferAfter.amount_reversed,
      reversal_count: reversals.data.length,
      reversal_amounts: reversals.data.map((r) => ({
        id: r.id,
        amount: r.amount,
      })),
      charge_amount_refunded: chargeAfter.amount_refunded,
      charge_refunded: chargeAfter.refunded,
      pi_amount: piAfter.amount,
      pi_amount_received: piAfter.amount_received,
      pi_latest_charge: chargeAfterId,
      pi_charge_unchanged: chargeBeforeId === chargeAfterId,
      order_status: order?.status,
      transaction_status: txn?.status,
      payout_providerRef: payout?.providerRef,
      payout_amountCents: payout?.amountCents,
      refundSettlement_status: settlement?.status,
      refundSettlement_stripeRefundId: settlement?.stripeRefundId,
      refundSettlement_buyerRefundCents: settlement?.buyerRefundCents,
    },
    reconciliation: plan.reconciliation,
  };

  console.log(JSON.stringify(report, null, 2));

  const checks = {
    buyer_once_127: refunds.data.length === 1 && refunds.data[0].amount === 127,
    seller_once_88:
      reversals.data.length === 1 &&
      reversals.data[0].amount === 88 &&
      transferAfter.amount_reversed === 88,
    no_new_charge: report.verify.pi_charge_unchanged && piAfter.amount === 127,
    settlement_completed: settlement?.status === 'COMPLETED',
    no_needs_attention: result.status === 'COMPLETED' && result.errors.length === 0,
    affiliate_0: plan.totals.affiliateReversalCents === 0,
    courier_0: plan.totals.courierReversalCents === 0,
    unreconciled_0: plan.reconciliation.UNRECONCILED === 0,
  };

  console.log('CHECKS', JSON.stringify(checks, null, 2));

  const allOk = Object.values(checks).every(Boolean);
  console.log(
    allOk
      ? 'HOMECHEFF_E1_REFUND_REVERSAL_LIVE_PROVEN'
      : 'HOMECHEFF_E1_REFUND_REVERSAL_LIVE_FAILED',
  );

  await prisma.$disconnect();
  process.exit(allOk ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
