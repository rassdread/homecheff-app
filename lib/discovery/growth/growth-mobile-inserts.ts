/**
 * Growth mobile inserts — Phase 3M.
 * Uses SurfaceRouter slots; respects cooldowns; no duplicated feed logic.
 */

import { ACTIVITY_CARD_MOBILE_INSERTION } from '@/lib/discovery/activity-cards/activity-card-insertion-planner';
import { MOBILE_PLATFORM_RESERVED_SALE_INDICES } from '@/lib/discovery/surfaces/resolve-mobile-surface-inserts';
import type { GrowthSurfaceBundle } from './growth-surface-contract';
import {
  GROWTH_ACTION_COOLDOWN_DAYS,
  GROWTH_MOBILE_MAX_INSERTS,
  type GrowthMobileInsert,
} from './growth-surface-contract';

/** Slots after activity/opportunity reserved indices for growth nudges. */
export const GROWTH_MOBILE_INSERT_SLOTS = [12, 24] as const;

export type BuildGrowthMobileInsertsInput = {
  bundle: GrowthSurfaceBundle;
  occupiedSlots?: readonly number[];
  maxInserts?: number;
};

export function buildGrowthMobileInserts(
  input: BuildGrowthMobileInsertsInput,
): GrowthMobileInsert[] {
  const maxInserts = input.maxInserts ?? GROWTH_MOBILE_MAX_INSERTS;
  const occupied = new Set(input.occupiedSlots ?? []);
  const inserts: GrowthMobileInsert[] = [];

  const { bundle } = input;
  const sidebar = bundle.communityProgress.sidebar;

  for (const afterSaleIndex of GROWTH_MOBILE_INSERT_SLOTS) {
    if (inserts.length >= maxInserts) break;
    if (MOBILE_PLATFORM_RESERVED_SALE_INDICES.has(afterSaleIndex)) continue;
    if (occupied.has(afterSaleIndex)) continue;
    if (!ACTIVITY_CARD_MOBILE_INSERTION.includes(afterSaleIndex)) continue;

    if (inserts.length === 0 && bundle.recommendedActions.primary) {
      inserts.push({
        afterSaleIndex,
        kind: 'growth_action',
        action: bundle.recommendedActions.primary,
        cooldownDays: bundle.recommendedActions.primary.cooldownDays,
      });
      continue;
    }

    if (
      inserts.length < maxInserts &&
      (sidebar.primaryStreak?.active || sidebar.nextMilestone)
    ) {
      inserts.push({
        afterSaleIndex,
        kind: 'growth_progress',
        progressNudge: {
          levelTitleKey: sidebar.currentLevel.titleKey,
          streakWeeks: sidebar.primaryStreak?.currentWeeks ?? 0,
          milestoneTitleKey: sidebar.nextMilestone
            ? `community.progress.milestones.${sidebar.nextMilestone.category.toLowerCase()}.next`
            : null,
        },
        cooldownDays: GROWTH_ACTION_COOLDOWN_DAYS,
      });
    }
  }

  return inserts;
}

export function growthMobileInsertIndices(
  inserts: GrowthMobileInsert[],
): number[] {
  return inserts.map((i) => i.afterSaleIndex);
}
