/**
 * Feed search context bar — applied-state chips only.
 * Run: npx tsx scripts/test-feed-search-context.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  buildSearchContextChips,
  formatSearchContextRadiusKm,
  resolveSearchContextLocation,
} from '../lib/feed/feed-search-context';
import { FEED_SCOPE_NEARBY, FEED_SCOPE_NATIONAL } from '../lib/feed/feed-scope';

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

const root = path.resolve(__dirname, '..');
const geo = fs.readFileSync(path.join(root, 'components/feed/GeoFeed.tsx'), 'utf8');
const bar = fs.readFileSync(
  path.join(root, 'components/feed/FeedSearchContextBar.tsx'),
  'utf8',
);
const en = fs.readFileSync(path.join(root, 'public/i18n/en.json'), 'utf8');
const nl = fs.readFileSync(path.join(root, 'public/i18n/nl.json'), 'utf8');

ok(
  'postcode applied place wins',
  resolveSearchContextLocation({
    appliedPlace: '3135 XX Vlaardingen',
    locationSource: 'gps',
    gpsDisplayLabel: 'Somewhere',
  }).kind === 'postcode' &&
    resolveSearchContextLocation({
      appliedPlace: '3135 XX Vlaardingen',
      locationSource: 'gps',
    }).label === '3135 XX Vlaardingen',
);

ok(
  'city place wins over gps when applied',
  resolveSearchContextLocation({
    appliedPlace: 'Rotterdam',
    locationSource: 'manual',
  }).kind === 'place',
);

ok(
  'gps without label → gps kind null label',
  resolveSearchContextLocation({
    appliedPlace: '',
    locationSource: 'gps',
    gpsDisplayLabel: null,
  }).kind === 'gps' &&
    resolveSearchContextLocation({
      appliedPlace: '',
      locationSource: 'gps',
    }).label === null,
);

ok(
  'fallback when no location',
  resolveSearchContextLocation({
    appliedPlace: '',
    locationSource: null,
  }).kind === 'fallback',
);

ok(
  'never returns coordinates as label',
  !String(
    resolveSearchContextLocation({
      appliedPlace: 'Amsterdam',
      locationSource: 'manual',
    }).label,
  ).match(/^\s*-?\d+(\.\d+)?\s*,/),
);

ok(
  'radius format finite',
  formatSearchContextRadiusKm(10, 'All') === '10 km',
);
ok(
  'radius unlimited',
  formatSearchContextRadiusKm(0, 'All of Netherlands') ===
    'All of Netherlands',
);

const nearbyChips = buildSearchContextChips({
  scope: FEED_SCOPE_NEARBY,
  appliedRadiusKm: 10,
  appliedCategory: 'cheff',
  appliedSortBy: 'distance',
  categoryLabel: 'Meals',
  sortLabel: 'Nearby',
  radiusLabel: '10 km',
  locationLabel: 'Rotterdam',
});
ok(
  'nearby chips include location+radius+category+sort',
  nearbyChips.map((c) => c.id).join(',') ===
    'location,radius,category,sort',
);
ok('location marker', nearbyChips[0]?.marker === '📍');
ok('radius marker', nearbyChips[1]?.marker === '📏');
ok('category meals marker', nearbyChips[2]?.marker === '🍽');

const nationalChips = buildSearchContextChips({
  scope: FEED_SCOPE_NATIONAL,
  appliedRadiusKm: 25,
  appliedCategory: 'all',
  appliedSortBy: 'newest',
  categoryLabel: null,
  sortLabel: 'Newest',
  radiusLabel: '25 km',
  locationLabel: 'Location not set',
});
ok(
  'national omits radius and category',
  nationalChips.map((c) => c.id).join(',') === 'location,sort',
);

const withQuery = buildSearchContextChips({
  scope: FEED_SCOPE_NEARBY,
  appliedRadiusKm: 5,
  appliedCategory: 'all',
  appliedSortBy: 'newest',
  categoryLabel: null,
  sortLabel: 'Newest',
  radiusLabel: '5 km',
  locationLabel: 'Current location',
  appliedQuery: 'soup',
});
ok('query chip when applied', withQuery.some((c) => c.id === 'query'));

ok('GeoFeed imports FeedSearchContextBar', geo.includes('FeedSearchContextBar'));
ok(
  'GeoFeed builds chips from applied state helpers',
  geo.includes('buildSearchContextChips') &&
    geo.includes('resolveSearchContextLocation') &&
    geo.includes('appliedRadius') &&
    geo.includes('appliedPlace'),
);
ok(
  'context bar mounted in feedResultsBlock before refine banner',
  /searchContextBarEl[\s\S]{0,80}locationRefineBannerEl/.test(geo),
);
ok('bar is read-only status region', bar.includes('role="status"'));
ok('bar has test id', bar.includes('feed-search-context-bar'));
ok('en i18n searchContext keys', en.includes('"searchContext"') && en.includes('fromPrefix'));
ok('nl i18n searchContext keys', nl.includes('"searchContext"') && nl.includes('fromPrefix'));

console.log(`\n✅ feed search context: ${passed} checks passed`);
