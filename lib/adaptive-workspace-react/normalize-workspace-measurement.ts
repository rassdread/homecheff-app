import type { MeasuredBox, NormalizedMeasurement } from "./workspace-runtime-types";

/** Floor to integer px; ignore sub-pixel noise. */
export function floorDimension(n: number): number {
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/**
 * Deterministic stability token — no timestamps / UUIDs.
 * Example: settings:1280x720:v1
 */
export function buildSettingsStabilityToken(
  widthPx: number,
  heightPx: number,
): string {
  return `settings:${widthPx}x${heightPx}:v1`;
}

/**
 * Normalize a container measurement into usable workspace dimensions.
 * Phase 2B: the measured Settings container IS the usable space
 * (already inside existing app chrome). No chrome re-subtraction.
 */
export function normalizeWorkspaceMeasurement(
  box: MeasuredBox,
): NormalizedMeasurement | null {
  const widthPx = floorDimension(box.widthPx);
  const heightPx = floorDimension(box.heightPx);
  if (widthPx <= 0 || heightPx <= 0) return null;
  return {
    widthPx,
    heightPx,
    stabilityToken: buildSettingsStabilityToken(widthPx, heightPx),
  };
}

/**
 * True when the new measurement is effectively identical to the previous
 * stable measurement (ignore 0-delta and tiny noise already floored away).
 */
export function isSameNormalizedMeasurement(
  a: NormalizedMeasurement | null,
  b: NormalizedMeasurement | null,
): boolean {
  if (!a || !b) return false;
  return (
    a.widthPx === b.widthPx &&
    a.heightPx === b.heightPx &&
    a.stabilityToken === b.stabilityToken
  );
}

/**
 * Pure coalesce helper: given previous stable token and incoming box,
 * returns whether a resolve should run and the next stable measurement.
 */
export function coalesceMeasurement(
  previous: NormalizedMeasurement | null,
  box: MeasuredBox,
): { shouldResolve: boolean; next: NormalizedMeasurement | null } {
  const next = normalizeWorkspaceMeasurement(box);
  if (!next) return { shouldResolve: false, next: previous };
  if (isSameNormalizedMeasurement(previous, next)) {
    return { shouldResolve: false, next: previous };
  }
  return { shouldResolve: true, next };
}
