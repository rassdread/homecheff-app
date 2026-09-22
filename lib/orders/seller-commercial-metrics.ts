/**
 * Seller COMMERCIAL ANALYTICS over Orders — activity indicators, not accounting.
 *
 * These are period-scoped performance metrics (how busy was the shop). They are
 * NOT a financial year figure and must never be displayed as revenue, omzet or
 * income. Seller money comes from deriveSellerFinancialYear
 * (lib/finance/seller-financial-year.server.ts), which recognises settled
 * payments, books refunds and uses the settlement-time commission snapshot.
 *
 * Used by:
 * - /api/seller/dashboard/stats (getStatsForPeriod)
 *
 * Rules:
 * - Only Stripe-paid commercial Orders for this sellerProfile
 * - Exclude SUB-* subscription rows
 * - Exclude CANCELLED / REFUNDED (never count as omzet)
 * - Respect current Stripe mode (cs_test_ vs cs_live_)
 * - Does NOT include CommunityOrder / Agreement / DeliveryRequest deals
 */
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

/*
 * getSellerCommercialLifetimeMetrics was removed in Phase 8B. It summed order
 * items lifetime with take: 1000 and was displayed as an accounting figure.
 * Seller money now comes from deriveSellerFinancialYear in
 * lib/finance/seller-financial-year.server.ts. The helpers above remain for
 * period-scoped commercial analytics only.
 */
