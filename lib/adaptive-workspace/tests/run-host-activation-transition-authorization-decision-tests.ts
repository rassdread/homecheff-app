/**
 * Phase 3B.3.17 — host activation transition authorization decision unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransitionAuthorizationDecisionDescriptor,
  evaluateControlledHostActivationTransitionAuthorizationDecision,
  validateControlledHostActivationTransitionAuthorizationDecisionDescriptor,
  createControlledHostActivationTransitionAuthorizationDecisionContract,
  validateControlledHostActivationTransitionAuthorizationDecisionContract,
  createFeedHostActivationTransitionAuthorizationDecisionIdentity,
  validateFeedHostActivationTransitionAuthorizationDecisionIdentity,
  createFeedHostActivationTransitionAuthorizationDecisionPreparedContract,
  validateFeedHostActivationTransitionAuthorizationDecisionPreparedContract,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
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

console.log(
  "\n[phase3b317] activation transition authorization decision descriptor + engine",
);

{
  const a =
    createControlledHostActivationTransitionAuthorizationDecisionDescriptor();
  const b =
    createControlledHostActivationTransitionAuthorizationDecisionDescriptor();
  assert.equal(a.authorizationDecisionState, "completed");
  assert.equal(
    a.authorizationDecisionResult,
    "authorization-eligible-not-granted",
  );
  assert.equal(a.authorizationDecisionCompleted, true);
  assert.equal(a.authorizationEligible, true);
  assert.equal(a.authorizationBlocked, true);
  assert.equal(a.wouldAuthorize, true);
  assert.equal(a.authorizationGranted, false);
  assert.equal(a.authorizationApplied, false);
  assert.equal(a.transitionAuthorized, false);
  assert.equal(a.authorizationDecisionExecuted, false);
  assert.equal(a.authorizationExecutionAllowed, false);
  assert.equal(a.currentState, "COMMIT_READY");
  assert.equal(a.currentNode, "COMMIT_READY");
  assert.equal(a.selectedTransition, "COMMIT_READY->ACTIVE");
  assert.equal(a.selectedFromState, "COMMIT_READY");
  assert.equal(a.selectedToState, "ACTIVE");
  assert.equal(a.preflightCompleted, true);
  assert.equal(a.preflightReady, true);
  assert.equal(a.preflightBlocked, true);
  assert.equal(
    a.preflightResult,
    "transition-preflight-ready-not-authorized",
  );
  assert.equal(a.preflightExecuted, false);
  assert.equal(a.failedPreflightChecks.length, 0);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.authorizationPolicy, CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_POLICY);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  );
  assert.deepEqual(
    [...a.authorizationConditions],
    [...CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS],
  );
  assert.deepEqual(
    [...a.satisfiedAuthorizationConditions],
    [...CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS],
  );
  assert.equal(a.unsatisfiedAuthorizationConditions.length, 0);
  assert.deepEqual(
    [...a.authorizationGuards],
    [...CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS],
  );
  assert.equal(a.unsatisfiedAuthorizationGuards.length, 0);
  assert.ok(
    a.authorizationBlockers.includes(
      PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
    ),
  );
  assert.equal(
    a.selectedTransition,
    CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  );
  assert.equal(new Set(a.authorizationConditions).size, a.authorizationConditions.length);
  assert.equal(new Set(a.authorizationGuards).size, a.authorizationGuards.length);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("authorization decision descriptor deterministic");
}

{
  const evaluation =
    evaluateControlledHostActivationTransitionAuthorizationDecision(
      createControlledHostRegistry(),
    );
  assert.equal(
    evaluation.descriptor.authorizationDecisionResult,
    "authorization-eligible-not-granted",
  );
  assert.equal(evaluation.diagnostics.authorizationDecisionCompleted, true);
  assert.equal(evaluation.diagnostics.authorizationEligible, true);
  assert.equal(evaluation.diagnostics.authorizationBlocked, true);
  assert.equal(evaluation.diagnostics.wouldAuthorize, true);
  assert.equal(evaluation.diagnostics.authorizationGranted, false);
  assert.equal(evaluation.diagnostics.authorizationApplied, false);
  assert.equal(evaluation.diagnostics.transitionAuthorized, false);
  assert.equal(evaluation.diagnostics.authorizationDecisionExecuted, false);
  assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.currentNode, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.preflightReady, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.grantImpossible, true);
  assert.equal(evaluation.diagnostics.executionImpossible, true);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.17");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.18");
  assert.equal(
    evaluation.diagnostics.conditionCount,
    CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
  );
  assert.equal(
    evaluation.diagnostics.satisfiedConditionCount,
    CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
  );
  assert.equal(evaluation.diagnostics.unsatisfiedConditionCount, 0);
  assert.equal(
    evaluation.diagnostics.guardCount,
    CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
  );
  ok("authorization decision engine + diagnostics metadata only");
}

{
  const base =
    createControlledHostActivationTransitionAuthorizationDecisionDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationDecisionDescriptor({
        ...base,
        authorizationGranted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationDecisionDescriptor({
        ...base,
        authorizationApplied: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationDecisionDescriptor({
        ...base,
        transitionAuthorized: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationDecisionDescriptor({
        ...base,
        authorizationDecisionExecuted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationDecisionDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationDecisionDescriptor({
        ...base,
        currentState: "ACTIVE",
      }),
    HardContractViolation,
  );
  ok("authorization decision descriptor fail-closed");
}

console.log("\n[phase3b317] contract + identity + activation safety");

{
  const c =
    createControlledHostActivationTransitionAuthorizationDecisionContract();
  assert.equal(
    c.authorizationDecisionResult,
    "authorization-eligible-not-granted",
  );
  assert.equal(c.authorizationEligible, true);
  assert.equal(c.wouldAuthorize, true);
  assert.equal(c.authorizationGranted, false);
  assert.equal(c.authorizationApplied, false);
  assert.equal(c.transitionAuthorized, false);
  assert.equal(c.currentState, "COMMIT_READY");
  assert.equal(c.authorizationDecisionExecuted, false);
  assert.equal(c.authorizationGrantAllowed, false);
  assert.equal(c.authorizationApplicationAllowed, false);
  assert.equal(c.transitionAuthorizationAllowed, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationDecisionContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("authorization decision contract fail-closed");
}

{
  const id =
    createFeedHostActivationTransitionAuthorizationDecisionIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.expectedUnmountCount, 0);
  assert.equal(
    id.authorizationGrantViaAuthorizationDecisionAllowed,
    false,
  );
  assert.equal(
    id.authorizationApplicationViaAuthorizationDecisionAllowed,
    false,
  );
  assert.equal(
    id.authorizationDecisionExecutionViaAuthorizationDecisionAllowed,
    false,
  );
  assert.equal(id.activationViaAuthorizationDecisionAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationDecisionIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("authorization decision identity forbids grant/application/execution");
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
    gate.blockers.includes(
      PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.26");
  assert.equal(gate.eligibleStep, "3B.3.27");
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
  assert.equal(host.nextEligibleStep, "3B.3.27");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
    ),
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.selectedTransition,
    "COMMIT_READY->ACTIVE",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.authorizationGranted,
    false,
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transitionAuthorized,
    false,
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation,
    false,
  );
  ok("owner/writer/renderer/registry/rollback/authorization-decision unchanged");
}

{
  const ready =
    createFeedHostActivationTransitionAuthorizationDecisionPreparedContract({
      evidenceCommit: "abcdef0123456789",
      evidenceArtifactPath:
        "docs/audits/artifacts/phase3b317/phase3b3-17-feed-host-activation-transition-authorization-decision-proof.json",
      conditionCount: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
      guardCount: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
      satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_GUARDS.length,
    });
  assert.equal(
    ready.status,
    "host-activation-transition-authorization-decision-prepared",
  );
  assert.equal(ready.nextEligibleStep, "3B.3.18");
  assert.equal(ready.currentState, "COMMIT_READY");
  assert.equal(ready.authorizationGranted, false);
  assert.equal(ready.authorizationDecisionExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationDecisionPreparedContract(
        {
          ...ready,
          authorizationGranted: true,
        },
      ),
    HardContractViolation,
  );
  ok("prepared authorization decision fail-closed");
}

{
  // Ensure phase blocker always present and grant never true on happy path.
  assert.ok(
    CONTROLLED_HOST_ACTIVATION_AUTHORIZATION_BLOCKERS.includes(
      PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
    ),
  );
  const e = evaluateControlledHostActivationTransitionAuthorizationDecision();
  assert.equal(e.descriptor.authorizationGranted, false);
  assert.equal(e.descriptor.authorizationApplied, false);
  assert.equal(e.descriptor.transitionAuthorized, false);
  assert.equal(e.descriptor.transitionExecuted, false);
  assert.equal(e.descriptor.selectionExecuted, false);
  assert.equal(e.descriptor.graphTraversalExecuted, false);
  assert.equal(e.descriptor.protocolExecuted, false);
  assert.equal(e.descriptor.transactionCommitted, false);
  assert.equal(e.descriptor.commitExecuted, false);
  assert.equal(e.descriptor.rollbackExecuted, false);
  assert.equal(e.descriptor.executorAllowed, false);
  assert.equal(e.descriptor.schedulerAllowed, false);
  ok("grant/execution permanently blocked with phase blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.17 host activation transition authorization decision: ${passed} assertions ok\n`,
);
