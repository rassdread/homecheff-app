/**
 * Phase 3B.3.19 — host activation transition authorization grant issuance
 * decision unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision,
  validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor,
  createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionContract,
  validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionContract,
  createFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity,
  validateFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity,
  createFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionPreparedContract,
  validateFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionPreparedContract,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS,
  CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
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
  "\n[phase3b319] activation transition authorization grant issuance decision descriptor + engine",
);

{
  const a =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor();
  const b =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor();
  assert.equal(a.issuanceDecisionState, "completed");
  assert.equal(
    a.issuanceDecisionResult,
    "authorization-grant-issuance-eligible-not-issued",
  );
  assert.equal(a.issuanceDecisionCompleted, true);
  assert.equal(a.issuanceDecisionExecuted, false);
  assert.equal(a.issuanceEligible, true);
  assert.equal(a.issuanceBlocked, true);
  assert.equal(a.wouldIssueGrant, true);
  assert.equal(a.grantIssued, false);
  assert.equal(a.grantCreated, false);
  assert.equal(a.grantMaterialized, false);
  assert.equal(a.grantPersisted, false);
  assert.equal(a.grantApplied, false);
  assert.equal(a.grantActivated, false);
  assert.equal(a.grantConsumed, false);
  assert.equal(a.grantRevoked, false);
  assert.equal(a.grantAuthorityAvailable, false);
  assert.equal(a.grantAuthorityEnabled, false);
  assert.equal(a.grantAuthorityDelegated, false);
  assert.equal(a.grantAuthorityTransferred, false);
  assert.equal(a.tokenPresent, false);
  assert.equal(a.secretPresent, false);
  assert.equal(a.signaturePresent, false);
  assert.equal(a.noncePresent, false);
  assert.equal(a.credentialPresent, false);
  assert.equal(a.certificatePresent, false);
  assert.equal(a.permitPresent, false);
  assert.equal(a.callbackPresent, false);
  assert.equal(a.executableHandlePresent, false);
  assert.equal(a.runtimeCapabilityPresent, false);
  assert.equal(a.grantReadinessResult, "authorization-grant-ready-not-issued");
  assert.equal(a.grantReady, true);
  assert.equal(a.grantBlocked, true);
  assert.equal(
    a.authorizationDecisionResult,
    "authorization-eligible-not-granted",
  );
  assert.equal(a.authorizationEligible, true);
  assert.equal(a.authorizationGranted, false);
  assert.equal(a.transitionAuthorized, false);
  assert.equal(a.currentState, "COMMIT_READY");
  assert.equal(a.currentNode, "COMMIT_READY");
  assert.equal(a.selectedTransition, "COMMIT_READY->ACTIVE");
  assert.equal(a.selectedFromState, "COMMIT_READY");
  assert.equal(a.selectedToState, "ACTIVE");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.renderActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.issuancePolicy, CONTROLLED_HOST_ACTIVATION_ISSUANCE_POLICY);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  );
  assert.deepEqual(
    [...a.issuanceConditions],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS],
  );
  assert.equal(a.issuanceConditions.length, 140);
  assert.deepEqual(
    [...a.satisfiedIssuanceConditions],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS],
  );
  assert.equal(a.unsatisfiedIssuanceConditions.length, 0);
  assert.deepEqual(
    [...a.issuanceGuards],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS],
  );
  assert.equal(a.issuanceGuards.length, 55);
  assert.equal(a.unsatisfiedIssuanceGuards.length, 0);
  assert.ok(
    a.issuanceBlockers.includes(
      PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
    ),
  );
  assert.equal(
    a.selectedTransition,
    CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  );
  assert.equal(
    new Set(a.issuanceConditions).size,
    a.issuanceConditions.length,
  );
  assert.equal(new Set(a.issuanceGuards).size, a.issuanceGuards.length);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("authorization grant issuance decision descriptor deterministic");
}

{
  const evaluation =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision(
      createControlledHostRegistry(),
    );
  assert.equal(
    evaluation.descriptor.issuanceDecisionResult,
    "authorization-grant-issuance-eligible-not-issued",
  );
  assert.equal(evaluation.diagnostics.issuanceDecisionCompleted, true);
  assert.equal(evaluation.diagnostics.issuanceEligible, true);
  assert.equal(evaluation.diagnostics.issuanceBlocked, true);
  assert.equal(evaluation.diagnostics.wouldIssueGrant, true);
  assert.equal(evaluation.diagnostics.grantIssued, false);
  assert.equal(evaluation.diagnostics.grantCreated, false);
  assert.equal(evaluation.diagnostics.grantMaterialized, false);
  assert.equal(evaluation.diagnostics.grantPersisted, false);
  assert.equal(evaluation.diagnostics.grantApplied, false);
  assert.equal(evaluation.diagnostics.grantActivated, false);
  assert.equal(evaluation.diagnostics.grantConsumed, false);
  assert.equal(evaluation.diagnostics.grantRevoked, false);
  assert.equal(evaluation.diagnostics.grantAuthorityAvailable, false);
  assert.equal(evaluation.diagnostics.grantAuthorityEnabled, false);
  assert.equal(evaluation.diagnostics.grantAuthorityDelegated, false);
  assert.equal(evaluation.diagnostics.grantAuthorityTransferred, false);
  assert.equal(evaluation.diagnostics.tokenPresent, false);
  assert.equal(evaluation.diagnostics.secretPresent, false);
  assert.equal(evaluation.diagnostics.signaturePresent, false);
  assert.equal(evaluation.diagnostics.noncePresent, false);
  assert.equal(evaluation.diagnostics.credentialPresent, false);
  assert.equal(evaluation.diagnostics.certificatePresent, false);
  assert.equal(evaluation.diagnostics.permitPresent, false);
  assert.equal(evaluation.diagnostics.callbackPresent, false);
  assert.equal(evaluation.diagnostics.executableHandlePresent, false);
  assert.equal(evaluation.diagnostics.runtimeCapabilityPresent, false);
  assert.equal(evaluation.diagnostics.grantReadinessCompleted, true);
  assert.equal(
    evaluation.diagnostics.grantReadinessResult,
    "authorization-grant-ready-not-issued",
  );
  assert.equal(evaluation.diagnostics.authorizationDecisionCompleted, true);
  assert.equal(evaluation.diagnostics.authorizationEligible, true);
  assert.equal(evaluation.diagnostics.authorizationGranted, false);
  assert.equal(evaluation.diagnostics.transitionAuthorized, false);
  assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.currentNode, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.19");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.20");
  assert.equal(evaluation.diagnostics.issuanceImpossible, true);
  assert.equal(evaluation.diagnostics.authorityImpossible, true);
  assert.equal(evaluation.diagnostics.executionImpossible, true);
  assert.equal(
    evaluation.diagnostics.conditionCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS.length,
  );
  assert.equal(
    evaluation.diagnostics.satisfiedConditionCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS.length,
  );
  assert.equal(evaluation.diagnostics.unsatisfiedConditionCount, 0);
  assert.equal(
    evaluation.diagnostics.guardCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS.length,
  );
  assert.equal(evaluation.diagnostics.unsatisfiedGuardCount, 0);
  ok(
    "authorization grant issuance decision engine + diagnostics metadata only (currentPhase 3B.3.19, chained from 3B.3.18)",
  );
}

{
  const base =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(
        { ...base, grantIssued: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(
        { ...base, grantCreated: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(
        { ...base, grantAuthorityAvailable: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(
        { ...base, tokenPresent: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(
        { ...base, canStartActivation: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionDescriptor(
        { ...base, currentState: "ACTIVE" },
      ),
    HardContractViolation,
  );
  ok("authorization grant issuance decision descriptor fail-closed");
}

console.log(
  "\n[phase3b319] contract + identity + gate + host metadata + prepared + permanent block",
);

{
  const c =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionContract();
  assert.equal(
    c.issuanceDecisionResult,
    "authorization-grant-issuance-eligible-not-issued",
  );
  assert.equal(c.issuanceEligible, true);
  assert.equal(c.issuanceBlocked, true);
  assert.equal(c.wouldIssueGrant, true);
  assert.equal(c.grantIssued, false);
  assert.equal(c.grantCreated, false);
  assert.equal(c.grantMaterialized, false);
  assert.equal(c.grantAuthorityAvailable, false);
  assert.equal(c.authorizationGranted, false);
  assert.equal(c.transitionAuthorized, false);
  assert.equal(c.currentState, "COMMIT_READY");
  assert.equal(c.issuanceDecisionExecuted, false);
  assert.equal(c.grantCreationAllowed, false);
  assert.equal(c.grantIssuanceAllowed, false);
  assert.equal(c.grantMaterializationAllowed, false);
  assert.equal(c.authorizationGrantAllowed, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceDecisionContract(
        { ...c, remountAllowed: true },
      ),
    HardContractViolation,
  );
  ok("authorization grant issuance decision contract fail-closed");
}

{
  const id =
    createFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.expectedUnmountCount, 0);
  assert.equal(id.grantCreationViaIssuanceDecisionAllowed, false);
  assert.equal(id.grantIssuanceViaIssuanceDecisionAllowed, false);
  assert.equal(id.grantMaterializationViaIssuanceDecisionAllowed, false);
  assert.equal(id.grantAuthorityViaIssuanceDecisionAllowed, false);
  assert.equal(id.authorizationGrantViaIssuanceDecisionAllowed, false);
  assert.equal(id.activationViaIssuanceDecisionAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.tokenViaIssuanceDecisionAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity(
        { ...id, remountAllowed: true },
      ),
    HardContractViolation,
  );
  ok(
    "authorization grant issuance decision identity forbids grant creation/issuance/materialization/authority",
  );
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
  } as Parameters<typeof evaluateFeedHostActivationGate>[0]);
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(
      PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.32");
  assert.equal(gate.eligibleStep, "3B.3.33");
  ok(
    "activation remains impossible (gate currentStep=3B.3.19, eligibleStep=3B.3.20)",
  );
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
  assert.equal(host.nextEligibleStep, "3B.3.33");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    ),
  );
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
    ),
  );
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
    ),
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.33",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.grantIssued, false);
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation,
    false,
  );
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  const prepared =
    createFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionPreparedContract(
      {
        evidenceCommit: "abcdef0123456789",
        evidenceArtifactPath:
          "docs/audits/artifacts/phase3b319/phase3b3-19-feed-host-activation-transition-authorization-grant-issuance-decision-proof.json",
        conditionCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS.length,
        satisfiedConditionCount:
          CONTROLLED_HOST_ACTIVATION_ISSUANCE_CONDITIONS.length,
        guardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS.length,
        satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_GUARDS.length,
      },
    );
  assert.equal(
    prepared.status,
    "host-activation-transition-authorization-grant-issuance-decision-prepared",
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.20");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.grantIssued, false);
  assert.equal(prepared.issuanceDecisionExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionPreparedContract(
        { ...prepared, grantIssued: true },
      ),
    HardContractViolation,
  );
  ok("prepared authorization grant issuance decision fail-closed");
}

{
  assert.ok(
    CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_BLOCKERS.includes(
      PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
    ),
  );
  const e =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceDecision();
  assert.equal(e.descriptor.grantIssued, false);
  assert.equal(e.descriptor.grantCreated, false);
  assert.equal(e.descriptor.grantMaterialized, false);
  assert.equal(e.descriptor.grantPersisted, false);
  assert.equal(e.descriptor.grantApplied, false);
  assert.equal(e.descriptor.grantActivated, false);
  assert.equal(e.descriptor.grantConsumed, false);
  assert.equal(e.descriptor.grantRevoked, false);
  assert.equal(e.descriptor.grantAuthorityAvailable, false);
  assert.equal(e.descriptor.grantAuthorityEnabled, false);
  assert.equal(e.descriptor.grantAuthorityDelegated, false);
  assert.equal(e.descriptor.grantAuthorityTransferred, false);
  assert.equal(e.descriptor.tokenPresent, false);
  assert.equal(e.descriptor.secretPresent, false);
  assert.equal(e.descriptor.signaturePresent, false);
  assert.equal(e.descriptor.noncePresent, false);
  assert.equal(e.descriptor.credentialPresent, false);
  assert.equal(e.descriptor.certificatePresent, false);
  assert.equal(e.descriptor.permitPresent, false);
  assert.equal(e.descriptor.callbackPresent, false);
  assert.equal(e.descriptor.executableHandlePresent, false);
  assert.equal(e.descriptor.runtimeCapabilityPresent, false);
  assert.equal(e.descriptor.transitionAuthorized, false);
  assert.equal(e.descriptor.transitionExecuted, false);
  assert.equal(e.descriptor.selectionExecuted, false);
  assert.equal(e.descriptor.graphTraversalExecuted, false);
  assert.equal(e.descriptor.protocolExecuted, false);
  assert.equal(e.descriptor.transactionCommitted, false);
  assert.equal(e.descriptor.canStartActivation, false);
  assert.equal(e.descriptor.executorAllowed, false);
  assert.equal(e.descriptor.schedulerAllowed, false);
  assert.equal(e.descriptor.hostActivation, false);
  assert.equal(e.descriptor.renderActivation, false);
  ok("grant issuance permanently blocked with PHASE_3B3_19 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.19 host activation transition authorization grant issuance decision: ${passed} assertions ok\n`,
);
