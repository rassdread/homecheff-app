/**
 * Phase 3B.3.8 readiness / freeze-for-next-step contract after activation plan.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_PLAN_PREPARED_SCHEMA_VERSION = 1 as const;

export type FeedHostActivationPlanPreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_PLAN_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.8";
  status: "host-activation-plan-prepared";
  planContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  plannedStepCount: number;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  writer: "legacy";
  owner: "legacy";
  renderer: "legacy";
  rollbackFoundation: "prepared-not-active";
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.9";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationPlanPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  plannedStepCount: number;
}): FeedHostActivationPlanPreparedContract {
  return validateFeedHostActivationPlanPreparedContract({
    schemaVersion: FEED_HOST_ACTIVATION_PLAN_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.8",
    status: "host-activation-plan-prepared",
    planContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    planResult: "plan-complete-not-executable",
    decisionResult: "ALLOW",
    wouldActivate: true,
    plannedStepCount: args.plannedStepCount,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    writer: "legacy",
    owner: "legacy",
    renderer: "legacy",
    rollbackFoundation: "prepared-not-active",
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.9",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationPlanPreparedContract(
  candidate: unknown,
): FeedHostActivationPlanPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_HOST_ACTIVATION_PLAN_PREPARED_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (c.phase !== "3B.3.8" || c.status !== "host-activation-plan-prepared") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.8",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_ACTIVATION",
      "activation flags must be false",
    );
  }
  if (
    c.planResult !== "plan-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.wouldActivate !== true ||
    typeof c.plannedStepCount !== "number" ||
    c.plannedStepCount < 1
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_RESULT",
      "planResult/decisionResult/wouldActivate/plannedStepCount mismatch",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.9") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.9",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_MIGRATION",
      "migration/executor/scheduler/runtime mutation must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationPlanPreparedContract;
}
