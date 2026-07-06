/**
 * Sidebar slot visibility — show / hide / collapsed / expanded (Phase 3F).
 */

import type {
  SidebarSlotVisibility,
  SidebarStackSlotId,
} from './surface-contract';
import type { SurfaceRouterContext } from './surface-context';

export type SidebarVisibilityInput = {
  ctx: SurfaceRouterContext;
  slotId: SidebarStackSlotId;
  hasModule: boolean;
  moduleCount?: number;
  collapseThreshold?: number;
};

export function resolveSidebarSlotVisibility(
  input: SidebarVisibilityInput,
): SidebarSlotVisibility {
  const { ctx, slotId, hasModule, moduleCount = 0, collapseThreshold = 2 } =
    input;
  const { viewer, roles, trust } = ctx;

  switch (slotId) {
    case 'community_pulse':
      return viewer.guest || viewer.loggedIn ? 'show' : 'hide';

    case 'activity_module':
      if (viewer.guest) return 'hide';
      if (!hasModule) return 'hide';
      return moduleCount > collapseThreshold ? 'collapsed' : 'expanded';

    case 'opportunity_module':
      if (viewer.guest) return 'hide';
      if (!hasModule) return 'hide';
      if (roles.hasDeliveryProfile && !roles.hasSellerRole) return 'hide';
      return 'expanded';

    case 'workshop_module':
      if (viewer.guest) return 'hide';
      if (!hasModule) return 'hide';
      return 'expanded';

    case 'partner_module':
      if (viewer.guest) return 'hide';
      if (!hasModule) return 'hide';
      if (!roles.hasSellerRole && trust.sellerTier < 1) return 'hide';
      if (roles.isAmbassador) return 'expanded';
      return roles.hasSellerRole ? 'expanded' : 'hide';

    case 'event_module':
      if (!hasModule) return 'hide';
      if (viewer.guest) return viewer.loggedIn ? 'hide' : 'hide';
      return ctx.location.hasLocation ? 'expanded' : 'collapsed';

    case 'platform_module':
      return 'show';

    case 'sponsored_placeholder':
      return viewer.guest ? 'collapsed' : 'show';

    default:
      return 'hide';
  }
}

export function isSidebarSlotRenderable(
  visibility: SidebarSlotVisibility,
): boolean {
  return visibility !== 'hide';
}
