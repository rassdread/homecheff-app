/**
 * Real Postgres races. Runs only when CHECKOUT_RESERVATION_LOCAL_DB=1
 * and LOCAL_DATABASE_URL points at 127.0.0.1. Never uses .env.local.
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'crypto';
import { describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';

const enabled = process.env.CHECKOUT_RESERVATION_LOCAL_DB === '1';
const databaseUrl = process.env.LOCAL_DATABASE_URL || '';

describe('checkout safety v2 database races', { skip: !enabled }, () => {
  it('TEST_A through TEST_E against local Postgres', async () => {
    assert.ok(databaseUrl.includes('127.0.0.1'));
    assert.equal(databaseUrl.includes('neon.tech'), false);
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    const productId = '9ed42d55-d65c-4b57-8a27-e420b781c228';
    const buyerA = '11111111-1111-4111-8111-111111111111';
    const buyerB = '28282828-2828-4282-8282-282828282828';
    const original = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    assert.ok(original);
    const createdReservationIds: string[] = [];
    const createdOrderIds: string[] = [];
    const createdBookingIds: string[] = [];
    const createdProfileIds: string[] = [];
    const createdIncidentIds: string[] = [];

    try {
      const { reserveOrReuseCourierHold, releaseExpiredUnpaidHolds } = await import(
        '@/lib/products/courier-stock-hold'
      );
      const { confirmReservationAndDecrementStock } = await import('@/lib/products/stock-reservation');
      const { CheckoutStockConflictError } = await import('@/lib/products/checkout-reservation-policy');
      const {
        acceptDeliveryBookingRequest,
        cancelPendingBookingForReplacement,
      } = await import('@/lib/delivery/booking-request-service');
      const { reviewCheckoutPaymentIncident } = await import('@/lib/payments/checkout-payment-incident');

      await prisma.product.update({ where: { id: productId }, data: { stock: 1 } });
      const [first, second] = await Promise.all([
        reserveOrReuseCourierHold(prisma, { buyerId: buyerA, productId, quantity: 1 }),
        reserveOrReuseCourierHold(prisma, { buyerId: buyerB, productId, quantity: 1 }),
      ]);
      const winners = [first, second].filter((row) => row.kind === 'created' || row.kind === 'reused');
      const blocked = [first, second].filter((row) => row.kind === 'unavailable');
      assert.equal(winners.length, 1, 'TEST_A');
      assert.equal(blocked.length, 1, 'TEST_A');
      if (winners[0].kind === 'created' || winners[0].kind === 'reused') {
        createdReservationIds.push(winners[0].reservation.id);
        await prisma.stockReservation.delete({ where: { id: winners[0].reservation.id } });
        createdReservationIds.pop();
      }

      const courier = await prisma.user.findUnique({ where: { id: buyerB }, select: { id: true } });
      assert.ok(courier);
      let profile = await prisma.deliveryProfile.findUnique({ where: { userId: buyerB } });
      let createdProfile = false;
      if (!profile) {
        profile = await prisma.deliveryProfile.create({
          data: {
            userId: buyerB,
            age: 30,
            transportation: ['BIKE'],
            maxDistance: 3,
          },
        });
        createdProfile = true;
        createdProfileIds.push(profile.id);
      }
      const booking = await prisma.deliveryBookingRequest.create({
        data: {
          buyerId: buyerA,
          deliveryProfileId: profile.id,
          productId,
          status: 'PENDING',
          acceptanceModeSnapshot: 'MANUAL_CONFIRM',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });
      createdBookingIds.push(booking.id);
      const [accepted, switched] = await Promise.all([
        acceptDeliveryBookingRequest(prisma, {
          requestId: booking.id,
          deliveryProfileUserId: buyerB,
        }),
        cancelPendingBookingForReplacement(prisma, { requestId: booking.id, buyerId: buyerA }),
      ]);
      const bookingAfter = await prisma.deliveryBookingRequest.findUnique({ where: { id: booking.id } });
      const active = [accepted.ok, switched.ok].filter(Boolean);
      assert.equal(active.length, 1, 'TEST_B');
      assert.ok(bookingAfter);
      assert.ok(['ACCEPTED', 'CANCELLED'].includes(bookingAfter.status), 'TEST_B');
      assert.notEqual(bookingAfter.status, 'PENDING', 'TEST_B');

      await prisma.product.update({ where: { id: productId }, data: { stock: 1 } });
      const liveHold = await prisma.stockReservation.create({
        data: {
          productId,
          stripeSessionId: `hold:${randomUUID()}:${productId}`,
          quantity: 1,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          status: 'PENDING',
          buyerId: buyerA,
          purchaseKey: randomUUID(),
          phase: 'CHECKOUT',
        },
      });
      createdReservationIds.push(liveHold.id);
      const [paid, cleaned] = await Promise.all([
        prisma.$transaction((tx) =>
          confirmReservationAndDecrementStock(tx, {
            productId,
            quantity: 1,
            stripeSessionId: 'cs_v2_live',
            holdId: liveHold.id,
            inventoryRequired: true,
            buyerId: buyerA,
          }),
        ),
        releaseExpiredUnpaidHolds(prisma),
      ]);
      void paid;
      void cleaned;
      const liveAfter = await prisma.stockReservation.findUnique({ where: { id: liveHold.id } });
      const stockAfterLive = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      assert.equal(liveAfter?.status, 'CONFIRMED', 'TEST_C live hold');
      assert.equal(stockAfterLive?.stock, 0, 'TEST_C live hold');

      await prisma.product.update({ where: { id: productId }, data: { stock: 1 } });
      const expiredHold = await prisma.stockReservation.create({
        data: {
          productId,
          stripeSessionId: `hold:${randomUUID()}:${productId}`,
          quantity: 1,
          expiresAt: new Date(Date.now() - 60_000),
          status: 'PENDING',
          buyerId: buyerA,
          purchaseKey: randomUUID(),
          phase: 'CHECKOUT',
        },
      });
      createdReservationIds.push(expiredHold.id);
      const expiredResults = await Promise.allSettled([
        prisma.$transaction((tx) =>
          confirmReservationAndDecrementStock(tx, {
            productId,
            quantity: 1,
            stripeSessionId: 'cs_v2_expired',
            holdId: expiredHold.id,
            inventoryRequired: true,
            buyerId: buyerA,
          }),
        ),
        releaseExpiredUnpaidHolds(prisma),
      ]);
      const confirmFailed = expiredResults[0].status === 'rejected';
      assert.equal(confirmFailed, true, 'TEST_C expired hold');
      assert.ok(
        expiredResults[0].status === 'rejected' &&
          expiredResults[0].reason instanceof CheckoutStockConflictError,
      );
      const expiredAfter = await prisma.stockReservation.findUnique({ where: { id: expiredHold.id } });
      const stockAfterExpired = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      assert.equal(expiredAfter?.status, 'EXPIRED', 'TEST_C expired hold');
      assert.equal(stockAfterExpired?.stock, 1, 'TEST_C expired hold');

      await prisma.product.update({ where: { id: productId }, data: { stock: 1 } });
      const sessionId = `cs_v2_${randomUUID()}`;
      const sharedHold = await prisma.stockReservation.create({
        data: {
          productId,
          stripeSessionId: `hold:${randomUUID()}:${productId}`,
          quantity: 1,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          status: 'PENDING',
          buyerId: buyerA,
          purchaseKey: randomUUID(),
          phase: 'CHECKOUT',
          checkoutSessionId: sessionId,
        },
      });
      createdReservationIds.push(sharedHold.id);
      const workers = await Promise.allSettled([
        prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              userId: buyerA,
              totalAmount: 15000,
              status: 'CONFIRMED',
              stripeSessionId: sessionId,
            },
          });
          await confirmReservationAndDecrementStock(tx, {
            productId,
            quantity: 1,
            stripeSessionId: sessionId,
            holdId: sharedHold.id,
            inventoryRequired: true,
            buyerId: buyerA,
          });
          return order.id;
        }),
        prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              userId: buyerA,
              totalAmount: 15000,
              status: 'CONFIRMED',
              stripeSessionId: sessionId,
            },
          });
          await confirmReservationAndDecrementStock(tx, {
            productId,
            quantity: 1,
            stripeSessionId: sessionId,
            holdId: sharedHold.id,
            inventoryRequired: true,
            buyerId: buyerA,
          });
          return order.id;
        }),
      ]);
      const createdOrders = workers.filter((row) => row.status === 'fulfilled');
      assert.equal(createdOrders.length, 1, 'TEST_D');
      if (createdOrders[0].status === 'fulfilled') createdOrderIds.push(createdOrders[0].value);
      const orders = await prisma.order.findMany({ where: { stripeSessionId: sessionId } });
      assert.equal(orders.length, 1, 'TEST_D');
      const stockAfterDoublePay = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      assert.equal(stockAfterDoublePay?.stock, 0, 'TEST_D');
      const sharedAfter = await prisma.stockReservation.findUnique({ where: { id: sharedHold.id } });
      assert.equal(sharedAfter?.status, 'CONFIRMED', 'TEST_D');

      await prisma.product.update({ where: { id: productId }, data: { stock: 1 } });
      const ownerHold = await prisma.stockReservation.create({
        data: {
          productId,
          stripeSessionId: `hold:${randomUUID()}:${productId}`,
          quantity: 1,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          status: 'PENDING',
          buyerId: buyerA,
          purchaseKey: randomUUID(),
          phase: 'CHECKOUT',
        },
      });
      createdReservationIds.push(ownerHold.id);
      const sessionA = `cs_v2_a_${randomUUID()}`;
      const sessionB = `cs_v2_b_${randomUUID()}`;
      const payers = await Promise.allSettled([
        prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: { userId: buyerA, totalAmount: 15000, status: 'CONFIRMED', stripeSessionId: sessionA },
          });
          await confirmReservationAndDecrementStock(tx, {
            productId,
            quantity: 1,
            stripeSessionId: sessionA,
            holdId: ownerHold.id,
            inventoryRequired: true,
            buyerId: buyerA,
          });
          return order.id;
        }),
        prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: { userId: buyerB, totalAmount: 15000, status: 'CONFIRMED', stripeSessionId: sessionB },
          });
          await confirmReservationAndDecrementStock(tx, {
            productId,
            quantity: 1,
            stripeSessionId: sessionB,
            holdId: ownerHold.id,
            inventoryRequired: true,
            buyerId: buyerB,
          });
          return order.id;
        }),
      ]);
      assert.equal(payers[0].status, 'fulfilled', 'TEST_E owner');
      assert.equal(payers[1].status, 'rejected', 'TEST_E other buyer');
      if (payers[0].status === 'fulfilled') createdOrderIds.push(payers[0].value);
      const stockAfterOwners = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true },
      });
      assert.equal(stockAfterOwners?.stock, 0, 'TEST_E');
      const otherOrder = await prisma.order.findFirst({ where: { stripeSessionId: sessionB } });
      assert.equal(otherOrder, null, 'TEST_E');

      const incident = await prisma.checkoutPaymentIncident.create({
        data: {
          stripeSessionId: `cs_v2_incident_${randomUUID()}`,
          status: 'REFUND_REQUIRED',
          reason: 'stock conflict',
          code: 'HOLD_EXPIRED',
          buyerId: buyerA,
        },
      });
      createdIncidentIds.push(incident.id);
      let refundCalls = 0;
      const reviews = await Promise.all([
        reviewCheckoutPaymentIncident(prisma, incident.id, {
          loadFacts: async () => {
            refundCalls += 0;
            return { existingRefundId: null, refundCalls };
          },
        }),
        reviewCheckoutPaymentIncident(prisma, incident.id, {
          loadFacts: async () => ({ existingRefundId: null, refundCalls: 0 }),
        }),
      ]);
      assert.equal(reviews.filter((row) => row.claimed).length, 1);
      const stored = await prisma.checkoutPaymentIncident.findUnique({ where: { id: incident.id } });
      assert.equal(stored?.status, 'MANUAL_REVIEW');
      assert.equal(stored?.resolution, 'AUTO_REFUND_BLOCKED');
      assert.equal(stored?.refundId, null);
      if (createdProfile) {
        /* profile removed in finally */
      }
    } finally {
      if (createdOrderIds.length > 0) {
        await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
      }
      if (createdIncidentIds.length > 0) {
        await prisma.checkoutPaymentIncident.deleteMany({ where: { id: { in: createdIncidentIds } } });
      }
      if (createdReservationIds.length > 0) {
        await prisma.stockReservation.deleteMany({ where: { id: { in: createdReservationIds } } });
      }
      if (createdBookingIds.length > 0) {
        await prisma.deliveryCalendarEntry.deleteMany({
          where: { bookingRequestId: { in: createdBookingIds } },
        });
        await prisma.deliveryBookingRequest.deleteMany({ where: { id: { in: createdBookingIds } } });
      }
      if (createdProfileIds.length > 0) {
        await prisma.deliveryProfile.deleteMany({ where: { id: { in: createdProfileIds } } });
      }
      await prisma.product.update({ where: { id: productId }, data: { stock: original.stock } });
      await prisma.$disconnect();
    }
  });
});
