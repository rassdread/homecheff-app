/**
 * Phase 3B.3.4 static validator — eligibility contract / integrity / metadata /
 * activation safety / ownership safety / renderer safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostEligibilityDescriptor,
  createControlledHostEligibilityContract,
  evaluateControlledHostEligibility,
  createFeedHostEligibilityIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_4_HOST_ELIGIBILITY_ONLY,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostEligibilityReadinessContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/sealed/controlled-host-eligibility.ts");
mustExist(
  "lib/adaptive-workspace/sealed/controlled-host-eligibility-contract.ts",
);
mustExist("lib/adaptive-workspace/sealed/feed-host-eligibility-identity.ts");
mustExist("lib/adaptive-workspace/sealed/feed-host-eligibility-readiness.ts");
mustExist("scripts/probe-feed-host-eligibility-phase3b34.mjs");
mustExist("scripts/run-feed-host-eligibility-proof-phase3b34.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-4-feed-host-eligibility.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b33/phase3b3-3-feed-host-registration-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b34/phase3b3-4-feed-host-eligibility-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b34/phase3b3-4-feed-host-eligibility-readiness.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.17");
assert.ok(host.activationBlockers.includes(PHASE_3B3_4_HOST_ELIGIBILITY_ONLY));
assert.ok(host.activationBlockers.includes(PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY));

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.hosts[0].runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
assert.equal(registry.containsRuntimeObjects, false);
assert.equal(registry.containsReactInstances, false);

const descriptor = createControlledHostEligibilityDescriptor();
assert.equal(descriptor.eligibilityState, "eligible");
assert.equal(descriptor.canStartActivation, false);
assert.equal(descriptor.hostActivation, false);
assert.equal(descriptor.renderActivation, false);
assert.equal(descriptor.activationBlocker, PHASE_3B3_4_HOST_ELIGIBILITY_ONLY);
assert.equal(descriptor.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
assert.equal(descriptor.owner, "legacy");
assert.equal(descriptor.writer, "legacy");
assert.equal(descriptor.renderer, "legacy");
assert.equal(descriptor.rollbackState, "prepared-not-active");

const evaluation = evaluateControlledHostEligibility(registry);
assert.equal(evaluation.diagnostics.registryHostCount, 1);
assert.equal(evaluation.diagnostics.activationBlocked, true);
assert.equal(evaluation.diagnostics.runtimeIdStable, true);

const eligibilityContract = createControlledHostEligibilityContract();
assert.equal(eligibilityContract.eligibilityState, "eligible");
assert.equal(eligibilityContract.canStartActivation, false);
assert.equal(
  eligibilityContract.activationRestriction,
  PHASE_3B3_4_HOST_ELIGIBILITY_ONLY,
);

const identity = createFeedHostEligibilityIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.expectedUnmountCount, 0);
assert.equal(identity.activationViaEligibilityAllowed, false);
assert.equal(identity.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);

const plan = createControlledFeedHostPlan();
assert.equal(plan.eligibilityState, "eligible");
assert.equal(plan.registrationState, "registered");
assert.equal(
  plan.recommendedNextStep,
  "3B.3.17-controlled-host-activation-candidate",
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
  observedWriter: "legacy",
  observedRenderOwner: "legacy",
  observedMountCount: 1,
  observedRollbackTarget: "legacy",
  observedRegistrationState: "registered",
  observedEligibilityState: "eligible",
  observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
});
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY));
assert.equal(gate.currentStep, "3B.3.16");
assert.equal(gate.eligibleStep, "3B.3.17");

assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.eligibilityState,
  "eligible",
);
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
assert.match(probeBridge, /version:\s*17/);
assert.match(probeBridge, /readHostEligibility/);
assert.match(probeBridge, /PHASE_3B3_4_HOST_ELIGIBILITY_ONLY/);

const sealedDir = join(root, "lib/adaptive-workspace/sealed");
for (const name of [
  "controlled-host-eligibility.ts",
  "controlled-host-eligibility-contract.ts",
  "feed-host-eligibility-identity.ts",
  "feed-host-eligibility-readiness.ts",
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

const regProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b33/phase3b3-3-feed-host-registration-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(regProof.overallVerdict, "READY_FOR_PHASE_3B_3_4");

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
assert.equal(eligProof.hostActivation, false);
assert.equal(eligProof.renderActivation, false);
assert.equal(eligProof.activeWriter, "legacy");
assert.equal(eligProof.activeRenderOwner, "legacy");
assert.equal(eligProof.hostRegistry.hostCount, 1);
assert.equal(eligProof.hostRegistry.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
assert.equal(eligProof.hostEligibility.eligibilityState, "eligible");
assert.equal(eligProof.hostEligibility.canStartActivation, false);
assert.equal(
  eligProof.hostEligibility.activationBlocker,
  PHASE_3B3_4_HOST_ELIGIBILITY_ONLY,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
);
assert.equal(eligProof.mountUnmount.mountCount, 1);
assert.equal(eligProof.mountUnmount.unmountCount, 0);
assert.equal(eligProof.activationAttempt.blocked, true);
assert.ok(
  eligProof.activationAttempt.blockers.includes(PHASE_3B3_4_HOST_ELIGIBILITY_ONLY),
);
assert.equal(
  (eligProof.invariants || []).filter((i: { status: string }) => i.status === "PASS")
    .length,
  20,
);

const readiness = validateFeedHostEligibilityReadinessContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b34/phase3b3-4-feed-host-eligibility-readiness.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(readiness.nextEligibleStep, "3B.3.5");
assert.equal(readiness.hostActivation, false);
assert.equal(readiness.canStartActivation, false);

const queryParams = readFileSync(join(root, "lib/feed/feed-query-params.ts"), "utf8");
assert.doesNotMatch(
  queryParams,
  /adaptive-workspace|hostActivation|AvailableSpace|feed\.discovery/,
);

console.log("validate-adaptive-workspace-feed-eligibility: ok");
