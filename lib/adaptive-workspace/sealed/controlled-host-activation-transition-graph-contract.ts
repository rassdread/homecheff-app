/**
 * Phase 3B.3.14 — Controlled Host Activation Transition Graph Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  evaluateControlledHostActivationTransitionGraph,
} from "./controlled-host-activation-transition-graph";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_REQUIREMENTS = [
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
  "current-node-commit-ready",
  "active-terminal-theoretical-only",
  "rollback-prepared-not-active",
  "transition-graph-complete-not-executable",
  "activation-transition-graph-metadata-only",
  "activation-transition-graph-diagnostics-readable",
  "deterministic-pure-transition-graph-engine",
  "transition-graph-only-no-executor-no-scheduler",
  "graph-traversal-not-authorized",
  "transition-execution-not-authorized",
  "commit-not-authorized",
  "ownership-transfer-not-authorized",
  "writer-transfer-not-authorized",
  "renderer-transfer-not-authorized",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationTransitionGraphRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_REQUIREMENTS)[number];

export type ControlledHostActivationTransitionGraphContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.14";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  graphState: "completed";
  graphResult: "transition-graph-complete-not-executable";
  currentNode: "COMMIT_READY";
  entryNode: "LEGACY_DORMANT";
  graphTraversalExecuted: false;
  transitionExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  wouldCommit: true;
  commitReady: true;
  machineResult: "state-machine-complete-not-executable";
  protocolResult: "protocol-complete-not-executable";
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  graphRequirements: readonly ControlledHostActivationTransitionGraphRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  writerGuarantee: "legacy-writer-unchanged";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY;
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
  protocolExecutionAllowed: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.15";
};

export function createControlledHostActivationTransitionGraphContract(): ControlledHostActivationTransitionGraphContract {
  void evaluateControlledHostActivationTransitionGraph();
  return validateControlledHostActivationTransitionGraphContract({
    schemaVersion:
      CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.14",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    graphState: "completed",
    graphResult: "transition-graph-complete-not-executable",
    currentNode: "COMMIT_READY",
    entryNode: "LEGACY_DORMANT",
    graphTraversalExecuted: false,
    transitionExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    wouldCommit: true,
    commitReady: true,
    machineResult: "state-machine-complete-not-executable",
    protocolResult: "protocol-complete-not-executable",
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    pipelineResult: "pipeline-complete-not-executable",
    wouldActivate: true,
    graphRequirements: [
      ...CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_REQUIREMENTS,
    ],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    writerGuarantee: "legacy-writer-unchanged",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction: PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
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
    protocolExecutionAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.15",
  });
}

export function validateControlledHostActivationTransitionGraphContract(
  candidate: unknown,
): ControlledHostActivationTransitionGraphContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_INVALID",
      "Transition graph contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_SCHEMA",
      "Unsupported transition graph contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.14" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_PHASE",
      "phase must be 3B.3.14 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.graphState !== "completed" ||
    c.graphResult !== "transition-graph-complete-not-executable" ||
    c.currentNode !== "COMMIT_READY" ||
    c.entryNode !== "LEGACY_DORMANT" ||
    c.machineResult !== "state-machine-complete-not-executable"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_RESULT",
      "graph/current/machine mismatch",
    );
  }
  if (
    c.graphTraversalExecuted !== false ||
    c.transitionExecuted !== false ||
    c.protocolExecuted !== false ||
    c.transactionCommitted !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_FLAGS",
      "traversal/transition/activation flags must be false",
    );
  }
  if (
    c.activationRestriction !==
    PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_RESTRICTION",
      "activationRestriction must be PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY",
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
    "protocolExecutionAllowed",
    "ownershipTransferAllowed",
    "writerTransferAllowed",
    "rendererTransferAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  if (c.nextEligibleStep !== "3B.3.15") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.15",
    );
  }
  return c as ControlledHostActivationTransitionGraphContract;
}
