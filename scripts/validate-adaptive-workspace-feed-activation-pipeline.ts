/**
 * Phase 3B.3.9 static validator — activation pipeline contract / integrity /
 * diagnostics / metadata / activation / ownership / renderer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationPipelineDescriptor,
  createControlledHostActivationPipelineContract,
  evaluateControlledHostActivationPipeline,
  createFeedHostActivationPipelineIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationPipelinePreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/sealed/controlled-host-activation-pipeline.ts");
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-pipeline-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-pipeline-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-pipeline-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-pipeline-phase3b39.mjs");
mustExist("scripts/run-feed-host-activation-pipeline-proof-phase3b39.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-9-feed-host-activation-pipeline.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b38/phase3b3-8-feed-host-activation-plan-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b39/phase3b3-9-feed-host-activation-pipeline-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b39/phase3b3-9-feed-host-activation-pipeline-prepared.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.15");
assert.ok(
  host.activationBlockers.includes(PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.containsRuntimeObjects, false);

const descriptor = createControlledHostActivationPipelineDescriptor();
assert.equal(descriptor.pipelineResult, "pipeline-complete-not-executable");
assert.equal(descriptor.decisionResult, "ALLOW");
assert.equal(descriptor.planResult, "plan-complete-not-executable");
assert.equal(descriptor.wouldActivate, true);
assert.equal(descriptor.canStartActivation, false);
assert.equal(descriptor.activationState, "dormant");
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
);
assert.deepEqual(
  [...descriptor.pipelineStages],
  [...CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES],
);
assert.deepEqual(
  [...descriptor.stageDependencies],
  [...CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGE_DEPENDENCIES],
);
assert.deepEqual(
  [...descriptor.pipelineInputSources],
  [...CONTROLLED_HOST_ACTIVATION_PIPELINE_INPUT_SOURCES],
);
assert.equal(descriptor.invariants.length, 20);

const evaluation = evaluateControlledHostActivationPipeline(registry);
assert.equal(evaluation.diagnostics.pipelineCompleted, true);
assert.equal(
  evaluation.diagnostics.pipelineResult,
  "pipeline-complete-not-executable",
);
assert.equal(evaluation.diagnostics.decisionResult, "ALLOW");
assert.equal(evaluation.diagnostics.planResult, "plan-complete-not-executable");
assert.equal(evaluation.diagnostics.wouldActivate, true);
assert.equal(evaluation.diagnostics.activationBlocked, true);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.9");
assert.equal(
  evaluation.diagnostics.stageCount,
  CONTROLLED_HOST_ACTIVATION_PIPELINE_STAGES.length,
);

const pipelineContract = createControlledHostActivationPipelineContract();
assert.equal(
  pipelineContract.pipelineResult,
  "pipeline-complete-not-executable",
);
assert.equal(pipelineContract.executorAllowed, false);
assert.equal(pipelineContract.schedulerAllowed, false);
assert.equal(pipelineContract.stageExecutionAllowed, false);
assert.equal(pipelineContract.runtimeMutationAllowed, false);

const identity = createFeedHostActivationPipelineIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.activationViaPipelineAllowed, false);
assert.equal(identity.stageExecutionViaPipelineAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.pipelineResult, "pipeline-complete-not-executable");
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
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY));
assert.equal(gate.currentStep, "3B.3.14");
assert.equal(gate.eligibleStep, "3B.3.15");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.pipelineResult,
  "pipeline-complete-not-executable",
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
assert.match(probeBridge, /version:\s*15/);
assert.match(probeBridge, /readHostActivationPipeline/);
assert.match(probeBridge, /PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY/);
assert.match(probeBridge, /PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY/);
assert.match(probeBridge, /PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY/);
assert.match(probeBridge, /PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY/);

for (const name of [
  "controlled-host-activation-pipeline.ts",
  "controlled-host-activation-pipeline-contract.ts",
  "feed-host-activation-pipeline-identity.ts",
  "feed-host-activation-pipeline-prepared.ts",
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
assert.equal(pipelineProof.hostActivation, false);
assert.equal(pipelineProof.canStartActivation, false);
assert.equal(
  pipelineProof.hostActivationPipeline.pipelineResult,
  "pipeline-complete-not-executable",
);
assert.equal(pipelineProof.hostActivationPipeline.wouldActivate, true);
assert.ok(pipelineProof.hostActivationPipeline.pipelineStages.length > 0);
assert.equal(
  pipelineProof.hostActivationPipeline.activationBlocker,
  PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
);
assert.equal(pipelineProof.mountUnmount.mountCount, 1);
assert.equal(pipelineProof.mountUnmount.unmountCount, 0);
assert.equal(pipelineProof.activationAttempt.blocked, true);
assert.ok(
  pipelineProof.activationAttempt.blockers.includes(
    PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY,
  ),
);
assert.equal(
  (pipelineProof.invariants || []).filter(
    (i: { status: string }) => i.status === "PASS",
  ).length,
  20,
);

const prepared = validateFeedHostActivationPipelinePreparedContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b39/phase3b3-9-feed-host-activation-pipeline-prepared.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(prepared.nextEligibleStep, "3B.3.10");
assert.equal(prepared.pipelineResult, "pipeline-complete-not-executable");
assert.equal(prepared.canStartActivation, false);

const feedQuery = readFileSync(
  join(root, "lib/feed/feed-query-params.ts"),
  "utf8",
);
assert.doesNotMatch(feedQuery, /hostActivation|adaptive-workspace-host/);

console.log("validate-adaptive-workspace-feed-activation-pipeline: ok");
