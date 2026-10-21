import {
  CommissionLedgerEventType,
  CommissionLedgerStatus,
  type PrismaClient,
} from '@prisma/client';
import { processCommissionReversal } from '@/lib/affiliate-commission';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';

/**
 * Integer half-up division. Used for refund clawbacks so a partial
 * refund cannot invent or drop a cent through floating point.
 */
export function proportionalCents(amount: number, part: number, whole: number): number {
  const base = Math.trunc(amount);
  const paid = Math.trunc(part);
  const total = Math.trunc(whole);
  if (base <= 0 || paid <= 0 || total <= 0) return 0;
  if (paid >= total) return base;
  return Math.floor((base * paid + Math.floor(total / 2)) / total);
}

export function courierClawbackCents(input: {
  courierAllocationCents: number;
  refundedCents: number;
  chargeCents: number;
}): number {
  return proportionalCents(
    input.courierAllocationCents,
    input.refundedCents,
    input.chargeCents,
  );
}

type LedgerRow = {
  id: string;
  eventId: string;
  eventType: string;
  affiliateId: string;
  amountCents: number;
  currency?: string | null;
  status: string;
  availableAt?: Date | null;
  businessSubscriptionId?: string | null;
  meta?: unknown;
};

type RefundRow = { id: string; amountCents: number; transactionId?: string };

export type DeliveryRefundBooksResult = {
  skipped?: boolean;
  courierDeltaCents: number;
  courierTargetCents: number;
  affiliateReversedCents: number;
  affiliateRemainderCents: number;
  deliveryStatus: string | null;
};

function hasMethod(db: unknown, model: string, method: string) {
  const row = (db as Record<string, unknown> | null)?.[model];
  return Boolean(row && typeof (row as Record<string, unknown>)[method] === 'function');
}

function eur(value: string | null | undefined): string {
  return value ?? 'eur';
}

function asMeta(meta: unknown): Record<string, unknown> {
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  return {};
}

function earningsRefundId(deliveryOrderId: string, targetCents: number) {
  return `refund_delivery_earnings_${deliveryOrderId}_${targetCents}`;
}

/**
 * Idempotent book reconciliation after a customer refund has succeeded.
 * Delivery fulfillment status is left untouched: a delivered package stays
 * delivered when the payment is refunded later.
 *
 * Courier earnings move only when `clawbackCourier` is true (no successful
 * Connect transfer, or that transfer was reversed). Affiliate commission
 * uses the stored ledger amount, not a second percentage engine.
 */
export async function reconcileDeliveryRefundBooks(
  db: PrismaClient,
  input: {
    deliveryOrderId: string;
    refundedCents: number;
    chargeCents: number;
    stripeRefundId?: string | null;
    clawbackCourier: boolean;
    affiliateSourceOrderId: string | null;
  },
): Promise<DeliveryRefundBooksResult> {
  const empty: DeliveryRefundBooksResult = {
    courierDeltaCents: 0,
    courierTargetCents: 0,
    affiliateReversedCents: 0,
    affiliateRemainderCents: 0,
    deliveryStatus: null,
  };
  if (!hasMethod(db, 'transaction', 'findUnique') || !hasMethod(db, 'deliveryOrder', 'findUnique')) {
    return { ...empty, skipped: true };
  }
  if (input.refundedCents <= 0) return empty;

  const order = await db.deliveryOrder.findUnique({
    where: { id: input.deliveryOrderId },
    select: {
      id: true,
      status: true,
      quotedFeeCents: true,
      deliveryFee: true,
      deliveryProfileId: true,
    },
  });
  if (!order) return empty;

  const gross = order.quotedFeeCents ?? order.deliveryFee ?? 0;
  const allocation = splitDeliveryCommission(gross).providerNetPayoutCents;
  const target = input.clawbackCourier
    ? courierClawbackCents({
        courierAllocationCents: allocation,
        refundedCents: input.refundedCents,
        chargeCents: input.chargeCents,
      })
    : 0;

  let courierDelta = 0;
  if (target > 0 && order.deliveryProfileId && hasMethod(db, 'refund', 'create')) {
    courierDelta = await clawbackCourierEarnings(db, {
      deliveryOrderId: order.id,
      deliveryProfileId: order.deliveryProfileId,
      transactionId: `txn_delivery_${order.id}`,
      allocationCents: allocation,
      targetCents: target,
      stripeRefundId: input.stripeRefundId ?? null,
    });
  }

  const affiliate = input.affiliateSourceOrderId
    ? await reconcileAffiliateLedger(db, {
        deliveryOrderId: order.id,
        sourceOrderId: input.affiliateSourceOrderId,
        refundedCents: input.refundedCents,
        chargeCents: input.chargeCents,
      })
    : { reversedCents: 0, remainderCents: 0 };

  return {
    courierDeltaCents: courierDelta,
    courierTargetCents: target,
    affiliateReversedCents: affiliate.reversedCents,
    affiliateRemainderCents: affiliate.remainderCents,
    deliveryStatus: order.status,
  };
}

async function clawbackCourierEarnings(
  db: PrismaClient,
  input: {
    deliveryOrderId: string;
    deliveryProfileId: string;
    transactionId: string;
    allocationCents: number;
    targetCents: number;
    stripeRefundId: string | null;
  },
) {
  const txn = await db.transaction.findUnique({
    where: { id: input.transactionId },
    include: { Refund: true },
  });
  if (!txn) return 0;

  const listed = hasMethod(db, 'refund', 'findMany')
    ? await db.refund.findMany({ where: { transactionId: txn.id } })
    : ((txn as { Refund?: RefundRow[] }).Refund ?? []);
  const prior = listed
    .filter((row) => isEarningsRefund(row.id, input.deliveryOrderId))
    .reduce((sum, row) => sum + row.amountCents, 0);
  const delta = input.targetCents - prior;
  if (delta <= 0) return 0;

  const refundId = earningsRefundId(input.deliveryOrderId, input.targetCents);
  try {
    await db.refund.create({
      data: {
        id: refundId,
        transactionId: txn.id,
        amountCents: delta,
        providerRef: input.stripeRefundId
          ? `earnings_clawback:${input.stripeRefundId}`
          : 'earnings_clawback',
      },
    });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'P2002') return 0;
    throw error;
  }

  if (hasMethod(db, 'deliveryProfile', 'update')) {
    await db.deliveryProfile.update({
      where: { id: input.deliveryProfileId },
      data: { totalEarnings: { decrement: delta } },
    });
  }
  if (input.targetCents >= input.allocationCents && hasMethod(db, 'transaction', 'update')) {
    await db.transaction.update({
      where: { id: txn.id },
      data: { status: 'REFUNDED', updatedAt: new Date() },
    });
  }
  return delta;
}

function isEarningsRefund(id: string, deliveryOrderId: string) {
  return (
    id.startsWith(`refund_delivery_earnings_${deliveryOrderId}_`) ||
    id === `refund_delivery_ledger_${deliveryOrderId}`
  );
}

async function reconcileAffiliateLedger(
  db: PrismaClient,
  input: {
    deliveryOrderId: string;
    sourceOrderId: string;
    refundedCents: number;
    chargeCents: number;
  },
) {
  if (!hasMethod(db, 'commissionLedger', 'findMany')) {
    return { reversedCents: 0, remainderCents: 0 };
  }
  const full = input.chargeCents > 0 && input.refundedCents >= input.chargeCents;
  if (full) {
    await processCommissionReversal({
      reversalEventId: `delivery_aff_${input.deliveryOrderId}_full`,
      eventType: 'REFUND',
      refundedAmountCents: input.refundedCents,
      chargeAmountCents: input.chargeCents,
      orderId: input.sourceOrderId,
      db,
    });
  }

  const originals = (await db.commissionLedger.findMany({
    where: {
      eventType: CommissionLedgerEventType.ORDER_PAID,
      OR: [
        { eventId: { startsWith: `${input.sourceOrderId}:` } },
        { eventId: { startsWith: `${input.sourceOrderId}_` } },
      ],
    },
  })) as LedgerRow[];

  let reversedCents = 0;
  let remainderCents = 0;
  for (const ledger of originals) {
    if (ledger.amountCents <= 0) continue;
    if (ledger.eventId.startsWith('delivery_aff_keep_')) continue;
    const desired = proportionalCents(ledger.amountCents, input.refundedCents, input.chargeCents);
    const closeId = `delivery_aff_close_${input.deliveryOrderId}_${ledger.id}`;
    const closed = (await db.commissionLedger.findUnique({
      where: { eventId: closeId },
    })) as LedgerRow | null;
    if (full) {
      if (!closed) await topUpShortReversal(db, ledger, input, desired);
      await reverseKeepRows(db, ledger.id, input.deliveryOrderId);
      reversedCents += desired;
      continue;
    }
    if (ledger.status === CommissionLedgerStatus.PAID) {
      await topUpShortReversal(db, ledger, input, desired);
      reversedCents += desired;
      continue;
    }
    const booked = await rebookPartialCommission(db, ledger, input, desired);
    reversedCents += booked.reversedCents;
    remainderCents += booked.remainderCents;
  }
  return { reversedCents, remainderCents };
}

async function topUpShortReversal(
  db: PrismaClient,
  ledger: LedgerRow,
  input: { deliveryOrderId: string; refundedCents: number; chargeCents: number },
  desired: number,
) {
  const adjustments = (await db.commissionLedger.findMany({
    where: { eventId: { startsWith: `delivery_aff_${input.deliveryOrderId}_` } },
  })) as LedgerRow[];
  const linked = adjustments.filter(
    (row) => asMeta(row.meta).originalLedgerId === ledger.id && row.amountCents < 0,
  );
  const already = linked.reduce((sum, row) => sum + Math.abs(row.amountCents), 0);
  const delta = desired - already;
  if (delta <= 0) return 0;
  const primary = `delivery_aff_${input.deliveryOrderId}_${input.refundedCents}_${ledger.id}`;
  const eventId = linked.some((row) => row.eventId === primary) ? `${primary}_topup` : primary;
  await db.commissionLedger.create({
    data: {
      eventId,
      eventType: CommissionLedgerEventType.REFUND,
      affiliateId: ledger.affiliateId,
      amountCents: -delta,
      currency: eur(ledger.currency),
      status: CommissionLedgerStatus.REVERSED,
      availableAt: null,
      meta: {
        originalLedgerId: ledger.id,
        originalEventId: ledger.eventId,
        refundAmountCents: delta,
        refundedAmountCents: input.refundedCents,
        chargeAmountCents: input.chargeCents,
        adjustment: 'DELIVERY_REFUND_TOPUP',
      },
    },
  });
  if (ledger.status !== CommissionLedgerStatus.REVERSED) {
    await db.commissionLedger.update({
      where: { id: ledger.id },
      data: { status: CommissionLedgerStatus.REVERSED },
    });
  }
  return delta;
}

async function rebookPartialCommission(
  db: PrismaClient,
  ledger: LedgerRow,
  input: { deliveryOrderId: string; refundedCents: number; chargeCents: number },
  desired: number,
) {
  const closeId = `delivery_aff_close_${input.deliveryOrderId}_${ledger.id}`;
  const existingClose = (await db.commissionLedger.findUnique({
    where: { eventId: closeId },
  })) as LedgerRow | null;
  if (!existingClose) {
    await db.commissionLedger.create({
      data: {
        eventId: closeId,
        eventType: CommissionLedgerEventType.REFUND,
        affiliateId: ledger.affiliateId,
        amountCents: -ledger.amountCents,
        currency: eur(ledger.currency),
        status: CommissionLedgerStatus.REVERSED,
        availableAt: null,
        meta: {
          originalLedgerId: ledger.id,
          originalEventId: ledger.eventId,
          adjustment: 'REBOOK_REMAINDER',
          refundedAmountCents: input.refundedCents,
          chargeAmountCents: input.chargeCents,
          closedCents: ledger.amountCents,
          remainderCents: ledger.amountCents - desired,
        },
      },
    });
    if (ledger.status !== CommissionLedgerStatus.REVERSED) {
      await db.commissionLedger.update({
        where: { id: ledger.id },
        data: { status: CommissionLedgerStatus.REVERSED },
      });
      ledger.status = CommissionLedgerStatus.REVERSED;
    }
  }
  const remainder = Math.max(0, ledger.amountCents - desired);
  await syncRemainder(db, ledger, input, remainder);
  return { reversedCents: desired, remainderCents: remainder };
}

async function syncRemainder(
  db: PrismaClient,
  ledger: LedgerRow,
  input: { deliveryOrderId: string; refundedCents: number },
  remainder: number,
) {
  const keepEventId = `delivery_aff_keep_${ledger.id}_${input.refundedCents}`;
  const keeps = (await db.commissionLedger.findMany({
    where: { eventId: { startsWith: `delivery_aff_keep_${ledger.id}` } },
  })) as LedgerRow[];
  const payable = keeps.filter(
    (row) =>
      row.amountCents > 0 &&
      (row.status === CommissionLedgerStatus.PENDING || row.status === CommissionLedgerStatus.AVAILABLE),
  );
  const current = payable.find((row) => row.eventId === keepEventId) ?? payable[0] ?? null;
  if (current && current.eventId === keepEventId && current.amountCents === remainder) return;
  if (current) {
    await db.commissionLedger.update({
      where: { id: current.id },
      data: { status: CommissionLedgerStatus.REVERSED },
    });
    await db.commissionLedger.create({
      data: {
        eventId: `delivery_aff_keep_rev_${current.id}`,
        eventType: CommissionLedgerEventType.REFUND,
        affiliateId: current.affiliateId,
        amountCents: -current.amountCents,
        currency: eur(current.currency),
        status: CommissionLedgerStatus.REVERSED,
        availableAt: null,
        meta: {
          originalLedgerId: current.id,
          adjustment: 'REMAINDER_REPLACED',
          deliveryOrderId: input.deliveryOrderId,
        },
      },
    });
  }
  if (remainder <= 0) return;
  const already = keeps.find((row) => row.eventId === keepEventId);
  if (already) return;
  await db.commissionLedger.create({
    data: {
      eventId: keepEventId,
      eventType: CommissionLedgerEventType.ORDER_PAID,
      affiliateId: ledger.affiliateId,
      amountCents: remainder,
      currency: eur(ledger.currency),
      status: CommissionLedgerStatus.PENDING,
      availableAt: ledger.availableAt ?? null,
      ...(ledger.businessSubscriptionId
        ? { businessSubscriptionId: ledger.businessSubscriptionId }
        : {}),
      meta: {
        originalLedgerId: ledger.id,
        adjustment: 'REBOOK_REMAINDER',
        deliveryOrderId: input.deliveryOrderId,
        refundedAmountCents: input.refundedCents,
      },
    },
  });
}

async function reverseKeepRows(db: PrismaClient, ledgerId: string, deliveryOrderId: string) {
  const keeps = (await db.commissionLedger.findMany({
    where: { eventId: { startsWith: `delivery_aff_keep_${ledgerId}` } },
  })) as LedgerRow[];
  for (const keep of keeps) {
    if (keep.amountCents <= 0 || keep.status === CommissionLedgerStatus.REVERSED) continue;
    const reversalId = `delivery_aff_keep_rev_${keep.id}`;
    const existing = await db.commissionLedger.findUnique({ where: { eventId: reversalId } });
    if (!existing) {
      await db.commissionLedger.create({
        data: {
          eventId: reversalId,
          eventType: CommissionLedgerEventType.REFUND,
          affiliateId: keep.affiliateId,
          amountCents: -keep.amountCents,
          currency: eur(keep.currency),
          status: CommissionLedgerStatus.REVERSED,
          availableAt: null,
          meta: {
            originalLedgerId: keep.id,
            adjustment: 'FULL_REFUND_AFTER_PARTIAL',
            deliveryOrderId,
          },
        },
      });
    }
    if (keep.status !== CommissionLedgerStatus.REVERSED) {
      await db.commissionLedger.update({
        where: { id: keep.id },
        data: { status: CommissionLedgerStatus.REVERSED },
      });
    }
  }
}
