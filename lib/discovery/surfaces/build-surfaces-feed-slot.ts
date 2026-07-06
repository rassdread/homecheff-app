/**
 * Build discovery.futureSlots.surfaces payload (Phase 3E).
 */

import type { DiscoverySurfacesSlot } from '@/lib/feed/discovery-feed-contract';
import type { SurfaceRouterContext } from './surface-context';
import { buildSurfaceRouterContext } from './surface-context';
import { resolveSurfaces } from './surface-router';
import type { ActivityCardContract } from '@/lib/discovery/activity-cards/activity-card-contract';
import { SURFACE_ROUTER_SPEC_VERSION } from './surface-contract';

export type BuildSurfacesSlotInput = {
  context: Omit<SurfaceRouterContext, 'opportunityEligibility'> & {
    opportunityEligibility?: SurfaceRouterContext['opportunityEligibility'];
  };
  activityContracts?: ActivityCardContract[];
  enabled?: boolean;
};

export function buildSurfacesFeedSlot(
  input: BuildSurfacesSlotInput,
): DiscoverySurfacesSlot {
  if (!input.enabled || !input.context.viewer.loggedIn) {
    return {
      kind: 'surfaces',
      enabled: false,
      specVersion: SURFACE_ROUTER_SPEC_VERSION,
    };
  }

  const ctx = buildSurfaceRouterContext(input.context);
  const plan = resolveSurfaces(ctx, {
    activityContracts: input.activityContracts,
  });

  if (
    plan.desktopRightSidebar.length === 0 &&
    plan.mobileInserts.length === 0 &&
    plan.profileModules.length === 0
  ) {
    return {
      kind: 'surfaces',
      enabled: false,
      specVersion: SURFACE_ROUTER_SPEC_VERSION,
    };
  }

  return {
    kind: 'surfaces',
    enabled: true,
    specVersion: SURFACE_ROUTER_SPEC_VERSION,
    plan,
  };
}
