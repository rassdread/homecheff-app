import type { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
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
import { resolveChargeIdForCheckoutSession } from '@/lib/payments/seller-settlement';

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
  transferId?: string | null;
  transferStatus?:
    | 'SUCCEEDED'
    | 'ALREADY_DONE'
    | 'LEDGER_ONLY_NO_CONNECT'
    | 'FAILED'
    | 'SKIPPED';
  connectedAccountId?: string | null;
};

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2025-08-27.basil' });
}

/**
 * Idempotent delivery payout: Transaction → Payout → earnings → Stripe Connect transfer.
 * Phase 2.2: gross locked fee from quotedFeeCents (preferred) or legacy deliveryFee.
 * Never re-reads current DeliveryProfile pricing rates.
 *
 * Connect transfer (when destination ready):
 * - Stripe-paid orders: prefer source_transaction from Checkout charge
 * - HC-only / no charge: platform-balance treasury transfer (same pattern as HC seller payout)
 */
export async function ensureDeliveryPayout(
  prisma: PrismaClient,
  input: DeliveryPayoutInput
): Promise<DeliveryPayoutResult> {
  const { deliveryOrderId, orderId, delivererUserId, buyerUserId } = input;

  const profile = await prisma.deliveryProfile.findUnique({
    where: { userId: delivererUserId },
    include: {
      user: {
        select: {
          dateOfBirth: true,
          id: true,
          stripeConnectAccountId: true,
          stripeConnectOnboardingCompleted: true,
        },
      },
    },
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
        { transactionId: orderId, toUserId: delivererUserId },
      ],
    },
    select: {
      id: true,
      amountCents: true,
      providerRef: true,
      destinationConnectAccountId: true,
    },
  });

  let payoutId = existingPayout?.id ?? stablePayoutId;
  let created = false;

  if (!existingPayout) {
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
    created = true;
    payoutId = stablePayoutId;
  } else if (
    existingPayout.providerRef &&
    existingPayout.providerRef.startsWith('tr_')
  ) {
    return {
      created: false,
      payoutId: existingPayout.id,
      amountCents: existingPayout.amountCents,
      grossFeeCents,
      amountSource,
      transferId: existingPayout.providerRef,
      transferStatus: 'ALREADY_DONE',
      connectedAccountId: existingPayout.destinationConnectAccountId,
    };
  }

  const destination = profile?.user?.stripeConnectAccountId ?? null;
  if (!destination || deliveryPersonCut <= 0) {
    return {
      created,
      payoutId,
      amountCents: deliveryPersonCut,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      transferId: null,
      transferStatus: 'LEDGER_ONLY_NO_CONNECT',
      connectedAccountId: destination,
    };
  }

  const stripe = getStripe();
  if (!stripe) {
    return {
      created,
      payoutId,
      amountCents: deliveryPersonCut,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      transferId: null,
      transferStatus: 'FAILED',
      connectedAccountId: destination,
      blockCode: 'STRIPE_NOT_CONFIGURED',
    };
  }

  let sourceTransactionChargeId: string | null = null;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      stripeSessionId: true,
      paymentMethod: true,
    },
  });

  if (order?.stripeSessionId && order.paymentMethod !== 'HC_ONLY') {
    try {
      const resolved = await resolveChargeIdForCheckoutSession(
        stripe,
        order.stripeSessionId,
      );
      sourceTransactionChargeId = resolved.chargeId;
    } catch {
      sourceTransactionChargeId = null;
    }
  }

  try {
    const transferParams: Stripe.TransferCreateParams = {
      amount: deliveryPersonCut,
      currency: 'eur',
      destination,
      transfer_group: `order_${orderId}`,
      metadata: {
        orderId,
        deliveryOrderId,
        purpose: 'delivery_provider_principal',
        providerUserId: delivererUserId,
        sourceTransactionChargeId: sourceTransactionChargeId || '',
        paymentMethod: order?.paymentMethod || '',
      },
    };
    if (sourceTransactionChargeId) {
      transferParams.source_transaction = sourceTransactionChargeId;
    }

    const transfer = await stripe.transfers.create(transferParams, {
      idempotencyKey: `delivery_xfer_${deliveryOrderId}_v1`,
    });

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        providerRef: transfer.id,
        destinationConnectAccountId: destination,
      },
    });

    return {
      created,
      payoutId,
      amountCents: deliveryPersonCut,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      transferId: transfer.id,
      transferStatus: 'SUCCEEDED',
      connectedAccountId: destination,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes('idempoten') ||
      message.toLowerCase().includes('already')
    ) {
      return {
        created,
        payoutId,
        amountCents: deliveryPersonCut,
        grossFeeCents: split.grossFeeCents,
        amountSource,
        transferId: null,
        transferStatus: 'ALREADY_DONE',
        connectedAccountId: destination,
      };
    }
    console.error(
      `[delivery-payout] Connect transfer failed deliveryOrder=${deliveryOrderId}:`,
      message,
    );
    return {
      created,
      payoutId,
      amountCents: deliveryPersonCut,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      transferId: null,
      transferStatus: 'FAILED',
      connectedAccountId: destination,
      blockCode: 'CONNECT_TRANSFER_FAILED',
    };
  }
}

/** @deprecated Prefer splitDeliveryCommission from quote-snapshot */
export function computeDelivererCutFromGross(grossFeeCents: number): number {
  return Math.round(grossFeeCents * (DELIVERY_DELIVERER_PERCENT / 100));
}
