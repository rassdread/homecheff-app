/**
 * Phase 3B.3.14 readiness / freeze-for-next-step after transition graph.
 */

import { HardContractViolation } from "../schema/validation-error";

export const FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionGraphPreparedContract = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.14";
  status: "host-activation-transition-graph-prepared";
  graphContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  graphResult: "transition-graph-complete-not-executable";
  currentNode: "COMMIT_READY";
  graphTraversalExecuted: false;
  transitionExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  wouldCommit: true;
  commitReady: true;
  nodeCount: number;
  edgeCount: number;
  allowedPathCount: number;
  blockedPathCount: number;
  machineResult: "state-machine-complete-not-executable";
  protocolResult: "protocol-complete-not-executable";
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  writer: "legacy";
  owner: "legacy";
  renderer: "legacy";
  rollbackFoundation: "prepared-not-active";
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.15";
  activeHostMigration: false;
  activeRendererMigration: false;
  executorAuthorized: false;
  schedulerAuthorized: false;
  runtimeMutationAuthorized: false;
  commitAuthorized: false;
  graphTraversalAuthorized: false;
  transitionExecutionAuthorized: false;
  protocolExecutionAuthorized: false;
  ownershipTransferAuthorized: false;
  writerTransferAuthorized: false;
  rendererTransferAuthorized: false;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedHostActivationTransitionGraphPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  nodeCount: number;
  edgeCount: number;
  allowedPathCount: number;
  blockedPathCount: number;
}): FeedHostActivationTransitionGraphPreparedContract {
  return validateFeedHostActivationTransitionGraphPreparedContract({
    schemaVersion: FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.14",
    status: "host-activation-transition-graph-prepared",
    graphContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    graphResult: "transition-graph-complete-not-executable",
    currentNode: "COMMIT_READY",
    graphTraversalExecuted: false,
    transitionExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    wouldCommit: true,
    commitReady: true,
    nodeCount: args.nodeCount,
    edgeCount: args.edgeCount,
    allowedPathCount: args.allowedPathCount,
    blockedPathCount: args.blockedPathCount,
    machineResult: "state-machine-complete-not-executable",
    protocolResult: "protocol-complete-not-executable",
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    pipelineResult: "pipeline-complete-not-executable",
    wouldActivate: true,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    writer: "legacy",
    owner: "legacy",
    renderer: "legacy",
    rollbackFoundation: "prepared-not-active",
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.15",
    activeHostMigration: false,
    activeRendererMigration: false,
    executorAuthorized: false,
    schedulerAuthorized: false,
    runtimeMutationAuthorized: false,
    commitAuthorized: false,
    graphTraversalAuthorized: false,
    transitionExecutionAuthorized: false,
    protocolExecutionAuthorized: false,
    ownershipTransferAuthorized: false,
    writerTransferAuthorized: false,
    rendererTransferAuthorized: false,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedHostActivationTransitionGraphPreparedContract(
  candidate: unknown,
): FeedHostActivationTransitionGraphPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.14" ||
    c.status !== "host-activation-transition-graph-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.14",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.transactionCommitted !== false ||
    c.protocolExecuted !== false ||
    c.transitionExecuted !== false ||
    c.graphTraversalExecuted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_ACTIVATION",
      "activation/commit/protocol/transition/traversal flags must be false",
    );
  }
  if (
    c.graphResult !== "transition-graph-complete-not-executable" ||
    c.currentNode !== "COMMIT_READY" ||
    c.wouldCommit !== true ||
    c.commitReady !== true ||
    c.machineResult !== "state-machine-complete-not-executable" ||
    c.protocolResult !== "protocol-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_RESULT",
      "graph/current/machine/protocol/decision/plan/pipeline mismatch",
    );
  }
  if (
    typeof c.nodeCount !== "number" ||
    c.nodeCount < 1 ||
    typeof c.edgeCount !== "number" ||
    c.edgeCount < 1 ||
    typeof c.allowedPathCount !== "number" ||
    c.allowedPathCount < 1 ||
    typeof c.blockedPathCount !== "number" ||
    c.blockedPathCount < 1
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_COUNTS",
      "node/edge/path counts must be positive",
    );
  }
  if (c.writer !== "legacy" || c.owner !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.rollbackFoundation !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_ROLLBACK",
      "rollbackFoundation must be prepared-not-active",
    );
  }
  if (c.nextEligibleStep !== "3B.3.15") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.15",
    );
  }
  if (
    c.activeHostMigration !== false ||
    c.activeRendererMigration !== false ||
    c.executorAuthorized !== false ||
    c.schedulerAuthorized !== false ||
    c.runtimeMutationAuthorized !== false ||
    c.commitAuthorized !== false ||
    c.graphTraversalAuthorized !== false ||
    c.transitionExecutionAuthorized !== false ||
    c.protocolExecutionAuthorized !== false ||
    c.ownershipTransferAuthorized !== false ||
    c.writerTransferAuthorized !== false ||
    c.rendererTransferAuthorized !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_MIGRATION",
      "migration/executor/scheduler/commit/traversal must remain unauthorized",
    );
  }
  if (
    c.diagnosticsReadable !== true ||
    c.browserProof !== "pass" ||
    c.existing20Invariants !== "pass"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_PROOF",
      "diagnosticsReadable true; browserProof and invariants must be pass",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_GRAPH_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedHostActivationTransitionGraphPreparedContract;
}
