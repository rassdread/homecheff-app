import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID,
  PHASE_AW_R5_PRODUCTION_READINESS_ONLY,
  createControlledFeedHostContract,
  createControlledFeedHostPlan,
  createControlledWorkspaceProductionReadinessContract,
  createControlledWorkspaceProductionReadinessDescriptor,
  createControlledWorkspaceProductionReadinessIdentity,
  createControlledWorkspaceProductionReadinessRollbackContract,
  evaluateFeedHostActivationGate,
} from "../lib/adaptive-workspace";

const root = process.cwd();
const priorProofPath = join(
  root,
  "docs/audits/artifacts/aw-r4/aw-r4-controlled-workspace-geofeed-authority-transition-proof.json",
);
assert.ok(existsSync(priorProofPath), "AW-R4 proof is required");
const prior = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(prior.overallVerdict, "READY_FOR_AW_R5");

for (const commit of ["fe4ad5e5", "28c8abe8", "a68b9d2b", "7817d6b6"]) {
  execSync(`git merge-base --is-ancestor ${commit} HEAD`, {
    cwd: root,
    stdio: "pipe",
  });
}

const d = createControlledWorkspaceProductionReadinessDescriptor();
assert.equal(d.phase, "AW-R5");
assert.equal(d.previousPhase, "AW-R4");
assert.equal(d.nextEligibleStep, "AW-R6");
assert.equal(
  d.candidateActivationResult,
  "controlled-workspace-production-ready-feed-off",
);
assert.equal(d.candidateActivationState, "PRODUCTION_READY_NOT_RELEASED");
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
assert.equal(d.productionReadinessCertified, true);
assert.equal(d.architectureProductionReady, true);
assert.equal(d.releaseBlockersRemain, false);
assert.equal(d.readyForFinalActivation, true);
assert.deepEqual([d.mountCount, d.geoFeedRenderCount, d.unmountCount], [1, 1, 0]);
assert.equal(d.geoFeedInstanceCount, 1);

const contract = createControlledWorkspaceProductionReadinessContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID);
assert.equal(contract.activationProductionReadinessId, CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID);
assert.ok(contract.activationGeoFeedAuthorityTransitionId);
assert.ok(contract.activationControlledExecutionId);
assert.ok(contract.activationLiveAuthorizationId);
const identity = createControlledWorkspaceProductionReadinessIdentity();
assert.ok(identity.activationGeoFeedAuthorityTransitionId);
assert.ok(identity.activationProductionReadinessId);

const rollback = createControlledWorkspaceProductionReadinessRollbackContract();
assert.equal(rollback.phase, "AW-R4");
assert.deepEqual([rollback.owner, rollback.writer, rollback.renderer], ["workspace", "workspace", "workspace"]);
assert.equal(rollback.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(rollback.issuanceTransactionState, "AUTHORITY_COMMITTED");
assert.equal(rollback.renderActivation, true);
assert.equal(rollback.geoFeedAuthorityTransferred, true);
assert.equal(rollback.feedOnAuthorized, false);
assert.deepEqual([rollback.mountCount, rollback.geoFeedRenderCount, rollback.unmountCount], [1, 1, 0]);

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.currentStep, "AW-R5");
assert.equal(gate.eligibleStep, "AW-R6");
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_AW_R5_PRODUCTION_READINESS_ONLY));
assert.equal(createControlledFeedHostContract().activeWriter, "workspace");
assert.equal(createControlledFeedHostContract().activeRenderOwner, "workspace");
assert.equal(createControlledFeedHostContract().nextEligibleStep, "AW-R6");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "AW-R6");

const proofPath = join(
  root,
  "docs/audits/artifacts/aw-r5/aw-r5-controlled-workspace-production-readiness-proof.json",
);
if (existsSync(proofPath)) {
  const proof = JSON.parse(readFileSync(proofPath, "utf8"));
  assert.equal(proof.overallVerdict, "READY_FOR_AW_R6");
  assert.equal(proof.productionReadinessMetaOk, true);
  assert.ok(proof.bridgeVersion >= 53);
}

console.log(
  "validate-adaptive-workspace-production-readiness-aw-r5: PASS",
);
