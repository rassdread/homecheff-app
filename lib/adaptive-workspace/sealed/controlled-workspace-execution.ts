/**
 * AW-R3 — Controlled Execution.
 *
 * Atomically opens the metadata-only Workspace execution capability while
 * preserving the existing single legacy GeoFeed mount and render authority.
 */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  evaluateControlledWorkspaceLiveAuthorization,
  type ControlledWorkspaceLiveAuthorizationDescriptor,
} from "./controlled-workspace-live-authorization";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_EXECUTION_SCHEMA_VERSION = 1 as const;
export const PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY =
  "PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY" as const;
export const CONTROLLED_WORKSPACE_EXECUTION_ID =
  "feed.discovery.adaptive-workspace.host-controlled-execution.v1" as const;
export const CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-controlled-execution.contract.v1" as const;

export const CONTROLLED_WORKSPACE_EXECUTION_CONDITIONS = Object.freeze([
  "predecessor-aw-r2-live-authorization-exact",
  "candidate-lifecycle-complete",
  "allowed-already-authorized",
  "pipeline-controlled-executable",
  "transaction-controlled-execution",
  "workspace-runtime-capability-present",
  "stable-mount-identity-preserved",
  "legacy-geofeed-authority-preserved",
] as const);

export const CONTROLLED_WORKSPACE_EXECUTION_GUARDS = Object.freeze([
  "atomic-capability-pack",
  "metadata-only-handles",
  "no-geofeed-authority-transfer",
  "immutable-output",
  "fail-closed",
] as const);

export const CONTROLLED_WORKSPACE_EXECUTION_BLOCKERS = Object.freeze([
  PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY,
  "AW_R4_GEOFEED_AUTHORITY_TRANSFER_DEFERRED",
  "FEED_ON_AUTHORIZATION_FORBIDDEN",
] as const);

export type ControlledWorkspaceExecutionInput = {
  readonly candidateActivationStarted: true;
  readonly candidateActivationExecuted: true;
  readonly candidateActivationCompleted: true;
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutionAllowed: false;
  readonly issuancePipelineExecutable: false;
  readonly issuancePipelineState: "NON_EXECUTABLE";
  readonly issuanceTransactionState: "OPENED";
  readonly workspaceVisible: false;
  readonly workspaceHostMounted: false;
  readonly workspaceCandidateRendered: false;
  readonly workspaceReactInstancePresent: false;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly executionHandlePresent: false;
  readonly hostActivation: false;
  readonly canStartActivation: false;
  readonly renderActivation: false;
};

export type ControlledWorkspaceExecutionDescriptor = Omit<
  ControlledWorkspaceLiveAuthorizationDescriptor,
  | "schemaVersion"
  | "phase"
  | "previousPhase"
  | "currentPhase"
  | "nextEligibleStep"
  | "title"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "issuancePipelineExecutionAllowed"
  | "issuancePipelineExecutable"
  | "issuancePipelineState"
  | "issuanceTransactionState"
  | "workspaceVisible"
  | "workspaceHostMounted"
  | "workspaceCandidateRendered"
  | "workspaceReactInstancePresent"
  | "runtimeCapabilityPresent"
  | "runtimeHostInstancePresent"
  | "activationHandlePresent"
  | "executionHandlePresent"
  | "hostActivation"
  | "canStartActivation"
  | "activationBlocker"
  | "conditions"
  | "satisfiedConditions"
  | "guards"
  | "satisfiedGuards"
  | "blockers"
  | "rollbackMode"
  | "rollbackPreservesGeoFeedIdentity"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R3";
  readonly previousPhase: "AW-R2";
  readonly currentPhase: "AW-R3";
  readonly nextEligibleStep: "AW-R4";
  readonly title: "Controlled Execution";
  readonly activationControlledExecutionId: typeof CONTROLLED_WORKSPACE_EXECUTION_ID;
  readonly activationControlledExecutionContractId: typeof CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID;
  readonly candidateActivationState: "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY";
  readonly candidateActivationResult: "controlled-workspace-executing-geofeed-legacy-authority";
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
  readonly hostActivation: true;
  readonly canStartActivation: true;
  readonly renderActivation: false;
  readonly containsGeoFeed: false;
  readonly mountsGeoFeed: false;
  readonly wrapsGeoFeed: false;
  readonly duplicatesGeoFeed: false;
  readonly createsSecondGeoFeed: false;
  readonly stableMountId: "feed.discovery.controlled-host.stable-mount.v1";
  readonly stableMountIdentityPreserved: true;
  readonly workspaceExecutionAuthorized: true;
  readonly geoFeedAuthorityTransferred: false;
  readonly feedOnAuthorized: false;
  readonly productionPromotionAuthorized: false;
  readonly workspaceRuntimeHandleId: "feed.discovery.adaptive-workspace.workspace-runtime-handle.v1";
  readonly workspaceActivationHandleId: "feed.discovery.adaptive-workspace.workspace-activation-handle.v1";
  readonly workspaceExecutionHandleId: "feed.discovery.adaptive-workspace.workspace-execution-handle.v1";
  readonly rollbackTargetPhase: "AW-R2";
  readonly rollbackMode: "metadata-gate-only";
  readonly rollbackPreservesGeoFeedIdentity: true;
  readonly rollbackRestoresExecutable: false;
  readonly rollbackRestoresPipelineState: "NON_EXECUTABLE";
  readonly rollbackRestoresTransactionState: "OPENED";
  readonly rollbackRestoresWorkspaceAbsent: true;
  readonly rollbackRestoresRuntimeAbsent: true;
  readonly activationBlocker: typeof PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY;
  readonly conditions: typeof CONTROLLED_WORKSPACE_EXECUTION_CONDITIONS;
  readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_EXECUTION_CONDITIONS;
  readonly guards: typeof CONTROLLED_WORKSPACE_EXECUTION_GUARDS;
  readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_EXECUTION_GUARDS;
  readonly blockers: typeof CONTROLLED_WORKSPACE_EXECUTION_BLOCKERS;
};

export type ControlledWorkspaceExecutionEvaluation = {
  readonly descriptor: Readonly<ControlledWorkspaceExecutionDescriptor>;
  readonly diagnostics: Readonly<Record<string, unknown>>;
};

function validateTransitionInput(input?: ControlledWorkspaceExecutionInput): void {
  if (!input || typeof input !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_INPUT",
      "The complete sealed AW-R2 input is required",
    );
  }
  if (
    input.candidateActivationStarted !== true ||
    input.candidateActivationExecuted !== true ||
    input.candidateActivationCompleted !== true ||
    input.activationExecutionAllowed !== true ||
    input.issuancePipelineExecutionAllowed !== false ||
    input.issuancePipelineExecutable !== false ||
    input.issuancePipelineState !== "NON_EXECUTABLE" ||
    input.issuanceTransactionState !== "OPENED" ||
    input.workspaceVisible !== false ||
    input.workspaceHostMounted !== false ||
    input.workspaceCandidateRendered !== false ||
    input.workspaceReactInstancePresent !== false ||
    input.runtimeCapabilityPresent !== false ||
    input.runtimeHostInstancePresent !== false ||
    input.activationHandlePresent !== false ||
    input.executionHandlePresent !== false ||
    input.hostActivation !== false ||
    input.canStartActivation !== false ||
    input.renderActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_DUPLICATE_OR_PARTIAL",
      "AW-R3 requires the exact non-executable, Workspace-absent AW-R2 state",
    );
  }
}

export function validateControlledWorkspaceExecutionDescriptor(
  d: ControlledWorkspaceExecutionDescriptor,
): ControlledWorkspaceExecutionDescriptor {
  if (
    d.phase !== "AW-R3" ||
    d.previousPhase !== "AW-R2" ||
    d.currentPhase !== "AW-R3" ||
    d.nextEligibleStep !== "AW-R4" ||
    d.candidateActivationState !==
      "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY" ||
    d.candidateActivationResult !==
      "controlled-workspace-executing-geofeed-legacy-authority"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_PHASE",
      "AW-R3 phase chain and lifecycle must be exact",
    );
  }
  if (
    d.candidateActivationStarted !== true ||
    d.candidateActivationExecuted !== true ||
    d.candidateActivationCompleted !== true ||
    d.candidateReady !== true ||
    d.candidateAuthorized !== true ||
    d.candidateActivated !== true ||
    d.candidateActive !== true ||
    d.candidateExecutable !== true ||
    d.activationExecutionAllowed !== true ||
    d.issuancePipelineExecutionAllowed !== true ||
    d.issuancePipelineExecutable !== true ||
    d.issuancePipelineState !== "CONTROLLED_EXECUTABLE" ||
    d.issuanceTransactionState !== "CONTROLLED_EXECUTION" ||
    d.workspaceVisible !== true ||
    d.workspaceHostMounted !== true ||
    d.workspaceCandidateRendered !== true ||
    d.workspaceReactInstancePresent !== true ||
    d.runtimeCapabilityPresent !== true ||
    d.runtimeHostInstancePresent !== true ||
    d.activationHandlePresent !== true ||
    d.executionHandlePresent !== true ||
    d.hostActivation !== true ||
    d.canStartActivation !== true ||
    d.renderActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_ATOMIC_FLAGS",
      "Controlled Execution capability fields must transition atomically",
    );
  }
  if (
    d.owner !== "legacy" ||
    d.writer !== "legacy" ||
    d.renderer !== "legacy" ||
    d.mountCount !== 1 ||
    d.geoFeedRenderCount !== 1 ||
    d.unmountCount !== 0 ||
    d.containsGeoFeed !== false ||
    d.mountsGeoFeed !== false ||
    d.wrapsGeoFeed !== false ||
    d.duplicatesGeoFeed !== false ||
    d.createsSecondGeoFeed !== false ||
    d.geoFeedAuthorityTransferred !== false ||
    d.feedOnAuthorized !== false ||
    d.productionPromotionAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_GEOFEED",
      "Controlled Execution must preserve legacy GeoFeed authority and identity",
    );
  }
  if (
    d.stableMountId !== "feed.discovery.controlled-host.stable-mount.v1" ||
    d.stableMountIdentityPreserved !== true ||
    d.workspaceExecutionAuthorized !== true ||
    d.workspaceRuntimeHandleId !==
      "feed.discovery.adaptive-workspace.workspace-runtime-handle.v1" ||
    d.workspaceActivationHandleId !==
      "feed.discovery.adaptive-workspace.workspace-activation-handle.v1" ||
    d.workspaceExecutionHandleId !==
      "feed.discovery.adaptive-workspace.workspace-execution-handle.v1" ||
    d.rollbackTargetPhase !== "AW-R2" ||
    d.rollbackMode !== "metadata-gate-only" ||
    d.rollbackPreservesGeoFeedIdentity !== true ||
    d.rollbackRestoresExecutable !== false ||
    d.rollbackRestoresPipelineState !== "NON_EXECUTABLE" ||
    d.rollbackRestoresTransactionState !== "OPENED" ||
    d.rollbackRestoresWorkspaceAbsent !== true ||
    d.rollbackRestoresRuntimeAbsent !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_METADATA",
      "Stable mount, handle and rollback metadata must be exact",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceExecution(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceExecutionInput,
): ControlledWorkspaceExecutionEvaluation {
  validateTransitionInput(input);
  const predecessor = evaluateControlledWorkspaceLiveAuthorization(registry, {
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationExecutionAllowed: false,
  });
  const pred = predecessor.descriptor;
  if (
    pred.phase !== "AW-R2" ||
    pred.candidateActivationState !== "LIVE_AUTHORIZED_NOT_EXECUTABLE" ||
    pred.activationExecutionAllowed !== true ||
    pred.issuancePipelineExecutionAllowed !== false ||
    pred.issuancePipelineExecutable !== false ||
    pred.issuancePipelineState !== "NON_EXECUTABLE" ||
    pred.issuanceTransactionState !== "OPENED" ||
    pred.workspaceVisible !== false ||
    pred.workspaceHostMounted !== false ||
    pred.workspaceCandidateRendered !== false ||
    pred.workspaceReactInstancePresent !== false ||
    pred.runtimeCapabilityPresent !== false ||
    pred.runtimeHostInstancePresent !== false ||
    pred.activationHandlePresent !== false ||
    pred.executionHandlePresent !== false ||
    pred.hostActivation !== false ||
    pred.canStartActivation !== false ||
    pred.renderActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_PREDECESSOR",
      "Predecessor must be the complete sealed AW-R2 state",
    );
  }

  const descriptor = Object.freeze({
    ...pred,
    schemaVersion: CONTROLLED_WORKSPACE_EXECUTION_SCHEMA_VERSION,
    phase: "AW-R3",
    previousPhase: "AW-R2",
    currentPhase: "AW-R3",
    nextEligibleStep: "AW-R4",
    title: "Controlled Execution",
    activationControlledExecutionId: CONTROLLED_WORKSPACE_EXECUTION_ID,
    activationControlledExecutionContractId:
      CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID,
    candidateActivationState:
      "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY",
    candidateActivationResult:
      "controlled-workspace-executing-geofeed-legacy-authority",
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
    hostActivation: true,
    canStartActivation: true,
    renderActivation: false,
    containsGeoFeed: false,
    mountsGeoFeed: false,
    wrapsGeoFeed: false,
    duplicatesGeoFeed: false,
    createsSecondGeoFeed: false,
    stableMountId: "feed.discovery.controlled-host.stable-mount.v1",
    stableMountIdentityPreserved: true,
    workspaceExecutionAuthorized: true,
    geoFeedAuthorityTransferred: false,
    feedOnAuthorized: false,
    productionPromotionAuthorized: false,
    workspaceRuntimeHandleId:
      "feed.discovery.adaptive-workspace.workspace-runtime-handle.v1",
    workspaceActivationHandleId:
      "feed.discovery.adaptive-workspace.workspace-activation-handle.v1",
    workspaceExecutionHandleId:
      "feed.discovery.adaptive-workspace.workspace-execution-handle.v1",
    rollbackTargetPhase: "AW-R2",
    rollbackMode: "metadata-gate-only",
    rollbackPreservesGeoFeedIdentity: true,
    rollbackRestoresExecutable: false,
    rollbackRestoresPipelineState: "NON_EXECUTABLE",
    rollbackRestoresTransactionState: "OPENED",
    rollbackRestoresWorkspaceAbsent: true,
    rollbackRestoresRuntimeAbsent: true,
    activationBlocker: PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY,
    conditions: CONTROLLED_WORKSPACE_EXECUTION_CONDITIONS,
    satisfiedConditions: CONTROLLED_WORKSPACE_EXECUTION_CONDITIONS,
    guards: CONTROLLED_WORKSPACE_EXECUTION_GUARDS,
    satisfiedGuards: CONTROLLED_WORKSPACE_EXECUTION_GUARDS,
    blockers: CONTROLLED_WORKSPACE_EXECUTION_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  } as const) as ControlledWorkspaceExecutionDescriptor;
  validateControlledWorkspaceExecutionDescriptor(descriptor);
  return Object.freeze({
    descriptor,
    diagnostics: Object.freeze({
      ...predecessor.diagnostics,
      currentPhase: "AW-R3",
      previousPhase: "AW-R2",
      nextEligibleStep: "AW-R4",
      controlledWorkspaceExecutionMetaOk: true,
      activationExecutionAllowed: true,
      issuancePipelineExecutable: true,
      issuancePipelineState: "CONTROLLED_EXECUTABLE",
      issuanceTransactionState: "CONTROLLED_EXECUTION",
      workspaceExecutionAuthorized: true,
      geoFeedAuthorityTransferred: false,
      activationBlocker: PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY,
      predecessorActivationBlocker:
        "PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY",
    }),
  });
}

export function createControlledWorkspaceExecutionDescriptor(): ControlledWorkspaceExecutionDescriptor {
  return evaluateControlledWorkspaceExecution(createControlledHostRegistry(), {
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
}

export type ControlledWorkspaceExecutionRollbackContract = {
  readonly phase: "AW-R2";
  readonly nextEligibleStep: "AW-R3";
  readonly candidateActivationState: "LIVE_AUTHORIZED_NOT_EXECUTABLE";
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutionAllowed: false;
  readonly issuancePipelineExecutable: false;
  readonly issuancePipelineState: "NON_EXECUTABLE";
  readonly issuanceTransactionState: "OPENED";
  readonly workspaceVisible: false;
  readonly workspaceHostMounted: false;
  readonly workspaceCandidateRendered: false;
  readonly workspaceReactInstancePresent: false;
  readonly runtimeCapabilityPresent: false;
  readonly runtimeHostInstancePresent: false;
  readonly activationHandlePresent: false;
  readonly executionHandlePresent: false;
  readonly owner: "legacy";
  readonly writer: "legacy";
  readonly renderer: "legacy";
  readonly mountCount: 1;
  readonly geoFeedRenderCount: 1;
  readonly unmountCount: 0;
};

export function createControlledWorkspaceExecutionRollbackContract(): ControlledWorkspaceExecutionRollbackContract {
  const d = evaluateControlledWorkspaceLiveAuthorization(
    createControlledHostRegistry(),
    {
      candidateActivationStarted: true,
      candidateActivationExecuted: true,
      candidateActivationCompleted: true,
      activationExecutionAllowed: false,
    },
  ).descriptor;
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
    workspaceHostMounted: d.workspaceHostMounted,
    workspaceCandidateRendered: d.workspaceCandidateRendered,
    workspaceReactInstancePresent: d.workspaceReactInstancePresent,
    runtimeCapabilityPresent: d.runtimeCapabilityPresent,
    runtimeHostInstancePresent: d.runtimeHostInstancePresent,
    activationHandlePresent: d.activationHandlePresent,
    executionHandlePresent: d.executionHandlePresent,
    owner: d.owner,
    writer: d.writer,
    renderer: d.renderer,
    mountCount: d.mountCount,
    geoFeedRenderCount: d.geoFeedRenderCount,
    unmountCount: d.unmountCount,
  });
}
