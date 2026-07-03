/**
 * Marketplace/card distance label (feed, product, listing cards):
 * - < 1 km → meters (e.g. "850 m")
 * - < 10 km → one decimal (e.g. "3.2 km", "8.7 km")
 * - ≥ 10 km → whole km (e.g. "12 km", "230 km")
 */
export function formatMarketplaceDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km <= 0) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) {
    const rounded = Math.round(km * 10) / 10;
    return `${rounded.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/** Null when distance is unknown or invalid — for optional UI slots. */
export function formatMarketplaceDistanceLabel(
  km: number | null | undefined
): string | null {
  if (km == null || !Number.isFinite(km) || km <= 0) return null;
  return formatMarketplaceDistanceKm(km);
}
