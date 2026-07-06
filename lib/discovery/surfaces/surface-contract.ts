/**
 * Surface module contracts — Phase 3E.
 * Non-organic surfaces only; no ranking or sponsored inventory.
 */

import type { ActivityCardCtaKind } from '@/lib/discovery/activity-cards/activity-card-types';
import type { ActivityCardFeedItem } from '@/lib/discovery/activity-cards/activity-card-types';
import type { ActivityCardType } from '@/lib/discovery/activity-cards/activity-card-contract';
import type {
  EconomyOpportunitySurfaceContract,
  OpportunityEconomySurfacePlan,
} from './map-economy-opportunity-surface';
import type { GrowthSurfacePlan } from '@/lib/discovery/growth/growth-surface-contract';

/** Canonical surface kinds (3D architecture + 3F workshop). */
export const SURFACE_KINDS = [
  'ACTIVITY',
  'OPPORTUNITY',
  'ECONOMY_OPPORTUNITY',
  'COMMUNITY',
  'PARTNER',
  'WORKSHOP',
  'EVENT',
  'PLATFORM',
] as const;

export type SurfaceKind = (typeof SURFACE_KINDS)[number];

/** Where resolved modules may render. */
export const SURFACE_TARGETS = [
  'desktop_right_sidebar',
  'mobile_insert',
  'profile_owner',
  'notification_future',
] as const;

export type SurfaceTarget = (typeof SURFACE_TARGETS)[number];

export type SurfaceModuleSize = 'compact' | 'standard' | 'hero';

/** Growth / partner opportunity modules (contracts only — copy via i18n keys). */
export const OPPORTUNITY_MODULE_IDS = [
  'BECOME_PARTNER',
  'BECOME_AMBASSADOR',
  'HOST_WORKSHOP',
  'INVITE_LOCAL_BUSINESS',
  'INVITE_SPORTS_CLUB',
  'SUPPORT_NEARBY',
] as const;

export type OpportunityModuleId = (typeof OPPORTUNITY_MODULE_IDS)[number];

export const COMMUNITY_MODULE_IDS = [
  'PEOPLE_NEARBY',
  'NEW_MAKERS_NEARBY',
  'NEW_WORKSHOPS_NEARBY',
  'LOCAL_GROWTH_UPDATE',
  'COMMUNITY_MILESTONE',
] as const;
export type CommunityModuleId = (typeof COMMUNITY_MODULE_IDS)[number];

export const WORKSHOP_MODULE_IDS = [
  'HOST_WORKSHOP',
  'UPCOMING_WORKSHOP',
  'NEARBY_WORKSHOP',
  'WORKSHOP_WAITLIST',
] as const;
export type WorkshopModuleId = (typeof WORKSHOP_MODULE_IDS)[number];

/** Opportunity modules shown in opportunity stack (excludes workshop + partner). */
export const OPPORTUNITY_STACK_MODULE_IDS = [
  'BECOME_PARTNER',
  'BECOME_AMBASSADOR',
  'SUPPORT_NEARBY',
] as const;
export type OpportunityStackModuleId =
  (typeof OPPORTUNITY_STACK_MODULE_IDS)[number];

export const PARTNER_MODULE_IDS = [
  'INVITE_LOCAL_BUSINESS',
  'INVITE_SPORTS_CLUB',
] as const;
export type PartnerModuleId = (typeof PARTNER_MODULE_IDS)[number];

export const EVENT_MODULE_IDS = ['WORKSHOP_NEARBY'] as const;
export type EventModuleId = (typeof EVENT_MODULE_IDS)[number];

export type OpportunityModuleContract = {
  id: string;
  moduleId: OpportunityModuleId;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: ActivityCardCtaKind;
  /** Dedup with activity card types shown in feed this session. */
  linkedActivityType?: ActivityCardType;
};

export type CommunityModuleContract = {
  id: string;
  moduleId: CommunityModuleId;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: ActivityCardCtaKind;
};

export type PartnerModuleContract = OpportunityModuleContract & {
  moduleId: PartnerModuleId;
};

export type EventModuleContract = {
  id: string;
  moduleId: EventModuleId;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: ActivityCardCtaKind;
};

export type WorkshopModuleContract = {
  id: string;
  moduleId: WorkshopModuleId;
  priority: number;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  actionLabelKey: string;
  actionHref: string;
  dismissible: boolean;
  cooldownDays: number;
  ctaKind: ActivityCardCtaKind;
  linkedActivityType?: ActivityCardType;
};

export type ResolvedActivityModule = {
  kind: 'ACTIVITY';
  size: SurfaceModuleSize;
  contract: ActivityCardFeedItem;
};

export type ResolvedOpportunityModule = {
  kind: 'OPPORTUNITY';
  size: SurfaceModuleSize;
  contract: OpportunityModuleContract;
};

export type ResolvedCommunityModule = {
  kind: 'COMMUNITY';
  size: SurfaceModuleSize;
  contract: CommunityModuleContract;
};

export type ResolvedPartnerModule = {
  kind: 'PARTNER';
  size: SurfaceModuleSize;
  contract: PartnerModuleContract;
};

export type ResolvedEventModule = {
  kind: 'EVENT';
  size: SurfaceModuleSize;
  contract: EventModuleContract;
};

export type ResolvedWorkshopModule = {
  kind: 'WORKSHOP';
  size: SurfaceModuleSize;
  contract: WorkshopModuleContract;
};

export type ResolvedPlatformModule = {
  kind: 'PLATFORM';
  size: SurfaceModuleSize;
  moduleId: string;
};

export type ResolvedEconomyOpportunityModule = {
  kind: 'ECONOMY_OPPORTUNITY';
  size: SurfaceModuleSize;
  contract: EconomyOpportunitySurfaceContract;
};

export type ResolvedSurfaceModule =
  | ResolvedActivityModule
  | ResolvedOpportunityModule
  | ResolvedEconomyOpportunityModule
  | ResolvedCommunityModule
  | ResolvedPartnerModule
  | ResolvedWorkshopModule
  | ResolvedEventModule
  | ResolvedPlatformModule;

export type { EconomyOpportunitySurfaceContract, OpportunityEconomySurfacePlan };
export type { GrowthSurfacePlan };

/** Canonical desktop right-sidebar surface stack (3F). */
export const SIDEBAR_STACK_SLOT_IDS = [
  'community_pulse',
  'activity_module',
  'opportunity_module',
  'workshop_module',
  'partner_module',
  'event_module',
  'platform_module',
  'sponsored_placeholder',
] as const;

export type SidebarStackSlotId = (typeof SIDEBAR_STACK_SLOT_IDS)[number];

export type SidebarSlotVisibility =
  | 'show'
  | 'hide'
  | 'collapsed'
  | 'expanded';

export type SidebarStackSlot = {
  slotId: SidebarStackSlotId;
  visibility: SidebarSlotVisibility;
  module: ResolvedSurfaceModule | null;
};

export type MobileSurfaceTarget =
  | 'feed_insert'
  | 'activity_card'
  | 'profile_module'
  | 'bottom_sheet';

export type MobileSurfaceMapping = {
  slotId: SidebarStackSlotId;
  module: ResolvedSurfaceModule | null;
  mobileTarget: MobileSurfaceTarget;
  afterSaleIndex?: number;
};

export type ProfileStackSectionId =
  | 'partner_opportunities'
  | 'community_opportunities'
  | 'activation_suggestions'
  | 'trust_growth';

export type ProfileStackSection = {
  sectionId: ProfileStackSectionId;
  modules: ResolvedSurfaceModule[];
};

export type MobileSurfaceInsert = {
  afterSaleIndex: number;
  module: ResolvedSurfaceModule;
};

export type ResolvedSurfacePlan = {
  specVersion: 2;
  desktopRightSidebar: ResolvedSurfaceModule[];
  sidebarStack: SidebarStackSlot[];
  mobileInserts: MobileSurfaceInsert[];
  mobileMapping: MobileSurfaceMapping[];
  profileModules: ResolvedSurfaceModule[];
  profileStack: ProfileStackSection[];
  notificationsFuture: ResolvedSurfaceModule[];
  /** Opportunity Economy surfaces — Phase 3J. */
  opportunityEconomy: OpportunityEconomySurfacePlan;
  /** Unified growth & action surfaces — Phase 3M. */
  growthSurfaces: GrowthSurfacePlan;
  meta: {
    activitySidebarMaxStacked: number;
    activitySidebarCollapseThreshold: number;
    opportunityMaxVisible: number;
    opportunityCooldownDays: number;
    activityFeedMaxSession: number;
    activityFeedMaxVisible: number;
  };
};

export const SURFACE_ROUTER_SPEC_VERSION = 2 as const;

export const OPPORTUNITY_STACK_COOLDOWN_DAYS = 14 as const;

export function opportunityInstanceId(
  moduleId: OpportunityModuleId,
  userId: string,
): string {
  return `opportunity:${moduleId}:${userId}`;
}

export function communityInstanceId(
  moduleId: CommunityModuleId,
  userId: string,
): string {
  return `community:${moduleId}:${userId}`;
}

export function workshopInstanceId(
  moduleId: WorkshopModuleId,
  userId: string,
): string {
  return `workshop:${moduleId}:${userId}`;
}
