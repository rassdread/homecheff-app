/**
 * AW-R4 — GeoFeed Authority Transition.
 *
 * Atomically transfers authority over the existing GeoFeed instance to the
 * Workspace host. This is metadata-only: Feed ON and production promotion stay
 * closed, and the stable 1/1/0 mount-render-unmount identity is preserved.
 */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  evaluateControlledWorkspaceExecution,
  type ControlledWorkspaceExecutionDescriptor,
} from "./controlled-workspace-execution";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_SCHEMA_VERSION =
  1 as const;
export const PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY =
  "PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY" as const;
export const CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID =
  "feed.discovery.adaptive-workspace.host-geofeed-authority-transition.v1" as const;
export const CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-geofeed-authority-transition.contract.v1" as const;

export const CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONDITIONS =
  Object.freeze([
    "predecessor-aw-r3-controlled-execution-exact",
    "legacy-authority-active-before-commit",
    "controlled-executable-pipeline",
    "controlled-execution-transaction",
    "workspace-runtime-capability-present",
    "stable-mount-identity-preserved",
    "feed-on-remains-closed",
  ] as const);

export const CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_GUARDS =
  Object.freeze([
    "atomic-authority-commit",
    "dual-owner-forbidden",
    "dual-writer-forbidden",
    "dual-renderer-forbidden",
    "same-geofeed-instance-only",
    "metadata-gate-only",
    "fail-closed",
  ] as const);

export const CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_BLOCKERS =
  Object.freeze([
    PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY,
    "AW_R5_PRODUCTION_PROMOTION_DEFERRED",
    "AW_R6_FEED_ON_AUTHORIZATION_DEFERRED",
  ] as const);

export type ControlledWorkspaceGeoFeedAuthorityTransitionInput = {
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutionAllowed: true;
  readonly issuancePipelineExecutable: true;
  readonly issuancePipelineState: "CONTROLLED_EXECUTABLE";
  readonly issuanceTransactionState: "CONTROLLED_EXECUTION";
  readonly workspaceVisible: true;
  readonly workspaceHostMounted: true;
  readonly workspaceCandidateRendered: true;
  readonly workspaceReactInstancePresent: true;
  readonly runtimeCapabilityPresent: true;
  readonly runtimeHostInstancePresent: true;
  readonly activationHandlePresent: true;
  readonly executionHandlePresent: true;
  readonly owner: "legacy";
  readonly writer: "legacy";
  readonly renderer: "legacy";
  readonly geoFeedAuthorityTransferred: false;
  readonly renderActivation: false;
  readonly feedOnAuthorized: false;
};

export type ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor = Omit<
  ControlledWorkspaceExecutionDescriptor,
  | "schemaVersion"
  | "phase"
  | "previousPhase"
  | "currentPhase"
  | "nextEligibleStep"
  | "title"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "issuancePipelineState"
  | "issuanceTransactionState"
  | "owner"
  | "writer"
  | "renderer"
  | "renderActivation"
  | "geoFeedAuthorityTransferred"
  | "activationBlocker"
  | "conditions"
  | "satisfiedConditions"
  | "guards"
  | "satisfiedGuards"
  | "blockers"
  | "rollbackTargetPhase"
  | "rollbackMode"
  | "rollbackPreservesGeoFeedIdentity"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R4";
  readonly previousPhase: "AW-R3";
  readonly currentPhase: "AW-R4";
  readonly nextEligibleStep: "AW-R5";
  readonly title: "GeoFeed Authority Transition";
  readonly activationGeoFeedAuthorityTransitionId: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID;
  readonly activationGeoFeedAuthorityTransitionContractId: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID;
  readonly candidateActivationState: "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON";
  readonly candidateActivationResult: "controlled-workspace-geofeed-authority-transitioned-not-production-on";
  readonly issuancePipelineState: "AUTHORITY_TRANSITIONED";
  readonly issuanceTransactionState: "AUTHORITY_COMMITTED";
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
  readonly legacyAuthorityActive: false;
  readonly targetAuthorityActive: true;
  readonly authorityCommitBoundary: "COMMITTED";
  readonly dualOwnerForbidden: true;
  readonly dualWriterForbidden: true;
  readonly dualRendererForbidden: true;
  readonly requestIdentityPreserved: true;
  readonly feedStatePreserved: true;
  readonly geoFeedInstanceCount: 1;
  readonly rollbackTargetPhase: "AW-R3";
  readonly rollbackMode: "metadata-gate-only";
  readonly rollbackPreservesGeoFeedIdentity: true;
  readonly rollbackPreservesRequestIdentity: true;
  readonly rollbackRestoresLegacyAuthority: true;
  readonly activationBlocker: typeof PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONDITIONS;
  readonly guards: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_GUARDS;
  readonly blockers: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_BLOCKERS;
};

export type ControlledWorkspaceGeoFeedAuthorityTransitionEvaluation = {
  readonly descriptor: Readonly<ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor>;
  readonly diagnostics: Readonly<Record<string, unknown>>;
};

function validateTransitionInput(
  input?: ControlledWorkspaceGeoFeedAuthorityTransitionInput,
): void {
  if (!input || typeof input !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_INPUT",
      "The complete sealed AW-R3 input is required",
    );
  }
  if (
    input.activationExecutionAllowed !== true ||
    input.issuancePipelineExecutionAllowed !== true ||
    input.issuancePipelineExecutable !== true ||
    input.issuancePipelineState !== "CONTROLLED_EXECUTABLE" ||
    input.issuanceTransactionState !== "CONTROLLED_EXECUTION" ||
    input.workspaceVisible !== true ||
    input.workspaceHostMounted !== true ||
    input.workspaceCandidateRendered !== true ||
    input.workspaceReactInstancePresent !== true ||
    input.runtimeCapabilityPresent !== true ||
    input.runtimeHostInstancePresent !== true ||
    input.activationHandlePresent !== true ||
    input.executionHandlePresent !== true ||
    input.owner !== "legacy" ||
    input.writer !== "legacy" ||
    input.renderer !== "legacy" ||
    input.geoFeedAuthorityTransferred !== false ||
    input.renderActivation !== false ||
    input.feedOnAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_DUPLICATE_OR_PARTIAL",
      "AW-R4 requires the exact legacy-authority AW-R3 state",
    );
  }
}

export function validateControlledWorkspaceGeoFeedAuthorityTransitionDescriptor(
  d: ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor,
): ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor {
  if (
    d.phase !== "AW-R4" ||
    d.previousPhase !== "AW-R3" ||
    d.currentPhase !== "AW-R4" ||
    d.nextEligibleStep !== "AW-R5" ||
    d.title !== "GeoFeed Authority Transition" ||
    d.candidateActivationState !==
      "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON" ||
    d.candidateActivationResult !==
      "controlled-workspace-geofeed-authority-transitioned-not-production-on"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_PHASE",
      "AW-R4 phase chain and lifecycle must be exact",
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
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_ATOMIC_FLAGS",
      "AW-R4 authority capability fields must transition atomically",
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
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_COMMIT",
      "All authority dimensions must commit to Workspace while Feed ON stays closed",
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
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_IDENTITY",
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
      "FEED_WORKSPACE_GEOFEED_DUAL_AUTHORITY",
      "The committed state must make dual authority impossible",
    );
  }
  if (
    d.rollbackTargetPhase !== "AW-R3" ||
    d.rollbackMode !== "metadata-gate-only" ||
    d.rollbackPreservesGeoFeedIdentity !== true ||
    d.rollbackPreservesRequestIdentity !== true ||
    d.rollbackRestoresLegacyAuthority !== true ||
    d.activationBlocker !== PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_METADATA",
      "Rollback and gate metadata must be exact",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceGeoFeedAuthorityTransition(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceGeoFeedAuthorityTransitionInput,
): ControlledWorkspaceGeoFeedAuthorityTransitionEvaluation {
  validateTransitionInput(input);
  const predecessor = evaluateControlledWorkspaceExecution(registry, {
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationExecutionAllowed: true,
    issuancePipelineExecutionAllowed: false,
    issuancePipelineExecutable: false,
    issuancePipelineState: "NON_EXECUTABLE",
    issuanceTransactionState: "OPENED",
    workspaceVisible: false,
    workspaceHostMounted: false,
    workspaceCandidateRendered: false,
    workspaceReactInstancePresent: false,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    activationHandlePresent: false,
    executionHandlePresent: false,
    hostActivation: false,
    canStartActivation: false,
    renderActivation: false,
  });
  const pred = predecessor.descriptor;
  if (
    pred.phase !== "AW-R3" ||
    pred.candidateActivationState !==
      "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY" ||
    pred.owner !== "legacy" ||
    pred.writer !== "legacy" ||
    pred.renderer !== "legacy" ||
    pred.geoFeedAuthorityTransferred !== false ||
    pred.renderActivation !== false ||
    pred.feedOnAuthorized !== false ||
    pred.issuancePipelineExecutable !== true ||
    pred.issuancePipelineState !== "CONTROLLED_EXECUTABLE" ||
    pred.issuanceTransactionState !== "CONTROLLED_EXECUTION" ||
    pred.workspaceVisible !== true ||
    pred.runtimeCapabilityPresent !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_PREDECESSOR",
      "Predecessor must be the complete sealed AW-R3 state",
    );
  }

  const descriptor = Object.freeze({
    ...pred,
    schemaVersion:
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_SCHEMA_VERSION,
    phase: "AW-R4",
    previousPhase: "AW-R3",
    currentPhase: "AW-R4",
    nextEligibleStep: "AW-R5",
    title: "GeoFeed Authority Transition",
    activationGeoFeedAuthorityTransitionId:
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID,
    activationGeoFeedAuthorityTransitionContractId:
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID,
    candidateActivationState:
      "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON",
    candidateActivationResult:
      "controlled-workspace-geofeed-authority-transitioned-not-production-on",
    issuancePipelineState: "AUTHORITY_TRANSITIONED",
    issuanceTransactionState: "AUTHORITY_COMMITTED",
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
    legacyAuthorityActive: false,
    targetAuthorityActive: true,
    authorityCommitBoundary: "COMMITTED",
    dualOwnerForbidden: true,
    dualWriterForbidden: true,
    dualRendererForbidden: true,
    requestIdentityPreserved: true,
    feedStatePreserved: true,
    geoFeedInstanceCount: 1,
    rollbackTargetPhase: "AW-R3",
    rollbackMode: "metadata-gate-only",
    rollbackPreservesGeoFeedIdentity: true,
    rollbackPreservesRequestIdentity: true,
    rollbackRestoresLegacyAuthority: true,
    activationBlocker: PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY,
    conditions: CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONDITIONS,
    satisfiedConditions:
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONDITIONS,
    guards: CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_GUARDS,
    satisfiedGuards:
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_GUARDS,
    blockers: CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  } as const) as ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor;
  validateControlledWorkspaceGeoFeedAuthorityTransitionDescriptor(descriptor);
  return Object.freeze({
    descriptor,
    diagnostics: Object.freeze({
      ...predecessor.diagnostics,
      currentPhase: "AW-R4",
      previousPhase: "AW-R3",
      nextEligibleStep: "AW-R5",
      geoFeedAuthorityTransitionMetaOk: true,
      predecessorIssuancePipelineState: "CONTROLLED_EXECUTABLE",
      predecessorIssuanceTransactionState: "CONTROLLED_EXECUTION",
      issuancePipelineState: "AUTHORITY_TRANSITIONED",
      issuanceTransactionState: "AUTHORITY_COMMITTED",
      geoFeedAuthorityTransferred: true,
      feedOnAuthorized: false,
      activationBlocker: PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY,
    }),
  });
}

const AW_R3_TRANSITION_INPUT = Object.freeze({
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
} as const);

export function createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor(): ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor {
  return evaluateControlledWorkspaceGeoFeedAuthorityTransition(
    createControlledHostRegistry(),
    AW_R3_TRANSITION_INPUT,
  ).descriptor;
}

export type ControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract = {
  readonly phase: "AW-R3";
  readonly nextEligibleStep: "AW-R4";
  readonly candidateActivationState: "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY";
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutionAllowed: true;
  readonly issuancePipelineExecutable: true;
  readonly issuancePipelineState: "CONTROLLED_EXECUTABLE";
  readonly issuanceTransactionState: "CONTROLLED_EXECUTION";
  readonly workspaceVisible: true;
  readonly runtimeCapabilityPresent: true;
  readonly owner: "legacy";
  readonly writer: "legacy";
  readonly renderer: "legacy";
  readonly renderActivation: false;
  readonly geoFeedAuthorityTransferred: false;
  readonly feedOnAuthorized: false;
  readonly mountCount: 1;
  readonly geoFeedRenderCount: 1;
  readonly unmountCount: 0;
};

export function createControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract(): ControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract {
  const d = evaluateControlledWorkspaceExecution(createControlledHostRegistry(), {
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationExecutionAllowed: true,
    issuancePipelineExecutionAllowed: false,
    issuancePipelineExecutable: false,
    issuancePipelineState: "NON_EXECUTABLE",
    issuanceTransactionState: "OPENED",
    workspaceVisible: false,
    workspaceHostMounted: false,
    workspaceCandidateRendered: false,
    workspaceReactInstancePresent: false,
    runtimeCapabilityPresent: false,
    runtimeHostInstancePresent: false,
    activationHandlePresent: false,
    executionHandlePresent: false,
    hostActivation: false,
    canStartActivation: false,
    renderActivation: false,
  }).descriptor;
  return Object.freeze({
    phase: d.phase,
    nextEligibleStep: d.nextEligibleStep,
    candidateActivationState: d.candidateActivationState,
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
    mountCount: d.mountCount,
    geoFeedRenderCount: d.geoFeedRenderCount,
    unmountCount: d.unmountCount,
  });
}
