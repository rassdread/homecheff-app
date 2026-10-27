import type { Prisma, PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { liveStripeMutationAllowed } from '@/lib/products/checkout-reservation-policy';
import {
  evaluateDuplicateRefund,
  type DuplicateRefundDecision,
} from '@/lib/payments/duplicate-payment-refund';

type ChargeFacts = {
  paymentIntentId: string | null;
  chargeId: string | null;
  amountCents: number | null;
  currency: string | null;
  expectedAmountCents: number | null;
  disputed: boolean;
  existingRefundId: string | null;
  existingRefundStatus: string | null;
};

function refundsAllowed(secret: string | undefined): boolean {
  if (!secret) return false;
  if (secret.startsWith('sk_test_')) return true;
  if (secret.startsWith('sk_live')) return liveStripeMutationAllowed();
  return false;
}

async function loadChargeFacts(
  stripe: Stripe,
  sessionId: string,
): Promise<ChargeFacts> {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent.latest_charge'],
  });
  const intent = session.payment_intent;
  const paymentIntent = intent && typeof intent !== 'string' ? intent : null;
  const paymentIntentId =
    typeof intent === 'string' ? intent : paymentIntent?.id || null;
  const chargeRef = paymentIntent?.latest_charge;
  const charge = chargeRef && typeof chargeRef !== 'string' ? chargeRef : null;
  const chargeId = typeof chargeRef === 'string' ? chargeRef : charge?.id || null;
  const refund = charge?.refunds?.data?.[0];
  return {
    paymentIntentId,
    chargeId,
    amountCents: charge?.amount ?? session.amount_total ?? null,
    currency: charge?.currency ?? session.currency ?? null,
    expectedAmountCents: session.amount_total ?? null,
    disputed: Boolean(charge?.disputed),
    existingRefundId: refund?.id ?? null,
    existingRefundStatus: refund?.status ?? null,
  };
}

async function settlementExists(
  prisma: PrismaClient,
  ids: Array<string | null>,
): Promise<boolean> {
  const refs = ids.filter((id): id is string => Boolean(id));
  if (refs.length === 0) return false;
  const [transaction, payout] = await Promise.all([
    prisma.transaction.findFirst({
      where: { providerRef: { in: refs } },
      select: { id: true },
    }),
    prisma.payout.findFirst({
      where: { providerRef: { in: refs } },
      select: { id: true },
    }),
  ]);
  return Boolean(transaction || payout);
}

/**
 * Refund one extra captured charge, or record why it must wait.
 * A Stripe timeout is reconciled from the charge before another refund is requested.
 */
export async function recoverDuplicateCheckoutPayment(
  prisma: PrismaClient,
  incidentId: string,
): Promise<DuplicateRefundDecision> {
  const incident = await prisma.checkoutPaymentIncident.findUnique({
    where: { id: incidentId },
  });
  if (!incident) return { action: 'manual', reason: 'INCIDENT_MISSING' };
  const order = await prisma.order.findFirst({
    where: { stripeSessionId: incident.stripeSessionId },
    select: { id: true },
  });
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!refundsAllowed(secret)) {
    const decision = evaluateDuplicateRefund({
      incidentCode: incident.code,
      orderIdForSession: order?.id ?? null,
      settlementExists: false,
      paymentIntentId: incident.paymentIntentId,
      chargeId: null,
      amountCents: null,
      currency: null,
      expectedAmountCents: null,
      disputed: false,
      existingRefundId: incident.refundId,
      existingRefundStatus: incident.refundId ? 'succeeded' : null,
      refundsAllowed: false,
    });
    await saveDecision(prisma, incident.id, decision, incident.paymentIntentId);
    return decision;
  }

  const stripe = new Stripe(secret as string, { apiVersion: '2025-08-27.basil' });
  let facts: ChargeFacts;
  try {
    facts = await loadChargeFacts(stripe, incident.stripeSessionId);
  } catch (error) {
    await prisma.checkoutPaymentIncident.update({
      where: { id: incident.id },
      data: { lastError: error instanceof Error ? error.message : 'STRIPE_LOOKUP_FAILED' },
    });
    throw error;
  }

  const decision = evaluateDuplicateRefund({
    incidentCode: incident.code,
    orderIdForSession: order?.id ?? null,
    settlementExists: await settlementExists(prisma, [
      incident.stripeSessionId,
      facts.paymentIntentId,
      facts.chargeId,
    ]),
    paymentIntentId: facts.paymentIntentId,
    chargeId: facts.chargeId,
    amountCents: facts.amountCents,
    currency: facts.currency,
    expectedAmountCents: facts.expectedAmountCents,
    disputed: facts.disputed,
    existingRefundId: facts.existingRefundId || incident.refundId,
    existingRefundStatus: facts.existingRefundStatus,
    refundsAllowed: true,
  });

  if (decision.action === 'refund' && facts.chargeId) {
    let refund: Stripe.Refund;
    try {
      refund = await stripe.refunds.create(
        {
          charge: facts.chargeId,
          amount: decision.amountCents,
          reason: 'duplicate',
          metadata: { incidentId: incident.id, homecheff_duplicate_refund: 'true' },
        },
        { idempotencyKey: decision.idempotencyKey },
      );
    } catch (error) {
      const listed = await stripe.refunds.list({ charge: facts.chargeId, limit: 5 }).catch(() => null);
      const found = listed?.data.find((row) => row.status !== 'failed' && row.status !== 'canceled');
      if (!found) {
        await prisma.checkoutPaymentIncident.update({
          where: { id: incident.id },
          data: { lastError: error instanceof Error ? error.message : 'REFUND_AMBIGUOUS' },
        });
        throw error;
      }
      refund = found;
    }
    await prisma.checkoutPaymentIncident.update({
      where: { id: incident.id },
      data: {
        paymentIntentId: facts.paymentIntentId,
        refundId: refund.id,
        status: 'REFUND_RECORDED',
        resolution: refund.status === 'succeeded' ? 'REFUND_SUCCEEDED' : 'REFUND_PENDING',
        lastError: null,
      },
    });
    return {
      action: 'already_recorded',
      refundId: refund.id,
      pending: refund.status !== 'succeeded',
    };
  }

  await saveDecision(prisma, incident.id, decision, facts.paymentIntentId);
  return decision;
}

async function saveDecision(
  prisma: PrismaClient,
  incidentId: string,
  decision: DuplicateRefundDecision,
  paymentIntentId: string | null,
) {
  if (decision.action === 'refund') return;
  if (decision.action === 'already_recorded') {
    await prisma.checkoutPaymentIncident.update({
      where: { id: incidentId },
      data: {
        paymentIntentId,
        refundId: decision.refundId,
        status: 'REFUND_RECORDED',
        resolution: decision.pending ? 'REFUND_PENDING' : 'REFUND_SUCCEEDED',
        lastError: null,
      },
    });
    return;
  }
  await prisma.checkoutPaymentIncident.update({
    where: { id: incidentId },
    data: {
      paymentIntentId,
      status: 'MANUAL_REVIEW',
      resolution: decision.reason,
      lastError: decision.reason,
    },
  });
}

export async function reconcileRefundedCharge(
  prisma: PrismaClient,
  input: { paymentIntentId: string | null; refundId: string | null },
) {
  if (!input.paymentIntentId && !input.refundId) return { updated: 0 };
  const or: Prisma.CheckoutPaymentIncidentWhereInput[] = [];
  if (input.paymentIntentId) or.push({ paymentIntentId: input.paymentIntentId });
  if (input.refundId) or.push({ refundId: input.refundId });
  const updated = await prisma.checkoutPaymentIncident.updateMany({
    where: { OR: or, status: { in: ['REFUND_REQUIRED', 'REFUND_RECORDED', 'MANUAL_REVIEW'] } },
    data: {
      ...(input.refundId ? { refundId: input.refundId } : {}),
      status: 'REFUND_RECORDED',
      resolution: 'REFUND_SUCCEEDED',
      lastError: null,
    },
  });
  return { updated: updated.count };
}
