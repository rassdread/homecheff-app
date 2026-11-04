import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDutchDeliveryAddress } from '@/lib/delivery/delivery-address';
import { assessCourierCapacity } from '@/lib/delivery/shipment-capacity';
import { classifySellerConnect } from '@/lib/admin/seller-connect-segment';

test('a street or postcode without a house number is rejected', () => {
  assert.equal(parseDutchDeliveryAddress('Koerierstraat').ok, false);
  const postcodeOnly = parseDutchDeliveryAddress('3511 CD Utrecht');
  assert.equal(postcodeOnly.ok, false);
  if (!postcodeOnly.ok) assert.equal(postcodeOnly.error, 'Vul ook het huisnummer in.');
});

test('street, house number, addition and postcode parse together', () => {
  const parsed = parseDutchDeliveryAddress('Koerierstraat 12 A, 3511 CD Utrecht');
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.address.houseNumber, '12');
    assert.equal(parsed.address.addition, 'A');
    assert.equal(parsed.address.postcode, '3511CD');
  }
});

test('unknown capacity is not treated as a fit', () => {
  const unknown = assessCourierCapacity({
    maxWeightGrams: null,
    shipment: { size: 'LARGE', weightGrams: 8000, packageCount: 2 },
  });
  assert.equal(unknown.status, 'UNKNOWN');
  const tooHeavy = assessCourierCapacity({
    maxWeightGrams: 5000,
    shipment: { size: 'LARGE', weightGrams: 8000, packageCount: 1 },
  });
  assert.equal(tooHeavy.status, 'INSUFFICIENT');
  const fits = assessCourierCapacity({
    maxWeightGrams: 20000,
    shipment: { size: 'SMALL', weightGrams: 500, packageCount: 1 },
  });
  assert.equal(fits.status, 'FITS');
});

test('a stored Connect account is not payout ready and unknown is not missing', () => {
  assert.equal(
    classifySellerConnect({
      stripeConnectAccountId: 'acct_123',
      onboardingCompleted: true,
      payoutsEnabled: null,
    }),
    'LINKED_PAYOUT_UNKNOWN',
  );
  assert.equal(
    classifySellerConnect({
      stripeConnectAccountId: null,
      onboardingCompleted: false,
      payoutsEnabled: null,
    }),
    'NOT_STARTED',
  );
  assert.equal(
    classifySellerConnect({
      stripeConnectAccountId: undefined,
      onboardingCompleted: null,
      payoutsEnabled: null,
    }),
    'UNKNOWN',
  );
  assert.notEqual(
    classifySellerConnect({
      stripeConnectAccountId: undefined,
      onboardingCompleted: null,
      payoutsEnabled: null,
    }),
    'NOT_STARTED',
  );
});
