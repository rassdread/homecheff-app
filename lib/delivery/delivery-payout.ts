import type { PrismaClient } from '@prisma/client';
import {
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';
import { assertCommercialCourierCanReceivePayout } from '@/lib/delivery/delivery-eligibility';
import {
  resolveLockedDeliveryGrossCents,
  splitDeliveryCommission,
} from '@/lib/delivery/quote-snapshot';
import { readHcDeliveryRefundMarker } from '@/lib/hc/marketplace-hc-delivery-refund-pure';

export type DeliveryPayoutInput = {
  deliveryOrderId: string;
  orderId: string;
  /** @deprecated Prefer loading quotedFeeCents from DeliveryOrder. Kept for call-site compat. */
  deliveryFeeCents?: number;
  delivererUserId: string;
  buyerUserId: string;
};

export type DeliveryPayoutResult = {
  created: boolean;
  payoutId: string;
  amountCents: number;
  grossFeeCents?: number;
  amountSource?: 'quotedFeeCents' | 'deliveryFee_legacy' | 'input_override';
  blocked?: boolean;
  blockCode?: string;
};

/**
 * Idempotent delivery payout: Transaction (txn_delivery_*) → Payout → earnings update.
 * Phase 2.2: gross locked fee from quotedFeeCents (preferred) or legacy deliveryFee.
 * Never re-reads current DeliveryProfile pricing rates.
 */
export async function ensureDeliveryPayout(
  prisma: PrismaClient,
  input: DeliveryPayoutInput
): Promise<DeliveryPayoutResult> {
  const { deliveryOrderId, orderId, delivererUserId, buyerUserId } = input;

  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId: delivererUserId },
    include: { user: { select: { dateOfBirth: true, id: true } } },
  });

  const payoutGate = assertCommercialCourierCanReceivePayout({
    profile,
    dateOfBirth: profile?.user?.dateOfBirth,
  });
  if (!payoutGate.ok) {
    return {
      created: false,
      payoutId: `payout_delivery_${deliveryOrderId}`,
      amountCents: 0,
      blocked: true,
      blockCode: payoutGate.code,
    };
  }

  const deliveryOrder = await prisma.deliveryOrder.findUnique({
    where: { id: deliveryOrderId },
    select: {
      quotedFeeCents: true,
      deliveryFee: true,
      status: true,
      notes: true,
    },
  });

  // Block automatic payout after HC/full refund reversal marker or cancel.
  if (deliveryOrder) {
    const refundMarker = readHcDeliveryRefundMarker(deliveryOrder.notes);
    if (deliveryOrder.status === 'CANCELLED' || refundMarker) {
      return {
        created: false,
        payoutId: `payout_delivery_${deliveryOrderId}`,
        amountCents: 0,
        blocked: true,
        blockCode: 'HC_DELIVERY_REFUNDED',
      };
    }
  }

  let grossFeeCents: number;
  let amountSource: DeliveryPayoutResult['amountSource'];

  if (deliveryOrder) {
    const resolved = resolveLockedDeliveryGrossCents(deliveryOrder);
    grossFeeCents = resolved.grossFeeCents;
    amountSource = resolved.amountSource;
  } else if (
    typeof input.deliveryFeeCents === 'number' &&
    Number.isFinite(input.deliveryFeeCents)
  ) {
    grossFeeCents = Math.round(input.deliveryFeeCents);
    amountSource = 'input_override';
  } else {
    grossFeeCents = 0;
    amountSource = 'deliveryFee_legacy';
  }

  const split = splitDeliveryCommission(grossFeeCents);
  const deliveryPersonCut = split.providerNetPayoutCents;

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
      grossFeeCents,
      amountSource,
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
            amountCents: split.grossFeeCents,
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
    grossFeeCents: split.grossFeeCents,
    amountSource,
  };
}

/** @deprecated Prefer splitDeliveryCommission from quote-snapshot */
export function computeDelivererCutFromGross(grossFeeCents: number): number {
  return Math.round(grossFeeCents * (DELIVERY_DELIVERER_PERCENT / 100));
}
