/**
 * PHASE 8B.1 — forensic reconstruction of REFUND_EXCEEDS_SALE. READ ONLY.
 *
 * Performs no writes of any kind. Every Prisma call is findMany/findUnique/count
 * and every Stripe call is a retrieve/list.
 *
 *   npx tsx --env-file=.env.local docs/audits/seller-financial-guidance-8b1-refund/forensic.ts
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../../../lib/prisma';

const OUT = 'docs/audits/seller-financial-guidance-8b1-refund';

function mask(id: string | null | undefined) {
  if (!id) return null;
  return `${id.slice(0, 8)}…#${createHash('sha256').update(id).digest('hex').slice(0, 8)}`;
}

type Json = Record<string, any>;
const out: Json = { readOnly: true, writes: 0 };

async function main() {
  // ---------------------------------------------------------------------------
  // §8 first: find every case in the whole dataset, then zoom in on ours.
  // ---------------------------------------------------------------------------
  const allTxns = await prisma.transaction.findMany({
    select: {
      id: true,
      sellerId: true,
      buyerId: true,
      amountCents: true,
      platformFeeBps: true,
      status: true,
      provider: true,
      providerRef: true,
      createdAt: true,
      reservationId: true,
      Refund: {
        select: { id: true, amountCents: true, createdAt: true, providerRef: true },
        orderBy: { createdAt: 'asc' },
      },
      Payout: {
        select: {
          id: true,
          amountCents: true,
          providerRef: true,
          createdAt: true,
          destinationConnectAccountId: true,
        },
      },
    },
  });

  const offenders = allTxns.filter((t) => {
    const r = t.Refund.reduce((s, x) => s + x.amountCents, 0);
    return r > t.amountCents;
  });

  out.systemic = {
    totalTransactionsScanned: allTxns.length,
    totalRefundExceedsSaleCases: offenders.length,
    yearsAffected: [...new Set(offenders.map((t) => t.createdAt.getUTCFullYear()))].sort(),
    sellersAffected: [...new Set(offenders.map((t) => t.sellerId))].length,
    totalExcessCents: offenders.reduce(
      (s, t) => s + (t.Refund.reduce((a, x) => a + x.amountCents, 0) - t.amountCents),
      0,
    ),
    cases: offenders.map((t) => ({
      transaction: mask(t.id),
      transactionIdShape: t.id.replace(/[0-9a-f-]{36}/gi, '<uuid>'),
      sellerConsiderationCents: t.amountCents,
      refundTotalCents: t.Refund.reduce((s, x) => s + x.amountCents, 0),
      refundRows: t.Refund.length,
      status: t.status,
      year: t.createdAt.getUTCFullYear(),
    })),
  };

  // Also: refunds that fit the leg but exceed it once fees are considered, and
  // any transaction whose refunds are non-zero at all (context for rarity).
  out.refundPopulation = {
    transactionsWithAnyRefund: allTxns.filter((t) => t.Refund.length > 0).length,
    refundRowsTotal: allTxns.reduce((s, t) => s + t.Refund.length, 0),
  };

  if (offenders.length === 0) {
    fs.writeFileSync(path.join(OUT, 'forensic.json'), JSON.stringify(out, null, 2));
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  // ---------------------------------------------------------------------------
  // §1 — full reconstruction of each offending leg.
  // ---------------------------------------------------------------------------
  const details: Json[] = [];

  for (const t of offenders) {
    // Settlement ids are txn_{orderId}_{productId}.
    const m = t.id.match(/^txn_([0-9a-f-]{36})_([0-9a-f-]{36})$/i);
    const orderId = m?.[1] ?? null;
    const productId = m?.[2] ?? null;

    const order = orderId
      ? await prisma.order.findUnique({
          where: { id: orderId },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            deliveryMode: true,
            paymentMethod: true,
            createdAt: true,
            updatedAt: true,
            stripeSessionId: true,
            platformFeeCollected: true,
            paymentHeld: true,
            payoutScheduled: true,
            payoutTrigger: true,
            shippingCostCents: true,
            shippingLabelCostCents: true,
            shippingQuotedCents: true,
            shippingBuyerChargedCents: true,
            shippingActualCostCents: true,
            shippingCurrency: true,
            shippingCarrier: true,
            shippingMethod: true,
            shippingStatus: true,
            shippingQuoteSnapshot: true,
            hcFeeSnapshot: true,
            hcCapturedHc: true,
            hcPaymentPhase: true,
            deliveredAt: true,
            shippedAt: true,
            items: {
              select: {
                id: true,
                productId: true,
                quantity: true,
                priceCents: true,
                Product: {
                  select: {
                    id: true,
                    title: true,
                    priceCents: true,
                    category: true,
                    delivery: true,
                    sellerId: true,
                    seller: { select: { id: true, userId: true } },
                  },
                },
              },
            },
            deliveryOrder: {
              select: {
                id: true,
                status: true,
                deliveryFee: true,
                createdAt: true,
              },
            },
            paymentEscrow: {
              select: {
                id: true,
                currentStatus: true,
                amountCents: true,
                payoutTrigger: true,
                createdAt: true,
                paidOutAt: true,
              },
            },
            hcSettlementExposures: {
              select: {
                id: true,
                status: true,
                sellerGrossEntitlementCents: true,
                theoreticalPlatformFeeCents: true,
                grossOrderCents: true,
              },
            },
            shippingLabels: {
              select: { id: true, status: true, priceCents: true, carrier: true },
            },
          },
        })
      : null;

    // Every transaction written for the same order (siblings on other products,
    // plus any delivery leg) — this is where a buyer-level refund would show up.
    const siblings = orderId
      ? allTxns.filter((x) => x.id.includes(orderId) && x.id !== t.id)
      : [];

    details.push({
      transaction: {
        id: mask(t.id),
        idShape: t.id.replace(/[0-9a-f-]{36}/gi, '<uuid>'),
        orderId: mask(orderId),
        productId: mask(productId),
        seller: mask(t.sellerId),
        buyer: mask(t.buyerId),
        amountCents: t.amountCents,
        platformFeeBps: t.platformFeeBps,
        platformFeeCents: Math.round((t.amountCents * t.platformFeeBps) / 10_000),
        status: t.status,
        provider: t.provider,
        providerRefShape: t.providerRef ? `${t.providerRef.split('_')[0]}_…` : null,
        providerRef: t.providerRef,
        createdAt: t.createdAt.toISOString(),
        reservationId: t.reservationId,
        payouts: t.Payout.map((p) => ({
          amountCents: p.amountCents,
          createdAt: p.createdAt.toISOString(),
          destination: mask(p.destinationConnectAccountId),
          providerRef: p.providerRef,
        })),
      },
      refunds: t.Refund.map((r) => ({
        id: mask(r.id),
        idShape: r.id.replace(/[0-9a-f-]{36}/gi, '<uuid>'),
        amountCents: r.amountCents,
        createdAt: r.createdAt.toISOString(),
        providerRef: r.providerRef,
        providerRefShape: r.providerRef ? `${r.providerRef.split('_')[0]}_…` : null,
      })),
      refundTotalCents: t.Refund.reduce((s, x) => s + x.amountCents, 0),
      order: order
        ? {
            id: mask(order.id),
            status: order.status,
            totalAmount: order.totalAmount,
            deliveryMode: order.deliveryMode,
            paymentMethod: order.paymentMethod,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            stripeSessionIdShape: order.stripeSessionId
              ? `${order.stripeSessionId.split('_').slice(0, 2).join('_')}_…`
              : null,
            stripeSessionId: order.stripeSessionId,
            platformFeeCollected: order.platformFeeCollected,
            paymentHeld: order.paymentHeld,
            payoutScheduled: order.payoutScheduled,
            payoutTrigger: order.payoutTrigger,
            shipping: {
              shippingCostCents: order.shippingCostCents,
              shippingLabelCostCents: order.shippingLabelCostCents,
              shippingQuotedCents: order.shippingQuotedCents,
              shippingBuyerChargedCents: order.shippingBuyerChargedCents,
              shippingActualCostCents: order.shippingActualCostCents,
              currency: order.shippingCurrency,
              carrier: order.shippingCarrier,
              method: order.shippingMethod,
              status: order.shippingStatus,
              quoteSnapshot: order.shippingQuoteSnapshot,
              labels: order.shippingLabels,
            },
            hc: {
              feeSnapshot: order.hcFeeSnapshot,
              capturedHc: order.hcCapturedHc,
              paymentPhase: order.hcPaymentPhase,
              exposures: order.hcSettlementExposures,
            },
            deliveryOrder: order.deliveryOrder,
            escrow: order.paymentEscrow,
            items: order.items.map((i) => ({
              id: mask(i.id),
              productId: mask(i.productId),
              quantity: i.quantity,
              priceCents: i.priceCents,
              lineTotalCents: i.priceCents * i.quantity,
              productTitle: i.Product?.title ?? null,
              productPriceCents: i.Product?.priceCents ?? null,
              productCategory: i.Product?.category ?? null,
              productDelivery: i.Product?.delivery ?? null,
              productSellerUser: mask(i.Product?.seller?.userId),
              isTheLegUnderAudit: i.productId === productId,
            })),
            itemSubtotalCents: order.items.reduce(
              (s, i) => s + i.priceCents * i.quantity,
              0,
            ),
          }
        : null,
      siblingTransactionsOnSameOrder: siblings.map((s) => ({
        idShape: s.id.replace(/[0-9a-f-]{36}/gi, '<uuid>'),
        seller: mask(s.sellerId),
        amountCents: s.amountCents,
        status: s.status,
        refundTotalCents: s.Refund.reduce((a, x) => a + x.amountCents, 0),
      })),
    });
  }

  out.details = details;

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'forensic.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
