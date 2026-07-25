/**
 * Phase 3B.3.6 — Controlled Host Shadow Activation Simulation (dry-run only).
 * Evaluates whether a *future* host activation would be architecturally allowed.
 * Never executes activation. No React/runtime mutations.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostActivationReadiness } from "./controlled-host-activation-readiness";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";

export const CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY =
  "PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY" as const;

export type ControlledHostShadowActivationSimulationState = "completed";

export type ControlledHostShadowActivationSimulationResult =
  "dry-run-complete-would-activate";

export const CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_REASONS = [
  "exactly-one-registered-host",
  "shadow-placement-registered",
  "eligibility-satisfied",
  "activation-readiness-satisfied",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "single-mount-identity-preserved",
  "intent-evaluation-allows-future-activation",
] as const;

export type ControlledHostShadowActivationSimulationReason =
  (typeof CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_REASONS)[number];

export const CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_BLOCKERS = [
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
] as const;

export type ControlledHostShadowActivationSimulationDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_SCHEMA_VERSION;
  phase: "3B.3.6";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  simulationState: ControlledHostShadowActivationSimulationState;
  simulationResult: ControlledHostShadowActivationSimulationResult;
  wouldActivate: true;
  simulationReasons: readonly ControlledHostShadowActivationSimulationReason[];
  simulationBlockers: readonly (typeof PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY)[];
  registrationState: "registered";
  placementState: "shadow-registered";
  eligibilityState: "eligible";
  readinessState: "ready";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.7";
  activationBlocker: typeof PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY;
};

export type ControlledHostShadowActivationSimulationDiagnostics = {
  simulationCompleted: true;
  wouldActivate: true;
  whyWouldActivate: "prerequisites-and-readiness-satisfied-for-future-intent";
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.6";
  nextEligibleStep: "3B.3.7";
  activeBlockers: readonly [
    typeof PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  ];
  readinessStatus: "ready";
  eligibilityStatus: "eligible";
  satisfiedConditions: readonly ControlledHostShadowActivationSimulationReason[];
  missingConditionsForExecution: readonly [
    "activation-executor-not-authorized",
    "shadow-simulation-only-no-runtime-mutation",
    "can-start-activation-must-remain-false",
  ];
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
};

export type ControlledHostShadowActivationSimulationEvaluation = {
  descriptor: ControlledHostShadowActivationSimulationDescriptor;
  diagnostics: ControlledHostShadowActivationSimulationDiagnostics;
};

export function createControlledHostShadowActivationSimulationDescriptor(): ControlledHostShadowActivationSimulationDescriptor {
  return validateControlledHostShadowActivationSimulationDescriptor({
    schemaVersion: CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_SCHEMA_VERSION,
    phase: "3B.3.6",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    simulationState: "completed",
    simulationResult: "dry-run-complete-would-activate",
    wouldActivate: true,
    simulationReasons: [
      ...CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_REASONS,
    ],
    simulationBlockers: [
      ...CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_BLOCKERS,
    ],
    registrationState: "registered",
    placementState: "shadow-registered",
    eligibilityState: "eligible",
    readinessState: "ready",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.7",
    activationBlocker: PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  });
}

/**
 * Pure shadow activation simulation engine — dry-run metadata only.
 * Must never flip hostActivation/renderActivation or mutate Feed lifecycle.
 */
export function evaluateControlledHostShadowActivationSimulation(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostShadowActivationSimulationEvaluation {
  void createFeedHostRollbackContract();
  const readiness = evaluateControlledHostActivationReadiness(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_HOST_COUNT",
      "Shadow simulation requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_IDS",
      "Shadow simulation requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_OWNERSHIP",
      "Shadow simulation requires legacy owner/writer/renderer",
    );
  }
  if (readiness.descriptor.readinessState !== "ready") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_READINESS",
      "Shadow simulation requires readinessState=ready",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_ACTIVATION",
      "Shadow simulation forbids host/render activation",
    );
  }

  const descriptor = createControlledHostShadowActivationSimulationDescriptor();
  return {
    descriptor,
    diagnostics: {
      simulationCompleted: true,
      wouldActivate: true,
      whyWouldActivate:
        "prerequisites-and-readiness-satisfied-for-future-intent",
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.6",
      nextEligibleStep: "3B.3.7",
      activeBlockers: [PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY],
      readinessStatus: "ready",
      eligibilityStatus: "eligible",
      satisfiedConditions: [
        ...CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_REASONS,
      ],
      missingConditionsForExecution: [
        "activation-executor-not-authorized",
        "shadow-simulation-only-no-runtime-mutation",
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

export function validateControlledHostShadowActivationSimulationDescriptor(
  candidate: unknown,
): ControlledHostShadowActivationSimulationDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_INVALID",
      "Shadow simulation descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !== CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_SCHEMA",
      "Unsupported shadow simulation schemaVersion",
    );
  }
  if (c.phase !== "3B.3.6") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PHASE",
      "phase must be 3B.3.6",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (c.simulationState !== "completed") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_STATE",
      "simulationState must be completed",
    );
  }
  if (c.simulationResult !== "dry-run-complete-would-activate") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_RESULT",
      "simulationResult mismatch",
    );
  }
  if (c.wouldActivate !== true) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_WOULD_ACTIVATE",
      "wouldActivate must be true when readiness prerequisites are satisfied",
    );
  }
  if (!Array.isArray(c.simulationReasons)) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_REASONS",
      "simulationReasons must be an array",
    );
  }
  for (const reason of CONTROLLED_HOST_SHADOW_ACTIVATION_SIMULATION_REASONS) {
    if (!(c.simulationReasons as string[]).includes(reason)) {
      throw new HardContractViolation(
        "FEED_HOST_SHADOW_SIM_REASON_MISSING",
        `Missing simulation reason: ${reason}`,
      );
    }
  }
  if (
    !Array.isArray(c.simulationBlockers) ||
    !(c.simulationBlockers as string[]).includes(
      PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
    )
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_BLOCKERS",
      "simulationBlockers must include PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY",
    );
  }
  if (
    c.registrationState !== "registered" ||
    c.placementState !== "shadow-registered" ||
    c.eligibilityState !== "eligible" ||
    c.readinessState !== "ready"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_PREREQ",
      "registration/placement/eligibility/readiness prerequisites mismatch",
    );
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_OWNERSHIP",
      "owner/writer/renderer must remain legacy",
    );
  }
  if (c.activationState !== "dormant") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_ACTIVATION_STATE",
      "activationState must remain dormant",
    );
  }
  if (c.rollbackState !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_ROLLBACK",
      "rollbackState must be prepared-not-active",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_FLAGS",
      "host/render activation and canStartActivation must be false",
    );
  }
  if (c.nextEligibleStep !== "3B.3.7") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_NEXT",
      "nextEligibleStep must be 3B.3.7",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_SIM_BLOCKER",
      "activationBlocker must be PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY",
    );
  }
  return c as ControlledHostShadowActivationSimulationDescriptor;
}
