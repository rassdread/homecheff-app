/**
 * Public Adaptive Workspace API — Phase 2A pure core.
 *
 * @packageDocumentation
 */

export { ADAPTIVE_WORKSPACE_SCHEMA_VERSION } from "./types/workspace";
export type {
  AvailableSpace,
  CompatibilityMode,
  DecisionTrace,
  FocusIntent,
  LifecycleIntent,
  Occlusion,
  PanelMode,
  PanelRequest,
  RegionId,
  ResolveInput,
  TransitionIntent,
  WidgetLifecycleState,
  WidgetManifest,
  WorkspaceLayoutPlan,
  WorkspacePreferences,
  WorkspaceProfile,
  WorkspaceStateAllowlist,
} from "./types/workspace";

export {
  PANEL_MODE_META,
  RESOLVE_PRECEDENCE,
  WORKSPACE_DOMAIN_DENYLIST,
  TELEMETRY_METRIC_NAMES,
} from "./types/workspace";

export type { WorkspaceCommand } from "./types/commands";
export type { WorkspaceEvent } from "./types/events";

export {
  WIDGET_LIFECYCLE_TRANSITIONS,
  isAllowedLifecycleTransition,
} from "./types/lifecycle";

export { validateResolveInput } from "./schema/validate-resolve-input";
export {
  validateWidgetManifest,
  validateWidgetManifestSet,
} from "./schema/validate-widget-manifest";
export { validateWorkspacePreferences } from "./schema/validate-resolve-input";
export {
  ValidationError,
  RecoverableResolutionError,
  HardContractViolation,
} from "./schema/validation-error";

export {
  resolveWorkspaceProfile,
  capacityBudgetForProfile,
  PROFILE_TEST_FIXTURE_BANDS,
} from "./profile/resolve-workspace-profile";

export {
  SettingsSurfacePolicy,
  getSurfacePolicy,
  SETTINGS_SURFACE_ID,
} from "./policies/settings-policy";

export {
  settingsHubManifest,
  sealedPrimaryManifest,
  feedGeoTestManifest,
  feedDiscoveryManifest,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  notificationsInboxManifest,
  messagesListManifest,
  messagesChatManifest,
} from "./registry/settings-manifests";

export { resolveWorkspaceLayout } from "./resolver/resolve-workspace-layout";
export {
  canonicalizeLayoutPlan,
  stableStringify,
} from "./resolver/canonicalize-layout-plan";

export { DIAGNOSTIC_CODES } from "./diagnostics/diagnostic-codes";

export {
  FEED_SEALED_INVARIANT_IDS,
  FEED_SEALED_INVARIANT_ID,
  type FeedSealedInvariantId,
} from "./sealed/feed-discovery-invariants";

export {
  SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION,
  SEALED_WORKSPACE_CAPABILITIES,
  SEALED_WORKSPACE_PROHIBITIONS,
  type SealedRuntimeContract,
  type SealedRuntimeClassification,
  type SealedRuntimeOwner,
  type SealedRuntimeActiveWriter,
  type SealedMountPolicy,
  type SealedStateBoundary,
  type SealedRequestBoundary,
  type SealedObserverBoundary,
  type SealedScrollBoundary,
  type SealedWorkspaceCapability,
  type SealedWorkspaceProhibition,
} from "./sealed/sealed-runtime-types";

export {
  validateSealedRuntimeContract,
  isSealedCapabilityProhibited,
} from "./sealed/validate-sealed-runtime-contract";

export {
  FEED_DISCOVERY_WIDGET_ID,
  createFeedDiscoverySealedContract,
} from "./sealed/feed-discovery-sealed-contract";

export {
  FEED_DISCOVERY_FREEZE_SCHEMA_VERSION,
  createFeedDiscoveryFreezeContract,
  validateFeedDiscoveryFreezeContract,
  type FeedDiscoveryFreezeContract,
} from "./sealed/feed-discovery-freeze-contract";

export {
  FEED_BROWSER_PROOF_SCHEMA_VERSION,
  validateFeedBrowserProofArtifact,
  type FeedBrowserProofArtifact,
  type FeedBrowserProofInvariantRow,
  type FeedBrowserProofStatus,
} from "./sealed/validate-feed-browser-proof";

export {
  CONTROLLED_FEED_HOST_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES,
  CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS,
  type ControlledFeedHostContract,
  type ControlledFeedHostActivationPrerequisite,
  type ControlledFeedHostActivationBlocker,
} from "./sealed/controlled-feed-host-types";

export { createControlledFeedHostContract } from "./sealed/create-controlled-feed-host-contract";
export { validateControlledFeedHostContract } from "./sealed/validate-controlled-feed-host-contract";

export {
  PHASE_3B3_1_DORMANT_HOST_ONLY,
  PHASE_3B3_2_SHADOW_PLACEMENT_ONLY,
  PHASE_3B3_3_HOST_REGISTRATION_ONLY,
  PHASE_3B3_4_HOST_ELIGIBILITY_ONLY,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
  PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY,
  PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  evaluateFeedHostActivationGate,
  type FeedHostActivationGateResult,
  type FeedHostActivationGateInput,
} from "./sealed/feed-host-activation-gate";

export {
  FEED_HOST_ROLLBACK_SCHEMA_VERSION,
  FEED_HOST_ROLLBACK_TRIGGER_TYPES,
  createFeedHostRollbackContract,
  validateFeedHostRollbackContract,
  type FeedHostRollbackContract,
  type FeedHostRollbackTriggerType,
} from "./sealed/feed-host-rollback-contract";

export {
  createControlledFeedHostPlan,
  type ControlledFeedHostPlan,
} from "./sealed/controlled-feed-host-plan";

export {
  FEED_DORMANT_HOST_READINESS_SCHEMA_VERSION,
  createFeedDormantHostReadinessContract,
  validateFeedDormantHostReadinessContract,
  type FeedDormantHostReadinessContract,
} from "./sealed/feed-dormant-host-readiness";

export {
  CONTROLLED_FEED_HOST_SHADOW_PLACEMENT_SCHEMA_VERSION,
  createControlledFeedHostShadowPlacement,
  validateControlledFeedHostShadowPlacement,
  type ControlledFeedHostShadowPlacement,
} from "./sealed/controlled-feed-host-shadow-placement";

export {
  FEED_HOST_SHADOW_PLACEMENT_IDENTITY_SCHEMA_VERSION,
  createFeedHostShadowPlacementIdentity,
  validateFeedHostShadowPlacementIdentity,
  type FeedHostShadowPlacementIdentity,
} from "./sealed/feed-host-shadow-placement-identity";

export {
  FEED_SHADOW_PLACEMENT_READINESS_SCHEMA_VERSION,
  createFeedShadowPlacementReadinessContract,
  validateFeedShadowPlacementReadinessContract,
  type FeedShadowPlacementReadinessContract,
} from "./sealed/feed-shadow-placement-readiness";

export {
  CONTROLLED_HOST_REGISTRY_SCHEMA_VERSION,
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  readControlledHostRegistry,
  createFeedDiscoveryControlledHostDescriptor,
  validateControlledHostRegistry,
  validateControlledHostDescriptor,
  type ControlledHostRegistry,
  type ControlledHostDescriptor,
} from "./sealed/controlled-host-registry";

export {
  CONTROLLED_HOST_REGISTRATION_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_HOST_REGISTRATION_REQUIREMENTS,
  createControlledHostRegistrationContract,
  validateControlledHostRegistrationContract,
  type ControlledHostRegistrationContract,
  type ControlledHostRegistrationRequirement,
} from "./sealed/controlled-host-registration-contract";

export {
  FEED_HOST_REGISTRATION_IDENTITY_SCHEMA_VERSION,
  createFeedHostRegistrationIdentity,
  validateFeedHostRegistrationIdentity,
  type FeedHostRegistrationIdentity,
} from "./sealed/feed-host-registration-identity";

export {
  FEED_HOST_REGISTRATION_READINESS_SCHEMA_VERSION,
  createFeedHostRegistrationReadinessContract,
  validateFeedHostRegistrationReadinessContract,
  type FeedHostRegistrationReadinessContract,
} from "./sealed/feed-host-registration-readiness";

export {
  CONTROLLED_HOST_ELIGIBILITY_SCHEMA_VERSION,
  createControlledHostEligibilityDescriptor,
  evaluateControlledHostEligibility,
  validateControlledHostEligibilityDescriptor,
  type ControlledHostEligibilityDescriptor,
  type ControlledHostEligibilityEvaluation,
} from "./sealed/controlled-host-eligibility";

export {
  CONTROLLED_HOST_ELIGIBILITY_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_HOST_ELIGIBILITY_REQUIREMENTS,
  createControlledHostEligibilityContract,
  validateControlledHostEligibilityContract,
  type ControlledHostEligibilityContract,
  type ControlledHostEligibilityRequirement,
} from "./sealed/controlled-host-eligibility-contract";

export {
  FEED_HOST_ELIGIBILITY_IDENTITY_SCHEMA_VERSION,
  createFeedHostEligibilityIdentity,
  validateFeedHostEligibilityIdentity,
  type FeedHostEligibilityIdentity,
} from "./sealed/feed-host-eligibility-identity";

export {
  FEED_HOST_ELIGIBILITY_READINESS_SCHEMA_VERSION,
  createFeedHostEligibilityReadinessContract,
  validateFeedHostEligibilityReadinessContract,
  type FeedHostEligibilityReadinessContract,
} from "./sealed/feed-host-eligibility-readiness";

export {
  CONTROLLED_HOST_ACTIVATION_READINESS_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_READINESS_REASONS,
  CONTROLLED_HOST_ACTIVATION_READINESS_BLOCKERS,
  createControlledHostActivationReadinessDescriptor,
  evaluateControlledHostActivationReadiness,
  validateControlledHostActivationReadinessDescriptor,
  type ControlledHostActivationReadinessDescriptor,
  type ControlledHostActivationReadinessEvaluation,
  type ControlledHostActivationReadinessDiagnostics,
} from "./sealed/controlled-host-activation-readiness";

export {
  CONTROLLED_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_READINESS_REQUIREMENTS,
  createControlledHostActivationReadinessContract,
  validateControlledHostActivationReadinessContract,
  type ControlledHostActivationReadinessContract,
  type ControlledHostActivationReadinessRequirement,
} from "./sealed/controlled-host-activation-readiness-contract";

export {
  FEED_HOST_ACTIVATION_READINESS_IDENTITY_SCHEMA_VERSION,
  createFeedHostActivationReadinessIdentity,
  validateFeedHostActivationReadinessIdentity,
  type FeedHostActivationReadinessIdentity,
} from "./sealed/feed-host-activation-readiness-identity";

export {
  FEED_HOST_ACTIVATION_READINESS_PREPARED_SCHEMA_VERSION,
  createFeedHostActivationReadinessPreparedContract,
  validateFeedHostActivationReadinessPreparedContract,
  type FeedHostActivationReadinessPreparedContract,
} from "./sealed/feed-host-activation-readiness-prepared";

export {
  CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_SCHEMA_VERSION,
  CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_REASONS,
  CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_BLOCKERS,
  createControlledHostShadowActivationSimulationDescriptor,
  evaluateControlledHostShadowActivationSimulation,
  validateControlledHostShadowActivationSimulationDescriptor,
  type ControlledHostShadowActivationSimulationDescriptor,
  type ControlledHostShadowActivationSimulationEvaluation,
  type ControlledHostShadowActivationSimulationDiagnostics,
} from "./sealed/controlled-host-shadow-activation-simulation";

export {
  CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_REQUIREMENTS,
  createControlledHostShadowActivationSimulationContract,
  validateControlledHostShadowActivationSimulationContract,
  type ControlledHostShadowActivationSimulationContract,
  type ControlledHostShadowActivationSimulationRequirement,
} from "./sealed/controlled-host-shadow-activation-simulation-contract";

export {
  FEED_HOST_SHADOW_ACTIVATION_SIMULATION_IDENTITY_SCHEMA_VERSION,
  createFeedHostShadowActivationSimulationIdentity,
  validateFeedHostShadowActivationSimulationIdentity,
  type FeedHostShadowActivationSimulationIdentity,
} from "./sealed/feed-host-shadow-activation-simulation-identity";

export {
  FEED_HOST_SHADOW_ACTIVATION_SIMULATION_PREPARED_SCHEMA_VERSION,
  createFeedHostShadowActivationSimulationPreparedContract,
  validateFeedHostShadowActivationSimulationPreparedContract,
  type FeedHostShadowActivationSimulationPreparedContract,
} from "./sealed/feed-host-shadow-activation-simulation-prepared";

export {
  CONTROLLED_HOST_ACTIVATION_DECISION_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_DECISION_REASONS,
  CONTROLLED_HOST_ACTIVATION_DECISION_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES,
  createControlledHostActivationDecisionDescriptor,
  evaluateControlledHostActivationDecision,
  validateControlledHostActivationDecisionDescriptor,
  type ControlledHostActivationDecisionDescriptor,
  type ControlledHostActivationDecisionEvaluation,
  type ControlledHostActivationDecisionDiagnostics,
} from "./sealed/controlled-host-activation-decision";

export {
  CONTROLLED_HOST_ACTIVATION_DECISION_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_DECISION_REQUIREMENTS,
  createControlledHostActivationDecisionContract,
  validateControlledHostActivationDecisionContract,
  type ControlledHostActivationDecisionContract,
  type ControlledHostActivationDecisionRequirement,
} from "./sealed/controlled-host-activation-decision-contract";

export {
  FEED_HOST_ACTIVATION_DECISION_IDENTITY_SCHEMA_VERSION,
  createFeedHostActivationDecisionIdentity,
  validateFeedHostActivationDecisionIdentity,
  type FeedHostActivationDecisionIdentity,
} from "./sealed/feed-host-activation-decision-identity";

export {
  FEED_HOST_ACTIVATION_DECISION_PREPARED_SCHEMA_VERSION,
  createFeedHostActivationDecisionPreparedContract,
  validateFeedHostActivationDecisionPreparedContract,
  type FeedHostActivationDecisionPreparedContract,
} from "./sealed/feed-host-activation-decision-prepared";

export {
  CONTROLLED_HOST_ACTIVATION_PLAN_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_PLAN_STEPS,
  CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_PLAN_VALIDATION_POINTS,
  CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS,
  CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_PLAN_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_PLAN_ID,
  CONTROLLED_HOST_ACTIVATION_PLAN_VERSION,
  createControlledHostActivationPlanDescriptor,
  evaluateControlledHostActivationPlan,
  validateControlledHostActivationPlanDescriptor,
  type ControlledHostActivationPlanDescriptor,
  type ControlledHostActivationPlanEvaluation,
  type ControlledHostActivationPlanDiagnostics,
} from "./sealed/controlled-host-activation-plan";

export {
  CONTROLLED_HOST_ACTIVATION_PLAN_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_PLAN_REQUIREMENTS,
  createControlledHostActivationPlanContract,
  validateControlledHostActivationPlanContract,
  type ControlledHostActivationPlanContract,
  type ControlledHostActivationPlanRequirement,
} from "./sealed/controlled-host-activation-plan-contract";

export {
  FEED_HOST_ACTIVATION_PLAN_IDENTITY_SCHEMA_VERSION,
  createFeedHostActivationPlanIdentity,
  validateFeedHostActivationPlanIdentity,
  type FeedHostActivationPlanIdentity,
} from "./sealed/feed-host-activation-plan-identity";

export {
  FEED_HOST_ACTIVATION_PLAN_PREPARED_SCHEMA_VERSION,
  createFeedHostActivationPlanPreparedContract,
  validateFeedHostActivationPlanPreparedContract,
  type FeedHostActivationPlanPreparedContract,
} from "./sealed/feed-host-activation-plan-prepared";

export {
  CONTROLLED_HOST_ACTIVATION_PIPELINE_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_ENTRY_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_EXIT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_ID,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_VERSION,
  createControlledHostActivationPipelineDescriptor,
  evaluateControlledHostActivationPipeline,
  validateControlledHostActivationPipelineDescriptor,
  type ControlledHostActivationPipelineDescriptor,
  type ControlledHostActivationPipelineEvaluation,
  type ControlledHostActivationPipelineDiagnostics,
} from "./sealed/controlled-host-activation-pipeline";

export {
  CONTROLLED_HOST_ACTIVATION_PIPELINE_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_REQUIREMENTS,
  createControlledHostActivationPipelineContract,
  validateControlledHostActivationPipelineContract,
  type ControlledHostActivationPipelineContract,
  type ControlledHostActivationPipelineRequirement,
} from "./sealed/controlled-host-activation-pipeline-contract";

export {
  FEED_HOST_ACTIVATION_PIPELINE_IDENTITY_SCHEMA_VERSION,
  createFeedHostActivationPipelineIdentity,
  validateFeedHostActivationPipelineIdentity,
  type FeedHostActivationPipelineIdentity,
} from "./sealed/feed-host-activation-pipeline-identity";

export {
  FEED_HOST_ACTIVATION_PIPELINE_PREPARED_SCHEMA_VERSION,
  createFeedHostActivationPipelinePreparedContract,
  validateFeedHostActivationPipelinePreparedContract,
  type FeedHostActivationPipelinePreparedContract,
} from "./sealed/feed-host-activation-pipeline-prepared";

export {
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_VALIDATION_CHECKPOINTS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_VERSION,
  createControlledHostActivationTransactionDescriptor,
  evaluateControlledHostActivationTransaction,
  validateControlledHostActivationTransactionDescriptor,
  type ControlledHostActivationTransactionDescriptor,
  type ControlledHostActivationTransactionEvaluation,
  type ControlledHostActivationTransactionDiagnostics,
} from "./sealed/controlled-host-activation-transaction";

export {
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_CONTRACT_SCHEMA_VERSION,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_REQUIREMENTS,
  createControlledHostActivationTransactionContract,
  validateControlledHostActivationTransactionContract,
  type ControlledHostActivationTransactionContract,
  type ControlledHostActivationTransactionRequirement,
} from "./sealed/controlled-host-activation-transaction-contract";

export {
  FEED_HOST_ACTIVATION_TRANSACTION_IDENTITY_SCHEMA_VERSION,
  createFeedHostActivationTransactionIdentity,
  validateFeedHostActivationTransactionIdentity,
  type FeedHostActivationTransactionIdentity,
} from "./sealed/feed-host-activation-transaction-identity";

export {
  FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_SCHEMA_VERSION,
  createFeedHostActivationTransactionPreparedContract,
  validateFeedHostActivationTransactionPreparedContract,
  type FeedHostActivationTransactionPreparedContract,
} from "./sealed/feed-host-activation-transaction-prepared";
