/**
 * Gecombineerde uitbetaling: verkoop + bezorging (alle rollen) in één aanvraag.
 * Eén bedrag aanvraagbaar, één Stripe-transfer naar hetzelfde Connect-account.
 */

import type { PrismaClient } from '@prisma/client';
import { getSellerRequestablePayout, MIN_PAYOUT_CENTS } from './sellerPayouts';

export type CombinedRequestableResult = {
  totalRequestableCents: number;
  sellerCents: number;
  deliveryCents: number;
  canRequestPayout: boolean;
  payoutBlockedReason?: 'no_transactions' | 'all_in_escrow' | 'already_paid_out' | 'below_minimum';
  sellerResult: Awaited<ReturnType<typeof getSellerRequestablePayout>>;
  /** Delivery Payout records with providerRef null (to update when we transfer) */
  validDeliveryPayouts: Array<{ id: string; amountCents: number }>;
};

/**
 * Berekent het totaal aanvraagbare bedrag voor een gebruiker over alle rollen (verkoper + bezorger).
 * HomeCheff-fee is al afgetrokken bij aanmaak van de Payout/Transaction.
 */
export async function getCombinedRequestablePayout(
  prisma: PrismaClient,
  userId: string,
  platformFeePercentage: number,
  matchesCurrentMode: (ref: string) => boolean
): Promise<CombinedRequestableResult> {
  const sellerResult = await getSellerRequestablePayout(
    prisma,
    userId,
    platformFeePercentage,
    matchesCurrentMode
  );

  let deliveryCents = 0;
  const validDeliveryPayouts: Array<{ id: string; amountCents: number }> = [];

  const deliveryProfile = await prisma.deliveryProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (deliveryProfile) {
    const delivered = await prisma.deliveryOrder.findMany({
      where: { deliveryProfileId: deliveryProfile.id, status: 'DELIVERED' },
      select: { orderId: true },
    });
    const deliveredOrderIds = new Set(delivered.map((d) => d.orderId));

    const deliveryPayouts = await prisma.payout.findMany({
      where: {
        toUserId: userId,
        providerRef: null,
        OR: [
          { transactionId: { contains: 'delivery' } },
          { transactionId: { contains: 'txn_delivery' } },
          { transactionId: { in: Array.from(deliveredOrderIds) } },
        ],
      },
      select: { id: true, amountCents: true },
    });

    deliveryCents = deliveryPayouts.reduce((s, p) => s + p.amountCents, 0);
    validDeliveryPayouts.push(...deliveryPayouts.map((p) => ({ id: p.id, amountCents: p.amountCents })));
  }

  const totalRequestableCents = sellerResult.requestableCents + deliveryCents;

  let canRequestPayout = totalRequestableCents >= MIN_PAYOUT_CENTS;
  let payoutBlockedReason = sellerResult.payoutBlockedReason;

  if (totalRequestableCents < MIN_PAYOUT_CENTS && totalRequestableCents > 0) {
    payoutBlockedReason = 'below_minimum';
  } else if (totalRequestableCents === 0) {
    if (deliveryCents > 0) {
      canRequestPayout = false;
      payoutBlockedReason = sellerResult.payoutBlockedReason ?? 'below_minimum';
    }
  }

  return {
    totalRequestableCents,
    sellerCents: sellerResult.requestableCents,
    deliveryCents,
    canRequestPayout,
    payoutBlockedReason,
    sellerResult,
    validDeliveryPayouts,
  };
}

export { MIN_PAYOUT_CENTS };
