/**
 * Build canonical sidebar stack slots with visibility — Phase 3F.
 */

import type {
  CommunityModuleContract,
  OpportunityModuleContract,
  ResolvedActivityModule,
  ResolvedSurfaceModule,
  SidebarStackSlot,
  WorkshopModuleContract,
} from './surface-contract';
import { CANONICAL_SIDEBAR_STACK_ORDER } from './sidebar-stack-order';
import type { SurfaceRouterContext } from './surface-context';
import { resolveSidebarSlotVisibility } from './resolve-sidebar-visibility';

export type BuildSidebarStackInput = {
  ctx: SurfaceRouterContext;
  activityModules: ResolvedActivityModule[];
  communityModule: CommunityModuleContract | null;
  /** Legacy opportunity contract or economy opportunity module — Phase 3J. */
  opportunityModule: ResolvedSurfaceModule | null;
  partnerModule: OpportunityModuleContract | null;
  workshopModule: WorkshopModuleContract | null;
  eventModule: ResolvedSurfaceModule | null;
};

function toCommunityResolved(
  contract: CommunityModuleContract,
): ResolvedSurfaceModule {
  return { kind: 'COMMUNITY', size: 'compact', contract };
}

function toOpportunityResolved(
  contract: OpportunityModuleContract,
): ResolvedSurfaceModule {
  return { kind: 'OPPORTUNITY', size: 'standard', contract };
}

function toPartnerResolved(
  contract: OpportunityModuleContract,
): ResolvedSurfaceModule {
  return {
    kind: 'PARTNER',
    size: 'standard',
    contract: contract as import('./surface-contract').PartnerModuleContract,
  };
}

function toWorkshopResolved(
  contract: WorkshopModuleContract,
): ResolvedSurfaceModule {
  return { kind: 'WORKSHOP', size: 'standard', contract };
}

export function buildSidebarStack(
  input: BuildSidebarStackInput,
): SidebarStackSlot[] {
  const {
    ctx,
    activityModules,
    communityModule,
    opportunityModule,
    partnerModule,
    workshopModule,
    eventModule,
  } = input;

  const collapseThreshold = 2;

  const slots: SidebarStackSlot[] = CANONICAL_SIDEBAR_STACK_ORDER.map(
    (slotId) => {
      let module: ResolvedSurfaceModule | null = null;
      let moduleCount = 0;

      switch (slotId) {
        case 'community_pulse':
          module = communityModule ? toCommunityResolved(communityModule) : null;
          moduleCount = communityModule ? 1 : 0;
          break;
        case 'activity_module':
          moduleCount = activityModules.length;
          module = null;
          break;
        case 'opportunity_module':
          module = opportunityModule;
          moduleCount = opportunityModule ? 1 : 0;
          break;
        case 'workshop_module':
          module = workshopModule ? toWorkshopResolved(workshopModule) : null;
          moduleCount = workshopModule ? 1 : 0;
          break;
        case 'partner_module':
          module = partnerModule ? toPartnerResolved(partnerModule) : null;
          moduleCount = partnerModule ? 1 : 0;
          break;
        case 'event_module':
          module = eventModule;
          moduleCount = eventModule ? 1 : 0;
          break;
        case 'platform_module':
          module = { kind: 'PLATFORM', size: 'compact', moduleId: 'home_promotions' };
          moduleCount = 1;
          break;
        case 'sponsored_placeholder':
          module = { kind: 'PLATFORM', size: 'hero', moduleId: 'sponsored_placeholder' };
          moduleCount = 1;
          break;
        default:
          break;
      }

      const visibility = resolveSidebarSlotVisibility({
        ctx,
        slotId,
        hasModule: moduleCount > 0,
        moduleCount,
        collapseThreshold,
      });

      return { slotId, visibility, module };
    },
  );

  return slots;
}

export function flattenSidebarStackModules(
  stack: SidebarStackSlot[],
): ResolvedSurfaceModule[] {
  const out: ResolvedSurfaceModule[] = [];
  const seen = new Set<string>();

  for (const slot of stack) {
    if (slot.visibility === 'hide' || !slot.module) continue;
    if (slot.slotId === 'platform_module' || slot.slotId === 'sponsored_placeholder') {
      continue;
    }
    const key =
      slot.module.kind === 'PLATFORM'
        ? slot.module.moduleId
        : 'contract' in slot.module
          ? (slot.module as { contract: { id: string } }).contract.id
          : slot.slotId;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(slot.module);
  }

  return out;
}
