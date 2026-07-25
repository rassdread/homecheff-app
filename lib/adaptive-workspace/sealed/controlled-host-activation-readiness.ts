/**
 * Phase 3B.3.5 — Controlled Host Activation Readiness (metadata only).
 * Determines whether a host is architecturally ready for *future* activation.
 * Never executes activation. No React/runtime mutations.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostEligibility } from "./controlled-host-eligibility";
import { createControlledFeedHostShadowPlacement } from "./controlled-feed-host-shadow-placement";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";

export const CONTROLLED_HOST_ACTIVATION_READINESS_SCHEMA_VERSION = 1 as const;

export const PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY =
  "PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY" as const;

export type ControlledHostActivationReadinessState = "ready";

export const CONTROLLED_HOST_ACTIVATION_READINESS_REASONS = [
  "exactly-one-registered-host",
  "shadow-placement-registered",
  "eligibility-satisfied",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "single-mount-identity-preserved",
] as const;

export type ControlledHostActivationReadinessReason =
  (typeof CONTROLLED_HOST_ACTIVATION_READINESS_REASONS)[number];

export const CONTROLLED_HOST_ACTIVATION_READINESS_BLOCKERS = [
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
] as const;

export type ControlledHostActivationReadinessDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_READINESS_SCHEMA_VERSION;
  phase: "3B.3.5";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  registrationState: "registered";
  placementState: "shadow-registered";
  eligibilityState: "eligible";
  readinessState: ControlledHostActivationReadinessState;
  readinessReasons: readonly ControlledHostActivationReadinessReason[];
  readinessBlockers: readonly (typeof PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY)[];
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.6";
  activationBlocker: typeof PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY;
};

export type ControlledHostActivationReadinessDiagnostics = {
  readinessSatisfied: true;
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.5";
  nextEligibleStep: "3B.3.6";
  activeBlockers: readonly [typeof PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY];
  satisfiedConditions: readonly ControlledHostActivationReadinessReason[];
  missingConditionsForActivation: readonly [
    "activation-executor-not-authorized",
    "host-activation-flag-must-remain-false-until-3b3-6",
    "can-start-activation-must-remain-false",
  ];
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
  placementRegistered: true;
  eligibilitySatisfied: true;
};

export type ControlledHostActivationReadinessEvaluation = {
  descriptor: ControlledHostActivationReadinessDescriptor;
  diagnostics: ControlledHostActivationReadinessDiagnostics;
};

export function createControlledHostActivationReadinessDescriptor(): ControlledHostActivationReadinessDescriptor {
  return validateControlledHostActivationReadinessDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_READINESS_SCHEMA_VERSION,
    phase: "3B.3.5",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    registrationState: "registered",
    placementState: "shadow-registered",
    eligibilityState: "eligible",
    readinessState: "ready",
    readinessReasons: [...CONTROLLED_HOST_ACTIVATION_READINESS_REASONS],
    readinessBlockers: [...CONTROLLED_HOST_ACTIVATION_READINESS_BLOCKERS],
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.6",
    activationBlocker: PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  });
}

/**
 * Pure readiness engine — metadata evaluation only.
 * Must never flip hostActivation/renderActivation or mutate Feed lifecycle.
 */
export function evaluateControlledHostActivationReadiness(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationReadinessEvaluation {
  void createControlledFeedHostShadowPlacement();
  void createFeedHostRollbackContract();
  const eligibility = evaluateControlledHostEligibility(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_HOST_COUNT",
      "Activation readiness requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_IDS",
      "Activation readiness requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_OWNERSHIP",
      "Activation readiness requires legacy owner/writer/renderer",
    );
  }
  if (eligibility.descriptor.eligibilityState !== "eligible") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_ELIGIBILITY",
      "Activation readiness requires eligibilityState=eligible",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_ACTIVATION",
      "Activation readiness forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationReadinessDescriptor();
  return {
    descriptor,
    diagnostics: {
      readinessSatisfied: true,
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.5",
      nextEligibleStep: "3B.3.6",
      activeBlockers: [PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY],
      satisfiedConditions: [...CONTROLLED_HOST_ACTIVATION_READINESS_REASONS],
      missingConditionsForActivation: [
        "activation-executor-not-authorized",
        "host-activation-flag-must-remain-false-until-3b3-6",
        "can-start-activation-must-remain-false",
      ],
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
      placementRegistered: true,
      eligibilitySatisfied: true,
    },
  };
}

export function validateControlledHostActivationReadinessDescriptor(
  candidate: unknown,
): ControlledHostActivationReadinessDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_INVALID",
      "Activation readiness descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_READINESS_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_SCHEMA",
      "Unsupported activation readiness schemaVersion",
    );
  }
  if (c.phase !== "3B.3.5") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_PHASE",
      "phase must be 3B.3.5",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (c.registrationState !== "registered") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_REGISTRATION",
      "registrationState must be registered",
    );
  }
  if (c.placementState !== "shadow-registered") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_PLACEMENT",
      "placementState must be shadow-registered",
    );
  }
  if (c.eligibilityState !== "eligible") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_ELIGIBILITY",
      "eligibilityState must be eligible",
    );
  }
  if (c.readinessState !== "ready") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_STATE",
      "readinessState must be ready",
    );
  }
  if (!Array.isArray(c.readinessReasons)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_REASONS",
      "readinessReasons must be an array",
    );
  }
  for (const reason of CONTROLLED_HOST_ACTIVATION_READINESS_REASONS) {
    if (!(c.readinessReasons as string[]).includes(reason)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_READINESS_REASON_MISSING",
        `Missing readiness reason: ${reason}`,
      );
    }
  }
  if (
    !Array.isArray(c.readinessBlockers) ||
    !(c.readinessBlockers as string[]).includes(
      PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
    )
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_BLOCKERS",
      "readinessBlockers must include PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY",
    );
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_OWNERSHIP",
      "owner/writer/renderer must remain legacy",
    );
  }
  if (c.activationState !== "dormant") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_ACTIVATION_STATE",
      "activationState must be dormant",
    );
  }
  if (c.rollbackState !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_ROLLBACK",
      "rollbackState must be prepared-not-active",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_FLAGS",
      "host/render activation and canStartActivation must be false",
    );
  }
  if (c.nextEligibleStep !== "3B.3.6") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_NEXT",
      "nextEligibleStep must be 3B.3.6",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_BLOCKER",
      "activationBlocker must be PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY",
    );
  }
  return c as ControlledHostActivationReadinessDescriptor;
}
