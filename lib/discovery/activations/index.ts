export type {
  RealWorldActivationCategory,
  RealWorldActivationId,
  RealWorldActivationContract,
  RealWorldActivationDefinition,
  ActivationLifecycleState,
  ActivationViralityTier,
  ActivationRewardType,
  ForbiddenActivationSignal,
} from './activation-contract';

export {
  REAL_WORLD_ACTIVATION_CATEGORIES,
  ACTIVATION_LIFECYCLE_STATES,
  ACTIVATION_VIRALITY_TIERS,
  ACTIVATION_REWARD_TYPES,
  FORBIDDEN_ACTIVATION_SIGNALS,
  activationInstanceId,
} from './activation-contract';

export type {
  ActivationEligibilityInput,
  ActivationRole,
  ActivationCooldownState,
} from './activation-signals';

export {
  deriveActivationRole,
  localScopeBoost,
} from './activation-signals';

export {
  ACTIVATION_SAFETY_RULES,
  passesActivationSafety,
  assertActivationLibrarySafety,
} from './activation-safety';

export type { ActivationSafetyRule } from './activation-safety';

export {
  VIRALITY_FRAMEWORK_RULES,
  defaultViralityForCategory,
  viralityPriorityBoost,
} from './activation-virality';

export {
  FORBIDDEN_REWARD_PATTERNS,
  allowedRewardsForCategory,
  validateActivationRewards,
  rewardsAfterCompletionOnly,
} from './activation-rewards';

export {
  PRACTICAL_NEIGHBORHOOD_ACTIVATIONS,
  PRACTICAL_NEIGHBORHOOD_IDS,
} from './activation-library-practical-neighborhood';

export {
  LOCAL_DISCOVERY_ACTIVATIONS,
  LOCAL_DISCOVERY_IDS,
} from './activation-library-local-discovery';

export {
  COMMUNITY_SUPPORT_ACTIVATIONS,
  COMMUNITY_SUPPORT_IDS,
} from './activation-library-community-support';

export {
  REAL_WORLD_ACTIVATION_REGISTRY,
  ALL_REAL_WORLD_ACTIVATIONS,
  getRealWorldActivation,
  listActivationsByCategory,
} from './activation-registry';

export {
  ACTIVATION_DEFAULT_COOLDOWN_DAYS,
  ACTIVATION_MAX_PER_SESSION,
  ACTIVATION_MAX_PER_CATEGORY_SESSION,
  isActivationInCooldown,
  suppressDuplicateActivations,
} from './activation-anti-spam';

export type {
  ResolveRealWorldActivationsOptions,
  ResolvedRealWorldActivation,
} from './resolve-real-world-activations';

export {
  resolveRealWorldActivations,
  buildActivationEligibilityFromSurface,
} from './resolve-real-world-activations';
