/**
 * Interleave economy opportunity surfaces into mobile feed rows — Phase 3J.
 */

import type { ResolvedSurfacePlan } from '@/lib/discovery/surfaces/surface-contract';
import type { EconomyOpportunitySurfaceContract } from '@/lib/discovery/surfaces/map-economy-opportunity-surface';
import type { FeedRowWithActivity } from './activity-card-feed-rows';

export type OpportunitySurfaceDisplayRow = {
  row: 'economy_opportunity';
  contract: EconomyOpportunitySurfaceContract;
};

export type FeedRowWithOpportunity<T> =
  | FeedRowWithActivity<T>
  | OpportunitySurfaceDisplayRow;

export function getEconomyOpportunityMobileInserts(
  plan: ResolvedSurfacePlan | null | undefined,
): EconomyOpportunitySurfaceContract[] {
  if (!plan) return [];
  const fromPlan = plan.opportunityEconomy?.mobileInserts ?? [];
  if (fromPlan.length > 0) return fromPlan;

  return plan.mobileInserts
    .filter((insert) => insert.module.kind === 'ECONOMY_OPPORTUNITY')
    .map(
      (insert) =>
        (insert.module as { contract: EconomyOpportunitySurfaceContract })
          .contract,
    );
}

export function getOpportunityMobileInsertIndices(
  plan: ResolvedSurfacePlan | null | undefined,
): number[] {
  if (!plan) return [];
  return plan.mobileInserts
    .filter((insert) => insert.module.kind === 'ECONOMY_OPPORTUNITY')
    .map((insert) => insert.afterSaleIndex);
}

/**
 * Insert economy opportunities after activity cards at reserved slots.
 */
export function interleaveMobileOpportunitySurfaces<T>(
  rows: FeedRowWithActivity<T>[],
  opportunities: EconomyOpportunitySurfaceContract[],
  afterSaleIndices: readonly number[],
  maxInserts = 1,
): FeedRowWithOpportunity<T>[] {
  if (opportunities.length === 0 || maxInserts <= 0) return rows;

  const out: FeedRowWithOpportunity<T>[] = [];
  let saleIndex = 0;
  let inserted = 0;
  const queue = [...opportunities];

  for (const row of rows) {
    out.push(row as FeedRowWithOpportunity<T>);
    if (row.row !== 'sale') continue;
    saleIndex += 1;
    if (inserted >= maxInserts || queue.length === 0) continue;
    if (!afterSaleIndices.includes(saleIndex)) continue;
    const hasActivityAtSlot = out.some(
      (r, idx) =>
        idx > 0 &&
        r.row === 'activity_card' &&
        out[idx - 1]?.row === 'sale' &&
        saleIndex === countSalesBefore(out, idx),
    );
    if (hasActivityAtSlot && inserted === 0) {
      /* activity takes priority at this slot */
      continue;
    }
    out.push({ row: 'economy_opportunity', contract: queue.shift()! });
    inserted += 1;
  }

  return out;
}

function countSalesBefore(
  rows: FeedRowWithOpportunity<unknown>[],
  upToIndex: number,
): number {
  let count = 0;
  for (let i = 0; i < upToIndex; i += 1) {
    if (rows[i]?.row === 'sale') count += 1;
  }
  return count;
}
