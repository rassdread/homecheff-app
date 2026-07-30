import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID,
  PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY,
  createControlledFeedHostContract,
  createControlledFeedHostPlan,
  createControlledWorkspaceLiveAuthorizationContract,
  createControlledWorkspaceLiveAuthorizationDescriptor,
  createControlledWorkspaceLiveAuthorizationIdentity,
  evaluateFeedHostActivationGate,
} from "../lib/adaptive-workspace";

const root = process.cwd();
const priorProofPath = join(
  root,
  "docs/audits/artifacts/aw-r1/aw-r1-controlled-workspace-host-candidate-pre-activation-seal-proof.json",
);
assert.ok(existsSync(priorProofPath), "AW-R1 proof is required");
const prior = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(prior.overallVerdict, "READY_FOR_AW_R2");

for (const commit of ["c281c271", "264340b1", "e323aff5", "8fe89c74"]) {
  execSync(`git merge-base --is-ancestor ${commit} HEAD`, {
    cwd: root,
    stdio: "pipe",
  });
}

const d = createControlledWorkspaceLiveAuthorizationDescriptor();
assert.equal(d.phase, "AW-R2");
assert.equal(d.previousPhase, "AW-R1");
assert.equal(d.nextEligibleStep, "AW-R3");
assert.equal(
  d.candidateActivationResult,
  "controlled-workspace-live-authorized-not-executable",
);
assert.equal(d.candidateActivationState, "LIVE_AUTHORIZED_NOT_EXECUTABLE");
assert.equal(d.candidateActivationStarted, true);
assert.equal(d.candidateActivationExecuted, true);
assert.equal(d.candidateActivationCompleted, true);
assert.equal(d.activationExecutionAllowed, true);
assert.equal(d.issuancePipelineExecutionAllowed, false);
assert.equal(d.issuancePipelineExecutable, false);
assert.equal(d.issuancePipelineState, "NON_EXECUTABLE");
assert.equal(d.issuanceTransactionState, "OPENED");
assert.equal(d.workspaceVisible, false);
assert.equal(d.runtimeCapabilityPresent, false);
assert.deepEqual(
  [d.mountCount, d.geoFeedRenderCount, d.unmountCount],
  [1, 1, 0],
);

const contract =
  createControlledWorkspaceLiveAuthorizationContract();
assert.equal(
  contract.contractId,
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
);
const identity = createControlledWorkspaceLiveAuthorizationIdentity();
assert.equal(
  identity.activationLiveAuthorizationId,
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID,
);
assert.ok(identity.activationCandidatePreActivationSealId);

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.currentStep, "AW-R2");
assert.equal(gate.eligibleStep, "AW-R3");
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY));
assert.equal(createControlledFeedHostContract().nextEligibleStep, "AW-R3");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "AW-R3");

const proofPath = join(
  root,
  "docs/audits/artifacts/aw-r2/aw-r2-controlled-workspace-live-authorization-proof.json",
);
if (existsSync(proofPath)) {
  const proof = JSON.parse(readFileSync(proofPath, "utf8"));
  assert.equal(proof.overallVerdict, "READY_FOR_AW_R3");
  assert.equal(proof.controlledLiveAuthorizationMetaOk, true);
  assert.equal(proof.bridgeVersion, 50);
}

console.log(
  "validate-adaptive-workspace-live-authorization-aw-r2: PASS",
);
