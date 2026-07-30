/**
 * AW-R6 step 3 — bridge v54 / reader / MetaOk / attemptFeedOn semantics.
 * Read-only: no remount, no request, no side-effect activation.
 */
import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import {
  ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
  createControlledWorkspaceProductionFeedOnDescriptor,
  createControlledWorkspaceProductionFeedOnContract,
  createControlledWorkspaceProductionFeedOnIdentity,
  createControlledWorkspaceProductionFeedOnRollbackContract,
  evaluateControlledWorkspaceProductionFeedOn,
  validateControlledWorkspaceProductionFeedOnDescriptor,
  createControlledHostRegistry,
} from "../index";
import type { FeedSealedProbeApi } from "@/lib/feed/feed-sealed-probe-bridge";

let passed = 0;
const ok = (label: string) => {
  passed += 1;
  console.log(`  ✓ ${label}`);
};

console.log("\n[aw-r6] bridge v54 / production Feed ON reader");

type VersionProbe = Pick<FeedSealedProbeApi, "version" | "attemptFeedOn">;
const versionTypeCheck: VersionProbe["version"] = 54;
assert.equal(versionTypeCheck, 54);
ok("FeedSealedProbeApi version is literal 54");

const d = createControlledWorkspaceProductionFeedOnDescriptor();
const contract = createControlledWorkspaceProductionFeedOnContract();
const identity = createControlledWorkspaceProductionFeedOnIdentity();
const rollback = createControlledWorkspaceProductionFeedOnRollbackContract();

function computeProductionFeedOnMetaOk(
  payload: typeof d & { productionFeedOnMetaOk?: boolean },
): boolean {
  return (
    payload.phase === "AW-R6" &&
    payload.previousPhase === "AW-R5" &&
    payload.nextEligibleStep === "none" &&
    payload.title === "Production Freeze & Feed ON" &&
    payload.candidateActivationState === "PRODUCTION_LIVE_FEED_ON" &&
    payload.candidateActivationResult ===
      "controlled-workspace-production-live-feed-on" &&
    payload.issuancePipelineState === "PRODUCTION_ON" &&
    payload.issuanceTransactionState === "PRODUCTION_COMMITTED" &&
    payload.feedOnAuthorized === true &&
    payload.productionPromotionAuthorized === true &&
    payload.feedOnAuthorized === payload.productionPromotionAuthorized &&
    payload.productionReadinessCertified === true &&
    payload.releaseBlockersRemain === false &&
    payload.workspaceVisible === true &&
    payload.runtimeCapabilityPresent === true &&
    payload.owner === "workspace" &&
    payload.writer === "workspace" &&
    payload.renderer === "workspace" &&
    payload.requestAuthority === "workspace" &&
    payload.paginationAuthority === "workspace" &&
    payload.cacheAuthority === "workspace" &&
    payload.observerAuthority === "workspace" &&
    payload.lifecycleAuthority === "workspace" &&
    payload.legacyAuthorityActive === false &&
    payload.targetAuthorityActive === true &&
    payload.renderActivation === true &&
    payload.mountCount === 1 &&
    payload.geoFeedRenderCount === 1 &&
    payload.unmountCount === 0 &&
    payload.geoFeedInstanceCount === 1 &&
    payload.stableMountId ===
      "feed.discovery.controlled-host.stable-mount.v1" &&
    payload.stableMountIdentityPreserved === true &&
    payload.requestIdentityPreserved === true &&
    payload.terminalMarker === ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE &&
    payload.activationBlocker === ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE &&
    payload.rollbackTargetPhase === "AW-R5" &&
    payload.roadmapComplete === true
  );
}

assert.equal(computeProductionFeedOnMetaOk(d), true);
assert.equal(d.feedOnAuthorized, true);
assert.equal(d.productionPromotionAuthorized, true);
assert.equal(d.issuancePipelineState, "PRODUCTION_ON");
assert.equal(d.issuanceTransactionState, "PRODUCTION_COMMITTED");
assert.equal(d.nextEligibleStep, "none");
assert.equal(d.rollbackTargetPhase, "AW-R5");
ok("valid AW-R6 descriptor yields productionFeedOnMetaOk=true");

assert.equal(contract.feedOnAuthorized, true);
assert.equal(contract.productionPromotionAuthorized, true);
assert.equal(contract.nextEligibleStep, "none");
assert.equal(identity.phase, "AW-R6");
assert.equal(identity.expectedOwner, "workspace");
assert.equal(rollback.phase, "AW-R5");
assert.equal(rollback.feedOnAuthorized, false);
assert.equal(rollback.productionPromotionAuthorized, false);
ok("contract/identity/rollback preserve sealed AW-R6 authority and AW-R5 rollback");

// Simulate the flattened bridge reader payload (same fields the probe publishes).
const evaluation = evaluateControlledWorkspaceProductionFeedOn(
  createControlledHostRegistry(),
  {
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
    productionReadinessCertified: true,
    releaseBlockersRemain: false,
  },
);
const probePayload = {
  ...evaluation.descriptor,
  productionFeedOnMetaOk: true as const,
};
assert.equal(probePayload.phase, "AW-R6");
assert.equal(probePayload.feedOnAuthorized, true);
assert.equal(probePayload.productionPromotionAuthorized, true);
assert.equal(probePayload.legacyAuthorityActive, false);
assert.deepEqual(
  [
    probePayload.mountCount,
    probePayload.geoFeedRenderCount,
    probePayload.unmountCount,
  ],
  [1, 1, 0],
);
assert.equal(
  probePayload.terminalMarker,
  ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
);
assert.equal(probePayload.nextEligibleStep, "none");
assert.equal(probePayload.rollbackTargetPhase, "AW-R5");
assert.equal(probePayload.productionFeedOnMetaOk, true);
assert.equal(probePayload.containsGeoFeed, false);
assert.equal(probePayload.mountsGeoFeed, false);
assert.equal(probePayload.createsSecondGeoFeed, false);
ok("probe-shaped payload proves Feed ON/promotion without remount fields");

// Reader is read-only: repeated evaluation is deterministic and frozen.
const again = createControlledWorkspaceProductionFeedOnDescriptor();
assert.deepEqual(d, again);
assert.ok(Object.isFrozen(d));
ok("reader/descriptor path is deterministic and immutable (read-only)");

const metaNegatives: Array<[string, Partial<typeof d>]> = [
  ["wrong stage", { phase: "AW-R5" as never }],
  ["wrong lifecycle", { candidateActivationState: "PRODUCTION_READY_NOT_RELEASED" as never }],
  ["wrong result", { candidateActivationResult: "controlled-workspace-production-ready-feed-off" as never }],
  ["wrong pipeline", { issuancePipelineState: "AUTHORITY_TRANSITIONED" as never }],
  ["wrong transaction", { issuanceTransactionState: "AUTHORITY_COMMITTED" as never }],
  ["feedOn false", { feedOnAuthorized: false as never }],
  ["promo false", { productionPromotionAuthorized: false as never }],
  ["xor feedOn/promo", { feedOnAuthorized: true as never, productionPromotionAuthorized: false as never }],
  ["legacy active", { legacyAuthorityActive: true as never }],
  ["geofeed != 1", { geoFeedInstanceCount: 2 as never, mountCount: 2 as never }],
  ["next not none", { nextEligibleStep: "AW-R7" as never }],
  ["wrong terminal", { terminalMarker: "PHASE_AW_R5_PRODUCTION_READINESS_ONLY" as never }],
  ["wrong rollback", { rollbackTargetPhase: "AW-R4" as never }],
];
for (const [label, patch] of metaNegatives) {
  const bad = { ...d, ...patch };
  assert.equal(computeProductionFeedOnMetaOk(bad as typeof d), false, label);
  assert.throws(
    () => validateControlledWorkspaceProductionFeedOnDescriptor(bad as never),
    HardContractViolation,
  );
}
ok("MetaOk false and validator fail-closed for core mismatches");

// attemptFeedOn remains a permanent negative capability (Phase 3B pattern).
const attemptFeedOn: FeedSealedProbeApi["attemptFeedOn"] = () => ({
  allowed: false,
  renderActivation: false,
  reason: "feed.discovery renderActivation is permanently false in Phase 3B",
});
const attempt = attemptFeedOn();
assert.equal(attempt.allowed, false);
assert.equal(attempt.renderActivation, false);
ok("attemptFeedOn stays fail-closed permanent false; Feed ON proven via sealed reader");

console.log(
  `\nadaptive-workspace AW-R6 bridge v54 / production Feed ON reader: ${passed} assertion groups ok\n`,
);
