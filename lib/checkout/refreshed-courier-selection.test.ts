import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  decideRefreshedCourierSelection,
  type RefreshedCourierPhase,
} from './refreshed-courier-selection';

const savedCourier: RefreshedCourierPhase = {
  cartItemCount: 0,
  deliveryFlagsLoaded: false,
  selectedDelivery: 'local_provider',
  selectedDeliveryProfileId: 'courier-1',
  optionAvailable: false,
  matchStatus: 'loading',
  matchedDeliverers: [],
};

test('refresh waits for the delivery flag and the cart, then keeps or drops the server match without booking', () => {
  let bookings = 1;

  const apply = (phase: RefreshedCourierPhase) => {
    const decision = decideRefreshedCourierSelection(phase);
    if (decision.createsBooking) bookings += 1;
    return decision;
  };

  const beforeInputs = apply(savedCourier);
  assert.equal(beforeInputs.hold, true);
  assert.equal(beforeInputs.selectedDelivery, 'local_provider');
  assert.equal(beforeInputs.selectedDeliveryProfileId, 'courier-1');

  const cartOnly = apply({ ...savedCourier, cartItemCount: 1 });
  assert.equal(cartOnly.hold, true);
  assert.equal(cartOnly.selectedDeliveryProfileId, 'courier-1');

  const matchStillLoading = apply({
    ...savedCourier,
    cartItemCount: 1,
    deliveryFlagsLoaded: true,
    optionAvailable: true,
    matchStatus: 'loading',
    matchedDeliverers: [],
  });
  assert.equal(matchStillLoading.hold, true);
  assert.equal(matchStillLoading.selectedDeliveryProfileId, 'courier-1');

  const sameCourier = apply({
    ...savedCourier,
    cartItemCount: 1,
    deliveryFlagsLoaded: true,
    optionAvailable: true,
    matchStatus: 'settled',
    matchedDeliverers: [
      {
        id: 'courier-1',
        quotedFeeCents: 370,
        routeDistanceKm: 1.5,
        withinFreeRadius: false,
      },
    ],
  });
  assert.equal(sameCourier.hold, false);
  assert.equal(sameCourier.courierId, 'courier-1');
  assert.equal(sameCourier.selectedDeliveryProfileId, 'courier-1');
  assert.equal(sameCourier.deliveryFeeCents, 370);
  assert.equal(sameCourier.createsBooking, false);

  const courierNoLongerFits = apply({
    ...savedCourier,
    cartItemCount: 1,
    deliveryFlagsLoaded: true,
    optionAvailable: true,
    matchStatus: 'settled',
    matchedDeliverers: [],
  });
  assert.equal(courierNoLongerFits.hold, false);
  assert.equal(courierNoLongerFits.courierId, null);
  assert.equal(courierNoLongerFits.deliveryFeeCents, null);
  assert.equal(courierNoLongerFits.selectedDeliveryProfileId, '');
  assert.equal(courierNoLongerFits.createsBooking, false);
  assert.equal(bookings, 1);
});

test('checkout keeps the tested wait and applies the refresh decision without a new booking', () => {
  const page = readFileSync(
    new URL('../../app/checkout/page.tsx', import.meta.url),
    'utf8',
  );
  const decision = readFileSync(
    new URL('./refreshed-courier-selection.ts', import.meta.url),
    'utf8',
  );
  assert.match(page, /if \(checkoutItems\.length === 0\) return;/);
  assert.match(
    page,
    /checkoutDraft\.selectedDelivery === 'local_provider' &&\s*!deliveryFlagsLoaded/,
  );
  assert.match(page, /decideRefreshedCourierSelection\(/);
  assert.doesNotMatch(decision, /booking-requests|fetch\(/);
});
