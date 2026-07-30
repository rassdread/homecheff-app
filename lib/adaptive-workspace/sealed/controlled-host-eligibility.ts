/**
 * Phase 3B.3.4 — Controlled Host Eligibility (metadata only).
 * Determines whether a registered host qualifies for *future* activation.
 * Never starts activation. No React/runtime mutations.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { createControlledHostRegistrationContract } from "./controlled-host-registration-contract";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";

export const CONTROLLED_HOST_ELIGIBILITY_SCHEMA_VERSION = 1 as const;

export const PHASE_3B3_4_HOST_ELIGIBILITY_ONLY =
  "PHASE_3B3_4_HOST_ELIGIBILITY_ONLY" as const;

export type ControlledHostEligibilityState = "eligible";

export type ControlledHostEligibilityReason =
  "registered-stable-legacy-host-prerequisites-met";

export type ControlledHostEligibilityDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ELIGIBILITY_SCHEMA_VERSION;
  phase: "3B.3.4";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  registrationState: "registered";
  eligibilityState: ControlledHostEligibilityState;
  eligibilityReason: ControlledHostEligibilityReason;
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.5";
  activationBlocker: typeof PHASE_3B3_4_HOST_ELIGIBILITY_ONLY;
};

export type ControlledHostEligibilityEvaluation = {
  descriptor: ControlledHostEligibilityDescriptor;
  diagnostics: {
    registryHostCount: 1;
    runtimeIdStable: true;
    ownershipLegacy: true;
    rendererLegacy: true;
    rollbackPrepared: true;
    activationBlocked: true;
  };
};

export function createControlledHostEligibilityDescriptor(): ControlledHostEligibilityDescriptor {
  return validateControlledHostEligibilityDescriptor({
    schemaVersion: CONTROLLED_HOST_ELIGIBILITY_SCHEMA_VERSION,
    phase: "3B.3.4",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    registrationState: "registered",
    eligibilityState: "eligible",
    eligibilityReason: "registered-stable-legacy-host-prerequisites-met",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.5",
    activationBlocker: PHASE_3B3_4_HOST_ELIGIBILITY_ONLY,
  });
}

/**
 * Pure eligibility engine — metadata evaluation only.
 * Must never flip hostActivation/renderActivation or mutate Feed lifecycle.
 */
export function evaluateControlledHostEligibility(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostEligibilityEvaluation {
  void createControlledHostRegistrationContract();
  void createFeedHostRollbackContract();

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_HOST_COUNT",
      "Eligibility requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_IDS",
      "Eligibility requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_OWNERSHIP",
      "Eligibility requires legacy owner/writer/renderer",
    );
  }
  if (host.registrationState !== "registered") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_REGISTRATION",
      "Eligibility requires registrationState=registered",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_ACTIVATION",
      "Eligibility forbids host/render activation",
    );
  }

  const descriptor = createControlledHostEligibilityDescriptor();
  return {
    descriptor,
    diagnostics: {
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
      activationBlocked: true,
    },
  };
}

export function validateControlledHostEligibilityDescriptor(
  candidate: unknown,
): ControlledHostEligibilityDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_INVALID",
      "Eligibility descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_HOST_ELIGIBILITY_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_SCHEMA",
      "Unsupported eligibility schemaVersion",
    );
  }
  if (c.phase !== "3B.3.4") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_PHASE",
      "phase must be 3B.3.4",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (c.registrationState !== "registered") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_REGISTRATION",
      "registrationState must be registered",
    );
  }
  if (c.eligibilityState !== "eligible") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_STATE",
      "eligibilityState must be eligible",
    );
  }
  if (
    c.eligibilityReason !==
    "registered-stable-legacy-host-prerequisites-met"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_REASON",
      "eligibilityReason mismatch",
    );
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_OWNERSHIP",
      "owner/writer/renderer must remain legacy",
    );
  }
  if (c.activationState !== "dormant") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_ACTIVATION_STATE",
      "activationState must be dormant",
    );
  }
  if (c.rollbackState !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_ROLLBACK",
      "rollbackState must be prepared-not-active",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_FLAGS",
      "host/render activation and canStartActivation must be false",
    );
  }
  if (c.nextEligibleStep !== "3B.3.5") {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_NEXT",
      "nextEligibleStep must be 3B.3.5",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_4_HOST_ELIGIBILITY_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ELIGIBILITY_BLOCKER",
      "activationBlocker must be PHASE_3B3_4_HOST_ELIGIBILITY_ONLY",
    );
  }
  return c as ControlledHostEligibilityDescriptor;
}
