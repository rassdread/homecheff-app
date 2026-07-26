/**
 * Phase 3B.3.14 static validator — activation transition graph contract /
 * integrity / diagnostics / metadata / transition / graph / activation /
 * ownership / renderer / writer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationTransitionGraphDescriptor,
  createControlledHostActivationTransitionGraphContract,
  evaluateControlledHostActivationTransitionGraph,
  createFeedHostActivationTransitionGraphIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_GRAPH_NODES,
  CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES,
  CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS,
  CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS,
  CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS,
  CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransitionGraphPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-graph.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-graph-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-graph-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-graph-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-transition-graph-phase3b314.mjs");
mustExist("scripts/run-feed-host-activation-transition-graph-proof-phase3b314.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-14-feed-host-activation-transition-graph.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b313/phase3b3-13-feed-host-activation-state-machine-proof.json",
);

const graphProofPath = join(
  root,
  "docs/audits/artifacts/phase3b314/phase3b3-14-feed-host-activation-transition-graph-proof.json",
);
const graphPreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b314/phase3b3-14-feed-host-activation-transition-graph-prepared.json",
);
const artifactsPresent =
  existsSync(graphProofPath) && existsSync(graphPreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B314_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.14 proof/prepared artifacts required but missing",
  );
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.26");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor = createControlledHostActivationTransitionGraphDescriptor();
assert.equal(descriptor.graphResult, "transition-graph-complete-not-executable");
assert.equal(descriptor.currentNode, "COMMIT_READY");
assert.equal(descriptor.graphTraversalExecuted, false);
assert.equal(descriptor.transitionExecuted, false);
assert.equal(descriptor.protocolExecuted, false);
assert.equal(descriptor.transactionCommitted, false);
assert.equal(descriptor.canStartActivation, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
);
assert.deepEqual([...descriptor.graphNodes], [...CONTROLLED_HOST_ACTIVATION_GRAPH_NODES]);
assert.deepEqual([...descriptor.graphEdges], [...CONTROLLED_HOST_ACTIVATION_GRAPH_EDGES]);
assert.deepEqual(
  [...descriptor.allowedPaths],
  [...CONTROLLED_HOST_ACTIVATION_GRAPH_ALLOWED_PATHS],
);
assert.deepEqual(
  [...descriptor.blockedPaths],
  [...CONTROLLED_HOST_ACTIVATION_GRAPH_BLOCKED_PATHS],
);
assert.deepEqual(
  [...descriptor.edgeGuards],
  [...CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_GUARDS],
);
assert.deepEqual(
  [...descriptor.edgePreconditions],
  [...CONTROLLED_HOST_ACTIVATION_GRAPH_EDGE_PRECONDITIONS],
);
assert.deepEqual(
  [...descriptor.graphInputSources],
  [...CONTROLLED_HOST_ACTIVATION_TRANSITION_GRAPH_INPUT_SOURCES],
);
assert.ok(descriptor.blockedPaths.includes("COMMIT_READY->ACTIVE"));
assert.ok(descriptor.unreachableNodes.includes("ACTIVE"));
assert.equal(descriptor.invariants.length, 20);

const evaluation = evaluateControlledHostActivationTransitionGraph(registry);
assert.equal(evaluation.diagnostics.graphCompleted, true);
assert.equal(evaluation.diagnostics.currentNode, "COMMIT_READY");
assert.equal(evaluation.diagnostics.graphTraversalExecuted, false);
assert.equal(evaluation.diagnostics.traversalImpossible, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.14");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.15");

const graphContract = createControlledHostActivationTransitionGraphContract();
assert.equal(
  graphContract.graphResult,
  "transition-graph-complete-not-executable",
);
assert.equal(graphContract.graphTraversalAllowed, false);
assert.equal(graphContract.commitAllowed, false);

const identity = createFeedHostActivationTransitionGraphIdentity();
assert.equal(identity.graphTraversalViaTransitionGraphAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(
  plan.transitionGraphResult,
  "transition-graph-complete-not-executable",
);
assert.equal(plan.currentGraphNode, "COMMIT_READY");
assert.equal(plan.graphTraversalExecuted, false);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.26-controlled-workspace-host-activation-readiness",
);

const rollback = createFeedHostRollbackContract();
assert.equal(rollback.rollbackReadiness, "prepared-not-active");

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
  gate.blockers.includes(PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY),
);
assert.equal(gate.currentStep, "3B.3.25");
assert.equal(gate.eligibleStep, "3B.3.26");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionGraphResult,
  "transition-graph-complete-not-executable",
);
assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.currentGraphNode,
  "COMMIT_READY",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.graphTraversalExecuted, false);

const shell = readFileSync(
  join(root, "components/adaptive-workspace/FeedControlledHostShell.tsx"),
  "utf8",
);
assert.match(shell, /return null/);
const home = readFileSync(join(root, "components/home/HomePageClient.tsx"), "utf8");
assert.equal((home.match(/<GeoFeed\b/g) ?? []).length, 1);

const probeBridge = readFileSync(
  join(root, "lib/feed/feed-sealed-probe-bridge.ts"),
  "utf8",
);
assert.match(probeBridge, /version: 25/);
assert.match(probeBridge, /readHostActivationTransitionGraph/);
assert.match(probeBridge, /PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY/);

for (const name of [
  "controlled-host-activation-transition-graph.ts",
  "controlled-host-activation-transition-graph-contract.ts",
  "feed-host-activation-transition-graph-identity.ts",
  "feed-host-activation-transition-graph-prepared.ts",
]) {
  assert.doesNotMatch(
    readFileSync(join(root, "lib/adaptive-workspace/sealed", name), "utf8"),
    /GeoFeed|HomeGeoFeedDynamic/,
  );
}

const proof3b2 = validateFeedBrowserProofArtifact(
  JSON.parse(
    readFileSync(
      join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json"),
      "utf8",
    ),
  ),
);
assert.equal(proof3b2.overallVerdict, "READY_FOR_PHASE_3B_3");

const freezeRaw = JSON.parse(
  readFileSync(
    join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json"),
    "utf8",
  ),
);
validateFeedDiscoveryFreezeContract({
  ...freezeRaw,
  sealedContract: createFeedDiscoverySealedContract(),
  releaseBlockingInvariantIds: createFeedDiscoverySealedContract().invariantIds,
});

const machineProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b313/phase3b3-13-feed-host-activation-state-machine-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(machineProof.overallVerdict, "READY_FOR_PHASE_3B_3_14");

if (artifactsPresent) {
  const graphProof = JSON.parse(readFileSync(graphProofPath, "utf8"));
  assert.equal(graphProof.overallVerdict, "READY_FOR_PHASE_3B_3_15");
  assert.equal(graphProof.hostActivation, false);
  assert.equal(graphProof.canStartActivation, false);
  assert.equal(
    graphProof.hostActivationTransitionGraph.graphResult,
    "transition-graph-complete-not-executable",
  );
  assert.equal(
    graphProof.hostActivationTransitionGraph.currentNode,
    "COMMIT_READY",
  );
  assert.equal(
    graphProof.hostActivationTransitionGraph.graphTraversalExecuted,
    false,
  );
  assert.ok(
    graphProof.hostActivationTransitionGraph.allowedPaths.length > 0,
  );
  assert.ok(
    graphProof.hostActivationTransitionGraph.blockedPaths.includes(
      "COMMIT_READY->ACTIVE",
    ),
  );
  assert.equal(
    graphProof.hostActivationTransitionGraph.activationBlocker,
    PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  );
  assert.equal(graphProof.mountUnmount.mountCount, 1);
  assert.equal(graphProof.mountUnmount.unmountCount, 0);
  assert.equal(graphProof.activationAttempt.blocked, true);
  assert.ok(
    graphProof.activationAttempt.blockers.includes(
      PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
    ),
  );
  assert.equal(
    (graphProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared = validateFeedHostActivationTransitionGraphPreparedContract(
    JSON.parse(readFileSync(graphPreparedPath, "utf8")),
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.15");
  assert.equal(prepared.currentNode, "COMMIT_READY");
  assert.equal(prepared.graphTraversalExecuted, false);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-transition-graph: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-transition-graph: ok (pre-proof contracts)",
);
