/**
 * Phase 3B.3.4 — host eligibility unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostEligibilityDescriptor,
  evaluateControlledHostEligibility,
  validateControlledHostEligibilityDescriptor,
  createControlledHostEligibilityContract,
  validateControlledHostEligibilityContract,
  createFeedHostEligibilityIdentity,
  validateFeedHostEligibilityIdentity,
  createFeedHostEligibilityReadinessContract,
  validateFeedHostEligibilityReadinessContract,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
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
  PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log("\n[phase3b34] eligibility descriptor + engine");

{
  const a = createControlledHostEligibilityDescriptor();
  const b = createControlledHostEligibilityDescriptor();
  assert.equal(a.eligibilityState, "eligible");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.renderActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.activationBlocker, PHASE_3B3_4_HOST_ELIGIBILITY_ONLY);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("eligibility descriptor deterministic + dormant");
}

{
  const evaluation = evaluateControlledHostEligibility(
    createControlledHostRegistry(),
  );
  assert.equal(evaluation.descriptor.eligibilityState, "eligible");
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.runtimeIdStable, true);
  ok("eligibility engine evaluates metadata only");
}

{
  const base = createControlledHostEligibilityDescriptor();
  assert.throws(
    () =>
      validateControlledHostEligibilityDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostEligibilityDescriptor({
        ...base,
        hostActivation: true,
      }),
    HardContractViolation,
  );
  ok("eligibility descriptor fail-closed");
}

console.log("\n[phase3b34] contract + identity + activation safety");

{
  const c = createControlledHostEligibilityContract();
  assert.equal(c.eligibilityState, "eligible");
  assert.equal(c.canStartActivation, false);
  assert.equal(c.activationRestriction, PHASE_3B3_4_HOST_ELIGIBILITY_ONLY);
  assert.throws(
    () =>
      validateControlledHostEligibilityContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("eligibility contract fail-closed");
}

{
  const id = createFeedHostEligibilityIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaEligibilityAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostEligibilityIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("eligibility identity forbids activation/remount");
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
    phase3b34ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedRegistrationState: "registered",
    observedEligibilityState: "eligible",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.blockers.includes(PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY));
  assert.equal(gate.currentStep, "3B.3.28");
  assert.equal(gate.eligibleStep, "3B.3.29");
  ok("activation remains impossible");
}

{
  const host = createControlledFeedHostContract();
  const rollback = createFeedHostRollbackContract();
  const registry = createControlledHostRegistry();
  assert.equal(host.activeWriter, "legacy");
  assert.equal(host.activeRenderOwner, "legacy");
  assert.equal(registry.hostCount, 1);
  assert.equal(rollback.rollbackReadiness, "prepared-not-active");
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.eligibilityState, "eligible");
  ok("owner/writer/renderer/registry/rollback unchanged");
}

{
  const ready = createFeedHostEligibilityReadinessContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b34/phase3b3-4-feed-host-eligibility-proof.json",
  });
  assert.equal(ready.status, "host-eligibility-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.5");
  assert.throws(
    () =>
      validateFeedHostEligibilityReadinessContract({
        ...ready,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  ok("readiness fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.4 host eligibility: ${passed} assertions ok\n`,
);
