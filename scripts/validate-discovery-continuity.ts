/**
 * Discovery continuity under search / category / filter constraints.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FEED_EXACT_SPARSE_THRESHOLD,
  filterContinuityRowsByExactIds,
  hasActiveFeedDiscoveryConstraint,
  shouldRenderDiscoveryContinuityFeed,
  shouldShowDiscoveryContinuityBand,
} from '../lib/feed/discovery-continuity';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Discovery continuity ===\n');

const geo = read('components/feed/GeoFeed.tsx');
const band = read('components/feed/DiscoveryContinuityBand.tsx');
const policy = read('lib/feed/discovery-continuity.ts');
const en = read('public/i18n/en.json');
const nl = read('public/i18n/nl.json');

check('sparse threshold is 5', FEED_EXACT_SPARSE_THRESHOLD === 5);

check(
  'search is an active constraint',
  hasActiveFeedDiscoveryConstraint({
    searchQuery: 'Sushi',
    category: 'all',
    feedChip: 'all',
    acceptedValues: [],
  }),
);

check(
  'category is an active constraint',
  hasActiveFeedDiscoveryConstraint({
    searchQuery: '',
    category: 'home-garden',
    feedChip: 'all',
    acceptedValues: [],
  }),
);

check(
  'unconstrained browse is not a continuity constraint',
  !hasActiveFeedDiscoveryConstraint({
    searchQuery: '',
    category: 'all',
    feedChip: 'all',
    acceptedValues: [],
  }),
);

check(
  'nearby radius counts as constraint',
  hasActiveFeedDiscoveryConstraint({
    searchQuery: '',
    category: 'all',
    feedChip: 'all',
    acceptedValues: [],
    nearbyRadiusActive: true,
  }),
);

check(
  'band shows when empty + settled + constrained',
  shouldShowDiscoveryContinuityBand({
    exactMatchCount: 0,
    hasActiveConstraint: true,
    settled: true,
  }),
);

check(
  'band shows when sparse (below threshold)',
  shouldShowDiscoveryContinuityBand({
    exactMatchCount: 3,
    hasActiveConstraint: true,
    settled: true,
  }),
);

check(
  'band hidden when enough exact matches',
  !shouldShowDiscoveryContinuityBand({
    exactMatchCount: FEED_EXACT_SPARSE_THRESHOLD,
    hasActiveConstraint: true,
    settled: true,
  }),
);

check(
  'band hidden while unsettled',
  !shouldShowDiscoveryContinuityBand({
    exactMatchCount: 0,
    hasActiveConstraint: true,
    settled: false,
  }),
);

check(
  'continuity feed renders only with band + candidates',
  shouldRenderDiscoveryContinuityFeed({
    showBand: true,
    continuityCandidateCount: 4,
  }) &&
    !shouldRenderDiscoveryContinuityFeed({
      showBand: true,
      continuityCandidateCount: 0,
    }) &&
    !shouldRenderDiscoveryContinuityFeed({
      showBand: false,
      continuityCandidateCount: 10,
    }),
);

check(
  'dedupe keeps non-exact ids',
  filterContinuityRowsByExactIds(
    [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    new Set(['b']),
  ).map((r) => r.id).join(',') === 'a,c',
);

check(
  'GeoFeed imports continuity helpers',
  geo.includes('hasActiveFeedDiscoveryConstraint') &&
    geo.includes('shouldShowDiscoveryContinuityBand') &&
    geo.includes('shouldRenderDiscoveryContinuityFeed') &&
    geo.includes('DiscoveryContinuityBand'),
);

check(
  'GeoFeed builds unconstrained continuity pool',
  geo.includes('continuityDisplayRows') &&
    geo.includes('continuityRowsToRender') &&
    /composeProgressiveNearbySalePool/.test(geo),
);

check(
  'GeoFeed continuity layout precedes exclusive empties',
  /showDiscoveryContinuityBand\s*\?/.test(geo) &&
    geo.includes('blockExclusiveEmpty') &&
    geo.includes('data-wx-discovery-continuity-layout'),
);

check(
  'exact matches render before continuity band',
  (() => {
    const exact = geo.indexOf('data-wx-discovery-exact');
    const band = geo.indexOf('<DiscoveryContinuityBand');
    const cont = geo.indexOf('data-wx-discovery-continuity-feed');
    return exact > 0 && band > exact && cont > band;
  })(),
);

check(
  'DiscoveryContinuityBand exposes CTA hooks',
  band.includes('data-testid="feed-discovery-continuity-band"') &&
    band.includes('data-wx-empty-create') &&
    band.includes('data-wx-empty-request') &&
    band.includes('continuityBeFirst') &&
    band.includes('continuityContinueHint'),
);

check(
  'i18n continuity keys present (EN + NL)',
  en.includes('continuityEmptySearchTitle') &&
    en.includes('continuitySparseTitle') &&
    en.includes('continuityBeFirst') &&
    nl.includes('continuityEmptySearchTitle') &&
    nl.includes('continuitySparseBody') &&
    nl.includes('continuityContinueHint'),
);

check(
  'policy documents exact-first continuity',
  policy.includes('Exact matches always win') &&
    policy.includes('Never replace HomeCheff with a dead empty page'),
);

console.log(`\n=== ${passed} checks passed ===`);
