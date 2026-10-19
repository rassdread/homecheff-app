import type { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notifications/notification-service';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';

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
    select: { id: true, orderId: true, deliveryProfileId: true, notes: true, deliveryProfile: { select: { userId: true } } },
  });
  const request = await prisma.standaloneDeliveryRequest.findFirst({
    where: { deliveryOrderId: input.deliveryOrderId },
  });
  if (!order || !request || request.paymentStatus !== 'PAID' || !request.stripeSessionId) {
    return { ok: false as const, status: 404, code: 'NOT_REFUNDABLE', error: 'Geen betaalde bezorging gevonden.' };
  }

  const key = refundIdempotencyKey(order.id);
  const existing = await prisma.deliveryRefundDecision.findUnique({ where: { idempotencyKey: key } });
  if (existing?.stripeRefundId || existing?.decision === 'REJECT' || existing?.stripeStatus === 'MANUAL') {
    return { ok: true as const, duplicate: true, decision: existing };
  }

  const session = await stripe.checkout.sessions.retrieve(request.stripeSessionId);
  const paymentRef = paymentIntentId(session.payment_intent);
  const paid = session.amount_total ?? request.buyerTotalCents;
  if (!paymentRef || paid <= 0) {
    return { ok: false as const, status: 409, code: 'PAYMENT_REFERENCE_MISSING', error: 'Stripe-betaling ontbreekt.' };
  }

  const priorRefunded = existing?.stripeStatus === 'succeeded' ? existing.amountCents : 0;
  const remaining = paid - priorRefunded;
  const requested = input.decision === 'REJECT' ? 0 : input.amountCents ?? remaining;
  if (input.decision === 'APPROVE' && (requested <= 0 || requested > remaining)) {
    return { ok: false as const, status: 409, code: 'REFUND_AMOUNT_INVALID', error: 'Het bedrag is hoger dan het resterende terugbetaalbare bedrag.' };
  }

  const payout = await prisma.payout.findFirst({
    where: {
      toUserId: order.deliveryProfile?.userId ?? '',
      OR: [{ id: `payout_delivery_${order.id}` }, { id: { startsWith: `payout_delivery_${order.id}_` } }],
    },
  });
  const transferred = Boolean(payout?.providerRef?.startsWith('tr_'));
  const partial = input.decision === 'APPROVE' && requested < remaining;
  if (partial && transferred) {
    return {
      ok: false as const,
      status: 409,
      code: 'PARTIAL_REFUND_UNSUPPORTED',
      error: 'Een gedeeltelijke terugbetaling is niet beschikbaar nadat de bezorger is uitbetaald.',
    };
  }

  const split = splitDeliveryCommission(request.quotedFeeCents);
  let reversalId: string | null = null;
  let outstanding = 0;
  let stripeStatus = input.decision === 'REJECT' ? 'rejected' : 'PENDING';
  let refundId: string | null = null;

  if (input.decision === 'APPROVE' && transferred && payout?.providerRef) {
    try {
      const reversal = await stripe.transfers.createReversal(
        payout.providerRef,
        { amount: split.providerNetPayoutCents },
        { idempotencyKey: `delivery_reversal_${order.id}_v1` },
      );
      reversalId = reversal.id;
    } catch {
      outstanding = split.providerNetPayoutCents;
      stripeStatus = 'MANUAL';
    }
  }

  if (input.decision === 'APPROVE' && stripeStatus !== 'MANUAL') {
    try {
      const refund = await stripe.refunds.create(
        { payment_intent: paymentRef, amount: requested },
        { idempotencyKey: `delivery_refund_${order.id}_${requested}_v1` },
      );
      refundId = refund.id;
      stripeStatus = refund.status ?? 'pending';
    } catch {
      outstanding = requested;
      stripeStatus = 'MANUAL';
    }
  }

  const saved = existing
    ? await prisma.deliveryRefundDecision.update({
        where: { id: existing.id },
        data: {
          decision: stripeStatus === 'MANUAL' ? 'MANUAL' : input.decision,
          reason: input.reason.trim(),
          amountCents: requested,
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
          amountCents: requested,
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
        if (raced.stripeRefundId || raced.stripeStatus === 'MANUAL' || raced.decision === 'REJECT') return raced;
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
