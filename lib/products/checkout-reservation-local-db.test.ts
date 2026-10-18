/**
 * Runs only when CHECKOUT_RESERVATION_LOCAL_DB=1.
 * Talks to the local Postgres named in LOCAL_DATABASE_URL. Never uses .env.local.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';

const enabled = process.env.CHECKOUT_RESERVATION_LOCAL_DB === '1';
const databaseUrl = process.env.LOCAL_DATABASE_URL || '';

describe('checkout reservation local database', { skip: !enabled }, () => {
  it('two buyers cannot both reserve the last unit, and an expired hold does not decrement', async () => {
    assert.ok(databaseUrl.includes('127.0.0.1'), 'refusing a non-local database');
    assert.equal(databaseUrl.includes('neon.tech'), false);
    const prisma = new PrismaClient({
      datasources: { db: { url: databaseUrl } },
    });
    const productId = '9ed42d55-d65c-4b57-8a27-e420b781c228';
    const buyerA = '11111111-1111-4111-8111-111111111111';
    const buyerB = '28282828-2828-4282-8282-282828282828';
    const original = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    assert.ok(original);
    const createdIds: string[] = [];
    try {
      await prisma.product.update({ where: { id: productId }, data: { stock: 1 } });
      const { reserveOrReuseCourierHold } = await import('@/lib/products/courier-stock-hold');
      const { confirmReservationAndDecrementStock } = await import(
        '@/lib/products/stock-reservation'
      );
      const { CheckoutStockConflictError } = await import(
        '@/lib/products/checkout-reservation-policy'
      );

      const [first, second] = await Promise.all([
        reserveOrReuseCourierHold(prisma, { buyerId: buyerA, productId, quantity: 1 }),
        reserveOrReuseCourierHold(prisma, { buyerId: buyerB, productId, quantity: 1 }),
      ]);
      const results = [first, second];
      const created = results.filter((row) => row.kind === 'created' || row.kind === 'reused');
      const blocked = results.filter((row) => row.kind === 'unavailable');
      assert.equal(created.length, 1);
      assert.equal(blocked.length, 1);
      if (created[0].kind === 'created' || created[0].kind === 'reused') {
        createdIds.push(created[0].reservation.id);
      }

      const stockWhileHeld = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      assert.equal(stockWhileHeld?.stock, 1);

      await prisma.stockReservation.update({
        where: { id: createdIds[0] },
        data: { expiresAt: new Date(Date.now() - 60_000), status: 'EXPIRED' },
      });
      await assert.rejects(
        () =>
          prisma.$transaction((tx) =>
            confirmReservationAndDecrementStock(tx, {
              productId,
              quantity: 1,
              stripeSessionId: 'cs_local_expired',
              holdId: createdIds[0],
              inventoryRequired: true,
              buyerId: buyerA,
            }),
          ),
        (err: unknown) => err instanceof CheckoutStockConflictError,
      );
      const stockAfterLatePay = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      assert.equal(stockAfterLatePay?.stock, 1);
    } finally {
      if (createdIds.length > 0) {
        await prisma.stockReservation.deleteMany({ where: { id: { in: createdIds } } });
      }
      await prisma.product.update({
        where: { id: productId },
        data: { stock: original.stock },
      });
      await prisma.$disconnect();
    }
  });
});
