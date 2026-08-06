/**
 * Focused validators for manual place/postcode entry repair.
 * Deterministic — no live Google/Nominatim calls.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Location input repair validators ===\n');

const focusSrc = read('lib/feed/place-input-focus-request.ts');
check(
  'place-input-focus-request exports request + subscribe',
  focusSrc.includes('requestPlaceInputFocus') &&
    focusSrc.includes('subscribePlaceInputFocusRequest') &&
    focusSrc.includes('HC_PLACE_INPUT_FOCUS_EVENT'),
);

const sidebar = read('components/home/HomeDesktopLeftSidebar.tsx');
check(
  'Discovery filters default open (place field mounted)',
  /useState\(\s*true\s*\)/.test(sidebar) &&
    sidebar.includes('subscribePlaceInputFocusRequest'),
);
check(
  'Discovery filters expand on place-focus request',
  sidebar.includes('setFiltersOpen(true)'),
);

const geo = read('components/feed/GeoFeed.tsx');
check(
  'choose-place requests focus bridge',
  geo.includes('requestPlaceInputFocus') &&
    geo.includes('choose-place'),
);
check(
  'choose-place retries focus until input mounted',
  geo.includes('focusPlace(attempt') && geo.includes('placeInputRef.current'),
);
check(
  'mobile sheet focusPlaceOnOpen wired',
  geo.includes('focusPlaceOnOpen={mobileSheetFocusPlace}') &&
    geo.includes('setMobileSheetFocusPlace(true)'),
);
check(
  'legacy place input Enter applies filters',
  geo.includes('if (e.key === "Enter")') &&
    geo.includes('applyFilters()') &&
    geo.includes('data-testid="feed-place-input"'),
);
check(
  'place input not permanently disabled in GeoFeed draft field',
  !/placeInputRef[\s\S]{0,200}disabled=\{true\}/.test(geo),
);

const sheet = read('components/feed/FeedMobileFilterSheet.tsx');
check(
  'mobile sheet can focus place instead of close',
  sheet.includes('focusPlaceOnOpen') &&
    sheet.includes('localPlaceRef') &&
    sheet.includes("el.focus"),
);
check(
  'mobile place input has test id and Enter apply',
  sheet.includes('data-testid="feed-place-input"') &&
    sheet.includes("e.key === 'Enter'") &&
    sheet.includes('onApply()'),
);
check(
  'mobile place input not readOnly/disabled',
  !sheet.includes('readOnly') &&
    !/feed-place-input[\s\S]{0,120}disabled/.test(sheet),
);

const filters = read('components/feed/FeedSidebarFilters.tsx');
check(
  'sidebar place Enter applies',
  filters.includes('data-testid="feed-place-input"') &&
    filters.includes('e.key === "Enter"') &&
    filters.includes('onApply()'),
);
const placeInputBlock = filters.match(
  /<input[\s\S]*?data-testid="feed-place-input"[\s\S]*?\/>/,
)?.[0] ?? '';
check(
  'sidebar place input element has no disabled prop',
  placeInputBlock.length > 0 && !/\bdisabled\b/.test(placeInputBlock),
);

const banner = read('components/feed/LocationRefineBanner.tsx');
check(
  'refine banner change CTA remains (manual path entry)',
  banner.includes('onChange') && banner.includes('changeLabel'),
);

const empty = read('components/feed/NearbyLocationRequiredEmptyState.tsx');
check(
  'empty-state choose place CTA still present for reuse',
  empty.includes('onChoosePlace') && empty.includes('choosePlaceLabel'),
);

const pref = read('lib/geo/location-preference.ts');
check(
  'manual location preference persistence SSOT intact',
  pref.includes('hc_location_pref_v2') && pref.includes("source"),
);

console.log(`\n${passed} checks passed`);
