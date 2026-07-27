/**
 * Phase 3B.3.31 — controlled workspace host activation transaction-opening authorization unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostActivationTransactionOpeningAuthorizationDescriptor,
  evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization,
  validateControlledWorkspaceHostActivationTransactionOpeningAuthorizationDescriptor,
  createControlledWorkspaceHostActivationTransactionOpeningAuthorizationContract,
  validateControlledWorkspaceHostActivationTransactionOpeningAuthorizationContract,
  createFeedWorkspaceHostActivationTransactionOpeningAuthorizationIdentity,
  validateFeedWorkspaceHostActivationTransactionOpeningAuthorizationIdentity,
  createFeedWorkspaceHostActivationTransactionOpeningAuthorizationPreparedContract,
  validateFeedWorkspaceHostActivationTransactionOpeningAuthorizationPreparedContract,
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
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_BLOCKERS,
  PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY,
  PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY,
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
  "\n[phase3b331] activation transaction-opening authorization descriptor + engine",
);

{
  const a = createControlledWorkspaceHostActivationTransactionOpeningAuthorizationDescriptor();
  const b = createControlledWorkspaceHostActivationTransactionOpeningAuthorizationDescriptor();
  assert.equal(a.currentPhase, "3B.3.31");
  assert.equal(a.previousPhase, "3B.3.30");
  assert.equal(a.nextEligibleStep, "3B.3.32");
  assert.equal(
    a.transactionOpeningAuthorizationResult,
    "controlled-workspace-host-activation-transaction-opening-authorized-not-opened",
  );
  assert.equal(a.transactionOpeningAuthorizationState, "TRANSACTION_OPENING_AUTHORIZED_NOT_OPENED");
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
    a.activationTransactionOpeningAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
  );
  assert.equal(
    a.activationTransactionOpeningAuthorizationContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
  );
  assert.equal(a.activationCommitBoundaryState, "ENTERED");
  assert.equal(a.issuanceTransactionState, "NOT_OPENED");
  assert.equal(a.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(a.transactionOpeningReady, true);
  assert.equal(a.transactionOpeningAuthorized, true);
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
    PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic transaction-opening authorization descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization();
  const d = evaluation.descriptor;
  const diag = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.31");
  assert.equal(
    d.transactionOpeningAuthorizationResult,
    "controlled-workspace-host-activation-transaction-opening-authorized-not-opened",
  );
  assert.equal(d.transactionOpeningAuthorizationState, "TRANSACTION_OPENING_AUTHORIZED_NOT_OPENED");
  assert.equal(d.activationCommitBoundaryState, "ENTERED");
  assert.equal(d.issuanceTransactionState, "NOT_OPENED");
  assert.equal(d.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.transactionOpeningReady, true);
  assert.equal(d.transactionOpeningAuthorized, true);
  assert.equal(d.transactionOpeningStarted, false);
  assert.equal(d.transactionOpeningCompleted, false);
  assert.equal(diag.transactionOpeningReady, true);
  assert.equal(diag.transactionOpeningAuthorized, true);
  assert.equal(diag.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.workspaceCandidateRendered, false);
  assert.equal(d.owner, "legacy");
  assert.equal(d.writer, "legacy");
  assert.equal(d.renderer, "legacy");
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY,
  );
  assert.equal(CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONDITIONS.length > 0, true);
  assert.equal(CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_GUARDS.length > 0, true);
  ok("engine diagnostics metadata only (chained from 3B.3.30)");
}

{
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionOpeningAuthorizationDescriptor({
        ...createControlledWorkspaceHostActivationTransactionOpeningAuthorizationDescriptor(),
        candidateActivated: true,
      } as ReturnType<typeof createControlledWorkspaceHostActivationTransactionOpeningAuthorizationDescriptor>),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization({
        issuanceTransactionState: "OPENED",
      } as Parameters<typeof evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization>[0]),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization({
        issuancePipelineExecutable: true,
      } as Parameters<typeof evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization>[0]),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization({
        shellRendered: true,
      } as Parameters<typeof evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization>[0]),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization({
        owner: "workspace",
      } as Parameters<typeof evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization>[0]),
    HardContractViolation,
  );
  ok("fail-closed duplicate/activated/transaction/pipeline/shell/ownership paths");
}

console.log("\n[phase3b331] contract + identity + prepared");

{
  const contract = createControlledWorkspaceHostActivationTransactionOpeningAuthorizationContract();
  assert.equal(contract.phase, "3B.3.31");
  assert.equal(contract.nextEligibleStep, "3B.3.32");
  assert.equal(contract.transactionOpeningAuthorizationState, "TRANSACTION_OPENING_AUTHORIZED_NOT_OPENED");
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionOpeningAuthorizationContract({
        ...contract,
        candidateActivated: true,
      } as typeof contract),
    HardContractViolation,
  );
  ok("transaction-opening authorization contract fail-closed");
}

{
  const identity = createFeedWorkspaceHostActivationTransactionOpeningAuthorizationIdentity();
  assert.equal(
    identity.activationTransactionOpeningAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
  );
  assert.equal(
    identity.activationCommitBoundaryEntryId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
  );
  assert.equal(identity.expectedOwner, "legacy");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionOpeningAuthorizationIdentity({
        ...identity,
        remountAllowed: true,
      } as typeof identity),
    HardContractViolation,
  );
  ok("transaction-opening authorization identity forbids remount and further progression");
}

{
  const prepared = createFeedWorkspaceHostActivationTransactionOpeningAuthorizationPreparedContract({
    evidenceCommit: "test",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b331/test.json",
    conditionCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_GUARDS.length,
  });
  assert.equal(prepared.phase, "3B.3.31");
  assert.equal(prepared.nextEligibleStep, "3B.3.32");
  assert.equal(prepared.issuanceTransactionState, "NOT_OPENED");
  assert.equal(prepared.transactionOpeningReady, true);
  assert.equal(prepared.transactionOpeningAuthorized, true);
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionOpeningAuthorizationPreparedContract({
        ...prepared,
        hostActivation: true,
      } as typeof prepared),
    HardContractViolation,
  );
  ok("prepared transaction-opening authorization fail-closed");
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
      PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.39");
  assert.equal(gate.eligibleStep, "3B.3.40");
  ok("activation remains impossible (gate currentStep=3B.3.39, eligibleStep=3B.3.40)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.40");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.40");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_BLOCKERS.includes(
      PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionOpeningAuthorization();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
  assert.equal(evaluation.descriptor.transactionOpeningReady, true);
  assert.equal(evaluation.descriptor.transactionOpeningAuthorized, true);
  assert.equal(evaluation.descriptor.issuanceTransactionState, "NOT_OPENED");
  assert.equal(evaluation.descriptor.issuancePipelineState, "NON_EXECUTABLE");
  ok("candidate authorized-not-opened with PHASE_3B3_31 blocker");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.31 controlled workspace host activation transaction opening authorization: ${passed} assertions ok\n`,
);
