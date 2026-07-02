export const DELIVERY_ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED',
] as const;

export type DeliveryOrderStatus = (typeof DELIVERY_ORDER_STATUSES)[number];

const ALLOWED: Record<DeliveryOrderStatus, DeliveryOrderStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PICKED_UP', 'CANCELLED'],
  PICKED_UP: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export type StatusTransitionResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Validates delivery order status transitions (update-status route).
 * ACCEPTED from PENDING must go through the accept endpoint.
 */
export function assertDeliveryStatusTransition(
  current: string,
  next: string
): StatusTransitionResult {
  if (!DELIVERY_ORDER_STATUSES.includes(next as DeliveryOrderStatus)) {
    return { ok: false, error: 'Ongeldige status' };
  }

  const cur = current as DeliveryOrderStatus;
  const nxt = next as DeliveryOrderStatus;

  if (cur === nxt) {
    return { ok: false, error: 'Status is al bijgewerkt' };
  }

  if (cur === 'DELIVERED' || cur === 'CANCELLED') {
    return { ok: false, error: 'Deze opdracht kan niet meer worden gewijzigd' };
  }

  if (nxt === 'ACCEPTED') {
    return {
      ok: false,
      error: 'Gebruik de accept-knop om opdrachten te accepteren',
    };
  }

  if (!ALLOWED[cur]?.includes(nxt)) {
    return {
      ok: false,
      error: `Statusovergang ${cur} → ${nxt} is niet toegestaan`,
    };
  }

  return { ok: true };
}

/** Re-open pool for another deliverer when cancelled before pickup. */
export function shouldReopenDeliveryAfterCancel(
  currentStatus: string
): boolean {
  return currentStatus === 'ACCEPTED';
}
