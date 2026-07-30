/**
 * AW-R1 — Controlled Workspace Host Candidate Pre-Activation Seal.
 *
 * Metadata-only transition: candidateActivationExecuted and
 * candidateActivationCompleted are sealed absent -> true together.
 */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  evaluateControlledWorkspaceHostCandidateExecutionStarted,
  type ControlledWorkspaceHostCandidateExecutionStartedInput,
} from "./controlled-workspace-host-candidate-execution-started";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_SCHEMA_VERSION =
  1 as const;
export const PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY =
  "PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY" as const;
export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID =
  "feed.discovery.adaptive-workspace.host-candidate-pre-activation-seal.v1" as const;
export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID =
  "feed.discovery.adaptive-workspace.host-candidate-pre-activation-seal.contract.v1" as const;

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONDITIONS =
  Object.freeze([
    "predecessor-execution-started-exact",
    "candidate-activation-started",
    "candidate-activation-executed-absent",
    "candidate-activation-completed-absent",
    "live-activation-closed",
    "pipeline-non-executable",
    "transaction-opened",
    "workspace-runtime-absent",
    "legacy-geofeed-1-1-0",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_GUARDS =
  Object.freeze([
    "predecessor-exactness",
    "atomic-executed-completed-seal",
    "metadata-only",
    "immutable-output",
    "fail-closed",
  ] as const);

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_BLOCKERS =
  Object.freeze([
    PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY,
    "PHASE_3B3_31_RUNTIME_HOST_FORBIDDEN",
    "PHASE_3B3_31_RUNTIME_CAPABILITY_FORBIDDEN",
    "PHASE_3B3_31_WORKSPACE_RENDER_FORBIDDEN",
    "PHASE_3B3_31_PIPELINE_EXECUTION_FORBIDDEN",
  ] as const);

export type ControlledWorkspaceHostCandidatePreActivationSealInput =
  ControlledWorkspaceHostCandidateExecutionStartedInput;

export type ControlledWorkspaceHostCandidatePreActivationSealDescriptor =
  Omit<
    ReturnType<
      typeof evaluateControlledWorkspaceHostCandidateExecutionStarted
    >["descriptor"],
    | "schemaVersion"
    | "phase"
    | "previousPhase"
    | "currentPhase"
    | "nextEligibleStep"
    | "candidateActivationState"
    | "candidateActivationResult"
    | "activationBlocker"
    | "conditions"
    | "satisfiedConditions"
    | "guards"
    | "satisfiedGuards"
    | "blockers"
  > & {
    readonly schemaVersion: 1;
    readonly phase: "AW-R1";
    readonly previousPhase: "3B.3.47";
    readonly currentPhase: "AW-R1";
    readonly nextEligibleStep: "AW-R2";
    readonly title: "Controlled Workspace Host Candidate Pre-Activation Seal";
    readonly activationCandidatePreActivationSealId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID;
    readonly activationCandidatePreActivationSealContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID;
    readonly candidateActivationState: "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE";
    readonly candidateActivationResult: "controlled-workspace-host-candidate-pre-activation-sealed-not-live";
    readonly candidateActivationStarted: true;
    readonly candidateActivationExecuted: true;
    readonly candidateActivationCompleted: true;
    readonly activationBlocker: typeof PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY;
    readonly conditions: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONDITIONS;
    readonly satisfiedConditions: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONDITIONS;
    readonly guards: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_GUARDS;
    readonly satisfiedGuards: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_GUARDS;
    readonly blockers: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_BLOCKERS;
  };

export type ControlledWorkspaceHostCandidatePreActivationSealEvaluation = {
  readonly descriptor: Readonly<ControlledWorkspaceHostCandidatePreActivationSealDescriptor>;
  readonly diagnostics: Readonly<Record<string, unknown>>;
};

function rejectPreAdvanced(
  input?: ControlledWorkspaceHostCandidatePreActivationSealInput,
): void {
  if (!input) return;
  if (
    Object.prototype.hasOwnProperty.call(input, "candidateActivationExecuted") ||
    Object.prototype.hasOwnProperty.call(input, "candidateActivationCompleted")
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_DUPLICATE",
      "Executed and Completed must both be absent own properties",
    );
  }
  if (
    !Object.prototype.hasOwnProperty.call(input, "candidateActivationStarted") ||
    input.candidateActivationStarted !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_STARTED",
      "Started must be present and true",
    );
  }
}

export function validateControlledWorkspaceHostCandidatePreActivationSealDescriptor(
  d: ControlledWorkspaceHostCandidatePreActivationSealDescriptor,
): ControlledWorkspaceHostCandidatePreActivationSealDescriptor {
  if (
    d.phase !== "AW-R1" ||
    d.previousPhase !== "3B.3.47" ||
    d.currentPhase !== "AW-R1" ||
    d.nextEligibleStep !== "AW-R2" ||
    d.candidateActivationState !== "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE" ||
    d.candidateActivationResult !==
      "controlled-workspace-host-candidate-pre-activation-sealed-not-live"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_PHASE",
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
    d.activationExecutionAllowed !== false ||
    d.issuancePipelineExecutionAllowed !== false ||
    d.issuancePipelineExecutable !== false ||
    d.issuancePipelineState !== "NON_EXECUTABLE" ||
    d.issuanceTransactionState !== "OPENED" ||
    d.workspaceVisible !== false ||
    d.workspaceHostMounted !== false ||
    d.workspaceCandidateRendered !== false ||
    d.runtimeCapabilityPresent !== false ||
    d.runtimeHostInstancePresent !== false ||
    d.mountCount !== 1 ||
    d.geoFeedRenderCount !== 1 ||
    d.unmountCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_FLAGS",
      "Seal must preserve the closed LIVE/runtime/workspace/GeoFeed invariants",
    );
  }
  return d;
}

export function evaluateControlledWorkspaceHostCandidatePreActivationSeal(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
  input?: ControlledWorkspaceHostCandidatePreActivationSealInput,
): ControlledWorkspaceHostCandidatePreActivationSealEvaluation {
  rejectPreAdvanced(input);
  const predecessor = evaluateControlledWorkspaceHostCandidateExecutionStarted(
    registry,
  );
  const pred = predecessor.descriptor;
  if (
    pred.candidateActivationState !== "CANDIDATE_EXECUTION_STARTED_NOT_EXECUTED" ||
    pred.candidateActivationResult !==
      "controlled-workspace-host-candidate-execution-started-not-executed" ||
    pred.candidateActivationStarted !== true ||
    Object.prototype.hasOwnProperty.call(pred, "candidateActivationExecuted") ||
    Object.prototype.hasOwnProperty.call(pred, "candidateActivationCompleted")
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_PREDECESSOR",
      "Predecessor must be execution-started with Executed/Completed absent",
    );
  }
  const descriptor = Object.freeze({
    ...pred,
    schemaVersion:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_SCHEMA_VERSION,
    phase: "AW-R1",
    previousPhase: "3B.3.47",
    currentPhase: "AW-R1",
    nextEligibleStep: "AW-R2",
    title: "Controlled Workspace Host Candidate Pre-Activation Seal",
    activationCandidatePreActivationSealId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
    activationCandidatePreActivationSealContractId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
    candidateActivationState: "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE",
    candidateActivationResult:
      "controlled-workspace-host-candidate-pre-activation-sealed-not-live",
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationBlocker: PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY,
    conditions:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONDITIONS,
    satisfiedConditions:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONDITIONS,
    guards: CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_GUARDS,
    satisfiedGuards:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_GUARDS,
    blockers: CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_BLOCKERS,
    browserInvariantIds: FEED_SEALED_INVARIANT_IDS,
  } as const) as ControlledWorkspaceHostCandidatePreActivationSealDescriptor;
  validateControlledWorkspaceHostCandidatePreActivationSealDescriptor(descriptor);
  return Object.freeze({
    descriptor,
    diagnostics: Object.freeze({
      ...predecessor.diagnostics,
      currentPhase: "AW-R1",
      previousPhase: "3B.3.47",
      nextEligibleStep: "AW-R2",
      candidatePreActivationSealMetaOk: true,
      candidateActivationStarted: true,
      candidateActivationExecuted: true,
      candidateActivationCompleted: true,
      activationBlocker: PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY,
      predecessorActivationBlocker:
        "PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY",
    }),
  });
}

export function createControlledWorkspaceHostCandidatePreActivationSealDescriptor(): ControlledWorkspaceHostCandidatePreActivationSealDescriptor {
  return evaluateControlledWorkspaceHostCandidatePreActivationSeal(
    createControlledHostRegistry(),
    { candidateActivationStarted: true },
  ).descriptor;
}
