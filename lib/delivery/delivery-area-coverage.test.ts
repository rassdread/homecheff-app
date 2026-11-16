import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import {
  courierCoversSearchPoint,
  searchPointHasDeliveryCoverage,
  type DeliveryCoverageCourier,
} from './delivery-area-coverage';

const now = new Date('2026-11-16T14:00:00+01:00');
const overlap = { lat: 52.374, lng: 4.897 };
const secondCovered = { lat: 52.4, lng: 4.9 };
const outside = { lat: 52.478, lng: 4.8952 };

function courier(patch: Partial<DeliveryCoverageCourier> = {}): DeliveryCoverageCourier {
  return {
    id: 'courier-a',
    userId: 'user-a',
    isActive: true,
    isVerified: true,
    isBlocked: false,
    age: 36,
    dateOfBirth: new Date('1990-01-01'),
    maxDistance: 40,
    preferredRadius: 8,
    distanceSemanticsVersion: 1,
    nationalCoverage: false,
    temporaryOffline: false,
    vacationStart: null,
    vacationEnd: null,
    workStartTime: '09:00',
    workEndTime: '17:00',
    breakWindows: [],
    availableDays: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag'],
    availableTimeSlots: [],
    isOnline: false,
    onlineUntil: null,
    gpsTrackingEnabled: false,
    currentLat: null,
    currentLng: null,
    lastGpsUpdate: null,
    homeLat: 52.3702,
    homeLng: 4.8952,
    profileLat: null,
    profileLng: null,
    country: 'NL',
    pricingEnabled: true,
    baseFeeCents: 450,
    pricePerKmCents: 80,
    minimumFeeCents: 450,
    acceptanceMode: 'MANUAL_CONFIRM',
    ...patch,
  };
}

describe('delivery area coverage', () => {
  const north = courier();
  const east = courier({
    id: 'courier-b',
    userId: 'user-b',
    homeLat: 52.395,
    homeLng: 4.91,
  });

  it('covers a search point once when two work areas overlap', () => {
    const covered = searchPointHasDeliveryCoverage(
      [north, east],
      overlap,
      new Set(['courier-a', 'courier-b']),
      now,
    );
    assert.equal(covered, true);
    assert.equal(courierCoversSearchPoint(north, overlap, now), true);
    assert.equal(courierCoversSearchPoint(east, overlap, now), true);
  });

  it('keeps a second place that is still inside a work area', () => {
    assert.equal(courierCoversSearchPoint(east, secondCovered, now), true);
    assert.equal(
      searchPointHasDeliveryCoverage([north, east], secondCovered, new Set(['courier-b']), now),
      true,
    );
  });

  it('leaves a place outside both work radii uncovered', () => {
    assert.equal(courierCoversSearchPoint(north, outside, now), false);
    assert.equal(courierCoversSearchPoint(east, outside, now), false);
    assert.equal(
      searchPointHasDeliveryCoverage([north, east], outside, new Set(['courier-a', 'courier-b']), now),
      false,
    );
  });

  it('does not let a wide transport distance or product radius create coverage', () => {
    const wideTransport = courier({ maxDistance: 500, preferredRadius: 8 });
    assert.equal(courierCoversSearchPoint(wideTransport, outside, now), false);
    const source = readFileSync(new URL('./delivery-area-coverage.ts', import.meta.url), 'utf8');
    assert.equal(source.includes('radiusKm'), false);
    const feed = readFileSync(new URL('../../app/api/feed/route.ts', import.meta.url), 'utf8');
    assert.match(feed, /deliveryAreaCovered\(prisma, viewerGeo\)/);
    assert.equal(feed.includes('deliveryAreaCovered(prisma, viewerGeo, effectiveRadius'), false);
  });

  it('ignores a courier who cannot take a paid job', () => {
    assert.equal(
      searchPointHasDeliveryCoverage([north, east], overlap, new Set(), now),
      false,
    );
    assert.equal(
      searchPointHasDeliveryCoverage([north], overlap, new Set(['someone-else']), now),
      false,
    );
  });

  it('counts an offline courier with a future roster and skips a signup without one', () => {
    assert.equal(north.isOnline, false);
    assert.equal(courierCoversSearchPoint(north, overlap, now), true);
    assert.equal(
      courierCoversSearchPoint(courier({ availableDays: [], workStartTime: null, workEndTime: null }), overlap, now),
      false,
    );
  });
});
