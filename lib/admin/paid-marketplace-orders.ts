import type { Prisma } from '@prisma/client';
import { matchesCurrentMode } from '@/lib/stripe';

/**
 * Paid marketplace gross is buyer order total in cents for the current Stripe mode.
 * Refunded, cancelled, and not-yet-confirmed orders are excluded.
 * This is gross merchandise value, not HomeCheff platform earnings.
 */
export const PAID_MARKETPLACE_ORDER_STATUSES = [
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
] as const;

export function paidMarketplaceOrderWhere(): Prisma.OrderWhereInput {
  return {
    stripeSessionId: { not: null },
    status: { in: [...PAID_MARKETPLACE_ORDER_STATUSES] },
    NOT: { orderNumber: { startsWith: 'SUB-' } },
  };
}

export function currentModeOrders<T extends { stripeSessionId: string | null }>(orders: T[]): T[] {
  return orders.filter((order) => order.stripeSessionId && matchesCurrentMode(order.stripeSessionId));
}

export function sumCurrentModeGrossCents(
  orders: Array<{ totalAmount: number | null; stripeSessionId: string | null }>,
): number {
  return currentModeOrders(orders).reduce((sum, order) => sum + (order.totalAmount || 0), 0);
}
