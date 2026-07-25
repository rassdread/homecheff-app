/**
 * Phase 3B.3.7 — host activation decision unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationDecisionDescriptor,
  evaluateControlledHostActivationDecision,
  validateControlledHostActivationDecisionDescriptor,
  createControlledHostActivationDecisionContract,
  validateControlledHostActivationDecisionContract,
  createFeedHostActivationDecisionIdentity,
  validateFeedHostActivationDecisionIdentity,
  createFeedHostActivationDecisionPreparedContract,
  validateFeedHostActivationDecisionPreparedContract,
  CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
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

console.log("\n[phase3b37] activation decision descriptor + engine");

{
  const a = createControlledHostActivationDecisionDescriptor();
  const b = createControlledHostActivationDecisionDescriptor();
  assert.equal(a.decisionState, "completed");
  assert.equal(a.decisionResult, "ALLOW");
  assert.equal(a.wouldActivate, true);
  assert.equal(a.confidence, "high");
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.activationBlocker, PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY);
  assert.deepEqual(
    [...a.decisionInputSources],
    [...CONTROLLED_HOST_ACTIVATION_DECISION_INPUT_SOURCES],
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("decision descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationDecision(
    createControlledHostRegistry(),
  );
  assert.equal(evaluation.descriptor.decisionResult, "ALLOW");
  assert.equal(evaluation.diagnostics.decisionCompleted, true);
  assert.equal(evaluation.diagnostics.wouldActivate, true);
  assert.equal(evaluation.diagnostics.confidence, "high");
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.7");
  assert.equal(evaluation.diagnostics.simulationStatus, "completed");
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  ok("decision engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationDecisionDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationDecisionDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationDecisionDescriptor({
        ...base,
        decisionResult: "DENY",
      }),
    HardContractViolation,
  );
  ok("decision descriptor fail-closed");
}

console.log("\n[phase3b37] contract + identity + activation safety");

{
  const c = createControlledHostActivationDecisionContract();
  assert.equal(c.decisionResult, "ALLOW");
  assert.equal(c.wouldActivate, true);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(c.runtimeMutationAllowed, false);
  assert.equal(c.activationRestriction, PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY);
  assert.throws(
    () =>
      validateControlledHostActivationDecisionContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("decision contract fail-closed");
}

{
  const id = createFeedHostActivationDecisionIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaDecisionAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationDecisionIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("decision identity forbids activation/remount");
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
    phase3b37ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedRegistrationState: "registered",
    observedEligibilityState: "eligible",
    observedReadinessState: "ready",
    observedSimulationState: "completed",
    observedDecisionState: "completed",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  });
  assert.equal(gate.allowed, false);
  assert.ok(gate.blockers.includes(PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY));
  assert.equal(gate.currentStep, "3B.3.23");
  assert.equal(gate.eligibleStep, "3B.3.24");
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
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.decisionState, "completed");
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.decisionResult, "ALLOW");
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback unchanged");
}

{
  const ready = createFeedHostActivationDecisionPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b37/phase3b3-7-feed-host-activation-decision-proof.json",
  });
  assert.equal(ready.status, "host-activation-decision-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.8");
  assert.equal(ready.decisionResult, "ALLOW");
  assert.equal(ready.canStartActivation, false);
  assert.throws(
    () =>
      validateFeedHostActivationDecisionPreparedContract({
        ...ready,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  ok("prepared decision fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.7 host activation decision: ${passed} assertions ok\n`,
);
