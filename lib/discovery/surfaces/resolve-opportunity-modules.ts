/**
 * Opportunity module registry + eligibility — Phase 3E.
 * Contracts only; copy via surfaces.opportunities.* i18n keys.
 */

import type { ActivityCardType } from '@/lib/discovery/activity-cards/activity-card-contract';
import type {
  OpportunityModuleContract,
  OpportunityModuleId,
} from './surface-contract';
import {
  OPPORTUNITY_MODULE_IDS,
  opportunityInstanceId,
  OPPORTUNITY_STACK_MODULE_IDS,
  OPPORTUNITY_STACK_COOLDOWN_DAYS,
  PARTNER_MODULE_IDS,
} from './surface-contract';
import type { SurfaceOpportunityEligibilityInput } from './surface-context';
import type { OpportunityCooldownState } from './surface-context';

export type OpportunityModuleDefinition = {
  moduleId: OpportunityModuleId;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: OpportunityModuleContract['ctaKind'];
  linkedActivityType?: ActivityCardType;
  isEligible: (input: SurfaceOpportunityEligibilityInput) => boolean;
  eligibilityReason: (input: SurfaceOpportunityEligibilityInput) => string;
};

const OPPORTUNITY_KEY_PREFIX = 'surfaces.opportunities';

export const OPPORTUNITY_MODULE_REGISTRY: Record<
  OpportunityModuleId,
  OpportunityModuleDefinition
> = {
  BECOME_PARTNER: {
    moduleId: 'BECOME_PARTNER',
    priority: 88,
    titleKey: `${OPPORTUNITY_KEY_PREFIX}.becomePartner.title`,
    descriptionKey: `${OPPORTUNITY_KEY_PREFIX}.becomePartner.description`,
    icon: 'Store',
    actionLabelKey: `${OPPORTUNITY_KEY_PREFIX}.becomePartner.action`,
    actionHref: '/sell/new',
    dismissible: true,
    cooldownDays: 14,
    ctaKind: 'open_create_flow',
    linkedActivityType: 'UPLOAD_FIRST_LISTING',
    isEligible: (i) =>
      i.loggedIn &&
      (!i.hasSellerRole || (i.hasSellerRole && i.productCount === 0)),
    eligibilityReason: () => 'partner_onboarding',
  },
  BECOME_AMBASSADOR: {
    moduleId: 'BECOME_AMBASSADOR',
    priority: 62,
    titleKey: `${OPPORTUNITY_KEY_PREFIX}.becomeAmbassador.title`,
    descriptionKey: `${OPPORTUNITY_KEY_PREFIX}.becomeAmbassador.description`,
    icon: 'Megaphone',
    actionLabelKey: `${OPPORTUNITY_KEY_PREFIX}.becomeAmbassador.action`,
    actionHref: '/welkom',
    dismissible: true,
    cooldownDays: 14,
    ctaKind: 'navigate',
    linkedActivityType: 'INVITE_FRIEND',
    isEligible: (i) =>
      i.loggedIn &&
      i.accountAgeDays >= 7 &&
      (i.completenessPercent >= 50 || i.productCount + i.dishCount >= 1),
    eligibilityReason: () => 'ambassador_ready',
  },
  HOST_WORKSHOP: {
    moduleId: 'HOST_WORKSHOP',
    priority: 68,
    titleKey: `${OPPORTUNITY_KEY_PREFIX}.hostWorkshop.title`,
    descriptionKey: `${OPPORTUNITY_KEY_PREFIX}.hostWorkshop.description`,
    icon: 'GraduationCap',
    actionLabelKey: `${OPPORTUNITY_KEY_PREFIX}.hostWorkshop.action`,
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
    eligibilityReason: () => 'host_workshop',
  },
  INVITE_LOCAL_BUSINESS: {
    moduleId: 'INVITE_LOCAL_BUSINESS',
    priority: 58,
    titleKey: `${OPPORTUNITY_KEY_PREFIX}.inviteLocalBusiness.title`,
    descriptionKey: `${OPPORTUNITY_KEY_PREFIX}.inviteLocalBusiness.description`,
    icon: 'Building2',
    actionLabelKey: `${OPPORTUNITY_KEY_PREFIX}.inviteLocalBusiness.action`,
    actionHref: '/welkom',
    dismissible: true,
    cooldownDays: 30,
    ctaKind: 'open_share_sheet',
    isEligible: (i) =>
      i.loggedIn && i.hasSellerRole && i.productCount >= 3,
    eligibilityReason: () => 'invite_business',
  },
  INVITE_SPORTS_CLUB: {
    moduleId: 'INVITE_SPORTS_CLUB',
    priority: 52,
    titleKey: `${OPPORTUNITY_KEY_PREFIX}.inviteSportsClub.title`,
    descriptionKey: `${OPPORTUNITY_KEY_PREFIX}.inviteSportsClub.description`,
    icon: 'Trophy',
    actionLabelKey: `${OPPORTUNITY_KEY_PREFIX}.inviteSportsClub.action`,
    actionHref: '/welkom',
    dismissible: true,
    cooldownDays: 30,
    ctaKind: 'open_share_sheet',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && (i.hasSportsClubInterest || i.dishCount > 0),
    eligibilityReason: () => 'invite_club',
  },
  SUPPORT_NEARBY: {
    moduleId: 'SUPPORT_NEARBY',
    priority: 82,
    titleKey: `${OPPORTUNITY_KEY_PREFIX}.supportNearby.title`,
    descriptionKey: `${OPPORTUNITY_KEY_PREFIX}.supportNearby.description`,
    icon: 'HandHeart',
    actionLabelKey: `${OPPORTUNITY_KEY_PREFIX}.supportNearby.action`,
    actionHref: '/?chip=sale',
    dismissible: true,
    cooldownDays: 7,
    ctaKind: 'navigate',
    linkedActivityType: 'NEARBY_HELP_REQUEST',
    isEligible: (i) =>
      i.loggedIn && i.hasLocation && i.nearbyRequestCount > 0,
    eligibilityReason: () => 'support_nearby',
  },
};

export type ResolveOpportunityModulesOptions = {
  input: SurfaceOpportunityEligibilityInput;
  cooldownState?: OpportunityCooldownState;
  now?: number;
  limit?: number;
  /** Activity types already assigned to feed — suppress linked opportunities. */
  reservedActivityTypes?: ActivityCardType[];
};

function isInCooldown(
  moduleId: OpportunityModuleId,
  state: OpportunityCooldownState | undefined,
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

export function resolveOpportunityModules(
  options: ResolveOpportunityModulesOptions,
): OpportunityModuleContract[] {
  const {
    input,
    cooldownState,
    now = Date.now(),
    limit = 6,
    reservedActivityTypes = [],
  } = options;

  if (!input.loggedIn) return [];

  const eligible: OpportunityModuleContract[] = [];

  for (const moduleId of OPPORTUNITY_MODULE_IDS) {
    const def = OPPORTUNITY_MODULE_REGISTRY[moduleId];
    if (!def.isEligible(input)) continue;

    if (
      def.linkedActivityType &&
      reservedActivityTypes.includes(def.linkedActivityType)
    ) {
      continue;
    }

    if (isInCooldown(moduleId, cooldownState, def.cooldownDays, now)) {
      continue;
    }

    eligible.push({
      id: opportunityInstanceId(moduleId, input.userId),
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

export function listOpportunityModuleDefinitions(): OpportunityModuleDefinition[] {
  return OPPORTUNITY_MODULE_IDS.map((id) => OPPORTUNITY_MODULE_REGISTRY[id]);
}

/** Max 1 opportunity for sidebar stack (excludes workshop + partner IDs). */
export function resolveOpportunityStackModule(
  options: ResolveOpportunityModulesOptions,
): OpportunityModuleContract | null {
  const all = resolveOpportunityModules({
    ...options,
    limit: 6,
  });

  const stack = all.filter((m) =>
    (OPPORTUNITY_STACK_MODULE_IDS as readonly string[]).includes(m.moduleId),
  );

  const top = stack[0];
  if (!top) return null;

  const cooldownDays = Math.max(top.cooldownDays, OPPORTUNITY_STACK_COOLDOWN_DAYS);
  const now = options.now ?? Date.now();
  const state = options.cooldownState?.[top.moduleId];
  if (state) {
    const ts = Math.max(
      state.dismissedAt ? Date.parse(state.dismissedAt) : 0,
      state.lastShownAt ? Date.parse(state.lastShownAt) : 0,
    );
    if (Number.isFinite(ts) && ts > 0 && now - ts < cooldownDays * 86_400_000) {
      return stack[1] ?? null;
    }
  }

  return top;
}

/** Max 1 partner module for partner stack slot. */
export function resolvePartnerStackModule(
  options: ResolveOpportunityModulesOptions,
): OpportunityModuleContract | null {
  const all = resolveOpportunityModules({ ...options, limit: 6 });
  return (
    all.find((m) =>
      (PARTNER_MODULE_IDS as readonly string[]).includes(m.moduleId),
    ) ?? null
  );
}
