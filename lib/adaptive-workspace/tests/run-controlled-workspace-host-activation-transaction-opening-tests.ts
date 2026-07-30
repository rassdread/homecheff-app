import { PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY } from "../sealed/controlled-workspace-host-candidate-active";
import { PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY,
  PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY } from "../sealed/controlled-workspace-host-candidate-activation";
/**
 * Phase 3B.3.32 — controlled workspace host activation transaction-opening unit tests.
 */
import assert from "node:assert/strict";
import {
  createControlledWorkspaceHostActivationTransactionOpeningDescriptor,
  evaluateControlledWorkspaceHostActivationTransactionOpening,
  validateControlledWorkspaceHostActivationTransactionOpeningDescriptor,
  createControlledWorkspaceHostActivationTransactionOpeningContract,
  validateControlledWorkspaceHostActivationTransactionOpeningContract,
  createFeedWorkspaceHostActivationTransactionOpeningIdentity,
  validateFeedWorkspaceHostActivationTransactionOpeningIdentity,
  createFeedWorkspaceHostActivationTransactionOpeningPreparedContract,
  validateFeedWorkspaceHostActivationTransactionOpeningPreparedContract,
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
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_BLOCKERS,
  PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
  PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY,
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
  "\n[phase3b332] activation transaction-opening descriptor + engine",
);

{
  const a = createControlledWorkspaceHostActivationTransactionOpeningDescriptor();
  const b = createControlledWorkspaceHostActivationTransactionOpeningDescriptor();
  assert.equal(a.currentPhase, "3B.3.32");
  assert.equal(a.previousPhase, "3B.3.31");
  assert.equal(a.nextEligibleStep, "3B.3.33");
  assert.equal(
    a.transactionOpeningResult,
    "controlled-workspace-host-activation-transaction-opened-not-prepared",
  );
  assert.equal(a.transactionOpeningState, "TRANSACTION_OPENED_NOT_PREPARED");
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
  assert.equal(
    a.activationTransactionOpeningId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  );
  assert.equal(
    a.activationTransactionOpeningContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
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
  assert.equal(a.transactionOpeningCount, 1);
  assert.equal(a.duplicateTransactionOpeningCount, 0);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic transaction-opening descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionOpening();
  const d = evaluation.descriptor;
  const diag = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.32");
  assert.equal(
    d.transactionOpeningResult,
    "controlled-workspace-host-activation-transaction-opened-not-prepared",
  );
  assert.equal(d.transactionOpeningState, "TRANSACTION_OPENED_NOT_PREPARED");
  assert.equal(d.activationCommitBoundaryState, "ENTERED");
  assert.equal(d.issuanceTransactionState, "OPENED");
  assert.equal(d.issuanceTransactionOpened, true);
  assert.equal(d.issuanceTransactionPrepared, false);
  assert.equal(d.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.transactionOpeningReady, true);
  assert.equal(d.transactionOpeningAuthorized, true);
  assert.equal(d.transactionOpeningStarted, true);
  assert.equal(d.transactionOpeningCompleted, true);
  assert.equal(diag.transactionOpeningReady, true);
  assert.equal(diag.transactionOpeningAuthorized, true);
  assert.equal(diag.transactionOpeningStarted, true);
  assert.equal(diag.transactionOpeningCompleted, true);
  assert.equal(diag.issuanceTransactionState, "OPENED");
  assert.equal(diag.issuanceTransactionOpened, true);
  assert.equal(diag.issuanceTransactionPrepared, false);
  assert.equal(diag.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.workspaceCandidateRendered, false);
  assert.equal(d.owner, "legacy");
  assert.equal(d.writer, "legacy");
  assert.equal(d.renderer, "legacy");
  assert.equal(
    d.activationBlocker,
    PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
  );
  assert.equal(CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONDITIONS.length > 0, true);
  assert.equal(CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_GUARDS.length > 0, true);
  assert.equal(CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_BLOCKERS.length > 0, true);
  ok("engine diagnostics metadata only (chained from 3B.3.31)");
}

{
  const registry = createControlledHostRegistry();
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionOpeningDescriptor({
        ...createControlledWorkspaceHostActivationTransactionOpeningDescriptor(),
        candidateActivated: true,
      } as ReturnType<typeof createControlledWorkspaceHostActivationTransactionOpeningDescriptor>),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpening(registry, {
        issuanceTransactionState: "OPENED",
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpening(registry, {
        issuanceTransactionPrepared: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpening(registry, {
        issuancePipelineExecutable: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpening(registry, {
        transactionOpeningStarted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpening(registry, {
        transactionOpeningAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpening(registry, {
        shellRendered: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionOpening(registry, {
        owner: "workspace",
      }),
    HardContractViolation,
  );
  ok("fail-closed duplicate/opened/prepared/pipeline/auth/shell/ownership paths");
}

console.log("\n[phase3b332] contract + identity + prepared");

{
  const contract = createControlledWorkspaceHostActivationTransactionOpeningContract();
  assert.equal(contract.phase, "3B.3.32");
  assert.equal(contract.nextEligibleStep, "3B.3.33");
  assert.equal(contract.transactionOpeningState, "TRANSACTION_OPENED_NOT_PREPARED");
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionOpeningContract({
        ...contract,
        candidateActivated: true,
      } as typeof contract),
    HardContractViolation,
  );
  ok("transaction-opening contract");
}

{
  const identity = createFeedWorkspaceHostActivationTransactionOpeningIdentity();
  assert.equal(identity.phase, "3B.3.32");
  assert.equal(
    identity.activationTransactionOpeningId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  );
  assert.equal(
    identity.activationTransactionOpeningAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
  );
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionOpeningIdentity({
        ...identity,
        remountAllowed: true,
      } as typeof identity),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionOpeningIdentity({
        ...identity,
        expectedOwner: "workspace",
      } as typeof identity),
    HardContractViolation,
  );
  ok("transaction-opening identity");
}

{
  const prepared = createFeedWorkspaceHostActivationTransactionOpeningPreparedContract({
    evidenceCommit: "phase3b332-sealed-core",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b332/",
    conditionCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_GUARDS.length,
    satisfiedGuardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_GUARDS.length,
  });
  assert.equal(prepared.phase, "3B.3.32");
  assert.equal(prepared.nextEligibleStep, "3B.3.33");
  assert.equal(prepared.transactionOpeningState, "TRANSACTION_OPENED_NOT_PREPARED");
  assert.equal(prepared.transactionOpeningStarted, true);
  assert.equal(prepared.transactionOpeningCompleted, true);
  assert.equal(prepared.issuanceTransactionState, "OPENED");
  assert.equal(prepared.issuanceTransactionOpened, true);
  assert.equal(prepared.issuanceTransactionPrepared, false);
  assert.equal(prepared.issuancePipelineState, "NON_EXECUTABLE");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionOpeningPreparedContract({
        ...prepared,
        candidateActivated: true,
      } as typeof prepared),
    HardContractViolation,
  );
  ok("transaction-opening prepared metadata");
}

console.log("\n[phase3b332] LIVE gate + host continuity");

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
      PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.47");
  assert.equal(gate.eligibleStep, "3B.3.48");
  ok("activation remains impossible (gate currentStep=3B.3.43, eligibleStep=3B.3.44)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.48");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.48");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_BLOCKERS.includes(
      PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionOpening();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
  assert.equal(evaluation.descriptor.transactionOpeningReady, true);
  assert.equal(evaluation.descriptor.transactionOpeningAuthorized, true);
  assert.equal(evaluation.descriptor.transactionOpeningStarted, true);
  assert.equal(evaluation.descriptor.transactionOpeningCompleted, true);
  assert.equal(evaluation.descriptor.issuanceTransactionState, "OPENED");
  assert.equal(evaluation.descriptor.issuanceTransactionOpened, true);
  assert.equal(evaluation.descriptor.issuanceTransactionPrepared, false);
  assert.equal(evaluation.descriptor.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(evaluation.descriptor.workspaceCandidateRendered, false);
  assert.equal(evaluation.descriptor.owner, "legacy");
  assert.equal(evaluation.descriptor.writer, "legacy");
  assert.equal(evaluation.descriptor.renderer, "legacy");
  ok("candidate opened-not-prepared with PHASE_3B3_32 blocker; Workspace null; GeoFeed legacy");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.32 controlled workspace host activation transaction opening: ${passed} assertions ok\n`,
);
