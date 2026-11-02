import assert from 'node:assert/strict';
import fs from 'node:fs';
import { storedRecordLookupRejection } from '@/lib/geo/geocode-request-guard';

assert.equal(
  storedRecordLookupRejection({ address: 'Damrak 1', city: 'Amsterdam', countryCode: 'NL' }),
  null,
);
assert.equal(
  storedRecordLookupRejection({ postcode: '1012AB', huisnummer: '1' }),
  null,
);
assert.ok(storedRecordLookupRejection({ userId: 'user_1', address: 'Damrak 1' }));
assert.ok(storedRecordLookupRejection({ productId: 'prod_1' }));
assert.ok(storedRecordLookupRejection({ sellerId: 'seller_1' }));
assert.equal(storedRecordLookupRejection({ userId: '  ' }), null);

const routes = [
  'app/api/geocoding/dutch/route.ts',
  'app/api/geocoding/global/route.ts',
  'app/api/geocoding/international/route.ts',
  'app/api/geocoding/resolve-place/route.ts',
];
for (const route of routes) {
  const source = fs.readFileSync(route, 'utf8');
  assert.match(source, /storedRecordLookupRejection/);
  assert.doesNotMatch(source, /prisma/);
  assert.doesNotMatch(source, /googleMapsApiKey/);
}

console.log('geocode request guard passed');
