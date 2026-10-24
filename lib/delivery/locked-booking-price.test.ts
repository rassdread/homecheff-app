import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lockedBookingCheckoutPrice, manualAssignmentStatus } from './locked-booking-price';

const booking = {
  quotedFeeCents: 955,
  routeDistanceKm: 16.1,
  buyerLat: 51.92,
  buyerLng: 4.48,
};

describe('locked booking checkout price', () => {
  it('charges the stored fee and rejects a closer address or a lower quote', () => {
    const locked = lockedBookingCheckoutPrice({ ...booking, bodyLat: 51.92, bodyLng: 4.48, clientQuoteCents: 955 });
    assert.equal(locked.ok, true);
    if (locked.ok) assert.equal(locked.quotedFeeCents, 955);

    const closer = lockedBookingCheckoutPrice({ ...booking, bodyLat: 51.93, bodyLng: 4.48 });
    assert.equal(closer.ok, false);
    if (!closer.ok) assert.equal(closer.code, 'DELIVERY_ROUTE_CHANGED');

    const cheaper = lockedBookingCheckoutPrice({ ...booking, clientQuoteCents: 100 });
    assert.equal(cheaper.ok, false);
    if (!cheaper.ok) assert.equal(cheaper.code, 'DELIVERY_QUOTE_CHANGED');

    const missing = lockedBookingCheckoutPrice({ ...booking, quotedFeeCents: null });
    assert.equal(missing.ok, false);
    if (!missing.ok) assert.equal(missing.code, 'DELIVERY_BOOKING_PRICE_MISSING');
  });

  it('writes ACCEPTED for a pending or legacy assigned order and refuses a completed one', () => {
    assert.deepEqual(manualAssignmentStatus('PENDING'), { ok: true, status: 'ACCEPTED' });
    assert.deepEqual(manualAssignmentStatus('ASSIGNED'), { ok: true, status: 'ACCEPTED' });
    assert.equal(manualAssignmentStatus('DELIVERED').ok, false);
    assert.equal(manualAssignmentStatus('PICKED_UP').ok, false);
  });
});
