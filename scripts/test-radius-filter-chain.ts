/**
 * Radius filter chain regression — UI selection → request → partition → cache key.
 * Run: npx tsx scripts/test-radius-filter-chain.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildGeoFeedApiParams } from '../lib/feed/feed-query-params';
import { FEED_SCOPE_NEARBY, FEED_SCOPE_NATIONAL } from '../lib/feed/feed-scope';
import { partitionSaleItemsByRadius } from '../lib/geo/feed-radius-filter';
import {
  FEED_RADIUS_DEFAULT_KM,
  clampFeedRadiusKm,
  normalizeFeedRadiusKm,
} from '../lib/geo/local-discovery';
import { composeProgressiveNearbySalePool } from '../lib/feed/feed-composition-policy';

const root = path.resolve(__dirname, '..');
const geoFeed = fs.readFileSync(
  path.join(root, 'components/feed/GeoFeed.tsx'),
  'utf8',
);
const feedRoute = fs.readFileSync(
  path.join(root, 'app/api/feed/route.ts'),
  'utf8',
);

let passed = 0;
function ok(name: string, cond: boolean) {
  assert.ok(cond, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

const fixtures = [
  { id: 'd3', distanceKm: 3 },
  { id: 'd8', distanceKm: 8 },
  { id: 'd18', distanceKm: 18 },
  { id: 'd40', distanceKm: 40 },
  { id: 'unknown' },
];

function eligibleIds(radiusKm: number): string[] {
  return partitionSaleItemsByRadius(fixtures, radiusKm, {
    scope: FEED_SCOPE_NEARBY,
  }).local.map((i) => i.id);
}

// A–C: selecting radius yields that effective radius
for (const r of [5, 10, 25] as const) {
  const params = buildGeoFeedApiParams({
    scope: FEED_SCOPE_NEARBY,
    radius: r,
    lat: 51.92,
    lng: 4.48,
  });
  ok(`A/B/C request radius=${r}`, params.get('radius') === String(r));
  ok(
    `A/B/C API normalize radius=${r}`,
    normalizeFeedRadiusKm(Number(params.get('radius'))) === r,
  );
}

// D: different radii → different eligible primary datasets
ok(
  'D eligible @5 ≠ @10',
  eligibleIds(5).join(',') !== eligibleIds(10).join(','),
);
ok(
  'D eligible @10 ≠ @25',
  eligibleIds(10).join(',') !== eligibleIds(25).join(','),
);
ok('D @5 keeps 3km only', eligibleIds(5).join(',') === 'd3');
ok('D @10 keeps 3+8', eligibleIds(10).join(',') === 'd3,d8');
ok('D @25 keeps 3+8+18', eligibleIds(25).join(',') === 'd3,d8,d18');

// E: missing radius → default 25
ok('E default radius constant is 25', FEED_RADIUS_DEFAULT_KM === 25);
ok(
  'E clamp invalid → default',
  clampFeedRadiusKm(Number.NaN) === FEED_RADIUS_DEFAULT_KM,
);

// F: invalid / malformed handled safely
ok('F clamp negative → 0', clampFeedRadiusKm(-3) === 0);
ok('F clamp huge → 100', clampFeedRadiusKm(999) === 100);
ok('F normalize 0 → national unlimited', normalizeFeedRadiusKm(0) === 0);
ok('F normalize garbage → national', normalizeFeedRadiusKm(Number.NaN) === 0);

// G: category change must not force radius rewrite in GeoFeed wiring
ok(
  'G selectVerticalChip does not setRadius',
  /const selectVerticalChip = useCallback\(\(slug: string\) => \{\s*setCategory\(slug\);\s*setAppliedCategory\(slug\);\s*\}, \[\]\)/.test(
    geoFeed,
  ),
);

// H: persistence writes appliedRadius (not draft-only)
ok(
  'H persist snapshot uses appliedRadius',
  geoFeed.includes('appliedRadius') &&
    /snapshotHomeFilterPersist\(\{[\s\S]*?appliedRadius/.test(geoFeed),
);

// I: radius in request / cache identity
const key5 = buildGeoFeedApiParams({
  scope: FEED_SCOPE_NEARBY,
  radius: 5,
  lat: 51.9,
  lng: 4.3,
}).toString();
const key25 = buildGeoFeedApiParams({
  scope: FEED_SCOPE_NEARBY,
  radius: 25,
  lat: 51.9,
  lng: 4.3,
}).toString();
ok('I cache identity distinguishes radius', key5 !== key25);
ok('I key5 contains radius=5', key5.includes('radius=5'));
ok('I key25 contains radius=25', key25.includes('radius=25'));

// Instant-apply wiring (root cause of stuck-at-25 UI)
ok(
  'instant-apply handleRadiusChange sets appliedRadius',
  geoFeed.includes('const handleRadiusChange') &&
    /setRadius\(next\);\s*setAppliedRadius\(next\)/.test(geoFeed),
);
ok(
  'radius controls wire handleRadiusChange (not draft-only setRadius)',
  (geoFeed.match(/onRadiusChange=\{handleRadiusChange\}/g) || []).length >= 4,
);
ok(
  'no draft-only onRadiusChange setRadius clamp left',
  !geoFeed.includes(
    'onRadiusChange={(n) => setRadius(Math.max(0, Math.min(100, n)))}',
  ),
);

// Primary pool: progressive Nearby (known-good UX) — local-first then wider tail.
// Instant radius apply is preserved separately; do not require local-only primary.
ok(
  'primary sale pool uses progressive Nearby when locationFilterActive',
  /const salePoolForRanking = locationFilterActive\s*\?\s*composeProgressiveNearbySalePool\(\{/.test(
    geoFeed,
  ) && geoFeed.includes('wider: saleWiderPool'),
);

// Progressive helper remains the SSOT for local-first composition
ok(
  'GeoFeed wires composeProgressiveNearbySalePool + saleWiderPool',
  geoFeed.includes('composeProgressiveNearbySalePool') &&
    geoFeed.includes('saleWiderPool'),
);
ok(
  'API remains LOCAL_FIRST (national tail in payload)',
  feedRoute.includes('FEED_RADIUS_MODE_LOCAL_FIRST') &&
    /radiusModeForSort\s*=\s*FEED_RADIUS_MODE_LOCAL_FIRST/.test(feedRoute),
);

// Parameter name parity frontend ↔ backend
ok(
  'API reads searchParams radius (not radiusKm)',
  feedRoute.includes('searchParams.get("radius")'),
);
ok(
  'buildGeoFeedApiParams sets radius',
  buildGeoFeedApiParams({
    scope: FEED_SCOPE_NEARBY,
    radius: 5,
  }).get('radius') === '5',
);

// National scope ignores radius filter for partition
ok(
  'national scope does not radius-split',
  partitionSaleItemsByRadius(fixtures, 5, { scope: FEED_SCOPE_NATIONAL })
    .local.length === fixtures.length,
);

// Progressive helper still orders local then wider (continuity)
const partitioned = partitionSaleItemsByRadius(fixtures, 10, {
  scope: FEED_SCOPE_NEARBY,
});
const progressive = composeProgressiveNearbySalePool({
  local: partitioned.local,
  wider: partitioned.fallback,
});
ok(
  'progressive continuity pool local-first',
  progressive[0]?.id === 'd3' && progressive.some((i) => i.id === 'd40'),
);

// Boundary checks from investigation brief
ok('boundary 3km appears at 5km', eligibleIds(5).includes('d3'));
ok('boundary 3km excluded at 2km', !eligibleIds(2).includes('d3'));
ok('boundary 18km appears at 25km', eligibleIds(25).includes('d18'));
ok('boundary 18km excluded at 10km', !eligibleIds(10).includes('d18'));

console.log(`\n✅ radius filter chain: ${passed} checks passed`);
