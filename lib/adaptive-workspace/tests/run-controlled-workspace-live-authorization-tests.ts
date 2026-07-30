import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { evaluateFeedHostActivationGate } from "../sealed/feed-host-activation-gate";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createControlledFeedHostPlan } from "../sealed/controlled-feed-host-plan";
import {
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID,
  createControlledWorkspaceLiveAuthorizationRollbackContract,
  createControlledWorkspaceLiveAuthorizationDescriptor,
  evaluateControlledWorkspaceLiveAuthorization,
} from "../sealed/controlled-workspace-live-authorization";
import { createControlledWorkspaceLiveAuthorizationContract } from "../sealed/controlled-workspace-live-authorization-contract";
import { createControlledWorkspaceLiveAuthorizationIdentity } from "../sealed/controlled-workspace-live-authorization-identity";
import { createControlledWorkspaceLiveAuthorizationPreparedContract } from "../sealed/controlled-workspace-live-authorization-prepared";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";
import { PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY } from "../sealed/controlled-workspace-geofeed-authority-transition";

let passed = 0;
const ok = (label: string) => {
  passed += 1;
  console.log(`  ✓ ${label}`);
};

console.log("\n[aw-r2] controlled LIVE authorization");

const a = createControlledWorkspaceLiveAuthorizationDescriptor();
const b = createControlledWorkspaceLiveAuthorizationDescriptor();
assert.equal(a.phase, "AW-R2");
assert.equal(a.previousPhase, "AW-R1");
assert.equal(a.nextEligibleStep, "AW-R3");
assert.equal(
  a.candidateActivationResult,
  "controlled-workspace-live-authorized-not-executable",
);
assert.equal(
  a.candidateActivationState,
  "LIVE_AUTHORIZED_NOT_EXECUTABLE",
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
ok("deterministic immutable LIVE authorization");

assert.equal(a.candidateReady, true);
assert.equal(a.candidateAuthorized, true);
assert.equal(a.candidateActivated, true);
assert.equal(a.candidateActive, true);
assert.equal(a.candidateExecutable, true);
assert.equal(a.activationExecutionAllowed, true);
assert.equal(a.issuancePipelineExecutionAllowed, false);
assert.equal(a.issuancePipelineExecutable, false);
assert.equal(a.issuancePipelineState, "NON_EXECUTABLE");
assert.equal(a.issuanceTransactionState, "OPENED");
assert.equal(a.workspaceVisible, false);
assert.equal(a.workspaceHostMounted, false);
assert.equal(a.workspaceCandidateRendered, false);
assert.equal(a.workspaceReactInstancePresent, false);
assert.equal(a.runtimeCapabilityPresent, false);
assert.equal(a.runtimeHostInstancePresent, false);
assert.equal(a.activationHandlePresent, false);
assert.equal(a.executionHandlePresent, false);
assert.equal(a.hostActivation, false);
assert.equal(a.renderActivation, false);
assert.equal(a.canStartActivation, false);
assert.equal(a.mountCount, 1);
assert.equal(a.geoFeedRenderCount, 1);
assert.equal(a.unmountCount, 0);
ok("Allowed=true preserves execution/runtime/workspace/GeoFeed closure");

for (const input of [
  {},
  {
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationExecutionAllowed: true,
  },
  {
    candidateActivationStarted: true,
    candidateActivationExecuted: false,
    candidateActivationCompleted: true,
    activationExecutionAllowed: false,
  },
  {
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: false,
    activationExecutionAllowed: false,
  },
  {
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationExecutionAllowed: "false",
  },
]) {
  assert.throws(
    () =>
      evaluateControlledWorkspaceLiveAuthorization(
        createControlledHostRegistry(),
        input as never,
      ),
    HardContractViolation,
  );
}
ok("duplicates, malformed Allowed and incomplete predecessor fail closed");

const contract =
  createControlledWorkspaceLiveAuthorizationContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID);
assert.equal(contract.activationLiveAuthorizationId, CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID);
assert.equal(contract.activationExecutionAllowed, true);
assert.equal(contract.issuancePipelineExecutable, false);
const identity = createControlledWorkspaceLiveAuthorizationIdentity();
assert.equal(identity.activationLiveAuthorizationId, CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID);
assert.ok(identity.activationCandidatePreActivationSealId);
const prepared =
  createControlledWorkspaceLiveAuthorizationPreparedContract({
    evidenceCommit: "aw-r2",
    evidenceArtifactPath: "docs/audits/artifacts/aw-r2/",
  });
assert.equal(prepared.nextEligibleStep, "AW-R3");
ok("contract, identity, prepared pack exact");

const rollback = createControlledWorkspaceLiveAuthorizationRollbackContract();
assert.equal(a.rollbackTargetAllowed, false);
assert.equal(a.rollbackMode, "metadata-gate-only");
assert.equal(a.rollbackPreservesGeoFeedIdentity, true);
assert.equal(rollback.phase, "AW-R1");
assert.equal(rollback.activationExecutionAllowed, false);
assert.deepEqual(
  [rollback.mountCount, rollback.geoFeedRenderCount, rollback.unmountCount],
  [1, 1, 0],
);
ok("metadata-only rollback restores AW-R1 Allowed=false");

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
ok("AW-R2 descriptor and AW-R3 gate continuity");

console.log(
  `\nadaptive-workspace AW-R2 controlled workspace live authorization: ${passed} assertion groups ok\n`,
);
