import { randomUUID } from 'crypto';
import type { PrismaClient } from '@prisma/client';
import {
  decideIncidentResolution,
  stripeSecretAllowsSessionExpire,
} from '@/lib/products/checkout-reservation-policy';

const STALE_LOCK_MS = 2 * 60 * 1000;

export type IncidentFacts = {
  existingRefundId: string | null;
  /** Must stay 0. The reviewer records a refund id it was given. It does not create one. */
  refundCalls: number;
};

/**
 * Records that a captured Checkout Session could not become an order.
 * Does not call Stripe. A second attempt for the same session is a no-op.
 */
export async function recordCheckoutPaymentIncident(
  prisma: PrismaClient,
  input: {
    stripeSessionId: string;
    paymentIntentId?: string | null;
    reason: string;
    code: string;
    buyerId?: string | null;
  },
) {
  const existingOrder = await prisma.order.findFirst({
    where: { stripeSessionId: input.stripeSessionId },
    select: { id: true },
  });
  if (existingOrder) return null;

  const existing = await prisma.checkoutPaymentIncident.findUnique({
    where: { stripeSessionId: input.stripeSessionId },
  });
  if (existing) return existing;

  try {
    return await prisma.checkoutPaymentIncident.create({
      data: {
        stripeSessionId: input.stripeSessionId,
        paymentIntentId: input.paymentIntentId || null,
        status: 'REFUND_REQUIRED',
        reason: input.reason,
        code: input.code,
        buyerId: input.buyerId || null,
      },
    });
  } catch (error) {
    const again = await prisma.checkoutPaymentIncident.findUnique({
      where: { stripeSessionId: input.stripeSessionId },
    });
    if (again) return again;
    throw error;
  }
}

/**
 * Claims one incident and moves it to a terminal review state.
 * Does not call Stripe refunds. A second worker loses the claim.
 */
export async function reviewCheckoutPaymentIncident(
  prisma: PrismaClient,
  incidentId: string,
  input: {
    now?: Date;
    loadFacts: (incident: { stripeSessionId: string; paymentIntentId: string | null }) => Promise<IncidentFacts>;
  },
) {
  const now = input.now ?? new Date();
  const token = randomUUID();
  const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);
  const claimed = await prisma.checkoutPaymentIncident.updateMany({
    where: {
      id: incidentId,
      status: 'REFUND_REQUIRED',
      OR: [{ lockedAt: null }, { lockedAt: { lt: staleBefore } }],
    },
    data: {
      lockedAt: now,
      lockToken: token,
      attemptCount: { increment: 1 },
    },
  });
  if (claimed.count !== 1) return { claimed: false as const };

  const incident = await prisma.checkoutPaymentIncident.findUnique({ where: { id: incidentId } });
  if (!incident || incident.lockToken !== token) return { claimed: false as const };

  try {
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: incident.stripeSessionId },
      select: { id: true },
    });
    const facts = await input.loadFacts(incident);
    if (facts.refundCalls !== 0) {
      throw new Error('AUTO_REFUND_BLOCKED');
    }
    const decision = decideIncidentResolution({
      orderId: order?.id ?? null,
      existingRefundId: facts.existingRefundId,
    });
    const saved = await prisma.checkoutPaymentIncident.updateMany({
      where: { id: incidentId, lockToken: token, status: 'REFUND_REQUIRED' },
      data: {
        status: decision.status,
        resolution: decision.resolution,
        refundId: decision.refundId ?? null,
        orderId: decision.orderId ?? null,
        resolvedAt: now,
        lockedAt: null,
        lastError: decision.resolution === 'AUTO_REFUND_BLOCKED' ? 'AUTO_REFUND_BLOCKED' : null,
      },
    });
    return { claimed: true as const, saved: saved.count === 1, decision };
  } catch (error) {
    await prisma.checkoutPaymentIncident.updateMany({
      where: { id: incidentId, lockToken: token, status: 'REFUND_REQUIRED' },
      data: {
        lockedAt: null,
        lastError: error instanceof Error ? error.message : 'REVIEW_FAILED',
      },
    });
    throw error;
  }
}

/**
 * Reads an existing refund id. Does not create a refund.
 * A live key outside the production runtime does not call Stripe.
 */
export async function loadIncidentFactsFromStripe(incident: {
  stripeSessionId: string;
  paymentIntentId: string | null;
}): Promise<IncidentFacts> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!incident.paymentIntentId || !stripeSecretAllowsSessionExpire(secret, process.env)) {
    return { existingRefundId: null, refundCalls: 0 };
  }
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(secret as string, { apiVersion: '2025-08-27.basil' });
  const intent = await stripe.paymentIntents.retrieve(incident.paymentIntentId);
  const chargeRef = intent.latest_charge;
  const chargeId = typeof chargeRef === 'string' ? chargeRef : chargeRef?.id;
  if (!chargeId) return { existingRefundId: null, refundCalls: 0 };
  const charge = await stripe.charges.retrieve(chargeId);
  return {
    existingRefundId: charge.refunds?.data?.[0]?.id ?? null,
    refundCalls: 0,
  };
}
