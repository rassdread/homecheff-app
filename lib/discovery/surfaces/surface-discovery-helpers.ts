/**
 * Read surface plan from discovery feed payload.
 */

import type { DiscoveryFeedPayload } from '@/lib/feed/discovery-feed-contract';
import type { ResolvedSurfacePlan } from './surface-contract';
import { emptySurfacePlan } from './surface-router';

export function getSurfacePlanFromDiscovery(
  discovery: DiscoveryFeedPayload | null | undefined,
): ResolvedSurfacePlan | null {
  if (!discovery?.futureSlots?.length) return null;
  const slot = discovery.futureSlots.find(
    (s): s is Extract<typeof s, { kind: 'surfaces'; enabled: true }> =>
      s.kind === 'surfaces' && s.enabled === true,
  );
  return slot?.plan ?? null;
}

export function getSurfacePlanOrEmpty(
  discovery: DiscoveryFeedPayload | null | undefined,
): ResolvedSurfacePlan {
  return getSurfacePlanFromDiscovery(discovery) ?? emptySurfacePlan();
}

export function getSidebarActivityModules(
  plan: ResolvedSurfacePlan | null,
): import('./surface-contract').ResolvedActivityModule[] {
  if (!plan?.desktopRightSidebar) return [];
  return plan.desktopRightSidebar.filter(
    (m): m is import('./surface-contract').ResolvedActivityModule =>
      m.kind === 'ACTIVITY',
  );
}

export function getSidebarOpportunityModules(
  plan: ResolvedSurfacePlan | null,
): Array<
  | import('./surface-contract').ResolvedOpportunityModule
  | import('./surface-contract').ResolvedPartnerModule
> {
  if (!plan?.desktopRightSidebar) return [];
  return plan.desktopRightSidebar.filter(
    (
      m,
    ): m is
      | import('./surface-contract').ResolvedOpportunityModule
      | import('./surface-contract').ResolvedPartnerModule =>
      m.kind === 'OPPORTUNITY' || m.kind === 'PARTNER',
  );
}

export function getSidebarStackSlot(
  plan: ResolvedSurfacePlan | null,
  slotId: import('./surface-contract').SidebarStackSlotId,
) {
  return plan?.sidebarStack.find((s) => s.slotId === slotId) ?? null;
}
