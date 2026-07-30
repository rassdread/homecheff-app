/**
 * Phase 3B.3.15 — Controlled Host Activation Transition Selection (metadata only).
 * Deterministically selects the theoretical next transition candidate from the
 * sealed State Machine + Transition Graph. Never executes selection, traversal,
 * transition, activation, commit, or rollback. selectionExecuted remains false.
 * currentState / currentNode remain COMMIT_READY.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import { evaluateControlledHostActivationTransitionGraph } from "./controlled-host-activation-transition-graph";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY =
  "PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID =
  "feed.discovery.controlled-host.activation-transition-selection.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_VERSION =
  1 as const;

export type ControlledHostActivationTransitionSelectionState = "completed";

export type ControlledHostActivationTransitionSelectionResult =
  | "transition-selected-not-executable"
  | "transition-selection-blocked";

export const CONTROLLED_HOST_ACTIVATION_SELECTION_STRATEGY =
  "activation-path-priority-then-lexicographic-transition-id" as const;

export const CONTROLLED_HOST_ACTIVATION_SELECTION_TIE_BREAK =
  "lexicographic-transition-id" as const;

/** Outgoing theoretical edges from COMMIT_READY known in the sealed graph model. */
export const CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS = [
  "COMMIT_READY->ABORTED",
  "COMMIT_READY->ACTIVE",
  "COMMIT_READY->ROLLED_BACK",
] as const;

export const CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS = [
  "COMMIT_READY->ACTIVE",
] as const;

export const CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS = [
  "COMMIT_READY->ABORTED",
  "COMMIT_READY->ROLLED_BACK",
] as const;

export const CONTROLLED_HOST_ACTIVATION_SELECTION_PRIORITIES: Readonly<
  Record<(typeof CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS)[number], number>
> = {
  "COMMIT_READY->ACTIVE": 100,
  "COMMIT_READY->ABORTED": 10,
  "COMMIT_READY->ROLLED_BACK": 10,
};

export const CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION =
  "COMMIT_READY->ACTIVE" as const;

export const CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS = [
  "exactly-one-registered-host",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "transition-graph-complete-not-executable",
  "state-machine-complete-not-executable",
  "current-state-commit-ready",
  "current-node-commit-ready",
  "current-state-matches-current-node",
  "selected-edge-exists-in-graph-model",
  "selection-execution-forbidden",
  "transition-execution-forbidden",
  "graph-traversal-forbidden",
  "no-executor-authorized",
  "no-scheduler-authorized",
  "all-20-release-blocking-invariants",
] as const;

export const CONTROLLED_HOST_ACTIVATION_SELECTION_BLOCKERS = [
  PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
  "selection-execution-not-authorized",
  "transition-execution-not-authorized",
  "graph-traversal-not-authorized",
  "activation-executor-absent",
  "can-start-activation-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS = [
  "exactly-one-registered-host",
  "transition-graph-complete-not-executable",
  "state-machine-complete-not-executable",
  "protocol-complete-not-executable",
  "commit-ready-not-executable",
  "transaction-complete-not-committed",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "selection-not-executable",
] as const;

export const CONTROLLED_HOST_ACTIVATION_SELECTION_VALIDATION_POINTS = [
  "pre-selection-graph-complete",
  "pre-selection-machine-complete",
  "pre-selection-identity-stable",
  "pre-selection-ownership-legacy",
  "pre-selection-current-state-commit-ready",
  "post-selection-selected-edge-from-commit-ready",
  "post-selection-selection-executed-false",
  "post-selection-transition-executed-false",
  "post-selection-current-state-unchanged",
  "post-selection-current-node-unchanged",
] as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_INPUT_SOURCES = [
  "controlled-host-registry",
  "controlled-host-activation-state-machine",
  "controlled-host-activation-transition-graph",
  "feed-host-rollback-contract",
] as const;

export type ControlledHostActivationTransitionSelectionDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_SCHEMA_VERSION;
  phase: "3B.3.15";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  selectionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID;
  selectionVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_VERSION;
  selectionState: ControlledHostActivationTransitionSelectionState;
  selectionResult: "transition-selected-not-executable";
  selectionCompleted: true;
  selectionExecuted: false;
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  candidateTransitions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS;
  eligibleTransitions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS;
  ineligibleTransitions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS;
  selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  selectionReason: "highest-activation-path-priority-from-commit-ready";
  selectionStrategy: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_STRATEGY;
  selectionPriority: 100;
  selectionScore: 100;
  selectionGuards: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS;
  satisfiedGuards: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS;
  unsatisfiedGuards: readonly [];
  selectionBlockers: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_BLOCKERS;
  selectionPreconditions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS;
  selectionValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_VALIDATION_POINTS;
  alternativeTransitions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS;
  deterministicTieBreak: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_TIE_BREAK;
  selectionInputSources: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_INPUT_SOURCES;
  invariants: typeof FEED_SEALED_INVARIANT_IDS;
  graphResult: "transition-graph-complete-not-executable";
  machineResult: "state-machine-complete-not-executable";
  protocolResult: "protocol-complete-not-executable";
  readinessResult: "commit-ready-not-executable";
  transactionResult: "transaction-complete-not-committed";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  wouldActivate: true;
  wouldCommit: true;
  commitReady: true;
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  transactionCommitted: false;
  protocolExecuted: false;
  transitionExecuted: false;
  graphTraversalExecuted: false;
  selectionExecutionAllowed: false;
  transitionExecutionAllowed: false;
  graphTraversalAllowed: false;
  commitAllowed: false;
  rollbackAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  commitExecuted: false;
  rollbackExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  nextEligibleStep: "3B.3.16";
  activationBlocker: typeof PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY;
};

export type ControlledHostActivationTransitionSelectionDiagnostics = {
  selectionCompleted: true;
  selectionResult: "transition-selected-not-executable";
  selectionExecuted: false;
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  candidateTransitions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS;
  eligibleTransitions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS;
  ineligibleTransitions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS;
  selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  selectionReason: "highest-activation-path-priority-from-commit-ready";
  selectionStrategy: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_STRATEGY;
  selectionPriority: 100;
  selectionScore: 100;
  deterministicTieBreak: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_TIE_BREAK;
  selectionGuards: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS;
  satisfiedGuards: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS;
  unsatisfiedGuards: readonly [];
  selectionBlockers: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_BLOCKERS;
  selectionPreconditions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS;
  selectionValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_VALIDATION_POINTS;
  alternativeTransitions: typeof CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS;
  graphResult: "transition-graph-complete-not-executable";
  graphCompleted: true;
  machineResult: "state-machine-complete-not-executable";
  machineCompleted: true;
  protocolResult: "protocol-complete-not-executable";
  transactionResult: "transaction-complete-not-committed";
  commitReadinessResult: "commit-ready-not-executable";
  activationDecisionResult: "ALLOW";
  activationPlanResult: "plan-complete-not-executable";
  activationPipelineResult: "pipeline-complete-not-executable";
  transitionExecutionAllowed: false;
  graphTraversalAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  canStartActivation: false;
  selectionExecutionAllowed: false;
  currentPhase: "3B.3.15";
  nextEligibleStep: "3B.3.16";
  activeBlockers: readonly [typeof PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY];
  candidateCount: number;
  eligibleCount: number;
  ineligibleCount: number;
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  writerLegacy: true;
  rendererLegacy: true;
  rollbackPrepared: true;
  currentStateUnchanged: true;
  currentNodeUnchanged: true;
  executionImpossible: true;
};

export type ControlledHostActivationTransitionSelectionEvaluation = {
  descriptor: ControlledHostActivationTransitionSelectionDescriptor;
  diagnostics: ControlledHostActivationTransitionSelectionDiagnostics;
};

function sortLex(ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Pure selection engine — deterministic, no side effects.
 * Selects COMMIT_READY->ACTIVE as theoretical next candidate.
 * Never executes; currentState/currentNode remain COMMIT_READY.
 */
export function evaluateControlledHostActivationTransitionSelection(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransitionSelectionEvaluation {
  void createFeedHostRollbackContract();
  const graph = evaluateControlledHostActivationTransitionGraph(registry);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_HOST_COUNT",
      "Transition selection requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDS",
      "Transition selection requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_OWNERSHIP",
      "Transition selection requires legacy owner/writer/renderer",
    );
  }
  if (
    graph.descriptor.graphState !== "completed" ||
    graph.descriptor.graphResult !==
      "transition-graph-complete-not-executable" ||
    graph.descriptor.graphTraversalExecuted !== false ||
    graph.descriptor.currentNode !== "COMMIT_READY" ||
    graph.descriptor.currentState !== "COMMIT_READY"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_GRAPH",
      "Transition selection requires completed untraversed COMMIT_READY graph",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_ACTIVATION",
      "Transition selection forbids host/render activation",
    );
  }

  // Candidate = sealed outgoing edges from COMMIT_READY present in graph blockedPaths.
  const outgoing = graph.descriptor.blockedPaths.filter((p) =>
    p.startsWith("COMMIT_READY->"),
  );
  const sortedOutgoing = sortLex(outgoing);
  const expected = sortLex([
    ...CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS,
  ]);
  if (
    sortedOutgoing.length !== expected.length ||
    sortedOutgoing.some((id, i) => id !== expected[i])
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_CANDIDATES",
      "Candidate outgoing edges from COMMIT_READY must match sealed set",
    );
  }

  // Eligible = activation-path edges (to ACTIVE only). Ineligible = abort/rollback.
  const eligible = sortLex([
    ...CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS,
  ]);
  const ineligible = sortLex([
    ...CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS,
  ]);
  for (const e of eligible) {
    if (ineligible.includes(e)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_CLASSIFY",
        "Eligible and ineligible sets must be disjoint",
      );
    }
  }

  // Deterministic ranking: highest priority, then lexicographic transitionId.
  const ranked = [...eligible].sort((a, b) => {
    const pa =
      CONTROLLED_HOST_ACTIVATION_SELECTION_PRIORITIES[
        a as keyof typeof CONTROLLED_HOST_ACTIVATION_SELECTION_PRIORITIES
      ] ?? -1;
    const pb =
      CONTROLLED_HOST_ACTIVATION_SELECTION_PRIORITIES[
        b as keyof typeof CONTROLLED_HOST_ACTIVATION_SELECTION_PRIORITIES
      ] ?? -1;
    if (pb !== pa) return pb - pa;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  if (ranked.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_TIE",
      "Exactly one eligible winner required after priority+tie-break",
    );
  }
  const selected = ranked[0];
  if (selected !== CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_WINNER",
      "Selected transition must be COMMIT_READY->ACTIVE",
    );
  }

  const descriptor = createControlledHostActivationTransitionSelectionDescriptor();
  return {
    descriptor,
    diagnostics: {
      selectionCompleted: true,
      selectionResult: "transition-selected-not-executable",
      selectionExecuted: false,
      currentState: "COMMIT_READY",
      currentNode: "COMMIT_READY",
      candidateTransitions:
        CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS,
      eligibleTransitions:
        CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS,
      ineligibleTransitions:
        CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS,
      selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedFromState: "COMMIT_READY",
      selectedToState: "ACTIVE",
      selectionReason: "highest-activation-path-priority-from-commit-ready",
      selectionStrategy: CONTROLLED_HOST_ACTIVATION_SELECTION_STRATEGY,
      selectionPriority: 100,
      selectionScore: 100,
      deterministicTieBreak: CONTROLLED_HOST_ACTIVATION_SELECTION_TIE_BREAK,
      selectionGuards: CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS,
      satisfiedGuards: CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS,
      unsatisfiedGuards: [],
      selectionBlockers: CONTROLLED_HOST_ACTIVATION_SELECTION_BLOCKERS,
      selectionPreconditions:
        CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS,
      selectionValidationPoints:
        CONTROLLED_HOST_ACTIVATION_SELECTION_VALIDATION_POINTS,
      alternativeTransitions:
        CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS,
      graphResult: "transition-graph-complete-not-executable",
      graphCompleted: true,
      machineResult: "state-machine-complete-not-executable",
      machineCompleted: true,
      protocolResult: "protocol-complete-not-executable",
      transactionResult: "transaction-complete-not-committed",
      commitReadinessResult: "commit-ready-not-executable",
      activationDecisionResult: "ALLOW",
      activationPlanResult: "plan-complete-not-executable",
      activationPipelineResult: "pipeline-complete-not-executable",
      transitionExecutionAllowed: false,
      graphTraversalAllowed: false,
      executorAllowed: false,
      schedulerAllowed: false,
      canStartActivation: false,
      selectionExecutionAllowed: false,
      currentPhase: "3B.3.15",
      nextEligibleStep: "3B.3.16",
      activeBlockers: [PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY],
      candidateCount:
        CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS.length,
      eligibleCount:
        CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS.length,
      ineligibleCount:
        CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS.length,
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      rollbackPrepared: true,
      currentStateUnchanged: true,
      currentNodeUnchanged: true,
      executionImpossible: true,
    },
  };
}

export function createControlledHostActivationTransitionSelectionDescriptor(): ControlledHostActivationTransitionSelectionDescriptor {
  return validateControlledHostActivationTransitionSelectionDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_SCHEMA_VERSION,
    phase: "3B.3.15",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    selectionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
    selectionVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_VERSION,
    selectionState: "completed",
    selectionResult: "transition-selected-not-executable",
    selectionCompleted: true,
    selectionExecuted: false,
    currentState: "COMMIT_READY",
    currentNode: "COMMIT_READY",
    candidateTransitions:
      CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS,
    eligibleTransitions:
      CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS,
    ineligibleTransitions:
      CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS,
    selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
    selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
    selectedFromState: "COMMIT_READY",
    selectedToState: "ACTIVE",
    selectionReason: "highest-activation-path-priority-from-commit-ready",
    selectionStrategy: CONTROLLED_HOST_ACTIVATION_SELECTION_STRATEGY,
    selectionPriority: 100,
    selectionScore: 100,
    selectionGuards: CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS,
    satisfiedGuards: CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS,
    unsatisfiedGuards: [],
    selectionBlockers: CONTROLLED_HOST_ACTIVATION_SELECTION_BLOCKERS,
    selectionPreconditions:
      CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS,
    selectionValidationPoints:
      CONTROLLED_HOST_ACTIVATION_SELECTION_VALIDATION_POINTS,
    alternativeTransitions:
      CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS,
    deterministicTieBreak: CONTROLLED_HOST_ACTIVATION_SELECTION_TIE_BREAK,
    selectionInputSources:
      CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_INPUT_SOURCES,
    invariants: FEED_SEALED_INVARIANT_IDS,
    graphResult: "transition-graph-complete-not-executable",
    machineResult: "state-machine-complete-not-executable",
    protocolResult: "protocol-complete-not-executable",
    readinessResult: "commit-ready-not-executable",
    transactionResult: "transaction-complete-not-committed",
    pipelineResult: "pipeline-complete-not-executable",
    planResult: "plan-complete-not-executable",
    decisionResult: "ALLOW",
    wouldActivate: true,
    wouldCommit: true,
    commitReady: true,
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    transactionCommitted: false,
    protocolExecuted: false,
    transitionExecuted: false,
    graphTraversalExecuted: false,
    selectionExecutionAllowed: false,
    transitionExecutionAllowed: false,
    graphTraversalAllowed: false,
    commitAllowed: false,
    rollbackAllowed: false,
    executorAllowed: false,
    schedulerAllowed: false,
    commitExecuted: false,
    rollbackExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    nextEligibleStep: "3B.3.16",
    activationBlocker: PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
  });
}

export function validateControlledHostActivationTransitionSelectionDescriptor(
  candidate: unknown,
): ControlledHostActivationTransitionSelectionDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_INVALID",
      "Transition selection descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_SCHEMA",
      "Unsupported transition selection descriptor schemaVersion",
    );
  }
  if (c.phase !== "3B.3.15") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_PHASE",
      "phase must be 3B.3.15",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.selectionState !== "completed" ||
    c.selectionResult !== "transition-selected-not-executable" ||
    c.selectionCompleted !== true ||
    c.selectionExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_RESULT",
      "selection completed/not-executable/executed mismatch",
    );
  }
  if (
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.selectedFromState !== "COMMIT_READY" ||
    c.selectedToState !== "ACTIVE" ||
    c.selectedTransition !== "COMMIT_READY->ACTIVE" ||
    c.selectedTransitionId !== "COMMIT_READY->ACTIVE"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_SELECTED",
      "selected transition/current state must remain sealed",
    );
  }
  if (
    c.selectionExecuted !== false ||
    c.transitionExecuted !== false ||
    c.graphTraversalExecuted !== false ||
    c.protocolExecuted !== false ||
    c.transactionCommitted !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.activationState !== "dormant" ||
    c.selectionExecutionAllowed !== false ||
    c.transitionExecutionAllowed !== false ||
    c.graphTraversalAllowed !== false ||
    c.executorAllowed !== false ||
    c.schedulerAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_FLAGS",
      "execution/activation flags must remain false/dormant",
    );
  }
  if (
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.rollbackState !== "prepared-not-active"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_OWNER",
      "owner/writer/renderer/rollback must remain legacy/prepared",
    );
  }
  if (c.nextEligibleStep !== "3B.3.16") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_NEXT",
      "nextEligibleStep must be 3B.3.16",
    );
  }
  if (
    c.activationBlocker !==
    PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_DESCRIPTOR_BLOCKER",
      "activationBlocker must be PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY",
    );
  }
  return c as ControlledHostActivationTransitionSelectionDescriptor;
}
