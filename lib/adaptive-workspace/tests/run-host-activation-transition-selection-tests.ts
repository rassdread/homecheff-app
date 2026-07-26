/**
 * Phase 3B.3.15 — host activation transition selection unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransitionSelectionDescriptor,
  evaluateControlledHostActivationTransitionSelection,
  validateControlledHostActivationTransitionSelectionDescriptor,
  createControlledHostActivationTransitionSelectionContract,
  validateControlledHostActivationTransitionSelectionContract,
  createFeedHostActivationTransitionSelectionIdentity,
  validateFeedHostActivationTransitionSelectionIdentity,
  createFeedHostActivationTransitionSelectionPreparedContract,
  validateFeedHostActivationTransitionSelectionPreparedContract,
  CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
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

console.log("\n[phase3b315] activation transition selection descriptor + engine");

{
  const a = createControlledHostActivationTransitionSelectionDescriptor();
  const b = createControlledHostActivationTransitionSelectionDescriptor();
  assert.equal(a.selectionState, "completed");
  assert.equal(a.selectionResult, "transition-selected-not-executable");
  assert.equal(a.selectionCompleted, true);
  assert.equal(a.selectionExecuted, false);
  assert.equal(a.currentState, "COMMIT_READY");
  assert.equal(a.currentNode, "COMMIT_READY");
  assert.equal(a.selectedTransition, "COMMIT_READY->ACTIVE");
  assert.equal(a.selectedFromState, "COMMIT_READY");
  assert.equal(a.selectedToState, "ACTIVE");
  assert.equal(a.transitionExecuted, false);
  assert.equal(a.graphTraversalExecuted, false);
  assert.equal(a.protocolExecuted, false);
  assert.equal(a.transactionCommitted, false);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
  );
  assert.deepEqual(
    [...a.candidateTransitions],
    [...CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS],
  );
  assert.deepEqual(
    [...a.eligibleTransitions],
    [...CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS],
  );
  assert.deepEqual(
    [...a.ineligibleTransitions],
    [...CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS],
  );
  assert.deepEqual(
    [...a.selectionGuards],
    [...CONTROLLED_HOST_ACTIVATION_SELECTION_GUARDS],
  );
  assert.deepEqual(
    [...a.selectionBlockers],
    [...CONTROLLED_HOST_ACTIVATION_SELECTION_BLOCKERS],
  );
  assert.deepEqual(
    [...a.selectionPreconditions],
    [...CONTROLLED_HOST_ACTIVATION_SELECTION_PRECONDITIONS],
  );
  assert.equal(
    a.selectedTransition,
    CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  );
  assert.deepEqual(
    [...a.selectionInputSources],
    [...CONTROLLED_HOST_ACTIVATION_TRANSITION_SELECTION_INPUT_SOURCES],
  );
  assert.equal(a.invariants.length, 20);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("transition selection descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationTransitionSelection(
    createControlledHostRegistry(),
  );
  assert.equal(
    evaluation.descriptor.selectionResult,
    "transition-selected-not-executable",
  );
  assert.equal(evaluation.diagnostics.selectionCompleted, true);
  assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.currentNode, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.selectionExecuted, false);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.executionImpossible, true);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.15");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.16");
  assert.equal(
    evaluation.diagnostics.candidateCount,
    CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS.length,
  );
  assert.equal(
    evaluation.diagnostics.eligibleCount,
    CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS.length,
  );
  assert.equal(
    evaluation.diagnostics.ineligibleCount,
    CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS.length,
  );
  ok("transition selection engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationTransitionSelectionDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransitionSelectionDescriptor({
        ...base,
        selectionExecuted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionSelectionDescriptor({
        ...base,
        currentState: "ACTIVE" as unknown as "COMMIT_READY",
      }),
    HardContractViolation,
  );
  ok("transition selection descriptor fail-closed");
}

console.log("\n[phase3b315] contract + identity + activation safety");

{
  const c = createControlledHostActivationTransitionSelectionContract();
  assert.equal(c.selectionResult, "transition-selected-not-executable");
  assert.equal(c.currentState, "COMMIT_READY");
  assert.equal(c.selectionExecuted, false);
  assert.equal(c.transitionExecuted, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.graphTraversalAllowed, false);
  assert.equal(c.transitionExecutionAllowed, false);
  assert.equal(c.selectionExecutionAllowed, false);
  assert.equal(c.commitAllowed, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionSelectionContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("transition selection contract fail-closed");
}

{
  const id = createFeedHostActivationTransitionSelectionIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.selectionExecutionViaTransitionSelectionAllowed, false);
  assert.equal(id.activationViaTransitionSelectionAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionSelectionIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("transition selection identity forbids selection/activation");
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
    gate.blockers.includes(PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY),
  );
  assert.equal(gate.currentStep, "3B.3.25");
  assert.equal(gate.eligibleStep, "3B.3.26");
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
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionSelectionState,
    "completed",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.selectionExecuted,
    false,
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionExecuted, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback/transition-selection unchanged");
}

{
  const ready = createFeedHostActivationTransitionSelectionPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b315/phase3b3-15-feed-host-activation-transition-selection-proof.json",
    candidateCount:
      CONTROLLED_HOST_ACTIVATION_SELECTION_CANDIDATE_TRANSITIONS.length,
    eligibleCount: CONTROLLED_HOST_ACTIVATION_SELECTION_ELIGIBLE_TRANSITIONS.length,
    ineligibleCount:
      CONTROLLED_HOST_ACTIVATION_SELECTION_INELIGIBLE_TRANSITIONS.length,
  });
  assert.equal(ready.status, "host-activation-transition-selection-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.16");
  assert.equal(ready.currentState, "COMMIT_READY");
  assert.equal(ready.selectionExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionSelectionPreparedContract({
        ...ready,
        selectionExecuted: true,
      }),
    HardContractViolation,
  );
  ok("prepared transition selection fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.15 host activation transition selection: ${passed} assertions ok\n`,
);
