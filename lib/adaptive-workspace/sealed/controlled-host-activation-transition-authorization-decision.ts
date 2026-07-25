/**
 * Phase 3B.3.17 — Controlled Host Activation Transition Authorization Decision
 * (metadata only). Evaluates authorization eligibility for the selected
 * COMMIT_READY->ACTIVE candidate after successful preflight. Never grants,
 * applies, or executes authorization. Never mutates state/runtime.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID,
  CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
  evaluateControlledHostActivationTransitionPreflight,
} from "./controlled-host-activation-transition-preflight";
import {
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
} from "./controlled-host-activation-transition-selection";
import { CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID } from "./controlled-host-activation-transition-graph";
import { CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID } from "./controlled-host-activation-state-machine";
import { CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID } from "./controlled-host-activation-commit-protocol";
import { CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID } from "./controlled-host-activation-transaction";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY =
  "PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID =
  "feed.discovery.controlled-host.activation-transition-authorization-decision.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY =
  "sealed-transition-authorization-policy" as const;

export const CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_STRATEGY =
  "preflight-ready-then-sealed-policy-eligibility" as const;

export type ControlledHostActivationTransitionAuthorizationDecisionState =
  "completed";

export type ControlledHostActivationTransitionAuthorizationDecisionResult =
  | "authorization-eligible-not-granted"
  | "authorization-decision-blocked";

export const CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS = [
  // A Preflight
  "preflight-completed",
  "preflight-ready",
  "preflight-result-valid",
  "preflight-executed-false",
  "preflight-failed-checks-empty",
  "preflight-required-checks-complete",
  "preflight-check-identities-stable",
  // B Transition
  "selected-transition-present",
  "selected-transition-id-valid",
  "selected-transition-is-commit-ready-to-active",
  "selected-from-state-is-commit-ready",
  "selected-to-state-is-active",
  "selected-from-state-matches-current-state",
  "selected-from-state-matches-current-node",
  "selected-edge-exists",
  "selected-edge-is-eligible",
  "selected-edge-is-not-ineligible",
  // C Identity
  "host-id-match",
  "runtime-id-match",
  "preflight-id-match",
  "selection-id-match",
  "graph-id-match",
  "machine-id-match",
  "protocol-id-match",
  "transaction-id-match",
  "selected-transition-identity-match",
  // D Ownership
  "owner-is-legacy",
  "writer-is-legacy",
  "renderer-is-legacy",
  "ownership-transferred-false",
  "writer-transferred-false",
  "renderer-transferred-false",
  // E Runtime expectations
  "single-geofeed-instance",
  "mount-count-one",
  "unmount-count-zero",
  "react-identity-stable",
  "request-identity-stable",
  "request-keys-stable",
  "pagination-stable",
  "cache-state-stable",
  "observer-state-stable",
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
  // F Rollback
  "rollback-prepared",
  "rollback-available",
  "rollback-state-preserved",
  "rollback-executed-false",
  "rollback-allowed-false",
  // G Execution-block
  "authorization-decision-executed-false",
  "authorization-granted-false",
  "authorization-applied-false",
  "transition-authorized-false",
  "authorization-execution-allowed-false",
  "transition-execution-allowed-false",
  "preflight-execution-allowed-false",
  "selection-execution-allowed-false",
  "graph-traversal-allowed-false",
  "executor-allowed-false",
  "scheduler-allowed-false",
  "can-start-activation-false",
  "activation-state-false",
  "host-activation-false",
  "render-activation-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS = [
  "preflight-ready-guard",
  "preflight-clean-guard",
  "transition-identity-guard",
  "source-state-guard",
  "target-state-guard",
  "graph-edge-guard",
  "eligibility-guard",
  "ownership-guard",
  "writer-guard",
  "renderer-guard",
  "lifecycle-guard",
  "rollback-preparation-guard",
  "sealed-runtime-guard",
  "no-execution-guard",
  "no-authorization-grant-guard",
  "no-activation-guard",
] as const;

export const CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS = [
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  "authorization-grant-not-authorized",
  "authorization-application-not-authorized",
  "transition-authorization-not-authorized",
  "transition-execution-not-authorized",
  "can-start-activation-false",
] as const;

export const CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_PRECONDITIONS = [
  "exactly-one-registered-host",
  "transition-preflight-ready-not-authorized",
  "transition-selected-not-executable",
  "selected-transition-commit-ready-to-active",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "authorization-grant-disabled-by-phase-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_VALIDATION_POINTS = [
  "pre-decision-preflight-ready",
  "pre-decision-selection-complete",
  "pre-decision-identity-stable",
  "pre-decision-ownership-legacy",
  "post-decision-eligible-not-granted",
  "post-decision-granted-false",
  "post-decision-authorized-false",
  "post-decision-executed-false",
  "post-decision-current-state-unchanged",
  "post-decision-current-node-unchanged",
] as const;

export type ControlledHostActivationTransitionAuthorizationDecisionDescriptor =
  {
    schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_SCHEMA_VERSION;
    phase: "3B.3.17";
    hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
    runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
    authorizationDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID;
    authorizationDecisionVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_VERSION;
    authorizationDecisionState: ControlledHostActivationTransitionAuthorizationDecisionState;
    authorizationDecisionResult: "authorization-eligible-not-granted";
    authorizationDecisionCompleted: true;
    authorizationDecisionExecuted: false;
    authorizationEligible: true;
    authorizationBlocked: true;
    wouldAuthorize: true;
    authorizationGranted: false;
    authorizationApplied: false;
    authorizationExecutionAllowed: false;
    transitionAuthorized: false;
    authorizationConditions: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS;
    satisfiedAuthorizationConditions: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS;
    unsatisfiedAuthorizationConditions: readonly [];
    authorizationGuards: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS;
    satisfiedAuthorizationGuards: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS;
    unsatisfiedAuthorizationGuards: readonly [];
    authorizationBlockers: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS;
    authorizationPreconditions: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_PRECONDITIONS;
    authorizationValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_VALIDATION_POINTS;
    authorizationInvariants: typeof FEED_SEALED_INVARIANT_IDS;
    authorizationReason: "all-preflight-and-policy-conditions-satisfied-but-grant-disabled-by-phase-contract";
    authorizationStrategy: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_STRATEGY;
    authorizationPolicy: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY;
    authorizationPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION;
    selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
    selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightExecuted: false;
    preflightChecks: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS;
    failedPreflightChecks: readonly [];
    warningPreflightChecks: readonly [];
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    sourceStateValid: true;
    targetStateValid: true;
    edgeValid: true;
    transitionIdentityValid: true;
    preflightIdentityValid: true;
    selectionIdentityValid: true;
    graphIdentityValid: true;
    machineIdentityValid: true;
    protocolIdentityValid: true;
    transactionIdentityValid: true;
    hostIdentityValid: true;
    runtimeIdentityValid: true;
    ownershipInvariantValid: true;
    writerInvariantValid: true;
    rendererInvariantValid: true;
    lifecycleInvariantValid: true;
    sealedRuntimeInvariantValid: true;
    rollbackPrepared: true;
    rollbackAvailable: true;
    transitionExecutionAllowed: false;
    graphTraversalAllowed: false;
    selectionExecutionAllowed: false;
    preflightExecutionAllowed: false;
    authorizationDecisionExecutionAllowed: false;
    authorizationGrantAllowed: false;
    authorizationApplicationAllowed: false;
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
    selectionExecuted: false;
    protocolExecuted: false;
    transactionCommitted: false;
    commitExecuted: false;
    rollbackExecuted: false;
    rollbackState: "prepared-not-active";
    hostActivation: false;
    renderActivation: false;
    selectionResult: "transition-selected-not-executable";
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
    preflightId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID;
    selectionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID;
    graphId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID;
    machineId: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID;
    protocolId: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID;
    transactionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID;
    nextEligibleStep: "3B.3.18";
    activationBlocker: typeof PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY;
  };

export type ControlledHostActivationTransitionAuthorizationDecisionDiagnostics =
  {
    authorizationDecisionCompleted: true;
    authorizationDecisionResult: "authorization-eligible-not-granted";
    authorizationDecisionExecuted: false;
    authorizationEligible: true;
    authorizationBlocked: true;
    wouldAuthorize: true;
    authorizationGranted: false;
    authorizationApplied: false;
    authorizationExecutionAllowed: false;
    transitionAuthorized: false;
    authorizationReason: "all-preflight-and-policy-conditions-satisfied-but-grant-disabled-by-phase-contract";
    authorizationStrategy: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_STRATEGY;
    authorizationPolicy: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY;
    authorizationPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION;
    authorizationConditions: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS;
    satisfiedAuthorizationConditions: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS;
    unsatisfiedAuthorizationConditions: readonly [];
    authorizationGuards: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS;
    satisfiedAuthorizationGuards: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS;
    unsatisfiedAuthorizationGuards: readonly [];
    authorizationBlockers: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS;
    authorizationPreconditions: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_PRECONDITIONS;
    authorizationValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_VALIDATION_POINTS;
    selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
    selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightExecuted: false;
    preflightChecks: typeof CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS;
    failedPreflightChecks: readonly [];
    warningPreflightChecks: readonly [];
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    sourceStateValid: true;
    targetStateValid: true;
    edgeValid: true;
    transitionIdentityValid: true;
    preflightIdentityValid: true;
    selectionIdentityValid: true;
    graphIdentityValid: true;
    machineIdentityValid: true;
    protocolIdentityValid: true;
    transactionIdentityValid: true;
    hostIdentityValid: true;
    runtimeIdentityValid: true;
    ownershipInvariantValid: true;
    writerInvariantValid: true;
    rendererInvariantValid: true;
    lifecycleInvariantValid: true;
    sealedRuntimeInvariantValid: true;
    rollbackPrepared: true;
    rollbackAvailable: true;
    transitionExecutionAllowed: false;
    graphTraversalAllowed: false;
    selectionExecutionAllowed: false;
    preflightExecutionAllowed: false;
    executorAllowed: false;
    schedulerAllowed: false;
    canStartActivation: false;
    selectionResult: "transition-selected-not-executable";
    graphResult: "transition-graph-complete-not-executable";
    machineResult: "state-machine-complete-not-executable";
    protocolResult: "protocol-complete-not-executable";
    transactionResult: "transaction-complete-not-committed";
    commitReadinessResult: "commit-ready-not-executable";
    pipelineResult: "pipeline-complete-not-executable";
    planResult: "plan-complete-not-executable";
    decisionResult: "ALLOW";
    currentPhase: "3B.3.17";
    nextEligibleStep: "3B.3.18";
    activeBlockers: readonly [
      typeof PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
    ];
    conditionCount: number;
    satisfiedConditionCount: number;
    unsatisfiedConditionCount: 0;
    guardCount: number;
    satisfiedGuardCount: number;
    unsatisfiedGuardCount: 0;
    registryHostCount: 1;
    runtimeIdStable: true;
    ownershipLegacy: true;
    writerLegacy: true;
    rendererLegacy: true;
    currentStateUnchanged: true;
    currentNodeUnchanged: true;
    grantImpossible: true;
    executionImpossible: true;
  };

export type ControlledHostActivationTransitionAuthorizationDecisionEvaluation =
  {
    descriptor: ControlledHostActivationTransitionAuthorizationDecisionDescriptor;
    diagnostics: ControlledHostActivationTransitionAuthorizationDecisionDiagnostics;
  };

function assertUnique(ids: readonly string[], code: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      throw new HardContractViolation(code, `Duplicate id: ${id}`);
    }
    seen.add(id);
  }
}

/**
 * Pure authorization-decision engine — deterministic, no side effects.
 * Eligibility may be true; grant/application/execution remain permanently false.
 */
export function evaluateControlledHostActivationTransitionAuthorizationDecision(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransitionAuthorizationDecisionEvaluation {
  void createFeedHostRollbackContract();
  const preflight = evaluateControlledHostActivationTransitionPreflight(registry);

  assertUnique(
    CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DUPLICATE_CONDITION",
  );
  assertUnique(
    CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DUPLICATE_GUARD",
  );

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_HOST_COUNT",
      "Authorization decision requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_IDS",
      "Authorization decision requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_OWNERSHIP",
      "Authorization decision requires legacy owner/writer/renderer",
    );
  }
  const p = preflight.descriptor;
  if (
    p.preflightCompleted !== true ||
    p.preflightReady !== true ||
    p.preflightResult !== "transition-preflight-ready-not-authorized" ||
    p.preflightExecuted !== false ||
    p.failedChecks.length !== 0 ||
    p.selectedTransition !== CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION ||
    p.currentState !== "COMMIT_READY" ||
    p.currentNode !== "COMMIT_READY" ||
    p.transitionAuthorized !== false ||
    p.authorizationGranted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_PREFLIGHT",
      "Authorization decision requires sealed ready-not-authorized preflight",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ACTIVATION",
      "Authorization decision forbids host/render activation",
    );
  }

  const descriptor =
    createControlledHostActivationTransitionAuthorizationDecisionDescriptor();
  return {
    descriptor,
    diagnostics: {
      authorizationDecisionCompleted: true,
      authorizationDecisionResult: "authorization-eligible-not-granted",
      authorizationDecisionExecuted: false,
      authorizationEligible: true,
      authorizationBlocked: true,
      wouldAuthorize: true,
      authorizationGranted: false,
      authorizationApplied: false,
      authorizationExecutionAllowed: false,
      transitionAuthorized: false,
      authorizationReason:
        "all-preflight-and-policy-conditions-satisfied-but-grant-disabled-by-phase-contract",
      authorizationStrategy: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_STRATEGY,
      authorizationPolicy: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
      authorizationPolicyVersion:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION,
      authorizationConditions:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
      satisfiedAuthorizationConditions:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
      unsatisfiedAuthorizationConditions: [],
      authorizationGuards: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
      satisfiedAuthorizationGuards:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
      unsatisfiedAuthorizationGuards: [],
      authorizationBlockers: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS,
      authorizationPreconditions:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_PRECONDITIONS,
      authorizationValidationPoints:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_VALIDATION_POINTS,
      selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedFromState: "COMMIT_READY",
      selectedToState: "ACTIVE",
      preflightCompleted: true,
      preflightReady: true,
      preflightBlocked: true,
      preflightResult: "transition-preflight-ready-not-authorized",
      preflightExecuted: false,
      preflightChecks: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
      failedPreflightChecks: [],
      warningPreflightChecks: [],
      currentState: "COMMIT_READY",
      currentNode: "COMMIT_READY",
      sourceStateValid: true,
      targetStateValid: true,
      edgeValid: true,
      transitionIdentityValid: true,
      preflightIdentityValid: true,
      selectionIdentityValid: true,
      graphIdentityValid: true,
      machineIdentityValid: true,
      protocolIdentityValid: true,
      transactionIdentityValid: true,
      hostIdentityValid: true,
      runtimeIdentityValid: true,
      ownershipInvariantValid: true,
      writerInvariantValid: true,
      rendererInvariantValid: true,
      lifecycleInvariantValid: true,
      sealedRuntimeInvariantValid: true,
      rollbackPrepared: true,
      rollbackAvailable: true,
      transitionExecutionAllowed: false,
      graphTraversalAllowed: false,
      selectionExecutionAllowed: false,
      preflightExecutionAllowed: false,
      executorAllowed: false,
      schedulerAllowed: false,
      canStartActivation: false,
      selectionResult: "transition-selected-not-executable",
      graphResult: "transition-graph-complete-not-executable",
      machineResult: "state-machine-complete-not-executable",
      protocolResult: "protocol-complete-not-executable",
      transactionResult: "transaction-complete-not-committed",
      commitReadinessResult: "commit-ready-not-executable",
      pipelineResult: "pipeline-complete-not-executable",
      planResult: "plan-complete-not-executable",
      decisionResult: "ALLOW",
      currentPhase: "3B.3.17",
      nextEligibleStep: "3B.3.18",
      activeBlockers: [
        PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
      ],
      conditionCount:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
      satisfiedGuardCount:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
      unsatisfiedGuardCount: 0,
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      currentStateUnchanged: true,
      currentNodeUnchanged: true,
      grantImpossible: true,
      executionImpossible: true,
    },
  };
}

export function createControlledHostActivationTransitionAuthorizationDecisionDescriptor(): ControlledHostActivationTransitionAuthorizationDecisionDescriptor {
  return validateControlledHostActivationTransitionAuthorizationDecisionDescriptor(
    {
      schemaVersion:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_SCHEMA_VERSION,
      phase: "3B.3.17",
      hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
      runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
      authorizationDecisionId:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID,
      authorizationDecisionVersion:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_VERSION,
      authorizationDecisionState: "completed",
      authorizationDecisionResult: "authorization-eligible-not-granted",
      authorizationDecisionCompleted: true,
      authorizationDecisionExecuted: false,
      authorizationEligible: true,
      authorizationBlocked: true,
      wouldAuthorize: true,
      authorizationGranted: false,
      authorizationApplied: false,
      authorizationExecutionAllowed: false,
      transitionAuthorized: false,
      authorizationConditions:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
      satisfiedAuthorizationConditions:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
      unsatisfiedAuthorizationConditions: [],
      authorizationGuards: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
      satisfiedAuthorizationGuards:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
      unsatisfiedAuthorizationGuards: [],
      authorizationBlockers: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS,
      authorizationPreconditions:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_PRECONDITIONS,
      authorizationValidationPoints:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_VALIDATION_POINTS,
      authorizationInvariants: FEED_SEALED_INVARIANT_IDS,
      authorizationReason:
        "all-preflight-and-policy-conditions-satisfied-but-grant-disabled-by-phase-contract",
      authorizationStrategy: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_STRATEGY,
      authorizationPolicy: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
      authorizationPolicyVersion:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION,
      selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedFromState: "COMMIT_READY",
      selectedToState: "ACTIVE",
      preflightResult: "transition-preflight-ready-not-authorized",
      preflightCompleted: true,
      preflightReady: true,
      preflightBlocked: true,
      preflightExecuted: false,
      preflightChecks: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
      failedPreflightChecks: [],
      warningPreflightChecks: [],
      currentState: "COMMIT_READY",
      currentNode: "COMMIT_READY",
      sourceStateValid: true,
      targetStateValid: true,
      edgeValid: true,
      transitionIdentityValid: true,
      preflightIdentityValid: true,
      selectionIdentityValid: true,
      graphIdentityValid: true,
      machineIdentityValid: true,
      protocolIdentityValid: true,
      transactionIdentityValid: true,
      hostIdentityValid: true,
      runtimeIdentityValid: true,
      ownershipInvariantValid: true,
      writerInvariantValid: true,
      rendererInvariantValid: true,
      lifecycleInvariantValid: true,
      sealedRuntimeInvariantValid: true,
      rollbackPrepared: true,
      rollbackAvailable: true,
      transitionExecutionAllowed: false,
      graphTraversalAllowed: false,
      selectionExecutionAllowed: false,
      preflightExecutionAllowed: false,
      authorizationDecisionExecutionAllowed: false,
      authorizationGrantAllowed: false,
      authorizationApplicationAllowed: false,
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
      selectionExecuted: false,
      protocolExecuted: false,
      transactionCommitted: false,
      commitExecuted: false,
      rollbackExecuted: false,
      rollbackState: "prepared-not-active",
      hostActivation: false,
      renderActivation: false,
      selectionResult: "transition-selected-not-executable",
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
      preflightId: CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID,
      selectionId: CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_ID,
      graphId: CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_ID,
      machineId: CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_ID,
      protocolId: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_ID,
      transactionId: CONTROLLED_HOST_ACTIVATION_TRANSACTION_ID,
      nextEligibleStep: "3B.3.18",
      activationBlocker:
        PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
    },
  );
}

export function validateControlledHostActivationTransitionAuthorizationDecisionDescriptor(
  candidate: unknown,
): ControlledHostActivationTransitionAuthorizationDecisionDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_INVALID",
      "Authorization decision descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_SCHEMA",
      "Unsupported authorization decision descriptor schemaVersion",
    );
  }
  if (c.phase !== "3B.3.17") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_PHASE",
      "phase must be 3B.3.17",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.authorizationDecisionResult !== "authorization-eligible-not-granted" ||
    c.authorizationDecisionCompleted !== true ||
    c.authorizationEligible !== true ||
    c.authorizationBlocked !== true ||
    c.wouldAuthorize !== true ||
    c.authorizationGranted !== false ||
    c.authorizationApplied !== false ||
    c.transitionAuthorized !== false ||
    c.authorizationDecisionExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_RESULT",
      "eligible-not-granted/grant flags mismatch",
    );
  }
  if (
    c.selectedTransition !== "COMMIT_READY->ACTIVE" ||
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.preflightReady !== true ||
    c.preflightResult !== "transition-preflight-ready-not-authorized"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_LINK",
      "selected transition/preflight/current state must remain sealed",
    );
  }
  if (
    c.authorizationGrantAllowed !== false ||
    c.authorizationApplicationAllowed !== false ||
    c.transitionAuthorizationAllowed !== false ||
    c.authorizationExecutionAllowed !== false ||
    c.transitionExecutionAllowed !== false ||
    c.canStartActivation !== false ||
    c.executorAllowed !== false ||
    c.schedulerAllowed !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.activationState !== "dormant"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_AUTH",
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
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_OWNER",
      "owner/writer/renderer/rollback must remain legacy/prepared",
    );
  }
  if (c.nextEligibleStep !== "3B.3.18") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_NEXT",
      "nextEligibleStep must be 3B.3.18",
    );
  }
  if (
    c.activationBlocker !==
    PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_BLOCKER",
      "activationBlocker must be PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY",
    );
  }
  if (
    !Array.isArray(c.authorizationConditions) ||
    (c.authorizationConditions as unknown[]).length < 1
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_CONDITIONS",
      "authorizationConditions must be a non-empty array",
    );
  }
  assertUnique(
    c.authorizationConditions as string[],
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_DESCRIPTOR_DUP_COND",
  );
  return c as ControlledHostActivationTransitionAuthorizationDecisionDescriptor;
}
