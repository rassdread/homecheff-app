import type { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notifications/notification-service';
import { marketplaceDeliveryRefundPlan } from '@/lib/delivery/delivery-ops-queue';
import { recoverCourierTransfer } from '@/lib/delivery/courier-transfer-recovery';
import { reconcileDeliveryRefundBooks } from '@/lib/delivery/delivery-refund-books';

export type CustomerRefundStatus =
  | 'CANCELLATION_REQUESTED'
  | 'UNDER_REVIEW'
  | 'REFUND_APPROVED'
  | 'REFUND_PROCESSING'
  | 'REFUNDED'
  | 'REFUND_REJECTED'
  | 'MANUAL_RESOLUTION';

export function refundIdempotencyKey(deliveryOrderId: string) {
  return `delivery_refund_${deliveryOrderId}`;
}

export function customerRefundStatus(decision: {
  decision: string;
  stripeStatus: string | null;
  stripeRefundId: string | null;
  outstandingCents: number;
} | null): CustomerRefundStatus {
  if (!decision) return 'UNDER_REVIEW';
  if (decision.decision === 'REJECT') return 'REFUND_REJECTED';
  if (decision.outstandingCents > 0 || decision.stripeStatus === 'MANUAL') return 'MANUAL_RESOLUTION';
  if (decision.stripeRefundId && decision.stripeStatus === 'succeeded') return 'REFUNDED';
  if (decision.decision === 'APPROVE') {
    return decision.stripeRefundId ? 'REFUND_PROCESSING' : 'REFUND_APPROVED';
  }
  return 'UNDER_REVIEW';
}

export const REFUND_STATUS_COPY: Record<CustomerRefundStatus, { nl: string; en: string }> = {
  CANCELLATION_REQUESTED: {
    nl: 'Annulering aangevraagd.',
    en: 'Cancellation requested.',
  },
  UNDER_REVIEW: {
    nl: 'De annulering wordt beoordeeld. Er is nog geen geld teruggestort.',
    en: 'The cancellation is under review. No money has been returned yet.',
  },
  REFUND_APPROVED: {
    nl: 'Terugbetaling goedgekeurd. Stripe heeft dit nog niet bevestigd.',
    en: 'Refund approved. Stripe has not confirmed it yet.',
  },
  REFUND_PROCESSING: {
    nl: 'Terugbetaling wordt verwerkt. Stripe heeft de storting nog niet bevestigd.',
    en: 'Refund is processing. Stripe has not confirmed the return yet.',
  },
  REFUNDED: {
    nl: 'Stripe heeft de terugbetaling bevestigd.',
    en: 'Stripe has confirmed the refund.',
  },
  REFUND_REJECTED: {
    nl: 'Terugbetaling afgewezen.',
    en: 'Refund rejected.',
  },
  MANUAL_RESOLUTION: {
    nl: 'Handmatige afhandeling nodig. Dit is nog niet financieel afgerond.',
    en: 'Manual resolution is required. This is not financially settled.',
  },
};

type StripeLike = {
  checkout: {
    sessions: {
      retrieve: (id: string) => Promise<{
        payment_intent?: string | { id: string } | null;
        amount_total?: number | null;
        currency?: string | null;
      }>;
    };
  };
  refunds: {
    create: (
      params: { payment_intent: string; amount: number },
      opts: { idempotencyKey: string },
    ) => Promise<{ id: string; status: string | null }>;
  };
  transfers: {
    createReversal: (
      id: string,
      params: { amount: number },
      opts: { idempotencyKey: string },
    ) => Promise<{ id: string }>;
  };
};

function paymentIntentId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

export async function executeDeliveryRefundDecision(
  prisma: PrismaClient,
  stripe: StripeLike,
  input: {
    deliveryOrderId: string;
    adminUserId: string;
    decision: 'APPROVE' | 'REJECT';
    reason: string;
    amountCents?: number | null;
    confirm: boolean;
  },
) {
  if (!input.confirm) {
    return { ok: false as const, status: 400, code: 'CONFIRMATION_REQUIRED', error: 'Bevestig de financiële actie expliciet.' };
  }
  if (!input.reason.trim()) {
    return { ok: false as const, status: 400, code: 'REASON_REQUIRED', error: 'Een reden is verplicht.' };
  }

  const order = await prisma.deliveryOrder.findUnique({
    where: { id: input.deliveryOrderId },
    select: {
      id: true,
      orderId: true,
      deliveryProfileId: true,
      notes: true,
      quotedFeeCents: true,
      deliveryProfile: { select: { userId: true } },
    },
  });
  const request = await prisma.standaloneDeliveryRequest.findFirst({
    where: { deliveryOrderId: input.deliveryOrderId },
  });
  if (!order) {
    return { ok: false as const, status: 404, code: 'NOT_REFUNDABLE', error: 'Geen betaalde bezorging gevonden.' };
  }
  if (!request || request.paymentStatus !== 'PAID' || !request.stripeSessionId) {
    const marketplaceOrder = order.orderId
      ? await prisma.order.findUnique({
          where: { id: order.orderId },
          select: { stripeSessionId: true, totalAmount: true },
        })
      : null;
    const plan = marketplaceDeliveryRefundPlan({
      hasStandalonePaidSession: false,
      orderStripeSessionId: marketplaceOrder?.stripeSessionId,
      quotedFeeCents: order.quotedFeeCents,
      orderTotalCents: marketplaceOrder?.totalAmount,
    });
    if (plan.action !== 'MANUAL') {
      return { ok: false as const, status: 404, code: 'NOT_REFUNDABLE', error: 'Geen betaalde bezorging gevonden.' };
    }
    const manualKey = refundIdempotencyKey(order.id);
    const manualExisting = await prisma.deliveryRefundDecision.findUnique({ where: { idempotencyKey: manualKey } });
    if (manualExisting) {
      return { ok: true as const, duplicate: true, decision: manualExisting, customerStatus: customerRefundStatus(manualExisting) };
    }
    const manualSaved = await prisma.deliveryRefundDecision.create({
      data: {
        deliveryOrderId: order.id,
        orderId: order.orderId,
        idempotencyKey: manualKey,
        decision: 'MANUAL',
        reason: `${input.reason.trim()} Marketplace-betaling dekt ook de producten. Er is geen automatische bezorgterugbetaling uitgevoerd.`,
        amountCents: order.quotedFeeCents ?? 0,
        currency: 'EUR',
        stripePaymentRef: marketplaceOrder?.stripeSessionId ?? null,
        stripeStatus: 'MANUAL',
        outstandingCents: order.quotedFeeCents ?? 0,
        adminUserId: input.adminUserId,
        executedAt: new Date(),
      },
    });
    return {
      ok: true as const,
      duplicate: false,
      decision: manualSaved,
      customerStatus: customerRefundStatus(manualSaved),
      code: plan.code,
    };
  }

  const key = refundIdempotencyKey(order.id);
  const existing = await prisma.deliveryRefundDecision.findUnique({ where: { idempotencyKey: key } });
  if (existing?.decision === 'REJECT') {
    return { ok: true as const, duplicate: true, decision: existing, customerStatus: customerRefundStatus(existing) };
  }

  const session = await stripe.checkout.sessions.retrieve(request.stripeSessionId);
  const paymentRef = paymentIntentId(session.payment_intent);
  const paid = session.amount_total ?? request.buyerTotalCents;
  if (!paymentRef || paid <= 0) {
    return { ok: false as const, status: 409, code: 'PAYMENT_REFERENCE_MISSING', error: 'Stripe-betaling ontbreekt.' };
  }

  const alreadyRefundedCents = existing?.stripeRefundId ? existing.amountCents : 0;
  const settledReplay = Boolean(
    existing?.stripeRefundId
    && existing.outstandingCents === 0
    && existing.stripeStatus === 'succeeded'
    && (input.amountCents == null
      ? alreadyRefundedCents >= paid
      : input.amountCents === existing.amountCents),
  );
  if (settledReplay && existing) {
    await reconcileSavedDeliveryRefund(prisma, {
      deliveryOrderId: order.id,
      refundedCents: existing.amountCents,
      chargeCents: paid,
      stripeRefundId: existing.stripeRefundId,
      clawbackCourier: true,
      affiliateSourceOrderId: `${request.id}_delivery_${order.id}`,
    });
    return { ok: true as const, duplicate: true, decision: existing, customerStatus: customerRefundStatus(existing) };
  }
  const recoveryRetry = Boolean(
    existing?.stripeRefundId
    && existing.outstandingCents > 0
    && (input.amountCents == null || input.amountCents === existing.amountCents),
  );
  const remaining = paid - alreadyRefundedCents;
  const requested = recoveryRetry
    ? 0
    : input.decision === 'REJECT' ? 0 : input.amountCents ?? remaining;
  if (!recoveryRetry && input.decision === 'APPROVE' && (requested <= 0 || requested > remaining)) {
    return { ok: false as const, status: 409, code: 'REFUND_AMOUNT_INVALID', error: 'Het bedrag is hoger dan het resterende terugbetaalbare bedrag.' };
  }

  const payout = await prisma.payout.findFirst({
    where: {
      toUserId: order.deliveryProfile?.userId ?? '',
      OR: [{ id: `payout_delivery_${order.id}` }, { id: { startsWith: `payout_delivery_${order.id}_` } }],
    },
  });
  const transferred = Boolean(payout?.providerRef?.startsWith('tr_'));
  let reversalId: string | null = existing?.stripeReversalId ?? null;
  let outstanding = existing?.outstandingCents ?? 0;
  let stripeStatus = input.decision === 'REJECT' ? 'rejected' : 'PENDING';
  let refundId: string | null = existing?.stripeRefundId ?? null;
  let cumulativeRefunded = alreadyRefundedCents;
  let recoveredCents = 0;

  if (input.decision === 'APPROVE' && !recoveryRetry) {
    try {
      const refund = await stripe.refunds.create(
        { payment_intent: paymentRef, amount: requested },
        { idempotencyKey: `delivery_refund_${order.id}_${requested}_v1` },
      );
      refundId = refund.id;
      stripeStatus = refund.status ?? 'pending';
      cumulativeRefunded = alreadyRefundedCents + requested;
    } catch {
      refundId = existing?.stripeRefundId ?? null;
      outstanding = requested;
      stripeStatus = 'MANUAL';
    }
  }

  if (input.decision === 'APPROVE' && refundId && transferred && payout?.providerRef) {
    const recovery = await recoverCourierTransfer({
      transferId: payout.providerRef,
      transferredCents: payout.amountCents,
      refundedCents: cumulativeRefunded,
      chargeCents: paid,
      stripe: {
        listReversals: (transferId) => listTransferReversals(stripe, transferId),
        createReversal: async (transferId, amountCents, idempotencyKey) => {
          const reversal = await stripe.transfers.createReversal(
            transferId,
            { amount: amountCents },
            { idempotencyKey },
          );
          return { id: reversal.id, amount: amountCents };
        },
      },
    });
    recoveredCents = recovery.recoveredCents;
    outstanding = recovery.outstandingCents;
    reversalId = recovery.reversalId ?? reversalId;
    stripeStatus = recovery.uncertain || outstanding > 0 ? 'MANUAL' : 'succeeded';
  } else if (input.decision === 'APPROVE' && refundId && !transferred) {
    outstanding = 0;
    if (stripeStatus !== 'MANUAL') stripeStatus = stripeStatus === 'pending' ? 'pending' : 'succeeded';
  }

  const saved = existing
    ? await prisma.deliveryRefundDecision.update({
        where: { id: existing.id },
        data: {
          decision: stripeStatus === 'MANUAL' ? 'MANUAL' : input.decision,
          reason: input.reason.trim(),
          amountCents: refundId ? cumulativeRefunded : requested,
          stripePaymentRef: paymentRef,
          stripeRefundId: refundId,
          stripeReversalId: reversalId,
          stripeStatus,
          outstandingCents: outstanding,
          executedAt: new Date(),
        },
      })
    : await prisma.deliveryRefundDecision.create({
        data: {
          deliveryOrderId: order.id,
          orderId: order.orderId,
          idempotencyKey: key,
          decision: stripeStatus === 'MANUAL' ? 'MANUAL' : input.decision,
          reason: input.reason.trim(),
          amountCents: refundId ? cumulativeRefunded : requested,
          stripePaymentRef: paymentRef,
          stripeRefundId: refundId,
          stripeReversalId: reversalId,
          stripeStatus,
          outstandingCents: outstanding,
          adminUserId: input.adminUserId,
          executedAt: new Date(),
        },
      }).catch(async (error: { code?: string }) => {
        if (error?.code !== 'P2002') throw error;
        const raced = await prisma.deliveryRefundDecision.findUnique({ where: { idempotencyKey: key } });
        if (!raced) throw error;
        if (raced.decision === 'REJECT') return raced;
        if (raced.stripeRefundId && raced.outstandingCents === 0 && (raced.stripeReversalId || !transferred)) return raced;
        return prisma.deliveryRefundDecision.update({
          where: { id: raced.id },
          data: {
            stripeRefundId: refundId,
            stripeReversalId: reversalId,
            stripeStatus,
            outstandingCents: outstanding,
            executedAt: new Date(),
          },
        });
      });

  const status = customerRefundStatus(saved);
  if (saved.stripeRefundId) {
    await reconcileSavedDeliveryRefund(prisma, {
      deliveryOrderId: order.id,
      refundedCents: saved.amountCents,
      chargeCents: paid,
      stripeRefundId: saved.stripeRefundId,
      clawbackCourier: !transferred || recoveredCents > 0,
      courierClawbackTargetCents: transferred ? recoveredCents : null,
      affiliateSourceOrderId: `${request.id}_delivery_${order.id}`,
    });
  }
  const copy = REFUND_STATUS_COPY[status];
  const recipients = [request.requesterUserId, order.deliveryProfile?.userId].filter(Boolean) as string[];
  await Promise.all(recipients.map((userId) => NotificationService.send({
    userId,
    channels: ['push'],
    message: { title: copy.nl, body: `${copy.nl} / ${copy.en}` },
    emailIdempotencyKey: `delivery-refund-notice-${saved.id}-${userId}`,
  }).catch(() => undefined)));

  return { ok: true as const, duplicate: Boolean(existing), decision: saved, customerStatus: status };
}

async function listTransferReversals(
  stripe: StripeLike,
  transferId: string,
): Promise<Array<{ id: string; amount: number }>> {
  const list = (stripe.transfers as StripeLike['transfers'] & {
    listReversals?: (id: string) => Promise<{ data?: Array<{ id: string; amount: number }> } | Array<{ id: string; amount: number }>>;
  }).listReversals;
  if (typeof list !== 'function') return [];
  const page = await list(transferId);
  if (Array.isArray(page)) return page;
  return page.data ?? [];
}

async function reconcileSavedDeliveryRefund(
  prisma: PrismaClient,
  input: {
    deliveryOrderId: string;
    refundedCents: number;
    chargeCents: number;
    stripeRefundId: string | null;
    clawbackCourier: boolean;
    courierClawbackTargetCents?: number | null;
    affiliateSourceOrderId: string | null;
  },
) {
  try {
    await reconcileDeliveryRefundBooks(prisma, {
      deliveryOrderId: input.deliveryOrderId,
      refundedCents: input.refundedCents,
      chargeCents: input.chargeCents,
      stripeRefundId: input.stripeRefundId,
      clawbackCourier: input.clawbackCourier,
      courierClawbackTargetCents: input.courierClawbackTargetCents,
      affiliateSourceOrderId: input.affiliateSourceOrderId,
    });
  } catch (error) {
    console.error('[delivery-refund-books]', error instanceof Error ? error.name : 'refund_books');
  }
}
