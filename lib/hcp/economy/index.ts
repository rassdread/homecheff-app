export type {
  HcpRewardCategory,
  HcpRewardAction,
  HcpRecognitionType,
  ForbiddenHcpEffect,
  HcpRewardLimitsSpec,
  HcpRewardContract,
  HcpRewardEligibilityResult,
  HcpRewardCooldownState,
  HcpMilestone,
  HcpRecommendedAction,
  HcpCommunityAchievement,
  HcpSidebarIntegrationPlan,
} from './hcp-reward-contract';

export {
  HCP_REWARD_CATEGORIES,
  HCP_REWARD_ACTIONS,
  HCP_RECOGNITION_TYPES,
  FORBIDDEN_HCP_EFFECTS,
  hcpRewardInstanceId,
} from './hcp-reward-contract';

export type { ForbiddenHcpGamingPattern, HcpAntiGamingInput } from './hcp-reward-rules';

export {
  FORBIDDEN_HCP_GAMING_PATTERNS,
  CATEGORY_LIMIT_DEFAULTS,
  dayKeyUtc,
  weekKeyUtc,
  isInHcpRewardCooldown,
  exceedsDailyCap,
  exceedsWeeklyCap,
  passesAntiGaming,
  validateHcpRewardContract,
  evaluateHcpRewardEligibility,
  suppressDuplicateHcpRewards,
  hcpNeverAffectsDiscovery,
  forbiddenEffects,
} from './hcp-reward-rules';

export {
  FORBIDDEN_RECOGNITION_EFFECTS,
  validateRecognitionTypes,
  recognitionAllowsOptionalHcp,
  buildDefaultMilestones,
  buildAchievementHistory,
  hcpRecognitionDoesNotAffectTrust,
} from './hcp-recognition';

export type {
  ResolveActivationHcpRewardInput,
  ResolvedActivationHcpReward,
} from './hcp-activation-rewards';

export {
  HCP_ACTIVATION_COMPLETE_REWARD,
  ACTIVATION_CATEGORY_REWARDS,
  resolveActivationHcpReward,
  listActivationHcpRewards,
  activationActionForCategory,
  activationHcpCategory,
} from './hcp-activation-rewards';

export type {
  ResolveOpportunityHcpRewardInput,
  ResolvedOpportunityHcpReward,
} from './hcp-opportunity-rewards';

export {
  OPPORTUNITY_HCP_REWARD_REGISTRY,
  resolveOpportunityHcpReward,
  listOpportunityHcpRewards,
  opportunityHcpAction,
} from './hcp-opportunity-rewards';

export type { BuildHcpSidebarPlanInput } from './hcp-sidebar-integration';

export {
  buildHcpSidebarIntegrationPlan,
  emptyHcpSidebarPlan,
} from './hcp-sidebar-integration';

export type { ResolveHcpEconomyInput, ResolvedHcpEconomy } from './resolve-hcp-economy';

export {
  resolveHcpEconomy,
  allHcpEconomyContracts,
} from './resolve-hcp-economy';
