/**
 * Discovery continuity under search / category / filter constraints.
 * Continuity is composition-driven — no fixed numeric sparse threshold.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  FEED_SALE_INSPIRATION_STRIDE,
  FEED_SPARSE_LOCAL_SALE_THRESHOLD,
  isExactDiscoveryCompositionSufficient,
} from '../lib/feed/feed-composition-policy';
import {
  buildExactDiscoveryCompositionSignals,
  filterContinuityRowsByExactIds,
  hasActiveFeedDiscoveryConstraint,
  shouldRenderDiscoveryContinuityFeed,
  shouldShowDiscoveryContinuityBand,
  shouldShowExhaustionContinuation,
  DISCOVERY_BATCH_SIZE,
  advanceDiscoveryStage,
  discoveryWindowCanContinue,
  resolveDiscoveryFetch,
} from '../lib/feed/discovery-continuity';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

console.log('=== Discovery continuity (adaptive) ===\n');

const geo = read('components/feed/GeoFeed.tsx');
const home = read('components/home/HomePageClient.tsx');
const page = read('app/page.tsx');
const media = read('components/feed/feedMedia.tsx');
const band = read('components/feed/DiscoveryContinuityBand.tsx');
const continuity = read('lib/feed/discovery-continuity.ts');
const policy = read('lib/feed/feed-composition-policy.ts');
const en = read('public/i18n/en.json');
const nl = read('public/i18n/nl.json');

check(
  'no fixed FEED_EXACT_SPARSE_THRESHOLD in continuity module',
  !continuity.includes('FEED_EXACT_SPARSE_THRESHOLD') &&
    !continuity.includes('exactMatchCount <'),
);

check(
  'composition owns isExactDiscoveryCompositionSufficient',
  policy.includes('isExactDiscoveryCompositionSufficient') &&
    continuity.includes('isExactDiscoveryCompositionSufficient'),
);

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

// --- Composition sufficiency (examples A–D) ---

const exampleA = buildExactDiscoveryCompositionSignals({
  items: [
    { id: '1', creatorId: 'a', kind: 'sale' },
    { id: '2', creatorId: 'b', kind: 'sale' },
    { id: '3', creatorId: 'c', kind: 'sale' },
    { id: '4', creatorId: 'd', kind: 'sale' },
  ],
  localSaleCount: 4,
  progressiveWidenActive: false,
  inspirationCompositionWidened: true,
});
check(
  'Example A: 4 diverse nearby → sufficient (no continuity band)',
  isExactDiscoveryCompositionSufficient(exampleA).sufficient &&
    !shouldShowDiscoveryContinuityBand({
      hasActiveConstraint: true,
      settled: true,
      composition: exampleA,
    }),
);

const exampleB = buildExactDiscoveryCompositionSignals({
  items: [
    { id: '1', creatorId: 'same', kind: 'sale' },
    { id: '2', creatorId: 'same', kind: 'sale' },
    { id: '3', creatorId: 'same', kind: 'sale' },
  ],
});
check(
  'Example B: 3 same creator → insufficient (continuity appropriate)',
  !isExactDiscoveryCompositionSufficient(exampleB).sufficient &&
    isExactDiscoveryCompositionSufficient(exampleB).reason ===
      'creator_monoculture' &&
    shouldShowDiscoveryContinuityBand({
      hasActiveConstraint: true,
      settled: true,
      composition: exampleB,
    }),
);

const exampleC = buildExactDiscoveryCompositionSignals({
  items: [{ id: '1', creatorId: 'a', kind: 'sale' }],
});
check(
  'Example C: 1 exact match → insufficient',
  !isExactDiscoveryCompositionSufficient(exampleC).sufficient &&
    shouldShowDiscoveryContinuityBand({
      hasActiveConstraint: true,
      settled: true,
      composition: exampleC,
    }),
);

const exampleD = buildExactDiscoveryCompositionSignals({ items: [] });
check(
  'Example D: 0 exact matches → empty / insufficient',
  !isExactDiscoveryCompositionSufficient(exampleD).sufficient &&
    isExactDiscoveryCompositionSufficient(exampleD).reason === 'empty' &&
    shouldShowDiscoveryContinuityBand({
      hasActiveConstraint: true,
      settled: true,
      composition: exampleD,
    }),
);

check(
  'mixed kinds can complete a composition unit below stride',
  isExactDiscoveryCompositionSufficient(
    buildExactDiscoveryCompositionSignals({
      items: [
        { id: '1', creatorId: 'a', kind: 'sale' },
        { id: '2', creatorId: 'b', kind: 'sale' },
        { id: '3', creatorId: 'c', kind: 'inspiration' },
      ],
    }),
  ).sufficient,
);

check(
  'sufficiency reuses composition stride / sparse-local constants (not a new continuity number)',
  FEED_SALE_INSPIRATION_STRIDE >= 1 &&
    FEED_SPARSE_LOCAL_SALE_THRESHOLD === FEED_SALE_INSPIRATION_STRIDE * 2 &&
    policy.includes('FEED_SALE_INSPIRATION_STRIDE') &&
    policy.includes('FEED_SPARSE_LOCAL_SALE_THRESHOLD'),
);

check(
  'band hidden while unsettled even if empty',
  !shouldShowDiscoveryContinuityBand({
    hasActiveConstraint: true,
    settled: false,
    composition: exampleD,
  }),
);

check(
  'band hidden when unconstrained even if thin',
  !shouldShowDiscoveryContinuityBand({
    hasActiveConstraint: false,
    settled: true,
    composition: exampleC,
  }),
);

check(
  'continuation waits until the exact query is exhausted',
  !shouldShowExhaustionContinuation({
    settled: true,
    hasActiveConstraint: true,
    marketplaceExhausted: false,
  }) &&
    shouldShowExhaustionContinuation({
      settled: true,
      hasActiveConstraint: true,
      marketplaceExhausted: true,
    }) &&
    !shouldShowExhaustionContinuation({
      settled: false,
      hasActiveConstraint: true,
      marketplaceExhausted: true,
    }) &&
    !shouldShowExhaustionContinuation({
      settled: true,
      hasActiveConstraint: false,
      marketplaceExhausted: true,
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
  )
    .map((r) => r.id)
    .join(',') === 'a,c',
);

check(
  'GeoFeed wires composition signals into continuity band',
  geo.includes('exactCompositionSignals') &&
    geo.includes('buildExactDiscoveryCompositionSignals') &&
    geo.includes('composition: exactCompositionSignals') &&
    !geo.includes('exactMatchCount: displayCount'),
);

check(
  'GeoFeed builds unconstrained continuity pool',
  geo.includes('continuityDisplayRows') &&
    geo.includes('continuityRowsToRender') &&
    /composeProgressiveNearbySalePool/.test(geo),
);

check(
  'GeoFeed continuity layout precedes exclusive empties',
  (/showDiscoveryContinuityBand\s*\?/.test(geo) ||
    /showRadiusStageLayout\s*\?/.test(geo)) &&
    geo.includes('blockExclusiveEmpty') &&
    geo.includes('data-wx-discovery-continuity-layout'),
);

check(
  'GeoFeed splits exact vs widened presentation for Nearby radius',
  geo.includes('splitFeedRowsByRadiusMembership') &&
    geo.includes('showRadiusStageLayout') &&
    geo.includes('sortProgressiveNearbyPoolsPreservingLocalFirst') &&
    geo.includes('!locationFilterActive'),
);

check(
  'exact matches render before continuity band',
  (() => {
    const exact = geo.indexOf('data-wx-discovery-exact');
    const bandIdx = geo.indexOf('<DiscoveryContinuityBand');
    const cont = geo.indexOf('data-wx-discovery-continuity-feed');
    return exact > 0 && bandIdx > exact && cont > bandIdx;
  })(),
);

check(
  'DiscoveryContinuityBand exposes one primary CTA',
  band.includes('data-testid="feed-discovery-continuity-band"') &&
    band.includes('data-wx-empty-create') &&
    band.includes('data-wx-empty-request') &&
    band.includes('hc-btn-primary') &&
    !band.includes('data-wx-empty-trade') &&
    !band.includes('continuityBeFirst'),
);

check(
  'discovery continues in batches and stops when nothing new remains',
  DISCOVERY_BATCH_SIZE === 12 &&
    discoveryWindowCanContinue({
      shown: 12,
      available: 20,
      apiHasMore: false,
    }) &&
    discoveryWindowCanContinue({
      shown: 12,
      available: 12,
      apiHasMore: true,
    }) &&
    !discoveryWindowCanContinue({
      shown: 12,
      available: 12,
      apiHasMore: false,
    }),
);

check(
  'nearby discovery keeps the category before it broadens',
  resolveDiscoveryFetch({
    stage: 'focused',
    appliedCategory: 'services',
    appliedScope: 'nearby',
  }).category === 'services' &&
    resolveDiscoveryFetch({
      stage: 'focused',
      appliedCategory: 'services',
      appliedScope: 'nearby',
    }).widenNearbyToNational &&
    !resolveDiscoveryFetch({
      stage: 'focused',
      appliedCategory: 'services',
      appliedScope: 'national',
    }).widenNearbyToNational &&
    resolveDiscoveryFetch({
      stage: 'broad',
      appliedCategory: 'services',
      appliedScope: 'international',
    }).category === 'all' &&
    advanceDiscoveryStage({
      stage: 'focused',
      appliedCategory: 'services',
      apiHasMore: false,
    }).restartSkip &&
    advanceDiscoveryStage({
      stage: 'broad',
      appliedCategory: 'services',
      apiHasMore: false,
    }).exhausted &&
    !advanceDiscoveryStage({
      stage: 'focused',
      appliedCategory: 'services',
      apiHasMore: true,
    }).exhausted,
);

check(
  'GeoFeed pages discovery instead of a hard 12-card end',
  geo.includes('discoveryWindowCanContinue') &&
    geo.includes('feed-discovery-load-more') &&
    geo.includes('feed-discovery-end'),
);

check(
  'marketplace does not stack the workspace cockpit under the feed',
  !home.includes('data-hc-marketplace-secondary') &&
    !home.includes('placement="below"'),
);

check(
  'homepage footer links are in the server page',
  page.includes('HomePublicFooter') &&
    read('components/home/HomePublicFooter.tsx').includes("'/inspiratie'") &&
    read('components/home/HomePublicFooter.tsx').includes("'/privacy'"),
);

check(
  'feed video autoplay respects reduced motion',
  media.includes('prefers-reduced-motion: reduce') &&
    media.includes('feedAutoplayAllowed'),
);

check(
  'GeoFeed gates continuation on exact exhaustion',
  geo.includes('shouldShowExhaustionContinuation') &&
    geo.includes('marketplaceExhausted'),
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
  'continuity docs composition ownership (no fixed sparse count)',
  continuity.includes('composition layer') &&
    continuity.includes('feed-composition-policy') &&
    !continuity.includes('below the sparse threshold'),
);

console.log(`\n=== ${passed} checks passed ===`);
