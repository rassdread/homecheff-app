/**
 * Phase 3B.3.10 — Controlled Host Activation Transaction (metadata only).
 * Deterministic atomic-activation description from registration through pipeline.
 * Never executes activation, commit, or rollback. No React/runtime mutations.
 *
 * Atomicity is metadata-only: wouldCommit may be true while transactionCommitted
 * remains permanently false; partial execution is impossible because no executor exists.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostActivationPipeline } from "./controlled-host-activation-pipeline";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_SCHEMA_VERSION = 1 as const;

export const PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY =
  "PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID =
  "feed.discovery.controlled-host.activation-transaction.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_VERSION = 1 as const;

export type ControlledHostActivationTransactionState = "completed";

export type ControlledHostActivationTransactionResult =
  "transaction-complete-not-committed";

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES = [
  "controlled-host-registry",
  "controlled-feed-host-shadow-placement",
  "controlled-host-eligibility",
  "controlled-host-activation-readiness",
  "controlled-host-shadow-activation-simulation",
  "controlled-host-activation-decision",
  "controlled-host-activation-plan",
  "controlled-host-activation-pipeline",
  "feed-host-rollback-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_BEGIN_STATE =
  "legacy-dormant-single-mount" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_INTENDED_END_STATE =
  "controlled-host-active-same-instance-no-remount" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS = [
  "exactly-one-registered-host",
  "pipeline-complete-not-executable",
  "plan-complete-not-executable",
  "decision-allow",
  "would-activate-true",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "single-mount-identity-preserved",
  "all-20-release-blocking-invariants",
  "executor-authorized-future-only",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS = [
  "any-commit-precondition-fails",
  "runtime-id-changed",
  "ownership-not-legacy",
  "second-mount-detected",
  "forced-activation-attempt",
  "executor-or-scheduler-present",
  "transaction-partial-attempt",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_VALIDATION_CHECKPOINTS = [
  "pre-begin-registry-single-host",
  "pre-begin-pipeline-complete",
  "pre-begin-decision-allow",
  "pre-begin-plan-complete",
  "pre-commit-identity-stable",
  "pre-commit-ownership-legacy",
  "pre-commit-rollback-prepared",
  "post-model-transaction-committed-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS = [
  "tx-begin-declared",
  "tx-preconditions-sealed",
  "tx-commit-conditions-sealed",
  "tx-rollback-conditions-sealed",
  "tx-compensating-actions-sealed",
  "tx-hold-uncommitted",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS = [
  "retain-legacy-owner",
  "retain-legacy-writer",
  "retain-legacy-renderer",
  "retain-prepared-not-active-rollback",
  "retain-single-mount-identity",
  "refuse-partial-commit",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS = [
  "host-count-not-one",
  "runtime-id-changed",
  "pipeline-not-complete",
  "decision-not-allow",
  "ownership-not-legacy",
  "renderer-not-legacy",
  "rollback-not-prepared",
  "forced-activation-attempt",
  "executor-or-scheduler-present",
  "commit-attempted",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_BLOCKERS = [
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
] as const;

export type ControlledHostActivationTransactionDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_SCHEMA_VERSION;
  phase: "3B.3.10";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  transactionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID;
  transactionVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_VERSION;
  transactionState: ControlledHostActivationTransactionState;
  transactionResult: ControlledHostActivationTransactionResult;
  wouldCommit: true;
  transactionCommitted: false;
  beginState: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_BEGIN_STATE;
  intendedEndState: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_INTENDED_END_STATE;
  commitConditions: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS;
  rollbackConditions: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS;
  validationCheckpoints: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_VALIDATION_CHECKPOINTS;
  transactionCheckpoints: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS;
  compensatingActions: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  transactionInputSources: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES;
  transactionBlockers: readonly (typeof PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY)[];
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  registrationState: "registered";
  placementState: "shadow-registered";
  eligibilityState: "eligible";
  readinessState: "ready";
  simulationState: "completed";
  decisionState: "completed";
  planState: "completed";
  pipelineState: "completed";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.11";
  activationBlocker: typeof PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY;
};

export type ControlledHostActivationTransactionDiagnostics = {
  transactionCompleted: true;
  transactionResult: ControlledHostActivationTransactionResult;
  wouldCommit: true;
  transactionCommitted: false;
  beginState: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_BEGIN_STATE;
  intendedEndState: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_INTENDED_END_STATE;
  commitConditions: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS;
  rollbackConditions: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS;
  transactionCheckpoints: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS;
  validationCheckpoints: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_VALIDATION_CHECKPOINTS;
  compensatingActions: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  transactionInputSources: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES;
  activationBlocked: true;
  canStartActivation: false;
  commitBlocked: true;
  rollbackExecutionBlocked: true;
  currentPhase: "3B.3.10";
  nextEligibleStep: "3B.3.11";
  activeBlockers: readonly [typeof PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY];
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  readinessStatus: "ready";
  eligibilityStatus: "eligible";
  simulationStatus: "completed";
  decisionStatus: "completed";
  planStatus: "completed";
  pipelineStatus: "completed";
  missingConditionsForExecution: readonly [
    "activation-executor-not-authorized",
    "transaction-commit-not-authorized",
    "rollback-execution-not-authorized",
    "can-start-activation-must-remain-false",
    "scheduler-not-authorized",
    "atomic-transaction-metadata-only",
  ];
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
};

export type ControlledHostActivationTransactionEvaluation = {
  descriptor: ControlledHostActivationTransactionDescriptor;
  diagnostics: ControlledHostActivationTransactionDiagnostics;
};

export function createControlledHostActivationTransactionDescriptor(): ControlledHostActivationTransactionDescriptor {
  return validateControlledHostActivationTransactionDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_TRANSACTION_SCHEMA_VERSION,
    phase: "3B.3.10",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    transactionId: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
    transactionVersion: CONTROLLED_HOST_ACTIVATION_TRANSACTION_VERSION,
    transactionState: "completed",
    transactionResult: "transaction-complete-not-committed",
    wouldCommit: true,
    transactionCommitted: false,
    beginState: CONTROLLED_HOST_ACTIVATION_TRANSACTION_BEGIN_STATE,
    intendedEndState: CONTROLLED_HOST_ACTIVATION_TRANSACTION_INTENDED_END_STATE,
    commitConditions: CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS,
    rollbackConditions:
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS,
    validationCheckpoints:
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_VALIDATION_CHECKPOINTS,
    transactionCheckpoints:
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS,
    compensatingActions:
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS,
    abortConditions: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS,
    invariants: FEED_SEALED_INVARIANT_IDS,
    transactionInputSources:
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES,
    transactionBlockers: [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_BLOCKERS],
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    pipelineResult: "pipeline-complete-not-executable",
    wouldActivate: true,
    registrationState: "registered",
    placementState: "shadow-registered",
    eligibilityState: "eligible",
    readinessState: "ready",
    simulationState: "completed",
    decisionState: "completed",
    planState: "completed",
    pipelineState: "completed",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.11",
    activationBlocker: PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  });
}

/**
 * Pure activation transaction engine — deterministic, no side effects.
 * wouldCommit=true models that sealed prerequisites agree a future atomic
 * commit could be valid; transactionCommitted remains false forever in this phase.
 * Atomicity: no codepath can execute a partial commit because executor/commit
 * are unauthorized and compensating actions are descriptive only.
 */
export function evaluateControlledHostActivationTransaction(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransactionEvaluation {
  void createFeedHostRollbackContract();
  const pipeline = evaluateControlledHostActivationPipeline(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_HOST_COUNT",
      "Activation transaction requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_IDS",
      "Activation transaction requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_OWNERSHIP",
      "Activation transaction requires legacy owner/writer/renderer",
    );
  }
  if (
    pipeline.descriptor.pipelineState !== "completed" ||
    pipeline.descriptor.pipelineResult !== "pipeline-complete-not-executable" ||
    pipeline.descriptor.decisionResult !== "ALLOW" ||
    pipeline.descriptor.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PIPELINE",
      "Activation transaction requires completed non-executable pipeline with ALLOW decision",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_ACTIVATION",
      "Activation transaction forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationTransactionDescriptor();
  return {
    descriptor,
    diagnostics: {
      transactionCompleted: true,
      transactionResult: "transaction-complete-not-committed",
      wouldCommit: true,
      transactionCommitted: false,
      beginState: CONTROLLED_HOST_ACTIVATION_TRANSACTION_BEGIN_STATE,
      intendedEndState:
        CONTROLLED_HOST_ACTIVATION_TRANSACTION_INTENDED_END_STATE,
      commitConditions:
        CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS,
      rollbackConditions:
        CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS,
      transactionCheckpoints:
        CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS,
      validationCheckpoints:
        CONTROLLED_HOST_ACTIVATION_TRANSACTION_VALIDATION_CHECKPOINTS,
      compensatingActions:
        CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS,
      abortConditions: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS,
      invariants: FEED_SEALED_INVARIANT_IDS,
      transactionInputSources:
        CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES,
      activationBlocked: true,
      canStartActivation: false,
      commitBlocked: true,
      rollbackExecutionBlocked: true,
      currentPhase: "3B.3.10",
      nextEligibleStep: "3B.3.11",
      activeBlockers: [PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY],
      decisionResult: "ALLOW",
      planResult: "plan-complete-not-executable",
      pipelineResult: "pipeline-complete-not-executable",
      wouldActivate: true,
      readinessStatus: "ready",
      eligibilityStatus: "eligible",
      simulationStatus: "completed",
      decisionStatus: "completed",
      planStatus: "completed",
      pipelineStatus: "completed",
      missingConditionsForExecution: [
        "activation-executor-not-authorized",
        "transaction-commit-not-authorized",
        "rollback-execution-not-authorized",
        "can-start-activation-must-remain-false",
        "scheduler-not-authorized",
        "atomic-transaction-metadata-only",
      ],
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
    },
  };
}

export function validateControlledHostActivationTransactionDescriptor(
  candidate: unknown,
): ControlledHostActivationTransactionDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_INVALID",
      "Activation transaction descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_TRANSACTION_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_SCHEMA",
      "Unsupported activation transaction schemaVersion",
    );
  }
  if (c.phase !== "3B.3.10") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PHASE",
      "phase must be 3B.3.10",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.transactionId !== CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID ||
    c.transactionVersion !== CONTROLLED_HOST_ACTIVATION_TRANSACTION_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_ID_VERSION",
      "transactionId/transactionVersion must match sealed constants",
    );
  }
  if (c.transactionState !== "completed") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_STATE",
      "transactionState must be completed",
    );
  }
  if (c.transactionResult !== "transaction-complete-not-committed") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_RESULT",
      "transactionResult must be transaction-complete-not-committed",
    );
  }
  if (c.wouldCommit !== true) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_WOULD_COMMIT",
      "wouldCommit must be true when sealed prerequisites agree",
    );
  }
  if (c.transactionCommitted !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_COMMITTED",
      "transactionCommitted must remain false",
    );
  }
  if (
    c.beginState !== CONTROLLED_HOST_ACTIVATION_TRANSACTION_BEGIN_STATE ||
    c.intendedEndState !==
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_INTENDED_END_STATE
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_STATES",
      "beginState/intendedEndState mismatch",
    );
  }
  if (
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PRIOR",
      "decision/plan/pipeline/wouldActivate mismatch",
    );
  }
  for (const [key, expected] of [
    [
      "commitConditions",
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS,
    ],
    [
      "rollbackConditions",
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS,
    ],
    [
      "validationCheckpoints",
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_VALIDATION_CHECKPOINTS,
    ],
    [
      "transactionCheckpoints",
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS,
    ],
    [
      "compensatingActions",
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS,
    ],
    [
      "abortConditions",
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS,
    ],
  ] as const) {
    if (!Array.isArray(c[key])) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSACTION_ARRAY",
        `${key} must be an array`,
      );
    }
    for (const item of expected) {
      if (!(c[key] as string[]).includes(item)) {
        throw new HardContractViolation(
          "FEED_HOST_ACTIVATION_TRANSACTION_ARRAY_ITEM",
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
      "FEED_HOST_ACTIVATION_TRANSACTION_INVARIANTS",
      "invariants must include all 20 release-blocking IDs",
    );
  }
  if (
    !Array.isArray(c.transactionBlockers) ||
    !(c.transactionBlockers as string[]).includes(
      PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
    )
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_BLOCKERS",
      "transactionBlockers must include PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY",
    );
  }
  if (
    c.registrationState !== "registered" ||
    c.placementState !== "shadow-registered" ||
    c.eligibilityState !== "eligible" ||
    c.readinessState !== "ready" ||
    c.simulationState !== "completed" ||
    c.decisionState !== "completed" ||
    c.planState !== "completed" ||
    c.pipelineState !== "completed"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_PREREQ",
      "prior-layer prerequisites mismatch",
    );
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_OWNERSHIP",
      "owner/writer/renderer must remain legacy",
    );
  }
  if (c.activationState !== "dormant") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_ACTIVATION_STATE",
      "activationState must remain dormant",
    );
  }
  if (c.rollbackState !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_ROLLBACK",
      "rollbackState must be prepared-not-active",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_FLAGS",
      "host/render activation and canStartActivation must be false",
    );
  }
  if (c.nextEligibleStep !== "3B.3.11") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_NEXT",
      "nextEligibleStep must be 3B.3.11",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_BLOCKER",
      "activationBlocker must be PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY",
    );
  }
  return c as ControlledHostActivationTransactionDescriptor;
}
