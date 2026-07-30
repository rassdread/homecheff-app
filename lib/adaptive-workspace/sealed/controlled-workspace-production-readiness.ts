/**
 * AW-R5 — Production Readiness.
 *
 * Certification-only metadata stage. Authority dimensions, pipeline state,
 * transaction state, and Feed ON authorization remain unchanged from AW-R4.
 */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  evaluateControlledWorkspaceGeoFeedAuthorityTransition,
  type ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor,
} from "./controlled-workspace-geofeed-authority-transition";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_PRODUCTION_READINESS_SCHEMA_VERSION =
  1 as const;
export const PHASE_AW_R5_PRODUCTION_READINESS_ONLY =
  "PHASE_AW_R5_PRODUCTION_READINESS_ONLY" as const;
export const CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID =
  "feed.discovery.adaptive-workspace.host-production-readiness.v1" as const;
export const CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-production-readiness.contract.v1" as const;

export const CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONDITIONS =
  Object.freeze([
    "predecessor-aw-r4-geofeed-authority-transition-exact",
    "workspace-authority-committed",
    "controlled-authority-pipeline",
    "controlled-authority-transaction",
    "production-readiness-certification",
    "stable-mount-identity-preserved",
    "feed-on-remains-closed",
  ] as const);

export const CONTROLLED_WORKSPACE_PRODUCTION_READINESS_GUARDS =
  Object.freeze([
    "certification-only-overlay",
    "authority-dimensions-unchanged",
    "pipeline-state-unchanged",
    "transaction-state-unchanged",
    "feed-on-forbidden",
    "metadata-gate-only",
    "fail-closed",
  ] as const);

export const CONTROLLED_WORKSPACE_PRODUCTION_READINESS_BLOCKERS =
  Object.freeze([
    PHASE_AW_R5_PRODUCTION_READINESS_ONLY,
    "AW_R6_FEED_ON_AUTHORIZATION_DEFERRED",
  ] as const);

export type ControlledWorkspaceProductionReadinessInput = {
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutionAllowed: true;
  readonly issuancePipelineExecutable: true;
  readonly issuancePipelineState: "AUTHORITY_TRANSITIONED";
  readonly issuanceTransactionState: "AUTHORITY_COMMITTED";
  readonly workspaceVisible: true;
  readonly workspaceHostMounted: true;
  readonly workspaceCandidateRendered: true;
  readonly workspaceReactInstancePresent: true;
  readonly runtimeCapabilityPresent: true;
  readonly runtimeHostInstancePresent: true;
  readonly activationHandlePresent: true;
  readonly executionHandlePresent: true;
  readonly owner: "workspace";
  readonly writer: "workspace";
  readonly renderer: "workspace";
  readonly requestAuthority: "workspace";
  readonly paginationAuthority: "workspace";
  readonly cacheAuthority: "workspace";
  readonly observerAuthority: "workspace";
  readonly lifecycleAuthority: "workspace";
  readonly geoFeedAuthorityTransferred: true;
  readonly renderActivation: true;
  readonly feedOnAuthorized: false;
  readonly productionPromotionAuthorized: false;
};

export type ControlledWorkspaceProductionReadinessDescriptor = Omit<
  ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor,
  | "schemaVersion"
  | "phase"
  | "previousPhase"
  | "currentPhase"
  | "nextEligibleStep"
  | "title"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "activationBlocker"
  | "conditions"
  | "satisfiedConditions"
  | "guards"
  | "satisfiedGuards"
  | "blockers"
  | "rollbackTargetPhase"
  | "rollbackMode"
  | "rollbackRestoresLegacyAuthority"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R5";
  readonly previousPhase: "AW-R4";
  readonly currentPhase: "AW-R5";
  readonly nextEligibleStep: "AW-R6";
  readonly title: "Production Readiness";
  readonly activationProductionReadinessId: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID;
  readonly activationProductionReadinessContractId: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID;
  readonly candidateActivationState: "PRODUCTION_READY_NOT_RELEASED";
  readonly candidateActivationResult: "controlled-workspace-production-ready-feed-off";
  readonly productionReadinessCertified: true;
  readonly architectureProductionReady: true;
  readonly releaseBlockersRemain: false;
  readonly readyForFinalActivation: true;
  readonly rollbackTargetPhase: "AW-R4";
  readonly rollbackMode: "metadata-gate-only";
  readonly rollbackRestoresWorkspaceAuthority: true;
  readonly activationBlocker: typeof PHASE_AW_R5_PRODUCTION_READINESS_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONDITIONS;
  readonly guards: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_GUARDS;
  readonly blockers: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_BLOCKERS;
};

export type ControlledWorkspaceProductionReadinessEvaluation = {
  readonly descriptor: Readonly<ControlledWorkspaceProductionReadinessDescriptor>;
  readonly diagnostics: Readonly<Record<string, unknown>>;
};

function validateProductionReadinessInput(
  input?: ControlledWorkspaceProductionReadinessInput,
): void {
  if (!input || typeof input !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_INPUT",
      "The complete sealed AW-R4 input is required",
    );
  }
  if (
    input.activationExecutionAllowed !== true ||
    input.issuancePipelineExecutionAllowed !== true ||
    input.issuancePipelineExecutable !== true ||
    input.issuancePipelineState !== "AUTHORITY_TRANSITIONED" ||
    input.issuanceTransactionState !== "AUTHORITY_COMMITTED" ||
    input.workspaceVisible !== true ||
    input.workspaceHostMounted !== true ||
    input.workspaceCandidateRendered !== true ||
    input.workspaceReactInstancePresent !== true ||
    input.runtimeCapabilityPresent !== true ||
    input.runtimeHostInstancePresent !== true ||
    input.activationHandlePresent !== true ||
    input.executionHandlePresent !== true ||
    input.owner !== "workspace" ||
    input.writer !== "workspace" ||
    input.renderer !== "workspace" ||
    input.requestAuthority !== "workspace" ||
    input.paginationAuthority !== "workspace" ||
    input.cacheAuthority !== "workspace" ||
    input.observerAuthority !== "workspace" ||
    input.lifecycleAuthority !== "workspace" ||
    input.geoFeedAuthorityTransferred !== true ||
    input.renderActivation !== true ||
    input.feedOnAuthorized !== false ||
    input.productionPromotionAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_DUPLICATE_OR_PARTIAL",
      "AW-R5 requires the exact workspace-authority AW-R4 state",
    );
  }
}

export function validateControlledWorkspaceProductionReadinessDescriptor(
  d: ControlledWorkspaceProductionReadinessDescriptor,
): ControlledWorkspaceProductionReadinessDescriptor {
  if (
    d.phase !== "AW-R5" ||
    d.previousPhase !== "AW-R4" ||
    d.currentPhase !== "AW-R5" ||
    d.nextEligibleStep !== "AW-R6" ||
    d.title !== "Production Readiness" ||
    d.candidateActivationState !== "PRODUCTION_READY_NOT_RELEASED" ||
    d.candidateActivationResult !==
      "controlled-workspace-production-ready-feed-off"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_PHASE",
      "AW-R5 phase chain and lifecycle must be exact",
    );
  }
  if (
    d.activationExecutionAllowed !== true ||
    d.issuancePipelineExecutionAllowed !== true ||
    d.issuancePipelineExecutable !== true ||
    d.issuancePipelineState !== "AUTHORITY_TRANSITIONED" ||
    d.issuanceTransactionState !== "AUTHORITY_COMMITTED" ||
    d.workspaceVisible !== true ||
    d.workspaceHostMounted !== true ||
    d.workspaceCandidateRendered !== true ||
    d.workspaceReactInstancePresent !== true ||
    d.runtimeCapabilityPresent !== true ||
    d.runtimeHostInstancePresent !== true ||
    d.activationHandlePresent !== true ||
    d.executionHandlePresent !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_CAPABILITY_FLAGS",
      "AW-R5 capability fields must remain exact from AW-R4",
    );
  }
  if (
    d.owner !== "workspace" ||
    d.writer !== "workspace" ||
    d.renderer !== "workspace" ||
    d.requestAuthority !== "workspace" ||
    d.paginationAuthority !== "workspace" ||
    d.cacheAuthority !== "workspace" ||
    d.observerAuthority !== "workspace" ||
    d.lifecycleAuthority !== "workspace" ||
    d.geoFeedAuthorityTransferred !== true ||
    d.renderActivation !== true ||
    d.feedOnAuthorized !== false ||
    d.productionPromotionAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_AUTHORITY",
      "Authority dimensions must remain committed to Workspace while Feed ON stays closed",
    );
  }
  if (
    d.productionReadinessCertified !== true ||
    d.architectureProductionReady !== true ||
    d.releaseBlockersRemain !== false ||
    d.readyForFinalActivation !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_CERTIFICATION",
      "Production readiness certification fields must be exact",
    );
  }
  if (
    d.mountCount !== 1 ||
    d.geoFeedRenderCount !== 1 ||
    d.unmountCount !== 0 ||
    d.geoFeedInstanceCount !== 1 ||
    d.containsGeoFeed !== false ||
    d.mountsGeoFeed !== false ||
    d.wrapsGeoFeed !== false ||
    d.duplicatesGeoFeed !== false ||
    d.createsSecondGeoFeed !== false ||
    d.stableMountId !== "feed.discovery.controlled-host.stable-mount.v1" ||
    d.stableMountIdentityPreserved !== true ||
    d.requestIdentityPreserved !== true ||
    d.feedStatePreserved !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_IDENTITY",
      "GeoFeed, request and feed-state identity must remain stable",
    );
  }
  if (
    d.legacyAuthorityActive !== false ||
    d.targetAuthorityActive !== true ||
    d.authorityCommitBoundary !== "COMMITTED" ||
    d.dualOwnerForbidden !== true ||
    d.dualWriterForbidden !== true ||
    d.dualRendererForbidden !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_DUAL_AUTHORITY",
      "The committed state must make dual authority impossible",
    );
  }
  if (
    d.rollbackTargetPhase !== "AW-R4" ||
    d.rollbackMode !== "metadata-gate-only" ||
    d.rollbackPreservesGeoFeedIdentity !== true ||
    d.rollbackPreservesRequestIdentity !== true ||
    d.rollbackRestoresWorkspaceAuthority !== true ||
    d.activationBlocker !== PHASE_AW_R5_PRODUCTION_READINESS_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_METADATA",
      "Rollback and gate metadata must be exact",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceProductionReadiness(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceProductionReadinessInput,
): ControlledWorkspaceProductionReadinessEvaluation {
  validateProductionReadinessInput(input);
  const predecessor = evaluateControlledWorkspaceGeoFeedAuthorityTransition(
    registry,
    {
      activationExecutionAllowed: true,
      issuancePipelineExecutionAllowed: true,
      issuancePipelineExecutable: true,
      issuancePipelineState: "CONTROLLED_EXECUTABLE",
      issuanceTransactionState: "CONTROLLED_EXECUTION",
      workspaceVisible: true,
      workspaceHostMounted: true,
      workspaceCandidateRendered: true,
      workspaceReactInstancePresent: true,
      runtimeCapabilityPresent: true,
      runtimeHostInstancePresent: true,
      activationHandlePresent: true,
      executionHandlePresent: true,
      owner: "legacy",
      writer: "legacy",
      renderer: "legacy",
      geoFeedAuthorityTransferred: false,
      renderActivation: false,
      feedOnAuthorized: false,
    },
  );
  const pred = predecessor.descriptor;
  if (
    pred.phase !== "AW-R4" ||
    pred.previousPhase !== "AW-R3" ||
    pred.candidateActivationState !==
      "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON" ||
    pred.owner !== "workspace" ||
    pred.writer !== "workspace" ||
    pred.renderer !== "workspace" ||
    pred.requestAuthority !== "workspace" ||
    pred.paginationAuthority !== "workspace" ||
    pred.cacheAuthority !== "workspace" ||
    pred.observerAuthority !== "workspace" ||
    pred.lifecycleAuthority !== "workspace" ||
    pred.geoFeedAuthorityTransferred !== true ||
    pred.renderActivation !== true ||
    pred.feedOnAuthorized !== false ||
    pred.productionPromotionAuthorized !== false ||
    pred.issuancePipelineState !== "AUTHORITY_TRANSITIONED" ||
    pred.issuanceTransactionState !== "AUTHORITY_COMMITTED" ||
    pred.workspaceVisible !== true ||
    pred.runtimeCapabilityPresent !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_PREDECESSOR",
      "Predecessor must be the complete sealed AW-R4 state",
    );
  }

  const descriptor = Object.freeze({
    ...pred,
    schemaVersion: CONTROLLED_WORKSPACE_PRODUCTION_READINESS_SCHEMA_VERSION,
    phase: "AW-R5",
    previousPhase: "AW-R4",
    currentPhase: "AW-R5",
    nextEligibleStep: "AW-R6",
    title: "Production Readiness",
    activationProductionReadinessId:
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID,
    activationProductionReadinessContractId:
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
    candidateActivationState: "PRODUCTION_READY_NOT_RELEASED",
    candidateActivationResult: "controlled-workspace-production-ready-feed-off",
    productionReadinessCertified: true,
    architectureProductionReady: true,
    releaseBlockersRemain: false,
    readyForFinalActivation: true,
    feedOnAuthorized: false,
    productionPromotionAuthorized: false,
    containsGeoFeed: false,
    mountsGeoFeed: false,
    wrapsGeoFeed: false,
    duplicatesGeoFeed: false,
    createsSecondGeoFeed: false,
    mountCount: 1,
    geoFeedRenderCount: 1,
    unmountCount: 0,
    stableMountId: "feed.discovery.controlled-host.stable-mount.v1",
    stableMountIdentityPreserved: true,
    rollbackTargetPhase: "AW-R4",
    rollbackMode: "metadata-gate-only",
    rollbackPreservesGeoFeedIdentity: true,
    rollbackPreservesRequestIdentity: true,
    rollbackRestoresWorkspaceAuthority: true,
    activationBlocker: PHASE_AW_R5_PRODUCTION_READINESS_ONLY,
    conditions: CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONDITIONS,
    satisfiedConditions: CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONDITIONS,
    guards: CONTROLLED_WORKSPACE_PRODUCTION_READINESS_GUARDS,
    satisfiedGuards: CONTROLLED_WORKSPACE_PRODUCTION_READINESS_GUARDS,
    blockers: CONTROLLED_WORKSPACE_PRODUCTION_READINESS_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  } as const) as ControlledWorkspaceProductionReadinessDescriptor;
  validateControlledWorkspaceProductionReadinessDescriptor(descriptor);
  return Object.freeze({
    descriptor,
    diagnostics: Object.freeze({
      ...predecessor.diagnostics,
      currentPhase: "AW-R5",
      previousPhase: "AW-R4",
      nextEligibleStep: "AW-R6",
      productionReadinessMetaOk: true,
      predecessorIssuancePipelineState: "AUTHORITY_TRANSITIONED",
      predecessorIssuanceTransactionState: "AUTHORITY_COMMITTED",
      productionReadinessCertified: true,
      architectureProductionReady: true,
      releaseBlockersRemain: false,
      readyForFinalActivation: true,
      feedOnAuthorized: false,
      activationBlocker: PHASE_AW_R5_PRODUCTION_READINESS_ONLY,
    }),
  });
}

const AW_R4_PRODUCTION_READINESS_INPUT = Object.freeze({
  activationExecutionAllowed: true,
  issuancePipelineExecutionAllowed: true,
  issuancePipelineExecutable: true,
  issuancePipelineState: "AUTHORITY_TRANSITIONED",
  issuanceTransactionState: "AUTHORITY_COMMITTED",
  workspaceVisible: true,
  workspaceHostMounted: true,
  workspaceCandidateRendered: true,
  workspaceReactInstancePresent: true,
  runtimeCapabilityPresent: true,
  runtimeHostInstancePresent: true,
  activationHandlePresent: true,
  executionHandlePresent: true,
  owner: "workspace",
  writer: "workspace",
  renderer: "workspace",
  requestAuthority: "workspace",
  paginationAuthority: "workspace",
  cacheAuthority: "workspace",
  observerAuthority: "workspace",
  lifecycleAuthority: "workspace",
  geoFeedAuthorityTransferred: true,
  renderActivation: true,
  feedOnAuthorized: false,
  productionPromotionAuthorized: false,
} as const);

export function createControlledWorkspaceProductionReadinessDescriptor(): ControlledWorkspaceProductionReadinessDescriptor {
  return evaluateControlledWorkspaceProductionReadiness(
    createControlledHostRegistry(),
    AW_R4_PRODUCTION_READINESS_INPUT,
  ).descriptor;
}

export type ControlledWorkspaceProductionReadinessRollbackContract = {
  readonly phase: "AW-R4";
  readonly nextEligibleStep: "AW-R5";
  readonly candidateActivationState: "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON";
  readonly candidateActivationResult: "controlled-workspace-geofeed-authority-transitioned-not-production-on";
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutionAllowed: true;
  readonly issuancePipelineExecutable: true;
  readonly issuancePipelineState: "AUTHORITY_TRANSITIONED";
  readonly issuanceTransactionState: "AUTHORITY_COMMITTED";
  readonly workspaceVisible: true;
  readonly runtimeCapabilityPresent: true;
  readonly owner: "workspace";
  readonly writer: "workspace";
  readonly renderer: "workspace";
  readonly renderActivation: true;
  readonly geoFeedAuthorityTransferred: true;
  readonly feedOnAuthorized: false;
  readonly productionPromotionAuthorized: false;
  readonly mountCount: 1;
  readonly geoFeedRenderCount: 1;
  readonly unmountCount: 0;
};

export function createControlledWorkspaceProductionReadinessRollbackContract(): ControlledWorkspaceProductionReadinessRollbackContract {
  const d = evaluateControlledWorkspaceGeoFeedAuthorityTransition(
    createControlledHostRegistry(),
    {
      activationExecutionAllowed: true,
      issuancePipelineExecutionAllowed: true,
      issuancePipelineExecutable: true,
      issuancePipelineState: "CONTROLLED_EXECUTABLE",
      issuanceTransactionState: "CONTROLLED_EXECUTION",
      workspaceVisible: true,
      workspaceHostMounted: true,
      workspaceCandidateRendered: true,
      workspaceReactInstancePresent: true,
      runtimeCapabilityPresent: true,
      runtimeHostInstancePresent: true,
      activationHandlePresent: true,
      executionHandlePresent: true,
      owner: "legacy",
      writer: "legacy",
      renderer: "legacy",
      geoFeedAuthorityTransferred: false,
      renderActivation: false,
      feedOnAuthorized: false,
    },
  ).descriptor;
  return Object.freeze({
    phase: d.phase,
    nextEligibleStep: d.nextEligibleStep,
    candidateActivationState: d.candidateActivationState,
    candidateActivationResult: d.candidateActivationResult,
    activationExecutionAllowed: d.activationExecutionAllowed,
    issuancePipelineExecutionAllowed: d.issuancePipelineExecutionAllowed,
    issuancePipelineExecutable: d.issuancePipelineExecutable,
    issuancePipelineState: d.issuancePipelineState,
    issuanceTransactionState: d.issuanceTransactionState,
    workspaceVisible: d.workspaceVisible,
    runtimeCapabilityPresent: d.runtimeCapabilityPresent,
    owner: d.owner,
    writer: d.writer,
    renderer: d.renderer,
    renderActivation: d.renderActivation,
    geoFeedAuthorityTransferred: d.geoFeedAuthorityTransferred,
    feedOnAuthorized: d.feedOnAuthorized,
    productionPromotionAuthorized: d.productionPromotionAuthorized,
    mountCount: d.mountCount,
    geoFeedRenderCount: d.geoFeedRenderCount,
    unmountCount: d.unmountCount,
  });
}
