import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID,
  PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY,
  createControlledFeedHostContract,
  createControlledFeedHostPlan,
  createControlledWorkspaceGeoFeedAuthorityTransitionContract,
  createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor,
  createControlledWorkspaceGeoFeedAuthorityTransitionIdentity,
  createControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract,
  evaluateFeedHostActivationGate,
} from "../lib/adaptive-workspace";

const root = process.cwd();
const priorProofPath = join(
  root,
  "docs/audits/artifacts/aw-r3/aw-r3-controlled-workspace-execution-proof.json",
);
assert.ok(existsSync(priorProofPath), "AW-R3 proof is required");
const prior = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(prior.overallVerdict, "READY_FOR_AW_R4");

for (const commit of ["227c2ee6", "a58caed6", "ff0e22f7", "34d84d6b"]) {
  execSync(`git merge-base --is-ancestor ${commit} HEAD`, {
    cwd: root,
    stdio: "pipe",
  });
}

const d = createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor();
assert.equal(d.phase, "AW-R4");
assert.equal(d.previousPhase, "AW-R3");
assert.equal(d.nextEligibleStep, "AW-R5");
assert.equal(d.candidateActivationResult, "controlled-workspace-geofeed-authority-transitioned-not-production-on");
assert.equal(d.candidateActivationState, "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON");
assert.equal(d.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(d.issuanceTransactionState, "AUTHORITY_COMMITTED");
assert.deepEqual([d.owner, d.writer, d.renderer], ["workspace", "workspace", "workspace"]);
assert.deepEqual(
  [d.requestAuthority, d.paginationAuthority, d.cacheAuthority, d.observerAuthority, d.lifecycleAuthority],
  ["workspace", "workspace", "workspace", "workspace", "workspace"],
);
assert.equal(d.legacyAuthorityActive, false);
assert.equal(d.targetAuthorityActive, true);
assert.equal(d.authorityCommitBoundary, "COMMITTED");
assert.equal(d.geoFeedAuthorityTransferred, true);
assert.equal(d.renderActivation, true);
assert.equal(d.feedOnAuthorized, false);
assert.equal(d.productionPromotionAuthorized, false);
assert.deepEqual([d.mountCount, d.geoFeedRenderCount, d.unmountCount], [1, 1, 0]);
assert.equal(d.geoFeedInstanceCount, 1);

const contract = createControlledWorkspaceGeoFeedAuthorityTransitionContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID);
assert.equal(contract.activationGeoFeedAuthorityTransitionId, CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID);
const identity = createControlledWorkspaceGeoFeedAuthorityTransitionIdentity();
assert.ok(identity.activationControlledExecutionId);
assert.ok(identity.activationLiveAuthorizationId);

const rollback = createControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract();
assert.equal(rollback.phase, "AW-R3");
assert.deepEqual([rollback.owner, rollback.writer, rollback.renderer], ["legacy", "legacy", "legacy"]);
assert.equal(rollback.issuancePipelineState, "CONTROLLED_EXECUTABLE");
assert.equal(rollback.issuanceTransactionState, "CONTROLLED_EXECUTION");
assert.deepEqual([rollback.mountCount, rollback.geoFeedRenderCount, rollback.unmountCount], [1, 1, 0]);

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.currentStep, "AW-R4");
assert.equal(gate.eligibleStep, "AW-R5");
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY));
assert.equal(createControlledFeedHostContract().activeWriter, "workspace");
assert.equal(createControlledFeedHostContract().activeRenderOwner, "workspace");
assert.equal(createControlledFeedHostContract().nextEligibleStep, "AW-R5");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "AW-R5");

const proofPath = join(
  root,
  "docs/audits/artifacts/aw-r4/aw-r4-controlled-workspace-geofeed-authority-transition-proof.json",
);
if (existsSync(proofPath)) {
  const proof = JSON.parse(readFileSync(proofPath, "utf8"));
  assert.equal(proof.overallVerdict, "READY_FOR_AW_R5");
  assert.equal(proof.geoFeedAuthorityTransitionMetaOk, true);
  assert.ok(proof.bridgeVersion >= 52);
}

console.log(
  "validate-adaptive-workspace-geofeed-authority-transition-aw-r4: PASS",
);
