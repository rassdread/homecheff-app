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
import { settleCourierTransferObligation } from '@/lib/delivery/courier-transfer-obligation';

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
 * Every commercial delivery transfer requires the original successful charge
 * for this order, linked with source_transaction. A missing, invalid,
 * refunded, or wrong-order charge does not fall back to the platform balance.
 */
type DeliverySourceCharge = {
  id?: string;
  amount?: number | null;
  amount_refunded?: number | null;
  currency?: string | null;
  status?: string | null;
  refunded?: boolean | null;
  metadata?: { orderId?: string | null } | null;
};

export function assessDeliverySourceCharge(input: {
  chargeId: string | null;
  charge: DeliverySourceCharge | null;
  orderId: string;
}): { ok: true; chargeId: string; amount: number | null } | { ok: false; blockCode: string } {
  const chargeId = input.chargeId;
  if (!chargeId) return { ok: false, blockCode: 'SOURCE_CHARGE_MISSING' };
  if (!/^(ch|py)_/.test(chargeId)) return { ok: false, blockCode: 'SOURCE_CHARGE_INVALID' };
  const charge = input.charge;
  if (charge?.id && charge.id !== chargeId) return { ok: false, blockCode: 'SOURCE_CHARGE_INVALID' };
  if (charge?.status && charge.status !== 'succeeded') {
    return { ok: false, blockCode: 'SOURCE_CHARGE_INVALID' };
  }
  if (charge?.currency && charge.currency.toLowerCase() !== 'eur') {
    return { ok: false, blockCode: 'SOURCE_CHARGE_INVALID' };
  }
  const metaOrder = charge?.metadata?.orderId;
  if (metaOrder && metaOrder !== input.orderId) {
    return { ok: false, blockCode: 'SOURCE_CHARGE_WRONG_ORDER' };
  }
  const amount = typeof charge?.amount === 'number' ? charge.amount : null;
  const refunded = typeof charge?.amount_refunded === 'number' ? charge.amount_refunded : 0;
  if (charge?.refunded === true || (amount !== null && amount > 0 && refunded >= amount)) {
    return { ok: false, blockCode: 'SOURCE_CHARGE_REFUNDED' };
  }
  return {
    ok: true,
    chargeId,
    amount: amount === null ? null : Math.max(0, amount - refunded),
  };
}
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
  let sourceCharge: DeliverySourceCharge | null = null;
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
      sourceCharge = resolved.charge;
    } catch {
      sourceTransactionChargeId = null;
      sourceCharge = null;
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
  const assessedCharge = assessDeliverySourceCharge({
    chargeId: sourceTransactionChargeId,
    charge: sourceCharge,
    orderId,
  });
  const sourceChargeAmount = assessedCharge.ok ? assessedCharge.amount : null;
  if (assessedCharge.ok) sourceTransactionChargeId = assessedCharge.chargeId;

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

  if (!assessedCharge.ok || !sourceTransactionChargeId) {
    await prisma.payout.update({
      where: { id: payoutId },
      data: {
        transferFailureCode: assessedCharge.ok ? 'SOURCE_CHARGE_MISSING' : assessedCharge.blockCode,
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
      blockCode: assessedCharge.ok ? 'SOURCE_CHARGE_MISSING' : assessedCharge.blockCode,
      transferStatus: 'FAILED',
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

  const settled = await settleCourierTransferObligation({
    db: prisma,
    stripe,
    deliveryOrderId,
    orderId,
    chargeId: sourceTransactionChargeId,
    amountCents: transferAmount,
    currency: 'eur',
    destinationAccountId: destination,
    recipientUserId: delivererUserId,
  });
  if (settled.transferId?.startsWith('tr_')) {
    try {
      await prisma.payout.update({
        where: { id: payoutId },
        data: {
          providerRef: settled.transferId,
          destinationConnectAccountId: destination,
          transferFailureCode: null,
          transferFailureAt: null,
        },
      });
    } catch (error) {
      console.error('[delivery-payout] transfer recorded at Stripe but the payout row was not updated', error instanceof Error ? error.name : 'error');
    }
    return {
      created: settled.created,
      payoutId,
      amountCents: transferAmount,
      grossFeeCents: split.grossFeeCents,
      amountSource,
      transferId: settled.transferId,
      transferStatus: settled.created ? 'SUCCEEDED' : 'ALREADY_DONE',
      connectedAccountId: destination,
      blockCode: settled.blockCode,
    };
  }
  await prisma.payout.update({
    where: { id: payoutId },
    data: {
      transferFailureCode: settled.blockCode || settled.state,
      transferFailureAt: new Date(),
    },
  });
  return {
    created: false,
    payoutId,
    amountCents: transferAmount,
    grossFeeCents: split.grossFeeCents,
    amountSource,
    blocked: true,
    blockCode: settled.blockCode || settled.state,
    transferId: null,
    transferStatus: 'FAILED',
    connectedAccountId: destination,
  };
}

/** @deprecated Prefer splitDeliveryCommission from quote-snapshot */
export function computeDelivererCutFromGross(grossFeeCents: number): number {
  return Math.round(grossFeeCents * (DELIVERY_DELIVERER_PERCENT / 100));
}
