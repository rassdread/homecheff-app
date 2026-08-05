/**
 * Phase 5.6 — International IP approx + structured location contracts.
 */
import assert from 'node:assert/strict';
import {
  NL_FALLBACK_COORDS,
  resolveIpApproxLocation,
  resolveIpApproxLocationForBrowse,
  resolveIpApproxLocationOrNlFallback,
} from '../lib/geo/ip-approx-location';
import {
  formatBrowseLocationLabel,
  resolveBrowseMode,
  toIsoCountryCode,
} from '../lib/geo/structured-location';
import { normalizePlaceQueryForGeocode } from '../lib/global-geocoding';
import { buildGeoFeedApiParams } from '../lib/feed/feed-query-params';
import { isNearbyMissingLocation } from '../lib/feed/nearby-location-state';

// I1-ish: NL IP with coords
const nl = resolveIpApproxLocation(
  new Headers({
    'x-vercel-ip-latitude': '51.9088',
    'x-vercel-ip-longitude': '4.3444',
    'x-vercel-ip-city': 'Vlaardingen',
    'x-vercel-ip-country': 'NL',
  }),
);
assert.equal(nl?.countryCode, 'NL');
assert.equal(nl?.mode, 'point');
assert.notEqual(nl?.source, 'fallback-nl');

// I2: Belgian IP — must NOT be NL
const be = resolveIpApproxLocation(
  new Headers({
    'x-vercel-ip-latitude': '50.8503',
    'x-vercel-ip-longitude': '4.3517',
    'x-vercel-ip-city': 'Brussels',
    'x-vercel-ip-country': 'BE',
  }),
);
assert.equal(be?.countryCode, 'BE');
assert.equal(be?.city, 'Brussels');
assert.notEqual(be?.countryCode, 'NL');

// I3: US IP
const us = resolveIpApproxLocation(
  new Headers({
    'x-vercel-ip-latitude': '40.7128',
    'x-vercel-ip-longitude': '-74.006',
    'x-vercel-ip-city': 'New%20York',
    'x-vercel-ip-country': 'US',
  }),
);
assert.equal(us?.countryCode, 'US');
assert.equal(us?.city, 'New York');

// Country-only header (no lat)
const beCountryOnly = resolveIpApproxLocation(
  new Headers({ 'x-vercel-ip-country': 'BE' }),
);
assert.equal(beCountryOnly?.mode, 'country');
assert.equal(beCountryOnly?.lat, null);
assert.equal(beCountryOnly?.countryCode, 'BE');

// I4: unknown → global (browse), not NL invent
const missing = resolveIpApproxLocation(new Headers());
assert.equal(missing, null);
const browseMissing = resolveIpApproxLocationForBrowse(new Headers());
assert.equal(browseMissing.mode, 'global');
assert.equal(browseMissing.source, 'none');
assert.equal(browseMissing.lat, null);

// Legacy helper still provides NL coords when forced
const fallback = resolveIpApproxLocationOrNlFallback(new Headers());
assert.equal(fallback.source, 'fallback-nl');
assert.equal(fallback.lat, NL_FALLBACK_COORDS.lat);

// Country boundary params — no centroid radius
const countryParams = buildGeoFeedApiParams({
  scope: 'nearby',
  radius: 25,
  locationMode: 'country',
  countryCode: 'BE',
});
assert.equal(countryParams.get('radius'), '0');
assert.equal(countryParams.get('countryCode'), 'BE');
assert.equal(countryParams.get('locationMode'), 'country');
assert.equal(countryParams.get('scope'), 'international');
assert.equal(countryParams.get('lat'), null);
assert.equal(countryParams.get('place'), null);

// Point mode still sends radius
const pointParams = buildGeoFeedApiParams({
  scope: 'nearby',
  radius: 25,
  locationMode: 'point',
  countryCode: 'BE',
  lat: 51.22,
  lng: 4.4,
  locationSource: 'manual',
  place: 'Antwerpen',
});
assert.equal(pointParams.get('radius'), '25');
assert.equal(pointParams.get('place'), 'Antwerpen');

// Nearby missing respects country mode
assert.equal(
  isNearbyMissingLocation({
    scope: 'nearby',
    locationMode: 'country',
    countryCode: 'BE',
  }),
  false,
);

assert.equal(toIsoCountryCode('Belgium'), 'BE');
assert.equal(toIsoCountryCode('Suriname'), 'SR');
assert.equal(
  formatBrowseLocationLabel({
    city: 'Antwerpen',
    region: 'Vlaanderen',
    country: 'België',
  }),
  'Antwerpen, Vlaanderen, België',
);
assert.equal(
  resolveBrowseMode({
    precision: 'country',
    countryCode: 'FR',
  }),
  'country',
);

// NL postcode normalize still works; BE digit postcodes untouched
assert.equal(normalizePlaceQueryForGeocode('3131AA', 'NL'), '3131 AA');
assert.equal(normalizePlaceQueryForGeocode('2000', 'BE'), '2000');
assert.equal(normalizePlaceQueryForGeocode('SW1A 1AA', 'GB'), 'SW1A 1AA');

console.log('[phase56-international-location] PASS');
