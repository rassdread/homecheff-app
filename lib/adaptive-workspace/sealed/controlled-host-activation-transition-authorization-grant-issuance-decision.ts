/**
 * Phase 3B.3.19 — Controlled Host Activation Transition Authorization Grant
 * Issuance Decision (metadata only). Determines whether the sealed grant
 * readiness is consistent enough to be issuance-eligible. Never issues,
 * creates, materializes, persists, applies, activates, consumes, or revokes
 * a grant. Never creates/enables/delegates/transfers authority. Never
 * mutates state/runtime. No tokens/secrets/signatures/nonces/credentials/
 * certificates/permits/callbacks/executable handles/runtime capabilities.
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
} from "./controlled-host-activation-transition-authorization-decision";
import {
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID,
  CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
  CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION,
  CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
  evaluateControlledHostActivationTransitionAuthorizationGrantReadiness,
} from "./controlled-host-activation-transition-authorization-grant-readiness";
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

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_SCHEMA_VERSION =
  1 as const;

export const PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY =
  "PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID =
  "feed.discovery.controlled-host.activation-transition-authorization-grant-issuance-decision.v1" as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY =
  "sealed-authorization-grant-issuance-decision-policy" as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY_VERSION = 1 as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_STRATEGY =
  "grant-ready-then-sealed-issuance-eligibility" as const;

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionState =
  "completed";

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionResult =
  | "authorization-grant-issuance-eligible-not-issued"
  | "authorization-grant-issuance-decision-blocked";

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS = [
  // A Phase continuity
  "phase-3b319-active",
  "previous-phase-3b318-complete",
  "next-eligible-step-3b320",
  "phase-chain-continuous",
  "issuance-decision-metadata-only",
  // B Grant-readiness
  "grant-readiness-completed",
  "grant-readiness-result-valid",
  "grant-readiness-executed-false",
  "grant-ready",
  "grant-blocked",
  "would-issue-grant",
  "grant-readiness-conditions-complete",
  "grant-readiness-conditions-satisfied",
  "grant-readiness-guards-complete",
  "grant-readiness-guards-satisfied",
  "grant-readiness-integrity-blockers-clear",
  // C Authorization-decision
  "authorization-decision-completed",
  "authorization-decision-result-valid",
  "authorization-decision-executed-false",
  "authorization-eligible",
  "authorization-blocked",
  "would-authorize",
  "authorization-granted-false",
  "authorization-applied-false",
  "transition-authorized-false",
  // D Preflight
  "preflight-completed",
  "preflight-ready",
  "preflight-result-valid",
  "preflight-executed-false",
  "preflight-failed-checks-empty",
  "preflight-warning-policy-satisfied",
  // E Transition
  "selected-transition-present",
  "selected-transition-is-commit-ready-to-active",
  "selected-from-state-is-commit-ready",
  "selected-to-state-is-active",
  "selected-from-state-matches-current-state",
  "selected-from-state-matches-current-node",
  "selected-edge-exists",
  "selected-edge-is-eligible",
  "selected-edge-is-not-ineligible",
  // F Identity
  "host-id-match",
  "runtime-id-match",
  "authorization-decision-id-match",
  "authorization-policy-id-match",
  "grant-readiness-id-match",
  "grant-policy-id-match",
  "preflight-id-match",
  "selection-id-match",
  "graph-id-match",
  "machine-id-match",
  "protocol-id-match",
  "transaction-id-match",
  "selected-transition-identity-match",
  "issuance-decision-identity-valid",
  "issuance-policy-identity-valid",
  // G Ownership
  "owner-is-legacy",
  "writer-is-legacy",
  "renderer-is-legacy",
  "ownership-transferred-false",
  "writer-transferred-false",
  "renderer-transferred-false",
  // H Runtime
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
  // I Grant absence
  "grant-issued-false",
  "grant-created-false",
  "grant-materialized-false",
  "grant-persisted-false",
  "grant-applied-false",
  "grant-activated-false",
  "grant-consumed-false",
  "grant-revoked-false",
  // J Authority absence
  "grant-authority-available-false",
  "grant-authority-enabled-false",
  "grant-authority-delegated-false",
  "grant-authority-transferred-false",
  // K Execution absence
  "authorization-execution-allowed-false",
  "transition-execution-allowed-false",
  "preflight-execution-allowed-false",
  "selection-execution-allowed-false",
  "graph-traversal-allowed-false",
  "grant-readiness-execution-allowed-false",
  "issuance-decision-execution-allowed-false",
  "executor-allowed-false",
  "scheduler-allowed-false",
  "can-start-activation-false",
  "activation-state-false",
  "host-activation-false",
  "render-activation-false",
  "commit-allowed-false",
  "rollback-allowed-false",
  // L Token/secret absence
  "token-absent",
  "secret-absent",
  "signature-absent",
  "nonce-absent",
  "credential-absent",
  "certificate-absent",
  "permit-absent",
  "callback-absent",
  "executable-handle-absent",
  "runtime-capability-absent",
  // M Transfer absence
  "ownership-transfer-allowed-false",
  "writer-transfer-allowed-false",
  "renderer-transfer-allowed-false",
  // N Runtime mutation absence
  "runtime-mutation-allowed-false",
  "dom-mutation-allowed-false",
  "react-remount-allowed-false",
  "second-geofeed-allowed-false",
  // O Rollback
  "rollback-prepared",
  "rollback-available",
  "rollback-state-preserved",
  "rollback-executed-false",
  // P Fail-closed
  "issuance-decision-completed",
  "issuance-decision-result-valid",
  "issuance-decision-executed-false",
  "issuance-eligible",
  "issuance-blocked",
  "would-issue-grant-decision",
  "issuance-conditions-complete",
  "issuance-conditions-satisfied",
  "issuance-guards-complete",
  "issuance-guards-satisfied",
  "issuance-integrity-blockers-clear",
  "deterministic-pure-issuance-decision-engine",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS = [
  "grant-readiness-complete-guard",
  "grant-readiness-eligibility-guard",
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
  "no-grant-materialization-guard",
  "no-grant-issuance-guard",
  "no-grant-persistence-guard",
  "no-grant-application-guard",
  "no-grant-activation-guard",
  "no-grant-consumption-guard",
  "no-grant-revocation-guard",
  "no-authority-creation-guard",
  "no-authority-enablement-guard",
  "no-authority-delegation-guard",
  "no-authority-transfer-guard",
  "no-token-guard",
  "no-secret-guard",
  "no-signature-guard",
  "no-nonce-guard",
  "no-credential-guard",
  "no-certificate-guard",
  "no-permit-guard",
  "no-callback-guard",
  "no-executable-handle-guard",
  "no-runtime-capability-guard",
  "no-transition-execution-guard",
  "no-activation-guard",
  "no-commit-guard",
  "no-rollback-execution-guard",
  "no-scheduler-guard",
  "no-executor-guard",
  "no-ownership-transfer-guard",
  "no-writer-transfer-guard",
  "no-renderer-transfer-guard",
  "no-runtime-mutation-guard",
  "no-dom-mutation-guard",
  "no-react-remount-guard",
  "no-second-geofeed-guard",
] as const;

export const CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS = [
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  "PHASE_3B3_19_ISSUANCE_FORBIDDEN",
  "PHASE_3B3_19_GRANT_CREATION_FORBIDDEN",
  "PHASE_3B3_19_GRANT_MATERIALIZATION_FORBIDDEN",
  "PHASE_3B3_19_GRANT_PERSISTENCE_FORBIDDEN",
  "PHASE_3B3_19_GRANT_APPLICATION_FORBIDDEN",
  "PHASE_3B3_19_GRANT_ACTIVATION_FORBIDDEN",
  "PHASE_3B3_19_GRANT_CONSUMPTION_FORBIDDEN",
  "PHASE_3B3_19_GRANT_REVOCATION_EXECUTION_FORBIDDEN",
  "PHASE_3B3_19_AUTHORITY_CREATION_FORBIDDEN",
  "PHASE_3B3_19_AUTHORITY_ENABLEMENT_FORBIDDEN",
  "PHASE_3B3_19_AUTHORITY_DELEGATION_FORBIDDEN",
  "PHASE_3B3_19_AUTHORITY_TRANSFER_FORBIDDEN",
  "PHASE_3B3_19_TOKEN_FORBIDDEN",
  "PHASE_3B3_19_SECRET_FORBIDDEN",
  "PHASE_3B3_19_SIGNATURE_FORBIDDEN",
  "PHASE_3B3_19_NONCE_FORBIDDEN",
  "PHASE_3B3_19_CREDENTIAL_FORBIDDEN",
  "PHASE_3B3_19_CERTIFICATE_FORBIDDEN",
  "PHASE_3B3_19_PERMIT_FORBIDDEN",
  "PHASE_3B3_19_CALLBACK_FORBIDDEN",
  "PHASE_3B3_19_EXECUTABLE_HANDLE_FORBIDDEN",
  "PHASE_3B3_19_RUNTIME_CAPABILITY_FORBIDDEN",
  "PHASE_3B3_19_TRANSITION_AUTHORIZATION_FORBIDDEN",
  "PHASE_3B3_19_TRANSITION_EXECUTION_FORBIDDEN",
  "PHASE_3B3_19_ACTIVATION_FORBIDDEN",
  "PHASE_3B3_19_COMMIT_FORBIDDEN",
  "PHASE_3B3_19_ROLLBACK_EXECUTION_FORBIDDEN",
  "PHASE_3B3_19_SCHEDULER_FORBIDDEN",
  "PHASE_3B3_19_EXECUTOR_FORBIDDEN",
  "PHASE_3B3_19_OWNERSHIP_TRANSFER_FORBIDDEN",
  "PHASE_3B3_19_WRITER_TRANSFER_FORBIDDEN",
  "PHASE_3B3_19_RENDERER_TRANSFER_FORBIDDEN",
  "PHASE_3B3_19_RUNTIME_MUTATION_FORBIDDEN",
  "PHASE_3B3_19_DOM_MUTATION_FORBIDDEN",
  "PHASE_3B3_19_REACT_REMOUNT_FORBIDDEN",
  "PHASE_3B3_19_SECOND_GEOFEED_FORBIDDEN",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_PRECONDITIONS = [
  "exactly-one-registered-host",
  "grant-readiness-ready-not-issued",
  "authorization-eligible-not-granted",
  "transition-preflight-ready-not-authorized",
  "transition-selected-not-executable",
  "selected-transition-commit-ready-to-active",
  "stable-runtime-id",
  "legacy-owner-writer-renderer",
  "rollback-prepared-not-active",
  "grant-authority-unavailable",
  "issuance-disabled-by-phase-contract",
] as const;

export const CONTROLLED_HOST_ACTIVATION_ISSUANCE_VALIDATION_POINTS = [
  "pre-issuance-grant-readiness-complete",
  "pre-issuance-grant-ready",
  "pre-issuance-authorization-decision-complete",
  "pre-issuance-authorization-eligible",
  "pre-issuance-preflight-ready",
  "pre-issuance-identity-stable",
  "pre-issuance-ownership-legacy",
  "post-issuance-eligible-not-issued",
  "post-issuance-grant-issued-false",
  "post-issuance-authority-unavailable",
  "post-issuance-authorized-false",
  "post-issuance-executed-false",
  "post-issuance-current-state-unchanged",
  "post-issuance-current-node-unchanged",
] as const;

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor =
  {
    schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_SCHEMA_VERSION;
    phase: "3B.3.19";
    previousPhase: "3B.3.18";
    hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
    runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
    issuanceDecisionId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID;
    issuanceDecisionVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_VERSION;
    issuanceDecisionState: ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionState;
    issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued";
    issuanceDecisionCompleted: true;
    issuanceDecisionExecuted: false;
    issuanceEligible: true;
    issuanceBlocked: true;
    wouldIssueGrant: true;
    grantIssued: false;
    grantCreated: false;
    grantMaterialized: false;
    grantPersisted: false;
    grantApplied: false;
    grantActivated: false;
    grantConsumed: false;
    grantRevoked: false;
    grantExecutionAllowed: false;
    grantCreationAllowed: false;
    grantIssuanceAllowed: false;
    grantMaterializationAllowed: false;
    grantPersistenceAllowed: false;
    grantApplicationAllowed: false;
    grantActivationAllowed: false;
    grantConsumptionAllowed: false;
    grantRevocationAllowed: false;
    grantAuthorityAvailable: false;
    grantAuthorityEnabled: false;
    grantAuthorityDelegated: false;
    grantAuthorityTransferred: false;
    issuanceConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS;
    satisfiedIssuanceConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS;
    unsatisfiedIssuanceConditions: readonly [];
    issuanceGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS;
    satisfiedIssuanceGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS;
    unsatisfiedIssuanceGuards: readonly [];
    issuanceBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS;
    issuancePreconditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PRECONDITIONS;
    issuanceValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_VALIDATION_POINTS;
    issuanceInvariants: typeof FEED_SEALED_INVARIANT_IDS;
    issuanceReason: "grant-ready-and-all-issuance-prerequisites-satisfied-but-issuance-disabled-by-phase-contract";
    issuanceStrategy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_STRATEGY;
    issuancePolicy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY;
    issuancePolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY_VERSION;
    grantReadinessId: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID;
    grantReadinessResult: "authorization-grant-ready-not-issued";
    grantReadinessCompleted: true;
    grantReadinessExecuted: false;
    grantReady: true;
    grantBlocked: true;
    grantPolicy: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY;
    grantPolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION;
    grantConditions: typeof CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS;
    grantGuards: typeof CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS;
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
    grantReadinessIdentityValid: true;
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
    issuancePolicyIdentityValid: true;
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
    issuanceDecisionExecutionAllowed: false;
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
    ownershipTransferAllowed: false;
    writerTransferAllowed: false;
    rendererTransferAllowed: false;
    runtimeMutationAllowed: false;
    domMutationAllowed: false;
    reactRemountAllowed: false;
    secondGeofeedAllowed: false;
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
    tokenPresent: false;
    secretPresent: false;
    signaturePresent: false;
    noncePresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    callbackPresent: false;
    executableHandlePresent: false;
    runtimeCapabilityPresent: false;
    nextEligibleStep: "3B.3.20";
    activationBlocker: typeof PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY;
  };

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDiagnostics =
  {
    issuanceDecisionCompleted: true;
    issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued";
    issuanceDecisionExecuted: false;
    issuanceEligible: true;
    issuanceBlocked: true;
    wouldIssueGrant: true;
    grantIssued: false;
    grantCreated: false;
    grantMaterialized: false;
    grantPersisted: false;
    grantApplied: false;
    grantActivated: false;
    grantConsumed: false;
    grantRevoked: false;
    grantExecutionAllowed: false;
    grantCreationAllowed: false;
    grantIssuanceAllowed: false;
    grantMaterializationAllowed: false;
    grantPersistenceAllowed: false;
    grantApplicationAllowed: false;
    grantActivationAllowed: false;
    grantConsumptionAllowed: false;
    grantRevocationAllowed: false;
    grantAuthorityAvailable: false;
    grantAuthorityEnabled: false;
    grantAuthorityDelegated: false;
    grantAuthorityTransferred: false;
    issuanceReason: "grant-ready-and-all-issuance-prerequisites-satisfied-but-issuance-disabled-by-phase-contract";
    issuanceStrategy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_STRATEGY;
    issuancePolicy: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY;
    issuancePolicyVersion: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY_VERSION;
    issuanceConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS;
    satisfiedIssuanceConditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS;
    unsatisfiedIssuanceConditions: readonly [];
    issuanceGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS;
    satisfiedIssuanceGuards: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS;
    unsatisfiedIssuanceGuards: readonly [];
    issuanceBlockers: typeof CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS;
    issuancePreconditions: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_PRECONDITIONS;
    issuanceValidationPoints: typeof CONTROLLED_HOST_ACTIVATION_ISSUANCE_VALIDATION_POINTS;
    grantReadinessCompleted: true;
    grantReadinessResult: "authorization-grant-ready-not-issued";
    grantReadinessExecuted: false;
    grantReady: true;
    grantBlocked: true;
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
    grantReadinessIdentityValid: true;
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
    issuancePolicyIdentityValid: true;
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
    currentPhase: "3B.3.19";
    previousPhase: "3B.3.18";
    nextEligibleStep: "3B.3.20";
    activeBlockers: readonly [
      typeof PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
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
    tokenPresent: false;
    secretPresent: false;
    signaturePresent: false;
    noncePresent: false;
    credentialPresent: false;
    certificatePresent: false;
    permitPresent: false;
    callbackPresent: false;
    executableHandlePresent: false;
    runtimeCapabilityPresent: false;
    issuanceImpossible: true;
    authorityImpossible: true;
    executionImpossible: true;
  };

export type ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionEvaluation =
  {
    descriptor: ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor;
    diagnostics: ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDiagnostics;
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
 * Pure issuance-decision engine — deterministic, no side effects.
 * Issuance eligibility may be true; issuance/creation/materialization/
 * persistence/application/activation/consumption/revocation and authority
 * creation/enablement/delegation/transfer remain permanently false.
 */
export function evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision(
  registry: ControlledHostRegistry = createControlledHostRegistry(),
): ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionEvaluation {
  void createFeedHostRollbackContract();
  const readiness =
    evaluateControlledHostActivationTransitionAuthorizationGrantReadiness(
      registry,
    );

  assertUnique(
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DUPLICATE_CONDITION",
  );
  assertUnique(
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DUPLICATE_GUARD",
  );
  assertUnique(
    CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS,
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DUPLICATE_BLOCKER",
  );

  if (registry.hostCount !== 1 || registry.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_HOST_COUNT",
      "Grant issuance decision requires exactly one registered host",
    );
  }
  const host = registry.hosts[0];
  if (
    host.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    host.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDS",
      "Grant issuance decision requires stable hostId/runtimeId",
    );
  }
  if (
    host.owner !== "legacy" ||
    host.writer !== "legacy" ||
    host.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_OWNERSHIP",
      "Grant issuance decision requires legacy owner/writer/renderer",
    );
  }
  const r = readiness.descriptor;
  if (
    r.grantReadinessCompleted !== true ||
    r.grantReady !== true ||
    r.grantBlocked !== true ||
    r.wouldIssueGrant !== true ||
    r.grantReadinessResult !== "authorization-grant-ready-not-issued" ||
    r.grantReadinessExecuted !== false ||
    r.grantIssued !== false ||
    r.grantCreated !== false ||
    r.grantPersisted !== false ||
    r.grantApplied !== false ||
    r.grantAuthorityAvailable !== false ||
    r.grantAuthorityEnabled !== false ||
    r.authorizationDecisionCompleted !== true ||
    r.authorizationEligible !== true ||
    r.authorizationBlocked !== true ||
    r.wouldAuthorize !== true ||
    r.authorizationGranted !== false ||
    r.transitionAuthorized !== false ||
    r.selectedTransition !== CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION ||
    r.currentState !== "COMMIT_READY" ||
    r.currentNode !== "COMMIT_READY" ||
    r.preflightReady !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_READINESS",
      "Grant issuance decision requires sealed ready-not-issued grant readiness",
    );
  }
  if (host.hostActivation !== false || host.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ACTIVATION",
      "Grant issuance decision forbids host/render activation",
    );
  }

  const descriptor =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor();
  return {
    descriptor,
    diagnostics: {
      issuanceDecisionCompleted: true,
      issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued",
      issuanceDecisionExecuted: false,
      issuanceEligible: true,
      issuanceBlocked: true,
      wouldIssueGrant: true,
      grantIssued: false,
      grantCreated: false,
      grantMaterialized: false,
      grantPersisted: false,
      grantApplied: false,
      grantActivated: false,
      grantConsumed: false,
      grantRevoked: false,
      grantExecutionAllowed: false,
      grantCreationAllowed: false,
      grantIssuanceAllowed: false,
      grantMaterializationAllowed: false,
      grantPersistenceAllowed: false,
      grantApplicationAllowed: false,
      grantActivationAllowed: false,
      grantConsumptionAllowed: false,
      grantRevocationAllowed: false,
      grantAuthorityAvailable: false,
      grantAuthorityEnabled: false,
      grantAuthorityDelegated: false,
      grantAuthorityTransferred: false,
      issuanceReason:
        "grant-ready-and-all-issuance-prerequisites-satisfied-but-issuance-disabled-by-phase-contract",
      issuanceStrategy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_STRATEGY,
      issuancePolicy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
      issuancePolicyVersion: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY_VERSION,
      issuanceConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
      satisfiedIssuanceConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
      unsatisfiedIssuanceConditions: [],
      issuanceGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
      satisfiedIssuanceGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
      unsatisfiedIssuanceGuards: [],
      issuanceBlockers: CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS,
      issuancePreconditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PRECONDITIONS,
      issuanceValidationPoints:
        CONTROLLED_HOST_ACTIVATION_ISSUANCE_VALIDATION_POINTS,
      grantReadinessCompleted: true,
      grantReadinessResult: "authorization-grant-ready-not-issued",
      grantReadinessExecuted: false,
      grantReady: true,
      grantBlocked: true,
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
      grantReadinessIdentityValid: true,
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
      issuancePolicyIdentityValid: true,
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
      currentPhase: "3B.3.19",
      previousPhase: "3B.3.18",
      nextEligibleStep: "3B.3.20",
      activeBlockers: [
        PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
      ],
      conditionCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS.length,
      unsatisfiedConditionCount: 0,
      guardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS.length,
      satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS.length,
      unsatisfiedGuardCount: 0,
      registryHostCount: 1,
      runtimeIdStable: true,
      ownershipLegacy: true,
      writerLegacy: true,
      rendererLegacy: true,
      currentStateUnchanged: true,
      currentNodeUnchanged: true,
      tokenPresent: false,
      secretPresent: false,
      signaturePresent: false,
      noncePresent: false,
      credentialPresent: false,
      certificatePresent: false,
      permitPresent: false,
      callbackPresent: false,
      executableHandlePresent: false,
      runtimeCapabilityPresent: false,
      issuanceImpossible: true,
      authorityImpossible: true,
      executionImpossible: true,
    },
  };
}

export function createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(): ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor {
  return validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(
    {
      schemaVersion:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_SCHEMA_VERSION,
      phase: "3B.3.19",
      previousPhase: "3B.3.18",
      hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
      runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
      issuanceDecisionId:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ID,
      issuanceDecisionVersion:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_VERSION,
      issuanceDecisionState: "completed",
      issuanceDecisionResult: "authorization-grant-issuance-eligible-not-issued",
      issuanceDecisionCompleted: true,
      issuanceDecisionExecuted: false,
      issuanceEligible: true,
      issuanceBlocked: true,
      wouldIssueGrant: true,
      grantIssued: false,
      grantCreated: false,
      grantMaterialized: false,
      grantPersisted: false,
      grantApplied: false,
      grantActivated: false,
      grantConsumed: false,
      grantRevoked: false,
      grantExecutionAllowed: false,
      grantCreationAllowed: false,
      grantIssuanceAllowed: false,
      grantMaterializationAllowed: false,
      grantPersistenceAllowed: false,
      grantApplicationAllowed: false,
      grantActivationAllowed: false,
      grantConsumptionAllowed: false,
      grantRevocationAllowed: false,
      grantAuthorityAvailable: false,
      grantAuthorityEnabled: false,
      grantAuthorityDelegated: false,
      grantAuthorityTransferred: false,
      issuanceConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
      satisfiedIssuanceConditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
      unsatisfiedIssuanceConditions: [],
      issuanceGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
      satisfiedIssuanceGuards: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
      unsatisfiedIssuanceGuards: [],
      issuanceBlockers: CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS,
      issuancePreconditions: CONTROLLED_HOST_ACTIVATION_ISSUANCE_PRECONDITIONS,
      issuanceValidationPoints:
        CONTROLLED_HOST_ACTIVATION_ISSUANCE_VALIDATION_POINTS,
      issuanceInvariants: FEED_SEALED_INVARIANT_IDS,
      issuanceReason:
        "grant-ready-and-all-issuance-prerequisites-satisfied-but-issuance-disabled-by-phase-contract",
      issuanceStrategy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_STRATEGY,
      issuancePolicy: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
      issuancePolicyVersion: CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY_VERSION,
      grantReadinessId:
        CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ID,
      grantReadinessResult: "authorization-grant-ready-not-issued",
      grantReadinessCompleted: true,
      grantReadinessExecuted: false,
      grantReady: true,
      grantBlocked: true,
      grantPolicy: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
      grantPolicyVersion: CONTROLLED_HOST_ACTIVATION_GRANT_POLICY_VERSION,
      grantConditions: CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
      grantGuards: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
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
      grantReadinessIdentityValid: true,
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
      issuancePolicyIdentityValid: true,
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
      issuanceDecisionExecutionAllowed: false,
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
      ownershipTransferAllowed: false,
      writerTransferAllowed: false,
      rendererTransferAllowed: false,
      runtimeMutationAllowed: false,
      domMutationAllowed: false,
      reactRemountAllowed: false,
      secondGeofeedAllowed: false,
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
      tokenPresent: false,
      secretPresent: false,
      signaturePresent: false,
      noncePresent: false,
      credentialPresent: false,
      certificatePresent: false,
      permitPresent: false,
      callbackPresent: false,
      executableHandlePresent: false,
      runtimeCapabilityPresent: false,
      nextEligibleStep: "3B.3.20",
      activationBlocker:
        PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
    },
  );
}

export function validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(
  candidate: unknown,
): ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_INVALID",
      "Grant issuance decision descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_SCHEMA",
      "Unsupported grant issuance decision descriptor schemaVersion",
    );
  }
  if (c.previousPhase !== "3B.3.18") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_PREV",
      "previousPhase must be 3B.3.18",
    );
  }
  if (c.phase !== "3B.3.19") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_PHASE",
      "phase must be 3B.3.19",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.issuanceDecisionResult !== "authorization-grant-issuance-eligible-not-issued" ||
    c.issuanceDecisionCompleted !== true ||
    c.issuanceEligible !== true ||
    c.issuanceBlocked !== true ||
    c.wouldIssueGrant !== true ||
    c.grantIssued !== false ||
    c.grantCreated !== false ||
    c.grantMaterialized !== false ||
    c.grantPersisted !== false ||
    c.grantApplied !== false ||
    c.grantActivated !== false ||
    c.grantConsumed !== false ||
    c.grantRevoked !== false ||
    c.grantAuthorityAvailable !== false ||
    c.grantAuthorityEnabled !== false ||
    c.grantAuthorityDelegated !== false ||
    c.grantAuthorityTransferred !== false ||
    c.issuanceDecisionExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_RESULT",
      "eligible-not-issued/grant flags mismatch",
    );
  }
  if (
    c.grantReadinessResult !== "authorization-grant-ready-not-issued" ||
    c.grantReady !== true ||
    c.grantBlocked !== true ||
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
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_LINK",
      "grant readiness/authorization decision/selected transition/preflight/current state must remain sealed",
    );
  }
  if (
    c.grantCreationAllowed !== false ||
    c.grantIssuanceAllowed !== false ||
    c.grantMaterializationAllowed !== false ||
    c.grantPersistenceAllowed !== false ||
    c.grantApplicationAllowed !== false ||
    c.grantActivationAllowed !== false ||
    c.grantConsumptionAllowed !== false ||
    c.grantRevocationAllowed !== false ||
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
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_AUTH",
      "grant/authorization/execution flags must remain false",
    );
  }
  if (
    c.ownershipTransferAllowed !== false ||
    c.writerTransferAllowed !== false ||
    c.rendererTransferAllowed !== false ||
    c.runtimeMutationAllowed !== false ||
    c.domMutationAllowed !== false ||
    c.reactRemountAllowed !== false ||
    c.secondGeofeedAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_TRANSFER",
      "transfer/mutation/remount/second-geofeed flags must remain false",
    );
  }
  if (
    c.tokenPresent !== false ||
    c.secretPresent !== false ||
    c.signaturePresent !== false ||
    c.noncePresent !== false ||
    c.credentialPresent !== false ||
    c.certificatePresent !== false ||
    c.permitPresent !== false ||
    c.callbackPresent !== false ||
    c.executableHandlePresent !== false ||
    c.runtimeCapabilityPresent !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_TOKEN",
      "token/secret/signature/nonce/credential/certificate/permit/callback/executable-handle/runtime-capability must be absent",
    );
  }
  if (
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.rollbackState !== "prepared-not-active"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_OWNER",
      "owner/writer/renderer/rollback must remain legacy/prepared",
    );
  }
  if (c.nextEligibleStep !== "3B.3.20") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_NEXT",
      "nextEligibleStep must be 3B.3.20",
    );
  }
  if (
    c.activationBlocker !==
    PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_BLOCKER",
      "activationBlocker must be PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY",
    );
  }
  if (
    !Array.isArray(c.issuanceConditions) ||
    (c.issuanceConditions as unknown[]).length < 1
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_CONDITIONS",
      "issuanceConditions must be a non-empty array",
    );
  }
  assertUnique(
    c.issuanceConditions as string[],
    "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_DESCRIPTOR_DUP_COND",
  );
  return c as ControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor;
}
