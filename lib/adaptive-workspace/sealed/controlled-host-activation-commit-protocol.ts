/**
 * Phase 3B.3.12 — Controlled Host Activation Commit Protocol (metadata only).
 * Deterministic description of how a future Activation Transaction may someday
 * be committed. Never executes commit, activation, ownership transfer, or
 * protocol stages. protocolExecuted remains permanently false.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostActivationCommitReadiness } from "./controlled-host-activation-commit-readiness";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY =
  "PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID =
  "feed.discovery.controlled-host.activation-commit-protocol.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VERSION = 1 as const;

export type ControlledHostActivationCommitProtocolState = "completed";

export type ControlledHostActivationCommitProtocolResult =
  "protocol-complete-not-executable";

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_INPUT_SOURCES = [
  "controlled-host-registry",
  "controlled-feed-host-shadow-placement",
  "controlled-host-eligibility",
  "controlled-host-activation-readiness",
  "controlled-host-shadow-activation-simulation",
  "controlled-host-activation-decision",
  "controlled-host-activation-plan",
  "controlled-host-activation-pipeline",
  "controlled-host-activation-transaction",
  "controlled-host-activation-commit-readiness",
  "feed-host-rollback-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES = [
  "verify-single-host-registry",
  "verify-commit-readiness",
  "verify-identity-stable",
  "verify-ownership-legacy",
  "verify-writer-legacy",
  "verify-renderer-legacy",
  "verify-rollback-prepared",
  "seal-commit-guards",
  "seal-commit-sequence",
  "hold-protocol-unexecuted",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGE_SEQUENCE =
  CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE = [
  "guard-host-count-one",
  "guard-commit-ready",
  "guard-would-commit",
  "guard-runtime-id-stable",
  "guard-owner-legacy",
  "guard-writer-legacy",
  "guard-renderer-legacy",
  "guard-rollback-prepared",
  "guard-no-executor",
  "hold-uncommitted",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS = [
  "exactly-one-registered-host",
  "commit-ready-true",
  "would-commit-true",
  "commit-readiness-complete",
  "transaction-complete-not-committed",
  "stable-runtime-id",
  "legacy-owner",
  "legacy-writer",
  "legacy-renderer",
  "rollback-prepared-not-active",
  "no-executor-authorized",
  "no-scheduler-authorized",
  "protocol-execution-forbidden",
  "all-20-release-blocking-invariants",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_PRECONDITIONS = [
  "exactly-one-registered-host",
  "commit-ready-not-executable",
  "would-commit-true",
  "transaction-complete-not-committed",
  "pipeline-complete-not-executable",
  "plan-complete-not-executable",
  "decision-allow",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "protocol-not-executable",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VALIDATION_POINTS = [
  "pre-protocol-commit-ready",
  "pre-protocol-identity-stable",
  "pre-protocol-ownership-legacy",
  "pre-protocol-writer-legacy",
  "pre-protocol-renderer-legacy",
  "pre-protocol-rollback-prepared",
  "post-model-protocol-executed-false",
  "post-model-transaction-committed-false",
  "post-model-transfers-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS = [
  "owner-is-legacy",
  "ownership-transferred-false",
  "no-workspace-owner",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS = [
  "renderer-is-legacy",
  "renderer-transferred-false",
  "no-workspace-renderer",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS = [
  "writer-is-legacy",
  "writer-transferred-false",
  "no-workspace-writer",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_ROLLBACK_PREPARATION = [
  "rollback-target-legacy",
  "rollback-readiness-prepared-not-active",
  "compensating-actions-descriptive-only",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ABORT_CONDITIONS = [
  "host-count-not-one",
  "runtime-id-changed",
  "commit-not-ready",
  "would-commit-false",
  "ownership-not-legacy",
  "writer-not-legacy",
  "renderer-not-legacy",
  "rollback-not-prepared",
  "forced-activation-attempt",
  "executor-or-scheduler-present",
  "protocol-execution-attempted",
  "commit-attempted",
] as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_BLOCKERS = [
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
] as const;

export type ControlledHostActivationCommitProtocolDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_SCHEMA_VERSION;
  phase: "3B.3.12";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  protocolId: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID;
  protocolVersion: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VERSION;
  protocolState: ControlledHostActivationCommitProtocolState;
  protocolResult: ControlledHostActivationCommitProtocolResult;
  protocolExecuted: false;
  wouldCommit: true;
  commitReady: true;
  commitBlocked: true;
  protocolStages: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES;
  stageSequence: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGE_SEQUENCE;
  commitSequence: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE;
  commitGuards: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS;
  commitPreconditions: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_PRECONDITIONS;
  commitValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VALIDATION_POINTS;
  ownershipChecks: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS;
  rendererChecks: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS;
  writerChecks: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS;
  rollbackPreparation: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_ROLLBACK_PREPARATION;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ABORT_CONDITIONS;
  protocolInputSources: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_INPUT_SOURCES;
  protocolBlockers: readonly (typeof PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY)[];
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  readinessResult: "commit-ready-not-executable";
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
  commitReadinessState: "completed";
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
  nextEligibleStep: "3B.3.13";
  activationBlocker: typeof PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY;
};

export type ControlledHostActivationCommitProtocolDiagnostics = {
  protocolCompleted: true;
  protocolResult: ControlledHostActivationCommitProtocolResult;
  protocolExecuted: false;
  wouldCommit: true;
  commitReady: true;
  commitBlocked: true;
  protocolStages: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES;
  commitSequence: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE;
  commitGuards: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS;
  ownershipChecks: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS;
  rendererChecks: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS;
  writerChecks: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS;
  validationPoints: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VALIDATION_POINTS;
  rollbackPreparation: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_ROLLBACK_PREPARATION;
  abortConditions: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ABORT_CONDITIONS;
  readinessResult: "commit-ready-not-executable";
  transactionResult: "transaction-complete-not-committed";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  transactionCommitted: false;
  commitExecuted: false;
  protocolExecutedFlag: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.12";
  nextEligibleStep: "3B.3.13";
  activeBlockers: readonly [typeof PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY];
  stageCount: number;
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  writerLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
};

export type ControlledHostActivationCommitProtocolEvaluation = {
  descriptor: ControlledHostActivationCommitProtocolDescriptor;
  diagnostics: ControlledHostActivationCommitProtocolDiagnostics;
};

export function createControlledHostActivationCommitProtocolDescriptor(): ControlledHostActivationCommitProtocolDescriptor {
  return validateControlledHostActivationCommitProtocolDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_SCHEMA_VERSION,
    phase: "3B.3.12",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    protocolId: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID,
    protocolVersion: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VERSION,
    protocolState: "completed",
    protocolResult: "protocol-complete-not-executable",
    protocolExecuted: false,
    wouldCommit: true,
    commitReady: true,
    commitBlocked: true,
    protocolStages: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES,
    stageSequence: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGE_SEQUENCE,
    commitSequence: CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE,
    commitGuards: CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS,
    commitPreconditions:
      CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_PRECONDITIONS,
    commitValidationPoints:
      CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VALIDATION_POINTS,
    ownershipChecks: CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS,
    rendererChecks: CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS,
    writerChecks: CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS,
    rollbackPreparation:
      CONTROLLED_HOST_ACTIVATION_COMMIT_ROLLBACK_PREPARATION,
    abortConditions: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ABORT_CONDITIONS,
    protocolInputSources:
      CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_INPUT_SOURCES,
    protocolBlockers: [...CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_BLOCKERS],
    invariants: FEED_SEALED_INVARIANT_IDS,
    readinessResult: "commit-ready-not-executable",
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
    commitReadinessState: "completed",
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
    nextEligibleStep: "3B.3.13",
    activationBlocker: PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  });
}

/**
 * Pure commit-protocol engine — deterministic, no side effects.
 * Builds sealed stages, commit sequence, and guards from commit-readiness.
 * protocolExecuted remains false; no executor can run stages.
 */
export function evaluateControlledHostActivationCommitProtocol(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationCommitProtocolEvaluation {
  void createFeedHostRollbackContract();
  const readiness = evaluateControlledHostActivationCommitReadiness(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_HOST_COUNT",
      "Commit protocol requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_IDS",
      "Commit protocol requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_OWNERSHIP",
      "Commit protocol requires legacy owner/writer/renderer",
    );
  }
  if (
    readiness.descriptor.readinessState !== "completed" ||
    readiness.descriptor.readinessResult !== "commit-ready-not-executable" ||
    readiness.descriptor.commitReady !== true ||
    readiness.descriptor.wouldCommit !== true ||
    readiness.descriptor.transactionCommitted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_READINESS",
      "Commit protocol requires completed commit-ready uncommitted readiness",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_ACTIVATION",
      "Commit protocol forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationCommitProtocolDescriptor();
  return {
    descriptor,
    diagnostics: {
      protocolCompleted: true,
      protocolResult: "protocol-complete-not-executable",
      protocolExecuted: false,
      wouldCommit: true,
      commitReady: true,
      commitBlocked: true,
      protocolStages: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES,
      commitSequence: CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE,
      commitGuards: CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS,
      ownershipChecks: CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS,
      rendererChecks: CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS,
      writerChecks: CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS,
      validationPoints:
        CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VALIDATION_POINTS,
      rollbackPreparation:
        CONTROLLED_HOST_ACTIVATION_COMMIT_ROLLBACK_PREPARATION,
      abortConditions:
        CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ABORT_CONDITIONS,
      readinessResult: "commit-ready-not-executable",
      transactionResult: "transaction-complete-not-committed",
      pipelineResult: "pipeline-complete-not-executable",
      planResult: "plan-complete-not-executable",
      decisionResult: "ALLOW",
      wouldActivate: true,
      transactionCommitted: false,
      commitExecuted: false,
      protocolExecutedFlag: false,
      ownershipTransferred: false,
      writerTransferred: false,
      rendererTransferred: false,
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.12",
      nextEligibleStep: "3B.3.13",
      activeBlockers: [PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY],
      stageCount: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES.length,
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
    },
  };
}

export function validateControlledHostActivationCommitProtocolDescriptor(
  candidate: unknown,
): ControlledHostActivationCommitProtocolDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_INVALID",
      "Commit protocol descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_SCHEMA",
      "Unsupported commit protocol schemaVersion",
    );
  }
  if (c.phase !== "3B.3.12") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_PHASE",
      "phase must be 3B.3.12",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.protocolId !== CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID ||
    c.protocolVersion !== CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID_VERSION",
      "protocolId/protocolVersion must match sealed constants",
    );
  }
  if (c.protocolState !== "completed") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_STATE",
      "protocolState must be completed",
    );
  }
  if (c.protocolResult !== "protocol-complete-not-executable") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_RESULT",
      "protocolResult must be protocol-complete-not-executable",
    );
  }
  if (c.protocolExecuted !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_EXECUTED",
      "protocolExecuted must remain false",
    );
  }
  if (c.wouldCommit !== true || c.commitReady !== true || c.commitBlocked !== true) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_COMMIT_FLAGS",
      "wouldCommit/commitReady must be true; commitBlocked must remain true",
    );
  }
  for (const [key, expected] of [
    ["protocolStages", CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES],
    ["stageSequence", CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGE_SEQUENCE],
    ["commitSequence", CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE],
    ["commitGuards", CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS],
    ["ownershipChecks", CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS],
    ["rendererChecks", CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS],
    ["writerChecks", CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS],
  ] as const) {
    if (!Array.isArray(c[key]) || (c[key] as string[]).length !== expected.length) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_ARRAY",
        `${key} must match sealed length`,
      );
    }
  }
  if (
    c.readinessResult !== "commit-ready-not-executable" ||
    c.transactionResult !== "transaction-complete-not-committed" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_UPSTREAM",
      "upstream readiness/transaction/pipeline/plan/decision mismatch",
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
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_OWNERSHIP",
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
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_FLAGS",
      "commit/transfer/activation flags must remain false",
    );
  }
  if (
    !Array.isArray(c.invariants) ||
    (c.invariants as string[]).length !== FEED_SEALED_INVARIANT_IDS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_INVARIANTS",
      "invariants must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.13") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_NEXT",
      "nextEligibleStep must be 3B.3.13",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_ACTIVATION_BLOCKER",
      "activationBlocker must be PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY",
    );
  }
  return c as ControlledHostActivationCommitProtocolDescriptor;
}
