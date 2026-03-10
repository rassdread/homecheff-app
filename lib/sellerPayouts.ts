/**
 * Gedeelde logica voor verkoper-uitbetalingen.
 * Eén bron van waarheid: wat officieel "aanvraagbaar" is, komt hier vandaan.
 * Voorkomt mismatch tussen UI ("je kunt X aanvragen") en API ("geen transacties beschikbaar").
 */

import type { PrismaClient } from '@prisma/client';

const MIN_PAYOUT_CENTS = 1000;

export type SellerRequestableResult = {
  requestableCents: number;
  canRequestPayout: boolean;
  /** Korte reden waarom uitbetaling (nog) niet mogelijk is, voor in de UI */
  payoutBlockedReason?: 'no_transactions' | 'all_in_escrow' | 'already_paid_out' | 'below_minimum';
  validTransactions: Array<{
    id: string;
    amountCents: number;
    platformFeeBps: number | null;
    providerRef: string | null;
    /** Net amount for this transaction (after fee; uses existing Payout.amountCents if set, so SMS deduction is included) */
    netAmountCents: number;
    Payout: Array<{ id: string; providerRef: string | null; amountCents: number }>;
  }>;
};

/**
 * Berekent het officieel aanvraagbare uitbetalingsbedrag voor een verkoper.
 * Gebruikt transacties (CAPTURED, geen actieve escrow, Stripe-mode).
 * Zelfde logica als POST /api/seller/payouts/request.
 */
export async function getSellerRequestablePayout(
  prisma: PrismaClient,
  userId: string,
  platformFeePercentage: number,
  matchesCurrentMode: (ref: string) => boolean
): Promise<SellerRequestableResult> {
  const allTransactions = await prisma.transaction.findMany({
    where: {
      sellerId: userId,
      status: 'CAPTURED',
      OR: [
        { Payout: { none: {} } },
        { Payout: { some: { providerRef: null } } },
      ],
    },
    select: {
      id: true,
      amountCents: true,
      platformFeeBps: true,
      providerRef: true,
      Payout: { select: { id: true, providerRef: true, amountCents: true } },
    },
    take: 1000,
  });

  const providerRefs = allTransactions
    .map((tx) => tx.providerRef)
    .filter((ref): ref is string => ref !== null && matchesCurrentMode(ref));

  const ordersWithEscrows =
    providerRefs.length > 0
      ? await prisma.order.findMany({
          where: { stripeSessionId: { in: providerRefs } },
          select: {
            stripeSessionId: true,
            paymentEscrow: {
              where: { currentStatus: 'held' },
              select: { currentStatus: true },
            },
          },
        })
      : [];

  const escrowMap = new Map<string, boolean>();
  ordersWithEscrows.forEach((order) => {
    if (order.stripeSessionId) {
      escrowMap.set(order.stripeSessionId, order.paymentEscrow.length > 0);
    }
  });

  const validTransactions = allTransactions.filter((tx) => {
    if (!tx.providerRef || !matchesCurrentMode(tx.providerRef)) return false;
    if (escrowMap.get(tx.providerRef)) return false;
    const hasPayout = tx.Payout && tx.Payout.length > 0;
    if (hasPayout && !tx.Payout.every((p) => p.providerRef === null)) return false;
    return true;
  });

  const platformFeeBps = platformFeePercentage * 100;
  const validWithNet = validTransactions.map((tx) => {
    const existingPayout = tx.Payout?.find((p) => p.providerRef === null);
    const bps = tx.platformFeeBps ?? platformFeeBps;
    const fee = Math.round((tx.amountCents * bps) / 10000);
    const netAmountCents = existingPayout != null ? existingPayout.amountCents : tx.amountCents - fee;
    return { ...tx, netAmountCents };
  });
  const requestableCents = validWithNet.reduce((sum, tx) => sum + tx.netAmountCents, 0);

  let payoutBlockedReason: SellerRequestableResult['payoutBlockedReason'] | undefined;
  if (requestableCents < MIN_PAYOUT_CENTS) {
    if (requestableCents > 0) payoutBlockedReason = 'below_minimum';
    else if (allTransactions.length === 0) payoutBlockedReason = 'no_transactions';
    else if (validTransactions.length === 0) {
      const withEscrow = allTransactions.filter((tx) => tx.providerRef && escrowMap.get(tx.providerRef)).length;
      const alreadyPaid = allTransactions.filter((tx) => {
        const hasPayout = tx.Payout && tx.Payout.length > 0;
        return hasPayout && !tx.Payout.every((p) => p.providerRef === null);
      }).length;
      if (withEscrow >= allTransactions.length) payoutBlockedReason = 'all_in_escrow';
      else if (alreadyPaid >= allTransactions.length) payoutBlockedReason = 'already_paid_out';
      else payoutBlockedReason = 'no_transactions';
    }
  }

  return {
    requestableCents,
    canRequestPayout: requestableCents >= MIN_PAYOUT_CENTS,
    payoutBlockedReason,
    validTransactions: validWithNet.map((t) => ({
      id: t.id,
      amountCents: t.amountCents,
      platformFeeBps: t.platformFeeBps,
      providerRef: t.providerRef,
      netAmountCents: t.netAmountCents,
      Payout: t.Payout,
    })),
  };
}

export { MIN_PAYOUT_CENTS };
