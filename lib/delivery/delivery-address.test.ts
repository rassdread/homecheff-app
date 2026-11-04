import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseDutchDeliveryAddress, streetsMatch } from '@/lib/delivery/delivery-address';
import { assessCourierCapacity } from '@/lib/delivery/shipment-capacity';
import { splitCouriersByCapacity } from '@/lib/delivery/standalone-request';
import { classifySellerConnect } from '@/lib/admin/seller-connect-segment';
import { assessSeller, selectSellerRecipients } from '@/lib/admin/seller-audience';

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

test('unknown capacity is not treated as a fit and is not selectable', () => {
  const shipment = {
    kind: 'PARCEL' as const,
    size: 'LARGE' as const,
    weightGrams: 8000,
    packageCount: 2,
    lengthCm: null,
    widthCm: null,
    heightCm: null,
    description: 'Dozen',
    fragile: false,
    temperatureSensitive: false,
    liftHelp: false,
  };
  const unknown = assessCourierCapacity({ maxWeightGrams: null, shipment });
  assert.equal(unknown.status, 'UNKNOWN');
  const tooHeavy = assessCourierCapacity({
    maxWeightGrams: 5000,
    shipment: { ...shipment, packageCount: 1 },
  });
  assert.equal(tooHeavy.status, 'INSUFFICIENT');
  const fits = assessCourierCapacity({
    maxWeightGrams: 20000,
    shipment: { ...shipment, size: 'SMALL', weightGrams: 500, packageCount: 1 },
  });
  assert.equal(fits.status, 'FITS');
  const split = splitCouriersByCapacity(
    [{ vehicleType: 'BIKE', name: 'Onbekend' }, { vehicleType: 'CAR', name: 'Bekend', maxWeightGrams: 30000 }],
    { ...shipment, weightGrams: 1000, packageCount: 1, size: 'SMALL' },
  );
  assert.equal(split.matched.length, 1);
  assert.equal(split.excluded.length, 1);
  assert.equal(split.excluded[0]?.capacity, 'UNKNOWN');
});

test('a typed street must match the postcode and house number', () => {
  assert.equal(streetsMatch('Keizersgracht', 'Keizersgracht'), true);
  assert.equal(streetsMatch('Nieuwstraat', 'Keizersgracht'), false);
});

test('seller filters combine plan, products and connect without treating unknown as ready', () => {
  const premium = assessSeller({
    userId: 'seller-1',
    name: 'Premium',
    email: 'premium@example.com',
    deleted: false,
    suspended: false,
    marketingAccepted: false,
    commerceDeclaration: 'SELF_DECLARED_PROFESSIONAL',
    businessVerified: true,
    subscriptionId: 'sub',
    subscriptionValidUntil: new Date('2099-01-01'),
    subscriptionName: 'premium',
    feeBps: 500,
    activeProductCount: 2,
    connectAccountId: 'acct_1',
    connectOnboardingCompleted: true,
    payoutsEnabled: null,
    connectRestricted: null,
    connectRequirementsDue: null,
  });
  assert.equal(premium.plan, 'premium');
  assert.equal(premium.account, 'BUSINESS');
  assert.equal(premium.connect, 'LINKED_PAYOUT_UNKNOWN');
  const selected = selectSellerRecipients([premium], {
    account: ['BUSINESS'],
    plans: ['PREMIUM'],
    products: 'ACTIVE',
    onboarding: 'COMPLETE',
    connect: ['PAYOUT_READY'],
  });
  assert.equal(selected.eligible.length, 0);
  const linked = selectSellerRecipients([premium], {
    account: ['BUSINESS'],
    plans: ['PREMIUM'],
    products: 'ACTIVE',
    onboarding: 'COMPLETE',
    connect: ['LINKED_PAYOUT_UNKNOWN'],
  });
  assert.equal(linked.eligible.length, 1);
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
