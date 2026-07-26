/**
 * Phase 3B.3.3 — host registry / registration / identity unit tests.
 */
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createControlledHostRegistry,
  validateControlledHostRegistry,
  createControlledHostRegistrationContract,
  validateControlledHostRegistrationContract,
  createFeedHostRegistrationIdentity,
  validateFeedHostRegistrationIdentity,
  createFeedHostRegistrationReadinessContract,
  validateFeedHostRegistrationReadinessContract,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_3_HOST_REGISTRATION_ONLY,
  PHASE_3B3_4_HOST_ELIGIBILITY_ONLY,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
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

console.log("\n[phase3b33] controlled host registry");

{
  const a = createControlledHostRegistry();
  const b = createControlledHostRegistry();
  assert.equal(a.hostCount, 1);
  assert.equal(a.hosts.length, 1);
  assert.equal(a.hosts[0].hostId, FEED_DISCOVERY_CONTROLLED_HOST_ID);
  assert.equal(a.hosts[0].runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hosts[0].registrationState, "registered");
  assert.equal(a.hosts[0].owner, "legacy");
  assert.equal(a.hosts[0].writer, "legacy");
  assert.equal(a.hosts[0].renderer, "legacy");
  assert.equal(a.hosts[0].hostActivation, false);
  assert.equal(a.hosts[0].renderActivation, false);
  assert.equal(a.containsRuntimeObjects, false);
  assert.equal(a.containsReactInstances, false);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("registry has exactly one registered legacy host (metadata only)");
}

{
  const base = createControlledHostRegistry();
  assert.throws(
    () =>
      validateControlledHostRegistry({
        ...base,
        hostCount: 2,
        hosts: [base.hosts[0], base.hosts[0]],
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostRegistry({
        ...base,
        containsReactInstances: true,
      }),
    HardContractViolation,
  );
  ok("registry integrity fail-closed");
}

console.log("\n[phase3b33] registration + identity + activation");

{
  const c = createControlledHostRegistrationContract();
  assert.equal(c.registrationState, "registered");
  assert.equal(c.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(c.hostActivation, false);
  assert.equal(c.renderActivation, false);
  assert.equal(c.activationRestriction, PHASE_3B3_3_HOST_REGISTRATION_ONLY);
  assert.throws(
    () =>
      validateControlledHostRegistrationContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("registration contract fail-closed");
}

{
  const id = createFeedHostRegistrationIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.expectedUnmountCount, 0);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(id.runtimeIdTransitionAllowed, false);
  assert.equal(id.identityTransitionAllowed, false);
  assert.throws(
    () =>
      validateFeedHostRegistrationIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("registration identity forbids remount/runtimeId transition");
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
    phase3b33ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedRegistrationState: "registered",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.blockers.includes(PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY));
  assert.equal(gate.currentStep, "3B.3.25");
  assert.equal(gate.eligibleStep, "3B.3.26");
  ok("activation remains impossible");
}

{
  const host = createControlledFeedHostContract();
  const rollback = createFeedHostRollbackContract();
  assert.equal(host.activeWriter, "legacy");
  assert.equal(host.activeRenderOwner, "legacy");
  assert.equal(host.hostActivation, false);
  assert.equal(rollback.rollbackReadiness, "prepared-not-active");
  ok("writer/owner/renderer/rollback unchanged");
}

console.log("\n[phase3b33] shell + homepage");

{
  const contract = createControlledFeedHostContract();
  const registry = createControlledHostRegistry();
  const html = renderToStaticMarkup(
    createElement(FeedControlledHostShell, {
      contract,
      hostDescriptor: registry.hosts[0],
    }),
  );
  assert.equal(html, "");
  ok("shell remains SSR null with host descriptor");
}

{
  const home = readFileSync(
    join(process.cwd(), "components/home/HomePageClient.tsx"),
    "utf8",
  );
  assert.equal((home.match(/<GeoFeed\b/g) ?? []).length, 1);
  assert.ok(home.includes("createFeedDiscoveryControlledHostDescriptor"));
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.registrationState,
    "registered",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.runtimeId,
    FEED_DISCOVERY_STABLE_RUNTIME_ID,
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.eligibilityState, "eligible");
  ok("homepage single mount + registration metadata");
}

{
  const ready = createFeedHostRegistrationReadinessContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b33/phase3b3-3-feed-host-registration-proof.json",
  });
  assert.equal(ready.status, "host-registration-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.4");
  assert.throws(
    () =>
      validateFeedHostRegistrationReadinessContract({
        ...ready,
        hostActivation: true,
      }),
    HardContractViolation,
  );
  ok("readiness fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.3 host registration: ${passed} assertions ok\n`,
);
