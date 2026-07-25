/**
 * Phase 3B.3.7 static validator — activation decision contract / integrity /
 * diagnostics / metadata / activation / ownership / renderer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationDecisionDescriptor,
  createControlledHostActivationDecisionContract,
  evaluateControlledHostActivationDecision,
  createFeedHostActivationDecisionIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationDecisionPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/sealed/controlled-host-activation-decision.ts");
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-decision-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-decision-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-decision-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-decision-phase3b37.mjs");
mustExist("scripts/run-feed-host-activation-decision-proof-phase3b37.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-7-feed-host-activation-decision.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b36/phase3b3-6-feed-host-shadow-activation-simulation-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b37/phase3b3-7-feed-host-activation-decision-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b37/phase3b3-7-feed-host-activation-decision-prepared.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.19");
assert.ok(
  host.activationBlockers.includes(PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.containsRuntimeObjects, false);

const descriptor = createControlledHostActivationDecisionDescriptor();
assert.equal(descriptor.decisionResult, "ALLOW");
assert.equal(descriptor.wouldActivate, true);
assert.equal(descriptor.confidence, "high");
assert.equal(descriptor.canStartActivation, false);
assert.equal(descriptor.activationState, "dormant");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
);
assert.deepEqual(
  [...descriptor.decisionInputSources],
  [...CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES],
);

const evaluation = evaluateControlledHostActivationDecision(registry);
assert.equal(evaluation.diagnostics.decisionCompleted, true);
assert.equal(evaluation.diagnostics.decisionResult, "ALLOW");
assert.equal(evaluation.diagnostics.wouldActivate, true);
assert.equal(evaluation.diagnostics.activationBlocked, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.7");

const decisionContract = createControlledHostActivationDecisionContract();
assert.equal(decisionContract.decisionResult, "ALLOW");
assert.equal(decisionContract.executorAllowed, false);
assert.equal(decisionContract.runtimeMutationAllowed, false);

const identity = createFeedHostActivationDecisionIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.activationViaDecisionAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.decisionResult, "ALLOW");
assert.equal(plan.confidence, "high");
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
  observedWriter: "legacy",
  observedRenderOwner: "legacy",
  observedMountCount: 1,
  observedRollbackTarget: "legacy",
  observedRegistrationState: "registered",
  observedEligibilityState: "eligible",
  observedReadinessState: "ready",
  observedSimulationState: "completed",
  observedDecisionState: "completed",
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY));
assert.equal(gate.currentStep, "3B.3.18");
assert.equal(gate.eligibleStep, "3B.3.19");

assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.decisionResult, "ALLOW");
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
assert.match(probeBridge, /version:\s*19/);
assert.match(probeBridge, /readHostActivationDecision/);
assert.match(probeBridge, /PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY/);
assert.match(probeBridge, /PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY/);

for (const name of [
  "controlled-host-activation-decision.ts",
  "controlled-host-activation-decision-contract.ts",
  "feed-host-activation-decision-identity.ts",
  "feed-host-activation-decision-prepared.ts",
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

const simProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b36/phase3b3-6-feed-host-shadow-activation-simulation-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(simProof.overallVerdict, "READY_FOR_PHASE_3B_3_7");

const decisionProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b37/phase3b3-7-feed-host-activation-decision-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(decisionProof.overallVerdict, "READY_FOR_PHASE_3B_3_8");
assert.equal(decisionProof.hostActivation, false);
assert.equal(decisionProof.canStartActivation, false);
assert.equal(decisionProof.hostActivationDecision.decisionResult, "ALLOW");
assert.equal(decisionProof.hostActivationDecision.wouldActivate, true);
assert.equal(decisionProof.hostActivationDecision.confidence, "high");
assert.equal(
  decisionProof.hostActivationDecision.activationBlocker,
  PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
);
assert.equal(decisionProof.mountUnmount.mountCount, 1);
assert.equal(decisionProof.mountUnmount.unmountCount, 0);
assert.equal(decisionProof.activationAttempt.blocked, true);
assert.ok(
  decisionProof.activationAttempt.blockers.includes(
    PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
  ),
);
assert.equal(
  (decisionProof.invariants || []).filter(
    (i: { status: string }) => i.status === "PASS",
  ).length,
  20,
);

const prepared = validateFeedHostActivationDecisionPreparedContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b37/phase3b3-7-feed-host-activation-decision-prepared.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(prepared.nextEligibleStep, "3B.3.8");
assert.equal(prepared.decisionResult, "ALLOW");
assert.equal(prepared.canStartActivation, false);

assert.doesNotMatch(
  readFileSync(join(root, "lib/feed/feed-query-params.ts"), "utf8"),
  /adaptive-workspace|hostActivation|AvailableSpace|feed\.discovery/,
);

console.log("validate-adaptive-workspace-feed-activation-decision: ok");
