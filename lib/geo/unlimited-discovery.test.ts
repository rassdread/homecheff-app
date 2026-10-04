import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { haversineKm } from '@/lib/community/geoDistance';
import { composeProgressiveNearbySalePool } from '@/lib/feed/feed-composition-policy';
import { FEED_SCOPE_NEARBY } from '@/lib/feed/feed-scope';
import { partitionSaleItemsByRadius } from '@/lib/geo/feed-radius-filter';
import {
  FEED_RADIUS_UI_OPTIONS,
  RADIUS_NATIONAL_KM,
  feedDistanceBoxOrMissingCoords,
  feedQueryAppliesDistanceBbox,
  isUnlimitedRadius,
  isWithinRadiusKm,
  nextWiderFeedRadiusKm,
  sortFeedItemsLocalFirst,
} from '@/lib/geo/local-discovery';

/** Vlaardingen. Offsets are north along the meridian so distance is latitude-only. */
const ORIGIN = { lat: 51.912, lng: 4.342 };

type Listing = {
  id: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  distanceKm?: number;
};

function place(id: string, km: number): Listing {
  return {
    id,
    lat: ORIGIN.lat + km / 111.32,
    lng: ORIGIN.lng,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const listings: Listing[] = [
  place('A', 5),
  place('B', 30),
  place('C', 90),
  place('D', 120),
  place('E', 250),
  { id: 'F', lat: null, lng: null, createdAt: '2026-01-02T00:00:00.000Z' },
];

function distanceOf(item: Listing): number | null {
  if (item.lat == null || item.lng == null) return null;
  return haversineKm(ORIGIN.lat, ORIGIN.lng, item.lat, item.lng);
}

describe('national unlimited discovery', () => {
  it('places fixtures on the expected sides of each radius', () => {
    const distances = Object.fromEntries(
      listings.map((item) => [item.id, distanceOf(item)]),
    ) as Record<string, number | null>;
    assert.ok(distances.A != null && distances.A < 8);
    assert.ok(distances.B != null && distances.B > 25 && distances.B < 40);
    assert.ok(distances.C != null && distances.C > 50 && distances.C < 100);
    assert.ok(distances.D != null && distances.D > 100 && distances.D < 150);
    assert.ok(distances.E != null && distances.E > 200);
    assert.equal(distances.F, null);
  });

  it('keeps finite radii exclusive and Unlimited inclusive', () => {
    for (const radius of [5, 10, 25, 50, 100] as const) {
      const ids = partitionSaleItemsByRadius(
        listings.map((item) => ({
          ...item,
          distanceKm: distanceOf(item) ?? undefined,
        })),
        radius,
        { scope: FEED_SCOPE_NEARBY },
      );
      for (const item of listings) {
        const d = distanceOf(item);
        const inLocal = ids.local.some((row) => row.id === item.id);
        if (d == null) {
          assert.equal(inLocal, false, `${item.id} has no coordinates`);
        } else {
          assert.equal(inLocal, d <= radius + 0.05, `${item.id} @ ${radius}`);
        }
        const shown = composeProgressiveNearbySalePool({
          local: ids.local,
          wider: ids.fallback,
        }).some((row) => row.id === item.id);
        assert.equal(shown, true, `${item.id} stays reachable @ ${radius}`);
      }
    }

    const unlimited = partitionSaleItemsByRadius(
      listings.map((item) => ({
        ...item,
        distanceKm: distanceOf(item) ?? undefined,
      })),
      RADIUS_NATIONAL_KM,
      { scope: FEED_SCOPE_NEARBY },
    );
    assert.deepEqual(
      unlimited.local.map((item) => item.id).sort(),
      ['A', 'B', 'C', 'D', 'E', 'F'],
    );
    assert.equal(unlimited.fallback.length, 0);
  });

  it('ranks Unlimited by distance without dropping far or online supply', () => {
    const ranked = sortFeedItemsLocalFirst(
      listings.map((item) => ({ ...item })),
      {
        viewerGeo: ORIGIN,
        radiusKm: 0,
        rankUnlimitedByDistance: true,
        followedSellerUserIds: new Set(),
        extractSellerUserId: () => null,
        extractCoords: (item) =>
          item.lat != null && item.lng != null
            ? { lat: item.lat, lng: item.lng }
            : null,
      },
    );
    assert.deepEqual(
      ranked.map((item) => item.id),
      ['A', 'B', 'C', 'D', 'E', 'F'],
    );
    assert.equal(isWithinRadiusKm(250, 0), true);
    assert.equal(isWithinRadiusKm(120, 100), false);
    assert.equal(isWithinRadiusKm(90, 100), true);
  });

  it('offers Unlimited after 100 km and does not treat it as a fake large radius', () => {
    assert.deepEqual(FEED_RADIUS_UI_OPTIONS, [5, 10, 25, 50, 100, 0]);
    assert.equal(nextWiderFeedRadiusKm(100), 0);
    assert.equal(nextWiderFeedRadiusKm(50), 100);
    assert.equal(isUnlimitedRadius(0), true);
    assert.equal(feedQueryAppliesDistanceBbox(0), false);
    assert.equal(feedQueryAppliesDistanceBbox(5), true);
    assert.equal(feedQueryAppliesDistanceBbox(100), true);
    const box = feedDistanceBoxOrMissingCoords(51.912, 4.342, 25);
    assert.ok("OR" in box && box.OR.some((clause) => "lat" in clause && clause.lat === null));
    assert.deepEqual(feedDistanceBoxOrMissingCoords(51.912, 4.342, 0), {});
    assert.equal(RADIUS_NATIONAL_KM, 0);
  });
});
