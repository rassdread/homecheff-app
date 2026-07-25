/**
 * Phase 3B.3.14 — Controlled Host Activation Transition Graph (metadata only).
 * Deterministic graph of theoretical lifecycle nodes/edges/paths built atop
 * the Activation State Machine. Never traverses the graph, never executes
 * transitions, activation, commit, or rollback. graphTraversalExecuted and
 * transitionExecuted remain permanently false.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_CURRENT_STATE,
  CONTROLLED_HOST_ACTIVATION_INITIAL_STATE,
  CONTROLLED_HOST_ACTIVATION_LIFECYCLE_STATES,
  CONTROLLED_HOST_ACTIVATION_TERMINAL_STATES,
  evaluateControlledHostActivationStateMachine,
} from "./controlled-host-activation-state-machine";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY =
  "PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID =
  "feed.discovery.controlled-host.activation-transition-graph.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_VERSION = 1 as const;

export type ControlledHostActivationTransitionGraphState = "completed";

export type ControlledHostActivationTransitionGraphResult =
  "transition-graph-complete-not-executable";

export const CONTROLLED_HOST_ACTIVATION_GRAPH_NODES =
  CONTROLLED_HOST_ACTIVATION_LIFECYCLE_STATES;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES =
  CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_ENTRY_NODE =
  CONTROLLED_HOST_ACTIVATION_INITIAL_STATE;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_CURRENT_NODE =
  CONTROLLED_HOST_ACTIVATION_CURRENT_STATE;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_TERMINAL_NODES =
  CONTROLLED_HOST_ACTIVATION_TERMINAL_STATES;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_REACHABLE_NODES = [
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
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_UNREACHABLE_NODES = [
  "ACTIVE",
  "ABORTED",
  "ROLLED_BACK",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS = [
  "LEGACY_DORMANT->SHADOW_PLACED->REGISTERED->ELIGIBLE->READY->SIMULATED->DECIDED->PLANNED->PIPELINED->TRANSACTION_COMPLETE->COMMIT_READY",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS = [
  "COMMIT_READY->ACTIVE",
  "COMMIT_READY->ABORTED",
  "COMMIT_READY->ROLLED_BACK",
  "LEGACY_DORMANT->ACTIVE",
  "any->ACTIVE-without-authorization",
  "skip-ahead-to-ACTIVE",
  "reverse-from-COMMIT_READY",
  "forced-activation-traversal",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS = [
  "exactly-one-registered-host",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "state-machine-complete-not-executable",
  "current-node-commit-ready",
  "graph-traversal-forbidden",
  "transition-execution-forbidden",
  "no-executor-authorized",
  "no-scheduler-authorized",
  "all-20-release-blocking-invariants",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_BLOCKERS = [
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  "graph-traversal-not-authorized",
  "transition-execution-not-authorized",
  "activation-executor-absent",
  "can-start-activation-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS = [
  "exactly-one-registered-host",
  "state-machine-complete-not-executable",
  "protocol-complete-not-executable",
  "commit-ready-not-executable",
  "transaction-complete-not-committed",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "graph-traversal-not-executable",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_INPUT_SOURCES = [
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
  "controlled-host-activation-state-machine",
  "feed-host-rollback-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_BLOCKERS = [
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
] as const;

export type ControlledHostActivationTransitionGraphDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_SCHEMA_VERSION;
  phase: "3B.3.14";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  graphId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID;
  graphVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_VERSION;
  graphState: ControlledHostActivationTransitionGraphState;
  graphResult: ControlledHostActivationTransitionGraphResult;
  graphNodes: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_NODES;
  graphEdges: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES;
  entryNode: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_ENTRY_NODE;
  terminalNodes: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_TERMINAL_NODES;
  currentNode: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_CURRENT_NODE;
  reachableNodes: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_REACHABLE_NODES;
  unreachableNodes: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_UNREACHABLE_NODES;
  allowedPaths: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS;
  blockedPaths: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS;
  edgeGuards: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS;
  edgeBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_BLOCKERS;
  edgePreconditions: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS;
  blockedEdges: typeof CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS;
  graphInputSources: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_INPUT_SOURCES;
  graphBlockers: readonly (typeof PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY)[];
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  machineResult: "state-machine-complete-not-executable";
  currentState: "COMMIT_READY";
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
  stateMachineState: "completed";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  transactionCommitted: false;
  protocolExecuted: false;
  transitionExecuted: false;
  graphTraversalExecuted: false;
  commitExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.15";
  activationBlocker: typeof PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY;
};

export type ControlledHostActivationTransitionGraphDiagnostics = {
  graphCompleted: true;
  graphResult: ControlledHostActivationTransitionGraphResult;
  currentNode: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_CURRENT_NODE;
  entryNode: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_ENTRY_NODE;
  terminalNodes: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_TERMINAL_NODES;
  reachableNodes: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_REACHABLE_NODES;
  unreachableNodes: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_UNREACHABLE_NODES;
  allowedPaths: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS;
  blockedPaths: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS;
  edgeGuards: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS;
  edgeBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_BLOCKERS;
  edgePreconditions: typeof CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  machineResult: "state-machine-complete-not-executable";
  currentState: "COMMIT_READY";
  protocolResult: "protocol-complete-not-executable";
  readinessResult: "commit-ready-not-executable";
  transactionResult: "transaction-complete-not-committed";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  wouldCommit: true;
  commitReady: true;
  graphTraversalExecuted: false;
  transitionExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  activationBlocked: true;
  canStartActivation: false;
  currentPhase: "3B.3.14";
  nextEligibleStep: "3B.3.15";
  activeBlockers: readonly [typeof PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY];
  nodeCount: number;
  edgeCount: number;
  allowedPathCount: number;
  blockedPathCount: number;
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  writerLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
  activeUnreachable: true;
  traversalImpossible: true;
};

export type ControlledHostActivationTransitionGraphEvaluation = {
  descriptor: ControlledHostActivationTransitionGraphDescriptor;
  diagnostics: ControlledHostActivationTransitionGraphDiagnostics;
};

export function createControlledHostActivationTransitionGraphDescriptor(): ControlledHostActivationTransitionGraphDescriptor {
  return validateControlledHostActivationTransitionGraphDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_SCHEMA_VERSION,
    phase: "3B.3.14",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    graphId: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID,
    graphVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_VERSION,
    graphState: "completed",
    graphResult: "transition-graph-complete-not-executable",
    graphNodes: CONTROLLED_HOST_ACTIVATION_GRAPH_NODES,
    graphEdges: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES,
    entryNode: CONTROLLED_HOST_ACTIVATION_GRAPH_ENTRY_NODE,
    terminalNodes: CONTROLLED_HOST_ACTIVATION_GRAPH_TERMINAL_NODES,
    currentNode: CONTROLLED_HOST_ACTIVATION_GRAPH_CURRENT_NODE,
    reachableNodes: CONTROLLED_HOST_ACTIVATION_GRAPH_REACHABLE_NODES,
    unreachableNodes: CONTROLLED_HOST_ACTIVATION_GRAPH_UNREACHABLE_NODES,
    allowedPaths: CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS,
    blockedPaths: CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS,
    edgeGuards: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS,
    edgeBlockers: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_BLOCKERS,
    edgePreconditions: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS,
    blockedEdges: CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS,
    graphInputSources: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_INPUT_SOURCES,
    graphBlockers: [...CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_BLOCKERS],
    invariants: FEED_SEALED_INVARIANT_IDS,
    machineResult: "state-machine-complete-not-executable",
    currentState: "COMMIT_READY",
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
    stateMachineState: "completed",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    transactionCommitted: false,
    protocolExecuted: false,
    transitionExecuted: false,
    graphTraversalExecuted: false,
    commitExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.15",
    activationBlocker: PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  });
}

/**
 * Pure transition-graph engine — deterministic, no side effects.
 * Builds nodes/edges/paths from sealed state machine metadata.
 * graphTraversalExecuted remains false; ACTIVE is unreachable.
 */
export function evaluateControlledHostActivationTransitionGraph(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransitionGraphEvaluation {
  void createFeedHostRollbackContract();
  const machine = evaluateControlledHostActivationStateMachine(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_HOST_COUNT",
      "Transition graph requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_IDS",
      "Transition graph requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_OWNERSHIP",
      "Transition graph requires legacy owner/writer/renderer",
    );
  }
  if (
    machine.descriptor.machineState !== "completed" ||
    machine.descriptor.machineResult !==
      "state-machine-complete-not-executable" ||
    machine.descriptor.transitionExecuted !== false ||
    machine.descriptor.currentState !== "COMMIT_READY"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_MACHINE",
      "Transition graph requires completed unexecuted COMMIT_READY state machine",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_ACTIVATION",
      "Transition graph forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationTransitionGraphDescriptor();
  return {
    descriptor,
    diagnostics: {
      graphCompleted: true,
      graphResult: "transition-graph-complete-not-executable",
      currentNode: CONTROLLED_HOST_ACTIVATION_GRAPH_CURRENT_NODE,
      entryNode: CONTROLLED_HOST_ACTIVATION_GRAPH_ENTRY_NODE,
      terminalNodes: CONTROLLED_HOST_ACTIVATION_GRAPH_TERMINAL_NODES,
      reachableNodes: CONTROLLED_HOST_ACTIVATION_GRAPH_REACHABLE_NODES,
      unreachableNodes: CONTROLLED_HOST_ACTIVATION_GRAPH_UNREACHABLE_NODES,
      allowedPaths: CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS,
      blockedPaths: CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS,
      edgeGuards: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS,
      edgeBlockers: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_BLOCKERS,
      edgePreconditions: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS,
      invariants: FEED_SEALED_INVARIANT_IDS,
      machineResult: "state-machine-complete-not-executable",
      currentState: "COMMIT_READY",
      protocolResult: "protocol-complete-not-executable",
      readinessResult: "commit-ready-not-executable",
      transactionResult: "transaction-complete-not-committed",
      pipelineResult: "pipeline-complete-not-executable",
      planResult: "plan-complete-not-executable",
      decisionResult: "ALLOW",
      wouldActivate: true,
      wouldCommit: true,
      commitReady: true,
      graphTraversalExecuted: false,
      transitionExecuted: false,
      protocolExecuted: false,
      transactionCommitted: false,
      activationBlocked: true,
      canStartActivation: false,
      currentPhase: "3B.3.14",
      nextEligibleStep: "3B.3.15",
      activeBlockers: [PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY],
      nodeCount: CONTROLLED_HOST_ACTIVATION_GRAPH_NODES.length,
      edgeCount: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES.length,
      allowedPathCount: CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS.length,
      blockedPathCount: CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS.length,
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
      activeUnreachable: true,
      traversalImpossible: true,
    },
  };
}

export function validateControlledHostActivationTransitionGraphDescriptor(
  candidate: unknown,
): ControlledHostActivationTransitionGraphDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_INVALID",
      "Transition graph descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_SCHEMA",
      "Unsupported transition graph descriptor schemaVersion",
    );
  }
  if (c.phase !== "3B.3.14") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_PHASE",
      "phase must be 3B.3.14",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.graphId !== CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID ||
    c.graphVersion !== CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_GRAPH_ID",
      "graphId/graphVersion mismatch",
    );
  }
  if (
    c.graphState !== "completed" ||
    c.graphResult !== "transition-graph-complete-not-executable"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_RESULT",
      "graphState/graphResult mismatch",
    );
  }
  if (
    c.currentNode !== "COMMIT_READY" ||
    c.entryNode !== "LEGACY_DORMANT" ||
    c.currentState !== "COMMIT_READY" ||
    c.machineResult !== "state-machine-complete-not-executable"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_NODE",
      "currentNode/entryNode/machine must remain sealed",
    );
  }
  if (
    c.graphTraversalExecuted !== false ||
    c.transitionExecuted !== false ||
    c.protocolExecuted !== false ||
    c.transactionCommitted !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.activationState !== "dormant"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_FLAGS",
      "traversal/transition/activation flags must remain false/dormant",
    );
  }
  if (
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.rollbackState !== "prepared-not-active"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_OWNER",
      "owner/writer/renderer/rollback must remain legacy/prepared",
    );
  }
  if (c.nextEligibleStep !== "3B.3.15") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_NEXT",
      "nextEligibleStep must be 3B.3.15",
    );
  }
  if (
    c.activationBlocker !== PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_BLOCKER",
      "activationBlocker must be PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY",
    );
  }
  for (const key of [
    "graphNodes",
    "graphEdges",
    "terminalNodes",
    "reachableNodes",
    "unreachableNodes",
    "allowedPaths",
    "blockedPaths",
    "edgeGuards",
    "edgeBlockers",
    "edgePreconditions",
    "blockedEdges",
    "graphInputSources",
    "invariants",
  ] as const) {
    if (!Array.isArray(c[key]) || (c[key] as unknown[]).length < 1) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_ARRAY",
        `${key} must be a non-empty array`,
      );
    }
  }
  if (
    !(c.unreachableNodes as string[]).includes("ACTIVE") ||
    !(c.blockedPaths as string[]).includes("COMMIT_READY->ACTIVE") ||
    !(c.reachableNodes as string[]).includes("COMMIT_READY")
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_DESCRIPTOR_REACHABILITY",
      "ACTIVE unreachable; COMMIT_READY reachable; COMMIT_READY->ACTIVE blocked",
    );
  }
  return c as ControlledHostActivationTransitionGraphDescriptor;
}
