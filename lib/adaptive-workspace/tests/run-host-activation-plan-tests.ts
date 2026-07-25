/**
 * Phase 3B.3.8 — host activation plan unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationPlanDescriptor,
  evaluateControlledHostActivationPlan,
  validateControlledHostActivationPlanDescriptor,
  createControlledHostActivationPlanContract,
  validateControlledHostActivationPlanContract,
  createFeedHostActivationPlanIdentity,
  validateFeedHostActivationPlanIdentity,
  createFeedHostActivationPlanPreparedContract,
  validateFeedHostActivationPlanPreparedContract,
  CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_PLAN_STEPS,
  CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS,
  CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY,
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

console.log("\n[phase3b38] activation plan descriptor + engine");

{
  const a = createControlledHostActivationPlanDescriptor();
  const b = createControlledHostActivationPlanDescriptor();
  assert.equal(a.planState, "completed");
  assert.equal(a.planResult, "plan-complete-not-executable");
  assert.equal(a.decisionResult, "ALLOW");
  assert.equal(a.wouldActivate, true);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.activationBlocker, PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY);
  assert.deepEqual([...a.plannedSteps], [...CONTROLLED_HOST_ACTIVATION_PLAN_STEPS]);
  assert.deepEqual(
    [...a.preconditions],
    [...CONTROLLED_HOST_ACTIVATION_PLAN_PRECONDITIONS],
  );
  assert.deepEqual(
    [...a.rollbackCheckpoints],
    [...CONTROLLED_HOST_ACTIVATION_PLAN_ROLLBACK_CHECKPOINTS],
  );
  assert.deepEqual(
    [...a.abortConditions],
    [...CONTROLLED_HOST_ACTIVATION_PLAN_ABORT_CONDITIONS],
  );
  assert.deepEqual(
    [...a.planInputSources],
    [...CONTROLLED_HOST_ACTIVATION_PLAN_INPUT_SOURCES],
  );
  assert.equal(a.invariants.length, 20);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("plan descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationPlan(
    createControlledHostRegistry(),
  );
  assert.equal(evaluation.descriptor.planResult, "plan-complete-not-executable");
  assert.equal(evaluation.diagnostics.planCompleted, true);
  assert.equal(evaluation.diagnostics.wouldActivate, true);
  assert.equal(
    evaluation.diagnostics.plannedStepCount,
    CONTROLLED_HOST_ACTIVATION_PLAN_STEPS.length,
  );
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.8");
  assert.equal(evaluation.diagnostics.decisionStatus, "completed");
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  ok("plan engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationPlanDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationPlanDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationPlanDescriptor({
        ...base,
        plannedSteps: [...CONTROLLED_HOST_ACTIVATION_PLAN_STEPS].reverse(),
      }),
    HardContractViolation,
  );
  ok("plan descriptor fail-closed");
}

console.log("\n[phase3b38] contract + identity + activation safety");

{
  const c = createControlledHostActivationPlanContract();
  assert.equal(c.planResult, "plan-complete-not-executable");
  assert.equal(c.wouldActivate, true);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(c.schedulerAllowed, false);
  assert.equal(c.runtimeMutationAllowed, false);
  assert.equal(c.activationRestriction, PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY);
  assert.throws(
    () =>
      validateControlledHostActivationPlanContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("plan contract fail-closed");
}

{
  const id = createFeedHostActivationPlanIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaPlanAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.executorViaPlanAllowed, false);
  assert.equal(id.schedulerViaPlanAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationPlanIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("plan identity forbids activation/remount");
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
    phase3b38ProofValid: true,
    phase3b39ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRollbackTarget: "legacy",
    observedRegistrationState: "registered",
    observedEligibilityState: "eligible",
    observedReadinessState: "ready",
    observedSimulationState: "completed",
    observedDecisionState: "completed",
    observedPlanState: "completed",
    observedPipelineState: "completed",
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
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.planState, "completed");
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.planResult,
    "plan-complete-not-executable",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback unchanged");
}

{
  const ready = createFeedHostActivationPlanPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b38/phase3b3-8-feed-host-activation-plan-proof.json",
    plannedStepCount: CONTROLLED_HOST_ACTIVATION_PLAN_STEPS.length,
  });
  assert.equal(ready.status, "host-activation-plan-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.9");
  assert.equal(ready.planResult, "plan-complete-not-executable");
  assert.equal(ready.canStartActivation, false);
  assert.throws(
    () =>
      validateFeedHostActivationPlanPreparedContract({
        ...ready,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  ok("prepared plan fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.8 host activation plan: ${passed} assertions ok\n`,
);
