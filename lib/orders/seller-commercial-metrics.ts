/**
 * Canonical seller commercial Order metrics (omzet / order counts).
 *
 * Shared SoT for:
 * - /api/seller/dashboard/stats (getStatsForPeriod)
 * - /api/earnings/combined (seller totalEarnings / totalOrders)
 *
 * Rules:
 * - Only Stripe-paid commercial Orders for this sellerProfile
 * - Exclude SUB-* subscription rows
 * - Exclude CANCELLED / REFUNDED (never count as omzet)
 * - Respect current Stripe mode (cs_test_ vs cs_live_)
 * - Does NOT include CommunityOrder / Agreement / DeliveryRequest deals
 */
import type { PrismaClient } from '@prisma/client';
import { matchesCurrentMode, STRIPE_SESSION_ID_PREFIX } from '@/lib/stripe';

export const SELLER_COMMERCIAL_EXCLUDED_STATUSES = [
  'CANCELLED',
  'REFUNDED',
] as const;

export type SellerCommercialOrderRow = {
  id: string;
  status: string;
  stripeSessionId: string | null;
  createdAt?: Date;
  items: Array<{ priceCents: number; quantity: number }>;
};

export function sellerCommercialOrderWhere(sellerProfileId: string) {
  return {
    stripeSessionId: { startsWith: STRIPE_SESSION_ID_PREFIX },
    NOT: { orderNumber: { startsWith: 'SUB-' } },
    status: { notIn: [...SELLER_COMMERCIAL_EXCLUDED_STATUSES] },
    items: {
      some: {
        Product: { sellerId: sellerProfileId },
      },
    },
  } as const;
}

export function grossSellerItemCents(
  orders: Array<{ items: Array<{ priceCents: number; quantity: number }> }>,
): number {
  return orders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) => itemSum + item.priceCents * item.quantity,
        0,
      ),
    0,
  );
}

export function filterOrdersByStripeMode<
  T extends { stripeSessionId: string | null },
>(orders: T[]): T[] {
  return orders.filter(
    (order) =>
      Boolean(order.stripeSessionId) &&
      matchesCurrentMode(order.stripeSessionId),
  );
}

/**
 * All-time seller commercial gross + order count (current Stripe mode).
 */
export async function getSellerCommercialLifetimeMetrics(
  prisma: PrismaClient,
  sellerProfileId: string,
): Promise<{ totalEarningsCents: number; totalOrders: number }> {
  const allOrders = await prisma.order.findMany({
    where: sellerCommercialOrderWhere(sellerProfileId),
    select: {
      id: true,
      status: true,
      stripeSessionId: true,
      items: {
        where: { Product: { sellerId: sellerProfileId } },
        select: { priceCents: true, quantity: true },
      },
    },
    take: 1000,
  });

  const orders = filterOrdersByStripeMode(allOrders);
  return {
    totalEarningsCents: grossSellerItemCents(orders),
    totalOrders: orders.length,
  };
}
