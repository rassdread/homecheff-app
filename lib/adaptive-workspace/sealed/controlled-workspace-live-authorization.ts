/**
 * AW-R2 — Controlled Workspace LIVE Authorization.
 *
 * Metadata-only transition: activationExecutionAllowed is authorized false ->
 * true. Execution, Workspace, runtime and GeoFeed ownership remain closed.
 */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  evaluateControlledWorkspaceHostCandidatePreActivationSeal,
  type ControlledWorkspaceHostCandidatePreActivationSealDescriptor,
} from "./controlled-workspace-host-candidate-pre-activation-seal";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_SCHEMA_VERSION =
  1 as const;
export const PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY =
  "PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY" as const;
export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID =
  "feed.discovery.adaptive-workspace.host-live-authorization.v1" as const;
export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-live-authorization.contract.v1" as const;

export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONDITIONS =
  Object.freeze([
    "predecessor-aw-r1-pre-activation-seal-exact",
    "candidate-activation-executed-completed",
    "activation-execution-allowed-false-to-true",
    "allowed-does-not-imply-execution",
    "pipeline-non-executable",
    "transaction-opened",
    "workspace-runtime-absent",
    "legacy-geofeed-1-1-0",
  ] as const);

export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_GUARDS =
  Object.freeze([
    "predecessor-seal-exactness",
    "single-capability-transition",
    "metadata-only",
    "immutable-output",
    "fail-closed",
  ] as const);

export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_BLOCKERS =
  Object.freeze([
    PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY,
    "PHASE_3B3_31_RUNTIME_HOST_FORBIDDEN",
    "PHASE_3B3_31_RUNTIME_CAPABILITY_FORBIDDEN",
    "PHASE_3B3_31_WORKSPACE_RENDER_FORBIDDEN",
    "PHASE_3B3_31_PIPELINE_EXECUTION_FORBIDDEN",
  ] as const);

export type ControlledWorkspaceLiveAuthorizationInput = {
  readonly candidateActivationStarted: true;
  readonly candidateActivationExecuted: true;
  readonly candidateActivationCompleted: true;
  readonly activationExecutionAllowed: false;
};

export type ControlledWorkspaceLiveAuthorizationDescriptor =
  Omit<
    ReturnType<
      typeof evaluateControlledWorkspaceHostCandidatePreActivationSeal
    >["descriptor"],
    | "schemaVersion"
    | "phase"
    | "previousPhase"
    | "currentPhase"
    | "nextEligibleStep"
    | "title"
    | "candidateActivationState"
    | "candidateActivationResult"
    | "activationExecutionAllowed"
    | "activationBlocker"
    | "conditions"
    | "satisfiedConditions"
    | "guards"
    | "satisfiedGuards"
    | "blockers"
  > & {
    readonly schemaVersion: 1;
    readonly phase: "AW-R2";
    readonly previousPhase: "AW-R1";
    readonly currentPhase: "AW-R2";
    readonly nextEligibleStep: "AW-R3";
    readonly title: "Controlled LIVE Authorization";
    readonly activationLiveAuthorizationId: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID;
    readonly activationLiveAuthorizationContractId: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID;
    readonly candidateActivationState: "LIVE_AUTHORIZED_NOT_EXECUTABLE";
    readonly candidateActivationResult: "controlled-workspace-live-authorized-not-executable";
    readonly candidateActivationStarted: true;
    readonly candidateActivationExecuted: true;
    readonly candidateActivationCompleted: true;
    readonly activationExecutionAllowed: true;
    readonly workspaceReactInstancePresent: false;
    readonly rollbackTargetAllowed: false;
    readonly rollbackMode: "metadata-gate-only";
    readonly rollbackPreservesGeoFeedIdentity: true;
    readonly activationBlocker: typeof PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY;
    readonly conditions: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONDITIONS;
    readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONDITIONS;
    readonly guards: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_GUARDS;
    readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_GUARDS;
    readonly blockers: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_BLOCKERS;
  };

export type ControlledWorkspaceLiveAuthorizationEvaluation = {
  readonly descriptor: Readonly<ControlledWorkspaceLiveAuthorizationDescriptor>;
  readonly diagnostics: Readonly<Record<string, unknown>>;
};

function validateTransitionInput(
  input?: ControlledWorkspaceLiveAuthorizationInput,
): void {
  if (!input || typeof input !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_INPUT",
      "AW-R1 sealed predecessor input is required",
    );
  }
  if (
    !Object.prototype.hasOwnProperty.call(input, "activationExecutionAllowed") ||
    input.activationExecutionAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_DUPLICATE",
      "Allowed must be present and exactly false before authorization",
    );
  }
  if (
    input.candidateActivationStarted !== true ||
    input.candidateActivationExecuted !== true ||
    input.candidateActivationCompleted !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_PREDECESSOR_INPUT",
      "Started, Executed and Completed must be sealed true",
    );
  }
}

export function validateControlledWorkspaceLiveAuthorizationDescriptor(
  d: ControlledWorkspaceLiveAuthorizationDescriptor,
): ControlledWorkspaceLiveAuthorizationDescriptor {
  if (
    d.phase !== "AW-R2" ||
    d.previousPhase !== "AW-R1" ||
    d.currentPhase !== "AW-R2" ||
    d.nextEligibleStep !== "AW-R3" ||
    d.candidateActivationState !== "LIVE_AUTHORIZED_NOT_EXECUTABLE" ||
    d.candidateActivationResult !==
      "controlled-workspace-live-authorized-not-executable"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_PHASE",
      "Phase chain and lifecycle must be exact",
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
    d.issuancePipelineExecutionAllowed !== false ||
    d.issuancePipelineExecutable !== false ||
    d.issuancePipelineState !== "NON_EXECUTABLE" ||
    d.issuanceTransactionState !== "OPENED" ||
    d.workspaceVisible !== false ||
    d.workspaceHostMounted !== false ||
    d.workspaceCandidateRendered !== false ||
    d.workspaceReactInstancePresent !== false ||
    d.runtimeCapabilityPresent !== false ||
    d.runtimeHostInstancePresent !== false ||
    d.activationHandlePresent !== false ||
    d.executionHandlePresent !== false ||
    d.hostActivation !== false ||
    d.renderActivation !== false ||
    d.canStartActivation !== false ||
    d.rollbackTargetAllowed !== false ||
    d.rollbackMode !== "metadata-gate-only" ||
    d.rollbackPreservesGeoFeedIdentity !== true ||
    d.mountCount !== 1 ||
    d.geoFeedRenderCount !== 1 ||
    d.unmountCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_FLAGS",
      "Allowed=true must preserve closed execution/runtime/workspace/GeoFeed invariants",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceLiveAuthorization(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceLiveAuthorizationInput,
): ControlledWorkspaceLiveAuthorizationEvaluation {
  validateTransitionInput(input);
  const predecessor = evaluateControlledWorkspaceHostCandidatePreActivationSeal(
    registry,
    { candidateActivationStarted: true },
  );
  const pred = predecessor.descriptor;
  if (
    pred.phase !== "AW-R1" ||
    pred.candidateActivationState !== "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE" ||
    pred.candidateActivationResult !==
      "controlled-workspace-host-candidate-pre-activation-sealed-not-live" ||
    pred.candidateActivationStarted !== true ||
    pred.candidateActivationExecuted !== true ||
    pred.candidateActivationCompleted !== true ||
    pred.activationExecutionAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_PREDECESSOR",
      "Predecessor must be the complete AW-R1 seal with Allowed=false",
    );
  }
  const descriptor = Object.freeze({
    ...pred,
    schemaVersion:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_SCHEMA_VERSION,
    phase: "AW-R2",
    previousPhase: "AW-R1",
    currentPhase: "AW-R2",
    nextEligibleStep: "AW-R3",
    title: "Controlled LIVE Authorization",
    activationLiveAuthorizationId:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID,
    activationLiveAuthorizationContractId:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
    candidateActivationState: "LIVE_AUTHORIZED_NOT_EXECUTABLE",
    candidateActivationResult:
      "controlled-workspace-live-authorized-not-executable",
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationExecutionAllowed: true,
    workspaceReactInstancePresent: false,
    rollbackTargetAllowed: false,
    rollbackMode: "metadata-gate-only",
    rollbackPreservesGeoFeedIdentity: true,
    activationBlocker: PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY,
    conditions:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONDITIONS,
    satisfiedConditions:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONDITIONS,
    guards: CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_GUARDS,
    satisfiedGuards:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_GUARDS,
    blockers: CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  } as const) as ControlledWorkspaceLiveAuthorizationDescriptor;
  validateControlledWorkspaceLiveAuthorizationDescriptor(descriptor);
  return Object.freeze({
    descriptor,
    diagnostics: Object.freeze({
      ...predecessor.diagnostics,
      currentPhase: "AW-R2",
      previousPhase: "AW-R1",
      nextEligibleStep: "AW-R3",
      controlledLiveAuthorizationMetaOk: true,
      candidateActivationStarted: true,
      candidateActivationExecuted: true,
      candidateActivationCompleted: true,
      activationExecutionAllowed: true,
      rollbackTargetAllowed: false,
      rollbackMode: "metadata-gate-only",
      rollbackPreservesGeoFeedIdentity: true,
      activationBlocker: PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY,
      predecessorActivationBlocker:
        "PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY",
    }),
  });
}

export function createControlledWorkspaceLiveAuthorizationDescriptor(): ControlledWorkspaceLiveAuthorizationDescriptor {
  return evaluateControlledWorkspaceLiveAuthorization(
    createControlledHostRegistry(),
    {
      candidateActivationStarted: true,
      candidateActivationExecuted: true,
      candidateActivationCompleted: true,
      activationExecutionAllowed: false,
    },
  ).descriptor;
}

export type ControlledWorkspaceLiveAuthorizationRollbackContract = Pick<
  ControlledWorkspaceHostCandidatePreActivationSealDescriptor,
  | "phase"
  | "nextEligibleStep"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "activationExecutionAllowed"
  | "owner"
  | "writer"
  | "renderer"
  | "mountCount"
  | "geoFeedRenderCount"
  | "unmountCount"
>;

export function createControlledWorkspaceLiveAuthorizationRollbackContract(): ControlledWorkspaceLiveAuthorizationRollbackContract {
  const predecessor =
    evaluateControlledWorkspaceHostCandidatePreActivationSeal(
      createControlledHostRegistry(),
      { candidateActivationStarted: true },
    ).descriptor;
  return Object.freeze({
    phase: predecessor.phase,
    nextEligibleStep: predecessor.nextEligibleStep,
    candidateActivationState: predecessor.candidateActivationState,
    candidateActivationResult: predecessor.candidateActivationResult,
    activationExecutionAllowed: predecessor.activationExecutionAllowed,
    owner: predecessor.owner,
    writer: predecessor.writer,
    renderer: predecessor.renderer,
    mountCount: predecessor.mountCount,
    geoFeedRenderCount: predecessor.geoFeedRenderCount,
    unmountCount: predecessor.unmountCount,
  });
}
