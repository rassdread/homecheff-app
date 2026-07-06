export type {
  SurfaceKind,
  SurfaceTarget,
  SurfaceModuleSize,
  OpportunityModuleId,
  OpportunityStackModuleId,
  CommunityModuleId,
  WorkshopModuleId,
  PartnerModuleId,
  EventModuleId,
  SidebarStackSlotId,
  SidebarSlotVisibility,
  SidebarStackSlot,
  MobileSurfaceTarget,
  MobileSurfaceMapping,
  ProfileStackSectionId,
  ProfileStackSection,
  OpportunityModuleContract,
  CommunityModuleContract,
  WorkshopModuleContract,
  PartnerModuleContract,
  EventModuleContract,
  ResolvedSurfaceModule,
  ResolvedActivityModule,
  ResolvedOpportunityModule,
  ResolvedCommunityModule,
  ResolvedPartnerModule,
  ResolvedWorkshopModule,
  ResolvedEventModule,
  ResolvedPlatformModule,
  MobileSurfaceInsert,
  ResolvedSurfacePlan,
} from './surface-contract';

export {
  SURFACE_KINDS,
  SURFACE_TARGETS,
  OPPORTUNITY_MODULE_IDS,
  OPPORTUNITY_STACK_MODULE_IDS,
  OPPORTUNITY_STACK_COOLDOWN_DAYS,
  COMMUNITY_MODULE_IDS,
  WORKSHOP_MODULE_IDS,
  PARTNER_MODULE_IDS,
  EVENT_MODULE_IDS,
  SIDEBAR_STACK_SLOT_IDS,
  SURFACE_ROUTER_SPEC_VERSION,
  opportunityInstanceId,
  communityInstanceId,
  workshopInstanceId,
} from './surface-contract';

export type {
  SurfaceViewerContext,
  SurfaceLocationContext,
  SurfaceRoleContext,
  SurfaceTrustContext,
  SurfaceOpportunityEligibilityInput,
  SurfaceCommunityEligibilityInput,
  SurfaceWorkshopEligibilityInput,
  OpportunityCooldownState,
  CommunityCooldownState,
  WorkshopCooldownState,
  SurfaceRouterContext,
} from './surface-context';

export { buildSurfaceRouterContext } from './surface-context';

export {
  CANONICAL_SIDEBAR_STACK_ORDER,
  SIDEBAR_STACK_SLOT_RANK,
  compareSidebarStackSlots,
  isCanonicalStackOrder,
} from './sidebar-stack-order';

export {
  resolveSidebarSlotVisibility,
  isSidebarSlotRenderable,
} from './resolve-sidebar-visibility';

export type { SidebarVisibilityInput } from './resolve-sidebar-visibility';

export {
  SURFACE_KIND_BASE_PRIORITY,
  DESKTOP_SIDEBAR_SURFACE_ANCHOR,
  compareSurfaceModules,
  sortSurfaceModules,
} from './surface-priority';

export {
  SURFACE_VISIBILITY_RULES,
  getVisibilityRule,
  isSurfaceKindVisibleForGuest,
  maxModulesForTarget,
  canShowSurfaceKind,
  filterModulesForTarget,
} from './surface-visibility';

export type { SurfaceVisibilityRule } from './surface-visibility';

export type { SurfaceRouterInput, SurfaceRouterOptions } from './surface-router';

export { resolveSurfaces, emptySurfacePlan } from './surface-router';

export type {
  OpportunityModuleDefinition,
  ResolveOpportunityModulesOptions,
} from './resolve-opportunity-modules';

export {
  OPPORTUNITY_MODULE_REGISTRY,
  resolveOpportunityModules,
  resolveOpportunityStackModule,
  resolvePartnerStackModule,
  listOpportunityModuleDefinitions,
} from './resolve-opportunity-modules';

export type { CommunityModuleDefinition } from './resolve-community-modules';

export {
  COMMUNITY_MODULE_REGISTRY,
  resolveCommunityModules,
} from './resolve-community-modules';

export type { WorkshopModuleDefinition } from './resolve-workshop-modules';

export {
  WORKSHOP_MODULE_REGISTRY,
  resolveWorkshopModules,
} from './resolve-workshop-modules';

export { buildSidebarStack, flattenSidebarStackModules } from './build-sidebar-stack';

export type { BuildSidebarStackInput } from './build-sidebar-stack';

export {
  buildMobileSurfaceMapping,
  getMobileActivityCardModules,
} from './resolve-mobile-surface-mapping';

export type { BuildMobileSurfaceMappingInput } from './resolve-mobile-surface-mapping';

export { buildProfileStack, flattenProfileStack } from './resolve-profile-stack';

export type { BuildProfileStackInput } from './resolve-profile-stack';

export {
  MOBILE_PLATFORM_RESERVED_SALE_INDICES,
  resolveMobileSurfaceInserts,
  shouldRenderMobileSurfaceAtSaleIndex,
  mobileInsertIndices,
} from './resolve-mobile-surface-inserts';

export type { ResolveMobileSurfaceInsertsInput } from './resolve-mobile-surface-inserts';

export { buildSurfacesFeedSlot } from './build-surfaces-feed-slot';
export type { BuildSurfacesSlotInput } from './build-surfaces-feed-slot';

export {
  getSurfacePlanFromDiscovery,
  getSurfacePlanOrEmpty,
  getSidebarActivityModules,
  getSidebarOpportunityModules,
  getSidebarStackSlot,
} from './surface-discovery-helpers';

export {
  readOpportunityCooldownState,
  recordOpportunityDismissed,
  recordOpportunityShown,
  readEconomyOpportunityCooldownState,
  recordEconomyOpportunityDismissed,
  recordEconomyOpportunityShown,
} from './surface-client-storage';

export type {
  EconomyOpportunitySurfaceContract,
  OpportunityEconomySurfacePlan,
  ResolvedEconomyOpportunityModule,
} from './map-economy-opportunity-surface';

export {
  toEconomyOpportunityModule,
  isPartnerEconomyType,
} from './map-economy-opportunity-surface';

export { resolveOpportunityEconomySurfaces } from './resolve-opportunity-economy-surfaces';

export {
  buildPrioritizedMobileInserts,
  economyOpportunityInsertIndices,
} from './resolve-mobile-opportunity-inserts';

export type {
  PrioritizedMobileInsert,
  MobileSurfaceInsertTier,
} from './resolve-mobile-opportunity-inserts';

export {
  buildServerSurfaceContext,
  countNearbyWorkshopsInPool,
  countNewMakersInPool,
  countActiveNeighboursInPool,
  countUpcomingWorkshopsInPool,
  accountAgeDaysFromCreatedAt,
} from './build-server-surface-context';

export type { BuildServerSurfaceContextInput } from './build-server-surface-context';
