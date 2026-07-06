/**
 * Mobile surface mapping — desktop sidebar slots → mobile targets (Phase 3F).
 * Single source via SurfaceRouter; no duplicated resolver logic.
 */

import { ACTIVITY_CARD_MOBILE_INSERTION } from '@/lib/discovery/activity-cards/activity-card-insertion-planner';
import type {
  MobileSurfaceMapping,
  ResolvedSurfaceModule,
  SidebarStackSlot,
  SidebarStackSlotId,
} from './surface-contract';
import { resolveMobileSurfaceInserts } from './resolve-mobile-surface-inserts';

function moduleKey(module: ResolvedSurfaceModule): string {
  switch (module.kind) {
    case 'PLATFORM':
      return module.moduleId;
    case 'ACTIVITY':
    case 'OPPORTUNITY':
    case 'PARTNER':
    case 'COMMUNITY':
    case 'WORKSHOP':
    case 'EVENT':
    case 'ECONOMY_OPPORTUNITY':
      return module.contract.id;
    default:
      return '';
  }
}

function mobileTargetForSlot(
  slotId: SidebarStackSlotId,
  module: ResolvedSurfaceModule,
): MobileSurfaceMapping['mobileTarget'] {
  switch (slotId) {
    case 'community_pulse':
      return module.kind === 'COMMUNITY' ? 'feed_insert' : 'feed_insert';
    case 'activity_module':
      return 'activity_card';
    case 'opportunity_module':
    case 'workshop_module':
    case 'partner_module':
    case 'event_module':
      return 'activity_card';
    case 'platform_module':
      return 'feed_insert';
    default:
      return 'profile_module';
  }
}

export type BuildMobileSurfaceMappingInput = {
  sidebarStack: SidebarStackSlot[];
  profileModules: ResolvedSurfaceModule[];
  economyMobileModules?: ResolvedSurfaceModule[];
};

export function buildMobileSurfaceMapping(
  input: BuildMobileSurfaceMappingInput,
): MobileSurfaceMapping[] {
  const mappings: MobileSurfaceMapping[] = [];
  const usedKeys = new Set<string>();

  const mobileCandidates: ResolvedSurfaceModule[] = [];

  for (const slot of input.sidebarStack) {
    if (slot.visibility === 'hide' || !slot.module) continue;
    if (slot.slotId === 'platform_module' || slot.slotId === 'sponsored_placeholder') {
      continue;
    }

    const key = moduleKey(slot.module);
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);

    const mobileTarget = mobileTargetForSlot(slot.slotId, slot.module);

    if (mobileTarget === 'activity_card' || mobileTarget === 'feed_insert') {
      mobileCandidates.push(slot.module);
    }

    mappings.push({
      slotId: slot.slotId,
      module: slot.module,
      mobileTarget,
    });
  }

  const activityCardModules = [
    ...mobileCandidates.filter(
      (m) =>
        m.kind === 'ACTIVITY' ||
        m.kind === 'OPPORTUNITY' ||
        m.kind === 'WORKSHOP' ||
        m.kind === 'PARTNER' ||
        m.kind === 'EVENT' ||
        m.kind === 'ECONOMY_OPPORTUNITY',
    ),
    ...(input.economyMobileModules ?? []),
  ];

  const inserts = resolveMobileSurfaceInserts({
    modules: activityCardModules,
    mobileSlots: ACTIVITY_CARD_MOBILE_INSERTION,
    maxInserts: 2,
  });

  for (const insert of inserts) {
    const mapping = mappings.find(
      (m) => m.module && moduleKey(m.module) === moduleKey(insert.module),
    );
    if (mapping) {
      mapping.afterSaleIndex = insert.afterSaleIndex;
    }
  }

  for (const mod of input.profileModules) {
    const key = moduleKey(mod);
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);
    mappings.push({
      slotId: 'activity_module',
      module: mod,
      mobileTarget: 'profile_module',
    });
  }

  return mappings;
}

export function getMobileActivityCardModules(
  mapping: MobileSurfaceMapping[],
): ResolvedSurfaceModule[] {
  return mapping
    .filter((m) => m.mobileTarget === 'activity_card' && m.module)
    .map((m) => m.module!);
}
