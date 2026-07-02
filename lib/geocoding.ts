// Distance calculation utilities
// Uses Haversine formula for "as-the-crow-flies" distance
// Note: For route-based distances, use lib/google-maps-distance.ts instead

import { haversineKm } from '@/lib/community/geoDistance';

/**
 * Safe distance — returns null when coords invalid (never use null as 0 km in UI).
 */
export function safeDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number | null {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return null;
  }
  return haversineKm(lat1, lng1, lat2, lng2);
}

/** @deprecated Prefer safeDistanceKm for display; returns 0 when coords invalid (legacy callers). */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return safeDistanceKm(lat1, lng1, lat2, lng2) ?? 0;
}