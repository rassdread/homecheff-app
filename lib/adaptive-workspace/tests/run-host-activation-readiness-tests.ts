/**
 * Phase 3B.3.5 — host activation readiness unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationReadinessDescriptor,
  evaluateControlledHostActivationReadiness,
  validateControlledHostActivationReadinessDescriptor,
  createControlledHostActivationReadinessContract,
  validateControlledHostActivationReadinessContract,
  createFeedHostActivationReadinessIdentity,
  validateFeedHostActivationReadinessIdentity,
  createFeedHostActivationReadinessPreparedContract,
  validateFeedHostActivationReadinessPreparedContract,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
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

console.log("\n[phase3b35] activation readiness descriptor + engine");

{
  const a = createControlledHostActivationReadinessDescriptor();
  const b = createControlledHostActivationReadinessDescriptor();
  assert.equal(a.readinessState, "ready");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.renderActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.activationBlocker, PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY);
  assert.ok(a.readinessReasons.length >= 5);
  assert.ok(
    a.readinessBlockers.includes(PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY),
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("readiness descriptor deterministic + dormant");
}

{
  const evaluation = evaluateControlledHostActivationReadiness(
    createControlledHostRegistry(),
  );
  assert.equal(evaluation.descriptor.readinessState, "ready");
  assert.equal(evaluation.diagnostics.readinessSatisfied, true);
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.5");
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  assert.ok(evaluation.diagnostics.missingConditionsForActivation.length >= 1);
  ok("readiness engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationReadinessDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationReadinessDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationReadinessDescriptor({
        ...base,
        hostActivation: true,
      }),
    HardContractViolation,
  );
  ok("readiness descriptor fail-closed");
}

console.log("\n[phase3b35] contract + identity + activation safety");

{
  const c = createControlledHostActivationReadinessContract();
  assert.equal(c.readinessState, "ready");
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(c.schedulerAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationReadinessContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("readiness contract fail-closed");
}

{
  const id = createFeedHostActivationReadinessIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaReadinessAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationReadinessIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("readiness identity forbids activation/remount");
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
    phase3b35ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedRegistrationState: "registered",
    observedEligibilityState: "eligible",
    observedReadinessState: "ready",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.blockers.includes(PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY));
  assert.equal(gate.currentStep, "3B.3.7");
  assert.equal(gate.eligibleStep, "3B.3.8");
  ok("activation remains impossible");
}

{
  const host = createControlledFeedHostContract();
  const rollback = createFeedHostRollbackContract();
  const registry = createControlledHostRegistry();
  assert.equal(host.activeWriter, "legacy");
  assert.equal(host.activeRenderOwner, "legacy");
  assert.equal(host.hostActivation, false);
  assert.equal(registry.hostCount, 1);
  assert.equal(rollback.rollbackReadiness, "prepared-not-active");
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.readinessState, "ready");
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback unchanged");
}

{
  const ready = createFeedHostActivationReadinessPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b35/phase3b3-5-feed-host-activation-readiness-proof.json",
  });
  assert.equal(ready.status, "host-activation-readiness-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.6");
  assert.equal(ready.canStartActivation, false);
  assert.throws(
    () =>
      validateFeedHostActivationReadinessPreparedContract({
        ...ready,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  ok("prepared readiness fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.5 host activation readiness: ${passed} assertions ok\n`,
);
