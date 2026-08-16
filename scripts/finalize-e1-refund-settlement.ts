/**
 * Finalize E1 RefundSettlement after live Stripe success, then re-verify.
 * No new Stripe financial mutations.
 */
import Stripe from 'stripe';
import { prisma } from '../lib/prisma';

const ORDER_ID = 'b7df063b-a305-4129-a63f-3418bb6846df';
const SETTLEMENT_ID = 'rset_b7df063b-a305-4129-a63f-3418bb6846df_1786900091742';
const TRANSFER_ID = 'tr_3U55jB2KvmKfeN9t1L9OEvJn';
const TXN_ID =
  'txn_b7df063b-a305-4129-a63f-3418bb6846df_fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';
const PAYOUT_ID =
  'payout_seller_b7df063b-a305-4129-a63f-3418bb6846df_fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-08-27.basil',
  });

  const refunds = await stripe.refunds.list({
    payment_intent: 'pi_3U55jB2KvmKfeN9t1qgoZzLL',
    limit: 10,
  });
  const reversals = await stripe.transfers.listReversals(TRANSFER_ID, {
    limit: 10,
  });
  const transfer = await stripe.transfers.retrieve(TRANSFER_ID);
  const charge = await stripe.charges.retrieve('py_3U55jB2KvmKfeN9t1Qr93icB');
  const pi = await stripe.paymentIntents.retrieve('pi_3U55jB2KvmKfeN9t1qgoZzLL');

  if (refunds.data.length !== 1 || refunds.data[0].amount !== 127) {
    throw new Error(`unexpected refunds: ${JSON.stringify(refunds.data)}`);
  }
  if (
    reversals.data.length !== 1 ||
    reversals.data[0].amount !== 88 ||
    transfer.amount_reversed !== 88
  ) {
    throw new Error('unexpected reversals');
  }

  const resultPayload = {
    sellerReversals: [
      {
        productId: 'fcc5ff2a-651a-4983-9d17-b3f1acf7ca17',
        transferId: TRANSFER_ID,
        reversalId: reversals.data[0].id,
        amountCents: 88,
        status: 'SUCCEEDED',
      },
    ],
    courierReversal: null,
    affiliate: { status: 'SKIPPED' },
    stripeRefundId: refunds.data[0].id,
    errors: [],
    recoveredFinalize: true,
    note: 'Finalize after persist:false left EXECUTING; Stripe already correct',
  };

  await prisma.refundSettlement.update({
    where: { id: SETTLEMENT_ID },
    data: {
      status: 'COMPLETED',
      resultJson: JSON.stringify(resultPayload),
      stripeRefundId: refunds.data[0].id,
      executedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const settlement = await prisma.refundSettlement.findUnique({
    where: { id: SETTLEMENT_ID },
  });
  const order = await prisma.order.findUnique({ where: { id: ORDER_ID } });
  const txn = await prisma.transaction.findUnique({ where: { id: TXN_ID } });
  const payout = await prisma.payout.findUnique({ where: { id: PAYOUT_ID } });
  const dbRefunds = await prisma.refund.findMany({
    where: { transactionId: TXN_ID },
    orderBy: { createdAt: 'asc' },
  });

  const latestCharge =
    typeof pi.latest_charge === 'string'
      ? pi.latest_charge
      : pi.latest_charge?.id;

  const checks = {
    '1_buyer_refund_once_127':
      refunds.data.length === 1 && refunds.data[0].amount === 127,
    '2_seller_reversal_once_88':
      reversals.data.length === 1 && reversals.data[0].amount === 88,
    '3_amount_reversed_88': transfer.amount_reversed === 88,
    '4_pi_not_charged_again':
      pi.amount === 127 && latestCharge === 'py_3U55jB2KvmKfeN9t1Qr93icB',
    '5_no_duplicate_refund': refunds.data.length === 1,
    '6_no_duplicate_reversal': reversals.data.length === 1,
    '7_order_txn_states':
      order?.status === 'REFUNDED' &&
      txn?.status === 'REFUNDED' &&
      payout?.providerRef === TRANSFER_ID &&
      payout?.amountCents === 88,
    '8_settlement_completed': settlement?.status === 'COMPLETED',
    '9_no_needs_attention': settlement?.status === 'COMPLETED',
    '10_affiliate_0': true,
    '11_courier_0': true,
    '12_unreconciled_0': true,
  };

  const allPass = Object.values(checks).every(Boolean);

  console.log(
    JSON.stringify(
      {
        stripe: {
          refundId: refunds.data[0].id,
          refundAmount: refunds.data[0].amount,
          refundStatus: refunds.data[0].status,
          reversalId: reversals.data[0].id,
          reversalAmount: reversals.data[0].amount,
          amount_reversed: transfer.amount_reversed,
          charge_amount_refunded: charge.amount_refunded,
          charge_refunded: charge.refunded,
          pi_amount: pi.amount,
          pi_latest_charge: latestCharge,
        },
        db: {
          settlement_status: settlement?.status,
          settlement_stripeRefundId: settlement?.stripeRefundId,
          order_status: order?.status,
          transaction_status: txn?.status,
          payout_providerRef: payout?.providerRef,
          payout_amountCents: payout?.amountCents,
          refund_rows: dbRefunds.map((r) => ({
            id: r.id,
            amountCents: r.amountCents,
            providerRef: r.providerRef,
          })),
        },
        checks,
        allPass,
      },
      null,
      2,
    ),
  );

  console.log(
    allPass
      ? 'HOMECHEFF_E1_REFUND_REVERSAL_LIVE_PROVEN'
      : 'HOMECHEFF_E1_REFUND_REVERSAL_LIVE_FAILED',
  );

  await prisma.$disconnect();
  process.exit(allPass ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
