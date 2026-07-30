/**
 * Phase 3B.3.16 readiness / freeze-for-next-step after transition preflight.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionPreflightPreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.16";
  status: "host-activation-transition-preflight-prepared";
  preflightContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  preflightState: "completed";
  preflightResult: "transition-preflight-ready-not-authorized";
  preflightCompleted: true;
  preflightReady: true;
  preflightBlocked: true;
  preflightExecuted: false;
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  selectedTransition: "COMMIT_READY->ACTIVE";
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  selectionResult: "transition-selected-not-executable";
  selectionCompleted: true;
  selectionExecuted: false;
  transitionAuthorized: false;
  authorizationGranted: false;
  transitionExecuted: false;
  graphTraversalExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  wouldCommit: true;
  commitReady: true;
  checkCount: number;
  passedCount: number;
  failedCount: 0;
  warningCount: 0;
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
  nextEligibleStep: "3B.3.17";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  commitAuthorized: false;
  graphTraversalAuthorized: false;
  transitionExecutionAuthorized: false;
  selectionExecutionAuthorized: false;
  preflightExecutionAuthorized: false;
  transitionAuthorizationAuthorized: false;
  protocolExecutionAuthorized: false;
  ownershipTransferAuthorized: false;
  writerTransferAuthorized: false;
  rendererTransferAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationTransitionPreflightPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  checkCount: number;
  passedCount: number;
}): FeedHostActivationTransitionPreflightPreparedContract {
  return validateFeedHostActivationTransitionPreflightPreparedContract({
    schemaVersion:
      FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.16",
    status: "host-activation-transition-preflight-prepared",
    preflightContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    preflightState: "completed",
    preflightResult: "transition-preflight-ready-not-authorized",
    preflightCompleted: true,
    preflightReady: true,
    preflightBlocked: true,
    preflightExecuted: false,
    currentState: "COMMIT_READY",
    currentNode: "COMMIT_READY",
    selectedTransition: "COMMIT_READY->ACTIVE",
    selectedFromState: "COMMIT_READY",
    selectedToState: "ACTIVE",
    selectionResult: "transition-selected-not-executable",
    selectionCompleted: true,
    selectionExecuted: false,
    transitionAuthorized: false,
    authorizationGranted: false,
    transitionExecuted: false,
    graphTraversalExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    wouldCommit: true,
    commitReady: true,
    checkCount: args.checkCount,
    passedCount: args.passedCount,
    failedCount: 0,
    warningCount: 0,
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
    nextEligibleStep: "3B.3.17",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    commitAuthorized: false,
    graphTraversalAuthorized: false,
    transitionExecutionAuthorized: false,
    selectionExecutionAuthorized: false,
    preflightExecutionAuthorized: false,
    transitionAuthorizationAuthorized: false,
    protocolExecutionAuthorized: false,
    ownershipTransferAuthorized: false,
    writerTransferAuthorized: false,
    rendererTransferAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationTransitionPreflightPreparedContract(
  candidate: unknown,
): FeedHostActivationTransitionPreflightPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.16" ||
    c.status !== "host-activation-transition-preflight-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.16",
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
    c.selectionExecuted !== false ||
    c.preflightExecuted !== false ||
    c.transitionAuthorized !== false ||
    c.authorizationGranted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_ACTIVATION",
      "activation/commit/protocol/transition/traversal/selection/preflight flags must be false",
    );
  }
  if (
    c.preflightState !== "completed" ||
    c.preflightResult !== "transition-preflight-ready-not-authorized" ||
    c.preflightCompleted !== true ||
    c.preflightReady !== true ||
    c.preflightBlocked !== true ||
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
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_RESULT",
      "preflight/selection/current/machine/protocol/decision/plan/pipeline mismatch",
    );
  }
  if (
    typeof c.checkCount !== "number" ||
    c.checkCount < 1 ||
    typeof c.passedCount !== "number" ||
    c.passedCount < 1 ||
    c.failedCount !== 0 ||
    c.warningCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_COUNTS",
      "check/passed/failed/warning counts must be valid",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.17") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.17",
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
    c.preflightExecutionAuthorized !== false ||
    c.transitionAuthorizationAuthorized !== false ||
    c.protocolExecutionAuthorized !== false ||
    c.ownershipTransferAuthorized !== false ||
    c.writerTransferAuthorized !== false ||
    c.rendererTransferAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_MIGRATION",
      "migration/executor/scheduler/commit/traversal/selection/preflight must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationTransitionPreflightPreparedContract;
}
