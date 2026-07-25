/**
 * Phase 3B.3.23 static validator — activation transition authorization grant
 * issuance plan contract / integrity / diagnostics / metadata / policy /
 * condition / guard / blocker / grant-readiness linkage / issuance safety /
 * ownership / renderer / writer.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor,
  createControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary,
  createFeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-grant-issuance-commit-boundary.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-grant-issuance-commit-boundary-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-grant-issuance-commit-boundary-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-grant-issuance-commit-boundary-prepared.ts",
);
mustExist(
  "scripts/probe-feed-host-activation-transition-authorization-grant-issuance-commit-boundary-phase3b323.mjs",
);
mustExist(
  "scripts/run-feed-host-activation-transition-authorization-grant-issuance-commit-boundary-proof-phase3b323.mjs",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorIssuancePlanProofPath = join(
  root,
  "docs/audits/artifacts/phase3b322/phase3b3-22-feed-host-activation-transition-authorization-grant-issuance-transaction-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b322/phase3b3-22-feed-host-activation-transition-authorization-grant-issuance-transaction-proof.json",
);
const priorIssuancePlanProof = JSON.parse(
  readFileSync(priorIssuancePlanProofPath, "utf8"),
);
assert.equal(
  priorIssuancePlanProof.overallVerdict,
  "READY_FOR_PHASE_3B_3_23",
);

const issuanceProofPath = join(
  root,
  "docs/audits/artifacts/phase3b323/phase3b3-23-feed-host-activation-transition-authorization-grant-issuance-commit-boundary-proof.json",
);
const issuancePreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b323/phase3b3-23-feed-host-activation-transition-authorization-grant-issuance-commit-boundary-prepared.json",
);
const auditPath =
  "docs/audits/homecheff-adaptive-workspace-phase3b3-23-feed-host-activation-transition-authorization-grant-issuance-commit-boundary.md";
const artifactsPresent =
  existsSync(issuanceProofPath) && existsSync(issuancePreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B323_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.23 proof/prepared artifacts required but missing",
  );
}
if (artifactsPresent || process.env.REQUIRE_PHASE3B323_ARTIFACTS === "1") {
  mustExist(auditPath);
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.24");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryDescriptor();
assert.equal(
  descriptor.issuanceCommitBoundaryResult,
  "authorization-grant-issuance-commit-boundary-ready-not-entered",
);
assert.equal(descriptor.issuanceCommitBoundaryCompleted, true);
assert.equal(descriptor.issuanceCommitBoundaryReady, true);
assert.equal(descriptor.issuanceCommitBoundaryBlocked, true);
assert.equal(descriptor.issuanceCommitBoundaryExecutable, false);
assert.equal(descriptor.wouldEnterIssuanceCommitBoundary, true);
assert.equal(descriptor.issuanceEligible, true);
assert.equal(descriptor.issuanceBlocked, true);
assert.equal(descriptor.wouldIssueGrant, true);
assert.equal(descriptor.transactionParticipantCount, 30);
assert.equal(descriptor.blockedTransactionParticipantCount, 30);
assert.equal(descriptor.executableTransactionParticipantCount, 0);
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
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
);
assert.equal(
  descriptor.issuanceCommitBoundaryPolicy,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_POLICY,
);
assert.deepEqual(
  [...descriptor.issuanceCommitBoundaryConditions],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.satisfiedIssuanceCommitBoundaryConditions],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedIssuanceCommitBoundaryConditions.length, 0);
assert.deepEqual(
  [...descriptor.issuanceCommitBoundaryGuards],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS],
);
assert.equal(descriptor.unsatisfiedIssuanceCommitBoundaryGuards.length, 0);
assert.equal(
  descriptor.selectedTransition,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
);
assert.equal(
  new Set(descriptor.issuanceCommitBoundaryConditions).size,
  descriptor.issuanceCommitBoundaryConditions.length,
);
assert.equal(
  new Set(descriptor.issuanceCommitBoundaryGuards).size,
  descriptor.issuanceCommitBoundaryGuards.length,
);

const evaluation =
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary(
    registry,
  );
assert.equal(evaluation.diagnostics.issuanceCommitBoundaryCompleted, true);
assert.equal(evaluation.diagnostics.issuanceEligible, true);
assert.equal(evaluation.diagnostics.issuanceBlocked, true);
assert.equal(evaluation.diagnostics.wouldIssueGrant, true);
assert.equal(evaluation.diagnostics.grantIssued, false);
assert.equal(evaluation.diagnostics.issuanceImpossible, true);
assert.equal(evaluation.diagnostics.authorityImpossible, true);
assert.equal(evaluation.diagnostics.executionImpossible, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.23");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.24");
assert.equal(
  evaluation.diagnostics.conditionCount,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_CONDITIONS.length,
);
assert.equal(
  evaluation.diagnostics.guardCount,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_COMMIT_BOUNDARY_GUARDS.length,
);

const issuanceContract =
  createControlledHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryContract();
assert.equal(
  issuanceContract.issuanceCommitBoundaryResult,
  "authorization-grant-issuance-commit-boundary-ready-not-entered",
);
assert.equal(issuanceContract.grantCreationAllowed, false);
assert.equal(issuanceContract.grantIssuanceAllowed, false);
assert.equal(issuanceContract.grantMaterializationAllowed, false);
assert.equal(issuanceContract.authorizationGrantAllowed, false);
assert.equal(issuanceContract.commitAllowed, false);

const identity =
  createFeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity();
assert.equal(identity.grantCreationViaIssuanceCommitBoundaryAllowed, false);
assert.equal(identity.grantIssuanceViaIssuanceCommitBoundaryAllowed, false);
assert.equal(identity.grantMaterializationViaIssuanceCommitBoundaryAllowed, false);
assert.equal(identity.grantAuthorityViaIssuanceCommitBoundaryAllowed, false);

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
  phase3b323ProofValid: true,
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
  observedTransitionAuthorizationGrantIssuanceCommitBoundaryState: "completed",
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
} as Parameters<typeof evaluateFeedHostActivationGate>[0]);
assert.equal(gate.allowed, false);
assert.equal(gate.currentStep, "3B.3.23");
assert.equal(gate.eligibleStep, "3B.3.24");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.24",
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
assert.match(probeBridge, /version: 24/);
assert.match(
  probeBridge,
  /readHostActivationTransitionAuthorizationGrantIssuanceCommitBoundary/,
);
assert.match(
  probeBridge,
  /PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY/,
);

for (const name of [
  "controlled-host-activation-transition-authorization-grant-issuance-commit-boundary.ts",
  "controlled-host-activation-transition-authorization-grant-issuance-commit-boundary-contract.ts",
  "feed-host-activation-transition-authorization-grant-issuance-commit-boundary-identity.ts",
  "feed-host-activation-transition-authorization-grant-issuance-commit-boundary-prepared.ts",
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
  assert.equal(issuanceProof.overallVerdict, "READY_FOR_PHASE_3B_3_24");
  assert.equal(issuanceProof.hostActivation, false);
  assert.equal(issuanceProof.canStartActivation, false);
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary
      .issuanceCommitBoundaryResult,
    "authorization-grant-issuance-commit-boundary-ready-not-entered",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary
      .grantIssued,
    false,
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary
      .grantAuthorityAvailable,
    false,
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary
      .currentState,
    "COMMIT_READY",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary
      .selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceCommitBoundary
      .activationBlocker,
    PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  );
  assert.equal(issuanceProof.mountUnmount.mountCount, 1);
  assert.equal(issuanceProof.mountUnmount.unmountCount, 0);
  assert.equal(issuanceProof.activationAttempt.blocked, true);
  assert.ok(
    issuanceProof.activationAttempt.blockers.includes(
      PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
    ),
  );
  assert.equal(
    (issuanceProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared =
    validateFeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryPreparedContract(
      JSON.parse(readFileSync(issuancePreparedPath, "utf8")),
    );
  assert.equal(prepared.nextEligibleStep, "3B.3.23");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.grantIssued, false);
  assert.equal(prepared.issuanceCommitBoundaryExecuted, false);
  assert.equal(prepared.issuanceCommitBoundaryReady, true);
  assert.equal(prepared.issuanceCommitBoundaryExecutable, false);
  assert.equal(prepared.wouldEnterIssuanceCommitBoundary, true);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-transition-authorization-grant-issuance-commit-boundary: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-transition-authorization-grant-issuance-commit-boundary: ok (pre-proof contracts)",
);
