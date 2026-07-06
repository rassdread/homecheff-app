/**
 * Community module resolver — contracts only (Phase 3F).
 */

import type {
  CommunityModuleContract,
  CommunityModuleId,
} from './surface-contract';
import {
  COMMUNITY_MODULE_IDS,
  communityInstanceId,
} from './surface-contract';
import type { SurfaceCommunityEligibilityInput } from './surface-context';
import type { CommunityCooldownState } from './surface-context';

const KEY_PREFIX = 'surfaces.community';

export type CommunityModuleDefinition = {
  moduleId: CommunityModuleId;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: CommunityModuleContract['ctaKind'];
  isEligible: (input: SurfaceCommunityEligibilityInput) => boolean;
};

export const COMMUNITY_MODULE_REGISTRY: Record<
  CommunityModuleId,
  CommunityModuleDefinition
> = {
  PEOPLE_NEARBY: {
    moduleId: 'PEOPLE_NEARBY',
    priority: 70,
    titleKey: `${KEY_PREFIX}.peopleNearby.title`,
    descriptionKey: `${KEY_PREFIX}.peopleNearby.description`,
    icon: 'Users',
    actionLabelKey: `${KEY_PREFIX}.peopleNearby.action`,
    actionHref: '/?chip=sale#homecheff-feed',
    dismissible: true,
    cooldownDays: 7,
    ctaKind: 'navigate',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.activeNeighboursCount >= 3,
  },
  NEW_MAKERS_NEARBY: {
    moduleId: 'NEW_MAKERS_NEARBY',
    priority: 65,
    titleKey: `${KEY_PREFIX}.newMakersNearby.title`,
    descriptionKey: `${KEY_PREFIX}.newMakersNearby.description`,
    icon: 'Sparkles',
    actionLabelKey: `${KEY_PREFIX}.newMakersNearby.action`,
    actionHref: '/?chip=sale#homecheff-feed',
    dismissible: true,
    cooldownDays: 7,
    ctaKind: 'navigate',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.newMakersNearbyCount >= 1,
  },
  NEW_WORKSHOPS_NEARBY: {
    moduleId: 'NEW_WORKSHOPS_NEARBY',
    priority: 68,
    titleKey: `${KEY_PREFIX}.newWorkshopsNearby.title`,
    descriptionKey: `${KEY_PREFIX}.newWorkshopsNearby.description`,
    icon: 'GraduationCap',
    actionLabelKey: `${KEY_PREFIX}.newWorkshopsNearby.action`,
    actionHref: '/?chip=sale#homecheff-feed',
    dismissible: true,
    cooldownDays: 7,
    ctaKind: 'navigate',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.nearbyWorkshopCount >= 1,
  },
  LOCAL_GROWTH_UPDATE: {
    moduleId: 'LOCAL_GROWTH_UPDATE',
    priority: 55,
    titleKey: `${KEY_PREFIX}.localGrowthUpdate.title`,
    descriptionKey: `${KEY_PREFIX}.localGrowthUpdate.description`,
    icon: 'TrendingUp',
    actionLabelKey: `${KEY_PREFIX}.localGrowthUpdate.action`,
    actionHref: '/faq',
    dismissible: true,
    cooldownDays: 14,
    ctaKind: 'navigate',
    isEligible: (i) =>
      i.loggedIn &&
      i.hasLocation &&
      i.newMakersNearbyCount + i.nearbyWorkshopCount >= 2,
  },
  COMMUNITY_MILESTONE: {
    moduleId: 'COMMUNITY_MILESTONE',
    priority: 50,
    titleKey: `${KEY_PREFIX}.communityMilestone.title`,
    descriptionKey: `${KEY_PREFIX}.communityMilestone.description`,
    icon: 'Award',
    actionLabelKey: `${KEY_PREFIX}.communityMilestone.action`,
    actionHref: '/profile',
    dismissible: true,
    cooldownDays: 14,
    ctaKind: 'navigate',
    isEligible: (i) =>
      i.loggedIn &&
      (i.completedDealCount >= 1 || i.accountAgeDays >= 30),
  },
};

function isInCooldown(
  moduleId: CommunityModuleId,
  state: CommunityCooldownState | undefined,
  cooldownDays: number,
  now: number,
): boolean {
  const entry = state?.[moduleId];
  if (!entry) return false;
  const ts = Math.max(
    entry.dismissedAt ? Date.parse(entry.dismissedAt) : 0,
    entry.lastShownAt ? Date.parse(entry.lastShownAt) : 0,
  );
  if (!Number.isFinite(ts) || ts <= 0) return false;
  return now - ts < cooldownDays * 86_400_000;
}

export type ResolveCommunityModulesOptions = {
  input: SurfaceCommunityEligibilityInput;
  cooldownState?: CommunityCooldownState;
  now?: number;
  limit?: number;
};

export function resolveCommunityModules(
  options: ResolveCommunityModulesOptions,
): CommunityModuleContract[] {
  const { input, cooldownState, now = Date.now(), limit = 1 } = options;
  if (!input.loggedIn) return [];

  const eligible: CommunityModuleContract[] = [];

  for (const moduleId of COMMUNITY_MODULE_IDS) {
    const def = COMMUNITY_MODULE_REGISTRY[moduleId];
    if (!def.isEligible(input)) continue;
    if (isInCooldown(moduleId, cooldownState, def.cooldownDays, now)) continue;

    eligible.push({
      id: communityInstanceId(moduleId, input.userId),
      moduleId: def.moduleId,
      priority: def.priority,
      titleKey: def.titleKey,
      descriptionKey: def.descriptionKey,
      icon: def.icon,
      actionLabelKey: def.actionLabelKey,
      actionHref: def.actionHref,
      dismissible: def.dismissible,
      cooldownDays: def.cooldownDays,
      ctaKind: def.ctaKind,
    });
  }

  return eligible
    .sort((a, b) => b.priority - a.priority || a.moduleId.localeCompare(b.moduleId))
    .slice(0, limit);
}
