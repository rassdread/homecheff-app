/**
 * Phase 3B.3.5 static validator — activation readiness contract / integrity /
 * diagnostics / metadata / activation safety / ownership / renderer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostActivationReadinessDescriptor,
  createControlledHostActivationReadinessContract,
  evaluateControlledHostActivationReadiness,
  createFeedHostActivationReadinessIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
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
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostActivationReadinessPreparedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-readiness.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-activation-readiness-contract.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-readiness-identity.ts",
);
mustExist(
  "lib/adaptive-workspace/sealed/feed-host-activation-readiness-prepared.ts",
);
mustExist("scripts/probe-feed-host-activation-readiness-phase3b35.mjs");
mustExist("scripts/run-feed-host-activation-readiness-proof-phase3b35.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-5-feed-host-activation-readiness.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b34/phase3b3-4-feed-host-eligibility-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b35/phase3b3-5-feed-host-activation-readiness-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b35/phase3b3-5-feed-host-activation-readiness-prepared.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.26");
assert.ok(
  host.activationBlockers.includes(PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY),
);

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.hosts[0].runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
assert.equal(registry.containsRuntimeObjects, false);
assert.equal(registry.containsReactInstances, false);

const descriptor = createControlledHostActivationReadinessDescriptor();
assert.equal(descriptor.readinessState, "ready");
assert.equal(descriptor.canStartActivation, false);
assert.equal(descriptor.hostActivation, false);
assert.equal(descriptor.renderActivation, false);
assert.equal(
  descriptor.activationBlocker,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
);
assert.equal(descriptor.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.writer, "legacy");
assert.equal(descriptor.renderer, "legacy");
assert.equal(descriptor.rollbackState, "prepared-not-active");
assert.ok(descriptor.readinessReasons.length >= 5);

const evaluation = evaluateControlledHostActivationReadiness(registry);
assert.equal(evaluation.diagnostics.registryHostCount, 1);
assert.equal(evaluation.diagnostics.readinessSatisfied, true);
assert.equal(evaluation.diagnostics.activationBlocked, true);
assert.equal(evaluation.diagnostics.canStartActivation, false);
assert.equal(evaluation.diagnostics.currentPhase, "3B.3.5");
assert.ok(evaluation.diagnostics.missingConditionsForActivation.length >= 1);

const readinessContract = createControlledHostActivationReadinessContract();
assert.equal(readinessContract.readinessState, "ready");
assert.equal(readinessContract.canStartActivation, false);
assert.equal(readinessContract.executorAllowed, false);
assert.equal(readinessContract.schedulerAllowed, false);
assert.equal(
  readinessContract.activationRestriction,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
);

const identity = createFeedHostActivationReadinessIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.expectedUnmountCount, 0);
assert.equal(identity.activationViaReadinessAllowed, false);
assert.equal(identity.canStartActivationAllowed, false);
assert.equal(identity.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);

const plan = createControlledFeedHostPlan();
assert.equal(plan.readinessState, "ready");
assert.equal(plan.eligibilityState, "eligible");
assert.equal(plan.canStartActivation, false);
assert.equal(
  plan.recommendedNextStep,
  "3B.3.26-controlled-workspace-host-activation-readiness",
);

const rollback = createFeedHostRollbackContract();
assert.equal(rollback.rollbackReadiness, "prepared-not-active");

const gate = evaluateFeedHostActivationGate({
  forceHostActivation: true,
  envHostActivation: true,
  queryHostActivation: true,
  cookieHostActivation: true,
  localStorageHostActivation: true,
  sessionStorageHostActivation: true,
  contextHostActivation: true,
  globalHostActivation: true,
  featureFlagHostActivation: true,
  debugOverrideHostActivation: true,
  phase3b2ProofValid: true,
  phase3b2FreezeValid: true,
  phase3b32ProofValid: true,
  phase3b33ProofValid: true,
  phase3b34ProofValid: true,
  phase3b35ProofValid: true,
  observedWriter: "legacy",
  observedRenderOwner: "legacy",
  observedMountCount: 1,
  observedRollbackTarget: "legacy",
  observedRegistrationState: "registered",
  observedEligibilityState: "eligible",
  observedReadinessState: "ready",
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY));
assert.equal(gate.currentStep, "3B.3.25");
assert.equal(gate.eligibleStep, "3B.3.26");

assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.readinessState, "ready");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.rendererRegistered, false);

const shell = readFileSync(
  join(root, "components/adaptive-workspace/FeedControlledHostShell.tsx"),
  "utf8",
);
assert.match(shell, /return null/);
assert.doesNotMatch(
  shell,
  /from\s+['"][^'"]*(GeoFeed|HomeGeoFeedDynamic|components\/feed)[^'"]*['"]/,
);

const home = readFileSync(join(root, "components/home/HomePageClient.tsx"), "utf8");
assert.equal((home.match(/<GeoFeed\b/g) ?? []).length, 1);
assert.ok(home.indexOf("<FeedControlledHostShell") > home.indexOf("</GeoFeed>"));

const probeBridge = readFileSync(
  join(root, "lib/feed/feed-sealed-probe-bridge.ts"),
  "utf8",
);
assert.match(probeBridge, /version: 25/);
assert.match(probeBridge, /readHostActivationReadiness/);
assert.match(probeBridge, /PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY/);

const sealedDir = join(root, "lib/adaptive-workspace/sealed");
for (const name of [
  "controlled-host-activation-readiness.ts",
  "controlled-host-activation-readiness-contract.ts",
  "feed-host-activation-readiness-identity.ts",
  "feed-host-activation-readiness-prepared.ts",
]) {
  const src = readFileSync(join(sealedDir, name), "utf8");
  assert.doesNotMatch(src, /GeoFeed|HomeGeoFeedDynamic/);
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

const eligProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b34/phase3b3-4-feed-host-eligibility-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(eligProof.overallVerdict, "READY_FOR_PHASE_3B_3_5");

const readyProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b35/phase3b3-5-feed-host-activation-readiness-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(readyProof.overallVerdict, "READY_FOR_PHASE_3B_3_6");
assert.equal(readyProof.hostActivation, false);
assert.equal(readyProof.renderActivation, false);
assert.equal(readyProof.canStartActivation, false);
assert.equal(readyProof.activeWriter, "legacy");
assert.equal(readyProof.activeRenderOwner, "legacy");
assert.equal(readyProof.hostRegistry.hostCount, 1);
assert.equal(
  readyProof.hostRegistry.runtimeId,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
);
assert.equal(readyProof.hostActivationReadiness.readinessState, "ready");
assert.equal(readyProof.hostActivationReadiness.canStartActivation, false);
assert.equal(
  readyProof.hostActivationReadiness.activationBlocker,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
);
assert.equal(
  readyProof.hostActivationReadiness.diagnostics.readinessSatisfied,
  true,
);
assert.equal(readyProof.mountUnmount.mountCount, 1);
assert.equal(readyProof.mountUnmount.unmountCount, 0);
assert.equal(readyProof.activationAttempt.blocked, true);
assert.ok(
  readyProof.activationAttempt.blockers.includes(
    PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  ),
);
assert.equal(
  (readyProof.invariants || []).filter(
    (i: { status: string }) => i.status === "PASS",
  ).length,
  20,
);

const prepared = validateFeedHostActivationReadinessPreparedContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b35/phase3b3-5-feed-host-activation-readiness-prepared.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(prepared.nextEligibleStep, "3B.3.6");
assert.equal(prepared.hostActivation, false);
assert.equal(prepared.canStartActivation, false);
assert.equal(prepared.executorAuthorized, false);

const queryParams = readFileSync(join(root, "lib/feed/feed-query-params.ts"), "utf8");
assert.doesNotMatch(
  queryParams,
  /adaptive-workspace|hostActivation|AvailableSpace|feed\.discovery/,
);

console.log("validate-adaptive-workspace-feed-activation-readiness: ok");
