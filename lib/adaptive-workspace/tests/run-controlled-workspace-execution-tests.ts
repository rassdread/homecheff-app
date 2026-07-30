import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { evaluateFeedHostActivationGate } from "../sealed/feed-host-activation-gate";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createControlledFeedHostPlan } from "../sealed/controlled-feed-host-plan";
import {
  CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_EXECUTION_ID,
  createControlledWorkspaceExecutionDescriptor,
  createControlledWorkspaceExecutionRollbackContract,
  evaluateControlledWorkspaceExecution,
} from "../sealed/controlled-workspace-execution";
import { createControlledWorkspaceExecutionContract } from "../sealed/controlled-workspace-execution-contract";
import { createControlledWorkspaceExecutionIdentity } from "../sealed/controlled-workspace-execution-identity";
import { createControlledWorkspaceExecutionPreparedContract } from "../sealed/controlled-workspace-execution-prepared";
import { PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY } from "../sealed/controlled-workspace-geofeed-authority-transition";
import { createControlledWorkspaceLiveAuthorizationDescriptor } from "../sealed/controlled-workspace-live-authorization";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";

let passed = 0;
const ok = (label: string) => {
  passed += 1;
  console.log(`  ✓ ${label}`);
};

console.log("\n[aw-r3] controlled execution");

const pred = createControlledWorkspaceLiveAuthorizationDescriptor();
assert.equal(pred.phase, "AW-R2");
assert.equal(pred.activationExecutionAllowed, true);
assert.equal(pred.issuancePipelineExecutable, false);
assert.equal(pred.issuancePipelineState, "NON_EXECUTABLE");
assert.equal(pred.issuanceTransactionState, "OPENED");
assert.equal(pred.workspaceVisible, false);
assert.equal(pred.runtimeCapabilityPresent, false);
ok("sealed AW-R2 predecessor is exact");

const a = createControlledWorkspaceExecutionDescriptor();
const b = createControlledWorkspaceExecutionDescriptor();
assert.deepEqual(a, b);
assert.ok(Object.isFrozen(a));
assert.equal(a.phase, "AW-R3");
assert.equal(a.previousPhase, "AW-R2");
assert.equal(a.nextEligibleStep, "AW-R4");
assert.equal(a.title, "Controlled Execution");
assert.equal(
  a.candidateActivationState,
  "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY",
);
assert.equal(
  a.candidateActivationResult,
  "controlled-workspace-executing-geofeed-legacy-authority",
);
ok("deterministic immutable AW-R3 identity");

assert.equal(a.activationExecutionAllowed, true);
assert.equal(a.issuancePipelineExecutable, true);
assert.equal(a.issuancePipelineExecutionAllowed, true);
assert.equal(a.issuancePipelineState, "CONTROLLED_EXECUTABLE");
assert.equal(a.issuanceTransactionState, "CONTROLLED_EXECUTION");
assert.equal(a.workspaceVisible, true);
assert.equal(a.workspaceHostMounted, true);
assert.equal(a.workspaceCandidateRendered, true);
assert.equal(a.workspaceReactInstancePresent, true);
assert.equal(a.runtimeCapabilityPresent, true);
assert.equal(a.runtimeHostInstancePresent, true);
assert.equal(a.activationHandlePresent, true);
assert.equal(a.executionHandlePresent, true);
assert.equal(a.hostActivation, true);
assert.equal(a.canStartActivation, true);
assert.equal(a.renderActivation, false);
ok("capability pack transitions atomically");

assert.equal(a.owner, "legacy");
assert.equal(a.writer, "legacy");
assert.equal(a.renderer, "legacy");
assert.deepEqual([a.mountCount, a.geoFeedRenderCount, a.unmountCount], [1, 1, 0]);
assert.equal(a.containsGeoFeed, false);
assert.equal(a.mountsGeoFeed, false);
assert.equal(a.wrapsGeoFeed, false);
assert.equal(a.duplicatesGeoFeed, false);
assert.equal(a.createsSecondGeoFeed, false);
assert.equal(a.geoFeedAuthorityTransferred, false);
assert.equal(a.feedOnAuthorized, false);
assert.equal(a.productionPromotionAuthorized, false);
ok("legacy GeoFeed authority remains sealed");

assert.equal(a.stableMountId, "feed.discovery.controlled-host.stable-mount.v1");
assert.equal(a.stableMountIdentityPreserved, true);
assert.equal(
  a.workspaceRuntimeHandleId,
  "feed.discovery.adaptive-workspace.workspace-runtime-handle.v1",
);
assert.equal(
  a.workspaceActivationHandleId,
  "feed.discovery.adaptive-workspace.workspace-activation-handle.v1",
);
assert.equal(
  a.workspaceExecutionHandleId,
  "feed.discovery.adaptive-workspace.workspace-execution-handle.v1",
);
ok("stable mount and typed metadata handles are exact");

const validSeed = {
  candidateActivationStarted: true,
  candidateActivationExecuted: true,
  candidateActivationCompleted: true,
  activationExecutionAllowed: true,
  issuancePipelineExecutionAllowed: false,
  issuancePipelineExecutable: false,
  issuancePipelineState: "NON_EXECUTABLE",
  issuanceTransactionState: "OPENED",
  workspaceVisible: false,
  workspaceHostMounted: false,
  workspaceCandidateRendered: false,
  workspaceReactInstancePresent: false,
  runtimeCapabilityPresent: false,
  runtimeHostInstancePresent: false,
  activationHandlePresent: false,
  executionHandlePresent: false,
  hostActivation: false,
  canStartActivation: false,
  renderActivation: false,
} as const;
for (const patch of [
  { activationExecutionAllowed: false },
  { issuancePipelineExecutionAllowed: true },
  { issuancePipelineExecutable: true },
  { issuancePipelineState: "CONTROLLED_EXECUTABLE" },
  { issuanceTransactionState: "CONTROLLED_EXECUTION" },
  { workspaceVisible: true },
  { workspaceHostMounted: true },
  { workspaceCandidateRendered: true },
  { workspaceReactInstancePresent: true },
  { runtimeCapabilityPresent: true },
  { runtimeHostInstancePresent: true },
  { activationHandlePresent: true },
  { executionHandlePresent: true },
  { hostActivation: true },
  { canStartActivation: true },
  { renderActivation: true },
  { candidateActivationCompleted: false },
]) {
  assert.throws(
    () =>
      evaluateControlledWorkspaceExecution(createControlledHostRegistry(), {
        ...validSeed,
        ...patch,
      } as never),
    HardContractViolation,
  );
}
assert.throws(
  () => evaluateControlledWorkspaceExecution(createControlledHostRegistry()),
  HardContractViolation,
);
ok("partials, duplicates and incomplete lifecycle fail closed");

const contract = createControlledWorkspaceExecutionContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID);
assert.equal(contract.activationControlledExecutionId, CONTROLLED_WORKSPACE_EXECUTION_ID);
assert.equal(contract.activationLiveAuthorizationId, a.activationLiveAuthorizationId);
const identity = createControlledWorkspaceExecutionIdentity();
assert.equal(identity.activationControlledExecutionId, CONTROLLED_WORKSPACE_EXECUTION_ID);
assert.ok(identity.activationLiveAuthorizationId);
const prepared = createControlledWorkspaceExecutionPreparedContract({
  evidenceCommit: "aw-r3",
  evidenceArtifactPath: "docs/audits/artifacts/aw-r3/",
});
assert.equal(prepared.nextEligibleStep, "AW-R4");
ok("contract, identity and prepared pack preserve prior tips");

const rollback = createControlledWorkspaceExecutionRollbackContract();
assert.equal(a.rollbackTargetPhase, "AW-R2");
assert.equal(a.rollbackMode, "metadata-gate-only");
assert.equal(a.rollbackPreservesGeoFeedIdentity, true);
assert.equal(rollback.phase, "AW-R2");
assert.equal(rollback.activationExecutionAllowed, true);
assert.equal(rollback.issuancePipelineExecutable, false);
assert.equal(rollback.issuancePipelineState, "NON_EXECUTABLE");
assert.equal(rollback.issuanceTransactionState, "OPENED");
assert.equal(rollback.workspaceVisible, false);
assert.equal(rollback.runtimeCapabilityPresent, false);
assert.deepEqual(
  [rollback.mountCount, rollback.geoFeedRenderCount, rollback.unmountCount],
  [1, 1, 0],
);
ok("rollback restores the AW-R2-safe snapshot");

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
ok("tip gate blocks production promotion and points to AW-R5");

console.log(
  `\nadaptive-workspace AW-R3 controlled execution: ${passed} assertion groups ok\n`,
);
