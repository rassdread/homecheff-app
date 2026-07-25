/**
 * Phase 3B.3.1 static validator — dormant controlled host foundation artifacts.
 * Live contracts advanced to 3B.3.2; historical 3B.3.1 proof artifacts remain frozen.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  createControlledFeedHostPlan,
  evaluateFeedHostActivationGate,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
  validateFeedDormantHostReadinessContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("lib/adaptive-workspace/sealed/create-controlled-feed-host-contract.ts");
mustExist("lib/adaptive-workspace/sealed/feed-host-activation-gate.ts");
mustExist("lib/adaptive-workspace/sealed/feed-host-rollback-contract.ts");
mustExist("lib/adaptive-workspace/sealed/controlled-feed-host-plan.ts");
mustExist("lib/adaptive-workspace/sealed/feed-dormant-host-readiness.ts");
mustExist("components/adaptive-workspace/FeedControlledHostShell.tsx");
mustExist(
  "docs/audits/homecheff-adaptive-workspace-phase3b3-1-feed-dormant-host-foundation.md",
);
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist("docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-proof.json");
mustExist(
  "docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-readiness.json",
);

const contract = createControlledFeedHostContract();
assert.equal(contract.hostActivation, false);
assert.equal(contract.renderActivation, false);
assert.equal(contract.activeRenderOwner, "legacy");
assert.equal(contract.activeWriter, "legacy");
assert.equal(contract.nextEligibleStep, "3B.3.23");

const gate = evaluateFeedHostActivationGate({
  phase3b2ProofValid: true,
  phase3b2FreezeValid: true,
  forceHostActivation: true,
});
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY));

const rollback = createFeedHostRollbackContract();
assert.equal(rollback.rollbackTarget, "legacy");
assert.equal(rollback.rollbackReadiness, "prepared-not-active");

const plan = createControlledFeedHostPlan();
assert.equal(plan.activationState, "dormant");
assert.equal(plan.placementState, "shadow-registered");

assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.rendererRegistered, false);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.childFactoryRegistered, false);
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.23");

const shell = readFileSync(
  join(root, "components/adaptive-workspace/FeedControlledHostShell.tsx"),
  "utf8",
);
assert.doesNotMatch(
  shell,
  /from\s+['"][^'"]*(GeoFeed|HomeGeoFeedDynamic|components\/feed)[^'"]*['"]/,
);
assert.doesNotMatch(shell, /useEffect|useState|useRef|Suspense|createPortal/);
assert.match(shell, /return null/);

assert.equal(
  existsSync(join(root, "components/adaptive-workspace/FeedWorkspaceRoot.tsx")),
  false,
);

const home = readFileSync(join(root, "components/home/HomePageClient.tsx"), "utf8");
assert.equal((home.match(/<GeoFeed\b/g) ?? []).length, 1);
// Shadow placement may mount the null shell AFTER GeoFeed (not wrapping).
const geoIdx = home.indexOf("<GeoFeed");
const shellIdx = home.indexOf("<FeedControlledHostShell");
assert.ok(geoIdx >= 0, "GeoFeed must remain on homepage");
assert.ok(shellIdx > geoIdx, "shadow shell must be sibling AFTER GeoFeed");
assert.doesNotMatch(home, /hostActivation\s*=\s*\{?\s*true/);
assert.doesNotMatch(home, /key=\{[^}]*host|key=\{[^}]*feed\.discovery/);

const geoDynamic = readFileSync(
  join(root, "components/home/HomeGeoFeedDynamic.tsx"),
  "utf8",
);
assert.equal(
  (geoDynamic.match(/import\(['"]@\/components\/feed\/GeoFeed['"]\)/g) ?? [])
    .length,
  2,
);

const proof = validateFeedBrowserProofArtifact(
  JSON.parse(
    readFileSync(
      join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json"),
      "utf8",
    ),
  ),
);
assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3");

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

const dormantProof = JSON.parse(
  readFileSync(
    join(
      root,
      "docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-proof.json",
    ),
    "utf8",
  ),
);
assert.equal(dormantProof.overallVerdict, "READY_FOR_PHASE_3B_3_2");
assert.equal(dormantProof.hostActivation, false);
assert.equal(dormantProof.renderActivation, false);
assert.equal(dormantProof.shellChildCount, 0);
assert.equal(dormantProof.shellDOMNodeCount, 0);
assert.equal(dormantProof.rendererRegistrationCount, 0);
assert.equal(dormantProof.activationAttempt.blocked, true);

const readiness = validateFeedDormantHostReadinessContract(
  JSON.parse(
    readFileSync(
      join(
        root,
        "docs/audits/artifacts/phase3b3/phase3b3-1-feed-dormant-host-readiness.json",
      ),
      "utf8",
    ),
  ),
);
assert.equal(readiness.nextEligibleStep, "3B.3.2");
assert.equal(readiness.hostActivation, false);

const queryParams = readFileSync(join(root, "lib/feed/feed-query-params.ts"), "utf8");
assert.doesNotMatch(
  queryParams,
  /adaptive-workspace|hostActivation|AvailableSpace|feed\.discovery/,
);

console.log("validate-adaptive-workspace-feed-dormant-host: ok");
