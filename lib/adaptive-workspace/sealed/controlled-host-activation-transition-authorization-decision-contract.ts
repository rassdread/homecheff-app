/**
 * Phase 3B.3.17 — Controlled Host Activation Transition Authorization Decision Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  evaluateControlledHostActivationTransitionAuthorizationDecision,
} from "./controlled-host-activation-transition-authorization-decision";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_REQUIREMENTS = [
  "exactly-one-registered-host",
  "stable-runtime-id",
  "preserve-react-identity",
  "owner-legacy",
  "writer-legacy",
  "renderer-legacy",
  "host-activation-false",
  "render-activation-false",
  "can-start-activation-false",
  "transaction-committed-false",
  "protocol-executed-false",
  "transition-executed-false",
  "graph-traversal-executed-false",
  "selection-executed-false",
  "preflight-executed-false",
  "authorization-decision-executed-false",
  "authorization-granted-false",
  "authorization-applied-false",
  "transition-authorized-false",
  "current-state-commit-ready",
  "current-node-commit-ready",
  "selected-transition-commit-ready-to-active",
  "preflight-ready-not-authorized",
  "selection-completed-not-executable",
  "transition-graph-complete-not-executable",
  "state-machine-complete-not-executable",
  "activation-transition-authorization-decision-metadata-only",
  "activation-transition-authorization-decision-diagnostics-readable",
  "deterministic-pure-authorization-decision-engine",
  "authorization-decision-only-no-executor-no-scheduler",
  "authorization-grant-not-authorized",
  "authorization-application-not-authorized",
  "transition-authorization-not-granted",
  "transition-execution-not-authorized",
  "preflight-execution-not-authorized",
  "graph-traversal-not-authorized",
  "selection-execution-not-authorized",
  "commit-not-authorized",
  "ownership-transfer-not-authorized",
  "writer-transfer-not-authorized",
  "renderer-transfer-not-authorized",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationTransitionAuthorizationDecisionRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_REQUIREMENTS)[number];

export type ControlledHostActivationTransitionAuthorizationDecisionContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.17";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  authorizationDecisionState: "completed";
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
  preflightResult: "transition-preflight-ready-not-authorized";
  preflightCompleted: true;
  preflightReady: true;
  preflightBlocked: true;
  preflightExecuted: false;
  currentState: "COMMIT_READY";
  currentNode: "COMMIT_READY";
  selectedTransition: "COMMIT_READY->ACTIVE";
  selectedFromState: "COMMIT_READY";
  selectedToState: "ACTIVE";
  selectionResult: "transition-selected-not-executable";
  selectionCompleted: true;
  selectionExecuted: false;
  transitionExecuted: false;
  graphTraversalExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  wouldCommit: true;
  commitReady: true;
  graphResult: "transition-graph-complete-not-executable";
  machineResult: "state-machine-complete-not-executable";
  protocolResult: "protocol-complete-not-executable";
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  authorizationDecisionRequirements: readonly ControlledHostActivationTransitionAuthorizationDecisionRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  writerGuarantee: "legacy-writer-unchanged";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  remountAllowed: false;
  secondMountAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  runtimeMutationAllowed: false;
  commitAllowed: false;
  graphTraversalAllowed: false;
  transitionExecutionAllowed: false;
  selectionExecutionAllowed: false;
  preflightExecutionAllowed: false;
  authorizationDecisionExecutionAllowed: false;
  authorizationGrantAllowed: false;
  authorizationApplicationAllowed: false;
  transitionAuthorizationAllowed: false;
  protocolExecutionAllowed: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.18";
};

export function createControlledHostActivationTransitionAuthorizationDecisionContract(): ControlledHostActivationTransitionAuthorizationDecisionContract {
  void evaluateControlledHostActivationTransitionAuthorizationDecision();
  return validateControlledHostActivationTransitionAuthorizationDecisionContract({
    schemaVersion:
      CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.17",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
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
    preflightResult: "transition-preflight-ready-not-authorized",
    preflightCompleted: true,
    preflightReady: true,
    preflightBlocked: true,
    preflightExecuted: false,
    currentState: "COMMIT_READY",
    currentNode: "COMMIT_READY",
    selectedTransition: "COMMIT_READY->ACTIVE",
    selectedFromState: "COMMIT_READY",
    selectedToState: "ACTIVE",
    selectionResult: "transition-selected-not-executable",
    selectionCompleted: true,
    selectionExecuted: false,
    transitionExecuted: false,
    graphTraversalExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    wouldCommit: true,
    commitReady: true,
    graphResult: "transition-graph-complete-not-executable",
    machineResult: "state-machine-complete-not-executable",
    protocolResult: "protocol-complete-not-executable",
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    pipelineResult: "pipeline-complete-not-executable",
    wouldActivate: true,
    authorizationDecisionRequirements: [
      ...CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_REQUIREMENTS,
    ],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    writerGuarantee: "legacy-writer-unchanged",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction:
      PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    remountAllowed: false,
    secondMountAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
    executorAllowed: false,
    schedulerAllowed: false,
    runtimeMutationAllowed: false,
    commitAllowed: false,
    graphTraversalAllowed: false,
    transitionExecutionAllowed: false,
    selectionExecutionAllowed: false,
    preflightExecutionAllowed: false,
    authorizationDecisionExecutionAllowed: false,
    authorizationGrantAllowed: false,
    authorizationApplicationAllowed: false,
    transitionAuthorizationAllowed: false,
    protocolExecutionAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.18",
  });
}

export function validateControlledHostActivationTransitionAuthorizationDecisionContract(
  candidate: unknown,
): ControlledHostActivationTransitionAuthorizationDecisionContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_INVALID",
      "Authorization decision contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_SCHEMA",
      "Unsupported authorization decision contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.17" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_PHASE",
      "phase must be 3B.3.17 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.authorizationDecisionState !== "completed" ||
    c.authorizationDecisionResult !== "authorization-eligible-not-granted" ||
    c.authorizationDecisionCompleted !== true ||
    c.authorizationEligible !== true ||
    c.authorizationBlocked !== true ||
    c.wouldAuthorize !== true ||
    c.authorizationGranted !== false ||
    c.authorizationApplied !== false ||
    c.transitionAuthorized !== false ||
    c.authorizationDecisionExecuted !== false ||
    c.preflightReady !== true ||
    c.preflightResult !== "transition-preflight-ready-not-authorized" ||
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.selectedTransition !== "COMMIT_READY->ACTIVE"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_RESULT",
      "authorization decision/preflight/selection/current mismatch",
    );
  }
  if (
    c.authorizationGrantAllowed !== false ||
    c.authorizationApplicationAllowed !== false ||
    c.transitionAuthorizationAllowed !== false ||
    c.authorizationExecutionAllowed !== false ||
    c.authorizationDecisionExecutionAllowed !== false ||
    c.transitionExecutionAllowed !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_FLAGS",
      "authorization/execution/activation flags must be false",
    );
  }
  if (
    c.activationRestriction !==
    PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_RESTRICTION",
      "activationRestriction must be PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY",
    );
  }
  for (const key of [
    "remountAllowed",
    "secondMountAllowed",
    "wrapperAllowed",
    "portalAllowed",
    "executorAllowed",
    "schedulerAllowed",
    "runtimeMutationAllowed",
    "commitAllowed",
    "graphTraversalAllowed",
    "transitionExecutionAllowed",
    "selectionExecutionAllowed",
    "preflightExecutionAllowed",
    "protocolExecutionAllowed",
    "ownershipTransferAllowed",
    "writerTransferAllowed",
    "rendererTransferAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  if (c.nextEligibleStep !== "3B.3.18") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.18",
    );
  }
  return c as ControlledHostActivationTransitionAuthorizationDecisionContract;
}
