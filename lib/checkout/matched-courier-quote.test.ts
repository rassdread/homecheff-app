import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkoutCourierMatchPath,
  quoteFromMatchedCourier,
} from './matched-courier-quote';

test('checkout asks the server to match a product without sending a pickup coordinate', () => {
  const path = checkoutCourierMatchPath('product-1', { lat: 52.3578, lng: 4.8837 });
  assert.match(path, /^\/api\/delivery\/match-deliverers\?/);
  assert.match(path, /productId=product-1/);
  assert.match(path, /buyerLat=52\.3578/);
  assert.doesNotMatch(path, /sellerLat|pickupLat|sellerLng/);
});

test('a matched server price is reused and an unmarked zero is not free', () => {
  assert.deepEqual(
    quoteFromMatchedCourier({
      quotedFeeCents: 762,
      routeDistanceKm: 6.4,
      withinFreeRadius: false,
    }),
    { deliveryFeeCents: 762, distanceKm: 6.4, withinFreeRadius: false },
  );
  assert.equal(
    quoteFromMatchedCourier({ quotedFeeCents: 0, withinFreeRadius: false }),
    null,
  );
  assert.deepEqual(
    quoteFromMatchedCourier({ quotedFeeCents: 0, withinFreeRadius: true, routeDistanceKm: 0.4 }),
    { deliveryFeeCents: 0, distanceKm: 0.4, withinFreeRadius: true },
  );
});
