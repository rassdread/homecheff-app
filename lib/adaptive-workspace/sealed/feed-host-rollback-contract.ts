/**
 * Phase 3B.3.1 — rollback foundation (prepared-not-active).
 * Metadata only; does not wrap or control the legacy Feed mount.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ROLLBACK_SCHEMA_VERSION = 1 as const;

export const FEED_HOST_ROLLBACK_TRIGGER_TYPES = [
  "invariant-failure",
  "mount-count-gt-1",
  "unmount-during-stable-session",
  "extra-feed-request",
  "request-key-transition-by-host",
  "native-paint-key-transition-by-host",
  "pagination-reset",
  "cache-reset",
  "observer-duplication",
  "scroll-reset",
  "dom-mismatch",
  "hydration-warning",
  "ssr-mismatch",
  "performance-gate-failure",
  "runtime-exception",
  "renderer-registration-mismatch",
] as const;

export type FeedHostRollbackTriggerType =
  (typeof FEED_HOST_ROLLBACK_TRIGGER_TYPES)[number];

export type FeedHostRollbackContract = {
  schemaVersion: typeof FEED_HOST_ROLLBACK_SCHEMA_VERSION;
  rollbackTarget: "legacy";
  rollbackTriggerTypes: readonly FeedHostRollbackTriggerType[];
  rollbackReadiness: "prepared-not-active";
  fallbackMountOwner: "legacy";
  fallbackWriter: "legacy";
  identityPreservationRequirement: true;
  requestIdentityPreservationRequirement: true;
  statePreservationRequirement: true;
  scrollPreservationRequirement: true;
  proofRequirementAfterRollback: "rerun-release-blocking-invariants";
  activationStepWhereApplicable: "3B.3.2+";
};

export function createFeedHostRollbackContract(): FeedHostRollbackContract {
  return validateFeedHostRollbackContract({
    schemaVersion: FEED_HOST_ROLLBACK_SCHEMA_VERSION,
    rollbackTarget: "legacy",
    rollbackTriggerTypes: [...FEED_HOST_ROLLBACK_TRIGGER_TYPES],
    rollbackReadiness: "prepared-not-active",
    fallbackMountOwner: "legacy",
    fallbackWriter: "legacy",
    identityPreservationRequirement: true,
    requestIdentityPreservationRequirement: true,
    statePreservationRequirement: true,
    scrollPreservationRequirement: true,
    proofRequirementAfterRollback: "rerun-release-blocking-invariants",
    activationStepWhereApplicable: "3B.3.2+",
  });
}

export function validateFeedHostRollbackContract(
  candidate: unknown,
): FeedHostRollbackContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ROLLBACK_INVALID",
      "Rollback contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_HOST_ROLLBACK_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ROLLBACK_SCHEMA",
      "Unsupported rollback schemaVersion",
    );
  }
  if (c.rollbackTarget !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ROLLBACK_TARGET",
      "rollbackTarget must be legacy",
    );
  }
  if (c.fallbackMountOwner !== "legacy" || c.fallbackWriter !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ROLLBACK_FALLBACK",
      "fallback mount owner and writer must be legacy",
    );
  }
  if (c.rollbackReadiness !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ROLLBACK_READINESS",
      "rollbackReadiness must be prepared-not-active in 3B.3.1",
    );
  }
  if (!Array.isArray(c.rollbackTriggerTypes)) {
    throw new HardContractViolation(
      "FEED_HOST_ROLLBACK_TRIGGERS",
      "rollbackTriggerTypes must be an array",
    );
  }
  for (const t of FEED_HOST_ROLLBACK_TRIGGER_TYPES) {
    if (!(c.rollbackTriggerTypes as string[]).includes(t)) {
      throw new HardContractViolation(
        "FEED_HOST_ROLLBACK_TRIGGER_MISSING",
        `Missing rollback trigger: ${t}`,
      );
    }
  }
  return {
    schemaVersion: FEED_HOST_ROLLBACK_SCHEMA_VERSION,
    rollbackTarget: "legacy",
    rollbackTriggerTypes: [...FEED_HOST_ROLLBACK_TRIGGER_TYPES],
    rollbackReadiness: "prepared-not-active",
    fallbackMountOwner: "legacy",
    fallbackWriter: "legacy",
    identityPreservationRequirement: true,
    requestIdentityPreservationRequirement: true,
    statePreservationRequirement: true,
    scrollPreservationRequirement: true,
    proofRequirementAfterRollback: "rerun-release-blocking-invariants",
    activationStepWhereApplicable: "3B.3.2+",
  };
}
