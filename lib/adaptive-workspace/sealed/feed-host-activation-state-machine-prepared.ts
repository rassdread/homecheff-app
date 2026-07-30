/**
 * Phase 3B.3.13 readiness / freeze-for-next-step after state machine.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationStateMachinePreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.13";
  status: "host-activation-state-machine-prepared";
  machineContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  machineResult: "state-machine-complete-not-executable";
  currentState: "COMMIT_READY";
  transitionExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  wouldCommit: true;
  commitReady: true;
  allowedTransitionCount: number;
  blockedTransitionCount: number;
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
  nextEligibleStep: "3B.3.14";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  commitAuthorized: false;
  transitionExecutionAuthorized: false;
  protocolExecutionAuthorized: false;
  ownershipTransferAuthorized: false;
  writerTransferAuthorized: false;
  rendererTransferAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationStateMachinePreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  allowedTransitionCount: number;
  blockedTransitionCount: number;
}): FeedHostActivationStateMachinePreparedContract {
  return validateFeedHostActivationStateMachinePreparedContract({
    schemaVersion: FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.13",
    status: "host-activation-state-machine-prepared",
    machineContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    machineResult: "state-machine-complete-not-executable",
    currentState: "COMMIT_READY",
    transitionExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    wouldCommit: true,
    commitReady: true,
    allowedTransitionCount: args.allowedTransitionCount,
    blockedTransitionCount: args.blockedTransitionCount,
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
    nextEligibleStep: "3B.3.14",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    commitAuthorized: false,
    transitionExecutionAuthorized: false,
    protocolExecutionAuthorized: false,
    ownershipTransferAuthorized: false,
    writerTransferAuthorized: false,
    rendererTransferAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationStateMachinePreparedContract(
  candidate: unknown,
): FeedHostActivationStateMachinePreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.13" ||
    c.status !== "host-activation-state-machine-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.13",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.transactionCommitted !== false ||
    c.protocolExecuted !== false ||
    c.transitionExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_ACTIVATION",
      "activation/commit/protocol/transition flags must be false",
    );
  }
  if (
    c.machineResult !== "state-machine-complete-not-executable" ||
    c.currentState !== "COMMIT_READY" ||
    c.wouldCommit !== true ||
    c.commitReady !== true ||
    c.protocolResult !== "protocol-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_RESULT",
      "machine/current/protocol/decision/plan/pipeline mismatch",
    );
  }
  if (
    typeof c.allowedTransitionCount !== "number" ||
    c.allowedTransitionCount < 1 ||
    typeof c.blockedTransitionCount !== "number" ||
    c.blockedTransitionCount < 1
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_COUNTS",
      "allowed/blocked transition counts must be positive",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.14") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.14",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false ||
    c.commitAuthorized !== false ||
    c.transitionExecutionAuthorized !== false ||
    c.protocolExecutionAuthorized !== false ||
    c.ownershipTransferAuthorized !== false ||
    c.writerTransferAuthorized !== false ||
    c.rendererTransferAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_MIGRATION",
      "migration/executor/scheduler/commit/transition must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationStateMachinePreparedContract;
}
