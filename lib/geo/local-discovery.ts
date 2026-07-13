/**
 * HomeCheff local discovery — radius policy, distance helpers, feed partitioning.
 * Seller anchor: SellerProfile.lat/lng (via resolveSellerCoords in delivery-position).
 */

import { formatMarketplaceDistanceLabel } from '@/lib/geo/distance-format';
import { haversineKm, bboxFromCenter } from '@/lib/community/geoDistance';
import { safeDistanceKm } from '@/lib/geocoding';
import { resolveSellerCoords } from '@/lib/delivery/delivery-position';

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

/** Default: local items first, national tail fills the feed. */
export const FEED_RADIUS_MODE_LOCAL_FIRST = 'local_first' as const;

/** Hard filter: only items with valid coords within radius. */
export const FEED_RADIUS_MODE_STRICT_LOCAL = 'strict_local' as const;

export type FeedRadiusMode =
  | typeof FEED_RADIUS_MODE_LOCAL_FIRST
  | typeof FEED_RADIUS_MODE_STRICT_LOCAL;

export function normalizeFeedRadiusMode(
  input: string | null | undefined
): FeedRadiusMode {
  if (input === FEED_RADIUS_MODE_STRICT_LOCAL) {
    return FEED_RADIUS_MODE_STRICT_LOCAL;
  }
  return FEED_RADIUS_MODE_LOCAL_FIRST;
}

export function isStrictLocalRadiusMode(mode: FeedRadiusMode): boolean {
  return mode === FEED_RADIUS_MODE_STRICT_LOCAL;
}

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
  if (d == null || !Number.isFinite(d) || d <= 0) return null;
  const rounded = Math.round(d * 10) / 10;
  return rounded > 0 ? rounded : null;
}

export function isWithinRadiusKm(
  distanceKm: number | null | undefined,
  radiusKm: number
): boolean {
  if (isUnlimitedRadius(radiusKm)) return true;
  if (distanceKm == null || !Number.isFinite(distanceKm)) return false;
  return distanceKm <= radiusKm + 0.001;
}

export const DISTANCE_UNKNOWN_LABEL = 'Locatie onbekend';

/** UI: never show "0 km" for unknown/invalid distance. */
export function formatDistanceLabel(km: number | null | undefined): string | null {
  return formatMarketplaceDistanceLabel(km);
}

export { formatMarketplaceDistanceKm } from '@/lib/geo/distance-format';

export type SellerBboxWhereOptions = {
  /** When false (STRICT_LOCAL), sellers without coords are excluded from the DB prefilter. */
  includeNullCoords?: boolean;
};

/**
 * DB prefilter for STRICT_LOCAL only.
 * Matches products whose anchor coords fall inside the viewer bbox:
 * pickup → SellerProfile → User (same priority as item-location).
 * LOCAL_FIRST must not use this — national tail needs items outside bbox.
 */
export function productGeoBboxWhere(
  viewer: Coords,
  radiusKm: number
) {
  const bbox = bboxFromCenter(viewer.lat, viewer.lng, radiusKm);

  const pickupInBbox = {
    pickupLat: { gte: bbox.latMin, lte: bbox.latMax },
    pickupLng: { gte: bbox.lngMin, lte: bbox.lngMax },
  };

  const sellerProfileInBbox = {
    seller: {
      lat: { gte: bbox.latMin, lte: bbox.latMax },
      lng: { gte: bbox.lngMin, lte: bbox.lngMax },
    },
  };

  const userFallbackInBbox = {
    seller: {
      OR: [{ lat: null }, { lng: null }],
      User: {
        lat: { gte: bbox.latMin, lte: bbox.latMax },
        lng: { gte: bbox.lngMin, lte: bbox.lngMax },
      },
    },
  };

  return {
    OR: [pickupInBbox, sellerProfileInBbox, userFallbackInBbox],
  };
}

/** @deprecated Use productGeoBboxWhere — kept for scripts/tests. */
export function sellerBboxWhere(
  viewer: Coords,
  radiusKm: number,
  options?: SellerBboxWhereOptions
) {
  const includeNullCoords = options?.includeNullCoords !== false;
  if (includeNullCoords) {
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
  return productGeoBboxWhere(viewer, radiusKm);
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
  radiusKm: number,
  mode: FeedRadiusMode = FEED_RADIUS_MODE_LOCAL_FIRST
): boolean {
  if (isUnlimitedRadius(radiusKm)) return true;
  const coords = resolveMarketplaceItemCoords(seller);
  if (!coords) {
    return !isStrictLocalRadiusMode(mode);
  }
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

function sortLocalBucketByDistance<T extends Record<string, unknown>>(
  local: T[],
): T[] {
  return [...local].sort((a, b) => {
    const da = a.distanceKm as number | undefined;
    const db = b.distanceKm as number | undefined;
    if (da != null && db != null && da !== db) return da - db;
    if (da != null && db == null) return -1;
    if (da == null && db != null) return 1;
    const ta = new Date(String(a.createdAt)).getTime();
    const tb = new Date(String(b.createdAt)).getTime();
    if (tb !== ta) return tb - ta;
    return String(b.id).localeCompare(String(a.id));
  });
}

/**
 * Feed geo sort/filter.
 * - LOCAL_FIRST: items within radius first (by score), then national tail (recency).
 * - STRICT_LOCAL: only items with valid distanceKm <= radius; no national tail.
 * When no viewer or unlimited radius: national discovery sort only.
 */
export function sortFeedItemsLocalFirst<T extends Record<string, unknown>>(
  items: T[],
  opts: {
    viewerGeo: Coords | null;
    radiusKm: number;
    radiusMode?: FeedRadiusMode;
    followedSellerUserIds: Set<string>;
    extractSellerUserId: (item: T) => string | null;
    extractCoords: (item: T) => Coords | null;
  }
): T[] {
  const radius = normalizeFeedRadiusKm(opts.radiusKm);
  const radiusMode = opts.radiusMode ?? FEED_RADIUS_MODE_LOCAL_FIRST;

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
        // National/unlimited: recency only — coords are labels-only (Phase 3F).
        viewerGeo: null,
      })
    );
  }

  const strictActive =
    isStrictLocalRadiusMode(radiusMode) &&
    opts.viewerGeo != null &&
    !isUnlimitedRadius(radius);

  if (strictActive) {
    const within = items.filter((item) =>
      isWithinRadiusKm(item.distanceKm as number | undefined, radius)
    );
    return sortLocalBucketByDistance(within);
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

  const localSorted = sortLocalBucketByDistance(local);

  const nationalSorted = [...national].sort((a, b) =>
    compareRecencyFollowDistance(a, b, { ...opts, viewerGeo: opts.viewerGeo })
  );

  return [...localSorted, ...nationalSorted];
}

/** Next preset radius larger than current (for “widen radius” CTA). */
export function nextWiderFeedRadiusKm(current: number): number {
  const positive = RADIUS_PRESET_OPTIONS.filter((r) => r > 0);
  for (const preset of positive) {
    if (preset > current) return preset;
  }
  return Math.min(100, Math.max(current + 10, current * 2));
}
