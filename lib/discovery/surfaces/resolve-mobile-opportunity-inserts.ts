/**
 * Mobile opportunity insert pipeline — Phase 3J.
 * Priority after platform reserved indices: Activity → Opportunity.
 * Platform inserts are handled separately in GeoFeed.
 */

import { ACTIVITY_CARD_MOBILE_INSERTION } from '@/lib/discovery/activity-cards/activity-card-insertion-planner';
import type { MobileSurfaceInsert, ResolvedSurfaceModule } from './surface-contract';
import {
  MOBILE_PLATFORM_RESERVED_SALE_INDICES,
} from './resolve-mobile-surface-inserts';

export type MobileSurfaceInsertTier = 'activity' | 'opportunity';

export type PrioritizedMobileInsert = MobileSurfaceInsert & {
  tier: MobileSurfaceInsertTier;
};

export type BuildPrioritizedMobileInsertsInput = {
  activityModules: ResolvedSurfaceModule[];
  opportunityModules: ResolvedSurfaceModule[];
  mobileSlots?: readonly number[];
  maxActivityInserts?: number;
  maxOpportunityInserts?: number;
};

/**
 * Merge activity + economy opportunity inserts with slot priority.
 * At each slot: activity first, then opportunity if slot still free.
 */
export function buildPrioritizedMobileInserts(
  input: BuildPrioritizedMobileInsertsInput,
): PrioritizedMobileInsert[] {
  const slots = input.mobileSlots ?? ACTIVITY_CARD_MOBILE_INSERTION;
  const maxActivity = input.maxActivityInserts ?? 2;
  const maxOpportunity = input.maxOpportunityInserts ?? 1;

  const activityQueue = [...input.activityModules];
  const opportunityQueue = [...input.opportunityModules];
  const inserts: PrioritizedMobileInsert[] = [];
  let activityCount = 0;
  let opportunityCount = 0;

  for (const afterSaleIndex of slots) {
    if (MOBILE_PLATFORM_RESERVED_SALE_INDICES.has(afterSaleIndex)) continue;

    const slotTaken = inserts.some((i) => i.afterSaleIndex === afterSaleIndex);
    if (slotTaken) continue;

    if (activityCount < maxActivity && activityQueue.length > 0) {
      inserts.push({
        afterSaleIndex,
        module: activityQueue.shift()!,
        tier: 'activity',
      });
      activityCount += 1;
      continue;
    }

    if (opportunityCount < maxOpportunity && opportunityQueue.length > 0) {
      inserts.push({
        afterSaleIndex,
        module: opportunityQueue.shift()!,
        tier: 'opportunity',
      });
      opportunityCount += 1;
    }
  }

  return inserts;
}

export function economyOpportunityInsertIndices(
  inserts: PrioritizedMobileInsert[],
): number[] {
  return inserts
    .filter((i) => i.tier === 'opportunity')
    .map((i) => i.afterSaleIndex);
}
