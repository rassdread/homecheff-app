/**
 * Phase 3B.3.30 — controlled workspace host activation transaction-opening readiness unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostActivationTransactionOpeningReadinessDescriptor,
  evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness,
  validateControlledWorkspaceHostActivationTransactionOpeningReadinessDescriptor,
  createControlledWorkspaceHostActivationTransactionOpeningReadinessContract,
  validateControlledWorkspaceHostActivationTransactionOpeningReadinessContract,
  createFeedWorkspaceHostActivationTransactionOpeningReadinessIdentity,
  validateFeedWorkspaceHostActivationTransactionOpeningReadinessIdentity,
  createFeedWorkspaceHostActivationTransactionOpeningReadinessPreparedContract,
  validateFeedWorkspaceHostActivationTransactionOpeningReadinessPreparedContract,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_BLOCKERS,
  PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY,
  PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
  createControlledHostRegistry,
  createControlledFeedHostContract,
  createFeedHostRollbackContract,
  evaluateFeedHostActivationGate,
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
  "\n[phase3b330] activation transaction-opening readiness descriptor + engine",
);

{
  const a = createControlledWorkspaceHostActivationTransactionOpeningReadinessDescriptor();
  const b = createControlledWorkspaceHostActivationTransactionOpeningReadinessDescriptor();
  assert.equal(a.currentPhase, "3B.3.30");
  assert.equal(a.previousPhase, "3B.3.29");
  assert.equal(a.nextEligibleStep, "3B.3.31");
  assert.equal(
    a.transactionOpeningReadinessResult,
    "controlled-workspace-host-activation-transaction-opening-ready-not-opened",
  );
  assert.equal(a.transactionOpeningReadinessState, "TRANSACTION_OPENING_READY_NOT_OPENED");
  assert.equal(a.candidateId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID);
  assert.equal(a.registrationId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID);
  assert.equal(a.selectionId, CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID);
  assert.equal(a.activationReadinessId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID);
  assert.equal(a.activationAuthorizationId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID);
  assert.equal(a.activationGrantId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID);
  assert.equal(a.activationGrantIssuanceId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID);
  assert.equal(a.activationCommitBoundaryId, CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID);
  assert.equal(
    a.activationTransactionOpeningReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
  );
  assert.equal(
    a.activationTransactionOpeningReadinessContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID,
  );
  assert.equal(a.activationCommitBoundaryState, "ENTERED");
  assert.equal(a.issuanceTransactionState, "NOT_OPENED");
  assert.equal(a.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(a.transactionOpeningReady, true);
  assert.equal(a.transactionOpeningAuthorized, false);
  assert.equal(a.transactionOpeningStarted, false);
  assert.equal(a.transactionOpeningCompleted, false);
  assert.equal(a.candidateActivated, false);
  assert.equal(a.candidateActive, false);
  assert.equal(a.candidateExecutable, false);
  assert.equal(a.runtimeCapabilityPresent, false);
  assert.equal(a.runtimeHostInstancePresent, false);
  assert.equal(a.activationHandlePresent, false);
  assert.equal(a.executionHandlePresent, false);
  assert.equal(a.workspaceCandidateRendered, false);
  assert.equal(a.workspaceHostMounted, false);
  assert.equal(a.workspaceVisible, false);
  assert.equal(a.workspaceCandidateReactInstancePresent, false);
  assert.equal(a.geoFeedRenderCount, 1);
  assert.equal(a.mountCount, 1);
  assert.equal(a.unmountCount, 0);
  assert.equal(a.activeInstanceCount, 1);
  assert.equal(a.owner, "legacy");
  assert.equal(a.writer, "legacy");
  assert.equal(a.renderer, "legacy");
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic transaction-opening readiness descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness();
  const d = evaluation.descriptor;
  const diag = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.30");
  assert.equal(
    d.transactionOpeningReadinessResult,
    "controlled-workspace-host-activation-transaction-opening-ready-not-opened",
  );
  assert.equal(d.transactionOpeningReadinessState, "TRANSACTION_OPENING_READY_NOT_OPENED");
  assert.equal(d.activationCommitBoundaryState, "ENTERED");
  assert.equal(d.issuanceTransactionState, "NOT_OPENED");
  assert.equal(d.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.transactionOpeningReady, true);
  assert.equal(d.transactionOpeningAuthorized, false);
  assert.equal(d.transactionOpeningStarted, false);
  assert.equal(d.transactionOpeningCompleted, false);
  assert.equal(diag.transactionOpeningReady, true);
  assert.equal(diag.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.workspaceCandidateRendered, false);
  assert.equal(d.owner, "legacy");
  assert.equal(d.writer, "legacy");
  assert.equal(d.renderer, "legacy");
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
  );
  assert.equal(CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONDITIONS.length > 0, true);
  assert.equal(CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_GUARDS.length > 0, true);
  ok("engine diagnostics metadata only (chained from 3B.3.29)");
}

{
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionOpeningReadinessDescriptor({
        ...createControlledWorkspaceHostActivationTransactionOpeningReadinessDescriptor(),
        candidateActivated: true,
      } as ReturnType<typeof createControlledWorkspaceHostActivationTransactionOpeningReadinessDescriptor>),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness({
        issuanceTransactionState: "OPENED",
      } as Parameters<typeof evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness>[0]),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness({
        issuancePipelineExecutable: true,
      } as Parameters<typeof evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness>[0]),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness({
        shellRendered: true,
      } as Parameters<typeof evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness>[0]),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness({
        owner: "workspace",
      } as Parameters<typeof evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness>[0]),
    HardContractViolation,
  );
  ok("fail-closed duplicate/activated/transaction/pipeline/shell/ownership paths");
}

console.log("\n[phase3b330] contract + identity + prepared");

{
  const contract = createControlledWorkspaceHostActivationTransactionOpeningReadinessContract();
  assert.equal(contract.phase, "3B.3.30");
  assert.equal(contract.nextEligibleStep, "3B.3.31");
  assert.equal(contract.transactionOpeningReadinessState, "TRANSACTION_OPENING_READY_NOT_OPENED");
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionOpeningReadinessContract({
        ...contract,
        candidateActivated: true,
      } as typeof contract),
    HardContractViolation,
  );
  ok("transaction-opening readiness contract fail-closed");
}

{
  const identity = createFeedWorkspaceHostActivationTransactionOpeningReadinessIdentity();
  assert.equal(
    identity.activationTransactionOpeningReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
  );
  assert.equal(
    identity.activationCommitBoundaryEntryId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
  );
  assert.equal(identity.expectedOwner, "legacy");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionOpeningReadinessIdentity({
        ...identity,
        remountAllowed: true,
      } as typeof identity),
    HardContractViolation,
  );
  ok("transaction-opening readiness identity forbids remount and further progression");
}

{
  const prepared = createFeedWorkspaceHostActivationTransactionOpeningReadinessPreparedContract({
    evidenceCommit: "test",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b330/test.json",
    conditionCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_GUARDS.length,
  });
  assert.equal(prepared.phase, "3B.3.30");
  assert.equal(prepared.nextEligibleStep, "3B.3.31");
  assert.equal(prepared.issuanceTransactionState, "NOT_OPENED");
  assert.equal(prepared.transactionOpeningReady, true);
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionOpeningReadinessPreparedContract({
        ...prepared,
        hostActivation: true,
      } as typeof prepared),
    HardContractViolation,
  );
  ok("prepared transaction-opening readiness fail-closed");
}

{
  const gate = evaluateFeedHostActivationGate({
    forceHostActivation: true,
    phase3b2ProofValid: true,
    phase3b2FreezeValid: true,
    phase3b32ProofValid: true,
    observedWriter: "legacy",
    observedRenderOwner: "legacy",
    observedMountCount: 1,
    observedRuntimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
  } as Parameters<typeof evaluateFeedHostActivationGate>[0]);
  assert.equal(gate.allowed, false);
  assert.ok(
    gate.blockers.includes(
      PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.38");
  assert.equal(gate.eligibleStep, "3B.3.39");
  ok("activation remains impossible (gate currentStep=3B.3.38, eligibleStep=3B.3.39)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.39");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.39");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_BLOCKERS.includes(
      PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionOpeningReadiness();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
  assert.equal(evaluation.descriptor.transactionOpeningReady, true);
  assert.equal(evaluation.descriptor.transactionOpeningAuthorized, false);
  assert.equal(evaluation.descriptor.issuanceTransactionState, "NOT_OPENED");
  assert.equal(evaluation.descriptor.issuancePipelineState, "NON_EXECUTABLE");
  ok("candidate ready-not-opened with PHASE_3B3_30 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.30 controlled workspace host activation transaction opening readiness: ${passed} assertions ok\n`,
);
