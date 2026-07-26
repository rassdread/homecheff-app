/**
 * Phase 3B.3.6 — host shadow activation simulation unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostShadowActivationSimulationDescriptor,
  evaluateControlledHostShadowActivationSimulation,
  validateControlledHostShadowActivationSimulationDescriptor,
  createControlledHostShadowActivationSimulationContract,
  validateControlledHostShadowActivationSimulationContract,
  createFeedHostShadowActivationSimulationIdentity,
  validateFeedHostShadowActivationSimulationIdentity,
  createFeedHostShadowActivationSimulationPreparedContract,
  validateFeedHostShadowActivationSimulationPreparedContract,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
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
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY,
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

console.log("\n[phase3b36] shadow activation simulation descriptor + engine");

{
  const a = createControlledHostShadowActivationSimulationDescriptor();
  const b = createControlledHostShadowActivationSimulationDescriptor();
  assert.equal(a.simulationState, "completed");
  assert.equal(a.wouldActivate, true);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.renderActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  );
  assert.ok(a.simulationReasons.length >= 5);
  assert.ok(
    a.simulationBlockers.includes(
      PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
    ),
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("simulation descriptor deterministic + dry-run");
}

{
  const evaluation = evaluateControlledHostShadowActivationSimulation(
    createControlledHostRegistry(),
  );
  assert.equal(evaluation.descriptor.wouldActivate, true);
  assert.equal(evaluation.diagnostics.simulationCompleted, true);
  assert.equal(evaluation.diagnostics.wouldActivate, true);
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.6");
  assert.equal(evaluation.diagnostics.readinessStatus, "ready");
  assert.equal(evaluation.diagnostics.eligibilityStatus, "eligible");
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  ok("simulation engine + diagnostics metadata only");
}

{
  const base = createControlledHostShadowActivationSimulationDescriptor();
  assert.throws(
    () =>
      validateControlledHostShadowActivationSimulationDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostShadowActivationSimulationDescriptor({
        ...base,
        hostActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostShadowActivationSimulationDescriptor({
        ...base,
        wouldActivate: false,
      }),
    HardContractViolation,
  );
  ok("simulation descriptor fail-closed");
}

console.log("\n[phase3b36] contract + identity + activation safety");

{
  const c = createControlledHostShadowActivationSimulationContract();
  assert.equal(c.simulationState, "completed");
  assert.equal(c.wouldActivate, true);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(c.runtimeMutationAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostShadowActivationSimulationContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("simulation contract fail-closed");
}

{
  const id = createFeedHostShadowActivationSimulationIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaSimulationAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.runtimeMutationViaSimulationAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostShadowActivationSimulationIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("simulation identity forbids activation/remount");
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
    phase3b36ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedRegistrationState: "registered",
    observedEligibilityState: "eligible",
    observedReadinessState: "ready",
    observedSimulationState: "completed",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  });
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY),
  );
  assert.equal(gate.currentStep, "3B.3.34");
  assert.equal(gate.eligibleStep, "3B.3.35");
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
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.simulationState,
    "completed",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.wouldActivate, true);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback unchanged");
}

{
  const ready = createFeedHostShadowActivationSimulationPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b36/phase3b3-6-feed-host-shadow-activation-simulation-proof.json",
  });
  assert.equal(ready.status, "host-shadow-activation-simulation-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.7");
  assert.equal(ready.wouldActivate, true);
  assert.equal(ready.canStartActivation, false);
  assert.throws(
    () =>
      validateFeedHostShadowActivationSimulationPreparedContract({
        ...ready,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  ok("prepared simulation fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.6 shadow activation simulation: ${passed} assertions ok\n`,
);
