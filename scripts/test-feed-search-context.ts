/**
 * Feed search context bar — applied-state chips + inline controls.
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
import { RADIUS_PRESET_OPTIONS } from '../lib/geo/local-discovery';

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
const toolbar = fs.readFileSync(
  path.join(root, 'components/feed/FeedMobileToolbar.tsx'),
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
ok(
  'bar is interactive region with inline panels',
  bar.includes('role="region"') &&
    bar.includes('aria-expanded') &&
    bar.includes('feed-search-context-panel') &&
    bar.includes('-action'),
);
ok('bar has test id', bar.includes('feed-search-context-bar'));

ok(
  'location chip opens inline location control',
  bar.includes("togglePanel('location')") &&
    bar.includes('feed-search-context-location-input') &&
    bar.includes('feed-search-context-location-apply'),
);
ok(
  'radius chip opens inline radius control',
  bar.includes("togglePanel('radius')") &&
    bar.includes('feed-search-context-radius-option-'),
);
ok(
  'sort chip opens inline sort control',
  bar.includes("togglePanel('sort')") &&
    bar.includes('feed-search-context-sort-option-'),
);

ok(
  'sort selection writes canonical onSort',
  bar.includes('props.onSort(option.id)') && geo.includes('onSort={handleSort}'),
);
ok(
  'radius selection writes canonical onRadiusChange',
  bar.includes('props.onRadiusChange(km)') &&
    geo.includes('onRadiusChange={handleRadiusChange}'),
);
ok(
  'location apply writes canonical applyFilters place',
  bar.includes('props.onPlaceApply(next)') &&
    geo.includes('onPlaceApply={(nextPlace) => applyFilters({ place: nextPlace })}') &&
    geo.includes('applyFilters = useCallback((overrides?: { place?: string })'),
);
ok(
  'location GPS reuses handleUseMyLocation',
  geo.includes('onUseMyLocation={handleUseMyLocation}') &&
    bar.includes('props.onUseMyLocation()'),
);
ok(
  'full filters share same sort/radius/place state wiring',
  geo.includes('onSort={handleSort}') &&
    geo.includes('onRadiusChange={handleRadiusChange}') &&
    geo.includes('onPlaceChange={handlePlaceInput}'),
);
ok(
  'duplicate standalone mobile sort control absent',
  !toolbar.includes('feed-mobile-sort') &&
    !toolbar.includes('onSort') &&
    !geo.includes('#feed-mobile-sort') &&
    !geo.includes('id="feed-mobile-sort"'),
);
ok(
  'mobile toolbar has no sort select',
  !toolbar.includes('feed-mobile-sort') && !toolbar.includes('<select'),
);
ok(
  'legacy top sort row not rendered when filterChrome false',
  !geo.includes('{!filterChrome && sortRowEl}'),
);
ok(
  'opening panel does not call fetch/geo APIs',
  !bar.includes('/api/geo') &&
    !bar.includes('fetch(') &&
    !bar.includes('getCurrentPosition'),
);
ok(
  'context bar uses existing radius presets',
  geo.includes('RADIUS_PRESET_OPTIONS') &&
    RADIUS_PRESET_OPTIONS.filter((k) => k > 0).length >= 5,
);
ok(
  'no second location/sort/radius state invented for context bar',
  !geo.includes('manualLocation') &&
    !geo.includes('contextBarRadius') &&
    !geo.includes('contextBarSort'),
);
ok(
  'fallback location chip uses chooseLocation',
  geo.includes('feed.searchContext.chooseLocation'),
);
ok(
  'a11y: escape + aria-controls + dialog',
  bar.includes("e.key === 'Escape'") &&
    bar.includes('aria-controls') &&
    bar.includes('role="dialog"'),
);
ok('en i18n searchContext keys', en.includes('"searchContext"') && en.includes('fromPrefix') && en.includes('chooseLocation'));
ok('nl i18n searchContext keys', nl.includes('"searchContext"') && nl.includes('fromPrefix') && nl.includes('Kies locatie'));

console.log(`\n✅ feed search context: ${passed} checks passed`);
