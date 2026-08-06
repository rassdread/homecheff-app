/**
 * GPS / “Use my location” validators for the location repair phase.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  gpsCompactMessage,
  gpsUserMessageFor,
  mapGeolocationPositionErrorCode,
  mapGpsFailureString,
} from '../lib/geo/gps-location-errors';
import { mapGpsFailureToNearbyStatus, NEARBY_LOCATION_STATUS } from '../lib/feed/nearby-location-state';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== GPS / Use-my-location validators ===\n');

// Error mapping
check('PERMISSION_DENIED maps from code 1', mapGeolocationPositionErrorCode(1) === 'PERMISSION_DENIED');
check('POSITION_UNAVAILABLE maps from code 2', mapGeolocationPositionErrorCode(2) === 'POSITION_UNAVAILABLE');
check('TIMEOUT maps from code 3', mapGeolocationPositionErrorCode(3) === 'TIMEOUT');
check('denied string maps', mapGpsFailureString('denied') === 'PERMISSION_DENIED');
check('timeout string maps', mapGpsFailureString('TIMEOUT') === 'TIMEOUT');
check('user message offers manual fallback on deny', gpsUserMessageFor('PERMISSION_DENIED').offerManualFallback === true);
check('compact NL message mentions plaats/postcode', /plaats|postcode/i.test(gpsCompactMessage('PERMISSION_DENIED', 'nl')));
check('nearby status denied', mapGpsFailureToNearbyStatus('PERMISSION_DENIED') === NEARBY_LOCATION_STATUS.GPS_DENIED);
check('nearby status timeout', mapGpsFailureToNearbyStatus('TIMEOUT') === NEARBY_LOCATION_STATUS.GPS_TIMEOUT);

const hook = read('hooks/useGeolocation.ts');
check('hook does not auto-call getCurrentPosition on mount', !/useEffect\([\s\S]*getCurrentPosition\(/.test(hook) || !hook.includes('getCurrentPosition();\n  }, []'));
check('hook respects caller timeout (no UA override block)', !hook.includes('isSamsungInternet') && hook.includes('timeout,'));
check('hook sets errorCode on failure', hook.includes('errorCode') && hook.includes('onFallbackRef'));
check('hook watch defaults off', hook.includes('watch = false'));
check('hook default enableHighAccuracy false', /enableHighAccuracy\s*=\s*false/.test(hook));

const geo = read('components/feed/GeoFeed.tsx');
check('GeoFeed uses explicit user GPS action', geo.includes('handleUseMyLocation'));
check('GeoFeed timeout bounded 12s', geo.includes('timeout: 12000'));
check('GeoFeed safety timeout clears spinner', geo.includes('gps-safety-timeout') && geo.includes('20000'));
check('GeoFeed opens manual place on GPS fallback', geo.includes('gps-fallback:') && geo.includes('requestPlaceInputFocus'));
check('GeoFeed reverse-geocodes label without blocking', geo.includes('reverseGeocodeDisplayLabel'));
check('GeoFeed GPS chip prefers display label', geo.includes('gpsDisplayLabel'));
check('GeoFeed passes structured locationError when showGpsError', geo.includes('showGpsError ? locationError'));
check('no BACKGROUND location permission requested in GeoFeed', !geo.includes('ACCESS_BACKGROUND'));

const native = read('lib/native/location.ts');
check('Android uses Capacitor Geolocation', native.includes('@capacitor/geolocation'));
check('native requests permission only on user action helper', native.includes('requestAndGetNativeCurrentPosition'));
check('native maps denied/timeout/unavailable', native.includes('"denied"') && native.includes('"timeout"'));

const manifest = read('android/app/src/main/AndroidManifest.xml');
check('Android has FINE + COARSE', manifest.includes('ACCESS_FINE_LOCATION') && manifest.includes('ACCESS_COARSE_LOCATION'));
check('Android has no BACKGROUND location', !manifest.includes('ACCESS_BACKGROUND_LOCATION'));

const reverse = read('lib/geo/reverse-geocode-label.ts');
check('reverse geocode has timeout', reverse.includes('timeoutMs') && reverse.includes('AbortController'));
check('reverse geocode returns null on failure (non-blocking)', reverse.includes('label: null'));

const sidebar = read('components/feed/FeedSidebarFilters.tsx');
check('sidebar shows GPS error alert', sidebar.includes('feed-gps-error') && sidebar.includes('role="alert"'));

console.log(`\n${passed} checks passed`);
