/**
 * Phase 3B.3.13 — Controlled Host Activation State Machine (metadata only).
 * Deterministic description of theoretical host-activation lifecycle states
 * and allowed/blocked transitions. Never executes transitions, activation,
 * commit, or rollback. transitionExecuted remains permanently false.
 * currentState is COMMIT_READY; ACTIVE exists only as a theoretical terminal.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostActivationCommitProtocol } from "./controlled-host-activation-commit-protocol";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY =
  "PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID =
  "feed.discovery.controlled-host.activation-state-machine.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_VERSION = 1 as const;

export type ControlledHostActivationStateMachineState = "completed";

export type ControlledHostActivationStateMachineResult =
  "state-machine-complete-not-executable";

export const CONTROLLED_HOST_ACTIVATION_LIFECYCLE_STATES = [
  "LEGACY_DORMANT",
  "SHADOW_PLACED",
  "REGISTERED",
  "ELIGIBLE",
  "READY",
  "SIMULATED",
  "DECIDED",
  "PLANNED",
  "PIPELINED",
  "TRANSACTION_COMPLETE",
  "COMMIT_READY",
  "ACTIVE",
  "ABORTED",
  "ROLLED_BACK",
] as const;

export type ControlledHostActivationLifecycleState =
  (typeof CONTROLLED_HOST_ACTIVATION_LIFECYCLE_STATES)[number];

export const CONTROLLED_HOST_ACTIVATION_INITIAL_STATE =
  "LEGACY_DORMANT" as const;

export const CONTROLLED_HOST_ACTIVATION_CURRENT_STATE =
  "COMMIT_READY" as const;

export const CONTROLLED_HOST_ACTIVATION_TERMINAL_STATES = [
  "ACTIVE",
  "ABORTED",
  "ROLLED_BACK",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS = [
  "LEGACY_DORMANT->SHADOW_PLACED",
  "SHADOW_PLACED->REGISTERED",
  "REGISTERED->ELIGIBLE",
  "ELIGIBLE->READY",
  "READY->SIMULATED",
  "SIMULATED->DECIDED",
  "DECIDED->PLANNED",
  "PLANNED->PIPELINED",
  "PIPELINED->TRANSACTION_COMPLETE",
  "TRANSACTION_COMPLETE->COMMIT_READY",
] as const;

export const CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS = [
  "COMMIT_READY->ACTIVE",
  "COMMIT_READY->ABORTED",
  "COMMIT_READY->ROLLED_BACK",
  "ACTIVE->LEGACY_DORMANT",
  "any->ACTIVE-without-authorization",
  "skip-ahead-to-ACTIVE",
  "reverse-from-COMMIT_READY",
  "forced-activation-transition",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS = [
  "exactly-one-registered-host",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "commit-protocol-complete-not-executable",
  "commit-ready-true",
  "would-commit-true",
  "protocol-executed-false",
  "transaction-committed-false",
  "transition-execution-forbidden",
  "no-executor-authorized",
  "no-scheduler-authorized",
  "all-20-release-blocking-invariants",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_REASONS = [
  "metadata-lifecycle-modelling-only",
  "current-state-commit-ready-sealed",
  "active-is-theoretical-terminal-only",
  "phase-3b3-13-forbids-transition-execution",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_BLOCKERS = [
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  "transition-execution-not-authorized",
  "activation-executor-absent",
  "commit-not-authorized",
  "can-start-activation-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS = [
  "exactly-one-registered-host",
  "protocol-complete-not-executable",
  "commit-ready-not-executable",
  "transaction-complete-not-committed",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "transition-not-executable",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS = [
  "pre-machine-protocol-complete",
  "pre-machine-commit-ready",
  "pre-machine-identity-stable",
  "pre-machine-ownership-legacy",
  "post-model-current-state-commit-ready",
  "post-model-transition-executed-false",
  "post-model-protocol-executed-false",
  "post-model-transaction-committed-false",
  "post-model-active-unreachable",
] as const;

export const CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_INPUT_SOURCES = [
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
  "controlled-host-activation-commit-protocol",
  "feed-host-rollback-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_BLOCKERS = [
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
] as const;

export type ControlledHostActivationStateMachineDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_SCHEMA_VERSION;
  phase: "3B.3.13";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  machineId: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID;
  machineVersion: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_VERSION;
  machineState: ControlledHostActivationStateMachineState;
  machineResult: ControlledHostActivationStateMachineResult;
  currentState: typeof CONTROLLED_HOST_ACTIVATION_CURRENT_STATE;
  initialState: typeof CONTROLLED_HOST_ACTIVATION_INITIAL_STATE;
  terminalStates: typeof CONTROLLED_HOST_ACTIVATION_TERMINAL_STATES;
  lifecycleStates: typeof CONTROLLED_HOST_ACTIVATION_LIFECYCLE_STATES;
  allowedTransitions: typeof CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS;
  blockedTransitions: typeof CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS;
  transitionGuards: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS;
  transitionReasons: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_REASONS;
  transitionBlockers: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_BLOCKERS;
  transitionPreconditions: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS;
  transitionValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS;
  machineInputSources: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_INPUT_SOURCES;
  machineBlockers: readonly (typeof PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY)[];
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  protocolResult: "protocol-complete-not-executable";
  readinessResult: "commit-ready-not-executable";
  transactionResult: "transaction-complete-not-committed";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  wouldCommit: true;
  commitReady: true;
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
  commitProtocolState: "completed";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  transactionCommitted: false;
  protocolExecuted: false;
  transitionExecuted: false;
  commitExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.14";
  activationBlocker: typeof PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY;
};

export type ControlledHostActivationStateMachineDiagnostics = {
  machineCompleted: true;
  machineResult: ControlledHostActivationStateMachineResult;
  currentState: typeof CONTROLLED_HOST_ACTIVATION_CURRENT_STATE;
  initialState: typeof CONTROLLED_HOST_ACTIVATION_INITIAL_STATE;
  terminalStates: typeof CONTROLLED_HOST_ACTIVATION_TERMINAL_STATES;
  allowedTransitions: typeof CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS;
  blockedTransitions: typeof CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS;
  transitionGuards: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS;
  transitionReasons: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_REASONS;
  transitionBlockers: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_BLOCKERS;
  transitionPreconditions: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS;
  transitionValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  protocolResult: "protocol-complete-not-executable";
  readinessResult: "commit-ready-not-executable";
  transactionResult: "transaction-complete-not-committed";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  wouldCommit: true;
  commitReady: true;
  transitionExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.13";
  nextEligibleStep: "3B.3.14";
  activeBlockers: readonly [typeof PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY];
  allowedTransitionCount: number;
  blockedTransitionCount: number;
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  writerLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
  activeUnreachable: true;
};

export type ControlledHostActivationStateMachineEvaluation = {
  descriptor: ControlledHostActivationStateMachineDescriptor;
  diagnostics: ControlledHostActivationStateMachineDiagnostics;
};

export function createControlledHostActivationStateMachineDescriptor(): ControlledHostActivationStateMachineDescriptor {
  return validateControlledHostActivationStateMachineDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_SCHEMA_VERSION,
    phase: "3B.3.13",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    machineId: CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID,
    machineVersion: CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_VERSION,
    machineState: "completed",
    machineResult: "state-machine-complete-not-executable",
    currentState: CONTROLLED_HOST_ACTIVATION_CURRENT_STATE,
    initialState: CONTROLLED_HOST_ACTIVATION_INITIAL_STATE,
    terminalStates: CONTROLLED_HOST_ACTIVATION_TERMINAL_STATES,
    lifecycleStates: CONTROLLED_HOST_ACTIVATION_LIFECYCLE_STATES,
    allowedTransitions: CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS,
    blockedTransitions: CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS,
    transitionGuards: CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS,
    transitionReasons: CONTROLLED_HOST_ACTIVATION_TRANSITION_REASONS,
    transitionBlockers: CONTROLLED_HOST_ACTIVATION_TRANSITION_BLOCKERS,
    transitionPreconditions:
      CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS,
    transitionValidationPoints:
      CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS,
    machineInputSources:
      CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_INPUT_SOURCES,
    machineBlockers: [...CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_BLOCKERS],
    invariants: FEED_SEALED_INVARIANT_IDS,
    protocolResult: "protocol-complete-not-executable",
    readinessResult: "commit-ready-not-executable",
    transactionResult: "transaction-complete-not-committed",
    pipelineResult: "pipeline-complete-not-executable",
    planResult: "plan-complete-not-executable",
    decisionResult: "ALLOW",
    wouldActivate: true,
    wouldCommit: true,
    commitReady: true,
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
    commitProtocolState: "completed",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    transactionCommitted: false,
    protocolExecuted: false,
    transitionExecuted: false,
    commitExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.14",
    activationBlocker: PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  });
}

/**
 * Pure state-machine engine — deterministic, no side effects.
 * Models lifecycle states and transitions from sealed commit protocol.
 * transitionExecuted remains false; ACTIVE is unreachable.
 */
export function evaluateControlledHostActivationStateMachine(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationStateMachineEvaluation {
  void createFeedHostRollbackContract();
  const protocol = evaluateControlledHostActivationCommitProtocol(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_HOST_COUNT",
      "State machine requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_IDS",
      "State machine requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_OWNERSHIP",
      "State machine requires legacy owner/writer/renderer",
    );
  }
  if (
    protocol.descriptor.protocolState !== "completed" ||
    protocol.descriptor.protocolResult !==
      "protocol-complete-not-executable" ||
    protocol.descriptor.protocolExecuted !== false ||
    protocol.descriptor.commitReady !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PROTOCOL",
      "State machine requires completed unexecuted commit-ready protocol",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_ACTIVATION",
      "State machine forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationStateMachineDescriptor();
  return {
    descriptor,
    diagnostics: {
      machineCompleted: true,
      machineResult: "state-machine-complete-not-executable",
      currentState: CONTROLLED_HOST_ACTIVATION_CURRENT_STATE,
      initialState: CONTROLLED_HOST_ACTIVATION_INITIAL_STATE,
      terminalStates: CONTROLLED_HOST_ACTIVATION_TERMINAL_STATES,
      allowedTransitions: CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS,
      blockedTransitions: CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS,
      transitionGuards: CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS,
      transitionReasons: CONTROLLED_HOST_ACTIVATION_TRANSITION_REASONS,
      transitionBlockers: CONTROLLED_HOST_ACTIVATION_TRANSITION_BLOCKERS,
      transitionPreconditions:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS,
      transitionValidationPoints:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS,
      invariants: FEED_SEALED_INVARIANT_IDS,
      protocolResult: "protocol-complete-not-executable",
      readinessResult: "commit-ready-not-executable",
      transactionResult: "transaction-complete-not-committed",
      pipelineResult: "pipeline-complete-not-executable",
      planResult: "plan-complete-not-executable",
      decisionResult: "ALLOW",
      wouldActivate: true,
      wouldCommit: true,
      commitReady: true,
      transitionExecuted: false,
      protocolExecuted: false,
      transactionCommitted: false,
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.13",
      nextEligibleStep: "3B.3.14",
      activeBlockers: [PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY],
      allowedTransitionCount:
        CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS.length,
      blockedTransitionCount:
        CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS.length,
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
      activeUnreachable: true,
    },
  };
}

export function validateControlledHostActivationStateMachineDescriptor(
  candidate: unknown,
): ControlledHostActivationStateMachineDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_INVALID",
      "State machine descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_SCHEMA",
      "Unsupported state machine schemaVersion",
    );
  }
  if (c.phase !== "3B.3.13") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_PHASE",
      "phase must be 3B.3.13",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.machineId !== CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID ||
    c.machineVersion !== CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_ID_VERSION",
      "machineId/machineVersion must match sealed constants",
    );
  }
  if (c.machineState !== "completed") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_STATE",
      "machineState must be completed",
    );
  }
  if (c.machineResult !== "state-machine-complete-not-executable") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_RESULT",
      "machineResult must be state-machine-complete-not-executable",
    );
  }
  if (c.currentState !== "COMMIT_READY") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CURRENT",
      "currentState must be COMMIT_READY",
    );
  }
  if (c.initialState !== "LEGACY_DORMANT") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_INITIAL",
      "initialState must be LEGACY_DORMANT",
    );
  }
  if (c.transitionExecuted !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_TRANSITION_EXECUTED",
      "transitionExecuted must remain false",
    );
  }
  if (
    !Array.isArray(c.allowedTransitions) ||
    (c.allowedTransitions as string[]).length !==
      CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_ALLOWED",
      "allowedTransitions must match sealed length",
    );
  }
  if (
    !Array.isArray(c.blockedTransitions) ||
    (c.blockedTransitions as string[]).length !==
      CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_BLOCKED",
      "blockedTransitions must match sealed length",
    );
  }
  if (
    !(c.blockedTransitions as string[]).includes("COMMIT_READY->ACTIVE") ||
    !(c.terminalStates as string[]).includes("ACTIVE")
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_ACTIVE",
      "ACTIVE must be terminal and COMMIT_READY->ACTIVE blocked",
    );
  }
  if (
    c.protocolResult !== "protocol-complete-not-executable" ||
    c.readinessResult !== "commit-ready-not-executable" ||
    c.transactionResult !== "transaction-complete-not-committed" ||
    c.decisionResult !== "ALLOW" ||
    c.wouldCommit !== true ||
    c.commitReady !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_UPSTREAM",
      "upstream protocol/readiness/transaction/decision mismatch",
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
      "FEED_HOST_ACTIVATION_STATE_MACHINE_OWNERSHIP",
      "owner/writer/renderer/activation/rollback mismatch",
    );
  }
  if (
    c.transactionCommitted !== false ||
    c.protocolExecuted !== false ||
    c.commitExecuted !== false ||
    c.ownershipTransferred !== false ||
    c.writerTransferred !== false ||
    c.rendererTransferred !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_FLAGS",
      "commit/protocol/transition/transfer/activation flags must remain false",
    );
  }
  if (
    !Array.isArray(c.invariants) ||
    (c.invariants as string[]).length !== FEED_SEALED_INVARIANT_IDS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_INVARIANTS",
      "invariants must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.14") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_NEXT",
      "nextEligibleStep must be 3B.3.14",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_ACTIVATION_BLOCKER",
      "activationBlocker must be PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY",
    );
  }
  return c as ControlledHostActivationStateMachineDescriptor;
}
