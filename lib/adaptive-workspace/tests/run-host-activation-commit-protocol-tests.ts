/**
 * Phase 3B.3.12 — host activation commit protocol unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationCommitProtocolDescriptor,
  evaluateControlledHostActivationCommitProtocol,
  validateControlledHostActivationCommitProtocolDescriptor,
  createControlledHostActivationCommitProtocolContract,
  validateControlledHostActivationCommitProtocolContract,
  createFeedHostActivationCommitProtocolIdentity,
  validateFeedHostActivationCommitProtocolIdentity,
  createFeedHostActivationCommitProtocolPreparedContract,
  validateFeedHostActivationCommitProtocolPreparedContract,
  CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES,
  CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE,
  CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY,
  PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY,
  PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY,
  PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY,
  PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY,
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
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

console.log("\n[phase3b312] activation commit protocol descriptor + engine");

{
  const a = createControlledHostActivationCommitProtocolDescriptor();
  const b = createControlledHostActivationCommitProtocolDescriptor();
  assert.equal(a.protocolState, "completed");
  assert.equal(a.protocolResult, "protocol-complete-not-executable");
  assert.equal(a.protocolExecuted, false);
  assert.equal(a.wouldCommit, true);
  assert.equal(a.commitReady, true);
  assert.equal(a.commitBlocked, true);
  assert.equal(a.transactionCommitted, false);
  assert.equal(a.commitExecuted, false);
  assert.equal(a.ownershipTransferred, false);
  assert.equal(a.writerTransferred, false);
  assert.equal(a.rendererTransferred, false);
  assert.equal(a.activationState, "dormant");
  assert.equal(a.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.equal(a.hostActivation, false);
  assert.equal(a.canStartActivation, false);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  );
  assert.deepEqual(
    [...a.protocolStages],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES],
  );
  assert.deepEqual(
    [...a.commitSequence],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_SEQUENCE],
  );
  assert.deepEqual(
    [...a.commitGuards],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_GUARDS],
  );
  assert.deepEqual(
    [...a.ownershipChecks],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_OWNERSHIP_CHECKS],
  );
  assert.deepEqual(
    [...a.rendererChecks],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_RENDERER_CHECKS],
  );
  assert.deepEqual(
    [...a.writerChecks],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_WRITER_CHECKS],
  );
  assert.deepEqual(
    [...a.protocolInputSources],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_INPUT_SOURCES],
  );
  assert.equal(a.invariants.length, 20);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("commit protocol descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationCommitProtocol(
    createControlledHostRegistry(),
  );
  assert.equal(
    evaluation.descriptor.protocolResult,
    "protocol-complete-not-executable",
  );
  assert.equal(evaluation.diagnostics.protocolCompleted, true);
  assert.equal(evaluation.diagnostics.protocolExecuted, false);
  assert.equal(evaluation.diagnostics.wouldCommit, true);
  assert.equal(evaluation.diagnostics.commitReady, true);
  assert.equal(evaluation.diagnostics.commitBlocked, true);
  assert.equal(evaluation.diagnostics.transactionCommitted, false);
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.12");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.13");
  assert.equal(
    evaluation.diagnostics.stageCount,
    CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES.length,
  );
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  ok("commit protocol engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationCommitProtocolDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationCommitProtocolDescriptor({
        ...base,
        protocolExecuted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationCommitProtocolDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  ok("commit protocol descriptor fail-closed");
}

console.log("\n[phase3b312] contract + identity + activation safety");

{
  const c = createControlledHostActivationCommitProtocolContract();
  assert.equal(c.protocolResult, "protocol-complete-not-executable");
  assert.equal(c.protocolExecuted, false);
  assert.equal(c.wouldCommit, true);
  assert.equal(c.commitReady, true);
  assert.equal(c.transactionCommitted, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(c.schedulerAllowed, false);
  assert.equal(c.commitAllowed, false);
  assert.equal(c.protocolExecutionAllowed, false);
  assert.equal(c.ownershipTransferAllowed, false);
  assert.equal(c.writerTransferAllowed, false);
  assert.equal(c.rendererTransferAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationCommitProtocolContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("commit protocol contract fail-closed");
}

{
  const id = createFeedHostActivationCommitProtocolIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaCommitProtocolAllowed, false);
  assert.equal(id.protocolExecutionViaCommitProtocolAllowed, false);
  assert.equal(id.commitViaCommitProtocolAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationCommitProtocolIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("commit protocol identity forbids activation/commit/protocol execution");
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
    gate.blockers.includes(PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY),
  );
  assert.equal(gate.currentStep, "3B.3.43");
  assert.equal(gate.eligibleStep, "3B.3.44");
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
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.commitProtocolState,
    "completed",
  );
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.commitProtocolResult,
    "protocol-complete-not-executable",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.protocolExecuted, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transactionCommitted, false);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback/protocol unchanged");
}

{
  const ready = createFeedHostActivationCommitProtocolPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b312/phase3b3-12-feed-host-activation-commit-protocol-proof.json",
    stageCount: CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_STAGES.length,
  });
  assert.equal(ready.status, "host-activation-commit-protocol-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.13");
  assert.equal(ready.protocolResult, "protocol-complete-not-executable");
  assert.equal(ready.protocolExecuted, false);
  assert.equal(ready.canStartActivation, false);
  assert.throws(
    () =>
      validateFeedHostActivationCommitProtocolPreparedContract({
        ...ready,
        protocolExecuted: true,
      }),
    HardContractViolation,
  );
  ok("prepared commit protocol fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.12 host activation commit protocol: ${passed} assertions ok\n`,
);
