import assert from 'node:assert/strict';
import test from 'node:test';
import {
  COMMERCIAL_DISTANCE_UNAVAILABLE,
  clearDistanceCache,
  getRouteDistance,
  interpretDistanceMatrixElement,
  isVerifiedRoadDistance,
} from '../google-maps-distance';

const origin = { lat: 51.9225, lng: 4.47917 };
const destination = { lat: 52.0116, lng: 4.3571 };

function googleBody(overrides: Record<string, unknown> = {}) {
  return {
    status: 'OK',
    rows: [
      {
        elements: [
          {
            status: 'OK',
            distance: { value: 16094, text: '16.1 km' },
            duration: { value: 1437, text: '24 mins' },
          },
        ],
      },
    ],
    ...overrides,
  };
}

test('Google success is a verified road distance', () => {
  const result = interpretDistanceMatrixElement(googleBody());
  assert.equal(result?.distanceSource, 'google');
  assert.equal(result?.distance, 16.1);
  assert.equal(result?.duration, 24);
  assert.equal(isVerifiedRoadDistance(result), true);
});

test('API error, ZERO_RESULTS, and invalid payloads are not commercial quotes', () => {
  assert.equal(interpretDistanceMatrixElement(googleBody({ status: 'REQUEST_DENIED', rows: [] })), null);
  assert.equal(
    interpretDistanceMatrixElement(
      googleBody({
        rows: [{ elements: [{ status: 'ZERO_RESULTS' }] }],
      }),
    ),
    null,
  );
  assert.equal(
    interpretDistanceMatrixElement(
      googleBody({
        rows: [{ elements: [{ status: 'OK', distance: { value: 0 }, duration: { value: 60 } }] }],
      }),
    ),
    null,
  );
  assert.equal(interpretDistanceMatrixElement(null), null);
  assert.equal(isVerifiedRoadDistance({ error: 'x', message: 'y' }), false);
});

test('missing key, timeout, and HTTP error return labeled haversine and cannot price', async () => {
  clearDistanceCache();
  const missing = await getRouteDistance(origin, destination, 'driving', { apiKey: null });
  assert.equal(isVerifiedRoadDistance(missing), false);
  assert.equal('distance' in missing && missing.distanceSource, 'haversine');

  clearDistanceCache();
  const timeout = await getRouteDistance(
    { lat: 51.1, lng: 4.1 },
    { lat: 52.2, lng: 4.2 },
    'driving',
    {
      apiKey: 'test-key',
      fetchImpl: async () => {
        throw new Error('timeout');
      },
    },
  );
  assert.equal(isVerifiedRoadDistance(timeout), false);
  assert.equal('distance' in timeout && timeout.distanceSource, 'haversine');

  clearDistanceCache();
  const httpError = await getRouteDistance(
    { lat: 51.3, lng: 4.3 },
    { lat: 52.4, lng: 4.4 },
    'driving',
    {
      apiKey: 'test-key',
      fetchImpl: async () => new Response('nope', { status: 500 }),
    },
  );
  assert.equal(isVerifiedRoadDistance(httpError), false);

  const straight = 'distance' in timeout ? timeout.distance : 0;
  const road = 16.1;
  assert.ok(straight > 0);
  assert.notEqual(straight, road);
  assert.equal(COMMERCIAL_DISTANCE_UNAVAILABLE.code, 'DELIVERY_ROUTE_UNRELIABLE');
  assert.match(COMMERCIAL_DISTANCE_UNAVAILABLE.error, /niet betrouwbaar/);
  assert.match(COMMERCIAL_DISTANCE_UNAVAILABLE.message, /cannot currently be calculated reliably/);
});

test('a verified Google response stays distinct from a failed response for the same coordinates', async () => {
  clearDistanceCache();
  const coordsA = { lat: 51.5, lng: 4.5 };
  const coordsB = { lat: 52.6, lng: 4.6 };
  const ok = await getRouteDistance(coordsA, coordsB, 'driving', {
    apiKey: 'test-key',
    fetchImpl: async () =>
      new Response(JSON.stringify(googleBody()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  });
  assert.equal(isVerifiedRoadDistance(ok), true);
  assert.equal('distance' in ok && ok.distance, 16.1);

  clearDistanceCache();
  const failed = await getRouteDistance(coordsA, coordsB, 'driving', {
    apiKey: 'test-key',
    fetchImpl: async () =>
      new Response(JSON.stringify({ status: 'OVER_QUERY_LIMIT', rows: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  });
  assert.equal(isVerifiedRoadDistance(failed), false);
  assert.equal('distance' in failed && failed.distanceSource, 'haversine');
});
