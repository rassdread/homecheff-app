/**
 * Phase 3B.3.12 static validator — activation commit protocol contract /
 * integrity / diagnostics / metadata / activation / commit / ownership /
 * renderer / writer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationCommitProtocolDescriptor,
  createControlledHostActivationCommitProtocolContract,
  evaluateControlledHostActivationCommitProtocol,
  createFeedHostActivationCommitProtocolIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES,
  CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE,
  CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationCommitProtocolPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-commit-protocol.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-commit-protocol-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-commit-protocol-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-commit-protocol-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-commit-protocol-phase3b312.mjs");
mustExist(
  "scripts/run-feed-host-activation-commit-protocol-proof-phase3b312.mjs",
);
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-12-feed-host-activation-commit-protocol.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b311/phase3b3-11-feed-host-activation-commit-readiness-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b312/phase3b3-12-feed-host-activation-commit-protocol-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b312/phase3b3-12-feed-host-activation-commit-protocol-prepared.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.13");
assert.ok(
  host.activationBlockers.includes(
    PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  ),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.containsRuntimeObjects, false);

const descriptor = createControlledHostActivationCommitProtocolDescriptor();
assert.equal(descriptor.protocolResult, "protocol-complete-not-executable");
assert.equal(descriptor.protocolExecuted, false);
assert.equal(descriptor.wouldCommit, true);
assert.equal(descriptor.commitReady, true);
assert.equal(descriptor.commitBlocked, true);
assert.equal(descriptor.transactionCommitted, false);
assert.equal(descriptor.canStartActivation, false);
assert.equal(descriptor.activationState, "dormant");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
);
assert.deepEqual(
  [...descriptor.protocolStages],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES],
);
assert.deepEqual(
  [...descriptor.commitSequence],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE],
);
assert.deepEqual(
  [...descriptor.commitGuards],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS],
);
assert.deepEqual(
  [...descriptor.ownershipChecks],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS],
);
assert.deepEqual(
  [...descriptor.rendererChecks],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS],
);
assert.deepEqual(
  [...descriptor.writerChecks],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS],
);
assert.deepEqual(
  [...descriptor.protocolInputSources],
  [...CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_INPUT_SOURCES],
);
assert.equal(descriptor.invariants.length, 20);

const evaluation = evaluateControlledHostActivationCommitProtocol(registry);
assert.equal(evaluation.diagnostics.protocolCompleted, true);
assert.equal(
  evaluation.diagnostics.protocolResult,
  "protocol-complete-not-executable",
);
assert.equal(evaluation.diagnostics.protocolExecuted, false);
assert.equal(evaluation.diagnostics.commitReady, true);
assert.equal(evaluation.diagnostics.wouldCommit, true);
assert.equal(evaluation.diagnostics.commitBlocked, true);
assert.equal(evaluation.diagnostics.activationBlocked, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.12");
assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.13");

const protocolContract = createControlledHostActivationCommitProtocolContract();
assert.equal(
  protocolContract.protocolResult,
  "protocol-complete-not-executable",
);
assert.equal(protocolContract.protocolExecuted, false);
assert.equal(protocolContract.commitAllowed, false);
assert.equal(protocolContract.protocolExecutionAllowed, false);
assert.equal(protocolContract.executorAllowed, false);
assert.equal(protocolContract.schedulerAllowed, false);

const identity = createFeedHostActivationCommitProtocolIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.protocolExecutionViaCommitProtocolAllowed, false);
assert.equal(identity.commitViaCommitProtocolAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.commitProtocolResult, "protocol-complete-not-executable");
assert.equal(plan.protocolExecuted, false);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.13-controlled-host-activation-candidate",
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
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(
  gate.blockers.includes(PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY),
);
assert.equal(gate.currentStep, "3B.3.12");
assert.equal(gate.eligibleStep, "3B.3.13");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.commitProtocolResult,
  "protocol-complete-not-executable",
);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.protocolExecuted, false);
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
assert.match(probeBridge, /version:\s*13/);
assert.match(probeBridge, /readHostActivationCommitProtocol/);
assert.match(probeBridge, /PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY/);

for (const name of [
  "controlled-host-activation-commit-protocol.ts",
  "controlled-host-activation-commit-protocol-contract.ts",
  "feed-host-activation-commit-protocol-identity.ts",
  "feed-host-activation-commit-protocol-prepared.ts",
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

const readinessProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b311/phase3b3-11-feed-host-activation-commit-readiness-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(readinessProof.overallVerdict, "READY_FOR_PHASE_3B_3_12");

const protocolProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b312/phase3b3-12-feed-host-activation-commit-protocol-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(protocolProof.overallVerdict, "READY_FOR_PHASE_3B_3_13");
assert.equal(protocolProof.hostActivation, false);
assert.equal(protocolProof.canStartActivation, false);
assert.equal(
  protocolProof.hostActivationCommitProtocol.protocolResult,
  "protocol-complete-not-executable",
);
assert.equal(
  protocolProof.hostActivationCommitProtocol.protocolExecuted,
  false,
);
assert.ok(protocolProof.hostActivationCommitProtocol.protocolStages.length > 0);
assert.ok(protocolProof.hostActivationCommitProtocol.commitSequence.length > 0);
assert.ok(protocolProof.hostActivationCommitProtocol.commitGuards.length > 0);
assert.equal(
  protocolProof.hostActivationCommitProtocol.activationBlocker,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
);
assert.equal(protocolProof.mountUnmount.mountCount, 1);
assert.equal(protocolProof.mountUnmount.unmountCount, 0);
assert.equal(protocolProof.activationAttempt.blocked, true);
assert.ok(
  protocolProof.activationAttempt.blockers.includes(
    PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  ),
);
assert.equal(
  (protocolProof.invariants || []).filter(
    (i: { status: string }) => i.status === "PASS",
  ).length,
  20,
);

const prepared = validateFeedHostActivationCommitProtocolPreparedContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b312/phase3b3-12-feed-host-activation-commit-protocol-prepared.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(prepared.nextEligibleStep, "3B.3.13");
assert.equal(prepared.protocolResult, "protocol-complete-not-executable");
assert.equal(prepared.protocolExecuted, false);
assert.equal(prepared.canStartActivation, false);

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log("validate-adaptive-workspace-feed-activation-commit-protocol: ok");
