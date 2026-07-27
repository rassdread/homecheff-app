/**
 * Phase 3B.3.16 — host activation transition preflight unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransitionPreflightDescriptor,
  evaluateControlledHostActivationTransitionPreflight,
  validateControlledHostActivationTransitionPreflightDescriptor,
  createControlledHostActivationTransitionPreflightContract,
  validateControlledHostActivationTransitionPreflightContract,
  createFeedHostActivationTransitionPreflightIdentity,
  validateFeedHostActivationTransitionPreflightIdentity,
  createFeedHostActivationTransitionPreflightPreparedContract,
  validateFeedHostActivationTransitionPreflightPreparedContract,
  CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
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

console.log("\n[phase3b316] activation transition preflight descriptor + engine");

{
  const a = createControlledHostActivationTransitionPreflightDescriptor();
  const b = createControlledHostActivationTransitionPreflightDescriptor();
  assert.equal(a.preflightState, "completed");
  assert.equal(a.preflightResult, "transition-preflight-ready-not-authorized");
  assert.equal(a.preflightCompleted, true);
  assert.equal(a.preflightReady, true);
  assert.equal(a.preflightBlocked, true);
  assert.equal(a.preflightExecuted, false);
  assert.equal(a.currentState, "COMMIT_READY");
  assert.equal(a.currentNode, "COMMIT_READY");
  assert.equal(a.selectedTransition, "COMMIT_READY->ACTIVE");
  assert.equal(a.selectedFromState, "COMMIT_READY");
  assert.equal(a.selectedToState, "ACTIVE");
  assert.equal(a.selectionResult, "transition-selected-not-executable");
  assert.equal(a.selectionExecuted, false);
  assert.equal(a.transitionAuthorized, false);
  assert.equal(a.authorizationGranted, false);
  assert.equal(a.transitionExecuted, false);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  );
  assert.deepEqual(
    [...a.preflightChecks],
    [...CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS],
  );
  assert.deepEqual([...a.passedChecks], [...CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS]);
  assert.equal(a.failedChecks.length, 0);
  assert.equal(
    a.selectedTransition,
    CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("transition preflight descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationTransitionPreflight(
    createControlledHostRegistry(),
  );
  assert.equal(
    evaluation.descriptor.preflightResult,
    "transition-preflight-ready-not-authorized",
  );
  assert.equal(evaluation.diagnostics.preflightCompleted, true);
  assert.equal(evaluation.diagnostics.preflightReady, true);
  assert.equal(evaluation.diagnostics.preflightBlocked, true);
  assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.currentNode, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.preflightExecuted, false);
  assert.equal(evaluation.diagnostics.transitionAuthorized, false);
  assert.equal(evaluation.diagnostics.authorizationGranted, false);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.executionImpossible, true);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.16");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.17");
  assert.equal(
    evaluation.diagnostics.checkCount,
    CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS.length,
  );
  assert.equal(
    evaluation.diagnostics.passedCount,
    CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS.length,
  );
  ok("transition preflight engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationTransitionPreflightDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransitionPreflightDescriptor({
        ...base,
        preflightExecuted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionPreflightDescriptor({
        ...base,
        transitionAuthorized: true,
      }),
    HardContractViolation,
  );
  ok("transition preflight descriptor fail-closed");
}

console.log("\n[phase3b316] contract + identity + activation safety");

{
  const c = createControlledHostActivationTransitionPreflightContract();
  assert.equal(c.preflightResult, "transition-preflight-ready-not-authorized");
  assert.equal(c.currentState, "COMMIT_READY");
  assert.equal(c.preflightExecuted, false);
  assert.equal(c.transitionAuthorized, false);
  assert.equal(c.authorizationGranted, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.graphTraversalAllowed, false);
  assert.equal(c.transitionExecutionAllowed, false);
  assert.equal(c.preflightExecutionAllowed, false);
  assert.equal(c.transitionAuthorizationAllowed, false);
  assert.equal(c.commitAllowed, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionPreflightContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("transition preflight contract fail-closed");
}

{
  const id = createFeedHostActivationTransitionPreflightIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.preflightExecutionViaTransitionPreflightAllowed, false);
  assert.equal(id.transitionAuthorizationViaTransitionPreflightAllowed, false);
  assert.equal(id.activationViaTransitionPreflightAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionPreflightIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("transition preflight identity forbids preflight/authorization/activation");
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
  assert.equal(gate.currentStep, "3B.3.40");
  assert.equal(gate.eligibleStep, "3B.3.41");
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
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionPreflightState,
    "completed",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.preflightExecuted,
    false,
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionAuthorized,
    false,
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionExecuted, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback/transition-preflight unchanged");
}

{
  const ready = createFeedHostActivationTransitionPreflightPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b316/phase3b3-16-feed-host-activation-transition-preflight-proof.json",
    checkCount: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS.length,
    passedCount: CONTROLLED_HOST_ACTIVATION_PREFLIGHT_CHECKS.length,
  });
  assert.equal(ready.status, "host-activation-transition-preflight-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.17");
  assert.equal(ready.currentState, "COMMIT_READY");
  assert.equal(ready.preflightExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionPreflightPreparedContract({
        ...ready,
        preflightExecuted: true,
      }),
    HardContractViolation,
  );
  ok("prepared transition preflight fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.16 host activation transition preflight: ${passed} assertions ok\n`,
);
