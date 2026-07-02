/**
 * HomeCheff local discovery — radius policy, distance helpers, feed partitioning.
 * Seller anchor: SellerProfile.lat/lng (via resolveSellerCoords in delivery-position).
 */

import { haversineKm, bboxFromCenter } from '@/lib/community/geoDistance';
import { safeDistanceKm } from '@/lib/geocoding';
import { resolveSellerCoords } from '@/lib/delivery/delivery-position';
import {
  computeSaleScore,
  type RankableSaleItem,
} from '@/components/feed/feedSaleRanking';

/** LOCAL preset — default feed radius (km). */
export const RADIUS_LOCAL_KM = 25;

/** REGIONAL preset (km). */
export const RADIUS_REGIONAL_KM = 50;

/** NATIONAL = unlimited (0). */
export const RADIUS_NATIONAL_KM = 0;

/** Default when API client omits radius (aligns with GeoFeed client). */
export const FEED_RADIUS_DEFAULT_KM = RADIUS_LOCAL_KM;

export const RADIUS_PRESET_OPTIONS = [
  RADIUS_NATIONAL_KM,
  5,
  10,
  RADIUS_LOCAL_KM,
  RADIUS_REGIONAL_KM,
  100,
] as const;

export type Coords = { lat: number; lng: number };

export function normalizeFeedRadiusKm(input: number | null | undefined): number {
  if (input == null || !Number.isFinite(input) || input <= 0) {
    return RADIUS_NATIONAL_KM;
  }
  return input;
}

export function isUnlimitedRadius(radiusKm: number): boolean {
  return normalizeFeedRadiusKm(radiusKm) === RADIUS_NATIONAL_KM;
}

export function roundedDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number | null {
  const d = safeDistanceKm(lat1, lng1, lat2, lng2);
  if (d == null) return null;
  return Math.round(d * 10) / 10;
}

export function isWithinRadiusKm(
  distanceKm: number | null | undefined,
  radiusKm: number
): boolean {
  if (isUnlimitedRadius(radiusKm)) return true;
  if (distanceKm == null || !Number.isFinite(distanceKm)) return false;
  return distanceKm <= radiusKm + 0.001;
}

/** UI: never show "0 km" for unknown/invalid distance. */
export function formatDistanceLabel(km: number | null | undefined): string | null {
  if (km == null || !Number.isFinite(km) || km <= 0) return null;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export const DISTANCE_UNKNOWN_LABEL = 'Locatie onbekend';

export function sellerBboxWhere(viewer: Coords, radiusKm: number) {
  const bbox = bboxFromCenter(viewer.lat, viewer.lng, radiusKm);
  return {
    OR: [
      { seller: { OR: [{ lat: null }, { lng: null }] } },
      {
        seller: {
          lat: { gte: bbox.latMin, lte: bbox.latMax },
          lng: { gte: bbox.lngMin, lte: bbox.lngMax },
        },
      },
    ],
  };
}

export type SellerCoordsInput = {
  lat?: number | null;
  lng?: number | null;
  User?: { lat?: number | null; lng?: number | null } | null;
};

/** Product/listing item coords from SellerProfile (marketplace anchor). */
export function resolveMarketplaceItemCoords(
  seller: SellerCoordsInput | null | undefined
): Coords | null {
  return resolveSellerCoords(seller);
}

export function filterProductWithinRadius(
  seller: SellerCoordsInput | null | undefined,
  viewer: Coords,
  radiusKm: number
): boolean {
  if (isUnlimitedRadius(radiusKm)) return true;
  const coords = resolveMarketplaceItemCoords(seller);
  if (!coords) return true;
  const d = safeDistanceKm(viewer.lat, viewer.lng, coords.lat, coords.lng);
  return isWithinRadiusKm(d, radiusKm);
}

const FOLLOW_RECENCY_MS = 7 * 24 * 60 * 60 * 1000;

function compareRecencyFollowDistance<T extends Record<string, unknown>>(
  a: T,
  b: T,
  opts: {
    followedSellerUserIds: Set<string>;
    extractSellerUserId: (item: T) => string | null;
    extractCoords: (item: T) => Coords | null;
    viewerGeo: Coords | null;
  }
): number {
  const ta = new Date(String(a.createdAt)).getTime();
  const tb = new Date(String(b.createdAt)).getTime();
  const sa = opts.followedSellerUserIds.has(
    opts.extractSellerUserId(a) || ''
  )
    ? 1
    : 0;
  const sb = opts.followedSellerUserIds.has(
    opts.extractSellerUserId(b) || ''
  )
    ? 1
    : 0;

  if (sa !== sb && Math.abs(tb - ta) < FOLLOW_RECENCY_MS) {
    return sb - sa;
  }

  if (opts.viewerGeo) {
    const ca = opts.extractCoords(a);
    const cb = opts.extractCoords(b);
    if (ca && cb) {
      const da = haversineKm(
        opts.viewerGeo.lat,
        opts.viewerGeo.lng,
        ca.lat,
        ca.lng
      );
      const db = haversineKm(
        opts.viewerGeo.lat,
        opts.viewerGeo.lng,
        cb.lat,
        cb.lng
      );
      if (Math.abs(da - db) > 2) {
        return da - db;
      }
    } else if (ca && !cb) {
      return -1;
    } else if (!ca && cb) {
      return 1;
    }
  }

  if (tb !== ta) return tb - ta;
  return String(b.id).localeCompare(String(a.id));
}

function toRankable<T extends Record<string, unknown>>(item: T): RankableSaleItem {
  return {
    id: String(item.id),
    photo: null,
    createdAt: String(item.createdAt),
    viewCount: (item.viewCount as number | undefined) ?? 0,
    propsCount: (item.propsCount as number | undefined) ?? 0,
    favoriteCount: (item.favoriteCount as number | undefined) ?? 0,
    distanceKm: item.distanceKm as number | undefined,
  };
}

/**
 * Local-first feed order: items within radius (by score), then national tail (recency).
 * When no viewer or unlimited radius: national discovery sort only.
 */
export function sortFeedItemsLocalFirst<T extends Record<string, unknown>>(
  items: T[],
  opts: {
    viewerGeo: Coords | null;
    radiusKm: number;
    followedSellerUserIds: Set<string>;
    extractSellerUserId: (item: T) => string | null;
    extractCoords: (item: T) => Coords | null;
  }
): T[] {
  const radius = normalizeFeedRadiusKm(opts.radiusKm);
  const nowMs = Date.now();

  for (const item of items) {
    const coords = opts.extractCoords(item);
    if (opts.viewerGeo && coords) {
      item.distanceKm = roundedDistanceKm(
        opts.viewerGeo.lat,
        opts.viewerGeo.lng,
        coords.lat,
        coords.lng
      );
    } else {
      delete item.distanceKm;
    }
  }

  if (!opts.viewerGeo || isUnlimitedRadius(radius)) {
    return [...items].sort((a, b) =>
      compareRecencyFollowDistance(a, b, {
        ...opts,
        viewerGeo: opts.viewerGeo,
      })
    );
  }

  const local: T[] = [];
  const national: T[] = [];

  for (const item of items) {
    const d = item.distanceKm as number | undefined;
    if (isWithinRadiusKm(d, radius)) {
      local.push(item);
    } else {
      national.push(item);
    }
  }

  const localSorted = local
    .map((item) => ({ item, score: computeSaleScore(toRankable(item), nowMs) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(b.item.id).localeCompare(String(a.item.id));
    })
    .map((x) => x.item);

  const nationalSorted = [...national].sort((a, b) =>
    compareRecencyFollowDistance(a, b, { ...opts, viewerGeo: opts.viewerGeo })
  );

  return [...localSorted, ...nationalSorted];
}
