import type { Prisma, PrismaClient } from '@prisma/client';
import { reconcileDeliveryRefundBooks } from '@/lib/delivery/delivery-refund-books';

type Db = PrismaClient | Prisma.TransactionClient;

type SessionLike = {
  id: string;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
};

type ChargeLike = {
  id: string;
  amount?: number | null;
  amount_refunded?: number | null;
  currency?: string | null;
  payment_intent?: string | { id: string } | null;
  metadata?: Record<string, string> | null;
};

type AccountLike = {
  id: string;
  payouts_enabled?: boolean | null;
  capabilities?: { transfers?: string | null } | null;
};

function requestIdFromMetadata(metadata?: Record<string, string> | null) {
  if (metadata?.checkoutKind !== 'STANDALONE_DELIVERY') return null;
  const requestId = metadata.standaloneRequestId?.trim();
  return requestId || null;
}

export function standaloneCheckoutEventAction(
  type: string,
  metadata?: Record<string, string> | null,
) {
  if (metadata?.checkoutKind !== 'STANDALONE_DELIVERY') return 'ignore' as const;
  if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
    return 'fulfill' as const;
  }
  if (type === 'checkout.session.expired') return 'expire_if_unpaid' as const;
  if (type === 'checkout.session.async_payment_failed' || type === 'payment_intent.payment_failed') {
    return 'payment_failed' as const;
  }
  return 'ignore' as const;
}

export async function expireUnpaidStandaloneCheckout(db: Db, session: SessionLike) {
  const requestId = requestIdFromMetadata(session.metadata);
  if (!requestId) return { handled: false as const };
  const row = await db.standaloneDeliveryRequest.findUnique({ where: { id: requestId } });
  if (!row) return { handled: true as const, ok: true as const };
  if (row.paymentStatus === 'PAID' || row.deliveryOrderId) {
    return { handled: true as const, ok: true as const, ignored: 'already_paid' as const };
  }
  if (row.stripeSessionId && row.stripeSessionId !== session.id) {
    return { handled: true as const, ok: true as const, ignored: 'other_session' as const };
  }
  if (row.status === 'EXPIRED') return { handled: true as const, ok: true as const, duplicate: true as const };
  await db.standaloneDeliveryRequest.update({
    where: { id: row.id },
    data: { status: 'EXPIRED', paymentStatus: 'UNPAID', updatedAt: new Date() },
  });
  return { handled: true as const, ok: true as const };
}

export async function noteStandalonePaymentFailure(
  db: Db,
  input: { requestId?: string | null; metadata?: Record<string, string> | null },
) {
  const requestId = input.requestId || requestIdFromMetadata(input.metadata);
  if (!requestId) return { handled: false as const };
  const row = await db.standaloneDeliveryRequest.findUnique({ where: { id: requestId } });
  if (!row) return { handled: true as const, ok: true as const };
  if (row.paymentStatus === 'PAID' || row.deliveryOrderId) {
    return { handled: true as const, ok: true as const, ignored: 'already_paid' as const };
  }
  if (row.status === 'PAYMENT_FAILED') return { handled: true as const, ok: true as const, duplicate: true as const };
  await db.standaloneDeliveryRequest.update({
    where: { id: row.id },
    data: { status: 'PAYMENT_FAILED', updatedAt: new Date() },
  });
  return { handled: true as const, ok: true as const };
}

export async function observeStandaloneChargeRefund(
  db: Db,
  charge: ChargeLike,
  lookupPaymentIntent?: (id: string) => Promise<{ metadata?: Record<string, string> | null } | null>,
) {
  let requestId = requestIdFromMetadata(charge.metadata);
  if (!requestId && lookupPaymentIntent) {
    const piId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
    if (piId) {
      const paymentIntent = await lookupPaymentIntent(piId);
      requestId = requestIdFromMetadata(paymentIntent?.metadata);
    }
  }
  if (!requestId) return { handled: false as const };
  const row = await db.standaloneDeliveryRequest.findUnique({ where: { id: requestId } });
  if (!row?.deliveryOrderId) return { handled: true as const, ok: true as const, ignored: 'no_delivery' as const };
  const key = `delivery_refund_observed_${charge.id}`;
  const existing = await db.deliveryRefundDecision.findUnique({ where: { idempotencyKey: key } });
  const payout = typeof db.payout?.findUnique === 'function'
    ? await db.payout.findUnique({ where: { id: `payout_delivery_${row.deliveryOrderId}` } })
    : null;
  const transferred = Boolean(payout?.providerRef?.startsWith('tr_'));
  const reversalRecorded = Boolean(
    existing && 'stripeReversalId' in existing && existing.stripeReversalId,
  );
  if (!existing) {
    await db.deliveryRefundDecision.create({
      data: {
        deliveryOrderId: row.deliveryOrderId,
        orderId: null,
        idempotencyKey: key,
        decision: 'OBSERVED',
        reason: 'Stripe meldde charge.refunded voor deze bezorgbetaling. Er is geen nieuwe terugbetaling gemaakt.',
        amountCents: charge.amount_refunded ?? 0,
        currency: (charge.currency || 'eur').toUpperCase(),
        stripePaymentRef: typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id || null,
        stripeStatus: 'succeeded',
        outstandingCents: transferred && !reversalRecorded ? payout?.amountCents ?? 0 : 0,
        adminUserId: 'stripe-webhook',
        executedAt: new Date(),
      },
    });
  }
  await reconcileObservedStandaloneRefund(db, row, charge, transferred && !reversalRecorded);
  return { handled: true as const, ok: true as const, duplicate: Boolean(existing) };
}

export async function observeStandaloneDispute(
  db: Db,
  input: {
    disputeId: string;
    status?: string | null;
    requestId?: string | null;
    metadata?: Record<string, string> | null;
    amountCents?: number | null;
    currency?: string | null;
  },
) {
  const requestId = input.requestId || requestIdFromMetadata(input.metadata);
  if (!requestId) return { handled: false as const };
  const row = await db.standaloneDeliveryRequest.findUnique({ where: { id: requestId } });
  if (!row?.deliveryOrderId) return { handled: true as const, ok: true as const };
  const key = `delivery_dispute_${input.disputeId}`;
  const existing = await db.deliveryRefundDecision.findUnique({ where: { idempotencyKey: key } });
  if (existing) {
    await db.deliveryRefundDecision.update({
      where: { id: existing.id },
      data: { stripeStatus: input.status || existing.stripeStatus },
    });
    return { handled: true as const, ok: true as const, duplicate: true as const };
  }
  await db.deliveryRefundDecision.create({
    data: {
      deliveryOrderId: row.deliveryOrderId,
      idempotencyKey: key,
      decision: 'MANUAL',
      reason: 'Stripe-geschil op een bezorgbetaling. Geen automatische terugbetaling of overboeking.',
      amountCents: input.amountCents ?? 0,
      currency: (input.currency || 'eur').toUpperCase(),
      stripeStatus: input.status || 'open',
      outstandingCents: input.amountCents ?? 0,
      adminUserId: 'stripe-webhook',
    },
  });
  return { handled: true as const, ok: true as const };
}

export async function syncCourierConnectAccount(db: Db, account: AccountLike) {
  const user = await db.user.findFirst({
    where: { stripeConnectAccountId: account.id },
    select: { id: true },
  });
  if (!user) return { updated: false as const };
  const profile = await db.deliveryProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!profile) return { updated: false as const };
  await db.deliveryProfile.update({
    where: { id: profile.id },
    data: {
      stripeTransfersStatus: account.capabilities?.transfers === 'active' ? 'active' : 'inactive',
      stripePayoutsEnabled: account.payouts_enabled === true,
      stripeTransfersCheckedAt: new Date(),
    },
  });
  return { updated: true as const };
}

export async function recordDeliveryTransferCreated(
  db: Db,
  transfer: { id: string; amount: number; currency?: string | null; metadata?: Record<string, string> | null },
) {
  if (transfer.metadata?.purpose !== 'delivery_provider_principal') return { matched: false as const };
  const deliveryOrderId = transfer.metadata.deliveryOrderId?.trim();
  if (!deliveryOrderId || !transfer.id.startsWith('tr_')) return { matched: false as const };
  const payout = await db.payout.findUnique({ where: { id: `payout_delivery_${deliveryOrderId}` } });
  if (!payout) return { matched: false as const };
  if (payout.providerRef?.startsWith('tr_')) {
    return { matched: true as const, duplicate: payout.providerRef === transfer.id };
  }
  if (payout.amountCents !== transfer.amount || (transfer.currency || 'eur') !== 'eur') {
    await db.payout.update({
      where: { id: payout.id },
      data: { transferFailureCode: 'TRANSFER_AMOUNT_MISMATCH', transferFailureAt: new Date() },
    });
    return { matched: true as const, mismatch: true as const };
  }
  await db.payout.update({
    where: { id: payout.id },
    data: { providerRef: transfer.id, transferFailureCode: null, transferFailureAt: null },
  });
  return { matched: true as const };
}

async function reconcileObservedStandaloneRefund(
  db: Db,
  row: { id: string; deliveryOrderId: string | null; buyerTotalCents?: number | null },
  charge: ChargeLike,
  courierStillPaid: boolean,
) {
  if (!row.deliveryOrderId) return;
  try {
    await reconcileDeliveryRefundBooks(db as PrismaClient, {
      deliveryOrderId: row.deliveryOrderId,
      refundedCents: charge.amount_refunded ?? 0,
      chargeCents: charge.amount ?? row.buyerTotalCents ?? 0,
      stripeRefundId: charge.id,
      clawbackCourier: !courierStillPaid,
      affiliateSourceOrderId: `${row.id}_delivery_${row.deliveryOrderId}`,
    });
  } catch (error) {
    console.error('[delivery-refund-books]', error);
  }
}
