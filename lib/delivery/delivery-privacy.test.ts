import assert from 'node:assert/strict';
import {
  addressForCourierPhase,
  coordsForPhase,
  courierMaySeeExactAddress,
  deliveryInboxLine,
  deliveryOrderExactAddressAllowed,
  formatAreaLabel,
  notesForPreAccept,
  sellerAddressForPhase,
} from '@/lib/delivery/delivery-privacy';

assert.deepEqual(coordsForPhase(51.91, 4.34, 'available'), {
  lat: null,
  lng: null,
});
assert.deepEqual(coordsForPhase(51.91, 4.34, 'assigned'), {
  lat: 51.91,
  lng: 4.34,
});

assert.equal(
  formatAreaLabel({ place: 'Hoogstraat 12, Rotterdam', city: 'Rotterdam', postalCode: '3011PM' }),
  'Rotterdam',
);
assert.ok(!formatAreaLabel({ place: 'Hoogstraat 12', postalCode: '3011PM' }).includes('3011'));
assert.ok(!formatAreaLabel({ place: 'Hoogstraat 12', postalCode: '3011PM' }).includes('Hoogstraat'));

assert.equal(
  sellerAddressForPhase(
    { place: 'Hoogstraat 12, Vlaardingen', address: 'Hoogstraat 12', postalCode: '3131AA', city: 'Vlaardingen' },
    'available',
  ),
  'Vlaardingen',
);
assert.ok(
  sellerAddressForPhase(
    { place: 'Vlaardingen', address: 'Hoogstraat 12', postalCode: '3131AA', city: 'Vlaardingen' },
    'assigned',
  ).includes('Hoogstraat'),
);

assert.equal(courierMaySeeExactAddress('PENDING'), false);
assert.equal(courierMaySeeExactAddress('ACCEPTED'), true);
assert.equal(
  addressForCourierPhase('Hoogstraat 12, 3011 PM Rotterdam', 'PENDING'),
  'Rotterdam',
);
assert.equal(
  addressForCourierPhase('Hoogstraat 12, 3011 PM Rotterdam', 'ACCEPTED'),
  'Hoogstraat 12, 3011 PM Rotterdam',
);
assert.equal(deliveryOrderExactAddressAllowed('PENDING'), false);
assert.equal(deliveryOrderExactAddressAllowed('ACCEPTED'), true);
assert.equal(
  deliveryInboxLine('PENDING', 'Buyerstraat 9, 3011 PM Rotterdam'),
  'Nieuwe bezorgopdracht in jouw regio',
);
assert.equal(
  deliveryInboxLine('ACCEPTED', 'Buyerstraat 9, 3011 PM Rotterdam'),
  'Nieuwe bezorgopdracht: Buyerstraat 9, 3011 PM Rotterdam',
);
assert.equal(
  notesForPreAccept('Bel aan.\nBezorgadres: Hoogstraat 12, 3011 PM Rotterdam', [
    'Hoogstraat 12, 3011 PM Rotterdam',
  ]),
  'Bel aan.',
);
assert.equal(notesForPreAccept('3011 PM Rotterdam', []), '');

console.log('delivery privacy phase checks passed');
