/**
 * Phase 3B.3.15 readiness / freeze-for-next-step after transition selection.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionSelectionPreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.15";
  status: "host-activation-transition-selection-prepared";
  selectionContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  selectionState: "completed";
  selectionResult: "transition-selected-not-executable";
  selectionCompleted: true;
  selectionExecuted: false;
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  selectedTransition: "COMMIT_READY->ACTIVE";
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  transitionExecuted: false;
  graphTraversalExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  wouldCommit: true;
  commitReady: true;
  candidateCount: number;
  eligibleCount: number;
  ineligibleCount: number;
  graphResult: "transition-graph-complete-not-executable";
  machineResult: "state-machine-complete-not-executable";
  protocolResult: "protocol-complete-not-executable";
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  writer: "legacy";
  owner: "legacy";
  renderer: "legacy";
  rollbackFoundation: "prepared-not-active";
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.16";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  commitAuthorized: false;
  graphTraversalAuthorized: false;
  transitionExecutionAuthorized: false;
  selectionExecutionAuthorized: false;
  protocolExecutionAuthorized: false;
  ownershipTransferAuthorized: false;
  writerTransferAuthorized: false;
  rendererTransferAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationTransitionSelectionPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  candidateCount: number;
  eligibleCount: number;
  ineligibleCount: number;
}): FeedHostActivationTransitionSelectionPreparedContract {
  return validateFeedHostActivationTransitionSelectionPreparedContract({
    schemaVersion:
      FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.15",
    status: "host-activation-transition-selection-prepared",
    selectionContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    selectionState: "completed",
    selectionResult: "transition-selected-not-executable",
    selectionCompleted: true,
    selectionExecuted: false,
    currentState: "COMMIT_READY",
    currentNode: "COMMIT_READY",
    selectedTransition: "COMMIT_READY->ACTIVE",
    selectedFromState: "COMMIT_READY",
    selectedToState: "ACTIVE",
    transitionExecuted: false,
    graphTraversalExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    wouldCommit: true,
    commitReady: true,
    candidateCount: args.candidateCount,
    eligibleCount: args.eligibleCount,
    ineligibleCount: args.ineligibleCount,
    graphResult: "transition-graph-complete-not-executable",
    machineResult: "state-machine-complete-not-executable",
    protocolResult: "protocol-complete-not-executable",
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    pipelineResult: "pipeline-complete-not-executable",
    wouldActivate: true,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    writer: "legacy",
    owner: "legacy",
    renderer: "legacy",
    rollbackFoundation: "prepared-not-active",
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.16",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    commitAuthorized: false,
    graphTraversalAuthorized: false,
    transitionExecutionAuthorized: false,
    selectionExecutionAuthorized: false,
    protocolExecutionAuthorized: false,
    ownershipTransferAuthorized: false,
    writerTransferAuthorized: false,
    rendererTransferAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationTransitionSelectionPreparedContract(
  candidate: unknown,
): FeedHostActivationTransitionSelectionPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.15" ||
    c.status !== "host-activation-transition-selection-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.15",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.transactionCommitted !== false ||
    c.protocolExecuted !== false ||
    c.transitionExecuted !== false ||
    c.graphTraversalExecuted !== false ||
    c.selectionExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_ACTIVATION",
      "activation/commit/protocol/transition/traversal/selection flags must be false",
    );
  }
  if (
    c.selectionState !== "completed" ||
    c.selectionResult !== "transition-selected-not-executable" ||
    c.selectionCompleted !== true ||
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.selectedTransition !== "COMMIT_READY->ACTIVE" ||
    c.wouldCommit !== true ||
    c.commitReady !== true ||
    c.machineResult !== "state-machine-complete-not-executable" ||
    c.protocolResult !== "protocol-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_RESULT",
      "selection/current/machine/protocol/decision/plan/pipeline mismatch",
    );
  }
  if (
    typeof c.candidateCount !== "number" ||
    c.candidateCount < 1 ||
    typeof c.eligibleCount !== "number" ||
    c.eligibleCount < 1 ||
    typeof c.ineligibleCount !== "number" ||
    c.ineligibleCount < 1
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_COUNTS",
      "candidate/eligible/ineligible counts must be positive",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.16") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.16",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false ||
    c.commitAuthorized !== false ||
    c.graphTraversalAuthorized !== false ||
    c.transitionExecutionAuthorized !== false ||
    c.selectionExecutionAuthorized !== false ||
    c.protocolExecutionAuthorized !== false ||
    c.ownershipTransferAuthorized !== false ||
    c.writerTransferAuthorized !== false ||
    c.rendererTransferAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_MIGRATION",
      "migration/executor/scheduler/commit/traversal/selection must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationTransitionSelectionPreparedContract;
}
