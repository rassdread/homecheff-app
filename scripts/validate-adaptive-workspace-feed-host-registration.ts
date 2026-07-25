/**
 * Phase 3B.3.3 static validator — host registration / registry / identity / activation.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledHostRegistry,
  createControlledHostRegistrationContract,
  createFeedHostRegistrationIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_3_HOST_REGISTRATION_ONLY,
  PHASE_3B3_4_HOST_ELIGIBILITY_ONLY,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedHostRegistrationReadinessContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/sealed/controlled-host-registry.ts");
mustExist("lib/adaptive-workspace/sealed/controlled-host-registration-contract.ts");
mustExist("lib/adaptive-workspace/sealed/feed-host-registration-identity.ts");
mustExist("lib/adaptive-workspace/sealed/feed-host-registration-readiness.ts");
mustExist("scripts/probe-feed-host-registration-phase3b33.mjs");
mustExist("scripts/run-feed-host-registration-proof-phase3b33.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-3-feed-host-registration.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b32/phase3b3-2-feed-shadow-placement-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b33/phase3b3-3-feed-host-registration-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b33/phase3b3-3-feed-host-registration-readiness.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.13");
assert.ok(host.activationBlockers.includes(PHASE_3B3_3_HOST_REGISTRATION_ONLY));
assert.ok(host.activationBlockers.includes(PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY));

const registry = createControlledHostRegistry();
assert.equal(registry.hostCount, 1);
assert.equal(registry.hosts[0].runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
assert.equal(registry.hosts[0].registrationState, "registered");
assert.equal(registry.containsRuntimeObjects, false);
assert.equal(registry.containsReactInstances, false);

const registration = createControlledHostRegistrationContract();
assert.equal(registration.registrationState, "registered");
assert.equal(registration.hostActivation, false);
assert.equal(
  registration.activationRestriction,
  PHASE_3B3_3_HOST_REGISTRATION_ONLY,
);

const identity = createFeedHostRegistrationIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.runtimeIdTransitionAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.registrationState, "registered");
assert.equal(plan.eligibilityState, "eligible");
assert.equal(
  plan.recommendedNextStep,
  "3B.3.13-controlled-host-activation-candidate",
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
});
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY));
assert.equal(gate.currentStep, "3B.3.12");
assert.equal(gate.eligibleStep, "3B.3.13");

assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.rendererRegistered, false);
assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.registrationState,
  "registered",
);

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
assert.match(probeBridge, /version:\s*13/);
assert.match(probeBridge, /readHostRegistry/);
assert.match(probeBridge, /PHASE_3B3_3_HOST_REGISTRATION_ONLY/);
assert.match(probeBridge, /PHASE_3B3_4_HOST_ELIGIBILITY_ONLY/);
assert.match(probeBridge, /readHostEligibility/);

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

const shadowProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b32/phase3b3-2-feed-shadow-placement-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(shadowProof.overallVerdict, "READY_FOR_PHASE_3B_3_3");

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
assert.equal(regProof.hostActivation, false);
assert.equal(regProof.hostRegistry.hostCount, 1);
assert.equal(regProof.hostRegistry.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
assert.equal(regProof.mountUnmount.mountCount, 1);
assert.equal(regProof.mountUnmount.unmountCount, 0);
assert.equal(regProof.activationAttempt.blocked, true);
assert.ok(
  regProof.activationAttempt.blockers.includes(PHASE_3B3_3_HOST_REGISTRATION_ONLY),
);
assert.equal(
  (regProof.invariants || []).filter((i: { status: string }) => i.status === "PASS")
    .length,
  20,
);

const readiness = validateFeedHostRegistrationReadinessContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b33/phase3b3-3-feed-host-registration-readiness.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(readiness.nextEligibleStep, "3B.3.4");
assert.equal(readiness.hostActivation, false);

const queryParams = readFileSync(join(root, "lib/feed/feed-query-params.ts"), "utf8");
assert.doesNotMatch(
  queryParams,
  /adaptive-workspace|hostActivation|AvailableSpace|feed\.discovery/,
);

console.log("validate-adaptive-workspace-feed-host-registration: ok");
