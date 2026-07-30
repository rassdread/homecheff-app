import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
  PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY,
  createControlledFeedHostContract,
  createControlledFeedHostPlan,
  createControlledWorkspaceHostCandidatePreActivationSealContract,
  createControlledWorkspaceHostCandidatePreActivationSealDescriptor,
  createFeedWorkspaceHostCandidatePreActivationSealIdentity,
  evaluateFeedHostActivationGate,
} from "../lib/adaptive-workspace";

const root = process.cwd();
const priorProofPath = join(
  root,
  "docs/audits/artifacts/phase3b347/phase3b3-47-controlled-workspace-host-candidate-execution-started-proof.json",
);
assert.ok(existsSync(priorProofPath), "Phase 3B.3.47 proof is required");
const prior = JSON.parse(readFileSync(priorProofPath, "utf8"));
assert.equal(prior.overallVerdict, "READY_FOR_PHASE_3B_3_48");

for (const commit of ["18c178a6", "a333f705", "f40c2c8d", "f5d79507"]) {
  execSync(`git merge-base --is-ancestor ${commit} HEAD`, {
    cwd: root,
    stdio: "pipe",
  });
}

const d = createControlledWorkspaceHostCandidatePreActivationSealDescriptor();
assert.equal(d.phase, "AW-R1");
assert.equal(d.previousPhase, "3B.3.47");
assert.equal(d.nextEligibleStep, "AW-R2");
assert.equal(
  d.candidateActivationResult,
  "controlled-workspace-host-candidate-pre-activation-sealed-not-live",
);
assert.equal(d.candidateActivationState, "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE");
assert.equal(d.candidateActivationStarted, true);
assert.equal(d.candidateActivationExecuted, true);
assert.equal(d.candidateActivationCompleted, true);
assert.equal(d.activationExecutionAllowed, false);
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
  createControlledWorkspaceHostCandidatePreActivationSealContract();
assert.equal(
  contract.contractId,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
);
const identity = createFeedWorkspaceHostCandidatePreActivationSealIdentity();
assert.equal(
  identity.activationCandidatePreActivationSealId,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
);
assert.ok(identity.activationCandidateExecutionStartedId);

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.currentStep, "AW-R1");
assert.equal(gate.eligibleStep, "AW-R2");
assert.equal(gate.allowed, false);
assert.ok(gate.blockers.includes(PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY));
assert.equal(createControlledFeedHostContract().nextEligibleStep, "AW-R2");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "AW-R2");

const proofPath = join(
  root,
  "docs/audits/artifacts/aw-r1/aw-r1-controlled-workspace-host-candidate-pre-activation-seal-proof.json",
);
if (existsSync(proofPath)) {
  const proof = JSON.parse(readFileSync(proofPath, "utf8"));
  assert.equal(proof.overallVerdict, "READY_FOR_AW_R2");
  assert.equal(proof.candidatePreActivationSealMetaOk, true);
  assert.equal(proof.bridgeVersion, 49);
}

console.log(
  "validate-adaptive-workspace-host-candidate-pre-activation-seal-aw-r1: PASS",
);
