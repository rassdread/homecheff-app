import assert from 'node:assert/strict';
import test from 'node:test';
import { activeOriginStatus, describeActiveOrigin, directOrderReach, resolveDelivererPosition } from './delivery-position';

const profile = {
  gpsTrackingEnabled: true,
  isOnline: true,
  currentLat: 52.37,
  currentLng: 4.89,
  lastGpsUpdate: new Date('2026-11-17T12:00:00.000Z'),
  homeLat: 51.91,
  homeLng: 4.34,
  user: { lat: null, lng: null },
};

test('a fresh phone location expires and a later pickup stays at home', () => {
  const now = new Date('2026-11-17T12:10:00.000Z').getTime();
  const live = resolveDelivererPosition(profile, now);
  assert.equal(live?.source, 'gps');
  const status = activeOriginStatus(profile, now);
  assert.equal(status.active, 'gps');
  assert.equal(status.gpsExpiresAt, '2026-11-17T12:15:00.000Z');
  const later = resolveDelivererPosition(profile, now, { immediate: false });
  assert.equal(later?.source, 'home');
  const stale = resolveDelivererPosition(profile, new Date('2026-11-17T12:16:00.000Z').getTime());
  assert.equal(stale?.source, 'home');
  assert.equal(activeOriginStatus(profile, new Date('2026-11-17T12:16:00.000Z').getTime()).active, 'home');
  const reach = directOrderReach({
    activeSource: 'gps',
    distanceFromActiveKm: 2,
    distanceFromHomeKm: 40,
    routeKm: 3,
    pickupRadiusKm: 8,
    maxTransportKm: 25,
  });
  assert.deepEqual(reach, { direct: true, planned: false });
  assert.deepEqual(
    describeActiveOrigin({ preference: 'DYNAMIC', active: status.active, place: 'Amsterdam' }),
    [{ id: 'aroundGps', place: 'Amsterdam' }],
  );
  const expired = activeOriginStatus(profile, new Date('2026-11-17T12:16:00.000Z').getTime());
  assert.deepEqual(
    describeActiveOrigin({ preference: 'DYNAMIC', active: expired.active, place: 'Vlaardingen' }),
    [{ id: 'aroundHome', place: 'Vlaardingen' }, { id: 'preferGps' }],
  );
  const chosenGps = { ...profile, gpsTrackingEnabled: false, currentLat: null, currentLng: null, lastGpsUpdate: null };
  assert.equal(activeOriginStatus(chosenGps, now).active, 'home');
  assert.deepEqual(
    describeActiveOrigin({ preference: 'DYNAMIC', active: 'home', place: 'Vlaardingen' }),
    [{ id: 'aroundHome', place: 'Vlaardingen' }, { id: 'preferGps' }],
  );
  assert.deepEqual(
    describeActiveOrigin({ preference: 'FIXED', active: 'home', place: 'Vlaardingen' }),
    [{ id: 'aroundHome', place: 'Vlaardingen' }],
  );
});
