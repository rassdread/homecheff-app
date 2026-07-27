/**
 * Phase 3B.3.33 — controlled workspace host activation transaction-preparation-readiness unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor,
  evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness,
  validateControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor,
  createControlledWorkspaceHostActivationTransactionPreparationReadinessContract,
  validateControlledWorkspaceHostActivationTransactionPreparationReadinessContract,
  createFeedWorkspaceHostActivationTransactionPreparationReadinessIdentity,
  validateFeedWorkspaceHostActivationTransactionPreparationReadinessIdentity,
  createFeedWorkspaceHostActivationTransactionPreparationReadinessPreparedContract,
  validateFeedWorkspaceHostActivationTransactionPreparationReadinessPreparedContract,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_BLOCKERS,
  PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
  PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY,
  PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY,
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
  "\n[phase3b333] activation transaction-preparation-readiness sealed descriptor + engine",
);

{
  const a = createControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor();
  const b = createControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor();
  assert.equal(a.currentPhase, "3B.3.33");
  assert.equal(a.previousPhase, "3B.3.32");
  assert.equal(a.nextEligibleStep, "3B.3.34");
  assert.equal(
    a.transactionPreparationReadinessResult,
    "controlled-workspace-host-activation-transaction-preparation-ready-not-prepared",
  );
  assert.equal(
    a.transactionPreparationReadinessState,
    "TRANSACTION_PREPARATION_READY_NOT_PREPARED",
  );
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
    a.activationTransactionOpeningId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  );
  assert.equal(
    a.activationTransactionOpeningContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
  );
  assert.equal(
    a.activationTransactionPreparationReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
  );
  assert.equal(
    a.activationTransactionPreparationReadinessContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
  );
  assert.equal(a.activationCommitBoundaryState, "ENTERED");
  assert.equal(a.issuanceTransactionState, "OPENED");
  assert.equal(a.issuanceTransactionOpened, true);
  assert.equal(a.issuanceTransactionPrepared, false);
  assert.equal(a.issuanceTransactionCommitted, false);
  assert.equal(a.issuanceTransactionAborted, false);
  assert.equal(a.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(a.transactionOpeningReady, true);
  assert.equal(a.transactionOpeningAuthorized, true);
  assert.equal(a.transactionOpeningStarted, true);
  assert.equal(a.transactionOpeningCompleted, true);
  assert.equal(a.transactionPreparationReady, true);
  assert.equal(a.transactionPreparationAuthorized, false);
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
  assert.equal(a.transactionPreparationReadinessCount, 1);
  assert.equal(a.duplicateTransactionPreparationReadinessCount, 0);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic transaction-preparation-readiness descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness();
  const d = evaluation.descriptor;
  const diag = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.33");
  assert.equal(
    d.transactionPreparationReadinessResult,
    "controlled-workspace-host-activation-transaction-preparation-ready-not-prepared",
  );
  assert.equal(
    d.transactionPreparationReadinessState,
    "TRANSACTION_PREPARATION_READY_NOT_PREPARED",
  );
  assert.equal(d.activationCommitBoundaryState, "ENTERED");
  assert.equal(d.issuanceTransactionState, "OPENED");
  assert.equal(d.issuanceTransactionOpened, true);
  assert.equal(d.issuanceTransactionPrepared, false);
  assert.equal(d.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.transactionOpeningReady, true);
  assert.equal(d.transactionOpeningAuthorized, true);
  assert.equal(d.transactionOpeningStarted, true);
  assert.equal(d.transactionOpeningCompleted, true);
  assert.equal(d.transactionPreparationReady, true);
  assert.equal(d.transactionPreparationAuthorized, false);
  assert.equal(diag.transactionPreparationReady, true);
  assert.equal(diag.transactionPreparationAuthorized, false);
  assert.equal(diag.issuanceTransactionState, "OPENED");
  assert.equal(diag.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.workspaceCandidateRendered, false);
  assert.equal(d.owner, "legacy");
  assert.equal(d.writer, "legacy");
  assert.equal(d.renderer, "legacy");
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONDITIONS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_GUARDS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_BLOCKERS.length > 0,
    true,
  );
  ok("engine diagnostics metadata only (chained from 3B.3.32)");
}

{
  const registry = createControlledHostRegistry();
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor({
        ...createControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor(),
        candidateActivated: true,
      } as ReturnType<
        typeof createControlledWorkspaceHostActivationTransactionPreparationReadinessDescriptor
      >),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry, {
        issuanceTransactionState: "NOT_OPENED",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry, {
        issuanceTransactionPrepared: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry, {
        issuancePipelineExecutable: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry, {
        transactionPreparationReady: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry, {
        transactionPreparationAuthorized: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry, {
        transactionOpeningCompleted: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry, {
        shellRendered: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness(registry, {
        owner: "workspace",
      }),
    HardContractViolation,
  );
  ok("fail-closed duplicate/prepared/pipeline/auth/shell/ownership paths");
}

console.log("\n[phase3b333] sealed contract + identity + prepared");

{
  const contract = createControlledWorkspaceHostActivationTransactionPreparationReadinessContract();
  assert.equal(contract.phase, "3B.3.33");
  assert.equal(contract.nextEligibleStep, "3B.3.34");
  assert.equal(
    contract.transactionPreparationReadinessState,
    "TRANSACTION_PREPARATION_READY_NOT_PREPARED",
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionPreparationReadinessContract({
        ...contract,
        candidateActivated: true,
      } as typeof contract),
    HardContractViolation,
  );
  ok("transaction-preparation-readiness contract");
}

{
  const identity = createFeedWorkspaceHostActivationTransactionPreparationReadinessIdentity();
  assert.equal(identity.phase, "3B.3.33");
  assert.equal(
    identity.activationTransactionOpeningId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  );
  assert.equal(
    identity.activationTransactionPreparationReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
  );
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionPreparationReadinessIdentity({
        ...identity,
        remountAllowed: true,
      } as typeof identity),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionPreparationReadinessIdentity({
        ...identity,
        expectedOwner: "workspace",
      } as typeof identity),
    HardContractViolation,
  );
  ok("transaction-preparation-readiness identity");
}

{
  const prepared = createFeedWorkspaceHostActivationTransactionPreparationReadinessPreparedContract({
    evidenceCommit: "phase3b333-sealed-core",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b333/",
    conditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_GUARDS.length,
    satisfiedGuardCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_GUARDS.length,
  });
  assert.equal(prepared.phase, "3B.3.33");
  assert.equal(prepared.nextEligibleStep, "3B.3.34");
  assert.equal(
    prepared.transactionPreparationReadinessState,
    "TRANSACTION_PREPARATION_READY_NOT_PREPARED",
  );
  assert.equal(prepared.transactionPreparationReady, true);
  assert.equal(prepared.transactionPreparationAuthorized, false);
  assert.equal(prepared.transactionOpeningCompleted, true);
  assert.equal(prepared.issuanceTransactionState, "OPENED");
  assert.equal(prepared.issuanceTransactionOpened, true);
  assert.equal(prepared.issuanceTransactionPrepared, false);
  assert.equal(prepared.issuancePipelineState, "NON_EXECUTABLE");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionPreparationReadinessPreparedContract({
        ...prepared,
        candidateActivated: true,
      } as typeof prepared),
    HardContractViolation,
  );
  ok("transaction-preparation-readiness prepared metadata");
}

console.log("\n[phase3b333] LIVE gate + host continuity");

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
      PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.37");
  assert.equal(gate.eligibleStep, "3B.3.38");
  ok("activation remains impossible (gate currentStep=3B.3.37, eligibleStep=3B.3.38)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.38");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.38");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_BLOCKERS.includes(
      PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionPreparationReadiness();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
  assert.equal(evaluation.descriptor.transactionOpeningCompleted, true);
  assert.equal(evaluation.descriptor.transactionPreparationReady, true);
  assert.equal(evaluation.descriptor.transactionPreparationAuthorized, false);
  assert.equal(evaluation.descriptor.issuanceTransactionState, "OPENED");
  assert.equal(evaluation.descriptor.issuanceTransactionOpened, true);
  assert.equal(evaluation.descriptor.issuanceTransactionPrepared, false);
  assert.equal(evaluation.descriptor.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(evaluation.descriptor.workspaceCandidateRendered, false);
  assert.equal(evaluation.descriptor.owner, "legacy");
  assert.equal(evaluation.descriptor.writer, "legacy");
  assert.equal(evaluation.descriptor.renderer, "legacy");
  ok("candidate preparation-ready-not-prepared with PHASE_3B3_33 blocker; Workspace null; GeoFeed legacy");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.33 controlled workspace host activation transaction preparation readiness: ${passed} assertions ok\n`,
);
