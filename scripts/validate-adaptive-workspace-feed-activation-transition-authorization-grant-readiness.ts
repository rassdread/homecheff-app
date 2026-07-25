/**
 * Phase 3B.3.18 static validator — activation transition authorization grant
 * readiness contract / integrity / diagnostics / metadata / policy / condition
 * / guard / blocker / authorization-decision linkage / grant safety / ownership
 * / renderer / writer.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor,
  createControlledHostActivationTransitionAuthorizationGrantReadinessContract,
  evaluateControlledHostActivationTransitionAuthorizationGrantReadiness,
  createFeedHostActivationTransitionAuthorizationGrantReadinessIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
  CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-grant-readiness.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-grant-readiness-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-grant-readiness-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-grant-readiness-prepared.ts",
);
mustExist(
  "scripts/probe-feed-host-activation-transition-authorization-grant-readiness-phase3b318.mjs",
);
mustExist(
  "scripts/run-feed-host-activation-transition-authorization-grant-readiness-proof-phase3b318.mjs",
);
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-18-feed-host-activation-transition-authorization-grant-readiness.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorAuthProofPath = join(
  root,
  "docs/audits/artifacts/phase3b317/phase3b3-17-feed-host-activation-transition-authorization-decision-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b317/phase3b3-17-feed-host-activation-transition-authorization-decision-proof.json",
);
const priorAuthProof = JSON.parse(readFileSync(priorAuthProofPath, "utf8"));
assert.equal(priorAuthProof.overallVerdict, "READY_FOR_PHASE_3B_3_18");

const grantProofPath = join(
  root,
  "docs/audits/artifacts/phase3b318/phase3b3-18-feed-host-activation-transition-authorization-grant-readiness-proof.json",
);
const grantPreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b318/phase3b3-18-feed-host-activation-transition-authorization-grant-readiness-prepared.json",
);
const artifactsPresent =
  existsSync(grantProofPath) && existsSync(grantPreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B318_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.18 proof/prepared artifacts required but missing",
  );
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.19");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor();
assert.equal(
  descriptor.grantReadinessResult,
  "authorization-grant-ready-not-issued",
);
assert.equal(descriptor.grantReadinessCompleted, true);
assert.equal(descriptor.grantReady, true);
assert.equal(descriptor.grantBlocked, true);
assert.equal(descriptor.wouldIssueGrant, true);
assert.equal(descriptor.grantIssued, false);
assert.equal(descriptor.grantCreated, false);
assert.equal(descriptor.grantPersisted, false);
assert.equal(descriptor.grantApplied, false);
assert.equal(descriptor.grantAuthorityAvailable, false);
assert.equal(descriptor.grantAuthorityEnabled, false);
assert.equal(descriptor.grantTokenPresent, false);
assert.equal(descriptor.grantSecretPresent, false);
assert.equal(descriptor.grantSignaturePresent, false);
assert.equal(descriptor.grantCallbackPresent, false);
assert.equal(descriptor.authorizationEligible, true);
assert.equal(descriptor.authorizationGranted, false);
assert.equal(descriptor.transitionAuthorized, false);
assert.equal(descriptor.currentState, "COMMIT_READY");
assert.equal(descriptor.currentNode, "COMMIT_READY");
assert.equal(descriptor.canStartActivation, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
);
assert.equal(
  descriptor.grantPolicy,
  CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
);
assert.deepEqual(
  [...descriptor.grantConditions],
  [...CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.satisfiedGrantConditions],
  [...CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedGrantConditions.length, 0);
assert.deepEqual(
  [...descriptor.grantGuards],
  [...CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS],
);
assert.equal(descriptor.unsatisfiedGrantGuards.length, 0);
assert.equal(
  descriptor.selectedTransition,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
);
assert.equal(
  new Set(descriptor.grantConditions).size,
  descriptor.grantConditions.length,
);
assert.equal(
  new Set(descriptor.grantGuards).size,
  descriptor.grantGuards.length,
);

const evaluation =
  evaluateControlledHostActivationTransitionAuthorizationGrantReadiness(
    registry,
  );
assert.equal(evaluation.diagnostics.grantReadinessCompleted, true);
assert.equal(evaluation.diagnostics.grantReady, true);
assert.equal(evaluation.diagnostics.grantBlocked, true);
assert.equal(evaluation.diagnostics.wouldIssueGrant, true);
assert.equal(evaluation.diagnostics.grantIssued, false);
assert.equal(evaluation.diagnostics.issuanceImpossible, true);
assert.equal(evaluation.diagnostics.authorityImpossible, true);
assert.equal(evaluation.diagnostics.executionImpossible, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.18");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.19");
assert.equal(
  evaluation.diagnostics.conditionCount,
  CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS.length,
);
assert.equal(
  evaluation.diagnostics.guardCount,
  CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS.length,
);

const grantContract =
  createControlledHostActivationTransitionAuthorizationGrantReadinessContract();
assert.equal(
  grantContract.grantReadinessResult,
  "authorization-grant-ready-not-issued",
);
assert.equal(grantContract.grantCreationAllowed, false);
assert.equal(grantContract.grantIssuanceAllowed, false);
assert.equal(grantContract.authorizationGrantAllowed, false);
assert.equal(grantContract.commitAllowed, false);

const identity =
  createFeedHostActivationTransitionAuthorizationGrantReadinessIdentity();
assert.equal(identity.grantCreationViaGrantReadinessAllowed, false);
assert.equal(identity.grantIssuanceViaGrantReadinessAllowed, false);
assert.equal(identity.grantAuthorityViaGrantReadinessAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(
  plan.grantReadinessResult,
  "authorization-grant-ready-not-issued",
);
assert.equal(plan.selectedTransition, "COMMIT_READY->ACTIVE");
assert.equal(plan.authorizationGranted, false);
assert.equal(plan.transitionAuthorized, false);
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
  gate.blockers.includes(
    PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  ),
);
assert.equal(gate.currentStep, "3B.3.18");
assert.equal(gate.eligibleStep, "3B.3.19");
assert.equal(
  gate.transitionAuthorizationGrantReadinessStatus,
  "completed",
);

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.grantReadinessResult,
  "authorization-grant-ready-not-issued",
);
assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep,
  "3B.3.19",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.grantIssued, false);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.wouldIssueGrant, true);

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
assert.match(
  probeBridge,
  /readHostActivationTransitionAuthorizationGrantReadiness/,
);
assert.match(
  probeBridge,
  /PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY/,
);

for (const name of [
  "controlled-host-activation-transition-authorization-grant-readiness.ts",
  "controlled-host-activation-transition-authorization-grant-readiness-contract.ts",
  "feed-host-activation-transition-authorization-grant-readiness-identity.ts",
  "feed-host-activation-transition-authorization-grant-readiness-prepared.ts",
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

if (artifactsPresent) {
  const grantProof = JSON.parse(readFileSync(grantProofPath, "utf8"));
  assert.equal(grantProof.overallVerdict, "READY_FOR_PHASE_3B_3_19");
  assert.equal(grantProof.hostActivation, false);
  assert.equal(grantProof.canStartActivation, false);
  assert.equal(
    grantProof.hostActivationTransitionAuthorizationGrantReadiness
      .grantReadinessResult,
    "authorization-grant-ready-not-issued",
  );
  assert.equal(
    grantProof.hostActivationTransitionAuthorizationGrantReadiness.grantIssued,
    false,
  );
  assert.equal(
    grantProof.hostActivationTransitionAuthorizationGrantReadiness
      .grantAuthorityAvailable,
    false,
  );
  assert.equal(
    grantProof.hostActivationTransitionAuthorizationGrantReadiness
      .currentState,
    "COMMIT_READY",
  );
  assert.equal(
    grantProof.hostActivationTransitionAuthorizationGrantReadiness
      .selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    grantProof.hostActivationTransitionAuthorizationGrantReadiness
      .activationBlocker,
    PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  );
  assert.equal(grantProof.mountUnmount.mountCount, 1);
  assert.equal(grantProof.mountUnmount.unmountCount, 0);
  assert.equal(grantProof.activationAttempt.blocked, true);
  assert.ok(
    grantProof.activationAttempt.blockers.includes(
      PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    ),
  );
  assert.equal(
    (grantProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared =
    validateFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract(
      JSON.parse(readFileSync(grantPreparedPath, "utf8")),
    );
  assert.equal(prepared.nextEligibleStep, "3B.3.19");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.grantIssued, false);
  assert.equal(prepared.grantReadinessExecuted, false);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-transition-authorization-grant-readiness: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-transition-authorization-grant-readiness: ok (pre-proof contracts)",
);
