/**
 * Phase 3B.3.16 — Controlled Host Activation Transition Preflight (metadata only).
 * Validates the selected transition candidate across sealed layers.
 * Never executes, never authorizes, never mutates state/runtime.
 * preflightReady may be true while transitionAuthorized remains false.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
  evaluateControlledHostActivationTransitionSelection,
} from "./controlled-host-activation-transition-selection";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID,
} from "./controlled-host-activation-transition-graph";
import {
  CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID,
} from "./controlled-host-activation-state-machine";
import {
  CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID,
} from "./controlled-host-activation-commit-protocol";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
} from "./controlled-host-activation-transaction";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY =
  "PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID =
  "feed.discovery.controlled-host.activation-transition-preflight.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_VERSION =
  1 as const;

export type ControlledHostActivationTransitionPreflightState = "completed";

export type ControlledHostActivationTransitionPreflightResult =
  | "transition-preflight-ready-not-authorized"
  | "transition-preflight-blocked";

/** Ordered unique mandatory preflight check IDs. */
export const CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS = [
  // A Identity
  "host-id-match",
  "runtime-id-match",
  "machine-id-match",
  "graph-id-match",
  "transition-id-match",
  "protocol-id-match",
  "transaction-id-match",
  // B State
  "current-state-is-commit-ready",
  "current-node-is-commit-ready",
  "selected-from-state-matches-current-state",
  "selected-from-state-matches-current-node",
  "selected-target-state-exists",
  "source-state-is-not-mutated",
  "current-state-remains-commit-ready",
  // C Graph
  "selected-edge-exists",
  "selected-edge-is-reachable",
  "selected-edge-is-candidate",
  "selected-edge-is-eligible",
  "selected-edge-is-not-ineligible",
  "selected-edge-from-state-valid",
  "selected-edge-to-state-valid",
  "selected-edge-identity-stable",
  // D Selection
  "selection-completed",
  "selection-result-valid",
  "selection-executed-false",
  "selection-strategy-deterministic",
  "selection-priority-valid",
  "selection-tie-break-valid",
  "selection-guards-complete",
  "selection-blockers-complete",
  // E Commit
  "commit-readiness-complete",
  "commit-ready-metadata-valid",
  "commit-protocol-complete",
  "protocol-executed-false",
  "transaction-complete",
  "transaction-committed-false",
  "commit-executed-false",
  "commit-allowed-false",
  // F Rollback
  "rollback-preparation-present",
  "rollback-state-preserved",
  "rollback-executed-false",
  "rollback-execution-allowed-false",
  "rollback-allowed-false",
  // G Ownership
  "owner-is-legacy",
  "writer-is-legacy",
  "renderer-is-legacy",
  "ownership-transferred-false",
  "writer-transferred-false",
  "renderer-transferred-false",
  // H Runtime (metadata-sealed expectations)
  "runtime-id-stable",
  "single-geofeed-instance",
  "mount-count-one",
  "unmount-count-zero",
  "react-identity-stable",
  "request-identity-stable",
  "request-keys-stable",
  "pagination-stable",
  "observer-state-stable",
  "cache-state-stable",
  "filters-stable",
  "loading-stable",
  "skeletons-stable",
  "tiles-stable",
  "scroll-stable",
  "ssr-stable",
  "hydration-clean",
  "dom-delta-zero",
  "renderer-delta-zero",
  "writer-delta-zero",
  // I Execution-block
  "preflight-executed-false",
  "transition-authorized-false",
  "authorization-granted-false",
  "transition-execution-allowed-false",
  "graph-traversal-allowed-false",
  "selection-execution-allowed-false",
  "executor-allowed-false",
  "scheduler-allowed-false",
  "can-start-activation-false",
  "activation-state-false",
  "host-activation-false",
  "render-activation-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PREFLIGHT_BLOCKERS = [
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  "transition-authorization-not-granted",
  "transition-execution-not-authorized",
  "preflight-execution-not-authorized",
  "activation-executor-absent",
  "can-start-activation-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PREFLIGHT_PRECONDITIONS = [
  "exactly-one-registered-host",
  "transition-selected-not-executable",
  "transition-graph-complete-not-executable",
  "state-machine-complete-not-executable",
  "protocol-complete-not-executable",
  "commit-ready-not-executable",
  "transaction-complete-not-committed",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "preflight-not-executable",
] as const;

export const CONTROLLED_HOST_ACTIVATION_PREFLIGHT_VALIDATION_POINTS = [
  "pre-preflight-selection-complete",
  "pre-preflight-graph-complete",
  "pre-preflight-machine-complete",
  "pre-preflight-protocol-complete",
  "pre-preflight-identity-stable",
  "post-preflight-ready-not-authorized",
  "post-preflight-executed-false",
  "post-preflight-authorized-false",
  "post-preflight-current-state-unchanged",
  "post-preflight-current-node-unchanged",
] as const;

export type ControlledHostActivationTransitionPreflightDescriptor = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_SCHEMA_VERSION;
  phase: "3B.3.16";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  preflightId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID;
  preflightVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_VERSION;
  preflightState: ControlledHostActivationTransitionPreflightState;
  preflightResult: "transition-preflight-ready-not-authorized";
  preflightCompleted: true;
  preflightReady: true;
  preflightBlocked: true;
  preflightExecuted: false;
  preflightChecks: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS;
  passedChecks: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS;
  failedChecks: readonly [];
  warningChecks: readonly [];
  preflightBlockers: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_BLOCKERS;
  preflightPreconditions: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_PRECONDITIONS;
  preflightValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_VALIDATION_POINTS;
  preflightInvariants: typeof FEED_SEALED_INVARIANT_IDS;
  selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  selectionResult: "transition-selected-not-executable";
  selectionCompleted: true;
  selectionExecuted: false;
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  sourceStateValid: true;
  targetStateValid: true;
  edgeValid: true;
  edgeIdentityValid: true;
  transitionIdentityValid: true;
  graphIdentityValid: true;
  machineIdentityValid: true;
  protocolIdentityValid: true;
  transactionIdentityValid: true;
  hostIdentityValid: true;
  runtimeIdentityValid: true;
  ownershipInvariantValid: true;
  writerInvariantValid: true;
  rendererInvariantValid: true;
  mountInvariantValid: true;
  lifecycleInvariantValid: true;
  requestInvariantValid: true;
  cacheInvariantValid: true;
  observerInvariantValid: true;
  domInvariantValid: true;
  hydrationInvariantValid: true;
  rollbackPrepared: true;
  rollbackAvailable: true;
  rollbackExecutionAllowed: false;
  transitionAuthorized: false;
  authorizationGranted: false;
  transitionExecutionAllowed: false;
  graphTraversalAllowed: false;
  selectionExecutionAllowed: false;
  preflightExecutionAllowed: false;
  transitionAuthorizationAllowed: false;
  commitAllowed: false;
  rollbackAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  canStartActivation: false;
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  activationState: "dormant";
  transitionExecuted: false;
  graphTraversalExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  commitExecuted: false;
  rollbackExecuted: false;
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
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
  selectionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID;
  graphId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID;
  machineId: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID;
  protocolId: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID;
  transactionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID;
  nextEligibleStep: "3B.3.17";
  activationBlocker: typeof PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY;
};

export type ControlledHostActivationTransitionPreflightDiagnostics = {
  preflightCompleted: true;
  preflightReady: true;
  preflightBlocked: true;
  preflightResult: "transition-preflight-ready-not-authorized";
  preflightExecuted: false;
  preflightChecks: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS;
  passedChecks: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS;
  failedChecks: readonly [];
  warningChecks: readonly [];
  preflightBlockers: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_BLOCKERS;
  preflightPreconditions: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_PRECONDITIONS;
  preflightValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_VALIDATION_POINTS;
  selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  selectionResult: "transition-selected-not-executable";
  selectionStrategy: "activation-path-priority-then-lexicographic-transition-id";
  selectionPriority: 100;
  deterministicTieBreak: "lexicographic-transition-id";
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  sourceStateValid: true;
  targetStateValid: true;
  edgeValid: true;
  edgeIdentityValid: true;
  transitionIdentityValid: true;
  graphIdentityValid: true;
  machineIdentityValid: true;
  protocolIdentityValid: true;
  transactionIdentityValid: true;
  hostIdentityValid: true;
  runtimeIdentityValid: true;
  ownershipInvariantValid: true;
  writerInvariantValid: true;
  rendererInvariantValid: true;
  mountInvariantValid: true;
  lifecycleInvariantValid: true;
  requestInvariantValid: true;
  cacheInvariantValid: true;
  observerInvariantValid: true;
  domInvariantValid: true;
  hydrationInvariantValid: true;
  rollbackPrepared: true;
  rollbackAvailable: true;
  transitionAuthorized: false;
  authorizationGranted: false;
  transitionExecutionAllowed: false;
  graphTraversalAllowed: false;
  selectionExecutionAllowed: false;
  preflightExecutionAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  canStartActivation: false;
  graphResult: "transition-graph-complete-not-executable";
  machineResult: "state-machine-complete-not-executable";
  protocolResult: "protocol-complete-not-executable";
  transactionResult: "transaction-complete-not-committed";
  commitReadinessResult: "commit-ready-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  planResult: "plan-complete-not-executable";
  decisionResult: "ALLOW";
  currentPhase: "3B.3.16";
  nextEligibleStep: "3B.3.17";
  activeBlockers: readonly [typeof PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY];
  checkCount: number;
  passedCount: number;
  failedCount: 0;
  warningCount: 0;
  registryHostCount: 1;
  runtimeIdStable: true;
  ownershipLegacy: true;
  writerLegacy: true;
  rendererLegacy: true;
  rollbackPreparedFlag: true;
  currentStateUnchanged: true;
  currentNodeUnchanged: true;
  authorizationImpossible: true;
  executionImpossible: true;
};

export type ControlledHostActivationTransitionPreflightEvaluation = {
  descriptor: ControlledHostActivationTransitionPreflightDescriptor;
  diagnostics: ControlledHostActivationTransitionPreflightDiagnostics;
};

function assertUniqueChecks(ids: readonly string[]) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DUPLICATE_CHECK",
        `Duplicate preflight check id: ${id}`,
      );
    }
    seen.add(id);
  }
}

/**
 * Pure preflight engine — deterministic, no side effects.
 * All mandatory checks pass when sealed upstream metadata is valid.
 * Authorization and execution remain permanently false.
 */
export function evaluateControlledHostActivationTransitionPreflight(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransitionPreflightEvaluation {
  void createFeedHostRollbackContract();
  const selection = evaluateControlledHostActivationTransitionSelection(registry);

  assertUniqueChecks(CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS);

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_HOST_COUNT",
      "Preflight requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_IDS",
      "Preflight requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_OWNERSHIP",
      "Preflight requires legacy owner/writer/renderer",
    );
  }
  const d = selection.descriptor;
  if (
    d.selectionResult !== "transition-selected-not-executable" ||
    d.selectionExecuted !== false ||
    d.selectedTransition !== CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION ||
    d.currentState !== "COMMIT_READY" ||
    d.currentNode !== "COMMIT_READY" ||
    d.selectedFromState !== "COMMIT_READY" ||
    d.selectedToState !== "ACTIVE"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_SELECTION",
      "Preflight requires sealed COMMIT_READY->ACTIVE selection metadata",
    );
  }
  if (
    !(CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS as readonly string[]).includes(
      d.selectedTransition,
    ) ||
    !(CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS as readonly string[]).includes(
      d.selectedTransition,
    ) ||
    (CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS as readonly string[]).includes(
      d.selectedTransition,
    )
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_EDGE_CLASS",
      "Selected edge must be candidate+eligible and not ineligible",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ACTIVATION",
      "Preflight forbids host/render activation",
    );
  }

  const descriptor = createControlledHostActivationTransitionPreflightDescriptor();
  return {
    descriptor,
    diagnostics: {
      preflightCompleted: true,
      preflightReady: true,
      preflightBlocked: true,
      preflightResult: "transition-preflight-ready-not-authorized",
      preflightExecuted: false,
      preflightChecks: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
      passedChecks: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
      failedChecks: [],
      warningChecks: [],
      preflightBlockers: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_BLOCKERS,
      preflightPreconditions: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_PRECONDITIONS,
      preflightValidationPoints:
        CONTROLLED_HOST_ACTIVATION_PREFLIGHT_VALIDATION_POINTS,
      selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedFromState: "COMMIT_READY",
      selectedToState: "ACTIVE",
      selectionResult: "transition-selected-not-executable",
      selectionStrategy:
        "activation-path-priority-then-lexicographic-transition-id",
      selectionPriority: 100,
      deterministicTieBreak: "lexicographic-transition-id",
      currentState: "COMMIT_READY",
      currentNode: "COMMIT_READY",
      sourceStateValid: true,
      targetStateValid: true,
      edgeValid: true,
      edgeIdentityValid: true,
      transitionIdentityValid: true,
      graphIdentityValid: true,
      machineIdentityValid: true,
      protocolIdentityValid: true,
      transactionIdentityValid: true,
      hostIdentityValid: true,
      runtimeIdentityValid: true,
      ownershipInvariantValid: true,
      writerInvariantValid: true,
      rendererInvariantValid: true,
      mountInvariantValid: true,
      lifecycleInvariantValid: true,
      requestInvariantValid: true,
      cacheInvariantValid: true,
      observerInvariantValid: true,
      domInvariantValid: true,
      hydrationInvariantValid: true,
      rollbackPrepared: true,
      rollbackAvailable: true,
      transitionAuthorized: false,
      authorizationGranted: false,
      transitionExecutionAllowed: false,
      graphTraversalAllowed: false,
      selectionExecutionAllowed: false,
      preflightExecutionAllowed: false,
      executorAllowed: false,
      schedulerAllowed: false,
      canStartActivation: false,
      graphResult: "transition-graph-complete-not-executable",
      machineResult: "state-machine-complete-not-executable",
      protocolResult: "protocol-complete-not-executable",
      transactionResult: "transaction-complete-not-committed",
      commitReadinessResult: "commit-ready-not-executable",
      pipelineResult: "pipeline-complete-not-executable",
      planResult: "plan-complete-not-executable",
      decisionResult: "ALLOW",
      currentPhase: "3B.3.16",
      nextEligibleStep: "3B.3.17",
      activeBlockers: [PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY],
      checkCount: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS.length,
      passedCount: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS.length,
      failedCount: 0,
      warningCount: 0,
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      rollbackPreparedFlag: true,
      currentStateUnchanged: true,
      currentNodeUnchanged: true,
      authorizationImpossible: true,
      executionImpossible: true,
    },
  };
}

export function createControlledHostActivationTransitionPreflightDescriptor(): ControlledHostActivationTransitionPreflightDescriptor {
  return validateControlledHostActivationTransitionPreflightDescriptor({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_SCHEMA_VERSION,
    phase: "3B.3.16",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    preflightId: CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID,
    preflightVersion: CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_VERSION,
    preflightState: "completed",
    preflightResult: "transition-preflight-ready-not-authorized",
    preflightCompleted: true,
    preflightReady: true,
    preflightBlocked: true,
    preflightExecuted: false,
    preflightChecks: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
    passedChecks: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
    failedChecks: [],
    warningChecks: [],
    preflightBlockers: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_BLOCKERS,
    preflightPreconditions: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_PRECONDITIONS,
    preflightValidationPoints:
      CONTROLLED_HOST_ACTIVATION_PREFLIGHT_VALIDATION_POINTS,
    preflightInvariants: FEED_SEALED_INVARIANT_IDS,
    selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
    selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
    selectedFromState: "COMMIT_READY",
    selectedToState: "ACTIVE",
    selectionResult: "transition-selected-not-executable",
    selectionCompleted: true,
    selectionExecuted: false,
    currentState: "COMMIT_READY",
    currentNode: "COMMIT_READY",
    sourceStateValid: true,
    targetStateValid: true,
    edgeValid: true,
    edgeIdentityValid: true,
    transitionIdentityValid: true,
    graphIdentityValid: true,
    machineIdentityValid: true,
    protocolIdentityValid: true,
    transactionIdentityValid: true,
    hostIdentityValid: true,
    runtimeIdentityValid: true,
    ownershipInvariantValid: true,
    writerInvariantValid: true,
    rendererInvariantValid: true,
    mountInvariantValid: true,
    lifecycleInvariantValid: true,
    requestInvariantValid: true,
    cacheInvariantValid: true,
    observerInvariantValid: true,
    domInvariantValid: true,
    hydrationInvariantValid: true,
    rollbackPrepared: true,
    rollbackAvailable: true,
    rollbackExecutionAllowed: false,
    transitionAuthorized: false,
    authorizationGranted: false,
    transitionExecutionAllowed: false,
    graphTraversalAllowed: false,
    selectionExecutionAllowed: false,
    preflightExecutionAllowed: false,
    transitionAuthorizationAllowed: false,
    commitAllowed: false,
    rollbackAllowed: false,
    executorAllowed: false,
    schedulerAllowed: false,
    canStartActivation: false,
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    activationState: "dormant",
    transitionExecuted: false,
    graphTraversalExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    commitExecuted: false,
    rollbackExecuted: false,
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
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
    selectionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
    graphId: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID,
    machineId: CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID,
    protocolId: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID,
    transactionId: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
    nextEligibleStep: "3B.3.17",
    activationBlocker: PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  });
}

export function validateControlledHostActivationTransitionPreflightDescriptor(
  candidate: unknown,
): ControlledHostActivationTransitionPreflightDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_INVALID",
      "Preflight descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_SCHEMA",
      "Unsupported preflight descriptor schemaVersion",
    );
  }
  if (c.phase !== "3B.3.16") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_PHASE",
      "phase must be 3B.3.16",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.preflightState !== "completed" ||
    c.preflightResult !== "transition-preflight-ready-not-authorized" ||
    c.preflightCompleted !== true ||
    c.preflightReady !== true ||
    c.preflightBlocked !== true ||
    c.preflightExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_RESULT",
      "preflight ready-not-authorized/executed mismatch",
    );
  }
  if (
    c.selectedTransition !== "COMMIT_READY->ACTIVE" ||
    c.selectedFromState !== "COMMIT_READY" ||
    c.selectedToState !== "ACTIVE" ||
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_SELECTED",
      "selected transition/current state must remain sealed",
    );
  }
  if (
    c.transitionAuthorized !== false ||
    c.authorizationGranted !== false ||
    c.transitionExecutionAllowed !== false ||
    c.preflightExecutionAllowed !== false ||
    c.transitionAuthorizationAllowed !== false ||
    c.canStartActivation !== false ||
    c.executorAllowed !== false ||
    c.schedulerAllowed !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.activationState !== "dormant"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_AUTH",
      "authorization/execution flags must remain false",
    );
  }
  if (
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.rollbackState !== "prepared-not-active"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_OWNER",
      "owner/writer/renderer/rollback must remain legacy/prepared",
    );
  }
  if (c.nextEligibleStep !== "3B.3.17") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_NEXT",
      "nextEligibleStep must be 3B.3.17",
    );
  }
  if (
    c.activationBlocker !==
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_BLOCKER",
      "activationBlocker must be PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY",
    );
  }
  if (!Array.isArray(c.preflightChecks) || (c.preflightChecks as unknown[]).length < 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_DESCRIPTOR_CHECKS",
      "preflightChecks must be a non-empty array",
    );
  }
  assertUniqueChecks(c.preflightChecks as string[]);
  return c as ControlledHostActivationTransitionPreflightDescriptor;
}
