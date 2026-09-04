/**
 * Phase 2 — provider-owned pricing unit tests (no DB).
 * Run: npx tsx scripts/test-delivery-marketplace-phase2.ts
 */
import assert from 'node:assert/strict';
import { readDeliveryAlignmentFlags } from '../lib/delivery/delivery-alignment-flags';
import {
  calculateProviderDeliveryPrice,
  validateProviderPricingConfig,
  validateProviderPricingForSave,
  PROVIDER_PRICING_FORMULA_VERSION,
} from '../lib/delivery/provider-pricing';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`, e);
    process.exitCode = 1;
  }
}

const completePricing = {
  pricingEnabled: true,
  baseFeeCents: 250,
  pricePerKmCents: 75,
  minimumFeeCents: 300,
  freeDeliveryRadiusKm: 2,
  maxDistanceKm: 15,
  currency: 'EUR',
  nationalCoverage: false,
};

test('feature flag DELIVERY_PROVIDER_PRICING_ENABLED defaults true', () => {
  const flags = readDeliveryAlignmentFlags({});
  assert.equal(flags.providerPricingEnabled, true);
});

test('feature flag can be enabled explicitly', () => {
  const flags = readDeliveryAlignmentFlags({
    DELIVERY_PROVIDER_PRICING_ENABLED: 'true',
  });
  assert.equal(flags.providerPricingEnabled, true);
});

test('feature flag fail-closed on garbage env', () => {
  const flags = readDeliveryAlignmentFlags({
    DELIVERY_PROVIDER_PRICING_ENABLED: 'yesplease',
  });
  assert.equal(flags.providerPricingEnabled, false);
});

test('disabled pricing fails closed for quotes', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: { ...completePricing, pricingEnabled: false },
    routeDistanceKm: 5,
  });
  assert.equal(quote.ok, false);
  if (!quote.ok) assert.equal(quote.code, 'DELIVERY_PRICING_INCOMPLETE');
});

test('incomplete pricing returns DELIVERY_PRICING_INCOMPLETE', () => {
  const result = validateProviderPricingConfig({
    pricingEnabled: true,
    baseFeeCents: null,
    pricePerKmCents: 75,
    minimumFeeCents: 300,
    freeDeliveryRadiusKm: 0,
    maxDistanceKm: 10,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'DELIVERY_PRICING_INCOMPLETE');
});

test('non-integer cents rejected', () => {
  const result = validateProviderPricingConfig({
    ...completePricing,
    baseFeeCents: 2.5 as unknown as number,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'DELIVERY_PRICING_INCOMPLETE');
});

test('negative fees rejected', () => {
  const result = validateProviderPricingConfig({
    ...completePricing,
    pricePerKmCents: -1,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'DELIVERY_PRICING_INVALID');
});

test('currency must be EUR', () => {
  const result = validateProviderPricingConfig({
    ...completePricing,
    currency: 'USD',
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'DELIVERY_PRICING_INVALID');
});

test('save allows pricingEnabled=false without fee fields', () => {
  const result = validateProviderPricingForSave({
    pricingEnabled: false,
    baseFeeCents: null,
    pricePerKmCents: null,
    minimumFeeCents: null,
    freeDeliveryRadiusKm: 0,
    maxDistanceKm: 10,
  });
  assert.equal(result.ok, true);
});

test('save requires complete fees when pricingEnabled=true', () => {
  const result = validateProviderPricingForSave({
    pricingEnabled: true,
    baseFeeCents: null,
    pricePerKmCents: 75,
    minimumFeeCents: 300,
    freeDeliveryRadiusKm: 0,
    maxDistanceKm: 10,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'DELIVERY_PRICING_INCOMPLETE');
});

test('free radius → deliveryPrice 0', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: completePricing,
    routeDistanceKm: 1.5,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) {
    assert.equal(quote.deliveryFeeCents, 0);
    assert.equal(quote.withinFreeRadius, true);
    assert.equal(quote.breakdown.formulaVersion, PROVIDER_PRICING_FORMULA_VERSION);
  }
});

test('exact free radius boundary is free', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: completePricing,
    routeDistanceKm: 2,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) assert.equal(quote.deliveryFeeCents, 0);
});

test('formula: base + (km - free) * perKm', () => {
  // 5km, free 2 → chargeable 3 → 250 + 3*75 = 475; min 300 → 475
  const quote = calculateProviderDeliveryPrice({
    pricing: completePricing,
    routeDistanceKm: 5,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) {
    assert.equal(quote.deliveryFeeCents, 475);
    assert.equal(quote.breakdown.distanceFeeCents, 225);
    assert.equal(quote.chargeableDistanceKm, 3);
  }
});

test('minimum fee floor applies', () => {
  // 2.1km → chargeable 0.1 → 250 + 8 = 258 → max(300, 258) = 300
  const quote = calculateProviderDeliveryPrice({
    pricing: completePricing,
    routeDistanceKm: 2.1,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) assert.equal(quote.deliveryFeeCents, 300);
});

test('max distance out of radius fail closed', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: completePricing,
    routeDistanceKm: 20,
  });
  assert.equal(quote.ok, false);
  if (!quote.ok) assert.equal(quote.code, 'DELIVERY_OUT_OF_RADIUS');
});

test('nationalCoverage ignores max distance', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: { ...completePricing, nationalCoverage: true },
    routeDistanceKm: 200,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) {
    // 200 - 2 free = 198 * 75 = 14850 + 250 = 15100
    assert.equal(quote.deliveryFeeCents, 15100);
  }
});

test('missing route fails closed (no silent fallback)', () => {
  const quote = calculateProviderDeliveryPrice({
    pricing: completePricing,
    routeDistanceKm: null,
  });
  assert.equal(quote.ok, false);
  if (!quote.ok) assert.equal(quote.code, 'DELIVERY_ROUTE_UNAVAILABLE');
});

test('provider owns pricing — platform constants never appear in quote', () => {
  // Platform legacy uses different rates; quote must equal only provider inputs.
  const quote = calculateProviderDeliveryPrice({
    pricing: {
      pricingEnabled: true,
      baseFeeCents: 100,
      pricePerKmCents: 50,
      minimumFeeCents: 100,
      freeDeliveryRadiusKm: 0,
      maxDistanceKm: 50,
      currency: 'EUR',
    },
    routeDistanceKm: 10,
  });
  assert.equal(quote.ok, true);
  if (quote.ok) {
    assert.equal(quote.deliveryFeeCents, 100 + 10 * 50);
    assert.equal(quote.breakdown.baseFeeCents, 100);
    assert.equal(quote.breakdown.pricePerKmCents, 50);
  }
});

test('freeDeliveryRadius > maxDistance rejected when not national', () => {
  const result = validateProviderPricingConfig({
    ...completePricing,
    freeDeliveryRadiusKm: 20,
    maxDistanceKm: 10,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.code, 'DELIVERY_PRICING_INVALID');
});

if (!process.exitCode) {
  console.log('\nAll Phase 2 provider-pricing tests passed.');
}
