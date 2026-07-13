/**
 * Phase 3F — Apply viewer distance labels without reordering (national labels-only).
 */

import {
  roundedDistanceKm,
  type Coords,
} from '@/lib/geo/local-discovery';

export function extractFeedItemCoordsForLabels(
  item: Record<string, unknown>,
): Coords | null {
  const lat =
    item.lat ??
    item.pickupLat ??
    (item.location as { lat?: number } | undefined)?.lat ??
    (item.seller as { lat?: number } | undefined)?.lat;
  const lng =
    item.lng ??
    item.pickupLng ??
    (item.location as { lng?: number } | undefined)?.lng ??
    (item.seller as { lng?: number } | undefined)?.lng;
  if (
    lat != null &&
    lng != null &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng))
  ) {
    return { lat: Number(lat), lng: Number(lng) };
  }
  return null;
}

export function applyFeedViewerDistanceLabels<T extends Record<string, unknown>>(
  items: T[],
  viewerGeo: Coords | null,
): T[] {
  if (!viewerGeo) {
    return items.map((item) => {
      const copy = { ...item };
      delete copy.distanceKm;
      return copy;
    });
  }
  return items.map((item) => {
    const coords = extractFeedItemCoordsForLabels(item);
    if (!coords) {
      const copy = { ...item };
      delete copy.distanceKm;
      return copy;
    }
    const km = roundedDistanceKm(
      viewerGeo.lat,
      viewerGeo.lng,
      coords.lat,
      coords.lng,
    );
    if (km == null) {
      const copy = { ...item };
      delete copy.distanceKm;
      return copy;
    }
    return { ...item, distanceKm: km };
  });
}

/** Strip distanceKm for cache storage (presentation applied post-cache). */
export function stripFeedViewerDistanceLabels<T extends Record<string, unknown>>(
  items: T[],
): T[] {
  return items.map((item) => {
    const copy = { ...item };
    delete copy.distanceKm;
    return copy;
  });
}
