/**
 * Phase 3B.3.11 — host activation commit readiness unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledHostActivationCommitReadinessDescriptor,
  evaluateControlledHostActivationCommitReadiness,
  validateControlledHostActivationCommitReadinessDescriptor,
  createControlledHostActivationCommitReadinessContract,
  validateControlledHostActivationCommitReadinessContract,
  createFeedHostActivationCommitReadinessIdentity,
  validateFeedHostActivationCommitReadinessIdentity,
  createFeedHostActivationCommitReadinessPreparedContract,
  validateFeedHostActivationCommitReadinessPreparedContract,
  CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_INPUT_SOURCES,
  CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS,
  CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
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

console.log("\n[phase3b311] activation commit readiness descriptor + engine");

{
  const a = createControlledHostActivationCommitReadinessDescriptor();
  const b = createControlledHostActivationCommitReadinessDescriptor();
  assert.equal(a.readinessState, "completed");
  assert.equal(a.readinessResult, "commit-ready-not-executable");
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
    PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  );
  assert.deepEqual(
    [...a.commitPreconditions],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_PRECONDITIONS],
  );
  assert.deepEqual(
    [...a.commitValidationPoints],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_VALIDATION_POINTS],
  );
  assert.deepEqual(
    [...a.commitAbortConditions],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_ABORT_CONDITIONS],
  );
  assert.deepEqual(
    [...a.readinessInputSources],
    [...CONTROLLED_HOST_ACTIVATION_COMMIT_READINESS_INPUT_SOURCES],
  );
  assert.equal(a.invariants.length, 20);
  assert.equal(stableStringify(a), stableStringify(b));
  ok("commit readiness descriptor deterministic");
}

{
  const evaluation = evaluateControlledHostActivationCommitReadiness(
    createControlledHostRegistry(),
  );
  assert.equal(
    evaluation.descriptor.readinessResult,
    "commit-ready-not-executable",
  );
  assert.equal(evaluation.diagnostics.readinessCompleted, true);
  assert.equal(evaluation.diagnostics.commitReady, true);
  assert.equal(evaluation.diagnostics.wouldCommit, true);
  assert.equal(evaluation.diagnostics.commitBlocked, true);
  assert.equal(evaluation.diagnostics.transactionCommitted, false);
  assert.equal(evaluation.diagnostics.commitExecuted, false);
  assert.equal(evaluation.diagnostics.ownershipTransferred, false);
  assert.equal(evaluation.diagnostics.writerTransferred, false);
  assert.equal(evaluation.diagnostics.rendererTransferred, false);
  assert.equal(evaluation.diagnostics.activationBlocked, true);
  assert.equal(evaluation.diagnostics.canStartActivation, false);
  assert.equal(evaluation.diagnostics.currentPhase, "3B.3.11");
  assert.equal(evaluation.diagnostics.nextEligibleStep, "3B.3.12");
  assert.equal(evaluation.diagnostics.registryHostCount, 1);
  ok("commit readiness engine + diagnostics metadata only");
}

{
  const base = createControlledHostActivationCommitReadinessDescriptor();
  assert.throws(
    () =>
      validateControlledHostActivationCommitReadinessDescriptor({
        ...base,
        canStartActivation: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationCommitReadinessDescriptor({
        ...base,
        transactionCommitted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledHostActivationCommitReadinessDescriptor({
        ...base,
        ownershipTransferred: true,
      }),
    HardContractViolation,
  );
  ok("commit readiness descriptor fail-closed");
}

console.log("\n[phase3b311] contract + identity + activation safety");

{
  const c = createControlledHostActivationCommitReadinessContract();
  assert.equal(c.readinessResult, "commit-ready-not-executable");
  assert.equal(c.wouldCommit, true);
  assert.equal(c.commitReady, true);
  assert.equal(c.commitBlocked, true);
  assert.equal(c.transactionCommitted, false);
  assert.equal(c.commitExecuted, false);
  assert.equal(c.ownershipTransferred, false);
  assert.equal(c.writerTransferred, false);
  assert.equal(c.rendererTransferred, false);
  assert.equal(c.canStartActivation, false);
  assert.equal(c.executorAllowed, false);
  assert.equal(c.schedulerAllowed, false);
  assert.equal(c.commitAllowed, false);
  assert.equal(c.ownershipTransferAllowed, false);
  assert.equal(c.writerTransferAllowed, false);
  assert.equal(c.rendererTransferAllowed, false);
  assert.equal(c.runtimeMutationAllowed, false);
  assert.equal(
    c.activationRestriction,
    PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY,
  );
  assert.throws(
    () =>
      validateControlledHostActivationCommitReadinessContract({
        ...c,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("commit readiness contract fail-closed");
}

{
  const id = createFeedHostActivationCommitReadinessIdentity();
  assert.equal(id.expectedMountCount, 1);
  assert.equal(id.activationViaCommitReadinessAllowed, false);
  assert.equal(id.canStartActivationAllowed, false);
  assert.equal(id.commitViaCommitReadinessAllowed, false);
  assert.equal(id.ownershipTransferViaCommitReadinessAllowed, false);
  assert.equal(id.writerTransferViaCommitReadinessAllowed, false);
  assert.equal(id.rendererTransferViaCommitReadinessAllowed, false);
  assert.equal(id.runtimeId, FEED_DISCOVERY_STABLE_RUNTIME_ID);
  assert.throws(
    () =>
      validateFeedHostActivationCommitReadinessIdentity({
        ...id,
        remountAllowed: true,
      }),
    HardContractViolation,
  );
  ok("commit readiness identity forbids activation/commit/transfer");
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
    gate.blockers.includes(PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY),
  );
  assert.equal(gate.currentStep, "3B.3.30");
  assert.equal(gate.eligibleStep, "3B.3.31");
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
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.commitReadinessState,
    "completed",
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.commitReady, true);
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.wouldCommit, true);
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.transactionCommitted,
    false,
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.commitExecuted, false);
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.ownershipTransferred,
    false,
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.writerTransferred, false);
  assert.equal(
    FEED_DISCOVERY_HOST_CANDIDATE_METADATA.rendererTransferred,
    false,
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.canStartActivation, false);
  ok("owner/writer/renderer/registry/rollback/transfers unchanged");
}

{
  const ready = createFeedHostActivationCommitReadinessPreparedContract({
    evidenceCommit: "abcdef0123456789",
    evidenceArtifactPath:
      "docs/audits/artifacts/phase3b311/phase3b3-11-feed-host-activation-commit-readiness-proof.json",
  });
  assert.equal(ready.status, "host-activation-commit-readiness-prepared");
  assert.equal(ready.nextEligibleStep, "3B.3.12");
  assert.equal(ready.readinessResult, "commit-ready-not-executable");
  assert.equal(ready.wouldCommit, true);
  assert.equal(ready.commitReady, true);
  assert.equal(ready.transactionCommitted, false);
  assert.equal(ready.canStartActivation, false);
  assert.throws(
    () =>
      validateFeedHostActivationCommitReadinessPreparedContract({
        ...ready,
        commitExecuted: true,
      }),
    HardContractViolation,
  );
  ok("prepared commit readiness fail-closed");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.11 host activation commit readiness: ${passed} assertions ok\n`,
);
