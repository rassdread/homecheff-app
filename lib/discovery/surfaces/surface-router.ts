/**
 * SurfaceRouter — orchestrates non-organic surfaces (Phase 3E + 3F stack).
 */

import type { ActivityCardContract } from '@/lib/discovery/activity-cards/activity-card-contract';
import {
  ACTIVITY_CARD_SESSION_MAX,
  ACTIVITY_CARD_VISIBLE_MAX,
  resolveActivityCardContracts,
} from '@/lib/discovery/activity-cards/resolve-activity-card-contracts';
import { ACTIVITY_CARD_SIDEBAR_PLACEMENT } from '@/lib/discovery/activity-cards/activity-card-sidebar-integration';
import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import type { ActivityCardType } from '@/lib/discovery/activity-cards/activity-card-contract';
import type {
  OpportunityModuleContract,
  ResolvedActivityModule,
  ResolvedOpportunityModule,
  ResolvedSurfaceModule,
  ResolvedSurfacePlan,
} from './surface-contract';
import {
  OPPORTUNITY_STACK_COOLDOWN_DAYS,
  SURFACE_ROUTER_SPEC_VERSION,
} from './surface-contract';
import type { SurfaceRouterContext } from './surface-context';
import {
  resolveOpportunityStackModule,
  resolvePartnerStackModule,
  resolveOpportunityModules,
} from './resolve-opportunity-modules';
import { resolveCommunityModules } from './resolve-community-modules';
import { resolveWorkshopModules } from './resolve-workshop-modules';
import { buildSidebarStack, flattenSidebarStackModules } from './build-sidebar-stack';
import { buildMobileSurfaceMapping } from './resolve-mobile-surface-mapping';
import { buildProfileStack, flattenProfileStack } from './resolve-profile-stack';
import { resolveMobileSurfaceInserts } from './resolve-mobile-surface-inserts';
import { ACTIVITY_CARD_MOBILE_INSERTION } from '@/lib/discovery/activity-cards/activity-card-insertion-planner';
import { sortSurfaceModules } from './surface-priority';
import { filterModulesForTarget, maxModulesForTarget } from './surface-visibility';
import { resolveOpportunityEconomySurfaces } from './resolve-opportunity-economy-surfaces';
import { toEconomyOpportunityModule } from './map-economy-opportunity-surface';
import { buildPrioritizedMobileInserts } from './resolve-mobile-opportunity-inserts';

export type SurfaceRouterInput = SurfaceRouterContext;

export type SurfaceRouterOptions = {
  activityContracts?: ActivityCardContract[];
};

function contractToFeedItem(
  contract: ActivityCardContract,
): ActivityCardFeedItem {
  return {
    id: contract.id,
    type: contract.type,
    category: mapTypeToCategory(contract.type),
    titleKey: contract.titleKey,
    descriptionKey: contract.descriptionKey,
    ctaKey: contract.actionLabelKey,
    ctaKind: contract.ctaKind,
    ctaHref: contract.actionHref,
    priority: priorityLabel(contract.priority),
    icon: contract.icon,
    dismissible: contract.dismissible,
    cooldownDays: contract.cooldownDays,
  };
}

function priorityLabel(score: number): ActivityCardFeedItem['priority'] {
  if (score >= 95) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 55) return 'normal';
  return 'low';
}

function mapTypeToCategory(
  type: ActivityCardType,
): ActivityCardFeedItem['category'] {
  switch (type) {
    case 'PROFILE_COMPLETION':
    case 'COMPLETE_WORKSPACE':
    case 'VERIFY_ACCOUNT':
      return 'profile_completion';
    case 'REQUEST_REVIEW':
      return 'trust_activation';
    case 'SHARE_QR':
    case 'INVITE_FRIEND':
      return 'social_activation';
    case 'UPLOAD_FIRST_LISTING':
    case 'ADD_WORKSHOP':
      return 'marketplace_activation';
    case 'UPLOAD_FIRST_INSPIRATION':
      return 'community_activation';
    case 'BECOME_COURIER':
      return 'delivery_activation';
    case 'NEARBY_HELP_REQUEST':
      return 'local_activation';
    default:
      return 'community_activation';
  }
}

function toActivityModule(
  item: ActivityCardFeedItem,
  size: 'standard' | 'compact' = 'standard',
): ResolvedActivityModule {
  return { kind: 'ACTIVITY', size, contract: item };
}

function toLegacyOpportunityModule(
  contract: OpportunityModuleContract,
): ResolvedOpportunityModule {
  return { kind: 'OPPORTUNITY', size: 'standard', contract };
}

function buildEventModule(
  ctx: SurfaceRouterContext,
): ResolvedSurfaceModule | null {
  const i = ctx.opportunityEligibility;
  if (!i.loggedIn || !i.hasLocation || i.nearbyWorkshopCount <= 0) {
    return null;
  }
  return {
    kind: 'EVENT',
    size: 'standard',
    contract: {
      id: `event:WORKSHOP_NEARBY:${i.userId}`,
      moduleId: 'WORKSHOP_NEARBY',
      priority: 72,
      titleKey: 'surfaces.events.workshopNearby.title',
      descriptionKey: 'surfaces.events.workshopNearby.description',
      icon: 'Calendar',
      actionLabelKey: 'surfaces.events.workshopNearby.action',
      actionHref: '/?chip=sale#homecheff-feed',
      dismissible: true,
      cooldownDays: 7,
      ctaKind: 'navigate',
    },
  };
}

function communityEligibility(ctx: SurfaceRouterContext) {
  const o = ctx.opportunityEligibility;
  return {
    ...ctx.activityCardEligibility,
    accountAgeDays: o.accountAgeDays,
    activeNeighboursCount: o.activeNeighboursCount ?? 0,
    newMakersNearbyCount: o.newMakersNearbyCount ?? 0,
    nearbyWorkshopCount: o.nearbyWorkshopCount,
    completedDealCount: o.completedDealCount ?? 0,
  };
}

function workshopEligibility(ctx: SurfaceRouterContext) {
  const o = ctx.opportunityEligibility;
  return {
    ...ctx.activityCardEligibility,
    nearbyWorkshopCount: o.nearbyWorkshopCount,
    upcomingWorkshopCount: o.upcomingWorkshopCount ?? 0,
    workshopWaitlistCount: o.workshopWaitlistCount ?? 0,
  };
}

export function resolveSurfaces(
  ctx: SurfaceRouterInput,
  options: SurfaceRouterOptions = {},
): ResolvedSurfacePlan {
  const activityContracts =
    options.activityContracts ??
    resolveActivityCardContracts({
      input: ctx.activityCardEligibility,
      cooldownState: ctx.activityCooldownState,
      now: ctx.now,
      limit: 8,
    });

  const activityItems = activityContracts.map(contractToFeedItem);

  const feedReserved =
    ctx.feedReservedActivityTypes ??
    activityItems
      .slice(0, ACTIVITY_CARD_SESSION_MAX)
      .map((c) => c.type)
      .filter((t): t is ActivityCardType => Boolean(t));

  const oppOptions = {
    input: ctx.opportunityEligibility,
    cooldownState: ctx.opportunityCooldownState,
    now: ctx.now,
    reservedActivityTypes: feedReserved,
  };

  const allOpportunities = resolveOpportunityModules({ ...oppOptions, limit: 6 });
  const economySurfaces = resolveOpportunityEconomySurfaces(ctx);
  const economyDesktopModule = economySurfaces.desktopSidebar
    ? toEconomyOpportunityModule(economySurfaces.desktopSidebar)
    : null;

  const legacyOpportunity = resolveOpportunityStackModule(oppOptions);
  const opportunityModule: ResolvedSurfaceModule | null =
    economyDesktopModule ??
    (legacyOpportunity ? toLegacyOpportunityModule(legacyOpportunity) : null);

  const legacyPartner = resolvePartnerStackModule(oppOptions);
  const partnerModule =
    economyDesktopModule &&
    (economySurfaces.desktopSidebar?.opportunityType ===
      'LOCAL_BUSINESS_INVITER' ||
      economySurfaces.desktopSidebar?.opportunityType === 'SPORTS_CLUB_INVITER')
      ? null
      : legacyPartner;

  const communityModules = resolveCommunityModules({
    input: communityEligibility(ctx),
    cooldownState: ctx.communityCooldownState,
    now: ctx.now,
    limit: 1,
  });

  const workshopModule =
    resolveWorkshopModules({
      input: workshopEligibility(ctx),
      cooldownState: ctx.workshopCooldownState,
      now: ctx.now,
      limit: 1,
      reservedActivityTypes: feedReserved,
    })[0] ?? null;

  const feedActivity = activityItems.slice(0, ACTIVITY_CARD_SESSION_MAX);
  const sidebarActivityPool = activityItems.filter(
    (c) => !feedActivity.some((f) => f.type === c.type),
  );

  const activityModules = sidebarActivityPool
    .slice(0, ACTIVITY_CARD_SIDEBAR_PLACEMENT.maxStacked)
    .map((c) => toActivityModule(c));

  const eventModule = buildEventModule(ctx);

  const sidebarStack = buildSidebarStack({
    ctx,
    activityModules,
    communityModule: communityModules[0] ?? null,
    opportunityModule,
    partnerModule,
    workshopModule,
    eventModule,
  });

  const otherModules = flattenSidebarStackModules(sidebarStack);
  const desktopRightSidebar = sortSurfaceModules(
    filterModulesForTarget(
      [...activityModules, ...otherModules],
      'desktop_right_sidebar',
      ctx,
    ),
  );

  const economyProfileModules = economySurfaces.profileModules.map((c) =>
    toEconomyOpportunityModule(c, 'compact'),
  );

  const profileStack = buildProfileStack({
    ctx,
    activityItems,
    opportunities: allOpportunities,
    communityModules,
    economyProfileModules,
  });

  const profileModules = flattenProfileStack(profileStack);

  const mobileMapping = buildMobileSurfaceMapping({
    sidebarStack,
    profileModules,
    economyMobileModules: economySurfaces.mobileInserts.map((c) =>
      toEconomyOpportunityModule(c),
    ),
  });

  const activityMobileCandidates = mobileMapping
    .filter((m) => m.mobileTarget === 'activity_card' && m.module)
    .map((m) => m.module!)
    .filter((m) => m.kind === 'ACTIVITY');

  const opportunityMobileCandidates = [
    ...economySurfaces.mobileInserts.map((c) => toEconomyOpportunityModule(c)),
    ...mobileMapping
      .filter((m) => m.mobileTarget === 'activity_card' && m.module)
      .map((m) => m.module!)
      .filter(
        (m) =>
          m.kind === 'OPPORTUNITY' ||
          m.kind === 'PARTNER' ||
          m.kind === 'ECONOMY_OPPORTUNITY',
      ),
  ];

  const prioritizedMobile = buildPrioritizedMobileInserts({
    activityModules: activityMobileCandidates,
    opportunityModules: opportunityMobileCandidates.slice(0, 1),
    mobileSlots: ACTIVITY_CARD_MOBILE_INSERTION,
    maxActivityInserts: maxModulesForTarget('ACTIVITY', 'mobile_insert'),
    maxOpportunityInserts: 1,
  });

  const mobileInserts = prioritizedMobile.map(({ afterSaleIndex, module }) => ({
    afterSaleIndex,
    module,
  }));

  const notificationsFuture = eventModule
    ? filterModulesForTarget([eventModule], 'notification_future', ctx)
    : [];

  return {
    specVersion: SURFACE_ROUTER_SPEC_VERSION,
    desktopRightSidebar,
    sidebarStack,
    mobileInserts,
    mobileMapping,
    profileModules,
    profileStack,
    notificationsFuture,
    opportunityEconomy: economySurfaces,
    meta: {
      activitySidebarMaxStacked: ACTIVITY_CARD_SIDEBAR_PLACEMENT.maxStacked,
      activitySidebarCollapseThreshold:
        ACTIVITY_CARD_SIDEBAR_PLACEMENT.collapseThreshold,
      opportunityMaxVisible: maxModulesForTarget(
        'OPPORTUNITY',
        'desktop_right_sidebar',
      ),
      opportunityCooldownDays: OPPORTUNITY_STACK_COOLDOWN_DAYS,
      activityFeedMaxSession: ACTIVITY_CARD_SESSION_MAX,
      activityFeedMaxVisible: ACTIVITY_CARD_VISIBLE_MAX,
    },
  };
}

export function emptySurfacePlan(): ResolvedSurfacePlan {
  return {
    specVersion: SURFACE_ROUTER_SPEC_VERSION,
    desktopRightSidebar: [],
    sidebarStack: [],
    mobileInserts: [],
    mobileMapping: [],
    profileModules: [],
    profileStack: [],
    notificationsFuture: [],
    opportunityEconomy: {
      desktopSidebar: null,
      mobileInserts: [],
      profileModules: [],
    },
    meta: {
      activitySidebarMaxStacked: ACTIVITY_CARD_SIDEBAR_PLACEMENT.maxStacked,
      activitySidebarCollapseThreshold:
        ACTIVITY_CARD_SIDEBAR_PLACEMENT.collapseThreshold,
      opportunityMaxVisible: 1,
      opportunityCooldownDays: OPPORTUNITY_STACK_COOLDOWN_DAYS,
      activityFeedMaxSession: ACTIVITY_CARD_SESSION_MAX,
      activityFeedMaxVisible: ACTIVITY_CARD_VISIBLE_MAX,
    },
  };
}
