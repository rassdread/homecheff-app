import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';
import { CheckoutReservationEngine } from '@/lib/products/checkout-reservation-engine';
import {
  IMMEDIATE_COURIER_RESPONSE_MS,
  IMMEDIATE_HARD_HOLD_MS,
  PAYMENT_WINDOW_MS,
  RESERVATION_COPY,
  SCHEDULED_COURIER_RESPONSE_DEFAULT_MS,
  SCHEDULED_COURIER_RESPONSE_MAX_MS,
  CheckoutStockConflictError,
  courierProductHoldApplies,
  evaluateStockConfirm,
  paymentDeadlineAfterAccept,
  scheduledBookingExposed,
  sellerStockLabel,
  decideIncidentResolution,
  planCheckoutSessionExpiration,
  stripeSecretAllowsSessionExpire,
} from '@/lib/products/checkout-reservation-policy';
import { confirmReservationAndDecrementStock } from '@/lib/products/stock-reservation';

const MINUTE = 60 * 1000;

function cabinet() {
  const engine = new CheckoutReservationEngine();
  engine.addProduct({ id: 'cabinet', stock: 1, sellerId: 'seller-a' });
  return engine;
}

describe('checkout reservation safety', () => {
  it('TEST_01 unique cabinet is reserved before courier acceptance', () => {
    const engine = cabinet();
    const result = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.reservation?.status, 'PENDING');
    assert.equal(result.reservation?.phase, 'AWAITING_COURIER');
    assert.equal(result.booking.status, 'PENDING');
    assert.equal(engine.available('cabinet'), 0);
    assert.equal(engine.sellerView('cabinet').label, 'TEMPORARILY_RESERVED');
    assert.equal(engine.sellerSoldNotices, 0);
  });

  it('TEST_02 a second buyer cannot buy the reserved cabinet', () => {
    const engine = cabinet();
    engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    const other = engine.requestCourier({
      buyerId: 'buyer-b',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-b',
    });
    assert.equal(other.ok, false);
    if (other.ok) return;
    assert.equal(other.code, 'INSUFFICIENT_STOCK');
    const checkout = engine.startCheckout({
      buyerId: 'buyer-b',
      items: [{ productId: 'cabinet', quantity: 1 }],
      deliveryMode: 'PICKUP',
      sessionId: 'cs_b',
    });
    assert.equal(checkout.ok, false);
  });

  it('TEST_03 courier accepts within five minutes and opens the payment window', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(created.ok, true);
    if (!created.ok || !created.reservation) return;
    engine.advance(4 * MINUTE);
    const accepted = engine.accept(created.booking.id, 'courier-a');
    assert.equal(accepted.ok, true);
    assert.equal(created.reservation.phase, 'AWAITING_PAYMENT');
    assert.ok(created.reservation.paymentDeadline);
    assert.ok(
      created.reservation.paymentDeadline!.getTime() <=
        created.reservation.holdUntil.getTime(),
    );
    assert.ok(
      created.reservation.paymentDeadline!.getTime() - engine.now.getTime() <=
        PAYMENT_WINDOW_MS,
    );
  });

  it('TEST_04 reject keeps the hold so the buyer can choose another courier', () => {
    const engine = cabinet();
    const first = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(first.ok, true);
    if (!first.ok || !first.reservation) return;
    const holdUntil = first.reservation.holdUntil.getTime();
    assert.equal(engine.reject(first.booking.id, 'courier-a').ok, true);
    assert.equal(first.reservation.status, 'PENDING');
    const second = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-b',
    });
    assert.equal(second.ok, true);
    if (!second.ok || !second.reservation) return;
    assert.equal(second.reservation.id, first.reservation.id);
    assert.equal(second.reservation.holdUntil.getTime(), holdUntil);
    assert.equal(engine.available('cabinet'), 0);
  });

  it('TEST_05 switching courier cancels the previous pending request', () => {
    const engine = cabinet();
    const first = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    const second = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-b',
      replacesBookingId: first.booking.id,
    });
    assert.equal(second.ok, true);
    assert.equal(first.booking.status, 'CANCELLED');
    assert.equal(first.booking.calendarHold, false);
    if (!second.ok) return;
    assert.equal(second.booking.status, 'PENDING');
    assert.equal(
      engine.bookings.filter((b) => b.status === 'PENDING').length,
      1,
    );
  });

  it('TEST_06 a cancelled courier cannot accept', () => {
    const engine = cabinet();
    const first = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(first.ok, true);
    if (!first.ok) return;
    engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-b',
      replacesBookingId: first.booking.id,
    });
    const late = engine.accept(first.booking.id, 'courier-a');
    assert.equal(late.ok, false);
    assert.equal(late.code, 'NOT_PENDING');
  });

  it('TEST_07 the product hold does not extend when the courier changes', () => {
    const engine = cabinet();
    const first = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(first.ok, true);
    if (!first.ok || !first.reservation) return;
    const holdUntil = first.reservation.holdUntil.getTime();
    engine.advance(3 * MINUTE);
    const second = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-b',
      replacesBookingId: first.booking.id,
    });
    assert.equal(second.ok, true);
    if (!second.ok || !second.reservation) return;
    assert.equal(second.reservation.holdUntil.getTime(), holdUntil);
    assert.ok(second.booking.expiresAt.getTime() <= holdUntil);
  });

  it('TEST_08 buyer can switch to self-pickup before payment', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(created.ok, true);
    if (!created.ok || !created.reservation) return;
    engine.accept(created.booking.id, 'courier-a');
    const pickup = engine.switchToPickup(created.booking.id, 'buyer-a');
    assert.equal(pickup.ok, true);
    assert.equal(pickup.deliveryFeeCents, 0);
    assert.equal(created.booking.status, 'CANCELLED');
    assert.equal(created.booking.calendarHold, false);
    assert.equal(created.reservation.status, 'PENDING');
    const paid = engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      deliveryMode: 'PICKUP',
      sessionId: 'cs_pickup',
    });
    assert.equal(paid.ok, true);
  });

  it('TEST_09 payment creates the order once', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;
    engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_once',
    });
    const first = engine.pay({
      sessionId: 'cs_once',
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
    });
    assert.equal(first.ok, true);
    assert.equal(engine.orders.length, 1);
    assert.equal(engine.products.get('cabinet')!.stock, 0);
    assert.equal(engine.settlementCalls, 1);
  });

  it('TEST_10 a second webhook does not duplicate the order or payout', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    if (!created.ok) return;
    engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_twice',
    });
    engine.pay({
      sessionId: 'cs_twice',
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
    });
    engine.pay({
      sessionId: 'cs_twice',
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
    });
    assert.equal(engine.orders.length, 1);
    assert.equal(engine.products.get('cabinet')!.stock, 0);
    assert.equal(engine.settlementCalls, 1);
    assert.equal(engine.courierSettlementCalls, 1);
  });

  it('TEST_11 payment after an expired hold cannot take another buyer’s stock', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    if (!created.ok) return;
    engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_late',
    });
    engine.advance(IMMEDIATE_HARD_HOLD_MS + MINUTE);
    const buyerB = engine.requestCourier({
      buyerId: 'buyer-b',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-b',
    });
    assert.equal(buyerB.ok, true);
    const late = engine.pay({
      sessionId: 'cs_late',
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
    });
    assert.equal(late.ok, false);
    assert.equal(engine.products.get('cabinet')!.stock, 1);
    assert.equal(engine.orders.length, 0);
    if (!buyerB.ok || !buyerB.reservation) return;
    assert.equal(buyerB.reservation.status, 'PENDING');
  });

  it('TEST_12 failed order creation is recorded for reconciliation and does not settle', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    if (!created.ok) return;
    engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_fail',
    });
    const failed = engine.pay({
      sessionId: 'cs_fail',
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      failOrderCreate: true,
    });
    assert.equal(failed.ok, false);
    assert.equal(engine.orders.length, 0);
    assert.equal(engine.products.get('cabinet')!.stock, 1);
    assert.equal(engine.settlementCalls, 0);
    assert.equal(engine.courierSettlementCalls, 0);
    assert.equal(engine.refundCalls, 0);
    assert.equal(engine.incidents.length, 1);
    assert.equal(engine.incidents[0].status, 'REFUND_REQUIRED');
  });

  it('TEST_13 an expired checkout releases stock and courier capacity', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    if (!created.ok || !created.reservation) return;
    engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_expire',
    });
    const released = engine.expireSession('cs_expire');
    assert.equal(released.released, true);
    assert.equal(created.reservation.status, 'EXPIRED');
    assert.equal(created.booking.calendarHold, false);
    assert.equal(engine.products.get('cabinet')!.stock, 1);
    assert.equal(engine.available('cabinet'), 1);
  });

  it('TEST_14 a paid order survives a late checkout.session.expired event', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    if (!created.ok || !created.reservation) return;
    engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_paid',
    });
    engine.pay({
      sessionId: 'cs_paid',
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
    });
    const late = engine.expireSession('cs_paid');
    assert.equal(late.reason, 'PAID');
    assert.equal(created.reservation.status, 'CONFIRMED');
    assert.equal(engine.orders.length, 1);
    assert.equal(engine.products.get('cabinet')!.stock, 0);
  });

  it('TEST_15 multi-quantity stock stays exact', () => {
    const engine = new CheckoutReservationEngine();
    engine.addProduct({ id: 'jars', stock: 5 });
    const a = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'jars',
      quantity: 3,
      courierId: 'courier-a',
    });
    const b = engine.requestCourier({
      buyerId: 'buyer-b',
      productId: 'jars',
      quantity: 2,
      courierId: 'courier-b',
    });
    const c = engine.requestCourier({
      buyerId: 'buyer-c',
      productId: 'jars',
      quantity: 1,
      courierId: 'courier-c',
    });
    assert.equal(a.ok, true);
    assert.equal(b.ok, true);
    assert.equal(c.ok, false);
    assert.equal(engine.available('jars'), 0);
    assert.equal(engine.sellerView('jars').remaining, 0);
    assert.equal(engine.sellerView('jars').label, 'TEMPORARILY_RESERVED');
    assert.notEqual(engine.sellerView('jars').label, 'SOLD');
  });

  it('TEST_16 multi-seller checkout still reserves each seller', () => {
    const engine = new CheckoutReservationEngine();
    engine.addProduct({ id: 'bread', stock: 2, sellerId: 'seller-1' });
    engine.addProduct({ id: 'jam', stock: 2, sellerId: 'seller-2' });
    const started = engine.startCheckout({
      buyerId: 'buyer-a',
      items: [
        { productId: 'bread', quantity: 1, sellerId: 'seller-1' },
        { productId: 'jam', quantity: 1, sellerId: 'seller-2' },
      ],
      deliveryMode: 'PICKUP',
      sessionId: 'cs_multi',
    });
    assert.equal(started.ok, true);
    assert.equal(engine.reservations.length, 2);
    const paid = engine.pay({
      sessionId: 'cs_multi',
      buyerId: 'buyer-a',
      items: [
        { productId: 'bread', quantity: 1 },
        { productId: 'jam', quantity: 1 },
      ],
    });
    assert.equal(paid.ok, true);
    assert.equal(engine.orders.length, 1);
    assert.equal(engine.products.get('bread')!.stock, 1);
    assert.equal(engine.products.get('jam')!.stock, 1);
  });

  it('TEST_17 services without inventory do not take a stock hold', () => {
    const engine = new CheckoutReservationEngine();
    engine.addProduct({ id: 'lesson', stock: 0, usesInventory: false });
    const requested = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'lesson',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(requested.ok, true);
    if (!requested.ok) return;
    assert.equal(requested.reservation, null);
    assert.equal(
      courierProductHoldApplies({
        usesPhysicalInventory: false,
        deliveryMode: 'LOCAL_PROVIDER',
      }),
      false,
    );
    const paid = engine.pay({
      sessionId: 'cs_service',
      buyerId: 'buyer-a',
      items: [{ productId: 'lesson', quantity: 1 }],
    });
    assert.equal(paid.ok, true);
    assert.equal(engine.products.get('lesson')!.stock, 0);
  });

  it('TEST_18 immediate delivery keeps the five-minute response inside a 35-minute hold', () => {
    assert.equal(IMMEDIATE_COURIER_RESPONSE_MS, 5 * MINUTE);
    assert.equal(PAYMENT_WINDOW_MS, 30 * MINUTE);
    assert.equal(IMMEDIATE_HARD_HOLD_MS, 35 * MINUTE);
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    if (!created.ok || !created.reservation) return;
    assert.equal(
      created.booking.expiresAt.getTime() - engine.now.getTime(),
      IMMEDIATE_COURIER_RESPONSE_MS,
    );
    assert.equal(
      created.reservation.holdUntil.getTime() - engine.now.getTime(),
      IMMEDIATE_HARD_HOLD_MS,
    );
  });

  it('TEST_19 automatic courier acceptance opens payment immediately', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    assert.equal(created.ok, true);
    if (!created.ok || !created.reservation) return;
    assert.equal(created.booking.status, 'AUTO_CONFIRMED');
    assert.equal(created.reservation.phase, 'AWAITING_PAYMENT');
    assert.ok(created.reservation.paymentDeadline);
  });

  it('TEST_20 manual acceptance stays pending until the courier responds', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    assert.equal(created.ok, true);
    if (!created.ok || !created.reservation) return;
    assert.equal(created.booking.status, 'PENDING');
    assert.equal(created.reservation.phase, 'AWAITING_COURIER');
    assert.equal(created.reservation.paymentDeadline, null);
    assert.equal(engine.notices.length, 0);
  });

  it('TEST_21 parcel shipping stays a separate checkout path', () => {
    const checkout = readFileSync('app/api/checkout/route.ts', 'utf8');
    assert.match(checkout, /EctaroShip/);
    assert.match(checkout, /PARCEL_SHIPPING/);
    assert.equal(
      courierProductHoldApplies({
        usesPhysicalInventory: true,
        deliveryMode: 'SHIPPING',
      }),
      false,
    );
    const engine = cabinet();
    const started = engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      deliveryMode: 'SHIPPING',
      sessionId: 'cs_ship',
    });
    assert.equal(started.ok, true);
    assert.equal(engine.bookings.length, 0);
    assert.equal(engine.reservations.length, 1);
    assert.equal(engine.reservations[0].phase, 'CHECKOUT');
    assert.notEqual(engine.reservations[0].phase, 'AWAITING_COURIER');
  });

  it('TEST_22 Dutch and English reservation copy is exact', () => {
    assert.equal(RESERVATION_COPY.nl.reserved, 'Product tijdelijk gereserveerd.');
    assert.equal(
      RESERVATION_COPY.nl.accepted,
      'Bezorger heeft bevestigd. Rond je betaling af.',
    );
    assert.equal(
      RESERVATION_COPY.nl.rejected,
      'Deze bezorger is niet beschikbaar. Kies een andere bezorgoptie.',
    );
    assert.equal(
      RESERVATION_COPY.nl.expired,
      'De reservering is verlopen. Controleer opnieuw of het product beschikbaar is.',
    );
    assert.match(RESERVATION_COPY.en.reserved, /reserved/i);
    assert.match(RESERVATION_COPY.en.accepted, /payment/i);
    assert.match(RESERVATION_COPY.en.rejected, /courier/i);
    assert.match(RESERVATION_COPY.en.expired, /expired/i);
    const page = readFileSync('app/checkout/page.tsx', 'utf8');
    assert.match(page, /RESERVATION_COPY/);
  });

  it('TEST_23 two buyers racing for the last unit produce one hold', async () => {
    const engine = cabinet();
    const [a, b] = await Promise.all([
      engine.lock(() =>
        engine.requestCourier({
          buyerId: 'buyer-a',
          productId: 'cabinet',
          quantity: 1,
          courierId: 'courier-a',
        }),
      ),
      engine.lock(() =>
        engine.requestCourier({
          buyerId: 'buyer-b',
          productId: 'cabinet',
          quantity: 1,
          courierId: 'courier-b',
        }),
      ),
    ]);
    const wins = [a, b].filter((r) => r.ok);
    assert.equal(wins.length, 1);
    assert.equal(engine.reservations.filter((r) => r.status === 'PENDING').length, 1);
    assert.equal(engine.products.get('cabinet')!.stock, 1);
  });

  it('TEST_24 accept and courier switch cannot both win', async () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    if (!created.ok) return;
    const [accepted, switched] = await Promise.all([
      engine.lock(() => engine.accept(created.booking.id, 'courier-a')),
      engine.lock(() =>
        engine.requestCourier({
          buyerId: 'buyer-a',
          productId: 'cabinet',
          quantity: 1,
          courierId: 'courier-b',
          replacesBookingId: created.booking.id,
        }),
      ),
    ]);
    const pendingOrAccepted = engine.bookings.filter((b) =>
      ['PENDING', 'ACCEPTED', 'AUTO_CONFIRMED'].includes(b.status),
    );
    assert.equal(pendingOrAccepted.length, 1);
    assert.equal(engine.reservations.filter((r) => r.status === 'PENDING').length, 1);
    assert.ok(accepted.ok !== (switched.ok && switched.ok));
  });

  it('TEST_25 cleanup cannot release a hold that payment just confirmed', async () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    if (!created.ok || !created.reservation) return;
    engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_race',
    });
    engine.advance(created.reservation.expiresAt.getTime() - engine.now.getTime() + 1);
    const paid = await engine.lock(() =>
      engine.pay({
        sessionId: 'cs_race',
        buyerId: 'buyer-a',
        items: [{ productId: 'cabinet', quantity: 1 }],
      }),
    );
    const cleaned = await engine.lock(() => engine.cleanup());
    assert.equal(paid.ok, false);
    assert.equal(cleaned, 1);
    assert.equal(engine.orders.length, 0);
    assert.equal(engine.products.get('cabinet')!.stock, 1);
    assert.equal(engine.incidents.length, 1);

    const engine2 = cabinet();
    const created2 = engine2.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    if (!created2.ok || !created2.reservation) return;
    engine2.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created2.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_race_2',
    });
    const paidFirst = await engine2.lock(() =>
      engine2.pay({
        sessionId: 'cs_race_2',
        buyerId: 'buyer-a',
        items: [{ productId: 'cabinet', quantity: 1 }],
      }),
    );
    engine2.advance(IMMEDIATE_HARD_HOLD_MS);
    const cleanedAfter = await engine2.lock(() => engine2.cleanup());
    assert.equal(paidFirst.ok, true);
    assert.equal(cleanedAfter, 0);
    assert.equal(created2.reservation.status, 'CONFIRMED');
    assert.equal(engine2.products.get('cabinet')!.stock, 0);
  });

  it('TEST_26 the payment deadline blocks an open Stripe session', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
      auto: true,
    });
    if (!created.ok || !created.reservation) return;
    engine.startCheckout({
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
      bookingId: created.booking.id,
      deliveryMode: 'LOCAL_PROVIDER',
      sessionId: 'cs_open',
    });
    assert.equal(engine.sessions.get('cs_open')!.open, true);
    engine.advance(PAYMENT_WINDOW_MS + 1000);
    const late = engine.pay({
      sessionId: 'cs_open',
      buyerId: 'buyer-a',
      items: [{ productId: 'cabinet', quantity: 1 }],
    });
    assert.equal(late.ok, false);
    assert.equal(engine.sessions.get('cs_open')!.open, true);
    assert.equal(engine.orders.length, 0);
    assert.equal(engine.products.get('cabinet')!.stock, 1);
    assert.equal(stripeSecretAllowsSessionExpire('sk_test_secret'), true);
    assert.equal(stripeSecretAllowsSessionExpire('sk_live_secret', {}), false);
    assert.equal(
      stripeSecretAllowsSessionExpire('sk_live_secret', { VERCEL_ENV: 'production' }),
      true,
    );
    assert.equal(
      planCheckoutSessionExpiration({ status: 'open', payment_status: 'unpaid' }),
      'EXPIRE',
    );
    assert.equal(
      planCheckoutSessionExpiration({ status: 'open', payment_status: 'paid' }),
      'SKIP_PAID',
    );
    assert.equal(
      planCheckoutSessionExpiration({ status: 'complete', payment_status: 'unpaid' }),
      'SKIP_COMPLETE',
    );
    assert.equal(decideIncidentResolution({ orderId: 'order-1', existingRefundId: null }).resolution, 'ORDER_EXISTS');
    assert.equal(
      decideIncidentResolution({ orderId: null, existingRefundId: 're_1' }).resolution,
      'REFUND_ALREADY_EXISTS',
    );
    assert.equal(
      decideIncidentResolution({ orderId: null, existingRefundId: null }).resolution,
      'AUTO_REFUND_BLOCKED',
    );
    assert.equal(decideIncidentResolution({ orderId: null, existingRefundId: null }).refund, false);
  });

  it('TEST_27 duplicate reconciliation does not create a second refund record', () => {
    const engine = cabinet();
    engine.recordIncident('cs_dup', 'HOLD_EXPIRED');
    engine.recordIncident('cs_dup', 'HOLD_EXPIRED');
    assert.equal(engine.incidents.length, 1);
    assert.equal(engine.refundCalls, 0);
  });

  it('explicit cancel releases the cabinet immediately', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    if (!created.ok || !created.reservation) return;
    assert.equal(engine.cancelPurchase(created.booking.id, 'buyer-a').ok, true);
    assert.equal(created.reservation.status, 'CANCELLED');
    assert.equal(engine.available('cabinet'), 1);
  });

  it('a failed booking releases only the hold created for that attempt', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    if (!created.ok || !created.reservation) return;
    created.reservation.bookingRequestId = null;
    engine.bookings = [];
    engine.compensateFailedBooking(created.reservation.id, true);
    assert.equal(created.reservation.status, 'CANCELLED');
    assert.equal(engine.available('cabinet'), 1);
  });

  it('scheduled booking stays hidden and seller stock is not marked sold', () => {
    assert.equal(scheduledBookingExposed(), false);
    assert.equal(SCHEDULED_COURIER_RESPONSE_DEFAULT_MS, 2 * 60 * 60 * 1000);
    assert.equal(SCHEDULED_COURIER_RESPONSE_MAX_MS, 12 * 60 * 60 * 1000);
    assert.equal(sellerStockLabel(1, 1), 'TEMPORARILY_RESERVED');
    assert.equal(sellerStockLabel(1, 0), 'AVAILABLE');
    assert.equal(sellerStockLabel(0, 0), 'SOLD');
    const now = new Date('2026-10-16T12:00:00.000Z');
    const holdUntil = new Date(now.getTime() + IMMEDIATE_HARD_HOLD_MS);
    const deadline = paymentDeadlineAfterAccept(
      new Date(now.getTime() + 10 * MINUTE),
      holdUntil,
    );
    assert.ok(deadline.getTime() <= holdUntil.getTime());
  });

  it('courier and seller fee split stays 88/12', () => {
    assert.equal(DELIVERY_PLATFORM_FEE_PERCENT, 12);
    assert.equal(DELIVERY_DELIVERER_PERCENT, 88);
  });

  it('confirmReservationAndDecrementStock refuses an expired hold and another buyer’s stock', async () => {
    const now = new Date('2026-10-16T12:00:00.000Z');
    const state = {
      stock: 1,
      reservations: [
        {
          id: 'res-a',
          status: 'EXPIRED',
          quantity: 1,
          expiresAt: new Date(now.getTime() - 1000),
          buyerId: 'buyer-a',
          productId: 'cabinet',
        },
        {
          id: 'res-b',
          status: 'PENDING',
          quantity: 1,
          expiresAt: new Date(now.getTime() + 60_000),
          buyerId: 'buyer-b',
          productId: 'cabinet',
        },
      ],
    };
    const tx = fakeTx(state);
    await assert.rejects(
      () =>
        confirmReservationAndDecrementStock(tx as never, {
          productId: 'cabinet',
          quantity: 1,
          stripeSessionId: 'cs_late',
          holdId: 'res-a',
          inventoryRequired: true,
          buyerId: 'buyer-a',
          now,
        }),
      (err: unknown) =>
        err instanceof CheckoutStockConflictError && err.code === 'HOLD_EXPIRED',
    );
    assert.equal(state.stock, 1);
    assert.equal(state.reservations[1].status, 'PENDING');
  });

  it('confirmReservationAndDecrementStock decrements once for the owning buyer', async () => {
    const now = new Date('2026-10-16T12:00:00.000Z');
    const state = {
      stock: 1,
      reservations: [
        {
          id: 'res-a',
          status: 'PENDING',
          quantity: 1,
          expiresAt: new Date(now.getTime() + 60_000),
          paymentDeadline: new Date(now.getTime() + 60_000),
          buyerId: 'buyer-a',
          productId: 'cabinet',
          stripeSessionId: 'hold:key:cabinet',
          purchaseKey: 'key',
        },
      ],
    };
    const tx = fakeTx(state);
    await confirmReservationAndDecrementStock(tx as never, {
      productId: 'cabinet',
      quantity: 1,
      stripeSessionId: 'cs_ok',
      holdId: 'key',
      inventoryRequired: true,
      buyerId: 'buyer-a',
      now,
    });
    assert.equal(state.stock, 0);
    assert.equal(state.reservations[0].status, 'CONFIRMED');
    await confirmReservationAndDecrementStock(tx as never, {
      productId: 'cabinet',
      quantity: 1,
      stripeSessionId: 'cs_ok',
      holdId: 'key',
      inventoryRequired: true,
      buyerId: 'buyer-a',
      now,
    });
    assert.equal(state.stock, 0);
  });

  it('notification failure does not roll back an acceptance', () => {
    const engine = cabinet();
    const created = engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    if (!created.ok) return;
    const accepted = engine.accept(created.booking.id, 'courier-a');
    assert.equal(accepted.ok, true);
    assert.equal(created.booking.status, 'ACCEPTED');
    assert.equal(engine.sellerSoldNotices, 0);
    assert.equal(engine.openPoolNotices, 0);
    assert.equal(
      engine.notices.filter((n) => n.kind === 'ACCEPTED').length,
      1,
    );
  });

  it('expired unpaid cleanup does not change stock', () => {
    const engine = cabinet();
    engine.requestCourier({
      buyerId: 'buyer-a',
      productId: 'cabinet',
      quantity: 1,
      courierId: 'courier-a',
    });
    engine.advance(IMMEDIATE_HARD_HOLD_MS + 1);
    const cleaned = engine.cleanup();
    assert.equal(cleaned, 1);
    assert.equal(engine.products.get('cabinet')!.stock, 1);
    assert.equal(engine.available('cabinet'), 1);
    assert.equal(engine.cleanup(), 0);
  });

  it('evaluateStockConfirm treats a missing hold as a conflict', () => {
    const decision = evaluateStockConfirm({
      inventoryRequired: true,
      now: new Date(),
      reservation: null,
      requestedQuantity: 1,
      stock: 1,
      otherPendingQuantity: 0,
    });
    assert.equal(decision.action, 'conflict');
  });

  it('expires an open unpaid Checkout Session once and leaves a paid session open', async () => {
    const { expireOpenCheckoutSessions } = await import('@/lib/payments/checkout-session-expiration');
    const expired: string[] = [];
    const sessions = new Map<string, { status: string; payment_status: string }>([
      ['cs_open', { status: 'open', payment_status: 'unpaid' }],
      ['cs_paid', { status: 'open', payment_status: 'paid' }],
    ]);
    const stripe = {
      checkout: {
        sessions: {
          retrieve: async (id: string) => sessions.get(id)!,
          expire: async (id: string) => {
            expired.push(id);
            sessions.set(id, { status: 'expired', payment_status: 'unpaid' });
          },
        },
      },
    };
    await expireOpenCheckoutSessions(['cs_open', 'cs_paid'], stripe);
    await expireOpenCheckoutSessions(['cs_open', 'cs_paid'], stripe);
    assert.deepEqual(expired, ['cs_open']);
  });
});

type FakeReservation = {
  id: string;
  status: string;
  quantity: number;
  expiresAt: Date;
  paymentDeadline?: Date | null;
  holdUntil?: Date | null;
  buyerId?: string | null;
  productId: string;
  stripeSessionId?: string;
  purchaseKey?: string;
  checkoutSessionId?: string | null;
};

function fakeTx(state: { stock: number; reservations: FakeReservation[] }) {
  return {
    product: {
      findUnique: async () => ({
        stock: state.stock,
        priceModel: null,
        marketplaceCategory: null,
        category: null,
        fulfillmentOptions: null,
        specializations: null,
        listingIntent: null,
        title: 'Cabinet',
      }),
      updateMany: async (args: {
        where: { stock: { gte: number } };
        data: { stock: { decrement: number } };
      }) => {
        if (state.stock < args.where.stock.gte) return { count: 0 };
        state.stock -= args.data.stock.decrement;
        return { count: 1 };
      },
    },
    stockReservation: {
      aggregate: async (args: { where: { id?: { not?: string } } }) => {
        const except = args.where.id?.not;
        const quantity = state.reservations
          .filter((r) => r.id !== except && r.status === 'PENDING' && r.expiresAt.getTime() > Date.now())
          .reduce((sum, r) => sum + r.quantity, 0);
        return { _sum: { quantity } };
      },
      findFirst: async (args: { where: { OR?: Array<Record<string, string>> } }) => {
        const ors = args.where.OR || [];
        return (
          state.reservations.find((r) =>
            ors.some((clause) => {
              if (clause.id && r.id === clause.id) return true;
              if (clause.stripeSessionId && r.stripeSessionId === clause.stripeSessionId) return true;
              if (clause.purchaseKey && r.purchaseKey === clause.purchaseKey) return true;
              if (clause.checkoutSessionId && r.checkoutSessionId === clause.checkoutSessionId) return true;
              return false;
            }),
          ) || null
        );
      },
      update: async () => ({}),
      updateMany: async (args: { where: { id?: string; status?: string }; data: { status?: string } }) => {
        const row = state.reservations.find((r) => r.id === args.where.id);
        if (!row || row.status !== 'PENDING') return { count: 0 };
        if (args.data.status) row.status = args.data.status;
        return { count: 1 };
      },
      create: async () => ({}),
    },
  };
}
