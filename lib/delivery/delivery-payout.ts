import type { PrismaClient } from '@prisma/client';
import {
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';

export type DeliveryPayoutInput = {
  deliveryOrderId: string;
  orderId: string;
  deliveryFeeCents: number;
  delivererUserId: string;
  buyerUserId: string;
};

export type DeliveryPayoutResult = {
  created: boolean;
  payoutId: string;
  amountCents: number;
};

/**
 * Idempotent delivery payout: Transaction (txn_delivery_*) → Payout → earnings update.
 * Used when a DeliveryOrder reaches DELIVERED (primary path).
 */
export async function ensureDeliveryPayout(
  prisma: PrismaClient,
  input: DeliveryPayoutInput
): Promise<DeliveryPayoutResult> {
  const { deliveryOrderId, orderId, deliveryFeeCents, delivererUserId, buyerUserId } =
    input;

  const deliveryPersonCut = Math.round(
    deliveryFeeCents * (DELIVERY_DELIVERER_PERCENT / 100)
  );

  const stableTxnId = `txn_delivery_${deliveryOrderId}`;
  const stablePayoutId = `payout_delivery_${deliveryOrderId}`;

  const existingPayout = await prisma.payout.findFirst({
    where: {
      toUserId: delivererUserId,
      OR: [
        { id: stablePayoutId },
        { id: { startsWith: `payout_delivery_${deliveryOrderId}_` } },
        { transactionId: stableTxnId },
        { transactionId: { startsWith: `txn_delivery_${deliveryOrderId}_` } },
        // Legacy broken path (orderId used as transactionId)
        { transactionId: orderId, toUserId: delivererUserId },
      ],
    },
    select: { id: true, amountCents: true },
  });

  if (existingPayout) {
    return {
      created: false,
      payoutId: existingPayout.id,
      amountCents: existingPayout.amountCents,
    };
  }

  await prisma.$transaction(async (tx) => {
    let transaction = await tx.transaction.findUnique({
      where: { id: stableTxnId },
    });

    if (!transaction) {
      const legacyTxn = await tx.transaction.findFirst({
        where: { id: { startsWith: `txn_delivery_${deliveryOrderId}_` } },
      });
      transaction =
        legacyTxn ??
        (await tx.transaction.create({
          data: {
            id: stableTxnId,
            buyerId: buyerUserId,
            sellerId: delivererUserId,
            amountCents: Math.round(deliveryFeeCents),
            platformFeeBps: DELIVERY_PLATFORM_FEE_PERCENT * 100,
            status: 'CAPTURED',
            provider: 'STRIPE',
            providerRef: orderId,
            updatedAt: new Date(),
          },
        }));
    }

    await tx.payout.create({
      data: {
        id: stablePayoutId,
        transactionId: transaction.id,
        toUserId: delivererUserId,
        amountCents: deliveryPersonCut,
        providerRef: null,
      },
    });

    await tx.deliveryProfile.updateMany({
      where: { userId: delivererUserId },
      data: {
        totalEarnings: { increment: deliveryPersonCut },
      },
    });
  });

  return {
    created: true,
    payoutId: stablePayoutId,
    amountCents: deliveryPersonCut,
  };
}
