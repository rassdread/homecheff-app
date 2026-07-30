/**
 * Phase 3B.3.16 — Controlled Host Activation Transition Preflight Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  evaluateControlledHostActivationTransitionPreflight,
} from "./controlled-host-activation-transition-preflight";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_REQUIREMENTS = [
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
  "current-state-commit-ready",
  "current-node-commit-ready",
  "selected-transition-commit-ready-to-active",
  "selection-completed-not-executable",
  "transition-graph-complete-not-executable",
  "state-machine-complete-not-executable",
  "activation-transition-preflight-metadata-only",
  "activation-transition-preflight-diagnostics-readable",
  "deterministic-pure-transition-preflight-engine",
  "transition-preflight-only-no-executor-no-scheduler",
  "preflight-execution-not-authorized",
  "transition-authorization-not-granted",
  "transition-execution-not-authorized",
  "graph-traversal-not-authorized",
  "selection-execution-not-authorized",
  "commit-not-authorized",
  "ownership-transfer-not-authorized",
  "writer-transfer-not-authorized",
  "renderer-transfer-not-authorized",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationTransitionPreflightRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_REQUIREMENTS)[number];

export type ControlledHostActivationTransitionPreflightContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.16";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  preflightState: "completed";
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
  transitionAuthorized: false;
  authorizationGranted: false;
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
  preflightRequirements: readonly ControlledHostActivationTransitionPreflightRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  writerGuarantee: "legacy-writer-unchanged";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY;
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
  transitionAuthorizationAllowed: false;
  protocolExecutionAllowed: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.17";
};

export function createControlledHostActivationTransitionPreflightContract(): ControlledHostActivationTransitionPreflightContract {
  void evaluateControlledHostActivationTransitionPreflight();
  return validateControlledHostActivationTransitionPreflightContract({
    schemaVersion:
      CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.16",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    preflightState: "completed",
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
    transitionAuthorized: false,
    authorizationGranted: false,
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
    preflightRequirements: [
      ...CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_REQUIREMENTS,
    ],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    writerGuarantee: "legacy-writer-unchanged",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction:
      PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
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
    transitionAuthorizationAllowed: false,
    protocolExecutionAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.17",
  });
}

export function validateControlledHostActivationTransitionPreflightContract(
  candidate: unknown,
): ControlledHostActivationTransitionPreflightContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_INVALID",
      "Transition preflight contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_SCHEMA",
      "Unsupported transition preflight contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.16" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_PHASE",
      "phase must be 3B.3.16 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.preflightState !== "completed" ||
    c.preflightResult !== "transition-preflight-ready-not-authorized" ||
    c.preflightCompleted !== true ||
    c.preflightReady !== true ||
    c.preflightBlocked !== true ||
    c.preflightExecuted !== false ||
    c.currentState !== "COMMIT_READY" ||
    c.currentNode !== "COMMIT_READY" ||
    c.selectedTransition !== "COMMIT_READY->ACTIVE" ||
    c.selectedFromState !== "COMMIT_READY" ||
    c.selectedToState !== "ACTIVE" ||
    c.selectionResult !== "transition-selected-not-executable" ||
    c.graphResult !== "transition-graph-complete-not-executable" ||
    c.machineResult !== "state-machine-complete-not-executable"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_RESULT",
      "preflight/selection/current/graph/machine mismatch",
    );
  }
  if (
    c.transitionAuthorized !== false ||
    c.authorizationGranted !== false ||
    c.graphTraversalExecuted !== false ||
    c.transitionExecuted !== false ||
    c.protocolExecuted !== false ||
    c.transactionCommitted !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.preflightExecutionAllowed !== false ||
    c.transitionAuthorizationAllowed !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_FLAGS",
      "preflight/authorization/transition/activation flags must be false",
    );
  }
  if (
    c.activationRestriction !==
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_RESTRICTION",
      "activationRestriction must be PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY",
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
    "protocolExecutionAllowed",
    "ownershipTransferAllowed",
    "writerTransferAllowed",
    "rendererTransferAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  if (c.nextEligibleStep !== "3B.3.17") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_PREFLIGHT_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.17",
    );
  }
  return c as ControlledHostActivationTransitionPreflightContract;
}
