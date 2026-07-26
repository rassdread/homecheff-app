/**
 * Phase 3B.3.18 — host activation transition authorization grant readiness unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor,
  evaluateControlledHostActivationTransitionAuthorizationGrantReadiness,
  validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor,
  createControlledHostActivationTransitionAuthorizationGrantReadinessContract,
  validateControlledHostActivationTransitionAuthorizationGrantReadinessContract,
  createFeedHostActivationTransitionAuthorizationGrantReadinessIdentity,
  validateFeedHostActivationTransitionAuthorizationGrantReadinessIdentity,
  createFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract,
  validateFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract,
  CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS,
  CONTROLLED_HOST_ACTIVATION_GRANT_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_GRANT_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
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

console.log(
  "\n[phase3b318] activation transition authorization grant readiness descriptor + engine",
);

{
  const a =
    createControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor();
  const b =
    createControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor();
  assert.equal(a.grantReadinessState, "completed");
  assert.equal(
    a.grantReadinessResult,
    "authorization-grant-ready-not-issued",
  );
  assert.equal(a.grantReadinessCompleted, true);
  assert.equal(a.grantReadinessExecuted, false);
  assert.equal(a.grantReady, true);
  assert.equal(a.grantBlocked, true);
  assert.equal(a.wouldIssueGrant, true);
  assert.equal(a.grantIssued, false);
  assert.equal(a.grantCreated, false);
  assert.equal(a.grantPersisted, false);
  assert.equal(a.grantApplied, false);
  assert.equal(a.grantAuthorityAvailable, false);
  assert.equal(a.grantAuthorityEnabled, false);
  assert.equal(a.grantTokenPresent, false);
  assert.equal(a.grantSecretPresent, false);
  assert.equal(a.grantSignaturePresent, false);
  assert.equal(a.grantCallbackPresent, false);
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
  assert.equal(a.canStartActivation, false);
  assert.equal(a.grantPolicy, CONTROLLED_HOST_ACTIVATION_GRANT_POLICY);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  );
  assert.deepEqual(
    [...a.grantConditions],
    [...CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS],
  );
  assert.equal(a.grantConditions.length, 94);
  assert.deepEqual(
    [...a.satisfiedGrantConditions],
    [...CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS],
  );
  assert.equal(a.unsatisfiedGrantConditions.length, 0);
  assert.deepEqual(
    [...a.grantGuards],
    [...CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS],
  );
  assert.equal(a.grantGuards.length, 24);
  assert.equal(a.unsatisfiedGrantGuards.length, 0);
  assert.ok(
    a.grantBlockers.includes(
      PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    ),
  );
  assert.equal(
    a.selectedTransition,
    CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  );
  assert.equal(new Set(a.grantConditions).size, a.grantConditions.length);
  assert.equal(new Set(a.grantGuards).size, a.grantGuards.length);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("authorization grant readiness descriptor deterministic");
}

{
  const evaluation =
    evaluateControlledHostActivationTransitionAuthorizationGrantReadiness(
      createControlledHostRegistry(),
    );
  assert.equal(
    evaluation.descriptor.grantReadinessResult,
    "authorization-grant-ready-not-issued",
  );
  assert.equal(evaluation.diagnostics.grantReadinessCompleted, true);
  assert.equal(evaluation.diagnostics.grantReady, true);
  assert.equal(evaluation.diagnostics.grantBlocked, true);
  assert.equal(evaluation.diagnostics.wouldIssueGrant, true);
  assert.equal(evaluation.diagnostics.grantIssued, false);
  assert.equal(evaluation.diagnostics.grantCreated, false);
  assert.equal(evaluation.diagnostics.grantPersisted, false);
  assert.equal(evaluation.diagnostics.grantApplied, false);
  assert.equal(evaluation.diagnostics.grantAuthorityAvailable, false);
  assert.equal(evaluation.diagnostics.authorizationEligible, true);
  assert.equal(evaluation.diagnostics.authorizationGranted, false);
  assert.equal(evaluation.diagnostics.transitionAuthorized, false);
  assert.equal(evaluation.diagnostics.currentState, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.currentNode, "COMMIT_READY");
  assert.equal(evaluation.diagnostics.preflightReady, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.18");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.19");
  assert.equal(evaluation.diagnostics.issuanceImpossible, true);
  assert.equal(evaluation.diagnostics.authorityImpossible, true);
  assert.equal(evaluation.diagnostics.executionImpossible, true);
  assert.equal(
    evaluation.diagnostics.conditionCount,
    CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS.length,
  );
  assert.equal(
    evaluation.diagnostics.satisfiedConditionCount,
    CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS.length,
  );
  assert.equal(evaluation.diagnostics.unsatisfiedConditionCount, 0);
  assert.equal(
    evaluation.diagnostics.guardCount,
    CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS.length,
  );
  ok("authorization grant readiness engine + diagnostics metadata only");
}

{
  const base =
    createControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor({
        ...base,
        grantIssued: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor({
        ...base,
        grantCreated: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor({
        ...base,
        grantAuthorityAvailable: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor({
        ...base,
        authorizationGranted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantReadinessDescriptor({
        ...base,
        currentState: "ACTIVE",
      }),
    HardContractViolation,
  );
  ok("authorization grant readiness descriptor fail-closed");
}

console.log("\n[phase3b318] contract + identity + activation safety");

{
  const c =
    createControlledHostActivationTransitionAuthorizationGrantReadinessContract();
  assert.equal(
    c.grantReadinessResult,
    "authorization-grant-ready-not-issued",
  );
  assert.equal(c.grantReady, true);
  assert.equal(c.wouldIssueGrant, true);
  assert.equal(c.grantIssued, false);
  assert.equal(c.grantCreated, false);
  assert.equal(c.grantAuthorityAvailable, false);
  assert.equal(c.authorizationGranted, false);
  assert.equal(c.transitionAuthorized, false);
  assert.equal(c.currentState, "COMMIT_READY");
  assert.equal(c.grantReadinessExecuted, false);
  assert.equal(c.grantCreationAllowed, false);
  assert.equal(c.grantIssuanceAllowed, false);
  assert.equal(c.authorizationGrantAllowed, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantReadinessContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("authorization grant readiness contract fail-closed");
}

{
  const id =
    createFeedHostActivationTransitionAuthorizationGrantReadinessIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.expectedUnmountCount, 0);
  assert.equal(id.grantCreationViaGrantReadinessAllowed, false);
  assert.equal(id.grantIssuanceViaGrantReadinessAllowed, false);
  assert.equal(id.grantAuthorityViaGrantReadinessAllowed, false);
  assert.equal(id.authorizationGrantViaGrantReadinessAllowed, false);
  assert.equal(id.activationViaGrantReadinessAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationGrantReadinessIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("authorization grant readiness identity forbids grant creation/issuance/authority");
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
      PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.25");
  assert.equal(gate.eligibleStep, "3B.3.26");
  assert.equal(gate.transitionAuthorizationGrantReadinessStatus, "completed");
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
  assert.equal(host.nextEligibleStep, "3B.3.26");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
    ),
  );
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    ),
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.26",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.grantIssued, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.grantReady, true);
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.wouldIssueGrant,
    true,
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation,
    false,
  );
  ok("owner/writer/renderer/registry/rollback/grant-readiness unchanged");
}

{
  const ready =
    createFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract({
      evidenceCommit: "abcdef0123456789",
      evidenceArtifactPath:
        "docs/audits/artifacts/phase3b318/phase3b3-18-feed-host-activation-transition-authorization-grant-readiness-proof.json",
      conditionCount: CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS.length,
      satisfiedConditionCount:
        CONTROLLED_HOST_ACTIVATION_GRANT_CONDITIONS.length,
      guardCount: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS.length,
      satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_GRANT_GUARDS.length,
    });
  assert.equal(
    ready.status,
    "host-activation-transition-authorization-grant-readiness-prepared",
  );
  assert.equal(ready.nextEligibleStep, "3B.3.19");
  assert.equal(ready.currentState, "COMMIT_READY");
  assert.equal(ready.grantIssued, false);
  assert.equal(ready.grantReadinessExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationGrantReadinessPreparedContract(
        {
          ...ready,
          grantIssued: true,
        },
      ),
    HardContractViolation,
  );
  ok("prepared authorization grant readiness fail-closed");
}

{
  // Ensure phase blocker always present and grant never true on happy path.
  assert.ok(
    CONTROLLED_HOST_ACTIVATION_GRANT_BLOCKERS.includes(
      PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    ),
  );
  const e = evaluateControlledHostActivationTransitionAuthorizationGrantReadiness();
  assert.equal(e.descriptor.grantIssued, false);
  assert.equal(e.descriptor.grantCreated, false);
  assert.equal(e.descriptor.grantPersisted, false);
  assert.equal(e.descriptor.grantApplied, false);
  assert.equal(e.descriptor.grantAuthorityAvailable, false);
  assert.equal(e.descriptor.transitionAuthorized, false);
  assert.equal(e.descriptor.transitionExecuted, false);
  assert.equal(e.descriptor.selectionExecuted, false);
  assert.equal(e.descriptor.graphTraversalExecuted, false);
  assert.equal(e.descriptor.protocolExecuted, false);
  assert.equal(e.descriptor.transactionCommitted, false);
  assert.equal(e.descriptor.rollbackExecuted, false);
  assert.equal(e.descriptor.canStartActivation, false);
  assert.equal(e.descriptor.executorAllowed, false);
  assert.equal(e.descriptor.schedulerAllowed, false);
  assert.equal(e.descriptor.hostActivation, false);
  assert.equal(e.descriptor.renderActivation, false);
  ok("grant issuance permanently blocked with phase blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.18 host activation transition authorization grant readiness: ${passed} assertions ok\n`,
);
