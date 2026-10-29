#!/usr/bin/env npx tsx
/**
 * Isolated multi-location rules. No database and no production seller data.
 * Run: npx tsx --test lib/seller/sales-locations.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  getBusinessVisibilityProfile,
  resolveBusinessPlanId,
} from '@/lib/business/visibility-profile';
import { isWithinRadiusKm } from '@/lib/geo/local-discovery';
import {
  DEMY_KRENTENBOL_PRODUCT_ID,
  activeFeedPoints,
  actorOwnsLocation,
  checkoutAddressForFulfillment,
  dedupeMarketplaceRows,
  DOWNGRADE_KEEPS_STORED_LOCATIONS,
  entitledActiveLocationIds,
  defaultPickupLocationId,
  formatSalesLocationAddress,
  listingMatchesDiscovery,
  locationLimitDecision,
  nearestFeedSalesPoint,
  parseSalesLocationDraft,
  primaryIdAfterDeactivate,
  salesLocationAssignmentChangesStock,
  salesLocationLimitForPlan,
  selectFeedDisplayAnchor,
  selectNewlyCreatedLocation,
} from './sales-locations';

const VLAARDINGEN = { lat: 51.9125, lng: 4.3417, city: 'Vlaardingen' };
const ROTTERDAM = { lat: 51.9225, lng: 4.4792, city: 'Rotterdam' };

const KRENTENBOL_LOCATIONS = [
  {
    id: 'loc-vlaardingen',
    lat: VLAARDINGEN.lat,
    lng: VLAARDINGEN.lng,
    city: VLAARDINGEN.city,
    isActive: true,
    isPrimary: true,
  },
  {
    id: 'loc-rotterdam',
    lat: ROTTERDAM.lat,
    lng: ROTTERDAM.lng,
    city: ROTTERDAM.city,
    isActive: true,
    isPrimary: false,
  },
  {
    id: 'loc-inactive',
    lat: 52.37,
    lng: 4.89,
    city: 'Amsterdam',
    isActive: false,
    isPrimary: false,
  },
];

describe('subscription location limits', () => {
  it('keeps prices and applies the V1 location caps', () => {
    const individual = getBusinessVisibilityProfile('individual');
    const basic = getBusinessVisibilityProfile('basic');
    const pro = getBusinessVisibilityProfile('pro');
    const premium = getBusinessVisibilityProfile('premium');

    assert.equal(individual.monthlyPriceCents, 0);
    assert.equal(basic.monthlyPriceCents, 3900);
    assert.equal(pro.monthlyPriceCents, 9900);
    assert.equal(premium.monthlyPriceCents, 19900);
    assert.equal(individual.commissionPercent, 12);
    assert.equal(basic.commissionPercent, 9);
    assert.equal(pro.commissionPercent, 7);
    assert.equal(premium.commissionPercent, 5);

    assert.equal(salesLocationLimitForPlan('individual'), 1);
    assert.equal(salesLocationLimitForPlan('basic'), 1);
    assert.equal(salesLocationLimitForPlan('pro'), 3);
    assert.equal(salesLocationLimitForPlan('premium'), 25);
    assert.equal(locationLimitDecision(25, 25).allowed, false);
    assert.equal(locationLimitDecision(24, 25).allowed, true);
    assert.equal(locationLimitDecision(1, 1).code, 'LOCATION_LIMIT');
    assert.equal(locationLimitDecision(1, 1).upgradeHref, '/sell');
  });
});

describe('location management rules', () => {
  it('adds, edits fields, deactivates, and keeps a primary', () => {
    const draft = parseSalesLocationDraft({
      name: 'Oliebollenkraam Vlaardingen',
      street: 'Hoogstraat',
      houseNumber: '1',
      postalCode: '3131 BC',
      city: 'Vlaardingen',
      country: 'nl',
    });
    assert.equal(draft.ok, true);
    if (!draft.ok) return;
    assert.equal(draft.value.country, 'NL');
    assert.match(formatSalesLocationAddress(draft.value), /Hoogstraat 1/);
    assert.match(formatSalesLocationAddress(draft.value), /Vlaardingen/);

    const edited = parseSalesLocationDraft({ ...draft.value, name: 'Kraam Markt' });
    assert.equal(edited.ok && edited.value.name, 'Kraam Markt');

    const nextPrimary = primaryIdAfterDeactivate(
      [
        { id: 'a', isPrimary: true, isActive: true },
        { id: 'b', isPrimary: false, isActive: true },
      ],
      'a',
    );
    assert.equal(nextPrimary, 'b');
    assert.equal(
      defaultPickupLocationId([
        { id: 'a', isPrimary: false, isActive: true },
        { id: 'b', isPrimary: true, isActive: true },
      ]),
      'b',
    );
  });

  it('rejects a location owned by someone else', () => {
    assert.equal(actorOwnsLocation('seller-1', 'seller-1'), true);
    assert.equal(actorOwnsLocation('seller-1', 'seller-2'), false);
    assert.equal(actorOwnsLocation('seller-1', ''), false);
  });
});

describe('product locations and marketplace', () => {
  it('keeps one product visible from either stall and falls back without links', () => {
    const points = activeFeedPoints(KRENTENBOL_LOCATIONS);
    assert.equal(points.some((point) => point.city === 'Amsterdam'), false);

    const nearVlaardingen = selectFeedDisplayAnchor({
      points,
      viewer: VLAARDINGEN,
      legacyCoords: { lat: 52.09, lng: 5.12 },
      legacyPlace: 'Utrecht',
    });
    const nearRotterdam = selectFeedDisplayAnchor({
      points,
      viewer: ROTTERDAM,
      legacyCoords: { lat: 52.09, lng: 5.12 },
      legacyPlace: 'Utrecht',
    });
    assert.equal(nearVlaardingen.place, 'Vlaardingen');
    assert.equal(nearRotterdam.place, 'Rotterdam');
    assert.equal(nearVlaardingen.locationId, 'loc-vlaardingen');
    assert.equal(nearRotterdam.locationId, 'loc-rotterdam');

    const rows = dedupeMarketplaceRows([
      { id: DEMY_KRENTENBOL_PRODUCT_ID, place: nearVlaardingen.place },
      { id: DEMY_KRENTENBOL_PRODUCT_ID, place: nearRotterdam.place },
    ]);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.id, DEMY_KRENTENBOL_PRODUCT_ID);

    assert.equal(
      isWithinRadiusKm(nearVlaardingen.distanceKm, 10),
      true,
    );
    assert.equal(
      listingMatchesDiscovery({
        title: 'Krentenbol',
        query: 'krent',
        distanceKm: nearRotterdam.distanceKm,
        radiusKm: 15,
      }),
      true,
    );
    assert.equal(
      listingMatchesDiscovery({
        title: 'Krentenbol',
        query: 'soep',
        distanceKm: nearRotterdam.distanceKm,
        radiusKm: 15,
      }),
      false,
    );

    const legacy = selectFeedDisplayAnchor({
      points: [],
      viewer: VLAARDINGEN,
      legacyCoords: VLAARDINGEN,
      legacyPlace: 'Vlaardingen',
    });
    assert.equal(legacy.locationId, null);
    assert.equal(legacy.place, 'Vlaardingen');
    assert.equal(legacy.lat, VLAARDINGEN.lat);
    assert.equal(
      listingMatchesDiscovery({
        title: 'Krentenbol',
        query: 'krentenbol',
        distanceKm: legacy.distanceKm,
        radiusKm: 5,
      }),
      true,
    );
  });

  it('uses the nearest suitable stall even when another stall is farther', () => {
    const points = activeFeedPoints(KRENTENBOL_LOCATIONS);
    const nearest = nearestFeedSalesPoint(points, ROTTERDAM);
    assert.equal(nearest?.locationId, 'loc-rotterdam');
    const far = selectFeedDisplayAnchor({
      points,
      viewer: { lat: 53.2, lng: 6.6 },
      legacyCoords: null,
      legacyPlace: null,
    });
    assert.equal(far.locationId != null, true);
    assert.equal(
      listingMatchesDiscovery({
        title: 'Krentenbol',
        query: '',
        distanceKm: far.distanceKm,
        radiusKm: 5,
      }),
      false,
    );
  });
});

describe('inline create keeps the product form', () => {
  it('selects the new location without replacing the form object', () => {
    const form = {
      title: 'Krentenbol',
      description: 'Vers gebakken',
      price: '2,50',
    };
    const next = selectNewlyCreatedLocation(form, ['loc-vlaardingen'], 'loc-rotterdam');
    assert.equal(next.form, form);
    assert.deepEqual(next.form, {
      title: 'Krentenbol',
      description: 'Vers gebakken',
      price: '2,50',
    });
    assert.deepEqual(next.selectedIds, ['loc-vlaardingen', 'loc-rotterdam']);
  });
});

describe('pickup selection survives checkout without touching stock', () => {
  it('snapshots the chosen stall only for pickup', () => {
    const pickup = checkoutAddressForFulfillment({
      deliveryMode: 'pickup',
      buyerAddress: 'Koperstraat 1, Rotterdam',
      items: [
        {
          pickupLocationAddress: 'Hoogstraat 1, 3131 BC Vlaardingen',
        },
      ],
    });
    assert.equal(pickup, 'Hoogstraat 1, 3131 BC Vlaardingen');
    const delivery = checkoutAddressForFulfillment({
      deliveryMode: 'DELIVERY',
      buyerAddress: 'Koperstraat 1, Rotterdam',
      items: [{ pickupLocationAddress: 'Hoogstraat 1, 3131 BC Vlaardingen' }],
    });
    assert.equal(delivery, 'Koperstraat 1, Rotterdam');
    assert.equal(salesLocationAssignmentChangesStock(), false);
  });
});

describe('subscription security', () => {
  it('keeps Premium for an active named plan and drops an expired one to one location', () => {
    const premium = resolveBusinessPlanId({
      subscriptionId: 'sub_vip_premium',
      subscriptionValidUntil: new Date('2099-01-01T00:00:00.000Z'),
      Subscription: { name: 'premium', feeBps: 500 },
    });
    assert.equal(salesLocationLimitForPlan(premium), 25);
    const expired = resolveBusinessPlanId({
      subscriptionId: 'sub_vip_premium',
      subscriptionValidUntil: new Date('2020-01-01T00:00:00.000Z'),
      Subscription: { name: 'premium', feeBps: 500 },
    });
    assert.equal(expired, 'individual');
    assert.equal(salesLocationLimitForPlan(expired), 1);
  });

  it('does not delete stored stalls when the plan cap shrinks', () => {
    const stored = [
      { id: 'primary', isActive: true, isPrimary: true, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'second', isActive: true, isPrimary: false, createdAt: '2026-01-02T00:00:00.000Z' },
      { id: 'third', isActive: true, isPrimary: false, createdAt: '2026-01-03T00:00:00.000Z' },
    ];
    assert.equal(DOWNGRADE_KEEPS_STORED_LOCATIONS, true);
    assert.deepEqual(entitledActiveLocationIds(stored, 1), ['primary']);
    assert.equal(stored.length, 3);
    assert.equal(locationLimitDecision(stored.length, 1).allowed, false);
    assert.equal(locationLimitDecision(0, 1).allowed, true);
  });

  it('rejects another seller and an inactive stall', () => {
    assert.equal(actorOwnsLocation('seller-a', 'seller-b'), false);
    assert.equal(actorOwnsLocation('seller-a', 'seller-a'), true);
    const active = entitledActiveLocationIds(
      [
        { id: 'open', isActive: true, isPrimary: true, createdAt: '2026-01-01' },
        { id: 'closed', isActive: false, isPrimary: false, createdAt: '2026-01-02' },
      ],
      3,
    );
    assert.deepEqual(active, ['open']);
  });
});

describe('mobile location UI', () => {
  it('uses a full-width stacked layout and a scrollable modal', () => {
    const field = readFileSync(
      new URL('../../components/products/marketplace/SalesLocationField.tsx', import.meta.url),
      'utf8',
    );
    const modal = readFileSync(
      new URL('../../components/seller/SalesLocationFormModal.tsx', import.meta.url),
      'utf8',
    );
    const chooser = readFileSync(
      new URL('../../components/product/detail/PickupLocationChooser.tsx', import.meta.url),
      'utf8',
    );
    const settings = readFileSync(
      new URL('../../components/seller/SellerSalesLocationsCard.tsx', import.meta.url),
      'utf8',
    );
    for (const source of [field, chooser, settings]) {
      assert.match(source, /w-full/);
      assert.match(source, /flex-col/);
    }
    assert.match(field, /Nieuwe locatie toevoegen/);
    assert.match(field, /Opslaan en selecteren/);
    assert.match(modal, /overflow-y-auto/);
    assert.match(chooser, /Beschikbaar op locatie|Afhaallocatie/);
  });
});
