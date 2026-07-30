import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createControlledFeedHostPlan } from "../sealed/controlled-feed-host-plan";
import { evaluateFeedHostActivationGate } from "../sealed/feed-host-activation-gate";
import {
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID,
  PHASE_AW_R5_PRODUCTION_READINESS_ONLY,
  createControlledWorkspaceProductionReadinessDescriptor,
  createControlledWorkspaceProductionReadinessRollbackContract,
  evaluateControlledWorkspaceProductionReadiness,
} from "../sealed/controlled-workspace-production-readiness";
import { ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE } from "../sealed/controlled-workspace-production-feed-on";
import { createControlledWorkspaceProductionReadinessContract } from "../sealed/controlled-workspace-production-readiness-contract";
import { createControlledWorkspaceProductionReadinessIdentity } from "../sealed/controlled-workspace-production-readiness-identity";
import { createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor } from "../sealed/controlled-workspace-geofeed-authority-transition";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";

let passed = 0;
const ok = (label: string) => {
  passed += 1;
  console.log(`  ✓ ${label}`);
};

console.log("\n[aw-r5] Production readiness certification");

const pred = createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor();
assert.equal(pred.phase, "AW-R4");
assert.equal(
  pred.candidateActivationState,
  "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON",
);
assert.deepEqual(
  [pred.owner, pred.writer, pred.renderer],
  ["workspace", "workspace", "workspace"],
);
assert.equal(pred.geoFeedAuthorityTransferred, true);
assert.equal(pred.renderActivation, true);
assert.equal(pred.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(pred.issuanceTransactionState, "AUTHORITY_COMMITTED");
ok("sealed AW-R4 predecessor is exact");

const a = createControlledWorkspaceProductionReadinessDescriptor();
const b = createControlledWorkspaceProductionReadinessDescriptor();
assert.deepEqual(a, b);
assert.ok(Object.isFrozen(a));
assert.equal(a.phase, "AW-R5");
assert.equal(a.previousPhase, "AW-R4");
assert.equal(a.nextEligibleStep, "AW-R6");
assert.equal(a.title, "Production Readiness");
assert.equal(a.candidateActivationState, "PRODUCTION_READY_NOT_RELEASED");
assert.equal(
  a.candidateActivationResult,
  "controlled-workspace-production-ready-feed-off",
);
ok("deterministic immutable AW-R5 identity");

assert.equal(a.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(a.issuanceTransactionState, "AUTHORITY_COMMITTED");
assert.deepEqual(
  [a.owner, a.writer, a.renderer],
  ["workspace", "workspace", "workspace"],
);
assert.deepEqual(
  [
    a.requestAuthority,
    a.paginationAuthority,
    a.cacheAuthority,
    a.observerAuthority,
    a.lifecycleAuthority,
  ],
  ["workspace", "workspace", "workspace", "workspace", "workspace"],
);
assert.equal(a.geoFeedAuthorityTransferred, true);
assert.equal(a.renderActivation, true);
ok("authority dimensions unchanged from AW-R4");

assert.equal(a.productionReadinessCertified, true);
assert.equal(a.architectureProductionReady, true);
assert.equal(a.releaseBlockersRemain, false);
assert.equal(a.readyForFinalActivation, true);
assert.equal(a.feedOnAuthorized, false);
assert.equal(a.productionPromotionAuthorized, false);
assert.deepEqual([a.mountCount, a.geoFeedRenderCount, a.unmountCount], [1, 1, 0]);
assert.equal(a.geoFeedInstanceCount, 1);
assert.equal(a.containsGeoFeed, false);
assert.equal(a.mountsGeoFeed, false);
assert.equal(a.wrapsGeoFeed, false);
assert.equal(a.duplicatesGeoFeed, false);
assert.equal(a.createsSecondGeoFeed, false);
ok("certification flags set while Feed ON stays closed and mount remains 1/1/0");

assert.equal(a.legacyAuthorityActive, false);
assert.equal(a.targetAuthorityActive, true);
assert.equal(a.authorityCommitBoundary, "COMMITTED");
assert.equal(a.dualOwnerForbidden, true);
assert.equal(a.dualWriterForbidden, true);
assert.equal(a.dualRendererForbidden, true);
assert.equal(a.stableMountIdentityPreserved, true);
assert.equal(a.requestIdentityPreserved, true);
assert.equal(a.feedStatePreserved, true);
ok("dual authority forbidden and identities preserved");

const validSeed = {
  activationExecutionAllowed: true,
  issuancePipelineExecutionAllowed: true,
  issuancePipelineExecutable: true,
  issuancePipelineState: "AUTHORITY_TRANSITIONED",
  issuanceTransactionState: "AUTHORITY_COMMITTED",
  workspaceVisible: true,
  workspaceHostMounted: true,
  workspaceCandidateRendered: true,
  workspaceReactInstancePresent: true,
  runtimeCapabilityPresent: true,
  runtimeHostInstancePresent: true,
  activationHandlePresent: true,
  executionHandlePresent: true,
  owner: "workspace",
  writer: "workspace",
  renderer: "workspace",
  requestAuthority: "workspace",
  paginationAuthority: "workspace",
  cacheAuthority: "workspace",
  observerAuthority: "workspace",
  lifecycleAuthority: "workspace",
  geoFeedAuthorityTransferred: true,
  renderActivation: true,
  feedOnAuthorized: false,
  productionPromotionAuthorized: false,
} as const;
for (const patch of [
  { activationExecutionAllowed: false },
  { issuancePipelineExecutionAllowed: false },
  { issuancePipelineExecutable: false },
  { issuancePipelineState: "CONTROLLED_EXECUTABLE" },
  { issuanceTransactionState: "CONTROLLED_EXECUTION" },
  { workspaceVisible: false },
  { workspaceHostMounted: false },
  { workspaceCandidateRendered: false },
  { workspaceReactInstancePresent: false },
  { runtimeCapabilityPresent: false },
  { runtimeHostInstancePresent: false },
  { activationHandlePresent: false },
  { executionHandlePresent: false },
  { owner: "legacy" },
  { writer: "legacy" },
  { renderer: "legacy" },
  { requestAuthority: "legacy" },
  { geoFeedAuthorityTransferred: false },
  { renderActivation: false },
  { feedOnAuthorized: true },
  { productionPromotionAuthorized: true },
]) {
  assert.throws(
    () =>
      evaluateControlledWorkspaceProductionReadiness(
        createControlledHostRegistry(),
        { ...validSeed, ...patch } as never,
      ),
    HardContractViolation,
  );
}
assert.throws(
  () => evaluateControlledWorkspaceProductionReadiness(createControlledHostRegistry()),
  HardContractViolation,
);
ok("duplicates, partial prerequisites and Feed ON fail closed");

const contract = createControlledWorkspaceProductionReadinessContract();
assert.equal(
  contract.contractId,
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
);
assert.equal(
  contract.activationProductionReadinessId,
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID,
);
assert.ok(contract.activationGeoFeedAuthorityTransitionId);
assert.ok(contract.activationControlledExecutionId);
assert.ok(contract.activationLiveAuthorizationId);
const identity = createControlledWorkspaceProductionReadinessIdentity();
assert.equal(identity.expectedOwner, "workspace");
assert.ok(identity.activationGeoFeedAuthorityTransitionId);
assert.ok(identity.activationProductionReadinessId);
ok("contract and identity preserve predecessor tips");

const rollback = createControlledWorkspaceProductionReadinessRollbackContract();
assert.equal(a.rollbackTargetPhase, "AW-R4");
assert.equal(a.rollbackMode, "metadata-gate-only");
assert.equal(a.rollbackPreservesGeoFeedIdentity, true);
assert.equal(a.rollbackPreservesRequestIdentity, true);
assert.equal(a.rollbackRestoresWorkspaceAuthority, true);
assert.equal(rollback.phase, "AW-R4");
assert.deepEqual(
  [rollback.owner, rollback.writer, rollback.renderer],
  ["workspace", "workspace", "workspace"],
);
assert.equal(rollback.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(rollback.issuanceTransactionState, "AUTHORITY_COMMITTED");
assert.equal(rollback.renderActivation, true);
assert.equal(rollback.geoFeedAuthorityTransferred, true);
assert.equal(rollback.feedOnAuthorized, false);
assert.deepEqual(
  [rollback.mountCount, rollback.geoFeedRenderCount, rollback.unmountCount],
  [1, 1, 0],
);
ok("rollback restores AW-R4 without identity loss");

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.allowed, false);
assert.equal(gate.currentStep, "AW-R6");
assert.equal(gate.eligibleStep, "none");
assert.ok(gate.blockers.includes(ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE));
assert.equal(createControlledFeedHostContract().activeWriter, "workspace");
assert.equal(createControlledFeedHostContract().activeRenderOwner, "workspace");
assert.equal(createControlledFeedHostContract().nextEligibleStep, "none");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "none");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "none");
ok("AW-R5 sealed next remains AW-R6; live tip gate is AW-R6→none");

console.log(
  `\nadaptive-workspace AW-R5 production readiness: ${passed} assertion groups ok\n`,
);
