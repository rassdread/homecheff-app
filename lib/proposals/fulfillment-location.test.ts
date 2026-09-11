import assert from 'node:assert/strict';
import {
  deriveFulfillmentLocationState,
  formatOperationalAddress,
  resolveEffectiveSchedule,
  resolveLocationOwner,
} from './fulfillment-location';

assert.equal(resolveLocationOwner('PICKUP'), 'SELLER');
assert.equal(resolveLocationOwner('DELIVERY'), 'BUYER');
assert.equal(resolveLocationOwner('DIGITAL'), null);
assert.equal(resolveLocationOwner(null), null);

assert.equal(
  deriveFulfillmentLocationState({ fulfillmentMode: null }),
  'LOCATION_NOT_REQUIRED',
);
assert.equal(
  deriveFulfillmentLocationState({ fulfillmentMode: 'PICKUP' }),
  'LOCATION_AND_SCHEDULE_PENDING',
);
assert.equal(
  deriveFulfillmentLocationState({
    fulfillmentMode: 'PICKUP',
    pickupAddress: 'Hoofdstraat 1, 3131 AA Vlaardingen',
    proposalDate: '2026-09-19',
    proposalTimeWindow: '14:00–16:00',
  }),
  'COMPLETE',
);
assert.equal(
  deriveFulfillmentLocationState({
    fulfillmentMode: 'DELIVERY',
    deliveryAddress: 'Kerkstraat 2, Rotterdam',
  }),
  'SCHEDULE_PENDING',
);

const inherited = resolveEffectiveSchedule({
  proposalDate: '2026-09-18',
  proposalTimeWindow: '18:00–19:00',
  confirmedDate: '2026-09-20',
  confirmedTimeWindow: '10:00',
});
assert.equal(inherited.fromProposal, true);
assert.equal(inherited.date, '2026-09-18');
assert.equal(inherited.timeWindow, '18:00–19:00');

assert.match(
  formatOperationalAddress({
    address: 'Hoofdstraat',
    houseNumber: '12',
    postalCode: '3131 AA',
    city: 'Vlaardingen',
  }) || '',
  /Hoofdstraat 12/,
);

console.log('fulfillment-location: ok');
