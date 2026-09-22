/**
 * PHASE 8B.1 — Stripe reconciliation for the REFUND_EXCEEDS_SALE leg. READ ONLY.
 *
 * Only retrieve/list calls are made. No create, update, cancel or reversal.
 *
 *   npx tsx --env-file=.env.local docs/audits/seller-financial-guidance-8b1-refund/stripe-reconcile.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';

const OUT = 'docs/audits/seller-financial-guidance-8b1-refund';
const ORDER_ID = 'b7df063b-a305-4129-a63f-3418bb6846df';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error('STRIPE_SECRET_KEY missing');
const stripe = new Stripe(key, { apiVersion: '2025-07-30.basil' as any });

type Json = Record<string, any>;

async function main() {
  const out: Json = { readOnly: true, stripeMutations: 0 };

  const order = await prisma.order.findUnique({
    where: { id: ORDER_ID },
    select: { stripeSessionId: true, totalAmount: true, status: true },
  });
  if (!order?.stripeSessionId) throw new Error('order/session not found');

  // The settlement engine's own plan — this is where component allocation lives.
  const settlements = await prisma.refundSettlement.findMany({
    where: { orderId: ORDER_ID },
    select: {
      id: true,
      status: true,
      mode: true,
      buyerRefundCents: true,
      planJson: true,
      resultJson: true,
      stripeRefundId: true,
      reason: true,
      createdAt: true,
      executedAt: true,
    },
  });

  out.refundSettlements = settlements.map((s) => {
    let plan: Json | null = null;
    let result: Json | null = null;
    try {
      plan = JSON.parse(s.planJson);
    } catch {
      /* keep null */
    }
    try {
      result = s.resultJson ? JSON.parse(s.resultJson) : null;
    } catch {
      /* keep null */
    }
    return {
      status: s.status,
      mode: s.mode,
      reason: s.reason,
      buyerRefundCents: s.buyerRefundCents,
      createdAt: s.createdAt.toISOString(),
      executedAt: s.executedAt?.toISOString() ?? null,
      planSummary: plan
        ? {
            originalBuyerGrossCents: plan.originalBuyerGrossCents,
            originalBuyerSurchargeCents: plan.originalBuyerSurchargeCents,
            priorBuyerRefundedCents: plan.priorBuyerRefundedCents,
            buyerRefundCents: plan.buyerRefundCents,
            stripeFeeRefundTreatment: plan.stripeFeeRefundTreatment,
            sellerLegs: plan.sellerLegs,
            courierLeg: plan.courierLeg,
            affiliateLeg: plan.affiliateLeg,
            reconciliation: plan.reconciliation,
            platformEconomicImpactCents: plan.platformEconomicImpactCents,
            warnings: plan.warnings,
            policyFlags: plan.policyFlags,
          }
        : null,
      resultSummary: result,
    };
  });

  // --- Stripe, read-only ------------------------------------------------------
  const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
  const piId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;

  const pi = piId
    ? await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] })
    : null;
  const charge = (pi?.latest_charge ?? null) as Stripe.Charge | null;

  const refunds = piId ? await stripe.refunds.list({ payment_intent: piId, limit: 20 }) : null;

  const balanceTxn =
    charge && typeof charge.balance_transaction === 'string'
      ? await stripe.balanceTransactions.retrieve(charge.balance_transaction)
      : null;

  // Transfer + reversals from the stored payout reference.
  const payout = await prisma.payout.findFirst({
    where: { transactionId: `txn_${ORDER_ID}_%`.replace('%', '') },
    select: { providerRef: true, amountCents: true },
  });
  const payoutRow =
    payout ??
    (await prisma.payout.findFirst({
      where: { transactionId: { startsWith: `txn_${ORDER_ID}` } },
      select: { providerRef: true, amountCents: true },
    }));

  let transfer: Stripe.Transfer | null = null;
  let reversals: Stripe.ApiList<Stripe.TransferReversal> | null = null;
  if (payoutRow?.providerRef?.startsWith('tr_')) {
    transfer = await stripe.transfers.retrieve(payoutRow.providerRef);
    reversals = await stripe.transfers.listReversals(payoutRow.providerRef, { limit: 20 });
  }

  out.stripe = {
    session: {
      id: session.id,
      amountTotal: session.amount_total,
      amountSubtotal: session.amount_subtotal,
      currency: session.currency,
      paymentStatus: session.payment_status,
      totalDetails: session.total_details,
      metadataKeys: Object.keys(session.metadata ?? {}),
    },
    paymentIntent: pi
      ? {
          id: pi.id,
          amount: pi.amount,
          amountReceived: pi.amount_received,
          currency: pi.currency,
          status: pi.status,
        }
      : null,
    charge: charge
      ? {
          id: charge.id,
          amount: charge.amount,
          amountRefunded: charge.amount_refunded,
          refunded: charge.refunded,
          currency: charge.currency,
          applicationFeeAmount: charge.application_fee_amount,
          transferGroup: charge.transfer_group,
          onBehalfOf: charge.on_behalf_of,
          sourceTransfer: charge.source_transfer,
        }
      : null,
    balanceTransaction: balanceTxn
      ? {
          id: balanceTxn.id,
          amount: balanceTxn.amount,
          fee: balanceTxn.fee,
          net: balanceTxn.net,
          feeDetails: balanceTxn.fee_details,
        }
      : null,
    refunds:
      refunds?.data.map((r) => ({
        id: r.id,
        amount: r.amount,
        currency: r.currency,
        status: r.status,
        reason: r.reason,
        created: new Date(r.created * 1000).toISOString(),
        metadata: r.metadata,
      })) ?? null,
    transfer: transfer
      ? {
          id: transfer.id,
          amount: transfer.amount,
          amountReversed: transfer.amount_reversed,
          reversed: transfer.reversed,
          currency: transfer.currency,
          destinationPresent: Boolean(transfer.destination),
          transferGroup: transfer.transfer_group,
        }
      : null,
    transferReversals:
      reversals?.data.map((r) => ({
        id: r.id,
        amount: r.amount,
        currency: r.currency,
        created: new Date(r.created * 1000).toISOString(),
        metadata: r.metadata,
      })) ?? null,
  };

  // --- Arithmetic proof -------------------------------------------------------
  const buyerTotal = order.totalAmount;
  const itemSubtotal = 100;
  const stripeRefundTotal = (refunds?.data ?? []).reduce((s, r) => s + r.amount, 0);
  const reversalTotal = (reversals?.data ?? []).reduce((s, r) => s + r.amount, 0);

  out.arithmetic = {
    orderTotalAmountCents: buyerTotal,
    itemSubtotalCents: itemSubtotal,
    buyerSideResidualCents: buyerTotal - itemSubtotal,
    stripeChargeAmount: charge?.amount ?? null,
    stripeRefundTotal,
    stripeTransferAmount: transfer?.amount ?? null,
    stripeTransferReversalTotal: reversalTotal,
    dbRefundRowsSumCents: 215,
    dbRefundRowsSumEqualsBuyerPlusReversal: 215 === stripeRefundTotal + reversalTotal,
    expectedSellerConsiderationRefundCents: itemSubtotal,
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'stripe-reconcile.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
