/**
 * Phase 3B.3.2 readiness / freeze-for-next-step contract.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_SHADOW_PLACEMENT_READINESS_SCHEMA_VERSION = 1 as const;

export type FeedShadowPlacementReadinessContract = {
  schemaVersion: typeof FEED_SHADOW_PLACEMENT_READINESS_SCHEMA_VERSION;
  phase: "3B.3.2";
  status: "shadow-placement-prepared";
  shadowPlacementContract: "valid";
  identityContract: "valid";
  hostActivation: false;
  renderActivation: false;
  writer: "legacy";
  renderOwner: "legacy";
  rollbackFoundation: "prepared-not-active";
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.3";
  activeHostMigration: false;
  activeRendererMigration: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedShadowPlacementReadinessContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
}): FeedShadowPlacementReadinessContract {
  return validateFeedShadowPlacementReadinessContract({
    schemaVersion: FEED_SHADOW_PLACEMENT_READINESS_SCHEMA_VERSION,
    phase: "3B.3.2",
    status: "shadow-placement-prepared",
    shadowPlacementContract: "valid",
    identityContract: "valid",
    hostActivation: false,
    renderActivation: false,
    writer: "legacy",
    renderOwner: "legacy",
    rollbackFoundation: "prepared-not-active",
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.3",
    activeHostMigration: false,
    activeRendererMigration: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedShadowPlacementReadinessContract(
  candidate: unknown,
): FeedShadowPlacementReadinessContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_INVALID",
      "Readiness contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_SHADOW_PLACEMENT_READINESS_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_SCHEMA",
      "Unsupported readiness schemaVersion",
    );
  }
  if (c.phase !== "3B.3.2" || c.status !== "shadow-placement-prepared") {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_PHASE",
      "phase/status mismatch for 3B.3.2",
    );
  }
  if (c.hostActivation !== false || c.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_ACTIVATION",
      "hostActivation and renderActivation must be false",
    );
  }
  if (c.writer !== "legacy" || c.renderOwner !== "legacy") {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_OWNER",
      "writer and renderOwner must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.3") {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_NEXT",
      "nextEligibleStep must be 3B.3.3",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false
  ) {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_MIGRATION",
      "active host/renderer migration must be forbidden",
    );
  }
  if (c.browserProof !== "pass" || c.existing20Invariants !== "pass") {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_PROOF",
      "browserProof and existing20Invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_SHADOW_PLACEMENT_READINESS_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedShadowPlacementReadinessContract;
}
