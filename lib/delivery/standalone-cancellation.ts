import type { PrismaClient } from '@prisma/client';
import {
  mergeHcDeliveryRefundNotes,
  readHcDeliveryRefundMarker,
  type HcDeliveryRefundMarker,
} from '@/lib/hc/marketplace-hc-delivery-refund-pure';

/** Customer-facing state. No Stripe refund has been executed. */
export const STANDALONE_REFUND_REVIEW = 'REVIEW_REQUIRED' as const;

export type StandaloneRefundView = {
  status: typeof STANDALONE_REFUND_REVIEW;
  stripeRefundId: null;
  ledgerAdjusted: boolean;
  duplicate: boolean;
};

function isTransferRef(value: string | null | undefined) {
  return typeof value === 'string' && value.startsWith('tr_');
}

export function standaloneRefundView(
  marker: HcDeliveryRefundMarker | null,
): StandaloneRefundView | null {
  if (!marker) return null;
  return {
    status: STANDALONE_REFUND_REVIEW,
    stripeRefundId: null,
    ledgerAdjusted: marker.providerMode === 'LEDGER_CLAWBACK',
    duplicate: false,
  };
}

/**
 * Paid standalone cancellation.
 * Before pickup, unearned courier ledger earnings are reversed with the
 * existing delivery refund row. The customer charge stays in review:
 * there is no established standalone refund entitlement, so Stripe is not called.
 * After pickup, nothing is moved automatically.
 */
export async function applyStandalonePaidCancellation(
  prisma: PrismaClient,
  input: {
    deliveryOrderId: string;
    previousStatus: string;
    actorUserId: string;
    actor: 'COURIER' | 'REQUESTER';
  },
): Promise<
  | { ok: true; view: StandaloneRefundView }
  | { ok: false; status: number; code: string; error: string }
> {
  const order = await prisma.deliveryOrder.findUnique({
    where: { id: input.deliveryOrderId },
    include: { deliveryProfile: { select: { id: true, userId: true } } },
  });
  if (!order || order.origin !== 'STANDALONE' || !order.deliveryProfile) {
    return { ok: false, status: 404, code: 'NOT_FOUND', error: 'Bezorgopdracht niet gevonden.' };
  }
  const request = await prisma.standaloneDeliveryRequest.findFirst({
    where: { deliveryOrderId: order.id },
  });
  if (!request || request.paymentStatus !== 'PAID') {
    return { ok: false, status: 409, code: 'NOT_PAID', error: 'Deze bezorging is niet betaald.' };
  }
  if (input.actor === 'COURIER' && order.deliveryProfile.userId !== input.actorUserId) {
    return { ok: false, status: 403, code: 'FORBIDDEN', error: 'Niet geautoriseerd.' };
  }
  if (input.actor === 'REQUESTER' && request.requesterUserId !== input.actorUserId) {
    return { ok: false, status: 403, code: 'FORBIDDEN', error: 'Niet geautoriseerd.' };
  }
  if (input.previousStatus === 'DELIVERED' || order.status === 'DELIVERED') {
    return { ok: false, status: 409, code: 'ALREADY_DELIVERED', error: 'Een bezorgde opdracht kan niet worden geannuleerd.' };
  }

  const existing = readHcDeliveryRefundMarker(order.notes);
  if (existing) {
    return { ok: true, view: { ...standaloneRefundView(existing)!, duplicate: true } };
  }
  if (input.previousStatus === 'CANCELLED') {
    return {
      ok: true,
      view: { status: STANDALONE_REFUND_REVIEW, stripeRefundId: null, ledgerAdjusted: false, duplicate: true },
    };
  }

  const beforePickup = input.previousStatus === 'PENDING' || input.previousStatus === 'ACCEPTED';
  const payout = await prisma.payout.findFirst({
    where: {
      toUserId: order.deliveryProfile.userId,
      OR: [
        { id: `payout_delivery_${order.id}` },
        { id: { startsWith: `payout_delivery_${order.id}_` } },
      ],
    },
  });
  const txn = await prisma.transaction.findFirst({
    where: {
      OR: [
        { id: `txn_delivery_${order.id}` },
        { id: { startsWith: `txn_delivery_${order.id}_` } },
      ],
    },
  });

  let ledgerAdjusted = false;
  if (beforePickup && payout && !isTransferRef(payout.providerRef) && txn && txn.status !== 'REFUNDED') {
    const clawback = Math.min(payout.amountCents, request.providerNetPayoutCents);
    await prisma.$transaction(async (tx) => {
      const fresh = await tx.transaction.findUnique({ where: { id: txn.id } });
      if (!fresh || fresh.status === 'REFUNDED') return;
      await tx.transaction.update({
        where: { id: fresh.id },
        data: { status: 'REFUNDED', updatedAt: new Date() },
      });
      const refundId = `refund_delivery_ledger_${order.id}`;
      const refundExists = await tx.refund.findUnique({ where: { id: refundId } });
      if (!refundExists) {
        await tx.refund.create({
          data: {
            id: refundId,
            transactionId: fresh.id,
            amountCents: clawback,
            providerRef: 'ledger_clawback',
          },
        });
      }
      await tx.deliveryProfile.update({
        where: { id: order.deliveryProfile!.id },
        data: { totalEarnings: { decrement: clawback } },
      });
    });
    const after = await prisma.transaction.findUnique({ where: { id: txn.id } });
    ledgerAdjusted = after?.status === 'REFUNDED';
  }

  const marker: HcDeliveryRefundMarker = {
    status: 'RECOVERY_REQUIRED',
    at: new Date().toISOString(),
    deliveryOrderId: order.id,
    deliveryGrossCents: request.quotedFeeCents,
    providerPrincipalCents: request.providerNetPayoutCents,
    homeCheffFeeCents: request.platformCommissionCents,
    providerMode: ledgerAdjusted ? 'LEDGER_CLAWBACK' : beforePickup && isTransferRef(payout?.providerRef) ? 'RECOVERY_REQUIRED' : 'NONE',
    providerReversalId: ledgerAdjusted ? 'ledger_clawback' : null,
    affiliateReversed: false,
    affiliateAlreadyDone: false,
    error: 'REVIEW_REQUIRED_NO_AUTOMATIC_STRIPE_REFUND',
  };
  const current = await prisma.deliveryOrder.findUnique({ where: { id: order.id }, select: { notes: true } });
  if (!readHcDeliveryRefundMarker(current?.notes)) {
    await prisma.deliveryOrder.update({
      where: { id: order.id },
      data: { notes: mergeHcDeliveryRefundNotes(current?.notes, marker) },
    });
  }
  return {
    ok: true,
    view: {
      status: STANDALONE_REFUND_REVIEW,
      stripeRefundId: null,
      ledgerAdjusted,
      duplicate: false,
    },
  };
}
