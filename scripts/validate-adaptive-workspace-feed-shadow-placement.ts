/**
 * Phase 3B.3.2 static validator — shadow placement / identity / activation safety.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledFeedHostShadowPlacement,
  createFeedHostShadowPlacementIdentity,
  createControlledFeedHostPlan,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_2_SHADOW_PLACEMENT_ONLY,
  PHASE_3B3_3_HOST_REGISTRATION_ONLY,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedShadowPlacementReadinessContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/sealed/controlled-feed-host-shadow-placement.ts");
mustExist("lib/adaptive-workspace/sealed/feed-host-shadow-placement-identity.ts");
mustExist("lib/adaptive-workspace/sealed/feed-shadow-placement-readiness.ts");
mustExist("components/adaptive-workspace/FeedControlledHostShell.tsx");
mustExist("scripts/probe-feed-shadow-placement-phase3b32.mjs");
mustExist("scripts/run-feed-shadow-placement-proof-phase3b32.mjs");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-2-feed-shadow-placement.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist(
  "docs/audits/artifacts/phase3b32/phase3b3-2-feed-shadow-placement-proof.json",
);
mustExist(
  "docs/audits/artifacts/phase3b32/phase3b3-2-feed-shadow-placement-readiness.json",
);

const host = createControlledFeedHostContract();
assert.equal(host.hostActivation, false);
assert.equal(host.renderActivation, false);
assert.equal(host.nextEligibleStep, "3B.3.21");
assert.ok(
  host.activationBlockers.includes(PHASE_3B3_2_SHADOW_PLACEMENT_ONLY),
);
assert.ok(
  host.activationBlockers.includes(PHASE_3B3_3_HOST_REGISTRATION_ONLY),
);

const placement = createControlledFeedHostShadowPlacement();
assert.equal(placement.placementState, "shadow-registered");
assert.equal(placement.placementMode, "sibling-after-legacy-mount");
assert.equal(placement.hostActivation, false);
assert.equal(placement.renderActivation, false);

const identity = createFeedHostShadowPlacementIdentity();
assert.equal(identity.expectedMountCount, 1);
assert.equal(identity.identityTransitionAllowed, false);

const plan = createControlledFeedHostPlan();
assert.equal(plan.placementState, "shadow-registered");
assert.equal(
  plan.recommendedNextStep,
  "3B.3.20-controlled-host-activation-candidate",
);
assert.equal(plan.registrationState, "registered");
assert.equal(plan.eligibilityState, "eligible");

const rollback = createFeedHostRollbackContract();
assert.equal(rollback.rollbackReadiness, "prepared-not-active");
assert.equal(rollback.rollbackTarget, "legacy");

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
});
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY));
assert.equal(gate.currentStep, "3B.3.20");
assert.equal(gate.eligibleStep, "3B.3.21");

assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.rendererRegistered, false);
assert.equal(
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA.shadowPlacementState,
  "shadow-registered",
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
assert.doesNotMatch(shell, /useEffect|useState|createPortal/);

const home = readFileSync(join(root, "components/home/HomePageClient.tsx"), "utf8");
assert.equal((home.match(/<GeoFeed\b/g) ?? []).length, 1);
const geoIdx = home.indexOf("<GeoFeed");
const geoClose = home.indexOf("</GeoFeed>");
const shellIdx = home.indexOf("<FeedControlledHostShell");
assert.ok(geoClose > geoIdx);
assert.ok(shellIdx > geoClose, "shell must be AFTER </GeoFeed> (not wrapping)");
assert.doesNotMatch(home, /createPortal/);

const probeBridge = readFileSync(
  join(root, "lib/feed/feed-sealed-probe-bridge.ts"),
  "utf8",
);
assert.match(probeBridge, /version:\s*21/);
assert.match(probeBridge, /readShadowPlacement/);
assert.match(probeBridge, /PHASE_3B3_2_SHADOW_PLACEMENT_ONLY/);
assert.match(probeBridge, /PHASE_3B3_3_HOST_REGISTRATION_ONLY/);
assert.match(probeBridge, /readHostRegistry/);

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
assert.equal(shadowProof.hostActivation, false);
assert.equal(shadowProof.renderActivation, false);
assert.equal(shadowProof.shadowPlacement.placementState, "shadow-registered");
assert.equal(shadowProof.mountUnmount.mountCount, 1);
assert.equal(shadowProof.mountUnmount.unmountCount, 0);
assert.equal(shadowProof.activationAttempt.blocked, true);
assert.ok(
  shadowProof.activationAttempt.blockers.includes(
    PHASE_3B3_2_SHADOW_PLACEMENT_ONLY,
  ),
);
assert.equal(
  (shadowProof.invariants || []).filter((i: { status: string }) => i.status === "PASS")
    .length,
  20,
);

const readiness = validateFeedShadowPlacementReadinessContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b32/phase3b3-2-feed-shadow-placement-readiness.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(readiness.nextEligibleStep, "3B.3.3");
assert.equal(readiness.hostActivation, false);

const queryParams = readFileSync(join(root, "lib/feed/feed-query-params.ts"), "utf8");
assert.doesNotMatch(
  queryParams,
  /adaptive-workspace|hostActivation|AvailableSpace|feed\.discovery/,
);

console.log("validate-adaptive-workspace-feed-shadow-placement: ok");
