/**
 * Phase 3B.2 validator — browser proof artifact + freeze contract + sealed baseline.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  validateFeedBrowserProofArtifact,
  validateFeedDiscoveryFreezeContract,
  createFeedDiscoverySealedContract,
} from "../lib/adaptive-workspace";

const root = process.cwd();

function mustExist(rel: string) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`);
}

mustExist("docs/audits/homecheff-adaptive-workspace-phase3b1-feed-sealed-runtime.md");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json");
mustExist("docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json");
mustExist("scripts/probe-feed-sealed-runtime-phase3b2.mjs");
mustExist("scripts/run-feed-sealed-browser-proof-phase3b2.mjs");
mustExist("lib/adaptive-workspace/sealed/feed-discovery-freeze-contract.ts");
mustExist("lib/feed/feed-sealed-probe-bridge.ts");

const proof = validateFeedBrowserProofArtifact(
  JSON.parse(
    readFileSync(
      join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-browser-proof.json"),
      "utf8",
    ),
  ),
);
assert.equal(proof.overallVerdict, "READY_FOR_PHASE_3B_3");
assert.equal(proof.productionMode, true);
assert.equal(proof.mountUnmount.mountCount, 1);
assert.equal(proof.mountUnmount.unmountCount, 0);

const freezeRaw = JSON.parse(
  readFileSync(
    join(root, "docs/audits/artifacts/phase3b2/phase3b2-feed-freeze-contract.json"),
    "utf8",
  ),
);
const freeze = validateFeedDiscoveryFreezeContract({
  ...freezeRaw,
  sealedContract: createFeedDiscoverySealedContract(),
  releaseBlockingInvariantIds: createFeedDiscoverySealedContract().invariantIds,
});
assert.equal(freeze.renderActivation, false);
assert.equal(freeze.hostActivation, false);
assert.equal(freeze.nextEligiblePhase, "3B.3");
assert.equal(freeze.evidenceCommit, proof.commit);

// Evidence commit should match proof commit
assert.equal(freezeRaw.evidenceCommit, proof.commit);

// Static: no Feed ON renderer
assert.equal(
  existsSync(join(root, "components/adaptive-workspace/FeedWorkspaceRoot.tsx")),
  false,
);

const geo = readFileSync(join(root, "components/feed/GeoFeed.tsx"), "utf8");
assert.match(geo, /installFeedSealedProbeBridge/);
assert.doesNotMatch(geo, /from ['"]@\/lib\/adaptive-workspace['"]/);

console.log("validate-adaptive-workspace-feed-sealed-browser: ok");
