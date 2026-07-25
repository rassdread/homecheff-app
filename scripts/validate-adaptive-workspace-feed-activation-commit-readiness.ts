/**
 * Phase 3B.3.11 static validator — activation commit readiness contract /
 * integrity / diagnostics / metadata / activation / commit / ownership /
 * renderer / writer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationCommitReadinessDescriptor,
  createControlledHostActivationCommitReadinessContract,
  evaluateControlledHostActivationCommitReadiness,
  createFeedHostActivationCommitReadinessIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationCommitReadinessPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-commit-readiness.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-commit-readiness-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-commit-readiness-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-commit-readiness-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-commit-readiness-phase3b311.mjs");
mustExist(
  "scripts/run-feed-host-activation-commit-readiness-proof-phase3b311.mjs",
);
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-11-feed-host-activation-commit-readiness.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b310/phase3b3-10-feed-host-activation-transaction-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b311/phase3b3-11-feed-host-activation-commit-readiness-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b311/phase3b3-11-feed-host-activation-commit-readiness-prepared.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.15");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.containsRuntimeObjects, false);

const descriptor = createControlledHostActivationCommitReadinessDescriptor();
assert.equal(descriptor.readinessResult, "commit-ready-not-executable");
assert.equal(descriptor.wouldCommit, true);
assert.equal(descriptor.commitReady, true);
assert.equal(descriptor.commitBlocked, true);
assert.equal(descriptor.transactionCommitted, false);
assert.equal(descriptor.commitExecuted, false);
assert.equal(descriptor.ownershipTransferred, false);
assert.equal(descriptor.writerTransferred, false);
assert.equal(descriptor.rendererTransferred, false);
assert.equal(descriptor.decisionResult, "ALLOW");
assert.equal(descriptor.planResult, "plan-complete-not-executable");
assert.equal(descriptor.pipelineResult, "pipeline-complete-not-executable");
assert.equal(descriptor.transactionResult, "transaction-complete-not-committed");
assert.equal(descriptor.wouldActivate, true);
assert.equal(descriptor.canStartActivation, false);
assert.equal(descriptor.activationState, "dormant");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
);
assert.deepEqual(
  [...descriptor.commitPreconditions],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS],
);
assert.deepEqual(
  [...descriptor.commitValidationPoints],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS],
);
assert.deepEqual(
  [...descriptor.commitAbortConditions],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS],
);
assert.deepEqual(
  [...descriptor.readinessInputSources],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_INPUT_SOURCES],
);
assert.equal(descriptor.invariants.length, 20);

const evaluation = evaluateControlledHostActivationCommitReadiness(registry);
assert.equal(evaluation.diagnostics.readinessCompleted, true);
assert.equal(
  evaluation.diagnostics.readinessResult,
  "commit-ready-not-executable",
);
assert.equal(evaluation.diagnostics.commitReady, true);
assert.equal(evaluation.diagnostics.wouldCommit, true);
assert.equal(evaluation.diagnostics.commitBlocked, true);
assert.equal(evaluation.diagnostics.transactionCommitted, false);
assert.equal(evaluation.diagnostics.activationBlocked, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.11");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.12");

const readinessContract =
  createControlledHostActivationCommitReadinessContract();
assert.equal(
  readinessContract.readinessResult,
  "commit-ready-not-executable",
);
assert.equal(readinessContract.commitReady, true);
assert.equal(readinessContract.commitAllowed, false);
assert.equal(readinessContract.ownershipTransferAllowed, false);
assert.equal(readinessContract.writerTransferAllowed, false);
assert.equal(readinessContract.rendererTransferAllowed, false);
assert.equal(readinessContract.executorAllowed, false);
assert.equal(readinessContract.schedulerAllowed, false);
assert.equal(readinessContract.runtimeMutationAllowed, false);

const identity = createFeedHostActivationCommitReadinessIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.activationViaCommitReadinessAllowed, false);
assert.equal(identity.commitViaCommitReadinessAllowed, false);
assert.equal(identity.ownershipTransferViaCommitReadinessAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.commitReadinessResult, "commit-ready-not-executable");
assert.equal(plan.commitReady, true);
assert.equal(plan.transactionCommitted, false);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.15-controlled-host-activation-candidate",
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
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(
  gate.blockers.includes(PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY),
);
assert.equal(gate.currentStep, "3B.3.14");
assert.equal(gate.eligibleStep, "3B.3.15");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.commitReadinessResult,
  "commit-ready-not-executable",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.commitReady, true);
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
assert.match(probeBridge, /version:\s*15/);
assert.match(probeBridge, /readHostActivationCommitReadiness/);
assert.match(probeBridge, /PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY/);
assert.match(probeBridge, /PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY/);
assert.match(probeBridge, /PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY/);

for (const name of [
  "controlled-host-activation-commit-readiness.ts",
  "controlled-host-activation-commit-readiness-contract.ts",
  "feed-host-activation-commit-readiness-identity.ts",
  "feed-host-activation-commit-readiness-prepared.ts",
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

const commitReadinessProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b311/phase3b3-11-feed-host-activation-commit-readiness-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(commitReadinessProof.overallVerdict, "READY_FOR_PHASE_3B_3_12");
assert.equal(commitReadinessProof.hostActivation, false);
assert.equal(commitReadinessProof.canStartActivation, false);
assert.equal(
  commitReadinessProof.hostActivationCommitReadiness.readinessResult,
  "commit-ready-not-executable",
);
assert.equal(
  commitReadinessProof.hostActivationCommitReadiness.commitReady,
  true,
);
assert.equal(
  commitReadinessProof.hostActivationCommitReadiness.wouldCommit,
  true,
);
assert.equal(
  commitReadinessProof.hostActivationCommitReadiness.transactionCommitted,
  false,
);
assert.equal(
  commitReadinessProof.hostActivationCommitReadiness.ownershipTransferred,
  false,
);
assert.equal(
  commitReadinessProof.hostActivationCommitReadiness.activationBlocker,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
);
assert.equal(commitReadinessProof.mountUnmount.mountCount, 1);
assert.equal(commitReadinessProof.mountUnmount.unmountCount, 0);
assert.equal(commitReadinessProof.activationAttempt.blocked, true);
assert.ok(
  commitReadinessProof.activationAttempt.blockers.includes(
    PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  ),
);
assert.equal(
  (commitReadinessProof.invariants || []).filter(
    (i: { status: string }) => i.status === "PASS",
  ).length,
  20,
);

const prepared = validateFeedHostActivationCommitReadinessPreparedContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b311/phase3b3-11-feed-host-activation-commit-readiness-prepared.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(prepared.nextEligibleStep, "3B.3.12");
assert.equal(prepared.readinessResult, "commit-ready-not-executable");
assert.equal(prepared.commitReady, true);
assert.equal(prepared.transactionCommitted, false);
assert.equal(prepared.canStartActivation, false);

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log("validate-adaptive-workspace-feed-activation-commit-readiness: ok");
