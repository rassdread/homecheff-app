import type { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import {
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';
import { assertCommercialCourierCanReceivePayout } from '@/lib/delivery/delivery-eligibility';
import { ensureCourierPayable } from '@/lib/delivery/courier-payable';
import {
  resolveLockedDeliveryGrossCents,
  splitDeliveryCommission,
} from '@/lib/delivery/quote-snapshot';
import { readHcDeliveryRefundMarker } from '@/lib/hc/marketplace-hc-delivery-refund-pure';
import { resolveChargeIdForCheckoutSession } from '@/lib/payments/seller-settlement';
import { financialStripeSecret } from '@/lib/stripe';

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
  const key = financialStripeSecret();
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
  input: DeliveryPayoutInput,
  deps?: { stripe?: Stripe | null },
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
    if (deliveryOrder.status !== 'DELIVERED') {
      return {
        created: false,
        payoutId: `payout_delivery_${deliveryOrderId}`,
        amountCents: 0,
        blocked: true,
        blockCode: 'DELIVERY_NOT_COMPLETE',
        transferStatus: 'SKIPPED',
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
      transferFailureCode: true,
      transferFailureAt: true,
    },
  });

  let payoutId = existingPayout?.id ?? stablePayoutId;
  let created = false;

  if (existingPayout?.providerRef?.startsWith('tr_')) {
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

  const payable = profile
    ? await ensureCourierPayable(prisma, profile.id, { requireAgreement: false })
    : { ok: false as const, status: 404, code: 'DELIVERY_PROVIDER_REQUIRED', error: 'Bezorgaanbieder niet gevonden.' };
  const destination = payable.ok ? profile?.user?.stripeConnectAccountId ?? null : null;
  if (!payable.ok || !destination || deliveryPersonCut <= 0) {
    if (existingPayout && !existingPayout.providerRef) {
      await prisma.payout.update({
        where: { id: existingPayout.id },
        data: {
          providerRef: 'failed_connect_missing',
          transferFailureCode: payable.ok ? 'COURIER_CONNECT_REQUIRED' : payable.code,
          transferFailureAt: new Date(),
        },
      });
    }
    return {
      created: false,
      payoutId,
      amountCents: deliveryPersonCut,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      blocked: true,
      blockCode: payable.ok ? 'COURIER_CONNECT_REQUIRED' : payable.code,
      transferId: null,
      transferStatus: 'FAILED',
      connectedAccountId: destination,
    };
  }

  if (!existingPayout) {
    try {
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
    } catch (error) {
      const again = await prisma.payout.findUnique({ where: { id: stablePayoutId } });
      if (!again) throw error;
      if (again.providerRef?.startsWith('tr_')) {
        return {
          created: false,
          payoutId: again.id,
          amountCents: again.amountCents,
          grossFeeCents,
          amountSource,
          transferId: again.providerRef,
          transferStatus: 'ALREADY_DONE',
          connectedAccountId: again.destinationConnectAccountId,
        };
      }
      payoutId = again.id;
    }
  }

  const stripe = deps && Object.prototype.hasOwnProperty.call(deps, 'stripe') ? deps.stripe ?? null : getStripe();
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
  let sourceChargeAmount: number | null = null;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      stripeSessionId: true,
      paymentMethod: true,
    },
  });

  let checkoutSessionId: string | null = null;
  let paymentMethod = order?.paymentMethod || '';
  if (order?.stripeSessionId && order.paymentMethod !== 'HC_ONLY') {
    checkoutSessionId = order.stripeSessionId;
  } else if (!order?.stripeSessionId) {
    const standalone = await prisma.standaloneDeliveryRequest.findFirst({
      where: { deliveryOrderId },
      select: { stripeSessionId: true, paymentStatus: true },
    });
    if (standalone?.paymentStatus === 'PAID' && standalone.stripeSessionId) {
      checkoutSessionId = standalone.stripeSessionId;
      paymentMethod = 'STANDALONE_DELIVERY';
    }
  }

  if (checkoutSessionId) {
    try {
      const resolved = await resolveChargeIdForCheckoutSession(stripe, checkoutSessionId);
      sourceTransactionChargeId = resolved.chargeId;
      sourceChargeAmount =
        resolved.charge && typeof resolved.charge.amount === 'number' ? resolved.charge.amount : null;
    } catch {
      sourceTransactionChargeId = null;
    }
  }

  const transferAmount = Math.min(
    deliveryPersonCut,
    existingPayout?.amountCents ?? deliveryPersonCut,
  );
  if (transferAmount <= 0) {
    return {
      created,
      payoutId,
      amountCents: 0,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      blocked: true,
      blockCode: 'NOTHING_TO_TRANSFER',
      transferStatus: 'SKIPPED',
      connectedAccountId: destination,
    };
  }
  if (sourceChargeAmount !== null && transferAmount > sourceChargeAmount) {
    return {
      created,
      payoutId,
      amountCents: transferAmount,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      blocked: true,
      blockCode: 'TRANSFER_EXCEEDS_SOURCE',
      transferStatus: 'FAILED',
      connectedAccountId: destination,
    };
  }
  if (paymentMethod === 'STANDALONE_DELIVERY' && !sourceTransactionChargeId) {
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        transferFailureCode: 'SOURCE_CHARGE_MISSING',
        transferFailureAt: new Date(),
      },
    });
    return {
      created,
      payoutId,
      amountCents: transferAmount,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      blocked: true,
      blockCode: 'SOURCE_CHARGE_MISSING',
      transferStatus: 'FAILED',
      connectedAccountId: destination,
    };
  }

  try {
    const existingTransfer = await findConfirmedDeliveryTransfer(stripe, {
      orderId,
      deliveryOrderId,
      amount: transferAmount,
    });
    if (existingTransfer) {
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          providerRef: existingTransfer,
          destinationConnectAccountId: destination,
          transferFailureCode: null,
          transferFailureAt: null,
        },
      });
      return {
        created,
        payoutId,
        amountCents: transferAmount,
        grossFeeCents: split.grossFeeCents,
        amountSource,
        transferId: existingTransfer,
        transferStatus: 'ALREADY_DONE',
        connectedAccountId: destination,
      };
    }

    const freshProfile = await prisma.deliveryProfile.findUnique({
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
    const freshGate = assertCommercialCourierCanReceivePayout({
      profile: freshProfile,
      dateOfBirth: freshProfile?.user?.dateOfBirth,
    });
    if (!freshGate.ok) {
      return {
        created,
        payoutId,
        amountCents: transferAmount,
        grossFeeCents: split.grossFeeCents,
        amountSource,
        blocked: true,
        blockCode: freshGate.code,
        transferId: null,
        transferStatus: 'SKIPPED',
        connectedAccountId: destination,
      };
    }

    const transferParams: Stripe.TransferCreateParams = {
      amount: transferAmount,
      currency: 'eur',
      destination,
      transfer_group: `order_${orderId}`,
      metadata: {
        orderId,
        deliveryOrderId,
        purpose: 'delivery_provider_principal',
        providerUserId: delivererUserId,
        sourceTransactionChargeId: sourceTransactionChargeId || '',
        paymentMethod,
      },
    };
    if (sourceTransactionChargeId) {
      transferParams.source_transaction = sourceTransactionChargeId;
    }

    const retryStamp = existingPayout?.transferFailureAt
      ? `_${existingPayout.transferFailureAt.getTime()}`
      : existingPayout?.transferFailureCode
        ? `_${existingPayout.transferFailureCode}`
        : '';
    const transfer = await stripe.transfers.create(transferParams, {
      idempotencyKey: `delivery_xfer_${deliveryOrderId}_${sourceTransactionChargeId || 'balance'}${retryStamp}`,
    });
    if (!transfer.id?.startsWith('tr_')) {
      throw new Error('Stripe did not confirm a transfer id');
    }

    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        providerRef: transfer.id,
        destinationConnectAccountId: destination,
        transferFailureCode: null,
        transferFailureAt: null,
      },
    });

    return {
      created,
      payoutId,
      amountCents: transferAmount,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      transferId: transfer.id,
      transferStatus: 'SUCCEEDED',
      connectedAccountId: destination,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const lower = message.toLowerCase();
    if (
      (lower.includes('idempoten') || lower.includes('already')) &&
      !lower.includes('mismatch')
    ) {
      return {
        created,
        payoutId,
        amountCents: transferAmount,
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
    const failureCode = lower.includes('insufficient')
      ? 'INSUFFICIENT_BALANCE'
      : 'CONNECT_TRANSFER_FAILED';
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        transferFailureCode: failureCode,
        transferFailureAt: new Date(),
      },
    });
    return {
      created,
      payoutId,
      amountCents: transferAmount,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      transferId: null,
      transferStatus: 'FAILED',
      connectedAccountId: destination,
      blockCode: failureCode,
    };
  }
}

async function findConfirmedDeliveryTransfer(
  stripe: Stripe,
  input: { orderId: string; deliveryOrderId: string; amount: number },
): Promise<string | null> {
  if (typeof stripe.transfers.list !== 'function') return null;
  try {
    const listed = await stripe.transfers.list({
      transfer_group: `order_${input.orderId}`,
      limit: 20,
    });
    const match = listed.data.find(
      (transfer) =>
        transfer.id.startsWith('tr_') &&
        transfer.metadata?.deliveryOrderId === input.deliveryOrderId &&
        transfer.amount === input.amount &&
        transfer.reversed !== true,
    );
    return match?.id ?? null;
  } catch {
    return null;
  }
}

/** @deprecated Prefer splitDeliveryCommission from quote-snapshot */
export function computeDelivererCutFromGross(grossFeeCents: number): number {
  return Math.round(grossFeeCents * (DELIVERY_DELIVERER_PERCENT / 100));
}
