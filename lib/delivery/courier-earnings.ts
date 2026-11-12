import { DELIVERY_DELIVERER_PERCENT } from '@/lib/fees';

export function courierNetFromGrossCents(grossCents: number): number {
  return Math.round((Number(grossCents) || 0) * (DELIVERY_DELIVERER_PERCENT / 100));
}

/** A Stripe transfer id. A payment intent or session id is not a payout. */
export function courierTransferIsPaid(providerRef: string | null | undefined): boolean {
  return typeof providerRef === 'string' && providerRef.startsWith('tr_');
}

/**
 * Ledger ids are `payout_delivery_<deliveryOrderId>` or the older
 * `payout_delivery_<deliveryOrderId>_<timestamp>`. Same shape for txn_delivery_.
 */
export function deliveryOrderIdFromLedgerId(id: string): string | null {
  const marker = id.startsWith('payout_delivery_')
    ? 'payout_delivery_'
    : id.startsWith('txn_delivery_')
      ? 'txn_delivery_'
      : null;
  if (!marker) return null;
  const rest = id.slice(marker.length).replace(/_\d+$/, '');
  return rest || null;
}

export type CourierLedgerPayout = {
  id: string;
  transactionId: string;
  amountCents: number;
  providerRef?: string | null;
};

export type CourierLedgerOrder = {
  id: string;
  status: string;
  orderId?: string | null;
};

export type CourierLedgerSummary = {
  earnedCents: number;
  paidCents: number;
  /** Confirmed transfers whose delivery order row is gone. They stay in the counter. */
  unresolvedTransferCents: number;
};

/** Earned only after the delivery order is DELIVERED. Reserved fees stay out. */
export function summarizeCourierLedger(
  payouts: CourierLedgerPayout[],
  orders: CourierLedgerOrder[],
): CourierLedgerSummary {
  const statusByDeliveryId = new Map(orders.map((order) => [order.id, order.status]));
  const deliveredOrderIds = new Set(
    orders.filter((order) => order.status === 'DELIVERED' && order.orderId).map((order) => order.orderId as string),
  );

  let earnedCents = 0;
  let paidCents = 0;
  let unresolvedTransferCents = 0;
  for (const payout of payouts) {
    const deliveryId =
      deliveryOrderIdFromLedgerId(payout.id) ||
      deliveryOrderIdFromLedgerId(payout.transactionId);
    const orderKnown = deliveryId != null && statusByDeliveryId.has(deliveryId);
    if (!orderKnown && courierTransferIsPaid(payout.providerRef)) {
      unresolvedTransferCents += payout.amountCents;
      paidCents += payout.amountCents;
      continue;
    }
    const earned =
      deliveredOrderIds.has(payout.transactionId) ||
      (deliveryId != null && statusByDeliveryId.get(deliveryId) === 'DELIVERED');
    if (!earned) continue;
    earnedCents += payout.amountCents;
    if (courierTransferIsPaid(payout.providerRef)) paidCents += payout.amountCents;
  }

  return { earnedCents, paidCents, unresolvedTransferCents };
}

/**
 * Delivered earnings plus confirmed transfers whose order row is missing.
 * A missing order does not subtract the transfer. An unexplained stored excess
 * is also left in place when such a transfer exists, and stays visible as reviewCents.
 */
export function nextCourierEarningsCounter(storedCents: number, summary: CourierLedgerSummary) {
  const keptCents = summary.earnedCents + summary.unresolvedTransferCents;
  const nextStoredCents =
    summary.unresolvedTransferCents > 0 ? Math.max(storedCents, keptCents) : summary.earnedCents;
  return {
    keptCents,
    nextStoredCents,
    reviewCents: nextStoredCents - summary.earnedCents,
    reviewRequired: summary.unresolvedTransferCents > 0 || nextStoredCents !== summary.earnedCents,
  };
}
