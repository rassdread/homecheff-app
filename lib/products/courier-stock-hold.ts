/**
 * Product holds for named-courier checkout.
 * A hold is created before the courier is asked, and the same row is
 * reused for payment. Courier changes do not move holdUntil later.
 */

import { randomUUID } from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { parseFulfillmentOptions } from '@/lib/marketplace/listing-taxonomy';
import {
  courierResponseDeadline,
  immediateHardHoldUntil,
  paymentDeadlineAfterAccept,
} from '@/lib/products/checkout-reservation-policy';
import { expireCheckoutSessionsWithConfiguredStripe } from '@/lib/payments/checkout-session-expiration';
import { listingUsesPhysicalInventory, availableToBuy, stockHoldSessionId } from '@/lib/products/listing-inventory';
import {
  lockAndReserveCheckoutStock,
  pendingReservedQuantity,
  type InsufficientStockItem,
} from '@/lib/products/stock-reservation';

type Db = PrismaClient | Prisma.TransactionClient;

const inventorySelect = {
  stock: true,
  priceModel: true,
  marketplaceCategory: true,
  category: true,
  fulfillmentOptions: true,
  specializations: true,
  listingIntent: true,
  title: true,
} as const;

function usesInventory(product: {
  priceModel: string | null;
  marketplaceCategory: string | null;
  category: string | null;
  fulfillmentOptions: unknown;
  specializations: string[];
  listingIntent: string | null;
}) {
  return listingUsesPhysicalInventory({
    priceModel: product.priceModel,
    marketplaceCategory: product.marketplaceCategory,
    productCategory: product.category,
    fulfillmentOptions: product.fulfillmentOptions
      ? parseFulfillmentOptions(product.fulfillmentOptions)
      : null,
    specializations: product.specializations,
    listingIntent: product.listingIntent,
  });
}

export async function reserveOrReuseCourierHold(
  prisma: PrismaClient,
  input: { buyerId: string; productId: string; quantity: number },
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${input.productId} FOR UPDATE`;
    const product = await tx.product.findUnique({
      where: { id: input.productId },
      select: inventorySelect,
    });
    if (!product) return { kind: 'missing' as const };
    if (!usesInventory(product)) return { kind: 'skipped' as const };

    const now = new Date();
    const existing = await tx.stockReservation.findFirst({
      where: {
        buyerId: input.buyerId,
        productId: input.productId,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });
    if (existing) {
      if (existing.quantity !== input.quantity) {
        return { kind: 'quantity' as const, available: existing.quantity };
      }
      return { kind: 'reused' as const, reservation: existing, created: false as const };
    }

    const reservedQty = await pendingReservedQuantity(tx as never, input.productId);
    const available = availableToBuy(product.stock, reservedQty);
    if (input.quantity > available) {
      return { kind: 'unavailable' as const, available };
    }

    const holdUntil = immediateHardHoldUntil(now);
    const purchaseKey = randomUUID();
    const reservation = await tx.stockReservation.create({
      data: {
        productId: input.productId,
        stripeSessionId: stockHoldSessionId(purchaseKey, input.productId),
        quantity: input.quantity,
        expiresAt: holdUntil,
        status: 'PENDING',
        buyerId: input.buyerId,
        phase: 'AWAITING_COURIER',
        holdUntil,
        purchaseKey,
      },
    });
    return { kind: 'created' as const, reservation, created: true as const };
  });
}

export async function releaseUnattachedHold(prisma: PrismaClient, reservationId: string) {
  await prisma.stockReservation.updateMany({
    where: { id: reservationId, status: 'PENDING', bookingRequestId: null },
    data: { status: 'CANCELLED' },
  });
}

export async function attachBookingToHold(
  prisma: PrismaClient,
  reservationId: string,
  bookingRequestId: string,
) {
  await prisma.stockReservation.updateMany({
    where: { id: reservationId, status: 'PENDING' },
    data: { bookingRequestId },
  });
}

export async function openPaymentWindowForBooking(
  prisma: Db,
  bookingRequestId: string,
  now = new Date(),
) {
  const holds = await prisma.stockReservation.findMany({
    where: { bookingRequestId, status: 'PENDING' },
  });
  for (const hold of holds) {
    const holdUntil = hold.holdUntil ?? hold.expiresAt;
    const deadline = paymentDeadlineAfterAccept(now, holdUntil);
    const expiresAt =
      deadline.getTime() < hold.expiresAt.getTime() ? deadline : hold.expiresAt;
    await prisma.stockReservation.update({
      where: { id: hold.id },
      data: {
        phase: 'AWAITING_PAYMENT',
        paymentDeadline: deadline,
        expiresAt,
        holdUntil,
      },
    });
  }
}

export function bookingResponseDeadline(now: Date, holdUntil: Date) {
  return courierResponseDeadline(now, holdUntil);
}

export async function holdCheckoutStock(
  tx: Prisma.TransactionClient,
  input: {
    items: Array<{ productId: string; quantity: number }>;
    buyerId: string;
    preliminaryHoldId: string;
    bookingRequestId?: string | null;
    deliveryMode?: string | null;
    now?: Date;
  },
): Promise<{
  error: string | null;
  code?: string;
  insufficientStock: InsufficientStockItem[];
  effectiveHoldId: string;
  adoptedExistingHold: boolean;
}> {
  const now = input.now ?? new Date();
  const mode = (input.deliveryMode || '').toUpperCase();
  const isShipping = mode === 'SHIPPING' || mode === 'PARCEL_SHIPPING';
  const none = {
    error: null,
    insufficientStock: [] as InsufficientStockItem[],
    effectiveHoldId: input.preliminaryHoldId,
    adoptedExistingHold: false,
  };

  if (!isShipping && input.bookingRequestId) {
    const holds = await tx.stockReservation.findMany({
      where: { bookingRequestId: input.bookingRequestId, buyerId: input.buyerId },
    });
    if (holds.length > 0) {
      if (holds.some((hold) => hold.status === 'CONFIRMED')) {
        return {
          ...none,
          error: 'Deze reservering is al betaald.',
          code: 'RESERVATION_ALREADY_CONFIRMED',
        };
      }
      const pending = holds.filter((hold) => hold.status === 'PENDING');
      if (pending.length === 0) {
        return {
          ...none,
          error:
            'De reservering is verlopen. Controleer opnieuw of het product beschikbaar is.',
          code: 'RESERVATION_EXPIRED',
        };
      }
      for (const hold of pending) {
        const hardEnd = hold.holdUntil ?? hold.expiresAt;
        if (hold.expiresAt.getTime() <= now.getTime() || hardEnd.getTime() <= now.getTime()) {
          return {
            ...none,
            error:
              'De reservering is verlopen. Controleer opnieuw of het product beschikbaar is.',
            code: 'RESERVATION_EXPIRED',
          };
        }
        if (hold.paymentDeadline && hold.paymentDeadline.getTime() <= now.getTime()) {
          return {
            ...none,
            error: 'De betaaltermijn is verstreken.',
            code: 'PAYMENT_DEADLINE',
          };
        }
        const item = input.items.find((row) => row.productId === hold.productId);
        if (!item || item.quantity !== hold.quantity) {
          return {
            ...none,
            error: 'De gereserveerde hoeveelheid komt niet overeen.',
            code: 'QTY_MISMATCH',
          };
        }
      }
      const covered = new Set(pending.map((hold) => hold.productId));
      const uncovered = input.items.filter((item) => !covered.has(item.productId));
      if (uncovered.length > 0) {
        const locked = await lockAndReserveCheckoutStock(
          tx as never,
          uncovered,
          input.preliminaryHoldId,
          { buyerId: input.buyerId },
        );
        if (locked.insufficientStock.length > 0) {
          return { ...none, insufficientStock: locked.insufficientStock };
        }
      }
      return {
        error: null,
        insufficientStock: [],
        effectiveHoldId: pending[0].purchaseKey || input.preliminaryHoldId,
        adoptedExistingHold: true,
      };
    }
  }

  if (!isShipping && !input.bookingRequestId) {
    const holds = await tx.stockReservation.findMany({
      where: {
        buyerId: input.buyerId,
        productId: { in: input.items.map((item) => item.productId) },
        status: 'PENDING',
        expiresAt: { gt: now },
      },
    });
    if (holds.length > 0) {
      for (const hold of holds) {
        if (hold.paymentDeadline && hold.paymentDeadline.getTime() <= now.getTime()) {
          return {
            ...none,
            error: 'De betaaltermijn is verstreken.',
            code: 'PAYMENT_DEADLINE',
          };
        }
        const item = input.items.find((row) => row.productId === hold.productId);
        if (item && item.quantity !== hold.quantity) {
          return {
            ...none,
            error: 'De gereserveerde hoeveelheid komt niet overeen.',
            code: 'QTY_MISMATCH',
          };
        }
      }
      const covered = new Set(holds.map((hold) => hold.productId));
      const uncovered = input.items.filter((item) => !covered.has(item.productId));
      if (uncovered.length > 0) {
        const locked = await lockAndReserveCheckoutStock(
          tx as never,
          uncovered,
          input.preliminaryHoldId,
          { buyerId: input.buyerId },
        );
        if (locked.insufficientStock.length > 0) {
          return { ...none, insufficientStock: locked.insufficientStock };
        }
      }
      return {
        error: null,
        insufficientStock: [],
        effectiveHoldId: holds[0].purchaseKey || input.preliminaryHoldId,
        adoptedExistingHold: true,
      };
    }
  }

  const locked = await lockAndReserveCheckoutStock(
    tx as never,
    input.items,
    input.preliminaryHoldId,
    { buyerId: input.buyerId },
  );
  return { ...none, insufficientStock: locked.insufficientStock };
}

export async function bindCheckoutSession(
  prisma: PrismaClient,
  input: { holdId: string; sessionId: string; productIds: string[] },
) {
  const holdKeys = input.productIds.map((productId) =>
    stockHoldSessionId(input.holdId, productId),
  );
  await prisma.stockReservation.updateMany({
    where: {
      status: 'PENDING',
      OR: [{ purchaseKey: input.holdId }, { stripeSessionId: { in: holdKeys } }],
    },
    data: { checkoutSessionId: input.sessionId, phase: 'CHECKOUT' },
  });
}

async function releaseBookingCapacity(prisma: PrismaClient, bookingIds: string[]) {
  if (bookingIds.length === 0) return;
  await prisma.deliveryBookingRequest.updateMany({
    where: {
      id: { in: bookingIds },
      status: { in: ['PENDING', 'ACCEPTED', 'AUTO_CONFIRMED'] },
    },
    data: { status: 'EXPIRED', updatedAt: new Date() },
  });
  await prisma.deliveryCalendarEntry.updateMany({
    where: {
      bookingRequestId: { in: bookingIds },
      deliveryOrderId: null,
      status: 'CONFIRMED',
    },
    data: { status: 'CANCELLED' },
  });
}

export async function releaseUnpaidCheckoutHold(
  prisma: PrismaClient,
  input: { checkoutSessionId?: string | null; stockHoldId?: string | null },
) {
  if (input.checkoutSessionId) {
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: input.checkoutSessionId },
      select: { id: true },
    });
    if (order) return { released: false, reason: 'PAID' as const };
  }

  const or: Prisma.StockReservationWhereInput[] = [];
  if (input.checkoutSessionId) or.push({ checkoutSessionId: input.checkoutSessionId });
  if (input.stockHoldId) or.push({ purchaseKey: input.stockHoldId });
  if (or.length === 0) return { released: false, reason: 'NONE' as const };

  const confirmed = await prisma.stockReservation.findFirst({
    where: { status: 'CONFIRMED', OR: or },
    select: { id: true },
  });
  if (confirmed) return { released: false, reason: 'CONFIRMED' as const };

  const pending = await prisma.stockReservation.findMany({
    where: { status: 'PENDING', OR: or },
    select: { id: true, bookingRequestId: true },
  });
  if (pending.length === 0) return { released: false, reason: 'NONE' as const };

  const expired = await prisma.stockReservation.updateMany({
    where: { id: { in: pending.map((row) => row.id) }, status: 'PENDING' },
    data: { status: 'EXPIRED' },
  });
  if (expired.count === 0) return { released: false, reason: 'CONFIRMED' as const };

  const bookingIds = pending
    .map((row) => row.bookingRequestId)
    .filter((id): id is string => Boolean(id));
  await releaseBookingCapacity(prisma, bookingIds);
  return { released: true, reason: 'RELEASED' as const };
}

export async function releaseExpiredUnpaidHolds(prisma: PrismaClient, now = new Date()) {
  const expiring = await prisma.stockReservation.findMany({
    where: { status: 'PENDING', expiresAt: { lt: now } },
    select: { id: true, buyerId: true, bookingRequestId: true, checkoutSessionId: true },
  });
  if (expiring.length === 0) return { cleaned: 0, buyers: [] as string[] };

  const released: typeof expiring = [];
  for (const row of expiring) {
    const claimed = await prisma.stockReservation.updateMany({
      where: { id: row.id, status: 'PENDING', expiresAt: { lt: now } },
      data: { status: 'EXPIRED' },
    });
    if (claimed.count === 1) released.push(row);
  }
  const updated = { count: released.length };
  const bookingIds = released
    .map((row) => row.bookingRequestId)
    .filter((id): id is string => Boolean(id));
  await releaseBookingCapacity(prisma, bookingIds);

  await expireCheckoutSessionsWithConfiguredStripe(
    released
      .map((row) => row.checkoutSessionId)
      .filter((id): id is string => Boolean(id)),
  );

  return {
    cleaned: updated.count,
    buyers: released
      .map((row) => row.buyerId)
      .filter((id): id is string => Boolean(id)),
  };
}

export async function expireStripeSessionsIfTestMode(sessionIds: string[]) {
  return expireCheckoutSessionsWithConfiguredStripe(sessionIds);
}

export function reservationTiming(
  reservation: {
    phase: string | null;
    holdUntil: Date | null;
    expiresAt: Date;
    paymentDeadline: Date | null;
  } | null,
  now = new Date(),
) {
  if (!reservation) return null;
  const end = reservation.expiresAt;
  return {
    phase: reservation.phase,
    holdUntil: (reservation.holdUntil ?? reservation.expiresAt).toISOString(),
    expiresAt: reservation.expiresAt.toISOString(),
    paymentDeadline: reservation.paymentDeadline?.toISOString() ?? null,
    serverNow: now.toISOString(),
    remainingMs: Math.max(0, end.getTime() - now.getTime()),
    paymentRemainingMs: reservation.paymentDeadline
      ? Math.max(0, reservation.paymentDeadline.getTime() - now.getTime())
      : null,
  };
}
