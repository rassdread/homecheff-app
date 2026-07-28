/**
 * Phase 3B.3.14 — host activation transition graph unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransitionGraphDescriptor,
  evaluateControlledHostActivationTransitionGraph,
  validateControlledHostActivationTransitionGraphDescriptor,
  createControlledHostActivationTransitionGraphContract,
  validateControlledHostActivationTransitionGraphContract,
  createFeedHostActivationTransitionGraphIdentity,
  validateFeedHostActivationTransitionGraphIdentity,
  createFeedHostActivationTransitionGraphPreparedContract,
  validateFeedHostActivationTransitionGraphPreparedContract,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_GRAPH_NODES,
  CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES,
  CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS,
  CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS,
  CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS,
  CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_GRAPH_REACHABLE_NODES,
  CONTROLLED_HOST_ACTIVATION_GRAPH_UNREACHABLE_NODES,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b314] activation transition graph descriptor + engine");

{
  const a = createControlledHostActivationTransitionGraphDescriptor();
  const b = createControlledHostActivationTransitionGraphDescriptor();
  assert.equal(a.graphState, "completed");
  assert.equal(a.graphResult, "transition-graph-complete-not-executable");
  assert.equal(a.currentNode, "COMMIT_READY");
  assert.equal(a.entryNode, "LEGACY_DORMANT");
  assert.equal(a.graphTraversalExecuted, false);
  assert.equal(a.transitionExecuted, false);
  assert.equal(a.protocolExecuted, false);
  assert.equal(a.transactionCommitted, false);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  );
  assert.ok(a.terminalNodes.includes("ACTIVE"));
  assert.ok(a.unreachableNodes.includes("ACTIVE"));
  assert.ok(a.blockedPaths.includes("COMMIT_READY->ACTIVE"));
  assert.deepEqual([...a.graphNodes], [...CONTROLLED_HOST_ACTIVATION_GRAPH_NODES]);
  assert.deepEqual([...a.graphEdges], [...CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES]);
  assert.deepEqual(
    [...a.allowedPaths],
    [...CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS],
  );
  assert.deepEqual(
    [...a.blockedPaths],
    [...CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS],
  );
  assert.deepEqual(
    [...a.edgeGuards],
    [...CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS],
  );
  assert.deepEqual(
    [...a.edgeBlockers],
    [...CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_BLOCKERS],
  );
  assert.deepEqual(
    [...a.edgePreconditions],
    [...CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS],
  );
  assert.deepEqual(
    [...a.reachableNodes],
    [...CONTROLLED_HOST_ACTIVATION_GRAPH_REACHABLE_NODES],
  );
  assert.deepEqual(
    [...a.unreachableNodes],
    [...CONTROLLED_HOST_ACTIVATION_GRAPH_UNREACHABLE_NODES],
  );
  assert.deepEqual(
    [...a.graphInputSources],
    [...CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_INPUT_SOURCES],
  );
  assert.equal(a.invariants.length, 20);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("transition graph descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationTransitionGraph(
    createControlledHostRegistry(),
  );
  assert.equal(
    evaluation.descriptor.graphResult,
    "transition-graph-complete-not-executable",
  );
  assert.equal(evaluation.diagnostics.graphCompleted, true);
  assert.equal(evaluation.diagnostics.currentNode, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.graphTraversalExecuted, false);
  assert.equal(evaluation.diagnostics.transitionExecuted, false);
  assert.equal(evaluation.diagnostics.protocolExecuted, false);
  assert.equal(evaluation.diagnostics.transactionCommitted, false);
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.activeUnreachable, true);
  assert.equal(evaluation.diagnostics.traversalImpossible, true);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.14");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.15");
  assert.equal(
    evaluation.diagnostics.nodeCount,
    CONTROLLED_HOST_ACTIVATION_GRAPH_NODES.length,
  );
  assert.equal(
    evaluation.diagnostics.edgeCount,
    CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES.length,
  );
  ok("transition graph engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationTransitionGraphDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransitionGraphDescriptor({
        ...base,
        graphTraversalExecuted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionGraphDescriptor({
        ...base,
        currentNode: "ACTIVE" as unknown as "COMMIT_READY",
      }),
    HardContractViolation,
  );
  ok("transition graph descriptor fail-closed");
}

console.log("\n[phase3b314] contract + identity + activation safety");

{
  const c = createControlledHostActivationTransitionGraphContract();
  assert.equal(c.graphResult, "transition-graph-complete-not-executable");
  assert.equal(c.currentNode, "COMMIT_READY");
  assert.equal(c.graphTraversalExecuted, false);
  assert.equal(c.transitionExecuted, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.graphTraversalAllowed, false);
  assert.equal(c.transitionExecutionAllowed, false);
  assert.equal(c.commitAllowed, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionGraphContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("transition graph contract fail-closed");
}

{
  const id = createFeedHostActivationTransitionGraphIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.graphTraversalViaTransitionGraphAllowed, false);
  assert.equal(id.activationViaTransitionGraphAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionGraphIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("transition graph identity forbids traversal/activation");
}

{
  const gate = evaluateFeedHostActivationGate({
    forceHostActivation: true,
    phase3b2ProofValid: true,
    phase3b2FreezeValid: true,
    phase3b32ProofValid: true,
    phase3b33ProofValid: true,
    phase3b34ProofValid: true,
    phase3b35ProofValid: true,
    phase3b36ProofValid: true,
    phase3b37ProofValid: true,
    phase3b38ProofValid: true,
    phase3b39ProofValid: true,
    phase3b310ProofValid: true,
    phase3b311ProofValid: true,
    phase3b312ProofValid: true,
    phase3b313ProofValid: true,
    phase3b314ProofValid: true,
    phase3b315ProofValid: true,
    phase3b316ProofValid: true,
    phase3b317ProofValid: true,
    phase3b318ProofValid: true,
    phase3b319ProofValid: true,
    phase3b320ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedRegistrationState: "registered",
    observedEligibilityState: "eligible",
    observedReadinessState: "ready",
    observedSimulationState: "completed",
    observedDecisionState: "completed",
    observedPlanState: "completed",
    observedPipelineState: "completed",
    observedTransactionState: "completed",
    observedCommitReadinessState: "completed",
    observedCommitProtocolState: "completed",
    observedStateMachineState: "completed",
    observedTransitionGraphState: "completed",
  observedTransitionSelectionState: "completed",
    observedTransitionPreflightState: "completed",
    observedTransitionAuthorizationDecisionState: "completed",
    observedTransitionAuthorizationGrantReadinessState: "completed",
    observedTransitionAuthorizationGrantIssuanceDecisionState: "completed",
    observedTransitionAuthorizationGrantIssuancePlanState: "completed",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  });
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY),
  );
  assert.equal(gate.currentStep, "3B.3.43");
  assert.equal(gate.eligibleStep, "3B.3.44");
  ok("activation remains impossible");
}

{
  const host = createControlledFeedHostContract();
  const rollback = createFeedHostRollbackContract();
  const registry = createControlledHostRegistry();
  assert.equal(host.activeWriter, "legacy");
  assert.equal(host.activeRenderOwner, "legacy");
  assert.equal(host.hostActivation, false);
  assert.equal(registry.hostCount, 1);
  assert.equal(rollback.rollbackReadiness, "prepared-not-active");
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionGraphState,
    "completed",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.currentGraphNode,
    "COMMIT_READY",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.graphTraversalExecuted,
    false,
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionExecuted, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback/transition-graph unchanged");
}

{
  const ready = createFeedHostActivationTransitionGraphPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b314/phase3b3-14-feed-host-activation-transition-graph-proof.json",
    nodeCount: CONTROLLED_HOST_ACTIVATION_GRAPH_NODES.length,
    edgeCount: CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES.length,
    allowedPathCount: CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS.length,
    blockedPathCount: CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS.length,
  });
  assert.equal(ready.status, "host-activation-transition-graph-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.15");
  assert.equal(ready.currentNode, "COMMIT_READY");
  assert.equal(ready.graphTraversalExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionGraphPreparedContract({
        ...ready,
        graphTraversalExecuted: true,
      }),
    HardContractViolation,
  );
  ok("prepared transition graph fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.14 host activation transition graph: ${passed} assertions ok\n`,
);
