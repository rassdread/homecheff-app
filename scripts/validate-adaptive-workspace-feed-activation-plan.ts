/**
 * Phase 3B.3.8 static validator — activation plan contract / integrity /
 * diagnostics / metadata / activation / ownership / renderer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationPlanDescriptor,
  createControlledHostActivationPlanContract,
  evaluateControlledHostActivationPlan,
  createFeedHostActivationPlanIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_PLAN_STEPS,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationPlanPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/sealed/controlled-host-activation-plan.ts");
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-plan-contract.ts",
);
mustExist("lib/adaptive-workspace/sealed/feed-host-activation-plan-identity.ts");
mustExist("lib/adaptive-workspace/sealed/feed-host-activation-plan-prepared.ts");
mustExist("scripts/probe-feed-host-activation-plan-phase3b38.mjs");
mustExist("scripts/run-feed-host-activation-plan-proof-phase3b38.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-8-feed-host-activation-plan.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b37/phase3b3-7-feed-host-activation-decision-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b38/phase3b3-8-feed-host-activation-plan-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b38/phase3b3-8-feed-host-activation-plan-prepared.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.25");
assert.ok(
  host.activationBlockers.includes(PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.containsRuntimeObjects, false);

const descriptor = createControlledHostActivationPlanDescriptor();
assert.equal(descriptor.planResult, "plan-complete-not-executable");
assert.equal(descriptor.decisionResult, "ALLOW");
assert.equal(descriptor.wouldActivate, true);
assert.equal(descriptor.canStartActivation, false);
assert.equal(descriptor.activationState, "dormant");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY,
);
assert.deepEqual(
  [...descriptor.plannedSteps],
  [...CONTROLLED_HOST_ACTIVATION_PLAN_STEPS],
);
assert.deepEqual(
  [...descriptor.planInputSources],
  [...CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES],
);
assert.equal(descriptor.invariants.length, 20);
assert.ok(descriptor.preconditions.length > 0);
assert.ok(descriptor.validationPoints.length > 0);
assert.ok(descriptor.rollbackCheckpoints.length > 0);
assert.ok(descriptor.abortConditions.length > 0);

const evaluation = evaluateControlledHostActivationPlan(registry);
assert.equal(evaluation.diagnostics.planCompleted, true);
assert.equal(
  evaluation.diagnostics.planResult,
  "plan-complete-not-executable",
);
assert.equal(evaluation.diagnostics.decisionResult, "ALLOW");
assert.equal(evaluation.diagnostics.wouldActivate, true);
assert.equal(evaluation.diagnostics.activationBlocked, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.8");
assert.equal(
  evaluation.diagnostics.plannedStepCount,
  CONTROLLED_HOST_ACTIVATION_PLAN_STEPS.length,
);

const planContract = createControlledHostActivationPlanContract();
assert.equal(planContract.planResult, "plan-complete-not-executable");
assert.equal(planContract.executorAllowed, false);
assert.equal(planContract.schedulerAllowed, false);
assert.equal(planContract.runtimeMutationAllowed, false);

const identity = createFeedHostActivationPlanIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.activationViaPlanAllowed, false);
assert.equal(identity.executorViaPlanAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.planResult, "plan-complete-not-executable");
assert.equal(plan.decisionResult, "ALLOW");
assert.equal(
  plan.recommendedNextStep,
  "3B.3.25-controlled-workspace-host-candidate-selection",
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
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY));
assert.equal(gate.currentStep, "3B.3.24");
assert.equal(gate.eligibleStep, "3B.3.25");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.planResult,
  "plan-complete-not-executable",
);
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
assert.match(probeBridge, /version: 25/);
assert.match(probeBridge, /readHostActivationPlan/);
assert.match(probeBridge, /PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY/);
assert.match(probeBridge, /PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY/);

for (const name of [
  "controlled-host-activation-plan.ts",
  "controlled-host-activation-plan-contract.ts",
  "feed-host-activation-plan-identity.ts",
  "feed-host-activation-plan-prepared.ts",
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

const planProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b38/phase3b3-8-feed-host-activation-plan-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(planProof.overallVerdict, "READY_FOR_PHASE_3B_3_9");
assert.equal(planProof.hostActivation, false);
assert.equal(planProof.canStartActivation, false);
assert.equal(
  planProof.hostActivationPlan.planResult,
  "plan-complete-not-executable",
);
assert.equal(planProof.hostActivationPlan.wouldActivate, true);
assert.ok(planProof.hostActivationPlan.plannedSteps.length > 0);
assert.equal(
  planProof.hostActivationPlan.activationBlocker,
  PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY,
);
assert.equal(planProof.mountUnmount.mountCount, 1);
assert.equal(planProof.mountUnmount.unmountCount, 0);
assert.equal(planProof.activationAttempt.blocked, true);
assert.ok(
  planProof.activationAttempt.blockers.includes(
    PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY,
  ),
);
assert.equal(
  (planProof.invariants || []).filter(
    (i: { status: string }) => i.status === "PASS",
  ).length,
  20,
);

const prepared = validateFeedHostActivationPlanPreparedContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b38/phase3b3-8-feed-host-activation-plan-prepared.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(prepared.nextEligibleStep, "3B.3.9");
assert.equal(prepared.planResult, "plan-complete-not-executable");
assert.equal(prepared.canStartActivation, false);

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log("validate-adaptive-workspace-feed-activation-plan: ok");
