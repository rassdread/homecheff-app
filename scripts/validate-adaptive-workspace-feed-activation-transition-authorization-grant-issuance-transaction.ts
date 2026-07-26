/**
 * Phase 3B.3.22 static validator — activation transition authorization grant
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
  createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor,
  createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionContract,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceTransaction,
  createFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_GUARDS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-grant-issuance-transaction.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transition-authorization-grant-issuance-transaction-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-grant-issuance-transaction-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transition-authorization-grant-issuance-transaction-prepared.ts",
);
mustExist(
  "scripts/probe-feed-host-activation-transition-authorization-grant-issuance-transaction-phase3b322.mjs",
);
mustExist(
  "scripts/run-feed-host-activation-transition-authorization-grant-issuance-transaction-proof-phase3b322.mjs",
);
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-22-feed-host-activation-transition-authorization-grant-issuance-transaction.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");

const priorIssuancePlanProofPath = join(
  root,
  "docs/audits/artifacts/phase3b321/phase3b3-21-feed-host-activation-transition-authorization-grant-issuance-pipeline-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b321/phase3b3-21-feed-host-activation-transition-authorization-grant-issuance-pipeline-proof.json",
);
const priorIssuancePlanProof = JSON.parse(
  readFileSync(priorIssuancePlanProofPath, "utf8"),
);
assert.equal(
  priorIssuancePlanProof.overallVerdict,
  "READY_FOR_PHASE_3B_3_22",
);

const issuanceProofPath = join(
  root,
  "docs/audits/artifacts/phase3b322/phase3b3-22-feed-host-activation-transition-authorization-grant-issuance-transaction-proof.json",
);
const issuancePreparedPath = join(
  root,
  "docs/audits/artifacts/phase3b322/phase3b3-22-feed-host-activation-transition-authorization-grant-issuance-transaction-prepared.json",
);
const artifactsPresent =
  existsSync(issuanceProofPath) && existsSync(issuancePreparedPath);
if (!artifactsPresent && process.env.REQUIRE_PHASE3B322_ARTIFACTS === "1") {
  assert.fail(
    "Phase 3B.3.22 proof/prepared artifacts required but missing",
  );
}

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.26");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);

const descriptor =
  createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor();
assert.equal(
  descriptor.issuanceTransactionResult,
  "authorization-grant-issuance-transaction-ready-not-opened",
);
assert.equal(descriptor.issuanceTransactionCompleted, true);
assert.equal(descriptor.issuanceTransactionReady, true);
assert.equal(descriptor.issuanceTransactionBlocked, true);
assert.equal(descriptor.issuanceTransactionExecutable, false);
assert.equal(descriptor.wouldOpenIssuanceTransaction, true);
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
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
);
assert.equal(
  descriptor.issuanceTransactionPolicy,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_POLICY,
);
assert.deepEqual(
  [...descriptor.issuanceTransactionConditions],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.satisfiedIssuanceTransactionConditions],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS],
);
assert.equal(descriptor.unsatisfiedIssuanceTransactionConditions.length, 0);
assert.deepEqual(
  [...descriptor.issuanceTransactionGuards],
  [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_GUARDS],
);
assert.equal(descriptor.unsatisfiedIssuanceTransactionGuards.length, 0);
assert.equal(
  descriptor.selectedTransition,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
);
assert.equal(
  new Set(descriptor.issuanceTransactionConditions).size,
  descriptor.issuanceTransactionConditions.length,
);
assert.equal(
  new Set(descriptor.issuanceTransactionGuards).size,
  descriptor.issuanceTransactionGuards.length,
);

const evaluation =
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceTransaction(
    registry,
  );
assert.equal(evaluation.diagnostics.issuanceTransactionCompleted, true);
assert.equal(evaluation.diagnostics.issuanceEligible, true);
assert.equal(evaluation.diagnostics.issuanceBlocked, true);
assert.equal(evaluation.diagnostics.wouldIssueGrant, true);
assert.equal(evaluation.diagnostics.grantIssued, false);
assert.equal(evaluation.diagnostics.issuanceImpossible, true);
assert.equal(evaluation.diagnostics.authorityImpossible, true);
assert.equal(evaluation.diagnostics.executionImpossible, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.22");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.23");
assert.equal(
  evaluation.diagnostics.conditionCount,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS.length,
);
assert.equal(
  evaluation.diagnostics.guardCount,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_GUARDS.length,
);

const issuanceContract =
  createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionContract();
assert.equal(
  issuanceContract.issuanceTransactionResult,
  "authorization-grant-issuance-transaction-ready-not-opened",
);
assert.equal(issuanceContract.grantCreationAllowed, false);
assert.equal(issuanceContract.grantIssuanceAllowed, false);
assert.equal(issuanceContract.grantMaterializationAllowed, false);
assert.equal(issuanceContract.authorizationGrantAllowed, false);
assert.equal(issuanceContract.commitAllowed, false);

const identity =
  createFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity();
assert.equal(identity.grantCreationViaIssuanceTransactionAllowed, false);
assert.equal(identity.grantIssuanceViaIssuanceTransactionAllowed, false);
assert.equal(identity.grantMaterializationViaIssuanceTransactionAllowed, false);
assert.equal(identity.grantAuthorityViaIssuanceTransactionAllowed, false);

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
  phase3b322ProofValid: true,
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
  observedTransitionAuthorizationGrantIssuanceTransactionState: "completed",
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
} as Parameters<typeof evaluateFeedHostActivationGate>[0]);
assert.equal(gate.allowed, false);
assert.equal(gate.currentStep, "3B.3.25");
assert.equal(gate.eligibleStep, "3B.3.26");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.26",
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
assert.match(probeBridge, /version: 25/);
assert.match(
  probeBridge,
  /readHostActivationTransitionAuthorizationGrantIssuanceTransaction/,
);
assert.match(
  probeBridge,
  /PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY/,
);

for (const name of [
  "controlled-host-activation-transition-authorization-grant-issuance-transaction.ts",
  "controlled-host-activation-transition-authorization-grant-issuance-transaction-contract.ts",
  "feed-host-activation-transition-authorization-grant-issuance-transaction-identity.ts",
  "feed-host-activation-transition-authorization-grant-issuance-transaction-prepared.ts",
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
  assert.equal(issuanceProof.overallVerdict, "READY_FOR_PHASE_3B_3_23");
  assert.equal(issuanceProof.hostActivation, false);
  assert.equal(issuanceProof.canStartActivation, false);
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceTransaction
      .issuanceTransactionResult,
    "authorization-grant-issuance-transaction-ready-not-opened",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceTransaction
      .grantIssued,
    false,
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceTransaction
      .grantAuthorityAvailable,
    false,
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceTransaction
      .currentState,
    "COMMIT_READY",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceTransaction
      .selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    issuanceProof.hostActivationTransitionAuthorizationGrantIssuanceTransaction
      .activationBlocker,
    PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  );
  assert.equal(issuanceProof.mountUnmount.mountCount, 1);
  assert.equal(issuanceProof.mountUnmount.unmountCount, 0);
  assert.equal(issuanceProof.activationAttempt.blocked, true);
  assert.ok(
    issuanceProof.activationAttempt.blockers.includes(
      PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
    ),
  );
  assert.equal(
    (issuanceProof.invariants || []).filter(
      (i: { status: string }) => i.status === "PASS",
    ).length,
    20,
  );

  const prepared =
    validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract(
      JSON.parse(readFileSync(issuancePreparedPath, "utf8")),
    );
  assert.equal(prepared.nextEligibleStep, "3B.3.23");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.grantIssued, false);
  assert.equal(prepared.issuanceTransactionExecuted, false);
  assert.equal(prepared.issuanceTransactionReady, true);
  assert.equal(prepared.issuanceTransactionExecutable, false);
  assert.equal(prepared.wouldOpenIssuanceTransaction, true);
}

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log(
  artifactsPresent
    ? "validate-adaptive-workspace-feed-activation-transition-authorization-grant-issuance-transaction: ok (with artifacts)"
    : "validate-adaptive-workspace-feed-activation-transition-authorization-grant-issuance-transaction: ok (pre-proof contracts)",
);
