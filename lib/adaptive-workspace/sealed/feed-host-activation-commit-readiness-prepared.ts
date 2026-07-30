/**
 * Phase 3B.3.11 readiness / freeze-for-next-step after commit readiness.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationCommitReadinessPreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.11";
  status: "host-activation-commit-readiness-prepared";
  readinessContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  readinessResult: "commit-ready-not-executable";
  wouldCommit: true;
  commitReady: true;
  commitBlocked: true;
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
  nextEligibleStep: "3B.3.12";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  commitAuthorized: false;
  ownershipTransferAuthorized: false;
  writerTransferAuthorized: false;
  rendererTransferAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationCommitReadinessPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
}): FeedHostActivationCommitReadinessPreparedContract {
  return validateFeedHostActivationCommitReadinessPreparedContract({
    schemaVersion: FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.11",
    status: "host-activation-commit-readiness-prepared",
    readinessContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    readinessResult: "commit-ready-not-executable",
    wouldCommit: true,
    commitReady: true,
    commitBlocked: true,
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
    nextEligibleStep: "3B.3.12",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    commitAuthorized: false,
    ownershipTransferAuthorized: false,
    writerTransferAuthorized: false,
    rendererTransferAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationCommitReadinessPreparedContract(
  candidate: unknown,
): FeedHostActivationCommitReadinessPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.11" ||
    c.status !== "host-activation-commit-readiness-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.11",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.transactionCommitted !== false ||
    c.commitExecuted !== false ||
    c.ownershipTransferred !== false ||
    c.writerTransferred !== false ||
    c.rendererTransferred !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_ACTIVATION",
      "activation/commit/transfer flags must be false",
    );
  }
  if (
    c.readinessResult !== "commit-ready-not-executable" ||
    c.wouldCommit !== true ||
    c.commitReady !== true ||
    c.commitBlocked !== true ||
    c.transactionResult !== "transaction-complete-not-committed" ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_RESULT",
      "readiness/commit/transaction/decision/plan/pipeline mismatch",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.12") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.12",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false ||
    c.commitAuthorized !== false ||
    c.ownershipTransferAuthorized !== false ||
    c.writerTransferAuthorized !== false ||
    c.rendererTransferAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_MIGRATION",
      "migration/executor/scheduler/commit/transfer must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationCommitReadinessPreparedContract;
}
