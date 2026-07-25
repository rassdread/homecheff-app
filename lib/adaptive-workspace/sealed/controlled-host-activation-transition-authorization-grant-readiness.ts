/**
 * Phase 3B.3.18 — Controlled Host Activation Transition Authorization Grant Readiness
 * (metadata only). Determines whether sealed metadata is consistent enough to
 * prepare a future authorization grant. Never issues, creates, persists, or
 * applies a grant. Never mutates state/runtime. No tokens/secrets/callbacks.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  createControlledHostRegistry,
  type ControlledHostRegistry,
} from "./controlled-host-registry";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
  evaluateControlledHostActivationTransitionAuthorizationDecision,
} from "./controlled-host-activation-transition-authorization-decision";
import {
  CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ID,
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

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY =
  "PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID =
  "feed.discovery.controlled-host.activation-transition-authorization-grant-readiness.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_POLICY =
  "sealed-authorization-grant-readiness-policy" as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION = 1 as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_STRATEGY =
  "authorization-eligible-then-sealed-grant-readiness" as const;

export type ControlledHostActivationTransitionAuthorizationGrantReadinessState =
  "completed";

export type ControlledHostActivationTransitionAuthorizationGrantReadinessResult =
  | "authorization-grant-ready-not-issued"
  | "authorization-grant-readiness-blocked";

export const CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS = [
  // A Authorization-decision
  "authorization-decision-completed",
  "authorization-decision-result-valid",
  "authorization-decision-executed-false",
  "authorization-eligible",
  "authorization-blocked",
  "would-authorize",
  "authorization-granted-false",
  "authorization-applied-false",
  "transition-authorized-false",
  "authorization-conditions-complete",
  "authorization-conditions-satisfied",
  "authorization-guards-complete",
  "authorization-guards-satisfied",
  "authorization-integrity-blockers-clear",
  // B Preflight
  "preflight-completed",
  "preflight-ready",
  "preflight-result-valid",
  "preflight-executed-false",
  "preflight-failed-checks-empty",
  "preflight-warning-policy-satisfied",
  // C Transition
  "selected-transition-present",
  "selected-transition-is-commit-ready-to-active",
  "selected-from-state-is-commit-ready",
  "selected-to-state-is-active",
  "selected-from-state-matches-current-state",
  "selected-from-state-matches-current-node",
  "selected-edge-exists",
  "selected-edge-is-eligible",
  "selected-edge-is-not-ineligible",
  // D Identity
  "host-id-match",
  "runtime-id-match",
  "authorization-decision-id-match",
  "authorization-policy-id-match",
  "preflight-id-match",
  "selection-id-match",
  "graph-id-match",
  "machine-id-match",
  "protocol-id-match",
  "transaction-id-match",
  "selected-transition-identity-match",
  "grant-policy-identity-valid",
  // E Ownership
  "owner-is-legacy",
  "writer-is-legacy",
  "renderer-is-legacy",
  "ownership-transferred-false",
  "writer-transferred-false",
  "renderer-transferred-false",
  // F Runtime
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
  // G Rollback
  "rollback-prepared",
  "rollback-available",
  "rollback-state-preserved",
  "rollback-executed-false",
  "rollback-allowed-false",
  // H Grant-block
  "grant-readiness-executed-false",
  "grant-issued-false",
  "grant-created-false",
  "grant-persisted-false",
  "grant-applied-false",
  "grant-authority-unavailable",
  "grant-authority-disabled",
  "grant-execution-allowed-false",
  "grant-creation-allowed-false",
  "grant-issuance-allowed-false",
  "grant-persistence-allowed-false",
  "grant-application-allowed-false",
  // I Execution-block
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

export const CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS = [
  "authorization-decision-complete-guard",
  "authorization-eligibility-guard",
  "authorization-not-granted-guard",
  "authorization-not-applied-guard",
  "transition-not-authorized-guard",
  "preflight-ready-guard",
  "selected-transition-identity-guard",
  "source-state-guard",
  "target-state-guard",
  "graph-edge-guard",
  "transition-eligibility-guard",
  "ownership-guard",
  "writer-guard",
  "renderer-guard",
  "lifecycle-guard",
  "rollback-preparation-guard",
  "sealed-runtime-guard",
  "no-grant-authority-guard",
  "no-grant-creation-guard",
  "no-grant-issuance-guard",
  "no-grant-persistence-guard",
  "no-grant-application-guard",
  "no-transition-execution-guard",
  "no-activation-guard",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_BLOCKERS = [
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  "authorization-grant-creation-disabled",
  "authorization-grant-issuance-disabled",
  "authorization-grant-persistence-disabled",
  "authorization-grant-application-disabled",
  "authorization-grant-authority-unavailable",
  "transition-authorization-disabled",
  "transition-execution-disabled",
  "activation-disabled",
  "can-start-activation-disabled",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_PRECONDITIONS = [
  "exactly-one-registered-host",
  "authorization-eligible-not-granted",
  "transition-preflight-ready-not-authorized",
  "transition-selected-not-executable",
  "selected-transition-commit-ready-to-active",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "grant-issuance-disabled-by-phase-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_VALIDATION_POINTS = [
  "pre-readiness-authorization-decision-complete",
  "pre-readiness-authorization-eligible",
  "pre-readiness-preflight-ready",
  "pre-readiness-identity-stable",
  "pre-readiness-ownership-legacy",
  "post-readiness-ready-not-issued",
  "post-readiness-grant-issued-false",
  "post-readiness-authority-unavailable",
  "post-readiness-authorized-false",
  "post-readiness-executed-false",
  "post-readiness-current-state-unchanged",
  "post-readiness-current-node-unchanged",
] as const;

export type ControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor =
  {
    schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_SCHEMA_VERSION;
    phase: "3B.3.18";
    hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
    runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
    grantReadinessId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID;
    grantReadinessVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_VERSION;
    grantReadinessState: ControlledHostActivationTransitionAuthorizationGrantReadinessState;
    grantReadinessResult: "authorization-grant-ready-not-issued";
    grantReadinessCompleted: true;
    grantReadinessExecuted: false;
    grantReady: true;
    grantBlocked: true;
    wouldIssueGrant: true;
    grantIssued: false;
    grantCreated: false;
    grantPersisted: false;
    grantApplied: false;
    grantExecutionAllowed: false;
    grantCreationAllowed: false;
    grantIssuanceAllowed: false;
    grantPersistenceAllowed: false;
    grantApplicationAllowed: false;
    grantAuthorityAvailable: false;
    grantAuthorityEnabled: false;
    grantConditions: typeof CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS;
    satisfiedGrantConditions: typeof CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS;
    unsatisfiedGrantConditions: readonly [];
    grantGuards: typeof CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS;
    satisfiedGrantGuards: typeof CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS;
    unsatisfiedGrantGuards: readonly [];
    grantBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRANT_BLOCKERS;
    grantPreconditions: typeof CONTROLLED_HOST_ACTIVATION_GRANT_PRECONDITIONS;
    grantValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_GRANT_VALIDATION_POINTS;
    grantInvariants: typeof FEED_SEALED_INVARIANT_IDS;
    grantReason: "authorization-eligible-and-all-grant-prerequisites-satisfied-but-issuance-disabled-by-phase-contract";
    grantStrategy: typeof CONTROLLED_HOST_ACTIVATION_GRANT_STRATEGY;
    grantPolicy: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY;
    grantPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION;
    authorizationDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID;
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
    authorizationPolicy: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY;
    authorizationPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION;
    authorizationConditions: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS;
    authorizationGuards: typeof CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS;
    selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
    selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightExecuted: false;
    failedPreflightChecks: readonly [];
    warningPreflightChecks: readonly [];
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    sourceStateValid: true;
    targetStateValid: true;
    edgeValid: true;
    transitionIdentityValid: true;
    authorizationDecisionIdentityValid: true;
    preflightIdentityValid: true;
    selectionIdentityValid: true;
    graphIdentityValid: true;
    machineIdentityValid: true;
    protocolIdentityValid: true;
    transactionIdentityValid: true;
    hostIdentityValid: true;
    runtimeIdentityValid: true;
    authorizationPolicyIdentityValid: true;
    grantPolicyIdentityValid: true;
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
    grantReadinessExecutionAllowed: false;
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
    grantTokenPresent: false;
    grantSecretPresent: false;
    grantSignaturePresent: false;
    grantCallbackPresent: false;
    nextEligibleStep: "3B.3.19";
    activationBlocker: typeof PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY;
  };

export type ControlledHostActivationTransitionAuthorizationGrantReadinessDiagnostics =
  {
    grantReadinessCompleted: true;
    grantReadinessResult: "authorization-grant-ready-not-issued";
    grantReadinessExecuted: false;
    grantReady: true;
    grantBlocked: true;
    wouldIssueGrant: true;
    grantIssued: false;
    grantCreated: false;
    grantPersisted: false;
    grantApplied: false;
    grantExecutionAllowed: false;
    grantCreationAllowed: false;
    grantIssuanceAllowed: false;
    grantPersistenceAllowed: false;
    grantApplicationAllowed: false;
    grantAuthorityAvailable: false;
    grantAuthorityEnabled: false;
    grantReason: "authorization-eligible-and-all-grant-prerequisites-satisfied-but-issuance-disabled-by-phase-contract";
    grantStrategy: typeof CONTROLLED_HOST_ACTIVATION_GRANT_STRATEGY;
    grantPolicy: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY;
    grantPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION;
    grantConditions: typeof CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS;
    satisfiedGrantConditions: typeof CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS;
    unsatisfiedGrantConditions: readonly [];
    grantGuards: typeof CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS;
    satisfiedGrantGuards: typeof CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS;
    unsatisfiedGrantGuards: readonly [];
    grantBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRANT_BLOCKERS;
    grantPreconditions: typeof CONTROLLED_HOST_ACTIVATION_GRANT_PRECONDITIONS;
    grantValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_GRANT_VALIDATION_POINTS;
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
    selectedTransition: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
    selectedTransitionId: typeof CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION;
    selectedFromState: "COMMIT_READY";
    selectedToState: "ACTIVE";
    preflightCompleted: true;
    preflightReady: true;
    preflightBlocked: true;
    preflightResult: "transition-preflight-ready-not-authorized";
    preflightExecuted: false;
    currentState: "COMMIT_READY";
    currentNode: "COMMIT_READY";
    transitionIdentityValid: true;
    authorizationDecisionIdentityValid: true;
    preflightIdentityValid: true;
    selectionIdentityValid: true;
    graphIdentityValid: true;
    machineIdentityValid: true;
    protocolIdentityValid: true;
    transactionIdentityValid: true;
    hostIdentityValid: true;
    runtimeIdentityValid: true;
    authorizationPolicyIdentityValid: true;
    grantPolicyIdentityValid: true;
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
    currentPhase: "3B.3.18";
    nextEligibleStep: "3B.3.19";
    activeBlockers: readonly [
      typeof PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
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
    grantTokenPresent: false;
    grantSecretPresent: false;
    grantSignaturePresent: false;
    grantCallbackPresent: false;
    issuanceImpossible: true;
    authorityImpossible: true;
    executionImpossible: true;
  };

export type ControlledHostActivationTransitionAuthorizationGrantReadinessEvaluation =
  {
    descriptor: ControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor;
    diagnostics: ControlledHostActivationTransitionAuthorizationGrantReadinessDiagnostics;
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
 * Pure grant-readiness engine — deterministic, no side effects.
 * Readiness may be true; issuance/creation/persistence/application remain permanently false.
 */
export function evaluateControlledHostActivationTransitionAuthorizationGrantReadiness(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransitionAuthorizationGrantReadinessEvaluation {
  void createFeedHostRollbackContract();
  const auth =
    evaluateControlledHostActivationTransitionAuthorizationDecision(registry);

  assertUnique(
    CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DUPLICATE_CONDITION",
  );
  assertUnique(
    CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DUPLICATE_GUARD",
  );

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_HOST_COUNT",
      "Grant readiness requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_IDS",
      "Grant readiness requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_OWNERSHIP",
      "Grant readiness requires legacy owner/writer/renderer",
    );
  }
  const a = auth.descriptor;
  if (
    a.authorizationDecisionCompleted !== true ||
    a.authorizationEligible !== true ||
    a.authorizationBlocked !== true ||
    a.wouldAuthorize !== true ||
    a.authorizationDecisionResult !== "authorization-eligible-not-granted" ||
    a.authorizationDecisionExecuted !== false ||
    a.authorizationGranted !== false ||
    a.authorizationApplied !== false ||
    a.transitionAuthorized !== false ||
    a.selectedTransition !== CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION ||
    a.currentState !== "COMMIT_READY" ||
    a.currentNode !== "COMMIT_READY" ||
    a.preflightReady !== true ||
    a.preflightResult !== "transition-preflight-ready-not-authorized"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_AUTH",
      "Grant readiness requires sealed eligible-not-granted authorization decision",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ACTIVATION",
      "Grant readiness forbids host/render activation",
    );
  }

  const descriptor =
    createControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor();
  return {
    descriptor,
    diagnostics: {
      grantReadinessCompleted: true,
      grantReadinessResult: "authorization-grant-ready-not-issued",
      grantReadinessExecuted: false,
      grantReady: true,
      grantBlocked: true,
      wouldIssueGrant: true,
      grantIssued: false,
      grantCreated: false,
      grantPersisted: false,
      grantApplied: false,
      grantExecutionAllowed: false,
      grantCreationAllowed: false,
      grantIssuanceAllowed: false,
      grantPersistenceAllowed: false,
      grantApplicationAllowed: false,
      grantAuthorityAvailable: false,
      grantAuthorityEnabled: false,
      grantReason:
        "authorization-eligible-and-all-grant-prerequisites-satisfied-but-issuance-disabled-by-phase-contract",
      grantStrategy: CONTROLLED_HOST_ACTIVATION_GRANT_STRATEGY,
      grantPolicy: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
      grantPolicyVersion: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION,
      grantConditions: CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
      satisfiedGrantConditions: CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
      unsatisfiedGrantConditions: [],
      grantGuards: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
      satisfiedGrantGuards: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
      unsatisfiedGrantGuards: [],
      grantBlockers: CONTROLLED_HOST_ACTIVATION_GRANT_BLOCKERS,
      grantPreconditions: CONTROLLED_HOST_ACTIVATION_GRANT_PRECONDITIONS,
      grantValidationPoints: CONTROLLED_HOST_ACTIVATION_GRANT_VALIDATION_POINTS,
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
      selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedFromState: "COMMIT_READY",
      selectedToState: "ACTIVE",
      preflightCompleted: true,
      preflightReady: true,
      preflightBlocked: true,
      preflightResult: "transition-preflight-ready-not-authorized",
      preflightExecuted: false,
      currentState: "COMMIT_READY",
      currentNode: "COMMIT_READY",
      transitionIdentityValid: true,
      authorizationDecisionIdentityValid: true,
      preflightIdentityValid: true,
      selectionIdentityValid: true,
      graphIdentityValid: true,
      machineIdentityValid: true,
      protocolIdentityValid: true,
      transactionIdentityValid: true,
      hostIdentityValid: true,
      runtimeIdentityValid: true,
      authorizationPolicyIdentityValid: true,
      grantPolicyIdentityValid: true,
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
      currentPhase: "3B.3.18",
      nextEligibleStep: "3B.3.19",
      activeBlockers: [
        PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
      ],
      conditionCount: CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS.length,
      satisfiedConditionCount: CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS.length,
      satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS.length,
      unsatisfiedGuardCount: 0,
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      currentStateUnchanged: true,
      currentNodeUnchanged: true,
      grantTokenPresent: false,
      grantSecretPresent: false,
      grantSignaturePresent: false,
      grantCallbackPresent: false,
      issuanceImpossible: true,
      authorityImpossible: true,
      executionImpossible: true,
    },
  };
}

export function createControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor(): ControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor {
  return validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor(
    {
      schemaVersion:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_SCHEMA_VERSION,
      phase: "3B.3.18",
      hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
      runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
      grantReadinessId:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID,
      grantReadinessVersion:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_VERSION,
      grantReadinessState: "completed",
      grantReadinessResult: "authorization-grant-ready-not-issued",
      grantReadinessCompleted: true,
      grantReadinessExecuted: false,
      grantReady: true,
      grantBlocked: true,
      wouldIssueGrant: true,
      grantIssued: false,
      grantCreated: false,
      grantPersisted: false,
      grantApplied: false,
      grantExecutionAllowed: false,
      grantCreationAllowed: false,
      grantIssuanceAllowed: false,
      grantPersistenceAllowed: false,
      grantApplicationAllowed: false,
      grantAuthorityAvailable: false,
      grantAuthorityEnabled: false,
      grantConditions: CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
      satisfiedGrantConditions: CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
      unsatisfiedGrantConditions: [],
      grantGuards: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
      satisfiedGrantGuards: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
      unsatisfiedGrantGuards: [],
      grantBlockers: CONTROLLED_HOST_ACTIVATION_GRANT_BLOCKERS,
      grantPreconditions: CONTROLLED_HOST_ACTIVATION_GRANT_PRECONDITIONS,
      grantValidationPoints: CONTROLLED_HOST_ACTIVATION_GRANT_VALIDATION_POINTS,
      grantInvariants: FEED_SEALED_INVARIANT_IDS,
      grantReason:
        "authorization-eligible-and-all-grant-prerequisites-satisfied-but-issuance-disabled-by-phase-contract",
      grantStrategy: CONTROLLED_HOST_ACTIVATION_GRANT_STRATEGY,
      grantPolicy: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
      grantPolicyVersion: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION,
      authorizationDecisionId:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ID,
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
      authorizationPolicy: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
      authorizationPolicyVersion:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY_VERSION,
      authorizationConditions: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
      authorizationGuards: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
      selectedTransition: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedTransitionId: CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
      selectedFromState: "COMMIT_READY",
      selectedToState: "ACTIVE",
      preflightResult: "transition-preflight-ready-not-authorized",
      preflightCompleted: true,
      preflightReady: true,
      preflightBlocked: true,
      preflightExecuted: false,
      failedPreflightChecks: [],
      warningPreflightChecks: [],
      currentState: "COMMIT_READY",
      currentNode: "COMMIT_READY",
      sourceStateValid: true,
      targetStateValid: true,
      edgeValid: true,
      transitionIdentityValid: true,
      authorizationDecisionIdentityValid: true,
      preflightIdentityValid: true,
      selectionIdentityValid: true,
      graphIdentityValid: true,
      machineIdentityValid: true,
      protocolIdentityValid: true,
      transactionIdentityValid: true,
      hostIdentityValid: true,
      runtimeIdentityValid: true,
      authorizationPolicyIdentityValid: true,
      grantPolicyIdentityValid: true,
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
      grantReadinessExecutionAllowed: false,
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
      grantTokenPresent: false,
      grantSecretPresent: false,
      grantSignaturePresent: false,
      grantCallbackPresent: false,
      nextEligibleStep: "3B.3.19",
      activationBlocker:
        PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    },
  );
}

export function validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor(
  candidate: unknown,
): ControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_INVALID",
      "Grant readiness descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_SCHEMA",
      "Unsupported grant readiness descriptor schemaVersion",
    );
  }
  if (c.phase !== "3B.3.18") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_PHASE",
      "phase must be 3B.3.18",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.grantReadinessResult !== "authorization-grant-ready-not-issued" ||
    c.grantReadinessCompleted !== true ||
    c.grantReady !== true ||
    c.grantBlocked !== true ||
    c.wouldIssueGrant !== true ||
    c.grantIssued !== false ||
    c.grantCreated !== false ||
    c.grantPersisted !== false ||
    c.grantApplied !== false ||
    c.grantAuthorityAvailable !== false ||
    c.grantAuthorityEnabled !== false ||
    c.grantReadinessExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_RESULT",
      "ready-not-issued/grant flags mismatch",
    );
  }
  if (
    c.authorizationDecisionResult !== "authorization-eligible-not-granted" ||
    c.authorizationEligible !== true ||
    c.authorizationGranted !== false ||
    c.transitionAuthorized !== false ||
    c.selectedTransition !== "COMMIT_READY->ACTIVE" ||
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.preflightReady !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_LINK",
      "authorization decision/selected transition/preflight/current state must remain sealed",
    );
  }
  if (
    c.grantCreationAllowed !== false ||
    c.grantIssuanceAllowed !== false ||
    c.grantPersistenceAllowed !== false ||
    c.grantApplicationAllowed !== false ||
    c.grantExecutionAllowed !== false ||
    c.authorizationGrantAllowed !== false ||
    c.transitionAuthorizationAllowed !== false ||
    c.transitionExecutionAllowed !== false ||
    c.canStartActivation !== false ||
    c.executorAllowed !== false ||
    c.schedulerAllowed !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.activationState !== "dormant"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_AUTH",
      "grant/authorization/execution flags must remain false",
    );
  }
  if (
    c.grantTokenPresent !== false ||
    c.grantSecretPresent !== false ||
    c.grantSignaturePresent !== false ||
    c.grantCallbackPresent !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_TOKEN",
      "grant token/secret/signature/callback must be absent",
    );
  }
  if (
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.rollbackState !== "prepared-not-active"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_OWNER",
      "owner/writer/renderer/rollback must remain legacy/prepared",
    );
  }
  if (c.nextEligibleStep !== "3B.3.19") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_NEXT",
      "nextEligibleStep must be 3B.3.19",
    );
  }
  if (
    c.activationBlocker !==
    PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_BLOCKER",
      "activationBlocker must be PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY",
    );
  }
  if (
    !Array.isArray(c.grantConditions) ||
    (c.grantConditions as unknown[]).length < 1
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_CONDITIONS",
      "grantConditions must be a non-empty array",
    );
  }
  assertUnique(
    c.grantConditions as string[],
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_DESCRIPTOR_DUP_COND",
  );
  return c as ControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor;
}
