/**
 * Surface visibility rules — guest/auth, per-target caps (no personalization engine).
 */

import type { SurfaceKind, SurfaceTarget } from './surface-contract';
import type { SurfaceRouterContext } from './surface-context';

export type SurfaceVisibilityRule = {
  kind: SurfaceKind;
  targets: SurfaceTarget[];
  guestVisible: boolean | 'teaser';
  maxPerTarget: Partial<Record<SurfaceTarget, number>>;
};

export const SURFACE_VISIBILITY_RULES: SurfaceVisibilityRule[] = [
  {
    kind: 'ACTIVITY',
    targets: ['desktop_right_sidebar', 'mobile_insert', 'profile_owner'],
    guestVisible: false,
    maxPerTarget: {
      desktop_right_sidebar: 3,
      mobile_insert: 2,
      profile_owner: 4,
    },
  },
  {
    kind: 'OPPORTUNITY',
    targets: ['desktop_right_sidebar', 'mobile_insert', 'profile_owner'],
    guestVisible: false,
    maxPerTarget: {
      desktop_right_sidebar: 1,
      mobile_insert: 1,
      profile_owner: 2,
    },
  },
  {
    kind: 'ECONOMY_OPPORTUNITY',
    targets: ['desktop_right_sidebar', 'mobile_insert', 'profile_owner'],
    guestVisible: false,
    maxPerTarget: {
      desktop_right_sidebar: 1,
      mobile_insert: 1,
      profile_owner: 3,
    },
  },
  {
    kind: 'PARTNER',
    targets: ['desktop_right_sidebar', 'profile_owner'],
    guestVisible: false,
    maxPerTarget: {
      desktop_right_sidebar: 1,
      profile_owner: 1,
    },
  },
  {
    kind: 'WORKSHOP',
    targets: ['desktop_right_sidebar', 'mobile_insert', 'profile_owner'],
    guestVisible: false,
    maxPerTarget: {
      desktop_right_sidebar: 1,
      mobile_insert: 1,
      profile_owner: 1,
    },
  },
  {
    kind: 'COMMUNITY',
    targets: ['desktop_right_sidebar', 'mobile_insert'],
    guestVisible: true,
    maxPerTarget: {
      desktop_right_sidebar: 1,
      mobile_insert: 1,
    },
  },
  {
    kind: 'EVENT',
    targets: ['desktop_right_sidebar', 'mobile_insert', 'notification_future'],
    guestVisible: false,
    maxPerTarget: {
      desktop_right_sidebar: 1,
      mobile_insert: 1,
      notification_future: 1,
    },
  },
  {
    kind: 'PLATFORM',
    targets: ['desktop_right_sidebar'],
    guestVisible: true,
    maxPerTarget: { desktop_right_sidebar: 2 },
  },
];

export function getVisibilityRule(
  kind: SurfaceKind,
): SurfaceVisibilityRule | undefined {
  return SURFACE_VISIBILITY_RULES.find((r) => r.kind === kind);
}

export function isSurfaceKindVisibleForGuest(kind: SurfaceKind): boolean {
  const rule = getVisibilityRule(kind);
  if (!rule) return false;
  return rule.guestVisible === true || rule.guestVisible === 'teaser';
}

export function maxModulesForTarget(
  kind: SurfaceKind,
  target: SurfaceTarget,
): number {
  const rule = getVisibilityRule(kind);
  return rule?.maxPerTarget[target] ?? 0;
}

export function canShowSurfaceKind(
  ctx: SurfaceRouterContext,
  kind: SurfaceKind,
): boolean {
  if (ctx.viewer.loggedIn) return true;
  return isSurfaceKindVisibleForGuest(kind);
}

export function filterModulesForTarget<T extends { kind: SurfaceKind }>(
  modules: T[],
  target: SurfaceTarget,
  ctx: SurfaceRouterContext,
): T[] {
  const counts: Partial<Record<SurfaceKind, number>> = {};
  const out: T[] = [];

  for (const mod of modules) {
    if (!canShowSurfaceKind(ctx, mod.kind)) continue;
    const max = maxModulesForTarget(mod.kind, target);
    if (max <= 0) continue;
    const used = counts[mod.kind] ?? 0;
    if (used >= max) continue;
    counts[mod.kind] = used + 1;
    out.push(mod);
  }

  return out;
}
