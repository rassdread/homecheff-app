import type { Prisma, PrismaClient } from '@prisma/client';
import { classifyCourierStripeIdentity, type CourierStripeAccount } from '@/lib/delivery/courier-identity';
import { recoverCourierTransfer, type CourierRecoveryClient } from '@/lib/delivery/courier-transfer-recovery';
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

type AccountLike = CourierStripeAccount & {
  id: string;
  capabilities?: { transfers?: string | null } | null;
};

function requestIdFromMetadata(metadata?: Record<string, string> | null) {
  if (metadata?.checkoutKind !== 'STANDALONE_DELIVERY') return null;
  const requestId = metadata.standaloneRequestId?.trim();
  return requestId || null;
}

export function deliveryWebhookClass(input: {
  eventType: string;
  paymentStatus?: string | null;
  deliveryEnabled: boolean;
}): 'NEW_DELIVERY_CREATION' | 'EXISTING_DELIVERY_RECONCILIATION' | 'BLOCKED' {
  if (
    input.eventType === 'charge.refunded'
    || input.eventType === 'checkout.session.async_payment_succeeded'
    || input.eventType === 'checkout.session.async_payment_failed'
    || input.eventType === 'payment_intent.payment_failed'
    || input.eventType === 'account.updated'
    || input.eventType.startsWith('charge.dispute.')
    || input.eventType.startsWith('transfer.')
  ) {
    return 'EXISTING_DELIVERY_RECONCILIATION';
  }
  if (input.eventType === 'checkout.session.completed') {
    if (input.paymentStatus === 'paid') return 'EXISTING_DELIVERY_RECONCILIATION';
    if (!input.deliveryEnabled) return 'BLOCKED';
    return 'NEW_DELIVERY_CREATION';
  }
  return 'EXISTING_DELIVERY_RECONCILIATION';
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
  recovery?: CourierRecoveryClient | null,
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
  const refundedCents = charge.amount_refunded ?? 0;
  const chargeCents = charge.amount ?? row.buyerTotalCents ?? 0;
  let recoveredCents = 0;
  let outstandingCents = transferred ? payout?.amountCents ?? 0 : 0;
  let reversalId: string | null = existing && 'stripeReversalId' in existing
    ? (existing.stripeReversalId as string | null)
    : null;
  let uncertain = false;
  if (transferred && recovery && payout?.providerRef) {
    const recoveryResult = await recoverCourierTransfer({
      transferId: payout.providerRef,
      transferredCents: payout.amountCents ?? 0,
      refundedCents,
      chargeCents,
      stripe: recovery,
    });
    recoveredCents = recoveryResult.recoveredCents;
    outstandingCents = recoveryResult.outstandingCents;
    reversalId = recoveryResult.reversalId;
    uncertain = recoveryResult.uncertain;
    if (reversalId && typeof db.deliveryRefundDecision?.create === 'function') {
      await db.deliveryRefundDecision.create({
        data: {
          deliveryOrderId: row.deliveryOrderId,
          orderId: null,
          idempotencyKey: `delivery_recovery_${reversalId}`,
          decision: recoveryResult.state,
          reason: 'Stripe-bevestigde terugvordering van de bezorgersoverboeking.',
          amountCents: recoveryResult.recoveredCents,
          currency: (charge.currency || 'eur').toUpperCase(),
          stripePaymentRef: typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id || null,
          stripeReversalId: reversalId,
          stripeStatus: recoveryResult.state,
          outstandingCents,
          adminUserId: 'stripe-webhook',
          executedAt: new Date(),
        },
      }).catch((error: { code?: string }) => {
        if (error?.code !== 'P2002') throw error;
      });
    }
  }
  const decisionData = {
    amountCents: refundedCents,
    stripeStatus: uncertain || outstandingCents > 0 ? 'MANUAL' : 'succeeded',
    stripeReversalId: reversalId,
    outstandingCents,
    executedAt: new Date(),
  };
  if (!existing) {
    await db.deliveryRefundDecision.create({
      data: {
        deliveryOrderId: row.deliveryOrderId,
        orderId: null,
        idempotencyKey: key,
        decision: 'OBSERVED',
        reason: 'Stripe meldde charge.refunded voor deze bezorgbetaling. Er is geen nieuwe terugbetaling gemaakt.',
        currency: (charge.currency || 'eur').toUpperCase(),
        stripePaymentRef: typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id || null,
        adminUserId: 'stripe-webhook',
        ...decisionData,
      },
    });
  } else if (typeof db.deliveryRefundDecision.update === 'function') {
    await db.deliveryRefundDecision.update({
      where: { id: existing.id },
      data: decisionData,
    });
  }
  await reconcileObservedStandaloneRefund(db, row, charge, {
    courierStillPaid: transferred && recoveredCents <= 0,
    confirmedCourierCents: transferred ? recoveredCents : null,
  });
  if (uncertain) {
    throw new Error('courier_recovery_uncertain');
  }
  return { handled: true as const, ok: true as const, duplicate: Boolean(existing), outstandingCents };
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
  const users = await db.user.findMany({
    where: { stripeConnectAccountId: account.id },
    select: { id: true },
    take: 2,
  });
  if (users.length !== 1) return { updated: false as const, reason: 'OWNERSHIP' as const };
  const user = users[0];
  const profile = await db.deliveryProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!profile) return { updated: false as const };
  const identity = classifyCourierStripeIdentity(account);
  await db.deliveryProfile.update({
    where: { id: profile.id },
    data: {
      stripeTransfersStatus: account.capabilities?.transfers === 'active' ? 'active' : 'inactive',
      stripePayoutsEnabled: account.payouts_enabled === true,
      stripeTransfersCheckedAt: new Date(),
      stripeIdentityState: identity.state,
      stripeIdentityReason: identity.reason,
      stripeIdentityCheckedAt: new Date(),
    },
  });
  return { updated: true as const, identity: identity.state };
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
  recovery: { courierStillPaid: boolean; confirmedCourierCents: number | null },
) {
  if (!row.deliveryOrderId) return;
  try {
    await reconcileDeliveryRefundBooks(db as PrismaClient, {
      deliveryOrderId: row.deliveryOrderId,
      refundedCents: charge.amount_refunded ?? 0,
      chargeCents: charge.amount ?? row.buyerTotalCents ?? 0,
      stripeRefundId: charge.id,
      clawbackCourier: !recovery.courierStillPaid,
      courierClawbackTargetCents: recovery.confirmedCourierCents,
      affiliateSourceOrderId: `${row.id}_delivery_${row.deliveryOrderId}`,
    });
  } catch (error) {
    console.error('[delivery-refund-books]', error instanceof Error ? error.name : 'refund_books');
  }
}
