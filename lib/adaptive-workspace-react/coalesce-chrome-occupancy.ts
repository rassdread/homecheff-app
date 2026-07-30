import type {
  ChromeOccupancyCoalesceResult,
  WorkspaceChromeOccupancy,
} from "./chrome-occupancy-types";
import { emptyChromeOccupancy } from "./build-chrome-occupancy";

export function isSameChromeOccupancy(
  a: WorkspaceChromeOccupancy | null,
  b: WorkspaceChromeOccupancy | null,
): boolean {
  if (!a || !b) return false;
  return a.stabilityToken === b.stabilityToken;
}

/**
 * Coalesce occupancy updates — identical tokens are ignored (no resolve storm).
 */
export function coalesceChromeOccupancy(
  previous: WorkspaceChromeOccupancy | null,
  next: WorkspaceChromeOccupancy,
): ChromeOccupancyCoalesceResult {
  const safeNext = next ?? emptyChromeOccupancy();
  if (previous && isSameChromeOccupancy(previous, safeNext)) {
    return {
      shouldUpdate: false,
      next: previous,
      ignoredIdentical: true,
    };
  }
  return {
    shouldUpdate: true,
    next: safeNext,
    ignoredIdentical: false,
  };
}
