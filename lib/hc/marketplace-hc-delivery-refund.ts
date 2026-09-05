/**
 * HC / mixed Marketplace full-refund — Delivery economic reversal.
 *
 * Reverses (exactly once, from original snapshots):
 * - provider principal (88% of locked delivery gross)
 * - HomeCheff delivery fee exposure (12%)
 * - delivery affiliate accrual (fee-only original events)
 *
 * Customer HC / Stripe restoration stays in the admin HC full-refund route.
 * Does not recalculate current 12/88, affiliate tree, or provider pricing.
 */

import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { processCommissionReversal } from '@/lib/affiliate-commission';
import { isSuccessfulTransferRef } from '@/lib/payments/seller-settlement';
import { reverseRecipientTransfer } from '@/lib/payments/recipient-reversal';
import {
  deliveryRefundEconomicsFromGross,
  mergeHcDeliveryRefundNotes,
  readHcDeliveryRefundMarker,
  type HcDeliveryRefundMarker,
} from '@/lib/hc/marketplace-hc-delivery-refund-pure';

export type { HcDeliveryRefundMarker };
export {
  HC_DELIVERY_REFUND_MARKER,
  deliveryRefundEconomicsFromGross,
  mergeHcDeliveryRefundNotes,
  readHcDeliveryRefundMarker,
} from '@/lib/hc/marketplace-hc-delivery-refund-pure';

export type HcDeliveryRefundResult = {
  ok: boolean;
  skipped: boolean;
  reason?: string;
  marker: HcDeliveryRefundMarker | null;
};

async function reverseProviderPayout(args: {
  deliveryOrderId: string;
  orderId: string;
  providerUserId: string;
  principalCents: number;
  stripe: Stripe | null;
}): Promise<{
  mode: HcDeliveryRefundMarker['providerMode'];
  reversalId: string | null;
  error?: string;
}> {
  const txnId = `txn_delivery_${args.deliveryOrderId}`;
  const payoutId = `payout_delivery_${args.deliveryOrderId}`;

  const [txn, payout] = await Promise.all([
    prisma.transaction.findUnique({ where: { id: txnId } }),
    prisma.payout.findUnique({ where: { id: payoutId } }),
  ]);

  if (!txn && !payout) {
    return { mode: 'NONE', reversalId: null };
  }

  if (txn?.status === 'REFUNDED') {
    const existingRefund = await prisma.refund.findFirst({
      where: { transactionId: txnId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      mode: isSuccessfulTransferRef(payout?.providerRef)
        ? 'STRIPE_TRANSFER_REVERSAL'
        : 'LEDGER_CLAWBACK',
      reversalId: existingRefund?.providerRef ?? 'ledger_already_refunded',
    };
  }

  const transferId = isSuccessfulTransferRef(payout?.providerRef)
    ? String(payout!.providerRef)
    : null;

  if (transferId && args.stripe) {
    const rev = await reverseRecipientTransfer({
      stripe: args.stripe,
      transferId,
      amountCents: Math.min(args.principalCents, payout?.amountCents ?? args.principalCents),
      idempotencyKey: `hc_delivery_refund_tr_${args.deliveryOrderId}`,
      metadata: {
        purpose: 'hc_delivery_full_refund',
        orderId: args.orderId,
        deliveryOrderId: args.deliveryOrderId,
      },
      description: `HC delivery refund provider principal ${args.deliveryOrderId}`,
      transactionId: txnId,
      persistRefundRow: true,
    });

    if (rev.status === 'FAILED') {
      return {
        mode: 'RECOVERY_REQUIRED',
        reversalId: null,
        error: rev.error ?? 'stripe_transfer_reversal_failed',
      };
    }

    const clawbackCents = Math.min(
      args.principalCents,
      payout?.amountCents ?? args.principalCents
    );

    await prisma.$transaction(async (tx) => {
      if (txn && txn.status !== 'REFUNDED') {
        await tx.transaction.update({
          where: { id: txnId },
          data: { status: 'REFUNDED', updatedAt: new Date() },
        });
      }
      await tx.deliveryProfile.updateMany({
        where: { userId: args.providerUserId },
        data: { totalEarnings: { decrement: clawbackCents } },
      });
    });

    return {
      mode: 'STRIPE_TRANSFER_REVERSAL',
      reversalId: rev.reversalId ?? 'stripe_reversal_done',
    };
  }

  // Ledger-only payout (typical Delivery path: providerRef null).
  const clawbackCents = Math.min(
    args.principalCents,
    payout?.amountCents ?? args.principalCents
  );

  await prisma.$transaction(async (tx) => {
    if (txn && txn.status !== 'REFUNDED') {
      await tx.transaction.update({
        where: { id: txnId },
        data: { status: 'REFUNDED', updatedAt: new Date() },
      });
    }
    if (txn) {
      await tx.refund
        .create({
          data: {
            id: `refund_delivery_ledger_${args.deliveryOrderId}`,
            transactionId: txnId,
            amountCents: clawbackCents,
            providerRef: 'ledger_clawback',
          },
        })
        .catch(() => {
          /* idempotent */
        });
    }
    await tx.deliveryProfile.updateMany({
      where: { userId: args.providerUserId },
      data: { totalEarnings: { decrement: clawbackCents } },
    });
  });

  return { mode: 'LEDGER_CLAWBACK', reversalId: 'ledger_clawback' };
}

/**
 * Idempotent Delivery leg reversal for Marketplace HC full refund.
 * Safe to call on retries; does not restore customer HC.
 */
export async function reverseHcMarketplaceDeliveryOnFullRefund(args: {
  orderId: string;
  stripe?: Stripe | null;
}): Promise<HcDeliveryRefundResult> {
  const delivery = await prisma.deliveryOrder.findFirst({
    where: { orderId: args.orderId },
    select: {
      id: true,
      status: true,
      quotedFeeCents: true,
      notes: true,
      deliveryProfile: { select: { userId: true } },
    },
  });

  if (!delivery) {
    return { ok: true, skipped: true, reason: 'no_delivery_order', marker: null };
  }

  const existing = readHcDeliveryRefundMarker(delivery.notes);
  if (existing?.status === 'COMPLETE') {
    return { ok: true, skipped: true, reason: 'already_complete', marker: existing };
  }

  const economics = deliveryRefundEconomicsFromGross(delivery.quotedFeeCents);
  const nowIso = new Date().toISOString();

  let providerMode: HcDeliveryRefundMarker['providerMode'] = 'NONE';
  let providerReversalId: string | null = null;
  let providerError: string | undefined;

  const hadPayout =
    (await prisma.payout.findUnique({
      where: { id: `payout_delivery_${delivery.id}` },
      select: { id: true },
    })) != null;

  const providerUserId = delivery.deliveryProfile?.userId ?? null;

  if (!hadPayout) {
    if (delivery.status !== 'DELIVERED' && delivery.status !== 'CANCELLED') {
      await prisma.deliveryOrder.update({
        where: { id: delivery.id },
        data: { status: 'CANCELLED', updatedAt: new Date() },
      });
      providerMode = 'CANCELLED_UNEARNED';
    } else if (delivery.status === 'CANCELLED') {
      providerMode = 'CANCELLED_UNEARNED';
    } else {
      // DELIVERED but payout not created yet — block future ensureDeliveryPayout via marker.
      providerMode = 'CANCELLED_UNEARNED';
    }
  } else if (providerUserId) {
    const rev = await reverseProviderPayout({
      deliveryOrderId: delivery.id,
      orderId: args.orderId,
      providerUserId,
      principalCents: economics.providerPrincipalCents,
      stripe: args.stripe ?? null,
    });
    providerMode = rev.mode;
    providerReversalId = rev.reversalId;
    providerError = rev.error;
  }

  let affiliateReversed = false;
  let affiliateAlreadyDone = false;
  try {
    // Reverse canonical ecosystem Delivery fee accrual by original snapshot (if present).
    const sourceTransactionId = `${args.orderId}_delivery_${delivery.id}`;
    const { reverseDeliveryPlatformFeeEcosystemCommission } = await import(
      '@/lib/affiliates/ecosystem-attribution-bridge'
    );
    const ecoRev = await reverseDeliveryPlatformFeeEcosystemCommission({
      sourceTransactionId,
      reversalEventId: `hc_full_refund_${args.orderId}`,
      reason: 'HC_DELIVERY_REFUND',
    });
    if (ecoRev.ok && ecoRev.code !== 'ORIGINAL_NOT_FOUND') {
      affiliateReversed = true;
      affiliateAlreadyDone = Boolean(ecoRev.duplicate);
    }

    // Also reverse legacy Marketplace CommissionLedger rows (original snapshot).
    const aff = await processCommissionReversal({
      reversalEventId: `hc_full_refund_${args.orderId}`,
      eventType: 'REFUND',
      orderId: args.orderId,
      refundedAmountCents: Math.max(1, economics.deliveryGrossCents),
      chargeAmountCents: null,
    });
    if (aff.reversedCount > 0) affiliateReversed = true;
    if (!affiliateReversed) affiliateAlreadyDone = aff.reversedCount === 0;
  } catch (e) {
    const marker: HcDeliveryRefundMarker = {
      status: 'FAILED',
      at: nowIso,
      deliveryOrderId: delivery.id,
      deliveryGrossCents: economics.deliveryGrossCents,
      providerPrincipalCents: economics.providerPrincipalCents,
      homeCheffFeeCents: economics.homeCheffFeeCents,
      providerMode,
      providerReversalId,
      affiliateReversed: false,
      affiliateAlreadyDone: false,
      error: e instanceof Error ? e.message : String(e),
    };
    await prisma.deliveryOrder.update({
      where: { id: delivery.id },
      data: {
        notes: mergeHcDeliveryRefundNotes(delivery.notes, marker),
        updatedAt: new Date(),
      },
    });
    return { ok: false, skipped: false, reason: 'affiliate_reversal_failed', marker };
  }

  const status: HcDeliveryRefundMarker['status'] =
    providerMode === 'RECOVERY_REQUIRED' ? 'RECOVERY_REQUIRED' : 'COMPLETE';

  const marker: HcDeliveryRefundMarker = {
    status,
    at: nowIso,
    deliveryOrderId: delivery.id,
    deliveryGrossCents: economics.deliveryGrossCents,
    providerPrincipalCents: economics.providerPrincipalCents,
    homeCheffFeeCents: economics.homeCheffFeeCents,
    providerMode,
    providerReversalId,
    affiliateReversed: affiliateReversed || affiliateAlreadyDone,
    affiliateAlreadyDone,
    ...(providerError ? { error: providerError } : {}),
  };

  await prisma.deliveryOrder.update({
    where: { id: delivery.id },
    data: {
      notes: mergeHcDeliveryRefundNotes(delivery.notes, marker),
      updatedAt: new Date(),
    },
  });

  return {
    ok: status === 'COMPLETE',
    skipped: false,
    reason: status === 'COMPLETE' ? undefined : 'provider_recovery_required',
    marker,
  };
}
