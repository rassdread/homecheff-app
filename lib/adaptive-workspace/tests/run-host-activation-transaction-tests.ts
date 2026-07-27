/**
 * Phase 3B.3.10 — host activation transaction unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationTransactionDescriptor,
  evaluateControlledHostActivationTransaction,
  validateControlledHostActivationTransactionDescriptor,
  createControlledHostActivationTransactionContract,
  validateControlledHostActivationTransactionContract,
  createFeedHostActivationTransactionIdentity,
  validateFeedHostActivationTransactionIdentity,
  createFeedHostActivationTransactionPreparedContract,
  validateFeedHostActivationTransactionPreparedContract,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS,
  CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
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
  PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY,
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

console.log("\n[phase3b310] activation transaction descriptor + engine");

{
  const a = createControlledHostActivationTransactionDescriptor();
  const b = createControlledHostActivationTransactionDescriptor();
  assert.equal(a.transactionState, "completed");
  assert.equal(a.transactionResult, "transaction-complete-not-committed");
  assert.equal(a.wouldCommit, true);
  assert.equal(a.transactionCommitted, false);
  assert.equal(a.beginState, "legacy-dormant-single-mount");
  assert.equal(
    a.intendedEndState,
    "controlled-host-active-same-instance-no-remount",
  );
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(a.activationBlocker, PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY);
  assert.deepEqual(
    [...a.commitConditions],
    [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMMIT_CONDITIONS],
  );
  assert.deepEqual(
    [...a.rollbackConditions],
    [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_ROLLBACK_CONDITIONS],
  );
  assert.deepEqual(
    [...a.transactionCheckpoints],
    [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_CHECKPOINTS],
  );
  assert.deepEqual(
    [...a.compensatingActions],
    [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_COMPENSATING_ACTIONS],
  );
  assert.deepEqual(
    [...a.abortConditions],
    [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_ABORT_CONDITIONS],
  );
  assert.deepEqual(
    [...a.transactionInputSources],
    [...CONTROLLED_HOST_ACTIVATION_TRANSACTION_INPUT_SOURCES],
  );
  assert.equal(a.invariants.length, 20);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("transaction descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationTransaction(
    createControlledHostRegistry(),
  );
  assert.equal(
    evaluation.descriptor.transactionResult,
    "transaction-complete-not-committed",
  );
  assert.equal(evaluation.diagnostics.transactionCompleted, true);
  assert.equal(evaluation.diagnostics.wouldCommit, true);
  assert.equal(evaluation.diagnostics.transactionCommitted, false);
  assert.equal(evaluation.diagnostics.commitBlocked, true);
  assert.equal(evaluation.diagnostics.rollbackExecutionBlocked, true);
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.10");
  assert.equal(evaluation.diagnostics.pipelineStatus, "completed");
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  ok("transaction engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationTransactionDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationTransactionDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransactionDescriptor({
        ...base,
        transactionCommitted: true,
      }),
    HardContractViolation,
  );
  ok("transaction descriptor fail-closed");
}

console.log("\n[phase3b310] contract + identity + activation safety");

{
  const c = createControlledHostActivationTransactionContract();
  assert.equal(c.transactionResult, "transaction-complete-not-committed");
  assert.equal(c.wouldCommit, true);
  assert.equal(c.transactionCommitted, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(c.schedulerAllowed, false);
  assert.equal(c.commitAllowed, false);
  assert.equal(c.rollbackExecutionAllowed, false);
  assert.equal(c.runtimeMutationAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationTransactionContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("transaction contract fail-closed");
}

{
  const id = createFeedHostActivationTransactionIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaTransactionAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.commitViaTransactionAllowed, false);
  assert.equal(id.rollbackExecutionViaTransactionAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationTransactionIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("transaction identity forbids activation/commit");
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
    gate.blockers.includes(PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY),
  );
  assert.equal(gate.currentStep, "3B.3.38");
  assert.equal(gate.eligibleStep, "3B.3.39");
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
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transactionState,
    "completed",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.wouldCommit,
    true,
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transactionCommitted,
    false,
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback unchanged");
}

{
  const ready = createFeedHostActivationTransactionPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b310/phase3b3-10-feed-host-activation-transaction-proof.json",
  });
  assert.equal(ready.status, "host-activation-transaction-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.11");
  assert.equal(ready.transactionResult, "transaction-complete-not-committed");
  assert.equal(ready.wouldCommit, true);
  assert.equal(ready.transactionCommitted, false);
  assert.equal(ready.canStartActivation, false);
  assert.throws(
    () =>
      validateFeedHostActivationTransactionPreparedContract({
        ...ready,
        transactionCommitted: true,
      }),
    HardContractViolation,
  );
  ok("prepared transaction fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.10 host activation transaction: ${passed} assertions ok\n`,
);
