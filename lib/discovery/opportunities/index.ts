export type {
  OpportunityType,
  OpportunityCategory,
  OpportunityRewardType,
  OpportunityLifecycleState,
  OpportunityEligibilitySignal,
  ForbiddenOpportunitySignal,
  OpportunitySurfaceTarget,
  OpportunityEligibilitySpec,
  OpportunityBenefit,
  OpportunityRequirement,
  OpportunityCooldownSpec,
  OpportunityContract,
} from './opportunity-contract';

export {
  OPPORTUNITY_TYPES,
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_REWARD_TYPES,
  OPPORTUNITY_LIFECYCLE_STATES,
  OPPORTUNITY_ELIGIBILITY_SIGNALS,
  FORBIDDEN_OPPORTUNITY_SIGNALS,
  OPPORTUNITY_SURFACE_TARGETS,
  opportunityInstanceId,
} from './opportunity-contract';

export type {
  OpportunityEligibilityInput,
  OpportunityEligibilityResult,
  OpportunityCooldownState,
} from './opportunity-eligibility';

export {
  evaluateOpportunityEligibility,
  evaluateOpportunityTypeRules,
  isOpportunityEligible,
  buildOpportunityEligibilityFromSurface,
} from './opportunity-eligibility';

export {
  FORBIDDEN_OPPORTUNITY_REWARD_PATTERNS,
  allowedRewardsForOpportunityCategory,
  validateOpportunityRewards,
  futureRewardsAreContractOnly,
  opportunityRewardsAfterCompletionOnly,
} from './opportunity-rewards';

export type { ForbiddenOpportunityRewardPattern } from './opportunity-rewards';

export {
  canTransitionOpportunityLifecycle,
  initialOpportunityLifecycle,
  resolveOpportunityLifecycleState,
  transitionOpportunityLifecycle,
  lifecycleAllowsSurface,
} from './opportunity-lifecycle';

export {
  OPPORTUNITY_MAX_DESKTOP_SIDEBAR,
  OPPORTUNITY_MAX_MOBILE_INSERT,
  OPPORTUNITY_MAX_PROFILE_MODULE,
  OPPORTUNITY_MAX_PER_CATEGORY,
  OPPORTUNITY_DEFAULT_SHOW_COOLDOWN_DAYS,
  isOpportunityInCooldown,
  suppressDuplicateOpportunities,
} from './opportunity-anti-spam';

export type { OpportunityDefinition } from './opportunity-registry';

export {
  OPPORTUNITY_REGISTRY,
  ALL_OPPORTUNITY_DEFINITIONS,
  getOpportunityDefinition,
  listOpportunitiesByCategory,
} from './opportunity-registry';

export type {
  ResolveOpportunityContractsOptions,
  ResolvedOpportunityContract,
  OpportunitySurfaceBundle,
} from './resolve-opportunity-contracts';

export {
  resolveOpportunityContracts,
  resolveDesktopSidebarOpportunities,
  resolveMobileInsertOpportunities,
  resolveProfileModuleOpportunities,
  resolveOpportunitySurfaceBundle,
} from './resolve-opportunity-contracts';

export type { OpportunityProgressContract, OpportunityMilestone } from './opportunity-progress';
export { buildOpportunityProgress } from './opportunity-progress';

export type {
  CommunityHelperVariantId,
  CommunityHelperVariantContract,
} from './community-helper-variants';
export {
  COMMUNITY_HELPER_VARIANT_IDS,
  COMMUNITY_HELPER_VARIANTS,
  resolveCommunityHelperVariant,
} from './community-helper-variants';
