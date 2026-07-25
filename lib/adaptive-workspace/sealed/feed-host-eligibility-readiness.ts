/**
 * Phase 3B.3.4 readiness / freeze-for-next-step contract.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ELIGIBILITY_READINESS_SCHEMA_VERSION = 1 as const;

export type FeedHostEligibilityReadinessContract = {
  schemaVersion: typeof FEED_HOST_ELIGIBILITY_READINESS_SCHEMA_VERSION;
  phase: "3B.3.4";
  status: "host-eligibility-prepared";
  eligibilityContract: "valid";
  identityContract: "valid";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  writer: "legacy";
  owner: "legacy";
  renderer: "legacy";
  rollbackFoundation: "prepared-not-active";
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.5";
  activeHostMigration: false;
  activeRendererMigration: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostEligibilityReadinessContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
}): FeedHostEligibilityReadinessContract {
  return validateFeedHostEligibilityReadinessContract({
    schemaVersion: FEED_HOST_ELIGIBILITY_READINESS_SCHEMA_VERSION,
    phase: "3B.3.4",
    status: "host-eligibility-prepared",
    eligibilityContract: "valid",
    identityContract: "valid",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    writer: "legacy",
    owner: "legacy",
    renderer: "legacy",
    rollbackFoundation: "prepared-not-active",
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.5",
    activeHostMigration: false,
    activeRendererMigration: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostEligibilityReadinessContract(
  candidate: unknown,
): FeedHostEligibilityReadinessContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_INVALID",
      "Readiness contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_HOST_ELIGIBILITY_READINESS_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_SCHEMA",
      "Unsupported readiness schemaVersion",
    );
  }
  if (c.phase !== "3B.3.4" || c.status !== "host-eligibility-prepared") {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_PHASE",
      "phase/status mismatch for 3B.3.4",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_ACTIVATION",
      "activation flags must be false",
    );
  }
  if (
    c.writer !== "legacy" ||
    c.owner !== "legacy" ||
    c.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.5") {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_NEXT",
      "nextEligibleStep must be 3B.3.5",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_MIGRATION",
      "active host/renderer migration must be forbidden",
    );
  }
  if (c.browserProof !== "pass" || c.existing20Invariants !== "pass") {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_PROOF",
      "browserProof and existing20Invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIG_READINESS_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostEligibilityReadinessContract;
}
