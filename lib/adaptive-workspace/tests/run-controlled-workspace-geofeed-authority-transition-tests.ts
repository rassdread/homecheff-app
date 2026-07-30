import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createControlledFeedHostPlan } from "../sealed/controlled-feed-host-plan";
import { evaluateFeedHostActivationGate } from "../sealed/feed-host-activation-gate";
import {
  CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID,
  PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY,
  createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor,
  createControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract,
  evaluateControlledWorkspaceGeoFeedAuthorityTransition,
} from "../sealed/controlled-workspace-geofeed-authority-transition";
import { PHASE_AW_R5_PRODUCTION_READINESS_ONLY } from "../sealed/controlled-workspace-production-readiness";
import { createControlledWorkspaceGeoFeedAuthorityTransitionContract } from "../sealed/controlled-workspace-geofeed-authority-transition-contract";
import { createControlledWorkspaceGeoFeedAuthorityTransitionIdentity } from "../sealed/controlled-workspace-geofeed-authority-transition-identity";
import { createControlledWorkspaceExecutionDescriptor } from "../sealed/controlled-workspace-execution";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";

let passed = 0;
const ok = (label: string) => {
  passed += 1;
  console.log(`  ✓ ${label}`);
};

console.log("\n[aw-r4] GeoFeed authority transition");

const pred = createControlledWorkspaceExecutionDescriptor();
assert.equal(pred.phase, "AW-R3");
assert.equal(pred.candidateActivationState, "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY");
assert.deepEqual([pred.owner, pred.writer, pred.renderer], ["legacy", "legacy", "legacy"]);
assert.equal(pred.geoFeedAuthorityTransferred, false);
assert.equal(pred.renderActivation, false);
assert.equal(pred.issuancePipelineState, "CONTROLLED_EXECUTABLE");
assert.equal(pred.issuanceTransactionState, "CONTROLLED_EXECUTION");
ok("sealed AW-R3 predecessor is exact");

const a = createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor();
const b = createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor();
assert.deepEqual(a, b);
assert.ok(Object.isFrozen(a));
assert.equal(a.phase, "AW-R4");
assert.equal(a.previousPhase, "AW-R3");
assert.equal(a.nextEligibleStep, "AW-R5");
assert.equal(a.title, "GeoFeed Authority Transition");
assert.equal(a.candidateActivationState, "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON");
assert.equal(a.candidateActivationResult, "controlled-workspace-geofeed-authority-transitioned-not-production-on");
ok("deterministic immutable AW-R4 identity");

assert.equal(a.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(a.issuanceTransactionState, "AUTHORITY_COMMITTED");
assert.deepEqual([a.owner, a.writer, a.renderer], ["workspace", "workspace", "workspace"]);
assert.deepEqual(
  [a.requestAuthority, a.paginationAuthority, a.cacheAuthority, a.observerAuthority, a.lifecycleAuthority],
  ["workspace", "workspace", "workspace", "workspace", "workspace"],
);
assert.equal(a.geoFeedAuthorityTransferred, true);
assert.equal(a.renderActivation, true);
ok("all authority dimensions transfer atomically");

assert.equal(a.feedOnAuthorized, false);
assert.equal(a.productionPromotionAuthorized, false);
assert.deepEqual([a.mountCount, a.geoFeedRenderCount, a.unmountCount], [1, 1, 0]);
assert.equal(a.geoFeedInstanceCount, 1);
assert.equal(a.containsGeoFeed, false);
assert.equal(a.mountsGeoFeed, false);
assert.equal(a.wrapsGeoFeed, false);
assert.equal(a.duplicatesGeoFeed, false);
assert.equal(a.createsSecondGeoFeed, false);
ok("same GeoFeed instance remains 1/1/0 while Feed ON stays closed");

assert.equal(a.legacyAuthorityActive, false);
assert.equal(a.targetAuthorityActive, true);
assert.equal(a.authorityCommitBoundary, "COMMITTED");
assert.equal(a.dualOwnerForbidden, true);
assert.equal(a.dualWriterForbidden, true);
assert.equal(a.dualRendererForbidden, true);
assert.equal(a.stableMountIdentityPreserved, true);
assert.equal(a.requestIdentityPreserved, true);
assert.equal(a.feedStatePreserved, true);
ok("dual authority is forbidden and identities are preserved");

const validSeed = {
  activationExecutionAllowed: true,
  issuancePipelineExecutionAllowed: true,
  issuancePipelineExecutable: true,
  issuancePipelineState: "CONTROLLED_EXECUTABLE",
  issuanceTransactionState: "CONTROLLED_EXECUTION",
  workspaceVisible: true,
  workspaceHostMounted: true,
  workspaceCandidateRendered: true,
  workspaceReactInstancePresent: true,
  runtimeCapabilityPresent: true,
  runtimeHostInstancePresent: true,
  activationHandlePresent: true,
  executionHandlePresent: true,
  owner: "legacy",
  writer: "legacy",
  renderer: "legacy",
  geoFeedAuthorityTransferred: false,
  renderActivation: false,
  feedOnAuthorized: false,
} as const;
for (const patch of [
  { activationExecutionAllowed: false },
  { issuancePipelineExecutionAllowed: false },
  { issuancePipelineExecutable: false },
  { issuancePipelineState: "AUTHORITY_TRANSITIONED" },
  { issuanceTransactionState: "AUTHORITY_COMMITTED" },
  { workspaceVisible: false },
  { workspaceHostMounted: false },
  { workspaceCandidateRendered: false },
  { workspaceReactInstancePresent: false },
  { runtimeCapabilityPresent: false },
  { runtimeHostInstancePresent: false },
  { activationHandlePresent: false },
  { executionHandlePresent: false },
  { owner: "workspace" },
  { writer: "workspace" },
  { renderer: "workspace" },
  { geoFeedAuthorityTransferred: true },
  { renderActivation: true },
  { feedOnAuthorized: true },
]) {
  assert.throws(
    () =>
      evaluateControlledWorkspaceGeoFeedAuthorityTransition(
        createControlledHostRegistry(),
        { ...validSeed, ...patch } as never,
      ),
    HardContractViolation,
  );
}
assert.throws(
  () => evaluateControlledWorkspaceGeoFeedAuthorityTransition(createControlledHostRegistry()),
  HardContractViolation,
);
ok("duplicates, partial prerequisites and Feed ON fail closed");

const contract = createControlledWorkspaceGeoFeedAuthorityTransitionContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID);
assert.equal(contract.activationGeoFeedAuthorityTransitionId, CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID);
assert.ok(contract.activationControlledExecutionId);
assert.ok(contract.activationLiveAuthorizationId);
const identity = createControlledWorkspaceGeoFeedAuthorityTransitionIdentity();
assert.equal(identity.expectedOwner, "workspace");
assert.ok(identity.activationControlledExecutionId);
ok("contract and identity preserve predecessor tips");

const rollback = createControlledWorkspaceGeoFeedAuthorityTransitionRollbackContract();
assert.equal(a.rollbackTargetPhase, "AW-R3");
assert.equal(a.rollbackMode, "metadata-gate-only");
assert.equal(a.rollbackPreservesGeoFeedIdentity, true);
assert.equal(a.rollbackPreservesRequestIdentity, true);
assert.equal(a.rollbackRestoresLegacyAuthority, true);
assert.equal(rollback.phase, "AW-R3");
assert.deepEqual([rollback.owner, rollback.writer, rollback.renderer], ["legacy", "legacy", "legacy"]);
assert.equal(rollback.issuancePipelineState, "CONTROLLED_EXECUTABLE");
assert.equal(rollback.issuanceTransactionState, "CONTROLLED_EXECUTION");
assert.deepEqual([rollback.mountCount, rollback.geoFeedRenderCount, rollback.unmountCount], [1, 1, 0]);
ok("rollback restores AW-R3 without identity loss");

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.allowed, false);
assert.equal(gate.currentStep, "AW-R5");
assert.equal(gate.eligibleStep, "AW-R6");
assert.ok(gate.blockers.includes(PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY) === false);
assert.ok(gate.blockers.includes(PHASE_AW_R5_PRODUCTION_READINESS_ONLY));
assert.equal(createControlledFeedHostContract().activeWriter, "workspace");
assert.equal(createControlledFeedHostContract().activeRenderOwner, "workspace");
assert.equal(createControlledFeedHostContract().nextEligibleStep, "AW-R6");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "AW-R6");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "AW-R6");
ok("live tip gate blocks Feed ON and points to AW-R6");

console.log(
  `\nadaptive-workspace AW-R4 GeoFeed authority transition: ${passed} assertion groups ok\n`,
);
