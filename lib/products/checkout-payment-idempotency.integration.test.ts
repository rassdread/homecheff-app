import assert from 'node:assert/strict';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';
import { claimCheckoutSession, holdCheckoutStock } from '@/lib/products/courier-stock-hold';
import { confirmReservationAndDecrementStock } from '@/lib/products/stock-reservation';
import { recordCheckoutPaymentIncident } from '@/lib/payments/checkout-payment-incident';

const databaseUrl = process.env.CHECKOUT_TX_DATABASE_URL?.trim();
const productId = '5970b1df-96ab-427d-a949-8ac1f2643377';
const buyerId = 'a33d156f-2ae1-4254-af57-7d75f05a6abe';
const run = databaseUrl ? test : test.skip;

function pooled(url: string): string {
  const parsed = new URL(url);
  if (!parsed.hostname.includes('ep-green-wind-a2cspmqw')) {
    throw new Error('Checkout idempotency integration test refused a non-preview database');
  }
  parsed.searchParams.set('pgbouncer', 'true');
  parsed.searchParams.set('connection_limit', '1');
  parsed.searchParams.set('pool_timeout', '20');
  return parsed.toString();
}

run('a second paid session cannot create another order for the same hold', async () => {
  const prisma = new PrismaClient({ datasources: { db: { url: pooled(databaseUrl!) } } });
  const stamp = Date.now().toString(36);
  const holdId = `v17-idem-${stamp}`;
  const sessionA = `cs_v17a_${stamp}`;
  const sessionB = `cs_v17b_${stamp}`;
  const original = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true },
  });
  const beforeOrders = await prisma.order.count();
  const beforePayouts = await prisma.payout.count();
  const beforeCommissions = await prisma.commissionLedger.count();
  await prisma.product.update({ where: { id: productId }, data: { stock: 4 } });
  try {
    await prisma.$transaction((tx) =>
      holdCheckoutStock(tx, {
        items: [{ productId, quantity: 1 }],
        buyerId,
        preliminaryHoldId: holdId,
      }),
    );
    await prisma.stockReservation.updateMany({
      where: { purchaseKey: holdId },
      data: { checkoutSessionId: sessionB },
    });
    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          userId: buyerId,
          totalAmount: 1500,
          status: 'CONFIRMED',
          stripeSessionId: sessionA,
        },
      });
      await confirmReservationAndDecrementStock(tx, {
        productId,
        quantity: 1,
        stripeSessionId: sessionA,
        holdId,
        inventoryRequired: true,
        buyerId,
      });
    });
    await assert.rejects(
      prisma.$transaction(async (tx) => {
        await tx.order.create({
          data: {
            userId: buyerId,
            totalAmount: 1500,
            status: 'CONFIRMED',
            stripeSessionId: sessionB,
          },
        });
        await confirmReservationAndDecrementStock(tx, {
          productId,
          quantity: 1,
          stripeSessionId: sessionB,
          holdId,
          inventoryRequired: true,
          buyerId,
        });
      }),
      /ALREADY_CONFIRMED/,
    );
    const incident = await recordCheckoutPaymentIncident(prisma, {
      stripeSessionId: sessionB,
      paymentIntentId: null,
      reason: 'Second Checkout Session paid the same hold',
      code: 'ALREADY_CONFIRMED',
      buyerId,
    });
    const orders = await prisma.order.findMany({
      where: { stripeSessionId: { in: [sessionA, sessionB] } },
      select: { stripeSessionId: true },
    });
    const reservation = await prisma.stockReservation.findFirst({
      where: { purchaseKey: holdId },
      select: { status: true, checkoutSessionId: true },
    });
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    assert.deepEqual(orders.map((row) => row.stripeSessionId), [sessionA]);
    assert.equal(reservation?.status, 'CONFIRMED');
    assert.equal(reservation?.checkoutSessionId, sessionA);
    assert.equal(product?.stock, 3);
    assert.equal(incident?.status, 'REFUND_REQUIRED');
    assert.equal(incident?.code, 'ALREADY_CONFIRMED');
    assert.equal((await prisma.order.count()) - beforeOrders, 1);
    assert.equal((await prisma.payout.count()) - beforePayouts, 0);
    assert.equal((await prisma.commissionLedger.count()) - beforeCommissions, 0);
  } finally {
    const created = await prisma.order.findMany({
      where: { stripeSessionId: { in: [sessionA, sessionB] } },
      select: { id: true },
    });
    if (created.length) {
      await prisma.orderItem.deleteMany({ where: { orderId: { in: created.map((row) => row.id) } } });
      await prisma.order.deleteMany({ where: { id: { in: created.map((row) => row.id) } } });
    }
    await prisma.checkoutPaymentIncident.deleteMany({ where: { stripeSessionId: sessionB } });
    await prisma.stockReservation.deleteMany({ where: { purchaseKey: holdId } });
    await prisma.product.update({
      where: { id: productId },
      data: { stock: original?.stock ?? 4 },
    });
    await prisma.$disconnect();
  }
});

run('two concurrent session claims keep one payable session', async () => {
  const first = new PrismaClient({ datasources: { db: { url: pooled(databaseUrl!) } } });
  const second = new PrismaClient({ datasources: { db: { url: pooled(databaseUrl!) } } });
  const stamp = Date.now().toString(36);
  const holdId = `v18-claim-${stamp}`;
  const productIdLocal = productId;
  const original = await first.product.findUnique({ where: { id: productIdLocal }, select: { stock: true } });
  await first.product.update({ where: { id: productIdLocal }, data: { stock: 4 } });
  try {
    await first.$transaction((tx) =>
      holdCheckoutStock(tx, {
        items: [{ productId: productIdLocal, quantity: 1 }],
        buyerId,
        preliminaryHoldId: holdId,
      }),
    );
    const [left, right] = await Promise.all([
      claimCheckoutSession(first, { holdId, sessionId: `cs_left_${stamp}` }),
      claimCheckoutSession(second, { holdId, sessionId: `cs_right_${stamp}` }),
    ]);
    const winners = [left, right].filter((row) => row.claimed);
    assert.equal(winners.length, 1);
    const stored = await first.stockReservation.findFirst({
      where: { purchaseKey: holdId },
      select: { checkoutSessionId: true },
    });
    assert.equal(stored?.checkoutSessionId, winners[0].activeSessionId);
    assert.ok(stored?.checkoutSessionId?.startsWith('cs_'));
  } finally {
    await first.stockReservation.deleteMany({ where: { purchaseKey: holdId } });
    await first.product.update({ where: { id: productIdLocal }, data: { stock: original?.stock ?? 4 } });
    await first.$disconnect();
    await second.$disconnect();
  }
});
