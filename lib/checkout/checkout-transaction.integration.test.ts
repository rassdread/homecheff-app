import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { lockCheckoutListings } from '@/lib/checkout/checkout-transaction';
import { holdCheckoutStock } from '@/lib/products/courier-stock-hold';

const databaseUrl = process.env.CHECKOUT_TX_DATABASE_URL?.trim();
const productId = '5970b1df-96ab-427d-a949-8ac1f2643377';
const run = databaseUrl ? test : test.skip;

function pooled(url: string): string {
  const parsed = new URL(url);
  if (!parsed.hostname.includes('ep-green-wind-a2cspmqw')) {
    throw new Error('Checkout transaction integration test refused a non-preview database');
  }
  parsed.searchParams.set('pgbouncer', 'true');
  parsed.searchParams.set('connection_limit', '1');
  parsed.searchParams.set('pool_timeout', '20');
  return parsed.toString();
}

function client(): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: pooled(databaseUrl!) } } });
}

run('a second Prisma client inside the transaction waits out the 5000 ms timeout', async () => {
  const prisma = client();
  const started = Date.now();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.findFirst({ where: { id: productId }, select: { id: true } });
      await prisma.authIdentityLink.findFirst({
        where: { sourceSystem: 'homecheff', sourceUserId: 'v16-contention', status: 'linked' },
        select: { centralUserId: true },
      });
    });
    assert.fail('the separate client should not finish inside the open transaction');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    assert.match(message, /expired transaction|timeout/i);
  } finally {
    const elapsed = Date.now() - started;
    assert.ok(elapsed >= 5000 && elapsed < 8000, `elapsed ${elapsed}`);
    await prisma.$disconnect();
  }
});

run('the transaction client finishes the same identity lookup without waiting', async () => {
  const prisma = client();
  const started = Date.now();
  try {
    const value = await prisma.$transaction(async (tx) => {
      await lockCheckoutListings(tx, [productId]);
      const link = await tx.authIdentityLink.findFirst({
        where: { sourceSystem: 'homecheff', sourceUserId: 'v16-contention', status: 'linked' },
        select: { centralUserId: true },
      });
      return link?.centralUserId ?? 'none';
    });
    assert.equal(value, 'none');
    assert.ok(Date.now() - started < 2000);
  } finally {
    await prisma.$disconnect();
  }
});

run('a thrown transaction rolls back the reservation', async () => {
  const prisma = client();
  const holdId = `v16-rollback-${Date.now()}`;
  try {
    await assert.rejects(
      prisma.$transaction(async (tx) => {
        const held = await holdCheckoutStock(tx, {
          items: [{ productId, quantity: 1 }],
          buyerId: 'v16-rollback-buyer',
          preliminaryHoldId: holdId,
        });
        assert.equal(held.insufficientStock.length, 0);
        throw new Error('v16 rollback');
      }),
      /v16 rollback/,
    );
    const remaining = await prisma.stockReservation.count({
      where: { purchaseKey: holdId },
    });
    assert.equal(remaining, 0);
  } finally {
    await prisma.stockReservation.deleteMany({ where: { purchaseKey: holdId } });
    await prisma.$disconnect();
  }
});

run('one unit cannot be reserved twice and a repeat buyer reuses the hold', async () => {
  const first = client();
  const second = client();
  const repeat = client();
  const buyerA = 'v16-stock-a';
  const buyerB = 'v16-stock-b';
  const holdA = `v16-stock-a-${Date.now()}`;
  const holdB = `v16-stock-b-${Date.now()}`;
  const original = await first.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });
  await first.stockReservation.deleteMany({ where: { productId, status: 'PENDING' } });
  await first.product.update({ where: { id: productId }, data: { stock: 1 } });
  try {
    const [left, right] = await Promise.all([
      first.$transaction(async (tx) => {
        await lockCheckoutListings(tx, [productId]);
        return holdCheckoutStock(tx, {
          items: [{ productId, quantity: 1 }],
          buyerId: buyerA,
          preliminaryHoldId: holdA,
        });
      }),
      second.$transaction(async (tx) => {
        await lockCheckoutListings(tx, [productId]);
        return holdCheckoutStock(tx, {
          items: [{ productId, quantity: 1 }],
          buyerId: buyerB,
          preliminaryHoldId: holdB,
        });
      }),
    ]);
    const insufficient = [left, right].filter((result) => result.insufficientStock.length > 0);
    const reserved = [left, right].filter((result) => result.insufficientStock.length === 0 && !result.error);
    assert.equal(reserved.length, 1);
    assert.equal(insufficient.length, 1);
    const pending = await first.stockReservation.count({
      where: { productId, status: 'PENDING', buyerId: { in: [buyerA, buyerB] } },
    });
    assert.equal(pending, 1);

    const again = await repeat.$transaction((tx) =>
      holdCheckoutStock(tx, {
        items: [{ productId, quantity: 1 }],
        buyerId: reserved[0] === left ? buyerA : buyerB,
        preliminaryHoldId: reserved[0] === left ? holdA : holdB,
      }),
    );
    assert.equal(again.adoptedExistingHold, true);
    const afterRepeat = await first.stockReservation.count({
      where: { productId, status: 'PENDING', buyerId: { in: [buyerA, buyerB] } },
    });
    assert.equal(afterRepeat, 1);
  } finally {
    await first.stockReservation.deleteMany({
      where: { productId, buyerId: { in: [buyerA, buyerB, 'v16-rollback-buyer'] } },
    });
    await first.product.update({
      where: { id: productId },
      data: { stock: original?.stock ?? 4, isActive: true, integrityStatus: 'ACTIVE' },
    });
    await first.$disconnect();
    await second.$disconnect();
    await repeat.$disconnect();
  }
});

run('a listing deactivated while locked is visible to the waiting checkout', async () => {
  const holder = client();
  const waiter = client();
  const original = await holder.product.findUnique({
    where: { id: productId },
    select: { isActive: true, integrityStatus: true },
  });
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    const writer = holder.$transaction(async (tx) => {
      await lockCheckoutListings(tx, [productId]);
      release();
      await new Promise((resolve) => setTimeout(resolve, 400));
      await tx.product.update({ where: { id: productId }, data: { isActive: false } });
    });
    await held;
    const seen = await waiter.$transaction(async (tx) => {
      await lockCheckoutListings(tx, [productId]);
      return tx.product.findUnique({ where: { id: productId }, select: { isActive: true } });
    });
    await writer;
    assert.equal(seen?.isActive, false);
    const reservations = await holder.stockReservation.count({
      where: { productId, buyerId: 'v16-deactivation-buyer' },
    });
    assert.equal(reservations, 0);
  } finally {
    await holder.product.update({
      where: { id: productId },
      data: {
        isActive: original?.isActive ?? true,
        integrityStatus: original?.integrityStatus ?? 'ACTIVE',
      },
    });
    await holder.$disconnect();
    await waiter.$disconnect();
  }
});
