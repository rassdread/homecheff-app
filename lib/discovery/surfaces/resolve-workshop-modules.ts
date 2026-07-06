/**
 * Workshop module resolver — no workshop ranking (Phase 3F).
 */

import type { ActivityCardType } from '@/lib/discovery/activity-cards/activity-card-contract';
import type {
  WorkshopModuleContract,
  WorkshopModuleId,
} from './surface-contract';
import { WORKSHOP_MODULE_IDS, workshopInstanceId } from './surface-contract';
import type { SurfaceWorkshopEligibilityInput } from './surface-context';
import type { WorkshopCooldownState } from './surface-context';

const KEY_PREFIX = 'surfaces.workshops';

export type WorkshopModuleDefinition = {
  moduleId: WorkshopModuleId;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: WorkshopModuleContract['ctaKind'];
  linkedActivityType?: ActivityCardType;
  isEligible: (input: SurfaceWorkshopEligibilityInput) => boolean;
};

export const WORKSHOP_MODULE_REGISTRY: Record<
  WorkshopModuleId,
  WorkshopModuleDefinition
> = {
  HOST_WORKSHOP: {
    moduleId: 'HOST_WORKSHOP',
    priority: 80,
    titleKey: `${KEY_PREFIX}.hostWorkshop.title`,
    descriptionKey: `${KEY_PREFIX}.hostWorkshop.description`,
    icon: 'GraduationCap',
    actionLabelKey: `${KEY_PREFIX}.hostWorkshop.action`,
    actionHref: '/sell/new',
    dismissible: true,
    cooldownDays: 14,
    ctaKind: 'open_create_flow',
    linkedActivityType: 'ADD_WORKSHOP',
    isEligible: (i) =>
      i.loggedIn &&
      i.hasSellerRole &&
      i.productCount > 0 &&
      !i.hasWorkshopListing,
  },
  UPCOMING_WORKSHOP: {
    moduleId: 'UPCOMING_WORKSHOP',
    priority: 75,
    titleKey: `${KEY_PREFIX}.upcomingWorkshop.title`,
    descriptionKey: `${KEY_PREFIX}.upcomingWorkshop.description`,
    icon: 'Calendar',
    actionLabelKey: `${KEY_PREFIX}.upcomingWorkshop.action`,
    actionHref: '/?chip=sale#homecheff-feed',
    dismissible: true,
    cooldownDays: 7,
    ctaKind: 'navigate',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.upcomingWorkshopCount >= 1,
  },
  NEARBY_WORKSHOP: {
    moduleId: 'NEARBY_WORKSHOP',
    priority: 72,
    titleKey: `${KEY_PREFIX}.nearbyWorkshop.title`,
    descriptionKey: `${KEY_PREFIX}.nearbyWorkshop.description`,
    icon: 'MapPin',
    actionLabelKey: `${KEY_PREFIX}.nearbyWorkshop.action`,
    actionHref: '/?chip=sale#homecheff-feed',
    dismissible: true,
    cooldownDays: 7,
    ctaKind: 'navigate',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.nearbyWorkshopCount >= 1,
  },
  WORKSHOP_WAITLIST: {
    moduleId: 'WORKSHOP_WAITLIST',
    priority: 60,
    titleKey: `${KEY_PREFIX}.workshopWaitlist.title`,
    descriptionKey: `${KEY_PREFIX}.workshopWaitlist.description`,
    icon: 'Clock',
    actionLabelKey: `${KEY_PREFIX}.workshopWaitlist.action`,
    actionHref: '/?chip=sale#homecheff-feed',
    dismissible: true,
    cooldownDays: 7,
    ctaKind: 'navigate',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.workshopWaitlistCount >= 1,
  },
};

function isInCooldown(
  moduleId: WorkshopModuleId,
  state: WorkshopCooldownState | undefined,
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

export type ResolveWorkshopModulesOptions = {
  input: SurfaceWorkshopEligibilityInput;
  cooldownState?: WorkshopCooldownState;
  now?: number;
  limit?: number;
  reservedActivityTypes?: ActivityCardType[];
};

export function resolveWorkshopModules(
  options: ResolveWorkshopModulesOptions,
): WorkshopModuleContract[] {
  const {
    input,
    cooldownState,
    now = Date.now(),
    limit = 1,
    reservedActivityTypes = [],
  } = options;

  if (!input.loggedIn) return [];

  const eligible: WorkshopModuleContract[] = [];

  for (const moduleId of WORKSHOP_MODULE_IDS) {
    const def = WORKSHOP_MODULE_REGISTRY[moduleId];
    if (!def.isEligible(input)) continue;

    if (
      def.linkedActivityType &&
      reservedActivityTypes.includes(def.linkedActivityType)
    ) {
      continue;
    }

    if (isInCooldown(moduleId, cooldownState, def.cooldownDays, now)) continue;

    eligible.push({
      id: workshopInstanceId(moduleId, input.userId),
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
      linkedActivityType: def.linkedActivityType,
    });
  }

  return eligible
    .sort((a, b) => b.priority - a.priority || a.moduleId.localeCompare(b.moduleId))
    .slice(0, limit);
}
