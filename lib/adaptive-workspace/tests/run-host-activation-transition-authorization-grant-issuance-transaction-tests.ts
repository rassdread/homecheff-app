/**
 * Phase 3B.3.22 — host activation transition authorization grant issuance
 * decision unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor,
  evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceTransaction,
  validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor,
  createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionContract,
  validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionContract,
  createFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity,
  validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity,
  createFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract,
  validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_GUARDS,
  CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_TRANSACTION_BLOCKERS,
  CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_POLICY,
  CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
  PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  FEED_DISCOVERY_HOST_CANDIDATE_METADATA,
  HardContractViolation,
  stableStringify,
} from "../index";

import {
  PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-readiness";
import {
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-authorization";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log(
  "\n[phase3b322] activation transition authorization grant issuance pipeline descriptor + engine",
);

{
  const a =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor();
  const b =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor();
  assert.equal(a.issuanceTransactionState, "NOT_OPENED");
  assert.equal(a.issuanceTransactionLifecycleState, "completed");
  assert.equal(
    a.issuanceTransactionResult,
    "authorization-grant-issuance-transaction-ready-not-opened",
  );
  assert.equal(a.issuanceTransactionCompleted, true);
  assert.equal(a.issuanceTransactionOpened, false);
  assert.equal(a.issuanceTransactionPrepared, false);
  assert.equal(a.issuanceTransactionCommitted, false);
  assert.equal(a.issuanceTransactionAborted, false);
  assert.equal(a.issuanceTransactionRolledBack, false);
  assert.equal(a.issuanceTransactionCompensated, false);
  assert.equal(a.issuanceTransactionReady, true);
  assert.equal(a.issuanceTransactionBlocked, true);
  assert.equal(a.issuanceTransactionExecutable, false);
  assert.equal(a.wouldOpenIssuanceTransaction, true);
  assert.equal(a.issuancePipelineResult, "authorization-grant-issuance-pipeline-ready-not-executable");
  assert.equal(a.issuancePipelineReady, true);
  assert.equal(a.issuancePipelineBlocked, true);
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.transactionParticipantCount, 30);
  assert.equal(a.completedTransactionParticipantCount, 0);
  assert.equal(a.executableTransactionParticipantCount, 0);
  assert.equal(a.blockedTransactionParticipantCount, 30);
  assert.equal(a.invalidTransactionParticipantCount, 0);
  assert.equal(a.sourcePipelineStageCount, 30);
  assert.equal(a.coveredPipelineStageCount, 30);
  assert.equal(a.uncoveredPipelineStageCount, 0);
  assert.equal(a.duplicateCoveredPipelineStageCount, 0);
  assert.equal(a.unknownReferencedPipelineStageCount, 0);
  assert.equal(a.pipelineCoverageComplete, true);
  assert.equal(a.pipelineCoverageExact, true);
  assert.equal(a.pipelineOrderPreserved, true);
  assert.equal(a.transactionParticipantGraphAcyclic, true);
  assert.equal(a.transactionContextPresent, false);
  assert.equal(a.transactionHandlePresent, false);
  assert.equal(a.transactionJournalPresent, false);
  assert.equal(a.transactionLockPresent, false);
  assert.equal(a.writeSetPresent, false);
  assert.equal(a.mutationSetPresent, false);
  assert.equal(a.commandPresent, false);
  assert.equal(a.schedulerPresent, false);
  assert.equal(a.executorPresent, false);
  assert.equal(a.dispatcherPresent, false);
  assert.equal(a.queuePresent, false);
  assert.equal(a.issuanceTransactionExecutionImpossible, true);
  assert.equal(a.issuanceTransactionExecuted, false);
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
  assert.equal(a.issuanceTransactionPolicy, CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_POLICY);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  );
  assert.deepEqual(
    [...a.issuanceTransactionConditions],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS],
  );
  assert.equal(a.issuanceTransactionConditions.length, 228);
  assert.deepEqual(
    [...a.satisfiedIssuanceTransactionConditions],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS],
  );
  assert.equal(a.unsatisfiedIssuanceTransactionConditions.length, 0);
  assert.deepEqual(
    [...a.issuanceTransactionGuards],
    [...CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_GUARDS],
  );
  assert.equal(a.issuanceTransactionGuards.length, 83);
  assert.equal(a.unsatisfiedIssuanceTransactionGuards.length, 0);
  assert.ok(
    a.issuanceTransactionBlockers.includes(
      PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
    ),
  );
  assert.equal(
    a.selectedTransition,
    CONTROLLED_HOST_ACTIVATION_SELECTED_TRANSITION,
  );
  assert.equal(
    new Set(a.issuanceTransactionConditions).size,
    a.issuanceTransactionConditions.length,
  );
  assert.equal(new Set(a.issuanceTransactionGuards).size, a.issuanceTransactionGuards.length);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("authorization grant issuance plan descriptor deterministic");
}

{
  const evaluation =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceTransaction(
      createControlledHostRegistry(),
    );
  assert.equal(
    evaluation.descriptor.issuanceTransactionResult,
    "authorization-grant-issuance-transaction-ready-not-opened",
  );
  assert.equal(evaluation.diagnostics.issuanceTransactionCompleted, true);
  assert.equal(evaluation.diagnostics.issuanceTransactionReady, true);
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
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.22");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.23");
  assert.equal(evaluation.diagnostics.issuanceImpossible, true);
  assert.equal(evaluation.diagnostics.authorityImpossible, true);
  assert.equal(evaluation.diagnostics.executionImpossible, true);
  assert.equal(
    evaluation.diagnostics.conditionCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS.length,
  );
  assert.equal(
    evaluation.diagnostics.satisfiedConditionCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS.length,
  );
  assert.equal(evaluation.diagnostics.unsatisfiedConditionCount, 0);
  assert.equal(
    evaluation.diagnostics.guardCount,
    CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_GUARDS.length,
  );
  assert.equal(evaluation.diagnostics.unsatisfiedGuardCount, 0);
  ok(
    "authorization grant issuance pipeline engine + diagnostics metadata only (currentPhase 3B.3.22, chained from 3B.3.18)",
  );
}

{
  const base =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor(
        { ...base, grantIssued: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor(
        { ...base, grantCreated: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor(
        { ...base, grantAuthorityAvailable: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor(
        { ...base, tokenPresent: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor(
        { ...base, canStartActivation: true },
      ),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionDescriptor(
        { ...base, currentState: "ACTIVE" },
      ),
    HardContractViolation,
  );
  ok("authorization grant issuance plan descriptor fail-closed");
}

console.log(
  "\n[phase3b322] contract + identity + gate + host metadata + prepared + permanent block",
);

{
  const c =
    createControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionContract();
  assert.equal(
    c.issuanceTransactionResult,
    "authorization-grant-issuance-transaction-ready-not-opened",
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
  assert.equal(c.issuanceTransactionExecuted, false);
  assert.equal(c.grantCreationAllowed, false);
  assert.equal(c.grantIssuanceAllowed, false);
  assert.equal(c.grantMaterializationAllowed, false);
  assert.equal(c.authorizationGrantAllowed, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransitionAuthorizationGrantIssuanceTransactionContract(
        { ...c, remountAllowed: true },
      ),
    HardContractViolation,
  );
  ok("authorization grant issuance pipeline contract fail-closed");
}

{
  const id =
    createFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.expectedUnmountCount, 0);
  assert.equal(id.grantCreationViaIssuanceTransactionAllowed, false);
  assert.equal(id.grantIssuanceViaIssuanceTransactionAllowed, false);
  assert.equal(id.grantMaterializationViaIssuanceTransactionAllowed, false);
  assert.equal(id.grantAuthorityViaIssuanceTransactionAllowed, false);
  assert.equal(id.authorizationGrantViaIssuanceTransactionAllowed, false);
  assert.equal(id.activationViaIssuanceTransactionAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.tokenViaIssuanceTransactionAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity(
        { ...id, remountAllowed: true },
      ),
    HardContractViolation,
  );
  ok(
    "authorization grant issuance pipeline identity forbids grant creation/issuance/materialization/authority",
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
    phase3b322ProofValid: true,
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
    observedTransitionAuthorizationGrantIssuanceTransactionState: "completed",
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  } as Parameters<typeof evaluateFeedHostActivationGate>[0]);
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(
      PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.43");
  assert.equal(gate.eligibleStep, "3B.3.44");
  ok(
    "activation remains impossible (gate currentStep=3B.3.23, eligibleStep=3B.3.24)",
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
  assert.equal(host.nextEligibleStep, "3B.3.44");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
    ),
  );
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
    ),
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.37",
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
    createFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract(
      {
        evidenceCommit: "abcdef0123456789",
        evidenceArtifactPath:
          "docs/audits/artifacts/phase3b322/phase3b3-20-feed-host-activation-transition-authorization-grant-issuance-transaction-proof.json",
        conditionCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS.length,
        satisfiedConditionCount:
          CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_CONDITIONS.length,
        guardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_GUARDS.length,
        satisfiedGuardCount: CONTROLLED_HOST_ACTIVATION_ISSUANCE_TRANSACTION_GUARDS.length,
      },
    );
  assert.equal(
    prepared.status,
    "host-activation-transition-authorization-grant-issuance-transaction-prepared",
  );
  assert.equal(prepared.nextEligibleStep, "3B.3.23");
  assert.equal(prepared.currentState, "COMMIT_READY");
  assert.equal(prepared.grantIssued, false);
  assert.equal(prepared.issuanceTransactionExecuted, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionPreparedContract(
        { ...prepared, grantIssued: true },
      ),
    HardContractViolation,
  );
  ok("prepared authorization grant issuance pipeline fail-closed");
}

{
  assert.ok(
    CONTROLLED_HOST_ACTIVATION_GRANT_ISSUANCE_TRANSACTION_BLOCKERS.includes(
      PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY,
    ),
  );
  const e =
    evaluateControlledHostActivationTransitionAuthorizationGrantIssuanceTransaction();
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
  ok("grant issuance permanently blocked with PHASE_3B3_22 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.22 host activation transition authorization grant issuance pipeline: ${passed} assertions ok\n`,
);
