/**
 * Phase 3B.3.13 — host activation state machine unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationStateMachineDescriptor,
  evaluateControlledHostActivationStateMachine,
  validateControlledHostActivationStateMachineDescriptor,
  createControlledHostActivationStateMachineContract,
  validateControlledHostActivationStateMachineContract,
  createFeedHostActivationStateMachineIdentity,
  validateFeedHostActivationStateMachineIdentity,
  createFeedHostActivationStateMachinePreparedContract,
  validateFeedHostActivationStateMachinePreparedContract,
  CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
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

console.log("\n[phase3b313] activation state machine descriptor + engine");

{
  const a = createControlledHostActivationStateMachineDescriptor();
  const b = createControlledHostActivationStateMachineDescriptor();
  assert.equal(a.machineState, "completed");
  assert.equal(a.machineResult, "state-machine-complete-not-executable");
  assert.equal(a.currentState, "COMMIT_READY");
  assert.equal(a.initialState, "LEGACY_DORMANT");
  assert.equal(a.transitionExecuted, false);
  assert.equal(a.protocolExecuted, false);
  assert.equal(a.transactionCommitted, false);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  );
  assert.ok(a.terminalStates.includes("ACTIVE"));
  assert.ok(a.blockedTransitions.includes("COMMIT_READY->ACTIVE"));
  assert.deepEqual(
    [...a.allowedTransitions],
    [...CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS],
  );
  assert.deepEqual(
    [...a.blockedTransitions],
    [...CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS],
  );
  assert.deepEqual(
    [...a.transitionGuards],
    [...CONTROLLED_HOST_ACTIVATION_TRANSITION_GUARDS],
  );
  assert.deepEqual(
    [...a.transitionPreconditions],
    [...CONTROLLED_HOST_ACTIVATION_TRANSITION_PRECONDITIONS],
  );
  assert.deepEqual(
    [...a.transitionValidationPoints],
    [...CONTROLLED_HOST_ACTIVATION_TRANSITION_VALIDATION_POINTS],
  );
  assert.deepEqual(
    [...a.machineInputSources],
    [...CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_INPUT_SOURCES],
  );
  assert.equal(a.invariants.length, 20);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("state machine descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationStateMachine(
    createControlledHostRegistry(),
  );
  assert.equal(
    evaluation.descriptor.machineResult,
    "state-machine-complete-not-executable",
  );
  assert.equal(evaluation.diagnostics.machineCompleted, true);
  assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.transitionExecuted, false);
  assert.equal(evaluation.diagnostics.protocolExecuted, false);
  assert.equal(evaluation.diagnostics.transactionCommitted, false);
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.activeUnreachable, true);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.13");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.14");
  assert.equal(
    evaluation.diagnostics.allowedTransitionCount,
    CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS.length,
  );
  assert.equal(
    evaluation.diagnostics.blockedTransitionCount,
    CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS.length,
  );
  ok("state machine engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationStateMachineDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationStateMachineDescriptor({
        ...base,
        transitionExecuted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationStateMachineDescriptor({
        ...base,
        currentState: "ACTIVE" as unknown as "COMMIT_READY",
      }),
    HardContractViolation,
  );
  ok("state machine descriptor fail-closed");
}

console.log("\n[phase3b313] contract + identity + activation safety");

{
  const c = createControlledHostActivationStateMachineContract();
  assert.equal(c.machineResult, "state-machine-complete-not-executable");
  assert.equal(c.currentState, "COMMIT_READY");
  assert.equal(c.transitionExecuted, false);
  assert.equal(c.protocolExecuted, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.transitionExecutionAllowed, false);
  assert.equal(c.commitAllowed, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationStateMachineContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("state machine contract fail-closed");
}

{
  const id = createFeedHostActivationStateMachineIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.transitionExecutionViaStateMachineAllowed, false);
  assert.equal(id.activationViaStateMachineAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationStateMachineIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("state machine identity forbids transition/activation");
}

{
  const gate = evaluateFeedHostActivationGate({
    forceHostActivation: true,
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
    phase3b310ProofValid: true,
    phase3b311ProofValid: true,
    phase3b312ProofValid: true,
    phase3b313ProofValid: true,
    phase3b314ProofValid: true,
    phase3b315ProofValid: true,
    phase3b316ProofValid: true,
    phase3b317ProofValid: true,
    phase3b318ProofValid: true,
    phase3b319ProofValid: true,
    phase3b320ProofValid: true,
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
    observedTransactionState: "completed",
    observedCommitReadinessState: "completed",
    observedCommitProtocolState: "completed",
    observedStateMachineState: "completed",
    observedTransitionGraphState: "completed",
  observedTransitionSelectionState: "completed",
    observedTransitionPreflightState: "completed",
    observedTransitionAuthorizationDecisionState: "completed",
    observedTransitionAuthorizationGrantReadinessState: "completed",
    observedTransitionAuthorizationGrantIssuanceDecisionState: "completed",
    observedTransitionAuthorizationGrantIssuancePlanState: "completed",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  });
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY),
  );
  assert.equal(gate.currentStep, "3B.3.41");
  assert.equal(gate.eligibleStep, "3B.3.42");
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
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.stateMachineState,
    "completed",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.currentActivationLifecycleState,
    "COMMIT_READY",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionExecuted, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.protocolExecuted, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback/state-machine unchanged");
}

{
  const ready = createFeedHostActivationStateMachinePreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b313/phase3b3-13-feed-host-activation-state-machine-proof.json",
    allowedTransitionCount: CONTROLLED_HOST_ACTIVATION_ALLOWED_TRANSITIONS.length,
    blockedTransitionCount: CONTROLLED_HOST_ACTIVATION_BLOCKED_TRANSITIONS.length,
  });
  assert.equal(ready.status, "host-activation-state-machine-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.14");
  assert.equal(ready.currentState, "COMMIT_READY");
  assert.equal(ready.transitionExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationStateMachinePreparedContract({
        ...ready,
        transitionExecuted: true,
      }),
    HardContractViolation,
  );
  ok("prepared state machine fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.13 host activation state machine: ${passed} assertions ok\n`,
);
