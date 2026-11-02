/**
 * Permanent marketplace infinite-scroll regression guard.
 * Fails when GeoFeed loses IntersectionObserver continuation, cursor progression,
 * dedupe, filter/radius/search resets, or stale-response protection.
 *
 * Run: npx tsx scripts/validate-marketplace-infinite-scroll-regression.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  appendUniqueById,
  discoveryPaginationResetKey,
  resolveDiscoveryScrollAction,
  revealNextDiscoveryBatch,
} from '../lib/feed/discovery-scroll';

const root = path.resolve(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');
const geo = read('components/feed/GeoFeed.tsx');
const layout = read('components/adaptive-workspace/FeedWorkspaceVisibleLayout.tsx');
const bridge = read('components/adaptive-workspace/WorkspaceFeedPresentationBridge.tsx');

let passed = 0;
function check(name: string, cond: boolean) {
  assert.equal(cond, true, name);
  passed += 1;
  console.log(`OK  ${name}`);
}

check(
  'discovery-scroll module is wired into GeoFeed',
  geo.includes('resolveDiscoveryScrollAction') &&
    geo.includes('appendUniqueById') &&
    geo.includes('discoveryPaginationResetKey') &&
    geo.includes('from "@/lib/feed/discovery-scroll"'),
);

check(
  'primary feed sentinel uses IntersectionObserver',
  geo.includes('data-feed-sentinel') &&
    geo.includes('data-testid="feed-sentinel"') &&
    geo.includes('new IntersectionObserver') &&
    geo.includes('inviteNearEndLoadMore') &&
    geo.includes('loadMoreFeed'),
);

check(
  'nested desktop scroll root is preferred when sentinel is inside it',
  geo.includes('homecheff-feed-desktop') &&
    geo.includes('desktop.contains(sentinel)') &&
    geo.includes('resolveFeedIntersectionRoot'),
);

check(
  'discovery continuation sentinel auto-loads (not button-only)',
  geo.includes('data-testid="feed-discovery-sentinel"') &&
    geo.includes('discoveryContinueRef') &&
    geo.includes('advanceDiscoveryWindow') &&
    geo.includes('advanceDiscoveryWindow(false)'),
);

check(
  'discovery IO observes discoveryContinueRef',
  geo.includes('discoveryContinueRef') &&
    geo.includes('new IntersectionObserver') &&
    geo.includes('discoveryCanContinue') &&
    geo.includes('suggestionLoadFailed') &&
    geo.includes('obs.observe(el)'),
);

check(
  'stale response protection uses generation counter',
  geo.includes('suggestionGenRef') &&
    geo.includes('generation !== suggestionGenRef.current'),
);

check(
  'filter/radius/search resets discovery pagination key',
  geo.includes('discoveryPaginationResetKey({') &&
    geo.includes('appliedRadius') &&
    geo.includes('appliedSearchQuery') &&
    geo.includes('appliedCategory'),
);

check(
  'failed fetch surfaces retry (no silent stop)',
  geo.includes('setSuggestionLoadFailed(true)') &&
    geo.includes('suggestionLoadFailed') &&
    (geo.includes('discoveryLoadRetry') ||
      geo.includes('feed.discoveryLoadRetry')),
);

check(
  'end-of-results is explicit',
  geo.includes('feed-discovery-end') && geo.includes('discoveryTrulyEnded'),
);

check(
  'primary load-more drains after append (IO miss protection)',
  geo.includes('queueNearEndContinuation') &&
    geo.includes('isFeedSentinelNearEnd') &&
    geo.includes('inviteNearEndLoadMore'),
);

// Behavioral unit contracts
{
  const pages: Array<{ id: string }>[] = [];
  let shown = 0;
  let available: Array<{ id: string }> = [];
  let apiHasMore = true;
  let skip = 0;
  const take = 12;
  const inventory = Array.from({ length: 40 }, (_, i) => ({ id: `p-${i}` }));

  while (apiHasMore || shown < available.length) {
    const action = resolveDiscoveryScrollAction({
      shown,
      available: available.length,
      apiHasMore,
      loading: false,
      failed: false,
    });
    if (action === 'idle') break;
    if (action === 'reveal') {
      shown = revealNextDiscoveryBatch({
        shown,
        available: available.length,
        batchSize: take,
      });
      continue;
    }
    const page = inventory.slice(skip, skip + take);
    pages.push(page);
    available = appendUniqueById(available, page);
    skip += page.length;
    apiHasMore = skip < inventory.length;
    shown = revealNextDiscoveryBatch({
      shown: Math.max(shown, 0),
      available: available.length,
      batchSize: take,
    });
  }

  const ids = available.map((row) => row.id);
  check('cursor progresses across pages', pages.length >= 3);
  check('no duplicate listings after append', ids.length === new Set(ids).size);
  check('no skipped listings in contiguous inventory', ids.length === inventory.length);
  check(
    'end-of-results when API exhausted',
    resolveDiscoveryScrollAction({
      shown: available.length,
      available: available.length,
      apiHasMore: false,
      loading: false,
      failed: false,
    }) === 'idle',
  );
}

{
  const a = discoveryPaginationResetKey({
    category: 'all',
    chip: 'sale',
    scope: 'national',
    radius: 25,
    query: '',
    place: '',
  });
  const b = discoveryPaginationResetKey({
    category: 'all',
    chip: 'sale',
    scope: 'national',
    radius: 50,
    query: '',
    place: '',
  });
  const c = discoveryPaginationResetKey({
    category: 'all',
    chip: 'sale',
    scope: 'national',
    radius: 25,
    query: 'krentenbol',
    place: '',
  });
  check('radius change resets pagination key', a !== b);
  check('search change resets pagination key', a !== c);
  check('stable key when filters unchanged', a === discoveryPaginationResetKey({
    category: 'all',
    chip: 'sale',
    scope: 'national',
    radius: 25,
    query: '',
    place: '',
  }));
}

{
  check(
    'loading-state recovery stays idle while in flight',
    resolveDiscoveryScrollAction({
      shown: 12,
      available: 12,
      apiHasMore: true,
      loading: true,
      failed: false,
    }) === 'idle',
  );
  check(
    'failed state does not auto-fetch',
    resolveDiscoveryScrollAction({
      shown: 12,
      available: 12,
      apiHasMore: true,
      loading: false,
      failed: true,
    }) === 'idle',
  );
  check(
    'user retry after failure fetches',
    resolveDiscoveryScrollAction({
      shown: 12,
      available: 12,
      apiHasMore: true,
      loading: false,
      failed: true,
      userRetry: true,
    }) === 'fetch',
  );
}

check(
  'dedupe drops overlapping page ids',
  appendUniqueById([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }])
    .map((r) => r.id)
    .join(',') === 'a,b,c',
);

check(
  'surface-plan effect depends on the stable setter, not the bridge object',
  geo.includes('const setBridgeSurfacePlan = workspaceBridge?.setSurfacePlan;') &&
    geo.includes('}, [setBridgeSurfacePlan, surfacePlan]);') &&
    !geo.includes('}, [workspaceBridge, surfacePlan]);'),
);

check(
  'start-rail effect depends on the stable setter, not the bridge object',
  layout.includes('const setStartRailActive = presentationBridge?.setStartRailActive;') &&
    layout.includes(
      '}, [setStartRailActive, presentationMode, visiblePlan.railOwnsFilters]);',
    ) &&
    !layout.includes(
      '}, [presentationBridge, presentationMode, visiblePlan.railOwnsFilters]);',
    ),
);

check(
  'bridge setters stay referentially stable',
  bridge.includes('const [startRailActive, setStartRailActive] = useState(false);') &&
    bridge.includes('const setSurfacePlan = useCallback(') &&
    bridge.includes('setSurfacePlanState((prev) => (prev === plan ? prev : plan));'),
);

check(
  'empty inspiration prop does not change identity every render',
  geo.includes('const EMPTY_INSPIRATIE_ITEMS: InspirationItem[] = [];') &&
    geo.includes('initialInspiratieItems = EMPTY_INSPIRATIE_ITEMS') &&
    geo.includes('prev.length === 0 && initialInspiratieItems.length === 0'),
);

check(
  'sale visibility audit does not write feed state',
  !read('lib/feed/feed-sale-visibility-audit.ts').includes('setState') &&
    !read('lib/feed/feed-sale-visibility-audit.ts').includes('setItems'),
);

console.log(`\nmarketplace infinite-scroll regression: ${passed} checks passed`);
