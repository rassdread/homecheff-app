/**
 * Phase 3B.3.10 readiness / freeze-for-next-step after activation transaction.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransactionPreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.10";
  status: "host-activation-transaction-prepared";
  transactionContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  transactionResult: "transaction-complete-not-committed";
  wouldCommit: true;
  transactionCommitted: false;
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
  nextEligibleStep: "3B.3.11";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  commitAuthorized: false;
  rollbackExecutionAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationTransactionPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
}): FeedHostActivationTransactionPreparedContract {
  return validateFeedHostActivationTransactionPreparedContract({
    schemaVersion: FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.10",
    status: "host-activation-transaction-prepared",
    transactionContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    transactionResult: "transaction-complete-not-committed",
    wouldCommit: true,
    transactionCommitted: false,
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
    nextEligibleStep: "3B.3.11",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    commitAuthorized: false,
    rollbackExecutionAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationTransactionPreparedContract(
  candidate: unknown,
): FeedHostActivationTransactionPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !== FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.10" ||
    c.status !== "host-activation-transaction-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.10",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.transactionCommitted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_ACTIVATION",
      "activation flags and transactionCommitted must be false",
    );
  }
  if (
    c.transactionResult !== "transaction-complete-not-committed" ||
    c.wouldCommit !== true ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_RESULT",
      "transaction/decision/plan/pipeline/wouldActivate mismatch",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.11") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.11",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false ||
    c.commitAuthorized !== false ||
    c.rollbackExecutionAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_MIGRATION",
      "migration/executor/scheduler/commit/rollback must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationTransactionPreparedContract;
}
