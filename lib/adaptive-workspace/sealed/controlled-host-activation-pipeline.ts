/**
 * Phase 3B.3.9 — Controlled Host Activation Pipeline (metadata only).
 * Deterministic pipeline description from registration through activation plan.
 * Never executes activation. No React/runtime mutations.
 *
 * Stage order is fixed by CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES —
 * identical input always yields identical stageOrder / dependencies.
 * Each stage is independently validatable via its dependency edges.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostActivationPlan } from "./controlled-host-activation-plan";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_SCHEMA_VERSION = 1 as const;

export const PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY =
  "PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_ID =
  "feed.discovery.controlled-host.activation-pipeline.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_VERSION = 1 as const;

export type ControlledHostActivationPipelineState = "completed";

export type ControlledHostActivationPipelineResult =
  "pipeline-complete-not-executable";

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES = [
  "controlled-host-registry",
  "controlled-feed-host-shadow-placement",
  "controlled-host-eligibility",
  "controlled-host-activation-readiness",
  "controlled-host-shadow-activation-simulation",
  "controlled-host-activation-decision",
  "controlled-host-activation-plan",
  "feed-host-rollback-contract",
] as const;

/**
 * Future pipeline stages — descriptive metadata only; never executed.
 * Array index defines deterministic stageOrder.
 */
export const CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES = [
  "stage-registry-verify",
  "stage-placement-verify",
  "stage-eligibility-verify",
  "stage-readiness-verify",
  "stage-simulation-verify",
  "stage-decision-verify",
  "stage-plan-verify",
  "stage-identity-ownership-verify",
  "stage-rollback-verify",
  "stage-hold-pending-authorization",
] as const;

export type ControlledHostActivationPipelineStage =
  (typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES)[number];

/** stageOrder mirrors pipelineStages exactly (deterministic index order). */
export const CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER =
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES;

/**
 * Linear dependencies: each stage depends only on its immediate predecessor
 * (except the first). Enables independent stage validation along the chain.
 */
export const CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES = [
  "stage-registry-verify<-none",
  "stage-placement-verify<-stage-registry-verify",
  "stage-eligibility-verify<-stage-placement-verify",
  "stage-readiness-verify<-stage-eligibility-verify",
  "stage-simulation-verify<-stage-readiness-verify",
  "stage-decision-verify<-stage-simulation-verify",
  "stage-plan-verify<-stage-decision-verify",
  "stage-identity-ownership-verify<-stage-plan-verify",
  "stage-rollback-verify<-stage-identity-ownership-verify",
  "stage-hold-pending-authorization<-stage-rollback-verify",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_ENTRY_CONDITIONS = [
  "exactly-one-registered-host",
  "shadow-placement-registered",
  "eligibility-satisfied",
  "activation-readiness-satisfied",
  "shadow-simulation-completed-would-activate",
  "decision-allow",
  "plan-complete-not-executable",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_EXIT_CONDITIONS = [
  "all-pipeline-stages-described",
  "no-stage-executed",
  "activation-still-blocked",
  "can-start-activation-false",
  "executor-unauthorized",
  "scheduler-unauthorized",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS = [
  "registry-host-count-equals-one",
  "runtime-id-equals-stable-legacy",
  "decision-result-allow",
  "plan-result-complete-not-executable",
  "would-activate-true",
  "stage-order-matches-pipeline-stages",
  "stage-dependencies-linear-complete",
  "host-activation-false",
  "render-activation-false",
  "can-start-activation-false",
  "owner-writer-renderer-legacy",
  "rollback-prepared-not-active",
  "all-20-release-blocking-invariants",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS = [
  "pre-pipeline-legacy-owner",
  "pre-pipeline-legacy-writer",
  "pre-pipeline-legacy-renderer",
  "pre-pipeline-prepared-not-active-rollback",
  "pre-pipeline-single-mount-identity",
  "pre-pipeline-plan-complete",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS = [
  "host-count-not-one",
  "runtime-id-changed",
  "decision-not-allow",
  "plan-not-complete",
  "stage-order-tampered",
  "ownership-not-legacy",
  "renderer-not-legacy",
  "rollback-not-prepared",
  "forced-activation-attempt",
  "executor-or-scheduler-present",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PIPELINE_BLOCKERS = [
  PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
] as const;

export type ControlledHostActivationPipelineDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_SCHEMA_VERSION;
  phase: "3B.3.9";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  pipelineId: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_ID;
  pipelineVersion: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_VERSION;
  pipelineState: ControlledHostActivationPipelineState;
  pipelineResult: ControlledHostActivationPipelineResult;
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  wouldActivate: true;
  pipelineStages: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES;
  stageOrder: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER;
  stageDependencies: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES;
  entryConditions: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_ENTRY_CONDITIONS;
  exitConditions: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_EXIT_CONDITIONS;
  validationPoints: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS;
  rollbackCheckpoints: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  pipelineInputSources: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES;
  pipelineBlockers: readonly (typeof PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY)[];
  registrationState: "registered";
  placementState: "shadow-registered";
  eligibilityState: "eligible";
  readinessState: "ready";
  simulationState: "completed";
  decisionState: "completed";
  planState: "completed";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.10";
  activationBlocker: typeof PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY;
};

export type ControlledHostActivationPipelineDiagnostics = {
  pipelineCompleted: true;
  pipelineResult: ControlledHostActivationPipelineResult;
  stageCount: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length;
  stageOrder: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER;
  stageDependencies: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES;
  validationPoints: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS;
  rollbackCheckpoints: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  pipelineInputSources: typeof CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES;
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  wouldActivate: true;
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.9";
  nextEligibleStep: "3B.3.10";
  activeBlockers: readonly [typeof PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY];
  readinessStatus: "ready";
  eligibilityStatus: "eligible";
  simulationStatus: "completed";
  decisionStatus: "completed";
  planStatus: "completed";
  missingConditionsForExecution: readonly [
    "activation-executor-not-authorized",
    "activation-pipeline-only-no-runtime-mutation",
    "can-start-activation-must-remain-false",
    "scheduler-not-authorized",
    "no-pipeline-stage-may-execute",
  ];
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
};

export type ControlledHostActivationPipelineEvaluation = {
  descriptor: ControlledHostActivationPipelineDescriptor;
  diagnostics: ControlledHostActivationPipelineDiagnostics;
};

export function createControlledHostActivationPipelineDescriptor(): ControlledHostActivationPipelineDescriptor {
  return validateControlledHostActivationPipelineDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_PIPELINE_SCHEMA_VERSION,
    phase: "3B.3.9",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    pipelineId: CONTROLLED_HOST_ACTIVATION_PIPELINE_ID,
    pipelineVersion: CONTROLLED_HOST_ACTIVATION_PIPELINE_VERSION,
    pipelineState: "completed",
    pipelineResult: "pipeline-complete-not-executable",
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    wouldActivate: true,
    pipelineStages: CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES,
    stageOrder: CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER,
    stageDependencies: CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES,
    entryConditions: CONTROLLED_HOST_ACTIVATION_PIPELINE_ENTRY_CONDITIONS,
    exitConditions: CONTROLLED_HOST_ACTIVATION_PIPELINE_EXIT_CONDITIONS,
    validationPoints: CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS,
    rollbackCheckpoints:
      CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS,
    abortConditions: CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS,
    invariants: FEED_SEALED_INVARIANT_IDS,
    pipelineInputSources: CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES,
    pipelineBlockers: [...CONTROLLED_HOST_ACTIVATION_PIPELINE_BLOCKERS],
    registrationState: "registered",
    placementState: "shadow-registered",
    eligibilityState: "eligible",
    readinessState: "ready",
    simulationState: "completed",
    decisionState: "completed",
    planState: "completed",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.10",
    activationBlocker: PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
  });
}

/**
 * Pure activation pipeline engine — deterministic, no side effects.
 * Consumes sealed metadata via the plan evaluation chain.
 * Stages/order/dependencies are fixed constants (independently validatable).
 */
export function evaluateControlledHostActivationPipeline(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationPipelineEvaluation {
  void createFeedHostRollbackContract();
  const plan = evaluateControlledHostActivationPlan(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_HOST_COUNT",
      "Activation pipeline requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_IDS",
      "Activation pipeline requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_OWNERSHIP",
      "Activation pipeline requires legacy owner/writer/renderer",
    );
  }
  if (
    plan.descriptor.planState !== "completed" ||
    plan.descriptor.planResult !== "plan-complete-not-executable" ||
    plan.descriptor.decisionResult !== "ALLOW" ||
    plan.descriptor.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PLAN",
      "Activation pipeline requires completed non-executable plan with ALLOW decision",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_ACTIVATION",
      "Activation pipeline forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationPipelineDescriptor();
  return {
    descriptor,
    diagnostics: {
      pipelineCompleted: true,
      pipelineResult: "pipeline-complete-not-executable",
      stageCount: CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length,
      stageOrder: CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER,
      stageDependencies: CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES,
      validationPoints: CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS,
      rollbackCheckpoints:
        CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS,
      abortConditions: CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS,
      invariants: FEED_SEALED_INVARIANT_IDS,
      pipelineInputSources: CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES,
      decisionResult: "ALLOW",
      planResult: "plan-complete-not-executable",
      wouldActivate: true,
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.9",
      nextEligibleStep: "3B.3.10",
      activeBlockers: [PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY],
      readinessStatus: "ready",
      eligibilityStatus: "eligible",
      simulationStatus: "completed",
      decisionStatus: "completed",
      planStatus: "completed",
      missingConditionsForExecution: [
        "activation-executor-not-authorized",
        "activation-pipeline-only-no-runtime-mutation",
        "can-start-activation-must-remain-false",
        "scheduler-not-authorized",
        "no-pipeline-stage-may-execute",
      ],
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
    },
  };
}

export function validateControlledHostActivationPipelineDescriptor(
  candidate: unknown,
): ControlledHostActivationPipelineDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_INVALID",
      "Activation pipeline descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_PIPELINE_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_SCHEMA",
      "Unsupported activation pipeline schemaVersion",
    );
  }
  if (c.phase !== "3B.3.9") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PHASE",
      "phase must be 3B.3.9",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.pipelineId !== CONTROLLED_HOST_ACTIVATION_PIPELINE_ID ||
    c.pipelineVersion !== CONTROLLED_HOST_ACTIVATION_PIPELINE_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_ID_VERSION",
      "pipelineId/pipelineVersion must match sealed constants",
    );
  }
  if (c.pipelineState !== "completed") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_STATE",
      "pipelineState must be completed",
    );
  }
  if (c.pipelineResult !== "pipeline-complete-not-executable") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_RESULT",
      "pipelineResult must be pipeline-complete-not-executable",
    );
  }
  if (
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_DECISION_PLAN",
      "decisionResult/planResult/wouldActivate mismatch",
    );
  }
  if (!Array.isArray(c.pipelineStages) || !Array.isArray(c.stageOrder)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_STAGES",
      "pipelineStages and stageOrder must be arrays",
    );
  }
  if (
    (c.pipelineStages as string[]).length !==
      CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length ||
    (c.stageOrder as string[]).length !==
      CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_STAGES_LENGTH",
      "pipelineStages/stageOrder length mismatch",
    );
  }
  for (
    let i = 0;
    i < CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length;
    i += 1
  ) {
    if (
      (c.pipelineStages as string[])[i] !==
        CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES[i] ||
      (c.stageOrder as string[])[i] !==
        CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_ORDER[i]
    ) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_PIPELINE_STAGES_ORDER",
        `pipelineStages/stageOrder must be deterministic at index ${i}`,
      );
    }
  }
  if (!Array.isArray(c.stageDependencies)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_DEPS",
      "stageDependencies must be an array",
    );
  }
  for (const dep of CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES) {
    if (!(c.stageDependencies as string[]).includes(dep)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_PIPELINE_DEP_MISSING",
        `Missing stage dependency: ${dep}`,
      );
    }
  }
  for (const [key, expected] of [
    ["entryConditions", CONTROLLED_HOST_ACTIVATION_PIPELINE_ENTRY_CONDITIONS],
    ["exitConditions", CONTROLLED_HOST_ACTIVATION_PIPELINE_EXIT_CONDITIONS],
    [
      "validationPoints",
      CONTROLLED_HOST_ACTIVATION_PIPELINE_VALIDATION_POINTS,
    ],
    [
      "rollbackCheckpoints",
      CONTROLLED_HOST_ACTIVATION_PIPELINE_ROLLBACK_CHECKPOINTS,
    ],
    ["abortConditions", CONTROLLED_HOST_ACTIVATION_PIPELINE_ABORT_CONDITIONS],
  ] as const) {
    if (!Array.isArray(c[key])) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_PIPELINE_ARRAY",
        `${key} must be an array`,
      );
    }
    for (const item of expected) {
      if (!(c[key] as string[]).includes(item)) {
        throw new HardContractViolation(
          "FEED_HOST_ACTIVATION_PIPELINE_ARRAY_ITEM",
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
      "FEED_HOST_ACTIVATION_PIPELINE_INVARIANTS",
      "invariants must include all 20 release-blocking IDs",
    );
  }
  if (
    !Array.isArray(c.pipelineBlockers) ||
    !(c.pipelineBlockers as string[]).includes(
      PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
    )
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_BLOCKERS",
      "pipelineBlockers must include PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY",
    );
  }
  if (
    c.registrationState !== "registered" ||
    c.placementState !== "shadow-registered" ||
    c.eligibilityState !== "eligible" ||
    c.readinessState !== "ready" ||
    c.simulationState !== "completed" ||
    c.decisionState !== "completed" ||
    c.planState !== "completed"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_PREREQ",
      "prior-layer prerequisites mismatch",
    );
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_OWNERSHIP",
      "owner/writer/renderer must remain legacy",
    );
  }
  if (c.activationState !== "dormant") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_ACTIVATION_STATE",
      "activationState must remain dormant",
    );
  }
  if (c.rollbackState !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_ROLLBACK",
      "rollbackState must be prepared-not-active",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_FLAGS",
      "host/render activation and canStartActivation must be false",
    );
  }
  if (c.nextEligibleStep !== "3B.3.10") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_NEXT",
      "nextEligibleStep must be 3B.3.10",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_PIPELINE_BLOCKER",
      "activationBlocker must be PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY",
    );
  }
  return c as ControlledHostActivationPipelineDescriptor;
}
