/**
 * Canonical desktop right-sidebar surface stack order — Phase 3F.
 */

import type { SidebarStackSlotId } from './surface-contract';
import { SIDEBAR_STACK_SLOT_IDS } from './surface-contract';

/** Production stack order (top → bottom) for surface modules. */
export const CANONICAL_SIDEBAR_STACK_ORDER: readonly SidebarStackSlotId[] =
  SIDEBAR_STACK_SLOT_IDS;

export const SIDEBAR_STACK_SLOT_RANK: Record<SidebarStackSlotId, number> = {
  community_pulse: 100,
  activity_module: 90,
  opportunity_module: 80,
  workshop_module: 75,
  partner_module: 70,
  event_module: 65,
  platform_module: 50,
  sponsored_placeholder: 40,
};

export function compareSidebarStackSlots(
  a: SidebarStackSlotId,
  b: SidebarStackSlotId,
): number {
  return SIDEBAR_STACK_SLOT_RANK[b] - SIDEBAR_STACK_SLOT_RANK[a];
}

export function isCanonicalStackOrder(slots: SidebarStackSlotId[]): boolean {
  if (slots.length !== CANONICAL_SIDEBAR_STACK_ORDER.length) return false;
  return slots.every((id, i) => id === CANONICAL_SIDEBAR_STACK_ORDER[i]);
}
