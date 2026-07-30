/**
 * Phase 3B.3.2 — identity contract for Controlled Host Shadow Placement.
 * Freezes legacy feed-mount identity expectations. No React/Feed imports.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_SHADOW_PLACEMENT_IDENTITY_SCHEMA_VERSION = 1 as const;

export type FeedHostShadowPlacementIdentity = {
  schemaVersion: typeof FEED_HOST_SHADOW_PLACEMENT_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.2";
  expectedMountCount: 1;
  expectedUnmountCount: 0;
  expectedActiveInstanceCount: 1;
  expectedRendererRegistrationCount: 0;
  expectedActiveRenderOwner: "legacy";
  expectedActiveWriter: "legacy";
  remountAllowed: false;
  lifecycleKeysAllowed: false;
  parentReplacementAllowed: false;
  wrapperAroundLegacyMountAllowed: false;
  portalAllowed: false;
  conditionalRemountAllowed: false;
  identityTransitionAllowed: false;
};

export function createFeedHostShadowPlacementIdentity(): FeedHostShadowPlacementIdentity {
  return validateFeedHostShadowPlacementIdentity({
    schemaVersion: FEED_HOST_SHADOW_PLACEMENT_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.2",
    expectedMountCount: 1,
    expectedUnmountCount: 0,
    expectedActiveInstanceCount: 1,
    expectedRendererRegistrationCount: 0,
    expectedActiveRenderOwner: "legacy",
    expectedActiveWriter: "legacy",
    remountAllowed: false,
    lifecycleKeysAllowed: false,
    parentReplacementAllowed: false,
    wrapperAroundLegacyMountAllowed: false,
    portalAllowed: false,
    conditionalRemountAllowed: false,
    identityTransitionAllowed: false,
  });
}

export function validateFeedHostShadowPlacementIdentity(
  candidate: unknown,
): FeedHostShadowPlacementIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_IDENTITY_INVALID",
      "Identity contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_HOST_SHADOW_PLACEMENT_IDENTITY_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_IDENTITY_SCHEMA",
      "Unsupported identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.2") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_IDENTITY_PHASE",
      "phase must be 3B.3.2",
    );
  }
  if (
    c.expectedMountCount !== 1 ||
    c.expectedUnmountCount !== 0 ||
    c.expectedActiveInstanceCount !== 1 ||
    c.expectedRendererRegistrationCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_IDENTITY_COUNTS",
      "mount/unmount/renderer identity counts must remain single-legacy",
    );
  }
  if (
    c.expectedActiveRenderOwner !== "legacy" ||
    c.expectedActiveWriter !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_IDENTITY_OWNER",
      "owner and writer must remain legacy",
    );
  }
  for (const key of [
    "remountAllowed",
    "lifecycleKeysAllowed",
    "parentReplacementAllowed",
    "wrapperAroundLegacyMountAllowed",
    "portalAllowed",
    "conditionalRemountAllowed",
    "identityTransitionAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_SHADOW_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedHostShadowPlacementIdentity;
}
