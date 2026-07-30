/**
 * AW-R6 sealed production Feed ON — dedicated unit tests.
 */
import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createControlledFeedHostPlan } from "../sealed/controlled-feed-host-plan";
import { evaluateFeedHostActivationGate } from "../sealed/feed-host-activation-gate";
import {
  ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
  CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID,
  CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID,
  createControlledWorkspaceProductionFeedOnDescriptor,
  createControlledWorkspaceProductionFeedOnRollbackContract,
  evaluateControlledWorkspaceProductionFeedOn,
} from "../sealed/controlled-workspace-production-feed-on";
import { createControlledWorkspaceProductionFeedOnContract } from "../sealed/controlled-workspace-production-feed-on-contract";
import { createControlledWorkspaceProductionFeedOnIdentity } from "../sealed/controlled-workspace-production-feed-on-identity";
import { createControlledWorkspaceProductionReadinessDescriptor } from "../sealed/controlled-workspace-production-readiness";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";

let passed = 0;
const ok = (label: string) => {
  passed += 1;
  console.log(`  ✓ ${label}`);
};

console.log("\n[aw-r6] Production Freeze & Feed ON");

const pred = createControlledWorkspaceProductionReadinessDescriptor();
assert.equal(pred.phase, "AW-R5");
assert.equal(pred.candidateActivationState, "PRODUCTION_READY_NOT_RELEASED");
assert.equal(pred.feedOnAuthorized, false);
assert.equal(pred.productionPromotionAuthorized, false);
assert.equal(pred.productionReadinessCertified, true);
assert.equal(pred.releaseBlockersRemain, false);
assert.equal(pred.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(pred.issuanceTransactionState, "AUTHORITY_COMMITTED");
ok("sealed AW-R5 predecessor is exact");

const a = createControlledWorkspaceProductionFeedOnDescriptor();
const b = createControlledWorkspaceProductionFeedOnDescriptor();
assert.deepEqual(a, b);
assert.ok(Object.isFrozen(a));
assert.equal(a.phase, "AW-R6");
assert.equal(a.previousPhase, "AW-R5");
assert.equal(a.nextEligibleStep, "none");
assert.equal(a.title, "Production Freeze & Feed ON");
assert.equal(a.candidateActivationState, "PRODUCTION_LIVE_FEED_ON");
assert.equal(
  a.candidateActivationResult,
  "controlled-workspace-production-live-feed-on",
);
assert.equal(a.terminalMarker, ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE);
assert.equal(a.roadmapComplete, true);
ok("deterministic immutable AW-R6 identity");

assert.equal(a.issuancePipelineState, "PRODUCTION_ON");
assert.equal(a.issuanceTransactionState, "PRODUCTION_COMMITTED");
assert.equal(a.feedOnAuthorized, true);
assert.equal(a.productionPromotionAuthorized, true);
assert.deepEqual([a.owner, a.writer, a.renderer], ["workspace", "workspace", "workspace"]);
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
ok("Feed ON and promotion commit atomically with production pipeline/tx");

assert.equal(a.productionReadinessCertified, true);
assert.equal(a.releaseBlockersRemain, false);
assert.equal(a.renderActivation, true);
assert.equal(a.legacyAuthorityActive, false);
assert.equal(a.targetAuthorityActive, true);
assert.deepEqual([a.mountCount, a.geoFeedRenderCount, a.unmountCount], [1, 1, 0]);
assert.equal(a.geoFeedInstanceCount, 1);
assert.equal(a.stableMountIdentityPreserved, true);
assert.equal(a.requestIdentityPreserved, true);
assert.equal(a.containsGeoFeed, false);
assert.equal(a.createsSecondGeoFeed, false);
ok("authority and GeoFeed 1/1/0 preserved; Feed ON via sealed state only");

const seed = {
  activationExecutionAllowed: true as const,
  issuancePipelineExecutionAllowed: true as const,
  issuancePipelineExecutable: true as const,
  issuancePipelineState: "AUTHORITY_TRANSITIONED" as const,
  issuanceTransactionState: "AUTHORITY_COMMITTED" as const,
  workspaceVisible: true as const,
  workspaceHostMounted: true as const,
  workspaceCandidateRendered: true as const,
  workspaceReactInstancePresent: true as const,
  runtimeCapabilityPresent: true as const,
  runtimeHostInstancePresent: true as const,
  activationHandlePresent: true as const,
  executionHandlePresent: true as const,
  owner: "workspace" as const,
  writer: "workspace" as const,
  renderer: "workspace" as const,
  requestAuthority: "workspace" as const,
  paginationAuthority: "workspace" as const,
  cacheAuthority: "workspace" as const,
  observerAuthority: "workspace" as const,
  lifecycleAuthority: "workspace" as const,
  geoFeedAuthorityTransferred: true as const,
  renderActivation: true as const,
  feedOnAuthorized: false as const,
  productionPromotionAuthorized: false as const,
  productionReadinessCertified: true as const,
  releaseBlockersRemain: false as const,
};
for (const patch of [
  { feedOnAuthorized: true },
  { productionPromotionAuthorized: true },
  { productionReadinessCertified: false },
  { releaseBlockersRemain: true },
  { owner: "legacy" },
  { issuancePipelineState: "PRODUCTION_ON" },
  { issuanceTransactionState: "PRODUCTION_COMMITTED" },
  { renderActivation: false },
]) {
  assert.throws(
    () =>
      evaluateControlledWorkspaceProductionFeedOn(createControlledHostRegistry(), {
        ...seed,
        ...patch,
      } as never),
    HardContractViolation,
  );
}
assert.throws(
  () => evaluateControlledWorkspaceProductionFeedOn(createControlledHostRegistry()),
  HardContractViolation,
);
ok("partials, early Feed ON and incomplete predecessor fail closed");

const contract = createControlledWorkspaceProductionFeedOnContract();
assert.equal(contract.contractId, CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID);
assert.equal(contract.activationProductionFeedOnId, CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID);
assert.ok(contract.activationProductionReadinessId);
const identity = createControlledWorkspaceProductionFeedOnIdentity();
assert.equal(identity.phase, "AW-R6");
assert.equal(identity.expectedOwner, "workspace");
ok("contract and identity preserve predecessor tips");

const rollback = createControlledWorkspaceProductionFeedOnRollbackContract();
assert.equal(a.rollbackTargetPhase, "AW-R5");
assert.equal(rollback.phase, "AW-R5");
assert.equal(rollback.feedOnAuthorized, false);
assert.equal(rollback.productionPromotionAuthorized, false);
assert.equal(rollback.issuancePipelineState, "AUTHORITY_TRANSITIONED");
assert.equal(rollback.issuanceTransactionState, "AUTHORITY_COMMITTED");
assert.deepEqual([rollback.mountCount, rollback.geoFeedRenderCount, rollback.unmountCount], [1, 1, 0]);
ok("rollback restores AW-R5 without identity loss");

const gate = evaluateFeedHostActivationGate();
assert.equal(gate.allowed, false);
assert.equal(gate.currentStep, "AW-R6");
assert.equal(gate.eligibleStep, "none");
assert.ok(gate.blockers.includes(ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE));
assert.equal(createControlledFeedHostContract().nextEligibleStep, "none");
assert.equal(createControlledFeedHostPlan().recommendedNextStep, "none");
assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "none");
ok("AW-R6 tip gate is terminal (none) with roadmap-complete blocker");

console.log(
  `\nadaptive-workspace AW-R6 production Feed ON: ${passed} assertion groups ok\n`,
);
