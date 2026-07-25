/**
 * Phase 3B.3.7 — Controlled Host Activation Decision (metadata only).
 * Deterministic decision from registration/placement/eligibility/readiness/simulation.
 * Never executes activation. No React/runtime mutations.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostShadowActivationSimulation } from "./controlled-host-shadow-activation-simulation";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";

export const CONTROLLED_HOST_ACTIVATION_DECISION_SCHEMA_VERSION = 1 as const;

export const PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY =
  "PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY" as const;

export type ControlledHostActivationDecisionState = "completed";

export type ControlledHostActivationDecisionResult = "ALLOW" | "DENY";

export type ControlledHostActivationDecisionConfidence = "high" | "medium" | "low";

/**
 * Explicit metadata inputs consumed by the decision engine (read-only).
 */
export const CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES = [
  "controlled-host-registry",
  "controlled-feed-host-shadow-placement",
  "controlled-host-eligibility",
  "controlled-host-activation-readiness",
  "controlled-host-shadow-activation-simulation",
  "feed-host-rollback-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_DECISION_REASONS = [
  "exactly-one-registered-host",
  "shadow-placement-registered",
  "eligibility-satisfied",
  "activation-readiness-satisfied",
  "shadow-simulation-completed-would-activate",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "single-mount-identity-preserved",
  "deterministic-metadata-consensus-allow",
] as const;

export type ControlledHostActivationDecisionReason =
  (typeof CONTROLLED_HOST_ACTIVATION_DECISION_REASONS)[number];

export const CONTROLLED_HOST_ACTIVATION_DECISION_BLOCKERS = [
  PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
] as const;

export type ControlledHostActivationDecisionDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_DECISION_SCHEMA_VERSION;
  phase: "3B.3.7";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  decisionState: ControlledHostActivationDecisionState;
  decisionResult: "ALLOW";
  wouldActivate: true;
  decisionReasons: readonly ControlledHostActivationDecisionReason[];
  decisionBlockers: readonly (typeof PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY)[];
  confidence: "high";
  decisionInputSources: typeof CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES;
  registrationState: "registered";
  placementState: "shadow-registered";
  eligibilityState: "eligible";
  readinessState: "ready";
  simulationState: "completed";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.8";
  activationBlocker: typeof PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY;
};

export type ControlledHostActivationDecisionDiagnostics = {
  decisionCompleted: true;
  decisionResult: "ALLOW";
  wouldActivate: true;
  confidence: "high";
  usedConditions: readonly ControlledHostActivationDecisionReason[];
  decisionInputSources: typeof CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES;
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.7";
  nextEligibleStep: "3B.3.8";
  activeBlockers: readonly [typeof PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY];
  readinessStatus: "ready";
  eligibilityStatus: "eligible";
  simulationStatus: "completed";
  missingConditionsForExecution: readonly [
    "activation-executor-not-authorized",
    "decision-only-no-runtime-mutation",
    "can-start-activation-must-remain-false",
  ];
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
};

export type ControlledHostActivationDecisionEvaluation = {
  descriptor: ControlledHostActivationDecisionDescriptor;
  diagnostics: ControlledHostActivationDecisionDiagnostics;
};

export function createControlledHostActivationDecisionDescriptor(): ControlledHostActivationDecisionDescriptor {
  return validateControlledHostActivationDecisionDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_DECISION_SCHEMA_VERSION,
    phase: "3B.3.7",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    decisionState: "completed",
    decisionResult: "ALLOW",
    wouldActivate: true,
    decisionReasons: [...CONTROLLED_HOST_ACTIVATION_DECISION_REASONS],
    decisionBlockers: [...CONTROLLED_HOST_ACTIVATION_DECISION_BLOCKERS],
    confidence: "high",
    decisionInputSources: CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES,
    registrationState: "registered",
    placementState: "shadow-registered",
    eligibilityState: "eligible",
    readinessState: "ready",
    simulationState: "completed",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.8",
    activationBlocker: PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
  });
}

/**
 * Pure activation decision engine — deterministic, no side effects.
 * Consumes only sealed metadata from prior phases via the simulation evaluation chain.
 */
export function evaluateControlledHostActivationDecision(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationDecisionEvaluation {
  void createFeedHostRollbackContract();
  const simulation = evaluateControlledHostShadowActivationSimulation(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_HOST_COUNT",
      "Activation decision requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_IDS",
      "Activation decision requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_OWNERSHIP",
      "Activation decision requires legacy owner/writer/renderer",
    );
  }
  if (
    simulation.descriptor.simulationState !== "completed" ||
    simulation.descriptor.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_SIMULATION",
      "Activation decision requires completed simulation with wouldActivate=true",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_ACTIVATION",
      "Activation decision forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationDecisionDescriptor();
  return {
    descriptor,
    diagnostics: {
      decisionCompleted: true,
      decisionResult: "ALLOW",
      wouldActivate: true,
      confidence: "high",
      usedConditions: [...CONTROLLED_HOST_ACTIVATION_DECISION_REASONS],
      decisionInputSources: CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES,
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.7",
      nextEligibleStep: "3B.3.8",
      activeBlockers: [PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY],
      readinessStatus: "ready",
      eligibilityStatus: "eligible",
      simulationStatus: "completed",
      missingConditionsForExecution: [
        "activation-executor-not-authorized",
        "decision-only-no-runtime-mutation",
        "can-start-activation-must-remain-false",
      ],
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
    },
  };
}

export function validateControlledHostActivationDecisionDescriptor(
  candidate: unknown,
): ControlledHostActivationDecisionDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_INVALID",
      "Activation decision descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_DECISION_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_SCHEMA",
      "Unsupported activation decision schemaVersion",
    );
  }
  if (c.phase !== "3B.3.7") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_PHASE",
      "phase must be 3B.3.7",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (c.decisionState !== "completed") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_STATE",
      "decisionState must be completed",
    );
  }
  if (c.decisionResult !== "ALLOW") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_RESULT",
      "decisionResult must be ALLOW when all sealed prerequisites agree",
    );
  }
  if (c.wouldActivate !== true) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_WOULD_ACTIVATE",
      "wouldActivate must be true when decisionResult is ALLOW",
    );
  }
  if (c.confidence !== "high") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONFIDENCE",
      "confidence must be high when all prerequisites agree",
    );
  }
  if (!Array.isArray(c.decisionReasons)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_REASONS",
      "decisionReasons must be an array",
    );
  }
  for (const reason of CONTROLLED_HOST_ACTIVATION_DECISION_REASONS) {
    if (!(c.decisionReasons as string[]).includes(reason)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_DECISION_REASON_MISSING",
        `Missing decision reason: ${reason}`,
      );
    }
  }
  if (
    !Array.isArray(c.decisionBlockers) ||
    !(c.decisionBlockers as string[]).includes(
      PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
    )
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_BLOCKERS",
      "decisionBlockers must include PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY",
    );
  }
  if (
    c.registrationState !== "registered" ||
    c.placementState !== "shadow-registered" ||
    c.eligibilityState !== "eligible" ||
    c.readinessState !== "ready" ||
    c.simulationState !== "completed"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_PREREQ",
      "registration/placement/eligibility/readiness/simulation prerequisites mismatch",
    );
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_OWNERSHIP",
      "owner/writer/renderer must remain legacy",
    );
  }
  if (c.activationState !== "dormant") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_ACTIVATION_STATE",
      "activationState must remain dormant",
    );
  }
  if (c.rollbackState !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_ROLLBACK",
      "rollbackState must be prepared-not-active",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_FLAGS",
      "host/render activation and canStartActivation must be false",
    );
  }
  if (c.nextEligibleStep !== "3B.3.8") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_NEXT",
      "nextEligibleStep must be 3B.3.8",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_BLOCKER",
      "activationBlocker must be PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY",
    );
  }
  return c as ControlledHostActivationDecisionDescriptor;
}
