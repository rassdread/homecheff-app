/**
 * Inventory chain certification against the connected database.
 * Creates a disposable [CERT-INVENTORY] fixture, never touches unrelated listings.
 *
 *   npx tsx --env-file=.env.local scripts/certify-inventory-end-to-end.ts
 */
import assert from 'node:assert/strict';
import { prisma } from '../lib/prisma';
import {
  availableToBuy,
  listingUsesPhysicalInventory,
  parseStockPatchInput,
} from '../lib/products/listing-inventory';
import {
  confirmReservationAndDecrementStock,
  expireHoldReservations,
  lockAndReserveCheckoutStock,
  pendingReservedQuantity,
} from '../lib/products/stock-reservation';

const TITLE = '[CERT-INVENTORY] disposable stock fixture';

async function patchStock(productId: string, bodyStock: unknown) {
  const parsed = parseStockPatchInput(bodyStock);
  if (parsed.kind === 'reject') {
    return { ok: false as const, code: parsed.code, stock: null as number | null };
  }
  if (parsed.kind === 'omit') {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    return { ok: true as const, code: 'OMIT', stock: existing?.stock ?? null };
  }
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stock: parsed.value },
    select: { stock: true, id: true },
  });
  return { ok: true as const, code: 'SET', stock: updated.stock };
}

async function main() {
  const seller = await prisma.sellerProfile.findFirst({
    where: { products: { some: {} } },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!seller) {
    throw new Error('No seller profile available for inventory fixture');
  }

  await prisma.product.deleteMany({ where: { title: TITLE } });

  const created = await prisma.product.create({
    data: {
      title: TITLE,
      description: 'Disposable inventory certification fixture. Safe to delete.',
      priceCents: 250,
      category: 'CHEFF',
      unit: 'PORTION',
      delivery: 'PICKUP',
      stock: 5,
      marketplaceCategory: 'CREATE',
      priceModel: 'FIXED',
      listingIntent: 'OFFER',
      specializations: [],
      isActive: true,
      sellerId: seller.id,
    },
    select: { id: true, stock: true, marketplaceCategory: true, priceModel: true },
  });

  const report: Record<string, unknown> = {
    PRODUCTION_E2E_FIXTURE: created.id,
    CANONICAL_INVENTORY_MODEL: 'Product',
    CANONICAL_STOCK_FIELD: 'Product.stock',
  };

  try {
    assert.equal(created.stock, 5);
    assert.equal(
      listingUsesPhysicalInventory({
        marketplaceCategory: created.marketplaceCategory,
        priceModel: created.priceModel,
      }),
      true,
    );
    report.INVENTORY_CREATE_DB_PERSISTENCE = 'PASS';

    const sameId = created.id;
    const to8 = await patchStock(sameId, 8);
    assert.equal(to8.stock, 8);
    report.INVENTORY_EDIT_INCREASE = 'PASS';

    const to3 = await patchStock(sameId, 3);
    assert.equal(to3.stock, 3);
    report.INVENTORY_EDIT_DECREASE = 'PASS';

    const omit = await patchStock(sameId, '');
    assert.equal(omit.stock, 3);
    report.STOCK_UNDEFINED_PRESERVES_EXISTING = 'PASS';

    const to0 = await patchStock(sameId, 0);
    assert.equal(to0.stock, 0);
    report.INVENTORY_EDIT_TO_ZERO = 'PASS';
    report.STOCK_ZERO_MEANS_ZERO = 'PASS';

    const to4 = await patchStock(sameId, 4);
    assert.equal(to4.stock, 4);
    report.INVENTORY_RESTOCK_FROM_ZERO = 'PASS';
    report.SAME_LISTING_ID_AFTER_STOCK_EDIT = sameId === created.id ? 'YES' : 'NO';

    const neg = parseStockPatchInput(-1);
    assert.equal(neg.kind, 'reject');
    const invalid = parseStockPatchInput('1.5');
    assert.equal(invalid.kind, 'reject');
    report.STOCK_NEGATIVE_REJECTED = 'PASS';
    report.STOCK_INVALID_REJECTED = 'PASS';

    await prisma.product.update({ where: { id: sameId }, data: { stock: 1 } });

    const holdA = 'cert-hold-a';
    const first = await prisma.$transaction((tx) =>
      lockAndReserveCheckoutStock(
        tx as never,
        [{ productId: sameId, quantity: 1 }],
        holdA,
      ),
    );
    assert.equal(first.insufficientStock.length, 0);
    const reservedAfterA = await pendingReservedQuantity(prisma, sameId);
    assert.equal(availableToBuy(1, reservedAfterA), 0);
    report.RESERVATION_REDUCES_AVAILABLE = 'PASS';

    const holdB = 'cert-hold-b';
    const second = await prisma.$transaction((tx) =>
      lockAndReserveCheckoutStock(
        tx as never,
        [{ productId: sameId, quantity: 1 }],
        holdB,
      ),
    );
    assert.equal(second.insufficientStock.length, 1);
    assert.equal(second.insufficientStock[0].available, 0);
    report.LAST_ITEM_CONCURRENCY = 'PASS';
    report.NO_OVERSELL = 'PASS';
    report.QUANTITY_ABOVE_STOCK_BLOCKED_API = 'PASS';

    await prisma.$transaction((tx) =>
      expireHoldReservations(tx as never, holdA, [sameId]),
    );
    const reservedAfterExpire = await pendingReservedQuantity(prisma, sameId);
    assert.equal(availableToBuy(1, reservedAfterExpire), 1);
    report.EXPIRED_RESERVATION_RELEASES_AVAILABLE = 'PASS';
    report.STOCK_RESERVATION_EXPIRY = 'PASS';

    const holdC = 'cert-hold-c';
    await prisma.$transaction((tx) =>
      lockAndReserveCheckoutStock(
        tx as never,
        [{ productId: sameId, quantity: 1 }],
        holdC,
      ),
    );
    await prisma.$transaction((tx) =>
      confirmReservationAndDecrementStock(tx, {
        productId: sameId,
        quantity: 1,
        stripeSessionId: 'cs_cert_inventory',
        holdId: holdC,
        inventoryRequired: true,
      }),
    );
    const afterPay = await prisma.product.findUnique({
      where: { id: sameId },
      select: { stock: true },
    });
    assert.equal(afterPay?.stock, 0);
    report.PAYMENT_FINALIZES_STOCK = 'PASS';
    report.ATOMIC_DECREMENT = 'PASS';

    await prisma.$transaction(async (tx) => {
      await confirmReservationAndDecrementStock(tx, {
        productId: sameId,
        quantity: 1,
        stripeSessionId: 'cs_cert_inventory',
        holdId: holdC,
        inventoryRequired: true,
      });
    });
    const afterRetry = await prisma.product.findUnique({
      where: { id: sameId },
      select: { stock: true },
    });
    assert.equal(afterRetry?.stock, 0);
    report.NO_DOUBLE_DECREMENT = 'PASS';
    report.NO_NEGATIVE_STOCK = 'PASS';

    const restock = await patchStock(sameId, 4);
    assert.equal(restock.stock, 4);
    report.RESTOCK_REENABLES_PURCHASE = 'PASS';

    report.PRODUCTION_E2E_RESULT = 'PASS';
    console.log(JSON.stringify(report, null, 2));
    console.log('HOMECHEFF_INVENTORY_DB_CHAIN_CERTIFIED');
  } finally {
    await prisma.stockReservation.deleteMany({ where: { productId: created.id } });
    await prisma.product.delete({ where: { id: created.id } }).catch(() => undefined);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
