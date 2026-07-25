/**
 * Phase 3B.3.2 — shadow placement / identity / activation safety unit tests.
 */
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledFeedHostContract,
  createControlledFeedHostShadowPlacement,
  validateControlledFeedHostShadowPlacement,
  createFeedHostShadowPlacementIdentity,
  validateFeedHostShadowPlacementIdentity,
  createFeedShadowPlacementReadinessContract,
  validateFeedShadowPlacementReadinessContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_2_SHADOW_PLACEMENT_ONLY,
  PHASE_3B3_3_HOST_REGISTRATION_ONLY,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  createFeedHostRollbackContract,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";
import FeedControlledHostShell from "@/components/adaptive-workspace/FeedControlledHostShell";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b32] shadow placement contract");

{
  const a = createControlledFeedHostShadowPlacement();
  const b = createControlledFeedHostShadowPlacement();
  assert.equal(a.phase, "3B.3.2");
  assert.equal(a.placementState, "shadow-registered");
  assert.equal(a.placementMode, "sibling-after-legacy-mount");
  assert.equal(a.hostActivation, false);
  assert.equal(a.renderActivation, false);
  assert.equal(a.activeWriter, "legacy");
  assert.equal(a.activeRenderOwner, "legacy");
  assert.equal(a.nextEligibleStep, "3B.3.3");
  assert.equal(a.activationBlocker, PHASE_3B3_2_SHADOW_PLACEMENT_ONLY);
  assert.equal(a.registrationVisibleInMetadata, true);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("shadow placement deterministic + dormant");
}

{
  const base = createControlledFeedHostShadowPlacement();
  assert.throws(
    () =>
      validateControlledFeedHostShadowPlacement({
        ...base,
        hostActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostShadowPlacement({
        ...base,
        placementMode: "wrap-legacy-mount",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledFeedHostShadowPlacement({
        ...base,
        remountPolicy: "allowed",
      }),
    HardContractViolation,
  );
  ok("shadow placement fail-closed");
}

console.log("\n[phase3b32] identity + activation safety");

{
  const id = createFeedHostShadowPlacementIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.expectedUnmountCount, 0);
  assert.equal(id.expectedRendererRegistrationCount, 0);
  assert.equal(id.identityTransitionAllowed, false);
  assert.throws(
    () =>
      validateFeedHostShadowPlacementIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("identity contract forbids remount/transition");
}

{
  const gate = evaluateFeedHostActivationGate({
    forceHostActivation: true,
    envHostActivation: true,
    queryHostActivation: true,
    cookieHostActivation: true,
    localStorageHostActivation: true,
    sessionStorageHostActivation: true,
    contextHostActivation: true,
    globalHostActivation: true,
    featureFlagHostActivation: true,
    debugOverrideHostActivation: true,
    phase3b2ProofValid: true,
    phase3b2FreezeValid: true,
    phase3b32ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedShadowPlacementState: "shadow-registered",
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.blockers.includes(PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY));
  assert.equal(gate.currentStep, "3B.3.14");
  assert.equal(gate.eligibleStep, "3B.3.15");
  ok("activation remains impossible under all override channels");
}

{
  const host = createControlledFeedHostContract();
  const rollback = createFeedHostRollbackContract();
  assert.equal(host.hostActivation, false);
  assert.equal(host.renderActivation, false);
  assert.equal(host.activeWriter, "legacy");
  assert.equal(host.activeRenderOwner, "legacy");
  assert.equal(rollback.rollbackReadiness, "prepared-not-active");
  assert.equal(rollback.rollbackTarget, "legacy");
  ok("writer/renderer/rollback unchanged");
}

console.log("\n[phase3b32] shell placement + homepage identity");

{
  const contract = createControlledFeedHostContract();
  const placement = createControlledFeedHostShadowPlacement();
  const html = renderToStaticMarkup(
    createElement(FeedControlledHostShell, { contract, placement }),
  );
  assert.equal(html, "");
  ok("shell remains SSR null with placement props");
}

{
  const home = readFileSync(
    join(process.cwd(), "components/home/HomePageClient.tsx"),
    "utf8",
  );
  assert.equal((home.match(/<GeoFeed\b/g) ?? []).length, 1);
  const geoIdx = home.indexOf("<GeoFeed");
  const shellIdx = home.indexOf("<FeedControlledHostShell");
  assert.ok(shellIdx > geoIdx);
  assert.doesNotMatch(home, /key=\{[^}]*GeoFeed|key=\{[^}]*feed/i);
  assert.doesNotMatch(home, /createPortal/);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.shadowPlacementState, "shadow-registered");
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.rendererRegistered, false);
  ok("homepage: single GeoFeed + shell sibling after; no lifecycle keys");
}

{
  const ready = createFeedShadowPlacementReadinessContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b32/phase3b3-2-feed-shadow-placement-proof.json",
  });
  assert.equal(ready.status, "shadow-placement-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.3");
  assert.throws(
    () =>
      validateFeedShadowPlacementReadinessContract({
        ...ready,
        hostActivation: true,
      }),
    HardContractViolation,
  );
  ok("readiness contract fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.2 shadow placement: ${passed} assertions ok\n`,
);
