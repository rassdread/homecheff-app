/**
 * Phase 3B.3.16 static validator — activation transition preflight contract /
 * integrity / diagnostics / metadata / transition / preflight / authorization /
 * ownership / renderer / writer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationTransitionPreflightDescriptor,
  createControlledHostActivationTransitionPreflightContract,
  evaluateControlledHostActivationTransitionPreflight,
  createFeedHostActivationTransitionPreflightIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransitionPreflightPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-preflight.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-preflight-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-preflight-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-preflight-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-transition-preflight-phase3b316.mjs");
mustExist(
  "scripts/run-feed-host-activation-transition-preflight-proof-phase3b316.mjs",
);
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-16-feed-host-activation-transition-preflight.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b315/phase3b3-15-feed-host-activation-transition-selection-proof.json",
);

const preflightProofPath = join(
  root,
  "docs/audits/artifacts/phase3b316/phase3b3-16-feed-host-activation-transition-preflight-proof.json",
);
const preflightPreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b316/phase3b3-16-feed-host-activation-transition-preflight-prepared.json",
);
const artifactsPresent =
  existsSync(preflightProofPath) && existsSync(preflightPreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B316_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.16 proof/prepared artifacts required but missing",
  );
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.23");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor = createControlledHostActivationTransitionPreflightDescriptor();
assert.equal(descriptor.preflightResult, "transition-preflight-ready-not-authorized");
assert.equal(descriptor.currentState, "COMMIT_READY");
assert.equal(descriptor.currentNode, "COMMIT_READY");
assert.equal(descriptor.preflightExecuted, false);
assert.equal(descriptor.transitionAuthorized, false);
assert.equal(descriptor.authorizationGranted, false);
assert.equal(descriptor.selectionExecuted, false);
assert.equal(descriptor.transitionExecuted, false);
assert.equal(descriptor.protocolExecuted, false);
assert.equal(descriptor.transactionCommitted, false);
assert.equal(descriptor.canStartActivation, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
);
assert.deepEqual(
  [...descriptor.preflightChecks],
  [...CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS],
);
assert.deepEqual(
  [...descriptor.passedChecks],
  [...CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS],
);
assert.equal(descriptor.selectedTransition, CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION);
assert.equal(descriptor.preflightInvariants.length, 20);

const evaluation = evaluateControlledHostActivationTransitionPreflight(registry);
assert.equal(evaluation.diagnostics.preflightCompleted, true);
assert.equal(evaluation.diagnostics.preflightReady, true);
assert.equal(evaluation.diagnostics.preflightBlocked, true);
assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
assert.equal(evaluation.diagnostics.preflightExecuted, false);
assert.equal(evaluation.diagnostics.transitionAuthorized, false);
assert.equal(evaluation.diagnostics.executionImpossible, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.16");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.17");
assert.equal(
  evaluation.diagnostics.checkCount,
  CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS.length,
);
assert.equal(
  evaluation.diagnostics.passedCount,
  CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS.length,
);

const preflightContract =
  createControlledHostActivationTransitionPreflightContract();
assert.equal(
  preflightContract.preflightResult,
  "transition-preflight-ready-not-authorized",
);
assert.equal(preflightContract.preflightExecutionAllowed, false);
assert.equal(preflightContract.transitionAuthorizationAllowed, false);
assert.equal(preflightContract.commitAllowed, false);

const identity = createFeedHostActivationTransitionPreflightIdentity();
assert.equal(
  identity.preflightExecutionViaTransitionPreflightAllowed,
  false,
);
assert.equal(
  identity.transitionAuthorizationViaTransitionPreflightAllowed,
  false,
);

const plan = createControlledFeedHostPlan();
assert.equal(
  plan.transitionPreflightResult,
  "transition-preflight-ready-not-authorized",
);
assert.equal(plan.selectedTransition, "COMMIT_READY->ACTIVE");
assert.equal(plan.preflightExecuted, false);
assert.equal(plan.transitionAuthorized, false);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.23-controlled-host-activation-candidate",
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
  gate.blockers.includes(PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY),
);
assert.equal(gate.currentStep, "3B.3.22");
assert.equal(gate.eligibleStep, "3B.3.23");
assert.equal(gate.transitionPreflightStatus, "completed");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionPreflightResult,
  "transition-preflight-ready-not-authorized",
);
assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.selectedTransition,
  "COMMIT_READY->ACTIVE",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.preflightExecuted, false);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionAuthorized, false);

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
assert.match(probeBridge, /version: 23/);
assert.match(probeBridge, /readHostActivationTransitionPreflight/);
assert.match(
  probeBridge,
  /PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY/,
);

for (const name of [
  "controlled-host-activation-transition-preflight.ts",
  "controlled-host-activation-transition-preflight-contract.ts",
  "feed-host-activation-transition-preflight-identity.ts",
  "feed-host-activation-transition-preflight-prepared.ts",
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

const selectionProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b315/phase3b3-15-feed-host-activation-transition-selection-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(selectionProof.overallVerdict, "READY_FOR_PHASE_3B_3_16");

if (artifactsPresent) {
  const preflightProof = JSON.parse(readFileSync(preflightProofPath, "utf8"));
  assert.equal(preflightProof.overallVerdict, "READY_FOR_PHASE_3B_3_17");
  assert.equal(preflightProof.hostActivation, false);
  assert.equal(preflightProof.canStartActivation, false);
  assert.equal(
    preflightProof.hostActivationTransitionPreflight.preflightResult,
    "transition-preflight-ready-not-authorized",
  );
  assert.equal(
    preflightProof.hostActivationTransitionPreflight.currentState,
    "COMMIT_READY",
  );
  assert.equal(
    preflightProof.hostActivationTransitionPreflight.preflightExecuted,
    false,
  );
  assert.equal(
    preflightProof.hostActivationTransitionPreflight.transitionAuthorized,
    false,
  );
  assert.equal(
    preflightProof.hostActivationTransitionPreflight.selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    preflightProof.hostActivationTransitionPreflight.activationBlocker,
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  );
  assert.equal(preflightProof.mountUnmount.mountCount, 1);
  assert.equal(preflightProof.mountUnmount.unmountCount, 0);
  assert.equal(preflightProof.activationAttempt.blocked, true);
  assert.ok(
    preflightProof.activationAttempt.blockers.includes(
      PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
    ),
  );
  assert.equal(
    (preflightProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared = validateFeedHostActivationTransitionPreflightPreparedContract(
    JSON.parse(readFileSync(preflightPreparedPath, "utf8")),
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.17");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.preflightExecuted, false);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-transition-preflight: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-transition-preflight: ok (pre-proof contracts)",
);
