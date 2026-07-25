/**
 * Phase 3B.3.17 static validator — activation transition authorization decision
 * contract / integrity / diagnostics / metadata / policy / condition / guard /
 * blocker / preflight linkage / grant safety / ownership / renderer / writer.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationTransitionAuthorizationDecisionDescriptor,
  createControlledHostActivationTransitionAuthorizationDecisionContract,
  evaluateControlledHostActivationTransitionAuthorizationDecision,
  createFeedHostActivationTransitionAuthorizationDecisionIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransitionAuthorizationDecisionPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-decision.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-decision-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-decision-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-decision-prepared.ts",
);
mustExist(
  "scripts/probe-feed-host-activation-transition-authorization-decision-phase3b317.mjs",
);
mustExist(
  "scripts/run-feed-host-activation-transition-authorization-decision-proof-phase3b317.mjs",
);
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-17-feed-host-activation-transition-authorization-decision.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b316/phase3b3-16-feed-host-activation-transition-preflight-proof.json",
);

const authProofPath = join(
  root,
  "docs/audits/artifacts/phase3b317/phase3b3-17-feed-host-activation-transition-authorization-decision-proof.json",
);
const authPreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b317/phase3b3-17-feed-host-activation-transition-authorization-decision-prepared.json",
);
const artifactsPresent =
  existsSync(authProofPath) && existsSync(authPreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B317_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.17 proof/prepared artifacts required but missing",
  );
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.22");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledHostActivationTransitionAuthorizationDecisionDescriptor();
assert.equal(
  descriptor.authorizationDecisionResult,
  "authorization-eligible-not-granted",
);
assert.equal(descriptor.authorizationDecisionCompleted, true);
assert.equal(descriptor.authorizationEligible, true);
assert.equal(descriptor.authorizationBlocked, true);
assert.equal(descriptor.wouldAuthorize, true);
assert.equal(descriptor.authorizationGranted, false);
assert.equal(descriptor.authorizationApplied, false);
assert.equal(descriptor.transitionAuthorized, false);
assert.equal(descriptor.authorizationDecisionExecuted, false);
assert.equal(descriptor.authorizationExecutionAllowed, false);
assert.equal(descriptor.currentState, "COMMIT_READY");
assert.equal(descriptor.currentNode, "COMMIT_READY");
assert.equal(descriptor.preflightReady, true);
assert.equal(
  descriptor.preflightResult,
  "transition-preflight-ready-not-authorized",
);
assert.equal(descriptor.preflightExecuted, false);
assert.equal(descriptor.canStartActivation, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
);
assert.equal(
  descriptor.authorizationPolicy,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
);
assert.deepEqual(
  [...descriptor.authorizationConditions],
  [...CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.satisfiedAuthorizationConditions],
  [...CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedAuthorizationConditions.length, 0);
assert.deepEqual(
  [...descriptor.authorizationGuards],
  [...CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS],
);
assert.equal(descriptor.unsatisfiedAuthorizationGuards.length, 0);
assert.equal(
  descriptor.selectedTransition,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
);
assert.equal(new Set(descriptor.authorizationConditions).size, descriptor.authorizationConditions.length);
assert.equal(new Set(descriptor.authorizationGuards).size, descriptor.authorizationGuards.length);

const evaluation =
  evaluateControlledHostActivationTransitionAuthorizationDecision(registry);
assert.equal(evaluation.diagnostics.authorizationDecisionCompleted, true);
assert.equal(evaluation.diagnostics.authorizationEligible, true);
assert.equal(evaluation.diagnostics.authorizationBlocked, true);
assert.equal(evaluation.diagnostics.wouldAuthorize, true);
assert.equal(evaluation.diagnostics.authorizationGranted, false);
assert.equal(evaluation.diagnostics.grantImpossible, true);
assert.equal(evaluation.diagnostics.executionImpossible, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.17");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.18");
assert.equal(
  evaluation.diagnostics.conditionCount,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
);
assert.equal(
  evaluation.diagnostics.guardCount,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
);

const authContract =
  createControlledHostActivationTransitionAuthorizationDecisionContract();
assert.equal(
  authContract.authorizationDecisionResult,
  "authorization-eligible-not-granted",
);
assert.equal(authContract.authorizationGrantAllowed, false);
assert.equal(authContract.authorizationApplicationAllowed, false);
assert.equal(authContract.transitionAuthorizationAllowed, false);
assert.equal(authContract.commitAllowed, false);

const identity =
  createFeedHostActivationTransitionAuthorizationDecisionIdentity();
assert.equal(
  identity.authorizationGrantViaAuthorizationDecisionAllowed,
  false,
);
assert.equal(
  identity.authorizationDecisionExecutionViaAuthorizationDecisionAllowed,
  false,
);

const plan = createControlledFeedHostPlan();
assert.equal(
  plan.authorizationDecisionResult,
  "authorization-eligible-not-granted",
);
assert.equal(plan.selectedTransition, "COMMIT_READY->ACTIVE");
assert.equal(plan.authorizationGranted, false);
assert.equal(plan.transitionAuthorized, false);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.20-controlled-host-activation-candidate",
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
  gate.blockers.includes(
    PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY,
  ),
);
assert.equal(gate.currentStep, "3B.3.21");
assert.equal(gate.eligibleStep, "3B.3.22");
assert.equal(gate.transitionAuthorizationDecisionStatus, "completed");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.authorizationDecisionResult,
  "authorization-eligible-not-granted",
);
assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.selectedTransition,
  "COMMIT_READY->ACTIVE",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.authorizationGranted, false);
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
assert.match(probeBridge, /version:\s*22/);
assert.match(probeBridge, /readHostActivationTransitionAuthorizationDecision/);
assert.match(
  probeBridge,
  /PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY/,
);

for (const name of [
  "controlled-host-activation-transition-authorization-decision.ts",
  "controlled-host-activation-transition-authorization-decision-contract.ts",
  "feed-host-activation-transition-authorization-decision-identity.ts",
  "feed-host-activation-transition-authorization-decision-prepared.ts",
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

const preflightProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b316/phase3b3-16-feed-host-activation-transition-preflight-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(preflightProof.overallVerdict, "READY_FOR_PHASE_3B_3_17");

if (artifactsPresent) {
  const authProof = JSON.parse(readFileSync(authProofPath, "utf8"));
  assert.equal(authProof.overallVerdict, "READY_FOR_PHASE_3B_3_18");
  assert.equal(authProof.hostActivation, false);
  assert.equal(authProof.canStartActivation, false);
  assert.equal(
    authProof.hostActivationTransitionAuthorizationDecision
      .authorizationDecisionResult,
    "authorization-eligible-not-granted",
  );
  assert.equal(
    authProof.hostActivationTransitionAuthorizationDecision.authorizationGranted,
    false,
  );
  assert.equal(
    authProof.hostActivationTransitionAuthorizationDecision.transitionAuthorized,
    false,
  );
  assert.equal(
    authProof.hostActivationTransitionAuthorizationDecision.currentState,
    "COMMIT_READY",
  );
  assert.equal(
    authProof.hostActivationTransitionAuthorizationDecision.selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    authProof.hostActivationTransitionAuthorizationDecision.activationBlocker,
    PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  );
  assert.equal(authProof.mountUnmount.mountCount, 1);
  assert.equal(authProof.mountUnmount.unmountCount, 0);
  assert.equal(authProof.activationAttempt.blocked, true);
  assert.ok(
    authProof.activationAttempt.blockers.includes(
      PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
    ),
  );
  assert.equal(
    (authProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared =
    validateFeedHostActivationTransitionAuthorizationDecisionPreparedContract(
      JSON.parse(readFileSync(authPreparedPath, "utf8")),
    );
  assert.equal(prepared.nextEligibleStep, "3B.3.18");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.authorizationGranted, false);
  assert.equal(prepared.authorizationDecisionExecuted, false);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-transition-authorization-decision: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-transition-authorization-decision: ok (pre-proof contracts)",
);
