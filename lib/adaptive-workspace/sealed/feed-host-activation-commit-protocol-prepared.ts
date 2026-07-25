/**
 * Phase 3B.3.12 readiness / freeze-for-next-step after commit protocol.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationCommitProtocolPreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.12";
  status: "host-activation-commit-protocol-prepared";
  protocolContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  protocolResult: "protocol-complete-not-executable";
  protocolExecuted: false;
  wouldCommit: true;
  commitReady: true;
  commitBlocked: true;
  stageCount: number;
  readinessResult: "commit-ready-not-executable";
  transactionResult: "transaction-complete-not-committed";
  transactionCommitted: false;
  commitExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
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
  nextEligibleStep: "3B.3.13";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  commitAuthorized: false;
  protocolExecutionAuthorized: false;
  ownershipTransferAuthorized: false;
  writerTransferAuthorized: false;
  rendererTransferAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationCommitProtocolPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  stageCount: number;
}): FeedHostActivationCommitProtocolPreparedContract {
  return validateFeedHostActivationCommitProtocolPreparedContract({
    schemaVersion: FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.12",
    status: "host-activation-commit-protocol-prepared",
    protocolContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    protocolResult: "protocol-complete-not-executable",
    protocolExecuted: false,
    wouldCommit: true,
    commitReady: true,
    commitBlocked: true,
    stageCount: args.stageCount,
    readinessResult: "commit-ready-not-executable",
    transactionResult: "transaction-complete-not-committed",
    transactionCommitted: false,
    commitExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
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
    nextEligibleStep: "3B.3.13",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    commitAuthorized: false,
    protocolExecutionAuthorized: false,
    ownershipTransferAuthorized: false,
    writerTransferAuthorized: false,
    rendererTransferAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationCommitProtocolPreparedContract(
  candidate: unknown,
): FeedHostActivationCommitProtocolPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.12" ||
    c.status !== "host-activation-commit-protocol-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.12",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.transactionCommitted !== false ||
    c.commitExecuted !== false ||
    c.protocolExecuted !== false ||
    c.ownershipTransferred !== false ||
    c.writerTransferred !== false ||
    c.rendererTransferred !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_ACTIVATION",
      "activation/commit/protocol/transfer flags must be false",
    );
  }
  if (
    c.protocolResult !== "protocol-complete-not-executable" ||
    c.wouldCommit !== true ||
    c.commitReady !== true ||
    c.commitBlocked !== true ||
    c.readinessResult !== "commit-ready-not-executable" ||
    c.transactionResult !== "transaction-complete-not-committed" ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_RESULT",
      "protocol/commit/readiness/transaction/decision/plan/pipeline mismatch",
    );
  }
  if (typeof c.stageCount !== "number" || c.stageCount < 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_STAGES",
      "stageCount must be a positive number",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.13") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.13",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false ||
    c.commitAuthorized !== false ||
    c.protocolExecutionAuthorized !== false ||
    c.ownershipTransferAuthorized !== false ||
    c.writerTransferAuthorized !== false ||
    c.rendererTransferAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_MIGRATION",
      "migration/executor/scheduler/commit/protocol/transfer must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationCommitProtocolPreparedContract;
}
