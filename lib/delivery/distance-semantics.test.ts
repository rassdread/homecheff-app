import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  DELIVERY_DELIVERER_PERCENT,
  DELIVERY_PLATFORM_FEE_PERCENT,
} from '@/lib/fees';
import { MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE } from '@/lib/marketplace-affiliate-pool';
import { isCommerciallyMatchableDeliverer } from '@/lib/delivery/delivery-eligibility';
import { calculateProviderDeliveryPrice } from '@/lib/delivery/provider-pricing';
import { parseAndValidateDeliverySignupFields } from '@/lib/delivery/delivery-signup-validation';
import {
  CONFIGURABLE_DISTANCE_MAX_KM,
  distanceSemanticsMode,
  legacyMarketplaceDistanceEligible,
  marketplaceDistanceEligible,
  planDistanceSettingsWrite,
  validateConfigurableDistanceKm,
  version1DistanceEligible,
} from '@/lib/delivery/distance-semantics';

const root = path.resolve(__dirname, '../..');

function legacyLocal(overrides: Partial<Parameters<typeof marketplaceDistanceEligible>[0]> = {}) {
  return marketplaceDistanceEligible({
    version: null,
    isCaribbean: false,
    nationalCoverage: false,
    distanceToPickupKm: 4,
    distanceFromCourierToDestinationKm: 6,
    pickupToDestinationKm: 8,
    totalRouteKm: 12,
    maxDistanceKm: 10,
    preferredRadiusKm: 2,
    ...overrides,
  });
}

const baseV1 = {
  version: 1 as const,
  isCaribbean: false,
  nationalCoverage: false,
  sameCountry: true,
  distanceToPickupKm: 5,
  distanceFromCourierToDestinationKm: 200,
  pickupToDestinationKm: 200,
  totalRouteKm: 205,
  maxDistanceKm: 250,
  preferredRadiusKm: 10,
};

describe('versioned delivery distance semantics', () => {
  it('A: legacy local route within the old limits is eligible', () => {
    assert.equal(legacyLocal(), true);
  });

  it('B: legacy destination outside the courier-centered radius is not eligible', () => {
    assert.equal(legacyLocal({ distanceFromCourierToDestinationKm: 11 }), false);
  });

  it('C: legacy total route above 100 km is not eligible', () => {
    assert.equal(
      legacyLocal({
        distanceToPickupKm: 40,
        distanceFromCourierToDestinationKm: 40,
        pickupToDestinationKm: 70,
        totalRouteKm: 110,
        maxDistanceKm: 50,
      }),
      false,
    );
  });

  it('D: a populated preferredRadius does not switch a legacy profile', () => {
    assert.equal(distanceSemanticsMode(null), 'legacy');
    assert.equal(legacyLocal({ preferredRadiusKm: 1, distanceToPickupKm: 4 }), true);
    assert.equal(legacyMarketplaceDistanceEligible({
      isCaribbean: false,
      nationalCoverage: false,
      distanceToPickupKm: 4,
      distanceFromCourierToDestinationKm: 6,
      totalRouteKm: 12,
      maxDistanceKm: 10,
    }), true);
  });

  it('E: opening settings does not write the version', () => {
    const source = fs.readFileSync(path.join(root, 'app/api/delivery/settings/route.ts'), 'utf8');
    const getFn = source.slice(source.indexOf('export async function GET'), source.indexOf('export async function PUT'));
    assert.equal(getFn.includes('distanceSemanticsVersion:'), false);
    assert.equal(getFn.includes('preferredRadius: deliveryProfile.maxDistance'), false);
  });

  it('F: an unrelated settings write does not change the version', () => {
    const plan = planDistanceSettingsWrite({
      existingVersion: null,
      existingPreferredRadius: null,
      existingMaxDistance: 8,
      acceptDistanceModelA: false,
      preferredRadius: 10,
      maxDistance: 250,
      preferredRadiusProvided: true,
      maxDistanceProvided: true,
    });
    assert.deepEqual(plan, { ok: true, apply: false });
  });

  it('G: an explicit save stores both distances and version 1 together', () => {
    const plan = planDistanceSettingsWrite({
      existingVersion: null,
      existingPreferredRadius: null,
      existingMaxDistance: 8,
      acceptDistanceModelA: true,
      preferredRadius: 12,
      maxDistance: 250,
      preferredRadiusProvided: true,
      maxDistanceProvided: true,
    });
    assert.deepEqual(plan, {
      ok: true,
      apply: true,
      preferredRadius: 12,
      maxDistance: 250,
      distanceSemanticsVersion: 1,
    });
  });

  it('H: a failed conversion leaves the profile on NULL', () => {
    const plan = planDistanceSettingsWrite({
      existingVersion: null,
      existingPreferredRadius: 4,
      existingMaxDistance: 8,
      acceptDistanceModelA: true,
      preferredRadius: 12,
      maxDistance: 600,
      preferredRadiusProvided: true,
      maxDistanceProvided: true,
    });
    assert.equal(plan.ok, false);
  });

  it('I: version 1 accepts pickup and transport inside the chosen limits', () => {
    assert.equal(marketplaceDistanceEligible(baseV1), true);
  });

  it('J: version 1 rejects a pickup outside the pickup radius', () => {
    assert.equal(marketplaceDistanceEligible({ ...baseV1, distanceToPickupKm: 15 }), false);
  });

  it('K: version 1 rejects transport outside the transport limit', () => {
    assert.equal(marketplaceDistanceEligible({ ...baseV1, pickupToDestinationKm: 300 }), false);
  });

  it('L: version 1 does not apply the legacy 100 km total-route cap', () => {
    assert.equal(marketplaceDistanceEligible({ ...baseV1, totalRouteKm: 180 }), true);
  });

  it('M: 500 km transport is accepted', () => {
    assert.deepEqual(validateConfigurableDistanceKm(500), { ok: true, km: 500 });
    assert.equal(CONFIGURABLE_DISTANCE_MAX_KM, 500);
  });

  it('N: transport above 500 km is rejected', () => {
    assert.equal(validateConfigurableDistanceKm(500.1).ok, false);
    assert.equal(validateConfigurableDistanceKm(-1).ok, false);
  });

  it('O: updating the pickup radius keeps the transport distance', () => {
    const plan = planDistanceSettingsWrite({
      existingVersion: 1,
      existingPreferredRadius: 10,
      existingMaxDistance: 250,
      acceptDistanceModelA: true,
      preferredRadius: 18,
      maxDistance: undefined,
      preferredRadiusProvided: true,
      maxDistanceProvided: false,
    });
    assert.equal(plan.ok && plan.apply && plan.preferredRadius === 18 && plan.maxDistance === 250, true);
  });

  it('P: updating the transport distance keeps the pickup radius', () => {
    const plan = planDistanceSettingsWrite({
      existingVersion: 1,
      existingPreferredRadius: 10,
      existingMaxDistance: 250,
      acceptDistanceModelA: true,
      preferredRadius: undefined,
      maxDistance: 400,
      preferredRadiusProvided: false,
      maxDistanceProvided: true,
    });
    assert.equal(plan.ok && plan.apply && plan.preferredRadius === 10 && plan.maxDistance === 400, true);
  });

  it('Q: independent signup assigns version 1 and both distances', () => {
    const result = parseAndValidateDeliverySignupFields(
      {
        name: 'Ada',
        email: 'ada@example.com',
        password: 'secret12',
        username: 'ada_rider',
        age: 28,
        transportation: ['BIKE'],
        acceptDeliveryAgreement: true,
        preferredRadius: 12,
        maxDistance: 250,
        distanceSemanticsVersion: 99,
        providerType: 'INDEPENDENT',
      },
      { requireAccountFields: true },
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.preferredRadius, 12);
    assert.equal(result.data.maxDistance, 250);
    assert.equal(result.data.distanceSemanticsVersion, 1);
    assert.equal(result.data.providerType, 'INDEPENDENT');
    const service = fs.readFileSync(path.join(root, 'lib/delivery/delivery-signup-service.ts'), 'utf8');
    assert.match(service, /distanceSemanticsVersion: data\.distanceSemanticsVersion/);
  });

  it('R: business signup assigns version 1 and both distances', () => {
    const result = parseAndValidateDeliverySignupFields(
      {
        name: 'Owner',
        email: 'owner@example.com',
        password: 'secret12',
        username: 'owner_company',
        age: 32,
        transportation: ['CAR'],
        acceptDeliveryAgreement: true,
        preferredRadius: 15,
        maxDistance: 250,
        providerType: 'DELIVERY_BUSINESS',
        companyName: 'Rotterdam Rides',
        kvkNumber: '12345678',
        homeAddress: 'Coolsingel 40, Rotterdam',
      },
      { requireAccountFields: true },
    );
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.data.distanceSemanticsVersion, 1);
    assert.equal(result.data.preferredRadius, 15);
    assert.equal(result.data.maxDistance, 250);
    assert.equal(result.data.providerType, 'DELIVERY_BUSINESS');
  });

  it('S: national coverage stays same-country nationwide for both versions', () => {
    assert.equal(legacyLocal({ nationalCoverage: true, totalRouteKm: 400, maxDistanceKm: 5 }), true);
    assert.equal(marketplaceDistanceEligible({
      ...baseV1,
      nationalCoverage: true,
      distanceToPickupKm: 400,
      pickupToDestinationKm: 400,
      totalRouteKm: 800,
    }), true);
    const cross = version1DistanceEligible({
      nationalCoverage: true,
      isCaribbean: false,
      sameCountry: false,
      distanceToPickupKm: 1,
      pickupToDestinationKm: 1,
      preferredRadiusKm: 10,
      maxDistanceKm: 250,
    });
    assert.equal(cross.ok, false);
  });

  it('T: a known cross-country route is not eligible', () => {
    assert.equal(marketplaceDistanceEligible({ ...baseV1, sameCountry: false }), false);
    const quote = calculateProviderDeliveryPrice({
      pricing: {
        pricingEnabled: true,
        baseFeeCents: 100,
        pricePerKmCents: 50,
        minimumFeeCents: 0,
        freeDeliveryRadiusKm: 0,
        maxDistanceKm: 500,
        currency: 'EUR',
        nationalCoverage: true,
      },
      routeDistanceKm: 20,
      pickupCountryCode: 'NL',
      dropoffCountryCode: 'BE',
      providerCountryCode: 'NL',
    });
    assert.equal(quote.ok, false);
  });

  it('U: legacy Caribbean matching stays the 50 km same-island rule', () => {
    assert.equal(legacyLocal({
      isCaribbean: true,
      nationalCoverage: true,
      distanceToPickupKm: 40,
      maxDistanceKm: 5,
      totalRouteKm: 180,
    }), true);
    assert.equal(legacyLocal({ isCaribbean: true, distanceToPickupKm: 60, maxDistanceKm: 100 }), false);
  });

  it('V: version 1 Caribbean matching does not open inter-island eligibility', () => {
    const far = version1DistanceEligible({
      nationalCoverage: true,
      isCaribbean: true,
      sameCountry: true,
      distanceToPickupKm: 80,
      pickupToDestinationKm: 20,
      preferredRadiusKm: 100,
      maxDistanceKm: 250,
    });
    assert.equal(far.ok, false);
    assert.equal(far.reason, 'CARIBBEAN');
    const near = version1DistanceEligible({
      nationalCoverage: false,
      isCaribbean: true,
      sameCountry: true,
      distanceToPickupKm: 20,
      pickupToDestinationKm: 30,
      preferredRadiusKm: 25,
      maxDistanceKm: 40,
    });
    assert.equal(near.ok, true);
  });

  it('W: a blocked courier is not matchable', () => {
    assert.equal(isCommerciallyMatchableDeliverer({
      isActive: true,
      isVerified: true,
      isBlocked: true,
      profileAge: 30,
    }), false);
  });

  it('X: an unverified courier is not matchable', () => {
    assert.equal(isCommerciallyMatchableDeliverer({
      isActive: true,
      isVerified: false,
      isBlocked: false,
      profileAge: 30,
    }), false);
  });

  it('Y: an inactive courier is not matchable', () => {
    assert.equal(isCommerciallyMatchableDeliverer({
      isActive: false,
      isVerified: true,
      isBlocked: false,
      profileAge: 30,
    }), false);
  });

  it('Z: a 200 km quote uses the existing pickup-to-destination formula', () => {
    const quote = calculateProviderDeliveryPrice({
      pricing: {
        pricingEnabled: true,
        baseFeeCents: 100,
        pricePerKmCents: 50,
        minimumFeeCents: 0,
        freeDeliveryRadiusKm: 0,
        maxDistanceKm: 500,
        currency: 'EUR',
        nationalCoverage: false,
      },
      routeDistanceKm: 200,
      pickupCountryCode: 'NL',
      dropoffCountryCode: 'NL',
      providerCountryCode: 'NL',
    });
    assert.equal(quote.ok, true);
    if (!quote.ok) return;
    assert.equal(quote.deliveryFeeCents, 10100);
    assert.equal(quote.breakdown.formulaVersion, 'provider-v1');
    assert.equal(quote.routeDistanceKm, 200);
  });

  it('AA: the 88/12 split is unchanged', () => {
    assert.equal(DELIVERY_DELIVERER_PERCENT, 88);
    assert.equal(DELIVERY_PLATFORM_FEE_PERCENT, 12);
  });

  it('AB: affiliate accounting stays 50 percent of the platform fee', () => {
    assert.equal(MARKETPLACE_TOTAL_AFFILIATE_POOL_MAX_PERCENT_OF_PLATFORM_FEE, 50);
    const affiliate = fs.readFileSync(path.join(root, 'lib/marketplace-affiliate-pool.ts'), 'utf8');
    assert.equal(affiliate.includes('distanceSemanticsVersion'), false);
  });

  it('AC: payout authorization is unchanged', () => {
    const payout = fs.readFileSync(path.join(root, 'lib/delivery/delivery-payout.ts'), 'utf8');
    assert.equal(payout.includes('distanceSemanticsVersion'), false);
    assert.match(payout, /assertCommercialCourierCanReceivePayout/);
  });

  it('AD: historical payout records are not rewritten by this migration', () => {
    const sql = fs.readFileSync(
      path.join(root, 'prisma/migrations/20261023150000_delivery_distance_semantics_version/migration.sql'),
      'utf8',
    );
    assert.match(sql, /ADD COLUMN "distanceSemanticsVersion" INTEGER/);
    const sqlCode = sql.replace(/--.*$/gm, '');
    assert.equal(/UPDATE|DELETE|DEFAULT/i.test(sqlCode), false);
    const payout = fs.readFileSync(path.join(root, 'lib/delivery/delivery-payout.ts'), 'utf8');
    assert.equal(payout.includes('tr_3UTNroRpYdPVF6LP08CZ24LX'), false);
  });

  it('AE: an unknown version fails closed', () => {
    assert.equal(distanceSemanticsMode(2), 'unsupported');
    assert.equal(marketplaceDistanceEligible({ ...baseV1, version: 2 }), false);
    assert.equal(marketplaceDistanceEligible({ ...baseV1, version: 0 }), false);
  });

  it('AF: the migration does not rewrite existing NULL profiles', () => {
    const sql = fs.readFileSync(
      path.join(root, 'prisma/migrations/20261023150000_delivery_distance_semantics_version/migration.sql'),
      'utf8',
    );
    assert.equal(sql.includes('UPDATE'), false);
    assert.equal(sql.includes('SET '), false);
    const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
    assert.match(schema, /distanceSemanticsVersion Int\?/);
    assert.equal(schema.includes('distanceSemanticsVersion Int? @default'), false);
  });

  it('AG: both signup flows still redirect to their dashboards', () => {
    const independent = fs.readFileSync(path.join(root, 'app/delivery/signup/page.tsx'), 'utf8');
    const business = fs.readFileSync(path.join(root, 'app/delivery/company/signup/page.tsx'), 'utf8');
    assert.match(independent, /\/delivery\/dashboard\?welcome=true&newSignup=true/);
    assert.match(business, /\/delivery\/company\/dashboard\?welcome=true&newSignup=true/);
    assert.match(independent, /Ophaalradius|deliverySignup\.pickupRadius/);
    assert.match(business, /company-transport-distance/);
  });

  it('AH: marketplace and standalone version 1 use the same eligibility decision', () => {
    const decision = version1DistanceEligible({
      nationalCoverage: false,
      isCaribbean: false,
      sameCountry: true,
      distanceToPickupKm: 5,
      pickupToDestinationKm: 200,
      preferredRadiusKm: 10,
      maxDistanceKm: 250,
    });
    assert.equal(decision.ok, marketplaceDistanceEligible(baseV1));
    const standalone = fs.readFileSync(path.join(root, 'lib/delivery/standalone-delivery.ts'), 'utf8');
    assert.match(standalone, /if \(distanceMode === 'v1'\)/);
    assert.match(standalone, /version1DistanceEligible/);
    assert.equal(standalone.includes('legacyMarketplaceDistanceEligible'), false);
    const match = fs.readFileSync(path.join(root, 'app/api/delivery/match-deliverers/route.ts'), 'utf8');
    assert.equal(match.includes('deliveryRegions'), false);
    assert.match(match, /country: sellerCountry/);
  });
});
