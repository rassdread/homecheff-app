import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_EXECUTION_ID,
  PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY,
  createControlledFeedHostContract,
  createControlledFeedHostPlan,
  createControlledWorkspaceExecutionContract,
  createControlledWorkspaceExecutionDescriptor,
  createControlledWorkspaceExecutionIdentity,
  createControlledWorkspaceExecutionRollbackContract,
  evaluateFeedHostActivationGate,
} from "../lib/adaptive-workspace";

const root = process.cwd();
const priorProofPath = join(
  root,
  "docs/audits/artifacts/aw-r2/aw-r2-controlled-workspace-live-authorization-proof.json",
);
assert.ok(existsSync(priorProofPath), "AW-R2 proof is required");
const prior = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(prior.overallVerdict, "READY_FOR_AW_R3");

for (const commit of ["df9b9b9a", "002586b4", "8dfdb083", "96e270f6"]) {
  execSync(`git merge-base --is-ancestor ${commit} HEAD`, {
    cwd: root,
    stdio: "pipe",
  });
}

const d = createControlledWorkspaceExecutionDescriptor();
assert.equal(d.phase, "AW-R3");
assert.equal(d.previousPhase, "AW-R2");
assert.equal(d.nextEligibleStep, "AW-R4");
assert.equal(
  d.candidateActivationResult,
  "controlled-workspace-executing-geofeed-legacy-authority",
);
assert.equal(
  d.candidateActivationState,
  "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY",
);
assert.equal(d.activationExecutionAllowed, true);
assert.equal(d.issuancePipelineExecutionAllowed, true);
assert.equal(d.issuancePipelineExecutable, true);
assert.equal(d.issuancePipelineState, "CONTROLLED_EXECUTABLE");
assert.equal(d.issuanceTransactionState, "CONTROLLED_EXECUTION");
assert.equal(d.workspaceVisible, true);
assert.equal(d.workspaceHostMounted, true);
assert.equal(d.workspaceCandidateRendered, true);
assert.equal(d.workspaceReactInstancePresent, true);
assert.equal(d.runtimeCapabilityPresent, true);
assert.equal(d.runtimeHostInstancePresent, true);
assert.equal(d.activationHandlePresent, true);
assert.equal(d.executionHandlePresent, true);
assert.equal(d.renderActivation, false);
assert.equal(d.geoFeedAuthorityTransferred, false);
assert.equal(d.feedOnAuthorized, false);
assert.equal(d.owner, "legacy");
assert.equal(d.writer, "legacy");
assert.equal(d.renderer, "legacy");
assert.deepEqual([d.mountCount, d.geoFeedRenderCount, d.unmountCount], [1, 1, 0]);

const contract = createControlledWorkspaceExecutionContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID);
const identity = createControlledWorkspaceExecutionIdentity();
assert.equal(identity.activationControlledExecutionId, CONTROLLED_WORKSPACE_EXECUTION_ID);
assert.ok(identity.activationLiveAuthorizationId);

const rollback = createControlledWorkspaceExecutionRollbackContract();
assert.equal(rollback.phase, "AW-R2");
assert.equal(rollback.activationExecutionAllowed, true);
assert.equal(rollback.issuancePipelineExecutable, false);
assert.equal(rollback.issuancePipelineState, "NON_EXECUTABLE");
assert.equal(rollback.issuanceTransactionState, "OPENED");
assert.equal(rollback.workspaceVisible, false);
assert.equal(rollback.runtimeCapabilityPresent, false);

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.currentStep, "AW-R3");
assert.equal(gate.eligibleStep, "AW-R4");
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY));
assert.equal(createControlledFeedHostContract().nextEligibleStep, "AW-R4");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "AW-R4");

const proofPath = join(
  root,
  "docs/audits/artifacts/aw-r3/aw-r3-controlled-workspace-execution-proof.json",
);
if (existsSync(proofPath)) {
  const proof = JSON.parse(readFileSync(proofPath, "utf8"));
  assert.equal(proof.overallVerdict, "READY_FOR_AW_R4");
  assert.equal(proof.controlledWorkspaceExecutionMetaOk, true);
  assert.ok(proof.bridgeVersion >= 51);
}

console.log("validate-adaptive-workspace-controlled-execution-aw-r3: PASS");
