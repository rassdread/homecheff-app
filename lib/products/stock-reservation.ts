import { listingUsesPhysicalInventory, availableToBuy, stockHoldSessionId, STOCK_RESERVATION_TTL_MS } from '@/lib/products/listing-inventory';
import { parseFulfillmentOptions } from '@/lib/marketplace/listing-taxonomy';

type Tx = {
  $queryRaw: (query: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>;
  product: {
    findUnique: (args: {
      where: { id: string };
      select: Record<string, boolean>;
    }) => Promise<{
      stock: number;
      priceModel: string | null;
      marketplaceCategory: string | null;
      category?: string | null;
      fulfillmentOptions: unknown;
      specializations?: string[] | null;
      listingIntent?: string | null;
      title?: string | null;
    } | null>;
    updateMany: (args: {
      where: { id: string; stock: { gte: number } };
      data: { stock: { decrement: number } };
    }) => Promise<{ count: number }>;
  };
  stockReservation: {
    aggregate: (args: {
      where: {
        productId: string;
        status: 'PENDING';
        expiresAt: { gt: Date };
      };
      _sum: { quantity: true };
    }) => Promise<{ _sum: { quantity: number | null } }>;
    create: (args: {
      data: {
        productId: string;
        stripeSessionId: string;
        quantity: number;
        expiresAt: Date;
        status: 'PENDING';
      };
    }) => Promise<unknown>;
    findFirst: (args: {
      where: Record<string, unknown>;
      select?: Record<string, boolean>;
    }) => Promise<{ id: string; status: string; quantity: number } | null>;
    update: (args: {
      where: { id: string };
      data: Record<string, unknown>;
    }) => Promise<unknown>;
    updateMany: (args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }) => Promise<{ count: number }>;
  };
};

export type InsufficientStockItem = {
  productId: string;
  requested: number;
  available: number;
  title: string;
};

export async function pendingReservedQuantity(
  tx: Pick<Tx, 'stockReservation'>,
  productId: string,
): Promise<number> {
  const reserved = await tx.stockReservation.aggregate({
    where: {
      productId,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    _sum: { quantity: true },
  });
  return reserved._sum.quantity ?? 0;
}

/**
 * Lock product rows, refuse oversell, and create PENDING hold reservations
 * before Stripe session creation.
 */
export async function lockAndReserveCheckoutStock(
  tx: Tx,
  items: Array<{ productId: string; quantity: number }>,
  holdId: string,
): Promise<{ insufficientStock: InsufficientStockItem[] }> {
    const insufficientStock: InsufficientStockItem[] = [];
    const eligible: Array<{
      productId: string;
      quantity: number;
      title: string;
    }> = [];
    const expiresAt = new Date(Date.now() + STOCK_RESERVATION_TTL_MS);

    for (const item of items) {
      await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${item.productId} FOR UPDATE`;

      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: {
          stock: true,
          priceModel: true,
          marketplaceCategory: true,
          category: true,
          fulfillmentOptions: true,
          specializations: true,
          listingIntent: true,
          title: true,
        },
      });

      if (!product) {
        insufficientStock.push({
          productId: item.productId,
          requested: item.quantity,
          available: 0,
          title: 'Onbekend product',
        });
        continue;
      }

      const fulfillmentOptions = product.fulfillmentOptions
        ? parseFulfillmentOptions(product.fulfillmentOptions)
        : null;

      if (
        !listingUsesPhysicalInventory({
          priceModel: product.priceModel,
          marketplaceCategory: product.marketplaceCategory,
          productCategory: product.category,
          fulfillmentOptions,
          specializations: product.specializations,
          listingIntent: product.listingIntent,
        })
      ) {
        continue;
      }

      const reservedQty = await pendingReservedQuantity(tx, item.productId);
      const actuallyAvailable = availableToBuy(product.stock, reservedQty);
      if (item.quantity > actuallyAvailable) {
        insufficientStock.push({
          productId: item.productId,
          requested: item.quantity,
          available: actuallyAvailable,
          title: product.title || 'Product',
        });
        continue;
      }

      eligible.push({
        productId: item.productId,
        quantity: item.quantity,
        title: product.title || 'Product',
      });
    }

    if (insufficientStock.length > 0) {
      return { insufficientStock };
    }

    for (const item of eligible) {
      await tx.stockReservation.create({
        data: {
          productId: item.productId,
          stripeSessionId: stockHoldSessionId(holdId, item.productId),
          quantity: item.quantity,
          expiresAt,
          status: 'PENDING',
        },
      });
    }

    return { insufficientStock };
}

export async function expireHoldReservations(
  tx: Pick<Tx, 'stockReservation'>,
  holdId: string,
  productIds: string[],
): Promise<void> {
  for (const productId of productIds) {
    await tx.stockReservation.updateMany({
      where: {
        stripeSessionId: stockHoldSessionId(holdId, productId),
        status: 'PENDING',
      },
      data: { status: 'EXPIRED' },
    });
  }
}

/** Confirm reservation and decrement Product.stock once. Idempotent on retry. */
export async function confirmReservationAndDecrementStock(
  tx: Pick<Tx, 'product' | 'stockReservation'>,
  input: {
    productId: string;
    quantity: number;
    stripeSessionId: string;
    holdId?: string | null;
    inventoryRequired: boolean;
  },
): Promise<void> {
  if (!input.inventoryRequired) return;

  const orHold = input.holdId
    ? [{ stripeSessionId: stockHoldSessionId(input.holdId, input.productId) }]
    : [];

  const reservation = await tx.stockReservation.findFirst({
    where: {
      productId: input.productId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      OR: [{ stripeSessionId: input.stripeSessionId }, ...orHold],
    },
    select: { id: true, status: true, quantity: true },
  });

  if (reservation?.status === 'CONFIRMED') {
    return;
  }

  const qty = reservation?.quantity ?? input.quantity;

  if (reservation?.status === 'PENDING') {
    await tx.stockReservation.update({
      where: { id: reservation.id },
      data: { status: 'CONFIRMED' },
    });
  }

  const updated = await tx.product.updateMany({
    where: { id: input.productId, stock: { gte: qty } },
    data: { stock: { decrement: qty } },
  });

  if (updated.count !== 1) {
    throw new Error(
      `ATOMIC_STOCK_DECREMENT_FAILED product=${input.productId} qty=${qty}`,
    );
  }
}
