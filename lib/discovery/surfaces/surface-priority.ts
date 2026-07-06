/**
 * Surface module priority — stack order within each target (no ranking engine).
 */

import type { SurfaceKind } from './surface-contract';
import type { ResolvedSurfaceModule } from './surface-contract';

/** Base priority by canonical surface kind (higher = earlier in stack). */
export const SURFACE_KIND_BASE_PRIORITY: Record<SurfaceKind, number> = {
  ACTIVITY: 90,
  OPPORTUNITY: 75,
  ECONOMY_OPPORTUNITY: 76,
  WORKSHOP: 73,
  EVENT: 70,
  PARTNER: 65,
  COMMUNITY: 50,
  PLATFORM: 40,
};

/** Desktop right sidebar anchor order (3D SIDEBAR_ARCHITECTURE slots). */
export const DESKTOP_SIDEBAR_SURFACE_ANCHOR: Record<SurfaceKind, number> = {
  ACTIVITY: 80,
  OPPORTUNITY: 75,
  ECONOMY_OPPORTUNITY: 76,
  WORKSHOP: 74,
  EVENT: 72,
  PARTNER: 70,
  COMMUNITY: 60,
  PLATFORM: 50,
};

export function compareSurfaceModules(
  a: ResolvedSurfaceModule,
  b: ResolvedSurfaceModule,
): number {
  const kindDelta =
    DESKTOP_SIDEBAR_SURFACE_ANCHOR[b.kind] -
    DESKTOP_SIDEBAR_SURFACE_ANCHOR[a.kind];
  if (kindDelta !== 0) return kindDelta;

  const scoreA = modulePriorityScore(a);
  const scoreB = modulePriorityScore(b);
  if (scoreB !== scoreA) return scoreB - scoreA;

  return moduleStableId(a).localeCompare(moduleStableId(b));
}

function modulePriorityScore(module: ResolvedSurfaceModule): number {
  switch (module.kind) {
    case 'ACTIVITY':
      return priorityFromLabel(module.contract.priority);
    case 'OPPORTUNITY':
    case 'PARTNER':
      return module.contract.priority;
    case 'ECONOMY_OPPORTUNITY':
      return module.contract.effectivePriority;
    case 'COMMUNITY':
    case 'WORKSHOP':
    case 'EVENT':
      return module.contract.priority;
    case 'PLATFORM':
      return 0;
    default:
      return 0;
  }
}

function priorityFromLabel(
  label: 'critical' | 'high' | 'normal' | 'low' | undefined,
): number {
  switch (label) {
    case 'critical':
      return 100;
    case 'high':
      return 80;
    case 'normal':
      return 60;
    case 'low':
      return 40;
    default:
      return 50;
  }
}

function moduleStableId(module: ResolvedSurfaceModule): string {
  switch (module.kind) {
    case 'ACTIVITY':
      return module.contract.id;
    case 'OPPORTUNITY':
    case 'PARTNER':
    case 'ECONOMY_OPPORTUNITY':
      return module.contract.id;
    case 'COMMUNITY':
    case 'WORKSHOP':
    case 'EVENT':
      return module.contract.id;
    case 'PLATFORM':
      return module.moduleId;
    default:
      return '';
  }
}

export function sortSurfaceModules(
  modules: ResolvedSurfaceModule[],
): ResolvedSurfaceModule[] {
  return [...modules].sort(compareSurfaceModules);
}
