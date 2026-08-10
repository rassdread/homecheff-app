/**
 * Radius presentation + local-first sort partition tests.
 */
import assert from 'node:assert/strict';
import {
  collectFeedRowListingIds,
  dedupeFeedRowsByListingId,
  sortProgressiveNearbyPoolsPreservingLocalFirst,
  splitFeedRowsByRadiusMembership,
} from '../lib/feed/feed-radius-presentation';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const local = [
  { id: 'a', createdAt: '2026-01-03T00:00:00.000Z', distanceKm: 12 },
  { id: 'b', createdAt: '2026-01-01T00:00:00.000Z', distanceKm: 3 },
];
const wider = [
  { id: 'c', createdAt: '2026-01-04T00:00:00.000Z', distanceKm: 170 },
  { id: 'd', createdAt: '2026-01-02T00:00:00.000Z', distanceKm: 45 },
];

const byDistance = sortProgressiveNearbyPoolsPreservingLocalFirst({
  local,
  wider,
  sortBy: 'distance',
  sortOrder: 'asc',
});
ok(
  'distance sort local nearest-first then widened nearest-first',
  byDistance.map((i) => i.id).join(',') === 'b,a,d,c',
);

const byNewest = sortProgressiveNearbyPoolsPreservingLocalFirst({
  local,
  wider,
  sortBy: 'newest',
  sortOrder: 'desc',
});
ok(
  'newest sort keeps local-first boundary',
  byNewest.map((i) => i.id).join(',') === 'a,b,c,d',
);
ok(
  'newest does not put 170km above local rows',
  byNewest.findIndex((i) => i.id === 'c') >
    byNewest.findIndex((i) => i.id === 'a'),
);

type Row =
  | { row: 'sale'; item: { id: string; distanceKm?: number } }
  | { row: 'insp'; slot: { item: { id: string; distanceKm?: number } } }
  | { row: 'activity_card'; card: { id: string } };

const rows: Row[] = [
  { row: 'sale', item: { id: 'near', distanceKm: 8 } },
  { row: 'sale', item: { id: 'far', distanceKm: 170 } },
  { row: 'insp', slot: { item: { id: 'near-insp', distanceKm: 12 } } },
  { row: 'insp', slot: { item: { id: 'far-insp', distanceKm: 90 } } },
  { row: 'activity_card', card: { id: 'act' } },
  { row: 'sale', item: { id: 'mid', distanceKm: 40 } },
];

const split25 = splitFeedRowsByRadiusMembership(rows, 25);
ok(
  'exact section excludes outside-radius sales',
  split25.exact
    .filter((r) => r.row === 'sale')
    .every((r) => r.row === 'sale' && (r.item.distanceKm ?? 99) <= 25),
);
ok(
  'exact includes in-radius inspiration',
  split25.exact.some(
    (r) => r.row === 'insp' && r.slot.item.id === 'near-insp',
  ),
);
ok(
  'widened includes 170km sale before continuity would render',
  split25.widened.some((r) => r.row === 'sale' && r.item.id === 'far'),
);
ok(
  'non-listing rows stay with exact stage',
  split25.exact.some((r) => r.row === 'activity_card'),
);

const exactIds = collectFeedRowListingIds(split25.exact);
const after = dedupeFeedRowsByListingId(
  [...split25.widened, { row: 'sale' as const, item: { id: 'near', distanceKm: 8 } }],
  exactIds,
);
ok(
  'dedupe drops exact ids from widened tail',
  !after.some((r) => r.row === 'sale' && r.item.id === 'near'),
);

const sidebar = readFileSync(
  join(process.cwd(), 'components/home/HomeDesktopLeftSidebar.tsx'),
  'utf8',
);
ok(
  'portal cleanup does not depend on bridge identity',
  sidebar.includes('setFilterHostRef') &&
    /useEffect\(\(\) => \{\s*if \(!railPortalMode\) return;/.test(sidebar) &&
    sidebar.includes('}, [railPortalMode]);') &&
    !sidebar.includes('}, [railPortalMode, bridge]);'),
);
ok(
  'portal host bind uses stable callback',
  sidebar.includes('bindFilterHost') &&
    sidebar.includes('data-wx-filter-portal-host'),
);

const geo = readFileSync(
  join(process.cwd(), 'components/feed/GeoFeed.tsx'),
  'utf8',
);
ok(
  'Change location focuses rail place when workspaceRailOwnsFilters',
  geo.includes('workspaceRailOwnsFilters') &&
    /else if \(workspaceRailOwnsFilters\)/.test(geo),
);
ok(
  'discovery sections disabled while locationFilterActive',
  /useDiscoverySections\s*=\s*[\s\S]*!locationFilterActive/.test(geo),
);

console.log(`\n✅ feed radius presentation: ${passed} checks passed`);
