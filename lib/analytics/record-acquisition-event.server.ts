import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isServiceMarketplaceCategory } from '@/lib/analytics/acquisition-kpi-dictionary';
import {
  orderEconomicsDecision,
  type OrderEconomicsInput,
} from '@/lib/analytics/order-economics';

const ENTITY = 'ACQUISITION';

export async function recordAcquisitionEvent(input: {
  eventName: string;
  dedupeKey: string;
  userId?: string | null;
  properties?: Record<string, unknown>;
}): Promise<{ recorded: boolean; duplicate: boolean }> {
  const eventType = input.eventName;
  const entityId = input.dedupeKey;
  try {
    return await prisma.$transaction(async (tx) => {
      // Serializes check-and-insert for this key (webhook retry, double client/server).
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${eventType}:${entityId}`})::bigint)`;
      const existing = await tx.analyticsEvent.findFirst({
        where: { eventType, entityType: ENTITY, entityId },
        select: { id: true },
      });
      if (existing) return { recorded: false, duplicate: true };

      await tx.analyticsEvent.create({
        data: {
          eventType,
          entityType: ENTITY,
          entityId,
          userId: input.userId ?? null,
          metadata: (input.properties ?? {}) as Prisma.InputJsonValue,
        },
      });
      return { recorded: true, duplicate: false };
    });
  } catch (err) {
    const again = await prisma.analyticsEvent.findFirst({
      where: { eventType, entityType: ENTITY, entityId },
      select: { id: true },
    });
    if (again) return { recorded: false, duplicate: true };
    console.error('[acquisition-event]', eventType, err);
    return { recorded: false, duplicate: false };
  }
}

export async function recordListingPublished(input: {
  userId: string;
  productId: string;
  category?: string | null;
  marketplaceCategory?: string | null;
}): Promise<void> {
  const properties = {
    product_id: input.productId,
    category: input.category ?? null,
    marketplace_category: input.marketplaceCategory ?? null,
  };
  await recordAcquisitionEvent({
    eventName: 'listing_published',
    dedupeKey: `listing:${input.productId}`,
    userId: input.userId,
    properties,
  });
  if (!isServiceMarketplaceCategory(input.marketplaceCategory)) return;
  await recordAcquisitionEvent({
    eventName: 'service_published',
    dedupeKey: `service:${input.productId}`,
    userId: input.userId,
    properties,
  });
  await recordAcquisitionEvent({
    eventName: 'service_provider_activated',
    dedupeKey: `service-provider:${input.userId}`,
    userId: input.userId,
    properties,
  });
}

export async function recordConfirmedOrderEconomics(
  orderId: string,
  stripePaymentStatus?: string | null,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      status: true,
      totalAmount: true,
      paymentMethod: true,
      hcCapturedHc: true,
      items: {
        select: {
          Product: { select: { seller: { select: { userId: true } } } },
        },
      },
    },
  });
  if (!order) return;

  const decision = orderEconomicsDecision({
    status: order.status,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    hcCapturedHc: order.hcCapturedHc,
    stripePaymentStatus,
  } satisfies OrderEconomicsInput);
  if (!decision.transaction) return;

  if (decision.purchaseEurCents != null) {
    await recordAcquisitionEvent({
      eventName: 'purchase',
      dedupeKey: `purchase:${order.id}`,
      userId: order.userId,
      properties: {
        order_id: order.id,
        value_cents: decision.purchaseEurCents,
        currency: 'EUR',
        kind: order.paymentMethod === 'MIXED_HC_EUR' ? 'mixed' : 'marketplace',
      },
    });
  }

  await recordAcquisitionEvent({
    eventName: 'transaction_completed',
    dedupeKey: `transaction:${order.id}`,
    userId: order.userId,
    properties: {
      order_id: order.id,
      value_cents: decision.purchaseEurCents,
      value_hc: decision.valueHc,
      currency: decision.purchaseEurCents != null ? 'EUR' : 'HC',
    },
  });

  const earlierBuyerOrders = await prisma.order.count({
    where: {
      userId: order.userId,
      id: { not: order.id },
      status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
      OR: [{ totalAmount: { gt: 0 } }, { hcCapturedHc: { gt: 0 } }],
    },
  });
  if (earlierBuyerOrders === 0) {
    await recordAcquisitionEvent({
      eventName: 'buyer_first_transaction',
      dedupeKey: `buyer-first-transaction:${order.userId}`,
      userId: order.userId,
      properties: { order_id: order.id, value_cents: decision.purchaseEurCents },
    });
  } else {
    await recordAcquisitionEvent({
      eventName: 'buyer_repeat_transaction',
      dedupeKey: `buyer-repeat:${order.id}`,
      userId: order.userId,
      properties: { order_id: order.id, value_cents: decision.purchaseEurCents },
    });
  }

  const sellerIds = new Set<string>();
  for (const item of order.items) {
    const sellerUserId = item.Product?.seller?.userId;
    if (sellerUserId) sellerIds.add(sellerUserId);
  }
  for (const sellerUserId of sellerIds) {
    const prior = await prisma.orderItem.count({
      where: {
        orderId: { not: order.id },
        Product: { seller: { userId: sellerUserId } },
        Order: {
          status: { in: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          OR: [{ totalAmount: { gt: 0 } }, { hcCapturedHc: { gt: 0 } }],
        },
      },
    });
    if (prior === 0) {
      await recordAcquisitionEvent({
        eventName: 'seller_first_transaction',
        dedupeKey: `seller-first-transaction:${sellerUserId}`,
        userId: sellerUserId,
        properties: { order_id: order.id, value_cents: decision.purchaseEurCents },
      });
    }
  }
}

export async function recordPaidSubscription(input: {
  userId: string;
  stripeSessionId: string;
  valueCents: number;
  currency: string;
  plan?: string | null;
}): Promise<void> {
  if (!(input.valueCents > 0)) return;
  const properties = {
    value_cents: input.valueCents,
    currency: input.currency.toUpperCase(),
    plan: input.plan ?? null,
    stripe_session_id: input.stripeSessionId,
    kind: 'subscription',
  };
  await recordAcquisitionEvent({
    eventName: 'paid_subscription',
    dedupeKey: `paid-subscription:${input.stripeSessionId}`,
    userId: input.userId,
    properties,
  });
  await recordAcquisitionEvent({
    eventName: 'purchase',
    dedupeKey: `purchase:stripe-session:${input.stripeSessionId}`,
    userId: input.userId,
    properties,
  });
}

export async function recordAffiliateEconomicAction(input: {
  dedupeKey: string;
  userId?: string | null;
  amountCents: number;
  orderId?: string | null;
  invoiceId?: string | null;
}): Promise<void> {
  if (!(input.amountCents > 0)) return;
  await recordAcquisitionEvent({
    eventName: 'affiliate_referred_economic_action',
    dedupeKey: input.dedupeKey,
    userId: input.userId,
    properties: {
      amount_cents: input.amountCents,
      order_id: input.orderId ?? null,
      invoice_id: input.invoiceId ?? null,
    },
  });
}
