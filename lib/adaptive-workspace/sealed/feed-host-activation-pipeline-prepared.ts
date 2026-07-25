/**
 * Phase 3B.3.9 readiness / freeze-for-next-step contract after activation pipeline.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_PIPELINE_PREPARED_SCHEMA_VERSION = 1 as const;

export type FeedHostActivationPipelinePreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_PIPELINE_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.9";
  status: "host-activation-pipeline-prepared";
  pipelineContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  pipelineResult: "pipeline-complete-not-executable";
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  wouldActivate: true;
  stageCount: number;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  writer: "legacy";
  owner: "legacy";
  renderer: "legacy";
  rollbackFoundation: "prepared-not-active";
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.10";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  stageExecutionAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationPipelinePreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  stageCount: number;
}): FeedHostActivationPipelinePreparedContract {
  return validateFeedHostActivationPipelinePreparedContract({
    schemaVersion: FEED_HOST_ACTIVATION_PIPELINE_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.9",
    status: "host-activation-pipeline-prepared",
    pipelineContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    pipelineResult: "pipeline-complete-not-executable",
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    wouldActivate: true,
    stageCount: args.stageCount,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    writer: "legacy",
    owner: "legacy",
    renderer: "legacy",
    rollbackFoundation: "prepared-not-active",
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.10",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    stageExecutionAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationPipelinePreparedContract(
  candidate: unknown,
): FeedHostActivationPipelinePreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !== FEED_HOST_ACTIVATION_PIPELINE_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.9" ||
    c.status !== "host-activation-pipeline-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.9",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_ACTIVATION",
      "activation flags must be false",
    );
  }
  if (
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.wouldActivate !== true ||
    typeof c.stageCount !== "number" ||
    c.stageCount < 1
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_RESULT",
      "pipeline/decision/plan/wouldActivate/stageCount mismatch",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.10") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.10",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false ||
    c.stageExecutionAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_MIGRATION",
      "migration/executor/scheduler/stage execution must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationPipelinePreparedContract;
}
