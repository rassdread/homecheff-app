/**
 * Interleave growth surfaces into mobile feed rows — Phase 3M.
 */

import type { GrowthSurfacePlan, GrowthMobileInsert } from '@/lib/discovery/growth/growth-surface-contract';
import type { FeedRowWithOpportunity } from './opportunity-surface-feed-rows';

export type GrowthSurfaceDisplayRow = {
  row: 'growth_surface';
  insert: GrowthMobileInsert;
};

export type FeedRowWithGrowth<T> =
  | FeedRowWithOpportunity<T>
  | GrowthSurfaceDisplayRow;

export function getGrowthMobileInserts(
  plan: import('@/lib/discovery/surfaces/surface-contract').ResolvedSurfacePlan | null | undefined,
): GrowthMobileInsert[] {
  return plan?.growthSurfaces?.mobileInserts ?? [];
}

export function getGrowthMobileInsertIndices(
  plan: import('@/lib/discovery/surfaces/surface-contract').ResolvedSurfacePlan | null | undefined,
): number[] {
  return getGrowthMobileInserts(plan).map((i) => i.afterSaleIndex);
}

/**
 * Insert growth nudges after activity/opportunity at reserved slots.
 */
export function interleaveMobileGrowthSurfaces<T>(
  rows: FeedRowWithOpportunity<T>[],
  growthPlan: GrowthSurfacePlan | null | undefined,
  maxInserts = 2,
): FeedRowWithGrowth<T>[] {
  const inserts = growthPlan?.mobileInserts ?? [];
  if (inserts.length === 0 || maxInserts <= 0) return rows;

  const out: FeedRowWithGrowth<T>[] = [];
  let saleIndex = 0;
  let inserted = 0;
  const queue = [...inserts];

  for (const row of rows) {
    out.push(row as FeedRowWithGrowth<T>);
    if (row.row !== 'sale') continue;
    saleIndex += 1;
    if (inserted >= maxInserts || queue.length === 0) continue;

    const next = queue[0];
    if (!next || next.afterSaleIndex !== saleIndex) continue;

    const slotTaken = out.some(
      (r, idx) =>
        idx > 0 &&
        (r.row === 'activity_card' ||
          r.row === 'economy_opportunity' ||
          r.row === 'growth_surface') &&
        out[idx - 1]?.row === 'sale' &&
        countSalesBefore(out, idx) === saleIndex,
    );
    if (slotTaken) continue;

    out.push({ row: 'growth_surface', insert: queue.shift()! });
    inserted += 1;
  }

  return out;
}

function countSalesBefore(
  rows: FeedRowWithGrowth<unknown>[],
  upToIndex: number,
): number {
  let count = 0;
  for (let i = 0; i < upToIndex; i += 1) {
    if (rows[i]?.row === 'sale') count += 1;
  }
  return count;
}
