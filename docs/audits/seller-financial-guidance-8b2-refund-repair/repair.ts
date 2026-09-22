/**
 * PHASE 8B.2 §13-15 — controlled repair of ONE known certification order.
 *
 * Default run is a dry run that only verifies. Pass --apply to mutate.
 *
 *   npx tsx --env-file=.env.local docs/.../repair.ts            # verify only
 *   npx tsx --env-file=.env.local docs/.../repair.ts --apply    # repair
 *
 * Safety model:
 *  - every target is addressed by its exact immutable primary key;
 *  - every expected BEFORE value is asserted, including Stripe's own numbers;
 *  - any mismatch aborts before a single write;
 *  - the whole mutation is one database transaction;
 *  - re-running after success is a NO-OP (the post-state is also a valid state);
 *  - no Stripe object is touched — Stripe is already correct.
 */
import fs from 'node:fs';
import path from 'node:path';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';

const OUT = 'docs/audits/seller-financial-guidance-8b2-refund-repair';
const APPLY = process.argv.includes('--apply');

// --- The one order, pinned by immutable identifiers -------------------------
const ORDER_ID = 'b7df063b-a305-4129-a63f-3418bb6846df';
const PRODUCT_ID = 'fcc5ff2a-651a-4983-9d17-b3f1acf7ca17';
const TRANSACTION_ID = `txn_${ORDER_ID}_${PRODUCT_ID}`;
const SELLER_USER_ID = '7647bf21-e9ab-4e3a-af83-eeec23e24dcb';

/** Mirror of the Stripe transfer reversal. Must be deleted: not a refund. */
const REVERSAL_MIRROR_REFUND_ID = `refund_trr_${PRODUCT_ID}_trr_1U57Xc2KvmKfeN9tbtOtO8Je`;
/** Buyer-scoped row. Must become the seller consideration. */
const BUYER_SCOPED_REFUND_ID = `refund_buyer_${PRODUCT_ID}_pyr_1U57Xd2KvmKfeN9t8Vgi1CuS`;

const EXPECT = {
  orderTotalAmount: 127,
  transactionAmountCents: 100,
  transactionPlatformFeeBps: 1200,
  transactionStatus: 'REFUNDED',
  reversalMirrorAmount: 88,
  buyerScopedAmountBefore: 127,
  sellerConsiderationRefund: 100,
  stripeChargeAmount: 127,
  stripeRefundTotal: 127,
  stripeTransferAmount: 88,
  stripeTransferReversalTotal: 88,
  refundSettlementReason: 'APPROVE_E1_REFUND_REVERSAL_TEST controlled live',
};

type Json = Record<string, any>;
const report: Json = {
  phase: '8B.2',
  section: '13_CONTROLLED_DATA_REPAIR',
  mode: APPLY ? 'APPLY' : 'VERIFY_ONLY',
  orderId: ORDER_ID,
  transactionId: TRANSACTION_ID,
  guards: {},
  aborted: false,
};

const problems: string[] = [];
function guard(name: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  report.guards[name] = { expected, actual, ok };
  if (!ok) problems.push(`${name}: expected ${String(expected)}, got ${String(actual)}`);
  return ok;
}

async function main() {
  // --- Database BEFORE ------------------------------------------------------
  const order = await prisma.order.findUnique({
    where: { id: ORDER_ID },
    select: { id: true, totalAmount: true, status: true },
  });
  const txn = await prisma.transaction.findUnique({
    where: { id: TRANSACTION_ID },
    select: { id: true, sellerId: true, amountCents: true, platformFeeBps: true, status: true },
  });
  const refunds = await prisma.refund.findMany({
    where: { transactionId: TRANSACTION_ID },
    orderBy: { createdAt: 'asc' },
  });
  const settlement = await prisma.refundSettlement.findFirst({
    where: { orderId: ORDER_ID },
    select: { reason: true, buyerRefundCents: true, planJson: true, stripeRefundId: true },
  });

  const plan = settlement?.planJson ? JSON.parse(settlement.planJson) : null;
  const planLeg = plan?.sellerLegs?.find((l: any) => l.productId === PRODUCT_ID) ?? null;

  report.before = {
    order,
    transaction: txn,
    refunds,
    refundTotalCents: refunds.reduce((s, r) => s + r.amountCents, 0),
    settlement: settlement
      ? {
          reason: settlement.reason,
          buyerRefundCents: settlement.buyerRefundCents,
          stripeRefundId: settlement.stripeRefundId,
          planSellerLeg: planLeg,
        }
      : null,
  };

  const mirror = refunds.find((r) => r.id === REVERSAL_MIRROR_REFUND_ID) ?? null;
  const buyerScoped = refunds.find((r) => r.id === BUYER_SCOPED_REFUND_ID) ?? null;

  // Already repaired? Then this run must be a no-op, not a second mutation.
  const alreadyRepaired =
    !mirror &&
    buyerScoped?.amountCents === EXPECT.sellerConsiderationRefund &&
    refunds.length === 1;

  if (alreadyRepaired) {
    report.alreadyRepaired = true;
    report.outcome = 'NO_OP_ALREADY_REPAIRED';
    finish();
    return;
  }

  // --- Guards ---------------------------------------------------------------
  guard('order_exists', Boolean(order), true);
  guard('order_totalAmount', order?.totalAmount, EXPECT.orderTotalAmount);
  guard('transaction_exists', Boolean(txn), true);
  guard('transaction_seller', txn?.sellerId, SELLER_USER_ID);
  guard('transaction_amountCents', txn?.amountCents, EXPECT.transactionAmountCents);
  guard('transaction_platformFeeBps', txn?.platformFeeBps, EXPECT.transactionPlatformFeeBps);
  guard('transaction_status', txn?.status, EXPECT.transactionStatus);
  guard('refund_row_count', refunds.length, 2);
  guard('reversal_mirror_present', Boolean(mirror), true);
  guard('reversal_mirror_amount', mirror?.amountCents, EXPECT.reversalMirrorAmount);
  guard('reversal_mirror_providerRef', mirror?.providerRef, 'trr_1U57Xc2KvmKfeN9tbtOtO8Je');
  guard('buyer_scoped_present', Boolean(buyerScoped), true);
  guard('buyer_scoped_amount_before', buyerScoped?.amountCents, EXPECT.buyerScopedAmountBefore);
  guard('buyer_scoped_providerRef', buyerScoped?.providerRef, 'pyr_1U57Xd2KvmKfeN9t8Vgi1CuS');
  guard('settlement_reason', settlement?.reason, EXPECT.refundSettlementReason);
  guard('settlement_buyerRefundCents', settlement?.buyerRefundCents, EXPECT.orderTotalAmount);
  guard(
    'plan_sellerConsiderationRefundCents',
    planLeg?.sellerConsiderationRefundCents,
    EXPECT.sellerConsiderationRefund,
  );
  guard('plan_transferReversalCents', planLeg?.transferReversalCents, EXPECT.stripeTransferAmount);

  // --- Stripe BEFORE (read-only) -------------------------------------------
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY missing');
  const stripe = new Stripe(key, { apiVersion: '2025-07-30.basil' as any });

  const orderSession = await prisma.order.findUnique({
    where: { id: ORDER_ID },
    select: { stripeSessionId: true },
  });
  const session = await stripe.checkout.sessions.retrieve(orderSession!.stripeSessionId!);
  const piId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  const pi = await stripe.paymentIntents.retrieve(piId!, { expand: ['latest_charge'] });
  const charge = pi.latest_charge as Stripe.Charge;
  const stripeRefunds = await stripe.refunds.list({ payment_intent: piId!, limit: 20 });
  const payout = await prisma.payout.findFirst({
    where: { transactionId: TRANSACTION_ID },
    select: { providerRef: true, amountCents: true },
  });
  const transfer = await stripe.transfers.retrieve(payout!.providerRef!);
  const reversals = await stripe.transfers.listReversals(payout!.providerRef!, { limit: 20 });

  guard('stripe_charge_amount', charge.amount, EXPECT.stripeChargeAmount);
  guard(
    'stripe_refund_total',
    stripeRefunds.data.reduce((s, r) => s + r.amount, 0),
    EXPECT.stripeRefundTotal,
  );
  guard('stripe_transfer_amount', transfer.amount, EXPECT.stripeTransferAmount);
  guard(
    'stripe_transfer_reversal_total',
    reversals.data.reduce((s, r) => s + r.amount, 0),
    EXPECT.stripeTransferReversalTotal,
  );

  report.stripeBefore = {
    chargeId: charge.id,
    chargeAmount: charge.amount,
    refundIds: stripeRefunds.data.map((r) => r.id),
    transferId: transfer.id,
    transferAmount: transfer.amount,
    reversalIds: reversals.data.map((r) => r.id),
  };

  if (problems.length > 0) {
    report.aborted = true;
    report.outcome = 'ABORTED_STATE_MISMATCH';
    report.problems = problems;
    finish();
    process.exitCode = 1;
    return;
  }

  if (!APPLY) {
    report.outcome = 'VERIFY_ONLY_ALL_GUARDS_PASS';
    report.wouldDo = [
      `DELETE Refund id=${REVERSAL_MIRROR_REFUND_ID} (88c transfer-reversal mirror)`,
      `UPDATE Refund id=${BUYER_SCOPED_REFUND_ID} amountCents 127 -> 100`,
    ];
    finish();
    return;
  }

  // --- Mutation -------------------------------------------------------------
  await prisma.$transaction(async (tx) => {
    const deleted = await tx.refund.deleteMany({
      where: { id: REVERSAL_MIRROR_REFUND_ID, amountCents: EXPECT.reversalMirrorAmount },
    });
    if (deleted.count !== 1) {
      throw new Error(`expected to delete exactly 1 mirror row, deleted ${deleted.count}`);
    }

    const updated = await tx.refund.updateMany({
      where: { id: BUYER_SCOPED_REFUND_ID, amountCents: EXPECT.buyerScopedAmountBefore },
      data: { amountCents: EXPECT.sellerConsiderationRefund },
    });
    if (updated.count !== 1) {
      throw new Error(`expected to update exactly 1 row, updated ${updated.count}`);
    }
  });

  // --- Read back ------------------------------------------------------------
  const after = await prisma.refund.findMany({
    where: { transactionId: TRANSACTION_ID },
    orderBy: { createdAt: 'asc' },
  });
  const txnAfter = await prisma.transaction.findUnique({
    where: { id: TRANSACTION_ID },
    select: { amountCents: true, platformFeeBps: true, status: true },
  });
  const payoutAfter = await prisma.payout.findFirst({
    where: { transactionId: TRANSACTION_ID },
    select: { amountCents: true, providerRef: true },
  });
  const settlementAfter = await prisma.refundSettlement.findFirst({
    where: { orderId: ORDER_ID },
    select: { buyerRefundCents: true, stripeRefundId: true },
  });

  report.after = {
    refunds: after,
    refundTotalCents: after.reduce((s, r) => s + r.amountCents, 0),
    transaction: txnAfter,
    payout: payoutAfter,
    settlement: settlementAfter,
  };

  report.outcome =
    after.length === 1 && after[0].amountCents === EXPECT.sellerConsiderationRefund
      ? 'REPAIRED'
      : 'UNEXPECTED_POST_STATE';

  // Evidence for the other two parties must survive the repair.
  report.evidencePreserved = {
    buyerRefundStillAuthoritative:
      settlementAfter?.buyerRefundCents === 127 &&
      settlementAfter?.stripeRefundId === 'pyr_1U57Xd2KvmKfeN9t8Vgi1CuS',
    transferReversalStillAuthoritative:
      payoutAfter?.providerRef === 'tr_3U55jB2KvmKfeN9t1L9OEvJn' &&
      payoutAfter?.amountCents === 88,
  };

  finish();
}

function finish() {
  fs.mkdirSync(OUT, { recursive: true });
  const name = APPLY ? 'repair-apply.json' : 'repair-verify.json';
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
