/** Pure gate: purchase only after confirmed money, never an estimated price. */

export const CONFIRMED_ORDER_STATUSES = [
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
] as const;

export type OrderEconomicsInput = {
  status: string;
  totalAmount: number;
  paymentMethod?: string | null;
  hcCapturedHc?: number | null;
  /** Stripe Checkout payment_status. Required for EUR. */
  stripePaymentStatus?: string | null;
};

export type OrderEconomicsDecision = {
  purchaseEurCents: number | null;
  transaction: boolean;
  valueHc: number | null;
};

export function orderEconomicsDecision(order: OrderEconomicsInput): OrderEconomicsDecision {
  const none: OrderEconomicsDecision = {
    purchaseEurCents: null,
    transaction: false,
    valueHc: null,
  };
  if (!CONFIRMED_ORDER_STATUSES.includes(order.status as (typeof CONFIRMED_ORDER_STATUSES)[number])) {
    return none;
  }

  const method = order.paymentMethod ?? 'EUR_STRIPE';
  if (method === 'HC_ONLY') {
    const hc = order.hcCapturedHc ?? 0;
    if (hc > 0) {
      return { purchaseEurCents: null, transaction: true, valueHc: hc };
    }
    return none;
  }

  if (order.stripePaymentStatus !== 'paid') return none;
  if (!(order.totalAmount > 0)) return none;

  return {
    purchaseEurCents: order.totalAmount,
    transaction: true,
    valueHc: (order.hcCapturedHc ?? 0) > 0 ? order.hcCapturedHc ?? null : null,
  };
}
