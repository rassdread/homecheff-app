import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateProviderActivation } from '@/lib/delivery/provider-activation';
import { readDeliveryAlignmentFlags } from '@/lib/delivery/delivery-alignment-flags';
import { splitDeliveryCommission } from '@/lib/delivery/quote-snapshot';
import {
  calculateProviderDeliveryPrice,
} from '@/lib/delivery/provider-pricing';

describe('delivery product flags (individual + company)', () => {
  it('defaults enable named selection, provider pricing, business profiles', () => {
    const flags = readDeliveryAlignmentFlags({});
    assert.equal(flags.providerPricingEnabled, true);
    assert.equal(flags.namedProviderSelectionEnabled, true);
    assert.equal(flags.businessProfilesEnabled, true);
    assert.equal(flags.firstAcceptPoolRuntimeEnabled, false);
  });

  it('explicit env can disable product flags', () => {
    const flags = readDeliveryAlignmentFlags({
      DELIVERY_PROVIDER_PRICING_ENABLED: 'false',
      DELIVERY_NAMED_PROVIDER_SELECTION_ENABLED: 'false',
      DELIVERY_BUSINESS_PROFILES_ENABLED: 'false',
      DELIVERY_FIRST_ACCEPT_POOL_ENABLED: 'true',
    });
    assert.equal(flags.providerPricingEnabled, false);
    assert.equal(flags.namedProviderSelectionEnabled, false);
    assert.equal(flags.businessProfilesEnabled, false);
    assert.equal(flags.firstAcceptPoolRuntimeEnabled, true);
  });
});

describe('provider activation gate', () => {
  it('blocks incomplete individual without pricing/area', () => {
    const r = evaluateProviderActivation({
      providerType: 'INDEPENDENT',
      isActive: false,
      isOnline: false,
      homeLat: null,
      homeLng: null,
      maxDistance: null,
      nationalCoverage: false,
      pricingEnabled: false,
      baseFeeCents: null,
      pricePerKmCents: null,
      minimumFeeCents: null,
      freeDeliveryRadiusKm: null,
      companyDisplayName: null,
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.ok(r.missing.includes('serviceArea'));
      assert.ok(r.missing.includes('pricing'));
    }
  });

  it('allows complete company profile', () => {
    const r = evaluateProviderActivation({
      providerType: 'DELIVERY_BUSINESS',
      isActive: false,
      isOnline: false,
      homeLat: 51.91,
      homeLng: 4.34,
      maxDistance: 15,
      nationalCoverage: false,
      pricingEnabled: true,
      baseFeeCents: 350,
      pricePerKmCents: 80,
      minimumFeeCents: 495,
      freeDeliveryRadiusKm: 0,
      companyDisplayName: 'Vlaardingen Express',
    });
    assert.equal(r.ok, true);
  });

  it('requires company display name for business', () => {
    const r = evaluateProviderActivation({
      providerType: 'DELIVERY_BUSINESS',
      isActive: false,
      isOnline: false,
      homeLat: 51.91,
      homeLng: 4.34,
      maxDistance: 15,
      nationalCoverage: false,
      pricingEnabled: true,
      baseFeeCents: 350,
      pricePerKmCents: 80,
      minimumFeeCents: 495,
      freeDeliveryRadiusKm: 0,
      companyDisplayName: '',
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(r.missing.includes('companyDisplayName'));
  });
});

describe('delivery economics SSOT (12/88)', () => {
  it('splits customer delivery price without inventing rates', () => {
    const quote = calculateProviderDeliveryPrice({
      pricing: {
        pricingEnabled: true,
        baseFeeCents: 350,
        pricePerKmCents: 80,
        minimumFeeCents: 495,
        freeDeliveryRadiusKm: 0,
        maxDistanceKm: 20,
      },
      routeDistanceKm: 5,
    });
    assert.equal(quote.ok, true);
    if (!quote.ok) return;

    // 350 + 5*80 = 750, min 495 → 750
    assert.equal(quote.deliveryFeeCents, 750);
    const split = splitDeliveryCommission(quote.deliveryFeeCents);
    assert.equal(split.platformCommissionCents, 90); // 12% of 750
    assert.equal(split.providerNetPayoutCents, 660); // 88% of 750
  });
});
