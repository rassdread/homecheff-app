/**
 * Contract: IP approx location never requires browser GPS.
 * Phase 5.6 — unknown geo → global browse (no invented NL for non-NL).
 */
import assert from 'node:assert/strict';
import {
  NL_FALLBACK_COORDS,
  resolveIpApproxLocation,
  resolveIpApproxLocationForBrowse,
  resolveIpApproxLocationOrNlFallback,
} from '../lib/geo/ip-approx-location';

const vercel = resolveIpApproxLocation(
  new Headers({
    'x-vercel-ip-latitude': '51.9225',
    'x-vercel-ip-longitude': '4.47917',
    'x-vercel-ip-city': 'Rotterdam',
    'x-vercel-ip-country-region': 'ZH',
    'x-vercel-ip-country': 'NL',
  }),
);
assert.equal(vercel?.city, 'Rotterdam');
assert.equal(vercel?.source, 'vercel');
assert.equal(vercel?.countryCode, 'NL');

const missing = resolveIpApproxLocation(new Headers());
assert.equal(missing, null);

const browse = resolveIpApproxLocationForBrowse(new Headers());
assert.equal(browse.mode, 'global');
assert.equal(browse.source, 'none');

const fallback = resolveIpApproxLocationOrNlFallback(new Headers());
assert.equal(fallback.source, 'fallback-nl');
assert.equal(fallback.lat, NL_FALLBACK_COORDS.lat);
assert.equal(fallback.lng, NL_FALLBACK_COORDS.lng);

const be = resolveIpApproxLocationForBrowse(
  new Headers({
    'x-vercel-ip-latitude': '51.05',
    'x-vercel-ip-longitude': '3.73',
    'x-vercel-ip-country': 'BE',
    'x-vercel-ip-city': 'Ghent',
  }),
);
assert.equal(be.countryCode, 'BE');
assert.notEqual(be.source, 'fallback-nl');

console.log('=== IP approx location contract passed ===');
