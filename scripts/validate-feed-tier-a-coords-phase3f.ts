#!/usr/bin/env npx tsx
/**
 * Phase 3F.1 — Tier A national + coords parity (static/unit).
 */
import {
  classifyFeedCachePolicy,
  isAnonymousNationalFirstPageTierA,
  isNationalLabelsOnlyCoords,
} from '../lib/feed/feed-cache-policy';
import { sortFeedItemsLocalFirst } from '../lib/geo/local-discovery';
import {
  applyFeedViewerDistanceLabels,
  stripFeedViewerDistanceLabels,
} from '../lib/feed/feed-distance-labels';

let passed = 0;
let failed = 0;

function ok(label: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
  }
}

console.log('=== Phase 3F.1 — Tier A national + coords ===\n');

const baseInput = {
  userId: null as string | null,
  q: '',
  placeParam: '',
  vertical: 'all',
  lat: null as string | null,
  lng: null as string | null,
  hasSubfilters: false,
  feedScope: 'national',
  skip: 0,
  radiusKm: 0,
  searchParams: new URLSearchParams(),
};

ok(
  'national labels-only coords helper',
  isNationalLabelsOnlyCoords({
    feedScope: 'national',
    radiusKm: 0,
    placeParam: '',
  }),
);

ok(
  'national + lat/lng → Tier A',
  classifyFeedCachePolicy({
    ...baseInput,
    lat: '52.09',
    lng: '5.12',
  }).tier === 'A',
);

ok(
  'national + lat/lng origin-cache eligible',
  isAnonymousNationalFirstPageTierA({
    ...baseInput,
    lat: '52.09',
    lng: '5.12',
  }),
);

ok(
  'nearby + lat/lng stays Tier B',
  classifyFeedCachePolicy({
    ...baseInput,
    feedScope: 'nearby',
    lat: '52.09',
    lng: '5.12',
    radiusKm: 25,
  }).tier === 'B',
);

const items = [
  { id: 'a', createdAt: '2026-07-01T10:00:00Z', lat: 52.1, lng: 5.1 },
  { id: 'b', createdAt: '2026-07-02T10:00:00Z', lat: 51.9, lng: 5.0 },
  { id: 'c', createdAt: '2026-06-30T10:00:00Z', lat: 52.3, lng: 5.2 },
];

const sortOpts = {
  radiusKm: 0,
  followedSellerUserIds: new Set<string>(),
  extractSellerUserId: () => null,
  extractCoords: (it: Record<string, unknown>) =>
    it.lat != null && it.lng != null
      ? { lat: Number(it.lat), lng: Number(it.lng) }
      : null,
};

const withoutCoords = sortFeedItemsLocalFirst(items, {
  ...sortOpts,
  viewerGeo: null,
});
const withCoords = sortFeedItemsLocalFirst(items, {
  ...sortOpts,
  viewerGeo: { lat: 52.09, lng: 5.12 },
});

ok(
  'national sort: same IDs with/without viewer coords',
  withoutCoords.map((i) => i.id).join(',') === withCoords.map((i) => i.id).join(','),
);

const stripped = stripFeedViewerDistanceLabels(withCoords);
ok(
  'strip distanceKm for cache storage',
  stripped.every((i) => i.distanceKm === undefined),
);

const relabeled = applyFeedViewerDistanceLabels(stripped, {
  lat: 52.09,
  lng: 5.12,
});
ok(
  'post-cache labels restore distanceKm',
  relabeled.every((i) => typeof i.distanceKm === 'number'),
);

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
