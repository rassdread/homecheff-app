/**
 * Phase 3B.3.6 — shadow activation simulation identity contract.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";

export const FEED_HOST_SHADOW_ACTIVATION_SIMULATION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedHostShadowActivationSimulationIdentity = {
  schemaVersion: typeof FEED_HOST_SHADOW_ACTIVATION_SIMULATION_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.6";
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
  activationViaSimulationAllowed: false;
  canStartActivationAllowed: false;
  runtimeMutationViaSimulationAllowed: false;
};

export function createFeedHostShadowActivationSimulationIdentity(): FeedHostShadowActivationSimulationIdentity {
  return validateFeedHostShadowActivationSimulationIdentity({
    schemaVersion:
      FEED_HOST_SHADOW_ACTIVATION_SIMULATION_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.6",
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
    activationViaSimulationAllowed: false,
    canStartActivationAllowed: false,
    runtimeMutationViaSimulationAllowed: false,
  });
}

export function validateFeedHostShadowActivationSimulationIdentity(
  candidate: unknown,
): FeedHostShadowActivationSimulationIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_IDENTITY_INVALID",
      "Identity contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_SHADOW_ACTIVATION_SIMULATION_IDENTITY_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_IDENTITY_SCHEMA",
      "Unsupported identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.6") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_IDENTITY_PHASE",
      "phase must be 3B.3.6",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_IDENTITY_IDS",
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
      "FEED_HOST_SHADOW_SIM_IDENTITY_COUNTS",
      "mount/unmount/instance/renderer counts must stay sealed",
    );
  }
  if (
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_IDENTITY_OWNER",
      "expected owner/writer/renderer must be legacy",
    );
  }
  for (const key of [
    "runtimeIdTransitionAllowed",
    "remountAllowed",
    "identityTransitionAllowed",
    "parentReplacementAllowed",
    "wrapperAllowed",
    "portalAllowed",
    "activationViaSimulationAllowed",
    "canStartActivationAllowed",
    "runtimeMutationViaSimulationAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_SHADOW_SIM_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedHostShadowActivationSimulationIdentity;
}
