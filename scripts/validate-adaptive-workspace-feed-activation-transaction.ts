/**
 * Phase 3B.3.10 static validator — activation transaction contract / integrity /
 * diagnostics / metadata / activation / commit / rollback / ownership / renderer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationTransactionDescriptor,
  createControlledHostActivationTransactionContract,
  evaluateControlledHostActivationTransaction,
  createFeedHostActivationTransactionIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationTransactionPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/sealed/controlled-host-activation-transaction.ts");
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-transaction-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transaction-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-transaction-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-transaction-phase3b310.mjs");
mustExist("scripts/run-feed-host-activation-transaction-proof-phase3b310.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-10-feed-host-activation-transaction.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b39/phase3b3-9-feed-host-activation-pipeline-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b310/phase3b3-10-feed-host-activation-transaction-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b310/phase3b3-10-feed-host-activation-transaction-prepared.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.23");
assert.ok(
  host.activationBlockers.includes(PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.containsRuntimeObjects, false);

const descriptor = createControlledHostActivationTransactionDescriptor();
assert.equal(descriptor.transactionResult, "transaction-complete-not-committed");
assert.equal(descriptor.wouldCommit, true);
assert.equal(descriptor.transactionCommitted, false);
assert.equal(descriptor.beginState, "legacy-dormant-single-mount");
assert.equal(
  descriptor.intendedEndState,
  "controlled-host-active-same-instance-no-remount",
);
assert.equal(descriptor.decisionResult, "ALLOW");
assert.equal(descriptor.planResult, "plan-complete-not-executable");
assert.equal(descriptor.pipelineResult, "pipeline-complete-not-executable");
assert.equal(descriptor.wouldActivate, true);
assert.equal(descriptor.canStartActivation, false);
assert.equal(descriptor.activationState, "dormant");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
);
assert.deepEqual(
  [...descriptor.commitConditions],
  [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.rollbackConditions],
  [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.transactionCheckpoints],
  [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS],
);
assert.deepEqual(
  [...descriptor.compensatingActions],
  [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS],
);
assert.deepEqual(
  [...descriptor.abortConditions],
  [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.transactionInputSources],
  [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES],
);
assert.equal(descriptor.invariants.length, 20);

const evaluation = evaluateControlledHostActivationTransaction(registry);
assert.equal(evaluation.diagnostics.transactionCompleted, true);
assert.equal(
  evaluation.diagnostics.transactionResult,
  "transaction-complete-not-committed",
);
assert.equal(evaluation.diagnostics.wouldCommit, true);
assert.equal(evaluation.diagnostics.transactionCommitted, false);
assert.equal(evaluation.diagnostics.commitBlocked, true);
assert.equal(evaluation.diagnostics.rollbackExecutionBlocked, true);
assert.equal(evaluation.diagnostics.activationBlocked, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.10");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.11");

const transactionContract = createControlledHostActivationTransactionContract();
assert.equal(
  transactionContract.transactionResult,
  "transaction-complete-not-committed",
);
assert.equal(transactionContract.wouldCommit, true);
assert.equal(transactionContract.transactionCommitted, false);
assert.equal(transactionContract.executorAllowed, false);
assert.equal(transactionContract.schedulerAllowed, false);
assert.equal(transactionContract.commitAllowed, false);
assert.equal(transactionContract.rollbackExecutionAllowed, false);
assert.equal(transactionContract.runtimeMutationAllowed, false);

const identity = createFeedHostActivationTransactionIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.activationViaTransactionAllowed, false);
assert.equal(identity.commitViaTransactionAllowed, false);
assert.equal(identity.rollbackExecutionViaTransactionAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.transactionResult, "transaction-complete-not-committed");
assert.equal(plan.wouldCommit, true);
assert.equal(plan.transactionCommitted, false);
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
assert.ok(gate.blockers.includes(PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY));
assert.equal(gate.currentStep, "3B.3.22");
assert.equal(gate.eligibleStep, "3B.3.23");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transactionResult,
  "transaction-complete-not-committed",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.wouldCommit, true);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transactionCommitted, false);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);

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
assert.match(probeBridge, /readHostActivationTransaction/);
assert.match(probeBridge, /PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY/);
assert.match(probeBridge, /PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY/);
assert.match(probeBridge, /PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY/);

for (const name of [
  "controlled-host-activation-transaction.ts",
  "controlled-host-activation-transaction-contract.ts",
  "feed-host-activation-transaction-identity.ts",
  "feed-host-activation-transaction-prepared.ts",
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

const pipelineProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b39/phase3b3-9-feed-host-activation-pipeline-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(pipelineProof.overallVerdict, "READY_FOR_PHASE_3B_3_10");

const transactionProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b310/phase3b3-10-feed-host-activation-transaction-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(transactionProof.overallVerdict, "READY_FOR_PHASE_3B_3_11");
assert.equal(transactionProof.hostActivation, false);
assert.equal(transactionProof.canStartActivation, false);
assert.equal(
  transactionProof.hostActivationTransaction.transactionResult,
  "transaction-complete-not-committed",
);
assert.equal(transactionProof.hostActivationTransaction.wouldCommit, true);
assert.equal(
  transactionProof.hostActivationTransaction.transactionCommitted,
  false,
);
assert.ok(transactionProof.hostActivationTransaction.commitConditions.length > 0);
assert.ok(
  transactionProof.hostActivationTransaction.rollbackConditions.length > 0,
);
assert.equal(
  transactionProof.hostActivationTransaction.activationBlocker,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
);
assert.equal(transactionProof.mountUnmount.mountCount, 1);
assert.equal(transactionProof.mountUnmount.unmountCount, 0);
assert.equal(transactionProof.activationAttempt.blocked, true);
assert.ok(
  transactionProof.activationAttempt.blockers.includes(
    PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  ),
);
assert.equal(
  (transactionProof.invariants || []).filter(
    (i: { status: string }) => i.status === "PASS",
  ).length,
  20,
);

const prepared = validateFeedHostActivationTransactionPreparedContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b310/phase3b3-10-feed-host-activation-transaction-prepared.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(prepared.nextEligibleStep, "3B.3.11");
assert.equal(prepared.transactionResult, "transaction-complete-not-committed");
assert.equal(prepared.wouldCommit, true);
assert.equal(prepared.transactionCommitted, false);
assert.equal(prepared.canStartActivation, false);

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log("validate-adaptive-workspace-feed-activation-transaction: ok");
