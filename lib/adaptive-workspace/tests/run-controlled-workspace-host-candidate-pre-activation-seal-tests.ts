import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { evaluateFeedHostActivationGate } from "../sealed/feed-host-activation-gate";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createControlledFeedHostPlan } from "../sealed/controlled-feed-host-plan";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
  createControlledWorkspaceHostCandidatePreActivationSealDescriptor,
  evaluateControlledWorkspaceHostCandidatePreActivationSeal,
} from "../sealed/controlled-workspace-host-candidate-pre-activation-seal";
import { PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY } from "../sealed/controlled-workspace-geofeed-authority-transition";
import { createControlledWorkspaceHostCandidatePreActivationSealContract } from "../sealed/controlled-workspace-host-candidate-pre-activation-seal-contract";
import { createFeedWorkspaceHostCandidatePreActivationSealIdentity } from "../sealed/feed-workspace-host-candidate-pre-activation-seal-identity";
import { createFeedWorkspaceHostCandidatePreActivationSealPreparedContract } from "../sealed/feed-workspace-host-candidate-pre-activation-seal-prepared";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";

let passed = 0;
const ok = (label: string) => {
  passed += 1;
  console.log(`  ✓ ${label}`);
};

console.log("\n[aw-r1] final pre-activation seal");

const a = createControlledWorkspaceHostCandidatePreActivationSealDescriptor();
const b = createControlledWorkspaceHostCandidatePreActivationSealDescriptor();
assert.equal(a.phase, "AW-R1");
assert.equal(a.previousPhase, "3B.3.47");
assert.equal(a.nextEligibleStep, "AW-R2");
assert.equal(
  a.candidateActivationResult,
  "controlled-workspace-host-candidate-pre-activation-sealed-not-live",
);
assert.equal(
  a.candidateActivationState,
  "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE",
);
assert.equal(a.candidateActivationStarted, true);
assert.equal(a.candidateActivationExecuted, true);
assert.equal(a.candidateActivationCompleted, true);
assert.equal(
  Object.prototype.hasOwnProperty.call(a, "candidateActivationExecuted"),
  true,
);
assert.equal(
  Object.prototype.hasOwnProperty.call(a, "candidateActivationCompleted"),
  true,
);
assert.deepEqual(a, b);
assert.ok(Object.isFrozen(a));
ok("deterministic immutable atomic seal");

assert.equal(a.candidateReady, true);
assert.equal(a.candidateAuthorized, true);
assert.equal(a.candidateActivated, true);
assert.equal(a.candidateActive, true);
assert.equal(a.candidateExecutable, true);
assert.equal(a.activationExecutionAllowed, false);
assert.equal(a.issuancePipelineExecutionAllowed, false);
assert.equal(a.issuancePipelineExecutable, false);
assert.equal(a.issuancePipelineState, "NON_EXECUTABLE");
assert.equal(a.issuanceTransactionState, "OPENED");
assert.equal(a.workspaceVisible, false);
assert.equal(a.workspaceHostMounted, false);
assert.equal(a.workspaceCandidateRendered, false);
assert.equal(a.runtimeCapabilityPresent, false);
assert.equal(a.runtimeHostInstancePresent, false);
assert.equal(a.mountCount, 1);
assert.equal(a.geoFeedRenderCount, 1);
assert.equal(a.unmountCount, 0);
ok("LIVE/runtime/workspace/GeoFeed invariants preserved");

for (const input of [
  {},
  { candidateActivationStarted: false },
  { candidateActivationExecuted: true, candidateActivationStarted: true },
  { candidateActivationExecuted: false, candidateActivationStarted: true },
  { candidateActivationCompleted: true, candidateActivationStarted: true },
  { candidateActivationCompleted: false, candidateActivationStarted: true },
]) {
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidatePreActivationSeal(
        createControlledHostRegistry(),
        input,
      ),
    HardContractViolation,
  );
}
ok("missing Started and pre-advanced fields fail closed");

const contract =
  createControlledWorkspaceHostCandidatePreActivationSealContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID);
assert.equal(contract.activationCandidatePreActivationSealId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID);
const identity = createFeedWorkspaceHostCandidatePreActivationSealIdentity();
assert.equal(identity.activationCandidatePreActivationSealId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID);
assert.ok(identity.activationCandidateExecutionStartedId);
const prepared =
  createFeedWorkspaceHostCandidatePreActivationSealPreparedContract({
    evidenceCommit: "aw-r1",
    evidenceArtifactPath: "docs/audits/artifacts/aw-r1/",
  });
assert.equal(prepared.nextEligibleStep, "AW-R2");
ok("contract, identity, prepared pack exact");

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.allowed, false);
assert.equal(gate.currentStep, "AW-R4");
assert.equal(gate.eligibleStep, "AW-R5");
assert.ok(
  gate.blockers.includes(PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY),
);
assert.equal(createControlledFeedHostContract().nextEligibleStep, "AW-R5");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "AW-R5");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "AW-R5");
ok("AW-R1 seal preserved under AW-R2 gate continuity");

console.log(
  `\nadaptive-workspace AW-R1 controlled workspace host candidate pre-activation seal: ${passed} assertion groups ok\n`,
);
