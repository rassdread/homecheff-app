/**
 * Unit checks for lib/geo/item-location.ts — no DB.
 * Run: npx tsx scripts/test-item-location.ts
 */
import assert from 'node:assert/strict';
import {
  firstPlaceSegment,
  formatItemPlaceDistanceLine,
  formatMarketplaceDistanceKm,
  computeViewerDistanceKm,
  placeFromPickupAddress,
  resolveDisplayPlace,
  resolveFeedItemCoordsFromRaw,
  resolveProductCoords,
  resolveProductPlaceLabel,
} from '../lib/geo/item-location';
import { buildGeocodeQueryString } from '../lib/global-geocoding';
import {
  productHasUsableLocation,
  validateProductLocationForPublish,
  saleProductRequiresLocation,
} from '../lib/geo/product-location-requirements';

function testPlaceLabels() {
  assert.equal(firstPlaceSegment('Nederland'), null);
  assert.equal(firstPlaceSegment('Utrecht'), 'Utrecht');
  assert.equal(
    placeFromPickupAddress('Keizersgracht 1, 1015 Amsterdam'),
    '1015 Amsterdam'
  );
  assert.equal(
    resolveProductPlaceLabel({
      pickupAddress: 'Test 1, Rotterdam',
      seller: { User: { place: 'Nederland', city: 'Amsterdam' } },
    }),
    'Rotterdam'
  );
  assert.equal(
    resolveProductPlaceLabel({
      seller: { User: { place: 'Den Haag', city: 'NL' } },
    }),
    'Den Haag'
  );
  assert.equal(resolveDisplayPlace(null), 'Locatie onbekend');
  assert.equal(resolveDisplayPlace('Nederland'), 'Locatie onbekend');
}

function testPlaceDistanceLine() {
  const unknown = 'Locatie onbekend';
  const unknownDist = 'afstand onbekend';
  assert.equal(
    formatItemPlaceDistanceLine({
      place: 'Utrecht',
      distanceKm: 3.2,
      unknownPlaceLabel: unknown,
      unknownDistanceLabel: unknownDist,
    }),
    'Utrecht · 3.2 km'
  );
  assert.equal(
    formatItemPlaceDistanceLine({
      place: 'Utrecht',
      distanceKm: null,
      unknownPlaceLabel: unknown,
      unknownDistanceLabel: unknownDist,
    }),
    'Utrecht'
  );
  assert.equal(
    formatItemPlaceDistanceLine({
      place: null,
      distanceKm: 3.2,
      unknownPlaceLabel: unknown,
      unknownDistanceLabel: unknownDist,
    }),
    'Locatie onbekend · 3.2 km'
  );
  assert.equal(
    formatItemPlaceDistanceLine({
      place: null,
      distanceKm: null,
      unknownPlaceLabel: unknown,
      unknownDistanceLabel: unknownDist,
    }),
    'Locatie onbekend'
  );
  assert.equal(
    formatItemPlaceDistanceLine({
      place: 'Nederland',
      distanceKm: 0,
      unknownPlaceLabel: unknown,
      unknownDistanceLabel: unknownDist,
    }),
    'Locatie onbekend'
  );
  assert.equal(
    formatItemPlaceDistanceLine({
      place: 'Berkel',
      distanceKm: 12.3,
      unknownPlaceLabel: unknown,
      unknownDistanceLabel: unknownDist,
    }),
    'Berkel · 12 km'
  );
  assert.equal(
    formatItemPlaceDistanceLine({
      place: 'Midwolda',
      distanceKm: 230.2,
      unknownPlaceLabel: unknown,
      unknownDistanceLabel: unknownDist,
    }),
    'Midwolda · 230 km'
  );
  assert.equal(formatMarketplaceDistanceKm(8.7), '8.7 km');
  assert.equal(formatMarketplaceDistanceKm(37.4), '37 km');
}

function testCoords() {
  const coords = resolveProductCoords({
    pickupLat: 52.1,
    pickupLng: 5.1,
    seller: { lat: 51.9, lng: 4.4, User: { lat: 51.8, lng: 4.3 } },
  });
  assert.deepEqual(coords, { lat: 52.1, lng: 5.1 });

  const fallback = resolveProductCoords({
    pickupLat: null,
    pickupLng: null,
    seller: { lat: null, lng: null, User: { lat: 52.37, lng: 4.89 } },
  });
  assert.deepEqual(fallback, { lat: 52.37, lng: 4.89 });
}

function testRequirements() {
  assert.equal(saleProductRequiresLocation('CONTACT', 0), true);
  assert.equal(saleProductRequiresLocation('HOMECHEFF_PAYMENT', 500), true);
  assert.equal(saleProductRequiresLocation('HOMECHEFF_PAYMENT', 0), false);

  assert.equal(
    productHasUsableLocation({
      pickupAddress: '1012 AB Amsterdam',
      pickupLat: null,
      pickupLng: null,
    }),
    true
  );
  assert.equal(
    validateProductLocationForPublish({
      seller: { User: { place: 'Utrecht' } },
    }).ok,
    true
  );
  assert.equal(
    validateProductLocationForPublish({
      seller: { User: {} },
    }).ok,
    false
  );
}

function testGeocodeQueryString() {
  assert.equal(
    buildGeocodeQueryString('1012 AB Amsterdam', '', 'NL'),
    '1012 AB Amsterdam, NL'
  );
  assert.equal(
    buildGeocodeQueryString('Keizersgracht 1', 'Amsterdam', 'NL'),
    'Keizersgracht 1, Amsterdam, NL'
  );
}

function testFeedItemCoordsFromRaw() {
  assert.deepEqual(
    resolveFeedItemCoordsFromRaw({ pickupLat: 51.99, pickupLng: 4.47 }),
    { lat: 51.99, lng: 4.47 }
  );
  assert.deepEqual(
    resolveFeedItemCoordsFromRaw({
      lat: 52.0,
      lng: 5.0,
      pickupLat: 51.99,
      pickupLng: 4.47,
    }),
    { lat: 51.99, lng: 4.47 }
  );
  assert.deepEqual(
    resolveFeedItemCoordsFromRaw({
      lat: 52.0,
      lng: 5.0,
      seller: { lat: 51.9, lng: 4.4 },
    }),
    { lat: 51.9, lng: 4.4 }
  );
  assert.deepEqual(
    resolveFeedItemCoordsFromRaw({
      seller: { lat: 51.99, lng: 4.47, User: { lat: 52.1, lng: 5.1 } },
    }),
    { lat: 51.99, lng: 4.47 }
  );
  assert.deepEqual(
    resolveFeedItemCoordsFromRaw({
      seller: { lat: null, lng: null, User: { lat: 52.1, lng: 5.1 } },
    }),
    { lat: 52.1, lng: 5.1 }
  );
  assert.equal(resolveFeedItemCoordsFromRaw({ place: 'Utrecht' }), null);
}

function testViewerDistance() {
  const km = computeViewerDistanceKm(
    { lat: 52.09, lng: 5.12 },
    52.37,
    4.89
  );
  assert.ok(km != null && km > 0);
  assert.equal(computeViewerDistanceKm(null, 52.37, 4.89), undefined);
  assert.equal(computeViewerDistanceKm({ lat: 52.09, lng: 5.12 }, null, 4.89), undefined);
}

import {
  normalizeProductVideo,
  resolveProductDetailVideo,
} from '../lib/product/normalize-product-video';

function testProductVideoNormalize() {
  const single = { id: 'v1', url: 'https://example.com/v.mp4', thumbnail: null };
  assert.deepEqual(normalizeProductVideo(single), single);
  assert.equal(normalizeProductVideo([single]), single);
  assert.equal(normalizeProductVideo(null), null);
  assert.equal(normalizeProductVideo([]), null);
  assert.equal(
    resolveProductDetailVideo(null, { id: 'd1', url: 'https://d.mp4' })?.id,
    'd1',
  );
  assert.equal(
    resolveProductDetailVideo(single, { id: 'd1', url: 'https://d.mp4' })?.id,
    'v1',
  );
}

testPlaceLabels();
testPlaceDistanceLine();
testGeocodeQueryString();
testFeedItemCoordsFromRaw();
testViewerDistance();
testCoords();
testRequirements();
testProductVideoNormalize();
console.log('test-item-location: all passed');
