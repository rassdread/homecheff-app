/**
 * Phase 3B.3.8 — Controlled Host Activation Plan (metadata only).
 * Deterministic execution description from registration/placement/eligibility/
 * readiness/simulation/decision. Never executes activation. No React/runtime mutations.
 *
 * Plan construction order is fixed by CONTROLLED_HOST_ACTIVATION_PLAN_STEPS —
 * identical input always yields identical plannedSteps ordering.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostActivationDecision } from "./controlled-host-activation-decision";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_PLAN_SCHEMA_VERSION = 1 as const;

export const PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY =
  "PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_PLAN_ID =
  "feed.discovery.controlled-host.activation-plan.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_PLAN_VERSION = 1 as const;

export type ControlledHostActivationPlanState = "completed";

export type ControlledHostActivationPlanResult =
  "plan-complete-not-executable";

/**
 * Explicit metadata inputs consumed by the activation plan engine (read-only).
 */
export const CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES = [
  "controlled-host-registry",
  "controlled-feed-host-shadow-placement",
  "controlled-host-eligibility",
  "controlled-host-activation-readiness",
  "controlled-host-shadow-activation-simulation",
  "controlled-host-activation-decision",
  "feed-host-rollback-contract",
] as const;

/**
 * Future activation sequence — descriptive metadata only; never executed.
 * Order is deterministic: array index defines planned sequence.
 */
export const CONTROLLED_HOST_ACTIVATION_PLAN_STEPS = [
  "verify-exactly-one-registered-host",
  "verify-shadow-placement-registered",
  "verify-eligibility-eligible",
  "verify-activation-readiness-ready",
  "verify-shadow-simulation-completed",
  "verify-decision-allow",
  "verify-stable-runtime-id",
  "verify-legacy-owner-writer-renderer",
  "verify-rollback-prepared-not-active",
  "hold-activation-pending-future-authorization",
] as const;

export type ControlledHostActivationPlanStep =
  (typeof CONTROLLED_HOST_ACTIVATION_PLAN_STEPS)[number];

export const CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS = [
  "exactly-one-registered-host",
  "shadow-placement-registered",
  "eligibility-satisfied",
  "activation-readiness-satisfied",
  "shadow-simulation-completed-would-activate",
  "decision-allow-high-confidence",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "single-mount-identity-preserved",
] as const;

export type ControlledHostActivationPlanPrecondition =
  (typeof CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS)[number];

export const CONTROLLED_HOST_ACTIVATION_PLAN_VALIDATION_POINTS = [
  "registry-host-count-equals-one",
  "runtime-id-equals-stable-legacy",
  "decision-result-allow",
  "would-activate-true",
  "host-activation-false",
  "render-activation-false",
  "can-start-activation-false",
  "owner-writer-renderer-legacy",
  "rollback-prepared-not-active",
  "all-20-release-blocking-invariants",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS = [
  "pre-plan-legacy-owner",
  "pre-plan-legacy-writer",
  "pre-plan-legacy-renderer",
  "pre-plan-prepared-not-active-rollback",
  "pre-plan-single-mount-identity",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS = [
  "host-count-not-one",
  "runtime-id-changed",
  "decision-not-allow",
  "ownership-not-legacy",
  "renderer-not-legacy",
  "rollback-not-prepared",
  "forced-activation-attempt",
  "executor-or-scheduler-present",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PLAN_BLOCKERS = [
  PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY,
] as const;

export type ControlledHostActivationPlanDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_PLAN_SCHEMA_VERSION;
  phase: "3B.3.8";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  planId: typeof CONTROLLED_HOST_ACTIVATION_PLAN_ID;
  planVersion: typeof CONTROLLED_HOST_ACTIVATION_PLAN_VERSION;
  planState: ControlledHostActivationPlanState;
  planResult: ControlledHostActivationPlanResult;
  decisionResult: "ALLOW";
  wouldActivate: true;
  plannedSteps: typeof CONTROLLED_HOST_ACTIVATION_PLAN_STEPS;
  preconditions: typeof CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS;
  validationPoints: typeof CONTROLLED_HOST_ACTIVATION_PLAN_VALIDATION_POINTS;
  rollbackCheckpoints: typeof CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  planInputSources: typeof CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES;
  planBlockers: readonly (typeof PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY)[];
  registrationState: "registered";
  placementState: "shadow-registered";
  eligibilityState: "eligible";
  readinessState: "ready";
  simulationState: "completed";
  decisionState: "completed";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.9";
  activationBlocker: typeof PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY;
};

export type ControlledHostActivationPlanDiagnostics = {
  planCompleted: true;
  planResult: ControlledHostActivationPlanResult;
  decisionResult: "ALLOW";
  wouldActivate: true;
  plannedStepCount: typeof CONTROLLED_HOST_ACTIVATION_PLAN_STEPS.length;
  plannedSteps: typeof CONTROLLED_HOST_ACTIVATION_PLAN_STEPS;
  preconditions: typeof CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS;
  validationPoints: typeof CONTROLLED_HOST_ACTIVATION_PLAN_VALIDATION_POINTS;
  rollbackCheckpoints: typeof CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  planInputSources: typeof CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES;
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.8";
  nextEligibleStep: "3B.3.9";
  activeBlockers: readonly [typeof PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY];
  readinessStatus: "ready";
  eligibilityStatus: "eligible";
  simulationStatus: "completed";
  decisionStatus: "completed";
  missingConditionsForExecution: readonly [
    "activation-executor-not-authorized",
    "activation-plan-only-no-runtime-mutation",
    "can-start-activation-must-remain-false",
    "scheduler-not-authorized",
  ];
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
};

export type ControlledHostActivationPlanEvaluation = {
  descriptor: ControlledHostActivationPlanDescriptor;
  diagnostics: ControlledHostActivationPlanDiagnostics;
};

export function createControlledHostActivationPlanDescriptor(): ControlledHostActivationPlanDescriptor {
  return validateControlledHostActivationPlanDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_PLAN_SCHEMA_VERSION,
    phase: "3B.3.8",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    planId: CONTROLLED_HOST_ACTIVATION_PLAN_ID,
    planVersion: CONTROLLED_HOST_ACTIVATION_PLAN_VERSION,
    planState: "completed",
    planResult: "plan-complete-not-executable",
    decisionResult: "ALLOW",
    wouldActivate: true,
    plannedSteps: CONTROLLED_HOST_ACTIVATION_PLAN_STEPS,
    preconditions: CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS,
    validationPoints: CONTROLLED_HOST_ACTIVATION_PLAN_VALIDATION_POINTS,
    rollbackCheckpoints: CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS,
    abortConditions: CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS,
    invariants: FEED_SEALED_INVARIANT_IDS,
    planInputSources: CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES,
    planBlockers: [...CONTROLLED_HOST_ACTIVATION_PLAN_BLOCKERS],
    registrationState: "registered",
    placementState: "shadow-registered",
    eligibilityState: "eligible",
    readinessState: "ready",
    simulationState: "completed",
    decisionState: "completed",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.9",
    activationBlocker: PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY,
  });
}

/**
 * Pure activation plan engine — deterministic, no side effects.
 * Consumes sealed metadata via the decision evaluation chain.
 * plannedSteps order is fixed by CONTROLLED_HOST_ACTIVATION_PLAN_STEPS.
 */
export function evaluateControlledHostActivationPlan(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationPlanEvaluation {
  void createFeedHostRollbackContract();
  const decision = evaluateControlledHostActivationDecision(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_HOST_COUNT",
      "Activation plan requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_IDS",
      "Activation plan requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_OWNERSHIP",
      "Activation plan requires legacy owner/writer/renderer",
    );
  }
  if (
    decision.descriptor.decisionState !== "completed" ||
    decision.descriptor.decisionResult !== "ALLOW" ||
    decision.descriptor.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_DECISION",
      "Activation plan requires completed ALLOW decision with wouldActivate=true",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_ACTIVATION",
      "Activation plan forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationPlanDescriptor();
  return {
    descriptor,
    diagnostics: {
      planCompleted: true,
      planResult: "plan-complete-not-executable",
      decisionResult: "ALLOW",
      wouldActivate: true,
      plannedStepCount: CONTROLLED_HOST_ACTIVATION_PLAN_STEPS.length,
      plannedSteps: CONTROLLED_HOST_ACTIVATION_PLAN_STEPS,
      preconditions: CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS,
      validationPoints: CONTROLLED_HOST_ACTIVATION_PLAN_VALIDATION_POINTS,
      rollbackCheckpoints: CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS,
      abortConditions: CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS,
      invariants: FEED_SEALED_INVARIANT_IDS,
      planInputSources: CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES,
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.8",
      nextEligibleStep: "3B.3.9",
      activeBlockers: [PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY],
      readinessStatus: "ready",
      eligibilityStatus: "eligible",
      simulationStatus: "completed",
      decisionStatus: "completed",
      missingConditionsForExecution: [
        "activation-executor-not-authorized",
        "activation-plan-only-no-runtime-mutation",
        "can-start-activation-must-remain-false",
        "scheduler-not-authorized",
      ],
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
    },
  };
}

export function validateControlledHostActivationPlanDescriptor(
  candidate: unknown,
): ControlledHostActivationPlanDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_INVALID",
      "Activation plan descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_PLAN_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_SCHEMA",
      "Unsupported activation plan schemaVersion",
    );
  }
  if (c.phase !== "3B.3.8") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PHASE",
      "phase must be 3B.3.8",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.planId !== CONTROLLED_HOST_ACTIVATION_PLAN_ID ||
    c.planVersion !== CONTROLLED_HOST_ACTIVATION_PLAN_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_ID_VERSION",
      "planId/planVersion must match sealed constants",
    );
  }
  if (c.planState !== "completed") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_STATE",
      "planState must be completed",
    );
  }
  if (c.planResult !== "plan-complete-not-executable") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_RESULT",
      "planResult must be plan-complete-not-executable",
    );
  }
  if (c.decisionResult !== "ALLOW" || c.wouldActivate !== true) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_DECISION",
      "decisionResult must be ALLOW and wouldActivate true",
    );
  }
  if (!Array.isArray(c.plannedSteps)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_STEPS",
      "plannedSteps must be an array",
    );
  }
  if (
    (c.plannedSteps as string[]).length !==
    CONTROLLED_HOST_ACTIVATION_PLAN_STEPS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_STEPS_LENGTH",
      "plannedSteps length mismatch",
    );
  }
  for (let i = 0; i < CONTROLLED_HOST_ACTIVATION_PLAN_STEPS.length; i += 1) {
    if (
      (c.plannedSteps as string[])[i] !==
      CONTROLLED_HOST_ACTIVATION_PLAN_STEPS[i]
    ) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_PLAN_STEPS_ORDER",
        `plannedSteps order must be deterministic at index ${i}`,
      );
    }
  }
  for (const [key, expected] of [
    ["preconditions", CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS],
    ["validationPoints", CONTROLLED_HOST_ACTIVATION_PLAN_VALIDATION_POINTS],
    [
      "rollbackCheckpoints",
      CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS,
    ],
    ["abortConditions", CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS],
  ] as const) {
    if (!Array.isArray(c[key])) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_PLAN_ARRAY",
        `${key} must be an array`,
      );
    }
    for (const item of expected) {
      if (!(c[key] as string[]).includes(item)) {
        throw new HardContractViolation(
          "FEED_HOST_ACTIVATION_PLAN_ARRAY_ITEM",
          `Missing ${key} item: ${item}`,
        );
      }
    }
  }
  if (
    !Array.isArray(c.invariants) ||
    (c.invariants as string[]).length !== FEED_SEALED_INVARIANT_IDS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_INVARIANTS",
      "invariants must include all 20 release-blocking IDs",
    );
  }
  if (
    !Array.isArray(c.planBlockers) ||
    !(c.planBlockers as string[]).includes(PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY)
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_BLOCKERS",
      "planBlockers must include PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY",
    );
  }
  if (
    c.registrationState !== "registered" ||
    c.placementState !== "shadow-registered" ||
    c.eligibilityState !== "eligible" ||
    c.readinessState !== "ready" ||
    c.simulationState !== "completed" ||
    c.decisionState !== "completed"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_PREREQ",
      "prior-layer prerequisites mismatch",
    );
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_OWNERSHIP",
      "owner/writer/renderer must remain legacy",
    );
  }
  if (c.activationState !== "dormant") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_ACTIVATION_STATE",
      "activationState must remain dormant",
    );
  }
  if (c.rollbackState !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_ROLLBACK",
      "rollbackState must be prepared-not-active",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_FLAGS",
      "host/render activation and canStartActivation must be false",
    );
  }
  if (c.nextEligibleStep !== "3B.3.9") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_NEXT",
      "nextEligibleStep must be 3B.3.9",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PLAN_BLOCKER",
      "activationBlocker must be PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY",
    );
  }
  return c as ControlledHostActivationPlanDescriptor;
}
