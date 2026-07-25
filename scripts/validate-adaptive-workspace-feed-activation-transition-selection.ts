/**
 * Phase 3B.3.15 static validator — activation transition selection contract /
 * integrity / diagnostics / metadata / transition / selection / activation /
 * ownership / renderer / writer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationTransitionSelectionDescriptor,
  createControlledHostActivationTransitionSelectionContract,
  evaluateControlledHostActivationTransitionSelection,
  createFeedHostActivationTransitionSelectionIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransitionSelectionPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-selection.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-selection-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-selection-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-selection-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-transition-selection-phase3b315.mjs");
mustExist(
  "scripts/run-feed-host-activation-transition-selection-proof-phase3b315.mjs",
);
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-15-feed-host-activation-transition-selection.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b314/phase3b3-14-feed-host-activation-transition-graph-proof.json",
);

const selectionProofPath = join(
  root,
  "docs/audits/artifacts/phase3b315/phase3b3-15-feed-host-activation-transition-selection-proof.json",
);
const selectionPreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b315/phase3b3-15-feed-host-activation-transition-selection-prepared.json",
);
const artifactsPresent =
  existsSync(selectionProofPath) && existsSync(selectionPreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B315_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.15 proof/prepared artifacts required but missing",
  );
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.19");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor = createControlledHostActivationTransitionSelectionDescriptor();
assert.equal(descriptor.selectionResult, "transition-selected-not-executable");
assert.equal(descriptor.currentState, "COMMIT_READY");
assert.equal(descriptor.currentNode, "COMMIT_READY");
assert.equal(descriptor.selectionExecuted, false);
assert.equal(descriptor.transitionExecuted, false);
assert.equal(descriptor.protocolExecuted, false);
assert.equal(descriptor.transactionCommitted, false);
assert.equal(descriptor.canStartActivation, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
);
assert.deepEqual(
  [...descriptor.candidateTransitions],
  [...CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS],
);
assert.deepEqual(
  [...descriptor.eligibleTransitions],
  [...CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS],
);
assert.deepEqual(
  [...descriptor.ineligibleTransitions],
  [...CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS],
);
assert.deepEqual(
  [...descriptor.selectionGuards],
  [...CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS],
);
assert.deepEqual(
  [...descriptor.selectionPreconditions],
  [...CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS],
);
assert.deepEqual(
  [...descriptor.selectionInputSources],
  [...CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_INPUT_SOURCES],
);
assert.equal(descriptor.selectedTransition, CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION);
assert.equal(descriptor.invariants.length, 20);

const evaluation = evaluateControlledHostActivationTransitionSelection(registry);
assert.equal(evaluation.diagnostics.selectionCompleted, true);
assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
assert.equal(evaluation.diagnostics.selectionExecuted, false);
assert.equal(evaluation.diagnostics.executionImpossible, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.15");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.16");

const selectionContract =
  createControlledHostActivationTransitionSelectionContract();
assert.equal(
  selectionContract.selectionResult,
  "transition-selected-not-executable",
);
assert.equal(selectionContract.selectionExecutionAllowed, false);
assert.equal(selectionContract.commitAllowed, false);

const identity = createFeedHostActivationTransitionSelectionIdentity();
assert.equal(
  identity.selectionExecutionViaTransitionSelectionAllowed,
  false,
);

const plan = createControlledFeedHostPlan();
assert.equal(
  plan.transitionSelectionResult,
  "transition-selected-not-executable",
);
assert.equal(plan.selectedTransition, "COMMIT_READY->ACTIVE");
assert.equal(plan.selectionExecuted, false);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.19-controlled-host-activation-candidate",
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
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(
  gate.blockers.includes(PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY),
);
assert.equal(gate.currentStep, "3B.3.18");
assert.equal(gate.eligibleStep, "3B.3.19");
assert.equal(gate.transitionSelectionStatus, "completed");
assert.equal(gate.transitionPreflightStatus, "completed");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionSelectionResult,
  "transition-selected-not-executable",
);
assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.selectedTransition,
  "COMMIT_READY->ACTIVE",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.selectionExecuted, false);

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
assert.match(probeBridge, /version:\s*19/);
assert.match(probeBridge, /readHostActivationTransitionPreflight/);
assert.match(
  probeBridge,
  /PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY/,
);

for (const name of [
  "controlled-host-activation-transition-selection.ts",
  "controlled-host-activation-transition-selection-contract.ts",
  "feed-host-activation-transition-selection-identity.ts",
  "feed-host-activation-transition-selection-prepared.ts",
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

const graphProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b314/phase3b3-14-feed-host-activation-transition-graph-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(graphProof.overallVerdict, "READY_FOR_PHASE_3B_3_15");

if (artifactsPresent) {
  const selectionProof = JSON.parse(readFileSync(selectionProofPath, "utf8"));
  assert.equal(selectionProof.overallVerdict, "READY_FOR_PHASE_3B_3_16");
  assert.equal(selectionProof.hostActivation, false);
  assert.equal(selectionProof.canStartActivation, false);
  assert.equal(
    selectionProof.hostActivationTransitionSelection.selectionResult,
    "transition-selected-not-executable",
  );
  assert.equal(
    selectionProof.hostActivationTransitionSelection.currentState,
    "COMMIT_READY",
  );
  assert.equal(
    selectionProof.hostActivationTransitionSelection.selectionExecuted,
    false,
  );
  assert.equal(
    selectionProof.hostActivationTransitionSelection.selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    selectionProof.hostActivationTransitionSelection.activationBlocker,
    PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
  );
  assert.equal(selectionProof.mountUnmount.mountCount, 1);
  assert.equal(selectionProof.mountUnmount.unmountCount, 0);
  assert.equal(selectionProof.activationAttempt.blocked, true);
  assert.ok(
    selectionProof.activationAttempt.blockers.includes(
      PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
    ),
  );
  assert.equal(
    (selectionProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared = validateFeedHostActivationTransitionSelectionPreparedContract(
    JSON.parse(readFileSync(selectionPreparedPath, "utf8")),
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.16");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.selectionExecuted, false);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-transition-selection: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-transition-selection: ok (pre-proof contracts)",
);
