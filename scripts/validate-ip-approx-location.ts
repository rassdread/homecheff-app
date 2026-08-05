/**
 * Contract: IP approx location never requires browser GPS.
 */
import assert from 'node:assert/strict';
import {
  NL_FALLBACK_COORDS,
  resolveIpApproxLocation,
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

const missing = resolveIpApproxLocation(new Headers());
assert.equal(missing, null);

const fallback = resolveIpApproxLocationOrNlFallback(new Headers());
assert.equal(fallback.source, 'fallback-nl');
assert.equal(fallback.lat, NL_FALLBACK_COORDS.lat);
assert.equal(fallback.lng, NL_FALLBACK_COORDS.lng);

console.log('=== IP approx location contract passed ===');
