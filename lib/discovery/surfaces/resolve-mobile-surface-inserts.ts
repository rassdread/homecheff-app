/**
 * Mobile surface insert resolver — Phase 3E.
 * Maps ResolvedSurfacePlan to feed row indices; yields to platform inserts.
 */

import { ACTIVITY_CARD_MOBILE_INSERTION } from '@/lib/discovery/activity-cards/activity-card-insertion-planner';
import type { MobileSurfaceInsert, ResolvedSurfaceModule } from './surface-contract';

/** Platform home inserts that block surface modules at these 1-based sale indices. */
export const MOBILE_PLATFORM_RESERVED_SALE_INDICES = new Set([
  1, 3, 4, 7, 8, 11, 12,
]);

export type ResolveMobileSurfaceInsertsInput = {
  modules: ResolvedSurfaceModule[];
  mobileSlots?: readonly number[];
  maxInserts?: number;
};

export function resolveMobileSurfaceInserts(
  input: ResolveMobileSurfaceInsertsInput,
): MobileSurfaceInsert[] {
  const slots = input.mobileSlots ?? ACTIVITY_CARD_MOBILE_INSERTION;
  const maxInserts = input.maxInserts ?? 2;
  const queue = [...input.modules];
  const inserts: MobileSurfaceInsert[] = [];

  for (const afterSaleIndex of slots) {
    if (inserts.length >= maxInserts || queue.length === 0) break;
    if (MOBILE_PLATFORM_RESERVED_SALE_INDICES.has(afterSaleIndex)) continue;
    const module = queue.shift()!;
    inserts.push({ afterSaleIndex, module });
  }

  return inserts;
}

export function shouldRenderMobileSurfaceAtSaleIndex(
  afterSaleIndex: number,
  inserts: MobileSurfaceInsert[],
): ResolvedSurfaceModule | null {
  if (MOBILE_PLATFORM_RESERVED_SALE_INDICES.has(afterSaleIndex)) return null;
  const hit = inserts.find((i) => i.afterSaleIndex === afterSaleIndex);
  return hit?.module ?? null;
}

export function mobileInsertIndices(inserts: MobileSurfaceInsert[]): number[] {
  return inserts.map((i) => i.afterSaleIndex);
}
