/**
 * Phase 3B.3.19 static validator — activation transition authorization grant
 * issuance decision contract / integrity / diagnostics / metadata / policy /
 * condition / guard / blocker / grant-readiness linkage / issuance safety /
 * ownership / renderer / writer.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor,
  createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionContract,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision,
  createFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-grant-issuance-decision.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-grant-issuance-decision-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-grant-issuance-decision-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-grant-issuance-decision-prepared.ts",
);
mustExist(
  "scripts/probe-feed-host-activation-transition-authorization-grant-issuance-decision-phase3b319.mjs",
);
mustExist(
  "scripts/run-feed-host-activation-transition-authorization-grant-issuance-decision-proof-phase3b319.mjs",
);
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-19-feed-host-activation-transition-authorization-grant-issuance-decision.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorGrantReadinessProofPath = join(
  root,
  "docs/audits/artifacts/phase3b318/phase3b3-18-feed-host-activation-transition-authorization-grant-readiness-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b318/phase3b3-18-feed-host-activation-transition-authorization-grant-readiness-proof.json",
);
const priorGrantReadinessProof = JSON.parse(
  readFileSync(priorGrantReadinessProofPath, "utf8"),
);
assert.equal(
  priorGrantReadinessProof.overallVerdict,
  "READY_FOR_PHASE_3B_3_19",
);

const issuanceProofPath = join(
  root,
  "docs/audits/artifacts/phase3b319/phase3b3-19-feed-host-activation-transition-authorization-grant-issuance-decision-proof.json",
);
const issuancePreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b319/phase3b3-19-feed-host-activation-transition-authorization-grant-issuance-decision-prepared.json",
);
const artifactsPresent =
  existsSync(issuanceProofPath) && existsSync(issuancePreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B319_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.19 proof/prepared artifacts required but missing",
  );
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.20");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor();
assert.equal(
  descriptor.issuanceDecisionResult,
  "authorization-grant-issuance-eligible-not-issued",
);
assert.equal(descriptor.issuanceDecisionCompleted, true);
assert.equal(descriptor.issuanceEligible, true);
assert.equal(descriptor.issuanceBlocked, true);
assert.equal(descriptor.wouldIssueGrant, true);
assert.equal(descriptor.grantIssued, false);
assert.equal(descriptor.grantCreated, false);
assert.equal(descriptor.grantMaterialized, false);
assert.equal(descriptor.grantPersisted, false);
assert.equal(descriptor.grantApplied, false);
assert.equal(descriptor.grantActivated, false);
assert.equal(descriptor.grantConsumed, false);
assert.equal(descriptor.grantRevoked, false);
assert.equal(descriptor.grantAuthorityAvailable, false);
assert.equal(descriptor.grantAuthorityEnabled, false);
assert.equal(descriptor.grantAuthorityDelegated, false);
assert.equal(descriptor.grantAuthorityTransferred, false);
assert.equal(descriptor.tokenPresent, false);
assert.equal(descriptor.secretPresent, false);
assert.equal(descriptor.signaturePresent, false);
assert.equal(descriptor.noncePresent, false);
assert.equal(descriptor.credentialPresent, false);
assert.equal(descriptor.certificatePresent, false);
assert.equal(descriptor.permitPresent, false);
assert.equal(descriptor.callbackPresent, false);
assert.equal(descriptor.executableHandlePresent, false);
assert.equal(descriptor.runtimeCapabilityPresent, false);
assert.equal(
  descriptor.grantReadinessResult,
  "authorization-grant-ready-not-issued",
);
assert.equal(descriptor.grantReady, true);
assert.equal(descriptor.grantBlocked, true);
assert.equal(
  descriptor.authorizationDecisionResult,
  "authorization-eligible-not-granted",
);
assert.equal(descriptor.authorizationEligible, true);
assert.equal(descriptor.authorizationGranted, false);
assert.equal(descriptor.transitionAuthorized, false);
assert.equal(descriptor.currentState, "COMMIT_READY");
assert.equal(descriptor.currentNode, "COMMIT_READY");
assert.equal(descriptor.canStartActivation, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
);
assert.equal(
  descriptor.issuancePolicy,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
);
assert.deepEqual(
  [...descriptor.issuanceConditions],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.satisfiedIssuanceConditions],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedIssuanceConditions.length, 0);
assert.deepEqual(
  [...descriptor.issuanceGuards],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS],
);
assert.equal(descriptor.unsatisfiedIssuanceGuards.length, 0);
assert.equal(
  descriptor.selectedTransition,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
);
assert.equal(
  new Set(descriptor.issuanceConditions).size,
  descriptor.issuanceConditions.length,
);
assert.equal(
  new Set(descriptor.issuanceGuards).size,
  descriptor.issuanceGuards.length,
);

const evaluation =
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision(
    registry,
  );
assert.equal(evaluation.diagnostics.issuanceDecisionCompleted, true);
assert.equal(evaluation.diagnostics.issuanceEligible, true);
assert.equal(evaluation.diagnostics.issuanceBlocked, true);
assert.equal(evaluation.diagnostics.wouldIssueGrant, true);
assert.equal(evaluation.diagnostics.grantIssued, false);
assert.equal(evaluation.diagnostics.issuanceImpossible, true);
assert.equal(evaluation.diagnostics.authorityImpossible, true);
assert.equal(evaluation.diagnostics.executionImpossible, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.19");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.20");
assert.equal(
  evaluation.diagnostics.conditionCount,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS.length,
);
assert.equal(
  evaluation.diagnostics.guardCount,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS.length,
);

const issuanceContract =
  createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionContract();
assert.equal(
  issuanceContract.issuanceDecisionResult,
  "authorization-grant-issuance-eligible-not-issued",
);
assert.equal(issuanceContract.grantCreationAllowed, false);
assert.equal(issuanceContract.grantIssuanceAllowed, false);
assert.equal(issuanceContract.grantMaterializationAllowed, false);
assert.equal(issuanceContract.authorizationGrantAllowed, false);
assert.equal(issuanceContract.commitAllowed, false);

const identity =
  createFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity();
assert.equal(identity.grantCreationViaIssuanceDecisionAllowed, false);
assert.equal(identity.grantIssuanceViaIssuanceDecisionAllowed, false);
assert.equal(identity.grantMaterializationViaIssuanceDecisionAllowed, false);
assert.equal(identity.grantAuthorityViaIssuanceDecisionAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.authorizationGranted, false);
assert.equal(plan.transitionAuthorized, false);

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
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
} as Parameters<typeof evaluateFeedHostActivationGate>[0]);
assert.equal(gate.allowed, false);
assert.equal(gate.currentStep, "3B.3.19");
assert.equal(gate.eligibleStep, "3B.3.20");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep,
  "3B.3.20",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.grantIssued, false);

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
assert.match(probeBridge, /version:\s*20/);
assert.match(
  probeBridge,
  /readHostActivationTransitionAuthorizationGrantIssuanceDecision/,
);
assert.match(
  probeBridge,
  /PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY/,
);

for (const name of [
  "controlled-host-activation-transition-authorization-grant-issuance-decision.ts",
  "controlled-host-activation-transition-authorization-grant-issuance-decision-contract.ts",
  "feed-host-activation-transition-authorization-grant-issuance-decision-identity.ts",
  "feed-host-activation-transition-authorization-grant-issuance-decision-prepared.ts",
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
  const issuanceProof = JSON.parse(readFileSync(issuanceProofPath, "utf8"));
  assert.equal(issuanceProof.overallVerdict, "READY_FOR_PHASE_3B_3_20");
  assert.equal(issuanceProof.hostActivation, false);
  assert.equal(issuanceProof.canStartActivation, false);
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceDecision
      .issuanceDecisionResult,
    "authorization-grant-issuance-eligible-not-issued",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceDecision
      .grantIssued,
    false,
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceDecision
      .grantAuthorityAvailable,
    false,
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceDecision
      .currentState,
    "COMMIT_READY",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceDecision
      .selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceDecision
      .activationBlocker,
    PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  );
  assert.equal(issuanceProof.mountUnmount.mountCount, 1);
  assert.equal(issuanceProof.mountUnmount.unmountCount, 0);
  assert.equal(issuanceProof.activationAttempt.blocked, true);
  assert.ok(
    issuanceProof.activationAttempt.blockers.includes(
      PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
    ),
  );
  assert.equal(
    (issuanceProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared =
    validateFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionPreparedContract(
      JSON.parse(readFileSync(issuancePreparedPath, "utf8")),
    );
  assert.equal(prepared.nextEligibleStep, "3B.3.20");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.grantIssued, false);
  assert.equal(prepared.issuanceDecisionExecuted, false);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-transition-authorization-grant-issuance-decision: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-transition-authorization-grant-issuance-decision: ok (pre-proof contracts)",
);
