/**
 * Phase 3B.3.11 — Controlled Host Activation Commit Readiness (metadata only).
 * Deterministic evaluation of whether a future Activation Transaction is
 * theoretically commit-ready. Never executes commit, activation, ownership
 * transfer, or runtime mutation.
 *
 * commitReady may be true while commitBlocked remains true and
 * transactionCommitted remains permanently false.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostActivationTransaction } from "./controlled-host-activation-transaction";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY =
  "PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_ID =
  "feed.discovery.controlled-host.activation-commit-readiness.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_VERSION = 1 as const;

export type ControlledHostActivationCommitReadinessState = "completed";

export type ControlledHostActivationCommitReadinessResult =
  "commit-ready-not-executable";

export const CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_INPUT_SOURCES = [
  "controlled-host-registry",
  "controlled-feed-host-shadow-placement",
  "controlled-host-eligibility",
  "controlled-host-activation-readiness",
  "controlled-host-shadow-activation-simulation",
  "controlled-host-activation-decision",
  "controlled-host-activation-plan",
  "controlled-host-activation-pipeline",
  "controlled-host-activation-transaction",
  "feed-host-rollback-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS = [
  "exactly-one-registered-host",
  "transaction-complete-not-committed",
  "would-commit-true",
  "pipeline-complete-not-executable",
  "plan-complete-not-executable",
  "decision-allow",
  "would-activate-true",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "single-mount-identity-preserved",
  "all-20-release-blocking-invariants",
  "no-ownership-transfer",
  "no-writer-transfer",
  "no-renderer-transfer",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS = [
  "pre-readiness-transaction-complete",
  "pre-readiness-would-commit-true",
  "pre-readiness-identity-stable",
  "pre-readiness-ownership-legacy",
  "pre-readiness-rollback-prepared",
  "post-model-transaction-committed-false",
  "post-model-commit-executed-false",
  "post-model-transfers-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS = [
  "host-count-not-one",
  "runtime-id-changed",
  "transaction-not-complete",
  "would-commit-false",
  "ownership-not-legacy",
  "writer-not-legacy",
  "renderer-not-legacy",
  "rollback-not-prepared",
  "forced-activation-attempt",
  "executor-or-scheduler-present",
  "commit-attempted",
  "ownership-transfer-attempted",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_BLOCKERS = [
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
] as const;

export type ControlledHostActivationCommitReadinessDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_SCHEMA_VERSION;
  phase: "3B.3.11";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readinessId: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_ID;
  readinessVersion: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_VERSION;
  readinessState: ControlledHostActivationCommitReadinessState;
  readinessResult: ControlledHostActivationCommitReadinessResult;
  wouldCommit: true;
  commitReady: true;
  commitBlocked: true;
  commitBlockers: readonly (typeof PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY)[];
  commitPreconditions: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS;
  commitValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS;
  commitAbortConditions: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS;
  readinessInputSources: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_INPUT_SOURCES;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  transactionResult: "transaction-complete-not-committed";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  registrationState: "registered";
  placementState: "shadow-registered";
  eligibilityState: "eligible";
  readinessStateUpstream: "ready";
  simulationState: "completed";
  decisionState: "completed";
  planState: "completed";
  pipelineState: "completed";
  transactionState: "completed";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  transactionCommitted: false;
  commitExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.12";
  activationBlocker: typeof PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY;
};

export type ControlledHostActivationCommitReadinessDiagnostics = {
  readinessCompleted: true;
  readinessResult: ControlledHostActivationCommitReadinessResult;
  commitReady: true;
  wouldCommit: true;
  commitBlocked: true;
  commitBlockers: readonly [typeof PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY];
  commitPreconditions: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS;
  validationPoints: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS;
  transactionResult: "transaction-complete-not-committed";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  transactionCommitted: false;
  commitExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.11";
  nextEligibleStep: "3B.3.12";
  activeBlockers: readonly [typeof PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY];
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  writerLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
};

export type ControlledHostActivationCommitReadinessEvaluation = {
  descriptor: ControlledHostActivationCommitReadinessDescriptor;
  diagnostics: ControlledHostActivationCommitReadinessDiagnostics;
};

export function createControlledHostActivationCommitReadinessDescriptor(): ControlledHostActivationCommitReadinessDescriptor {
  return validateControlledHostActivationCommitReadinessDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_SCHEMA_VERSION,
    phase: "3B.3.11",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    readinessId: CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_ID,
    readinessVersion: CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_VERSION,
    readinessState: "completed",
    readinessResult: "commit-ready-not-executable",
    wouldCommit: true,
    commitReady: true,
    commitBlocked: true,
    commitBlockers: [
      ...CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_BLOCKERS,
    ],
    commitPreconditions: CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS,
    commitValidationPoints:
      CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS,
    commitAbortConditions: CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS,
    readinessInputSources:
      CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_INPUT_SOURCES,
    invariants: FEED_SEALED_INVARIANT_IDS,
    transactionResult: "transaction-complete-not-committed",
    pipelineResult: "pipeline-complete-not-executable",
    planResult: "plan-complete-not-executable",
    decisionResult: "ALLOW",
    wouldActivate: true,
    registrationState: "registered",
    placementState: "shadow-registered",
    eligibilityState: "eligible",
    readinessStateUpstream: "ready",
    simulationState: "completed",
    decisionState: "completed",
    planState: "completed",
    pipelineState: "completed",
    transactionState: "completed",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    transactionCommitted: false,
    commitExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.12",
    activationBlocker: PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  });
}

/**
 * Pure commit-readiness engine — deterministic, no side effects.
 * commitReady=true when sealed transaction prerequisites agree a future commit
 * could be valid; commitBlocked remains true and no commit path exists.
 */
export function evaluateControlledHostActivationCommitReadiness(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationCommitReadinessEvaluation {
  void createFeedHostRollbackContract();
  const transaction = evaluateControlledHostActivationTransaction(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_HOST_COUNT",
      "Commit readiness requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_IDS",
      "Commit readiness requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_OWNERSHIP",
      "Commit readiness requires legacy owner/writer/renderer",
    );
  }
  if (
    transaction.descriptor.transactionState !== "completed" ||
    transaction.descriptor.transactionResult !==
      "transaction-complete-not-committed" ||
    transaction.descriptor.wouldCommit !== true ||
    transaction.descriptor.transactionCommitted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_TRANSACTION",
      "Commit readiness requires completed uncommitted transaction with wouldCommit",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_ACTIVATION",
      "Commit readiness forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationCommitReadinessDescriptor();
  return {
    descriptor,
    diagnostics: {
      readinessCompleted: true,
      readinessResult: "commit-ready-not-executable",
      commitReady: true,
      wouldCommit: true,
      commitBlocked: true,
      commitBlockers: [PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY],
      commitPreconditions: CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS,
      validationPoints: CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS,
      abortConditions: CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS,
      transactionResult: "transaction-complete-not-committed",
      pipelineResult: "pipeline-complete-not-executable",
      planResult: "plan-complete-not-executable",
      decisionResult: "ALLOW",
      wouldActivate: true,
      transactionCommitted: false,
      commitExecuted: false,
      ownershipTransferred: false,
      writerTransferred: false,
      rendererTransferred: false,
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.11",
      nextEligibleStep: "3B.3.12",
      activeBlockers: [PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY],
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
    },
  };
}

export function validateControlledHostActivationCommitReadinessDescriptor(
  candidate: unknown,
): ControlledHostActivationCommitReadinessDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_INVALID",
      "Commit readiness descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_SCHEMA",
      "Unsupported commit readiness schemaVersion",
    );
  }
  if (c.phase !== "3B.3.11") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_PHASE",
      "phase must be 3B.3.11",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.readinessId !== CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_ID ||
    c.readinessVersion !== CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_ID_VERSION",
      "readinessId/readinessVersion must match sealed constants",
    );
  }
  if (c.readinessState !== "completed") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_STATE",
      "readinessState must be completed",
    );
  }
  if (c.readinessResult !== "commit-ready-not-executable") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_RESULT",
      "readinessResult must be commit-ready-not-executable",
    );
  }
  if (c.wouldCommit !== true) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_WOULD_COMMIT",
      "wouldCommit must be true when sealed prerequisites agree",
    );
  }
  if (c.commitReady !== true) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_COMMIT_READY",
      "commitReady must be true when sealed prerequisites agree",
    );
  }
  if (c.commitBlocked !== true) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_COMMIT_BLOCKED",
      "commitBlocked must remain true",
    );
  }
  if (
    !Array.isArray(c.commitBlockers) ||
    !(c.commitBlockers as string[]).includes(
      PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
    )
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_BLOCKERS",
      "commitBlockers must include PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY",
    );
  }
  if (
    c.transactionResult !== "transaction-complete-not-committed" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_UPSTREAM",
      "transaction/pipeline/plan/decision/wouldActivate mismatch",
    );
  }
  if (
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.activationState !== "dormant" ||
    c.rollbackState !== "prepared-not-active"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_OWNERSHIP",
      "owner/writer/renderer/activation/rollback mismatch",
    );
  }
  if (
    c.transactionCommitted !== false ||
    c.commitExecuted !== false ||
    c.ownershipTransferred !== false ||
    c.writerTransferred !== false ||
    c.rendererTransferred !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_FLAGS",
      "commit/transfer/activation flags must remain false",
    );
  }
  if (
    !Array.isArray(c.invariants) ||
    (c.invariants as string[]).length !== FEED_SEALED_INVARIANT_IDS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_INVARIANTS",
      "invariants must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.12") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_NEXT",
      "nextEligibleStep must be 3B.3.12",
    );
  }
  if (
    c.activationBlocker !== PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_READINESS_ACTIVATION_BLOCKER",
      "activationBlocker must be PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY",
    );
  }
  return c as ControlledHostActivationCommitReadinessDescriptor;
}
