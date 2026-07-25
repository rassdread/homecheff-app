/**
 * Phase 3B.3.3 — registration identity contract.
 * Freezes stable runtimeId + single-mount identity expectations.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";

export const FEED_HOST_REGISTRATION_IDENTITY_SCHEMA_VERSION = 1 as const;

export type FeedHostRegistrationIdentity = {
  schemaVersion: typeof FEED_HOST_REGISTRATION_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.3";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  expectedMountCount: 1;
  expectedUnmountCount: 0;
  expectedActiveInstanceCount: 1;
  expectedRendererRegistrationCount: 0;
  expectedOwner: "legacy";
  expectedWriter: "legacy";
  expectedRenderer: "legacy";
  runtimeIdTransitionAllowed: false;
  remountAllowed: false;
  identityTransitionAllowed: false;
  parentReplacementAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
};

export function createFeedHostRegistrationIdentity(): FeedHostRegistrationIdentity {
  return validateFeedHostRegistrationIdentity({
    schemaVersion: FEED_HOST_REGISTRATION_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.3",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    expectedMountCount: 1,
    expectedUnmountCount: 0,
    expectedActiveInstanceCount: 1,
    expectedRendererRegistrationCount: 0,
    expectedOwner: "legacy",
    expectedWriter: "legacy",
    expectedRenderer: "legacy",
    runtimeIdTransitionAllowed: false,
    remountAllowed: false,
    identityTransitionAllowed: false,
    parentReplacementAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
  });
}

export function validateFeedHostRegistrationIdentity(
  candidate: unknown,
): FeedHostRegistrationIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_REG_IDENTITY_INVALID",
      "Registration identity must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_HOST_REGISTRATION_IDENTITY_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_REG_IDENTITY_SCHEMA",
      "Unsupported registration identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.3") {
    throw new HardContractViolation(
      "FEED_HOST_REG_IDENTITY_PHASE",
      "phase must be 3B.3.3",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_REG_IDENTITY_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.expectedMountCount !== 1 ||
    c.expectedUnmountCount !== 0 ||
    c.expectedActiveInstanceCount !== 1 ||
    c.expectedRendererRegistrationCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_REG_IDENTITY_COUNTS",
      "mount/unmount/renderer counts must remain single-legacy",
    );
  }
  if (
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_REG_IDENTITY_OWNER",
      "owner/writer/renderer must remain legacy",
    );
  }
  for (const key of [
    "runtimeIdTransitionAllowed",
    "remountAllowed",
    "identityTransitionAllowed",
    "parentReplacementAllowed",
    "wrapperAllowed",
    "portalAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_REG_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedHostRegistrationIdentity;
}
