/**
 * Phase 3B.3.46 — sealed-core unit tests for candidate activation authorization.
 * Sealed + LIVE continuity for Phase 3B.3.46.
 */
import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { stableStringify } from "../resolver/canonicalize-layout-plan";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "../sealed/feed-host-rollback-contract";
import { evaluateFeedHostActivationGate } from "../sealed/feed-host-activation-gate";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";
import { FEED_DISCOVERY_STABLE_RUNTIME_ID } from "../sealed/controlled-host-registry";
import {
  createControlledWorkspaceHostCandidateExecutableDescriptor,
  evaluateControlledWorkspaceHostCandidateExecutable,
  validateControlledWorkspaceHostCandidateExecutableDescriptor,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_GUARDS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_BLOCKERS,
  PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY,
} from "../sealed/controlled-workspace-host-candidate-executable";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-candidate-activation";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-candidate-activation-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-candidate-activation-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-activation-issuance-pipeline-execution-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-activation-issuance-pipeline-execution-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-activation-transaction-preparation";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-activation-transaction-commit-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-activation-transaction-commit-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-activation-transaction-commit";
import {
  createControlledWorkspaceHostCandidateExecutableContract,
  validateControlledWorkspaceHostCandidateExecutableContract,
} from "../sealed/controlled-workspace-host-candidate-executable-contract";
import {
  createFeedWorkspaceHostCandidateExecutableIdentity,
  validateFeedWorkspaceHostCandidateExecutableIdentity,
} from "../sealed/feed-workspace-host-candidate-executable-identity";
import {
  createFeedWorkspaceHostCandidateExecutablePreparedContract,
  validateFeedWorkspaceHostCandidateExecutablePreparedContract,
} from "../sealed/feed-workspace-host-candidate-executable-prepared";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
} from "../sealed/controlled-workspace-host-candidate-registration";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "../sealed/controlled-workspace-host-candidate-selection";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID } from "../sealed/controlled-workspace-host-activation-readiness";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID } from "../sealed/controlled-workspace-host-activation-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
} from "../sealed/controlled-workspace-host-activation-grant-issuance";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID } from "../sealed/controlled-workspace-host-activation-commit-boundary-entry";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID } from "../sealed/controlled-workspace-host-activation-transaction-opening-readiness";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID } from "../sealed/controlled-workspace-host-activation-transaction-opening-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
} from "../sealed/controlled-workspace-host-activation-transaction-opening";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
} from "../sealed/controlled-workspace-host-activation-transaction-preparation-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
} from "../sealed/controlled-workspace-host-activation-transaction-preparation-authorization";

let passed = 0;
function ok(label: string) {
  passed += 1;
  console.log(`  ✓ ${label}`);
}

console.log(
  "\n[phase3b346] activation candidate-executable sealed descriptor + engine",
);

{
  const a = createControlledWorkspaceHostCandidateExecutableDescriptor();
  const b = createControlledWorkspaceHostCandidateExecutableDescriptor();
  assert.equal(a.currentPhase, "3B.3.46");
  assert.equal(a.previousPhase, "3B.3.45");
  assert.equal(a.nextEligibleStep, "3B.3.47");
  assert.equal(
    a.candidateActivationResult,
    "controlled-workspace-host-candidate-executable-not-executed",
  );
  assert.equal(
    a.candidateActivationState,
    "CANDIDATE_EXECUTABLE_NOT_EXECUTED",
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
    a.activationTransactionPreparationAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
  );
  assert.equal(
    a.activationTransactionPreparationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
  );
  assert.equal(
    a.activationTransactionPreparationContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
  );
  assert.equal(
    a.activationTransactionCommitReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
  );
  assert.equal(
    a.activationTransactionCommitReadinessContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID,
  );
  assert.equal(
    a.activationTransactionCommitAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID,
  );
  assert.equal(
    a.activationTransactionCommitAuthorizationContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONTRACT_ID,
  );
  assert.equal(
    a.activationTransactionCommitId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID,
  );
  assert.equal(
    a.activationTransactionCommitContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_CONTRACT_ID,
  );
  assert.equal(
    a.activationIssuancePipelineExecutionReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID,
  );
  assert.equal(
    a.activationIssuancePipelineExecutionReadinessContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_CONTRACT_ID,
  );
  assert.equal(
    a.activationIssuancePipelineExecutionAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ID,
  );
  assert.equal(
    a.activationIssuancePipelineExecutionAuthorizationContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_CONTRACT_ID,
  );
  assert.equal(
    a.activationCandidateActivationReadinessId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ID,
  );
  assert.equal(
    a.activationCandidateActivationReadinessContractId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_CONTRACT_ID,
  );
  assert.equal(
    a.activationCandidateActivationAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ID,
  );
  assert.equal(
    a.activationCandidateActivationAuthorizationContractId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
  );
  assert.equal(
    a.activationCandidateActivationId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ID,
  );
  assert.equal(
    a.activationCandidateActivationContractId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_CONTRACT_ID,
  );
  assert.equal(a.activationCommitBoundaryState, "ENTERED");
  assert.equal(a.issuanceTransactionState, "OPENED");
  assert.equal(a.issuanceTransactionOpened, true);
  assert.equal(a.issuanceTransactionPrepared, true);
  assert.equal(a.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(a.transactionOpeningCompleted, true);
  assert.equal(a.transactionPreparationReady, true);
  assert.equal(a.transactionPreparationAuthorized, true);
  assert.equal(a.transactionCommitReady, true);
  assert.equal(a.transactionCommitAuthorized, true);
  assert.equal(a.issuanceTransactionCommitted, true);
  assert.equal(a.issuancePipelineExecutionReady, true);
  assert.equal(a.issuancePipelineExecutionAuthorized, true);
  assert.equal(a.issuancePipelineExecuted, true);
  assert.equal(a.candidateActivationReady, true);
  assert.equal(a.candidateActivationAuthorized, true);
  assert.equal(a.issuancePipelineExecutionAllowed, false);
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.candidateActivated, true);
  assert.equal(a.candidateActive, true);
  assert.equal(a.candidateExecutable, true);
  assert.equal(a.workspaceCandidateRendered, false);
  assert.equal(a.workspaceHostMounted, false);
  assert.equal(a.workspaceVisible, false);
  assert.equal(a.geoFeedRenderCount, 1);
  assert.equal(a.mountCount, 1);
  assert.equal(a.unmountCount, 0);
  assert.equal(a.owner, "legacy");
  assert.equal(a.writer, "legacy");
  assert.equal(a.renderer, "legacy");
  assert.equal(a.transactionCommitCount, 1);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic execution descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostCandidateExecutable();
  const d = evaluation.descriptor;
  const diag = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.46");
  assert.equal(
    d.candidateActivationResult,
    "controlled-workspace-host-candidate-executable-not-executed",
  );
  assert.equal(d.transactionPreparationReady, true);
  assert.equal(d.transactionPreparationAuthorized, true);
  assert.equal(d.transactionCommitReady, true);
  assert.equal(diag.transactionPreparationReady, true);
  assert.equal(diag.transactionPreparationAuthorized, true);
  assert.equal(diag.transactionCommitReady, true);
  assert.equal(d.issuanceTransactionState, "OPENED");
  assert.equal(d.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.issuancePipelineExecuted, true);
  assert.equal(d.candidateActivationReady, true);
  assert.equal(d.candidateActivationAuthorized, true);
  assert.equal(diag.issuancePipelineExecuted, true);
  assert.equal(d.owner, "legacy");
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_CONDITIONS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_GUARDS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_BLOCKERS.length > 0,
    true,
  );
  ok("engine diagnostics metadata only (chained from 3B.3.45)");
}

{
  const registry = createControlledHostRegistry();
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateExecutableDescriptor({
        ...createControlledWorkspaceHostCandidateExecutableDescriptor(),
        candidateActivated: false,
      } as ReturnType<
        typeof createControlledWorkspaceHostCandidateExecutableDescriptor
      >),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateExecutableDescriptor({
        ...createControlledWorkspaceHostCandidateExecutableDescriptor(),
        candidateActive: false,
      } as ReturnType<
        typeof createControlledWorkspaceHostCandidateExecutableDescriptor
      >),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        issuanceTransactionPrepared: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        issuanceTransactionCommitted: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        transactionCommitAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        candidateExecutable: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        candidateActivated: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        candidateActivationAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        transactionCommitReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        issuancePipelineExecutable: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        issuancePipelineExecutionAllowed: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        issuancePipelineExecutionReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        transactionPreparationAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        transactionPreparationReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        shellRendered: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(registry, {
        owner: "workspace",
      }),
    HardContractViolation,
  );
  ok("fail-closed not-prepared/committed/duplicate-commit-ready/pipeline/auth/shell/ownership paths");
}


console.log("\n[phase3b346] Started/Completed semantics (absent from 3B.3.46 contract surface)");
{
  const a = createControlledWorkspaceHostCandidateExecutableDescriptor();
  assert.equal(
    Object.prototype.hasOwnProperty.call(a, "issuancePipelineStarted"),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(a, "issuancePipelineCompleted"),
    false,
  );
  ok("issuancePipelineStarted absent from Phase 3B.3.46 descriptor (not advanced)");
  ok("issuancePipelineCompleted absent from Phase 3B.3.46 descriptor (not advanced)");
  // Fail-closed inputs still reject Started/Executed-before
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateExecutable(
        createControlledHostRegistry(),
        { issuancePipelineStarted: true },
      ),
    HardContractViolation,
  );
  ok("issuancePipelineStarted=true input remains fail-closed");
}

console.log("\n[phase3b346] sealed contract + identity + prepared");

{
  const contract = createControlledWorkspaceHostCandidateExecutableContract();
  assert.equal(contract.phase, "3B.3.46");
  assert.equal(contract.nextEligibleStep, "3B.3.47");
  assert.equal(
    contract.candidateActivationState,
    "CANDIDATE_EXECUTABLE_NOT_EXECUTED",
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateExecutableContract({
        ...contract,
        candidateActivated: false,
      } as typeof contract),
    HardContractViolation,
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateExecutableContract({
        ...contract,
        candidateActive: false,
      } as typeof contract),
    HardContractViolation,
  );
  ok("activation contract");
}

{
  const identity = createFeedWorkspaceHostCandidateExecutableIdentity();
  assert.equal(identity.phase, "3B.3.46");
  assert.equal(
    identity.activationTransactionOpeningId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  );
  assert.equal(
    identity.activationTransactionPreparationReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
  );
  assert.equal(
    identity.activationTransactionPreparationAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
  );
  assert.equal(
    identity.activationTransactionPreparationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
  );
  assert.equal(
    identity.activationTransactionCommitReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
  );
  assert.equal(
    identity.activationTransactionCommitAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID,
  );
  assert.equal(
    identity.activationTransactionCommitId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID,
  );
  assert.equal(
    identity.activationIssuancePipelineExecutionReadinessId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID,
  );
  assert.equal(
    identity.activationCandidateActivationId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ID,
  );
  assert.throws(
    () =>
      validateFeedWorkspaceHostCandidateExecutableIdentity({
        ...identity,
        remountAllowed: true,
      } as typeof identity),
    HardContractViolation,
  );
  ok("activation identity");
}

{
  const prepared = createFeedWorkspaceHostCandidateExecutablePreparedContract({
    evidenceCommit: "phase3b346-sealed-core",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b346/",
    conditionCount:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_GUARDS.length,
    satisfiedGuardCount:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_GUARDS.length,
  });
  assert.equal(prepared.phase, "3B.3.46");
  assert.equal(prepared.nextEligibleStep, "3B.3.47");
  assert.equal(prepared.transactionPreparationReady, true);
  assert.equal(prepared.transactionPreparationAuthorized, true);
  assert.equal(prepared.transactionCommitReady, true);
  assert.equal(prepared.transactionCommitAuthorized, true);
  assert.equal(prepared.issuanceTransactionCommitted, true);
  assert.equal(prepared.issuanceTransactionState, "OPENED");
  assert.equal(prepared.issuanceTransactionPrepared, true);
  assert.equal(prepared.issuancePipelineState, "NON_EXECUTABLE");
  assert.throws(
    () =>
      validateFeedWorkspaceHostCandidateExecutablePreparedContract({
        ...prepared,
        candidateActivated: false,
      } as typeof prepared),
    HardContractViolation,
  );
  ok("activation prepared metadata");
}



console.log("\n[phase3b346] LIVE gate + host continuity (skipped until CP3 if SKIP_PHASE3B345_LIVE=1)");

if (process.env.SKIP_PHASE3B345_LIVE === "1") {
  console.log("  · LIVE assertions skipped (SKIP_PHASE3B345_LIVE=1)");
} else {
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
      PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.46");
  assert.equal(gate.eligibleStep, "3B.3.47");
  ok("activation remains impossible (gate currentStep=3B.3.46, eligibleStep=3B.3.47)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.47");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.47");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_BLOCKERS.includes(
      PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostCandidateExecutable();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, true);
  assert.equal(evaluation.descriptor.candidateActive, true);
  assert.equal(evaluation.descriptor.candidateExecutable, true);
  assert.equal(evaluation.descriptor.candidateActivationReady, true);
  assert.equal(evaluation.descriptor.candidateActivationAuthorized, true);
  assert.equal(evaluation.descriptor.transactionOpeningCompleted, true);
  assert.equal(evaluation.descriptor.transactionPreparationReady, true);
  assert.equal(evaluation.descriptor.transactionPreparationAuthorized, true);
  assert.equal(evaluation.descriptor.transactionCommitReady, true);
  assert.equal(evaluation.descriptor.transactionCommitAuthorized, true);
  assert.equal(evaluation.descriptor.issuanceTransactionCommitted, true);
  assert.equal(evaluation.descriptor.issuanceTransactionAborted, false);
  assert.equal(evaluation.descriptor.issuanceTransactionState, "OPENED");
  assert.equal(evaluation.descriptor.issuanceTransactionOpened, true);
  assert.equal(evaluation.descriptor.issuanceTransactionPrepared, true);
  assert.equal(evaluation.descriptor.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(evaluation.descriptor.issuancePipelineExecutable, false);
  assert.equal(evaluation.descriptor.issuancePipelineExecutionReady, true);
  assert.equal(evaluation.descriptor.issuancePipelineExecutionAuthorized, true);
  assert.equal(evaluation.descriptor.issuancePipelineExecuted, true);
  assert.equal(evaluation.descriptor.issuancePipelineExecutionAllowed, false);
  assert.equal(evaluation.descriptor.workspaceCandidateRendered, false);
  assert.equal(evaluation.descriptor.owner, "legacy");
  assert.equal(evaluation.descriptor.writer, "legacy");
  assert.equal(evaluation.descriptor.renderer, "legacy");
  ok("candidate executable-not-executed with PHASE_3B3_46 blocker; Workspace null; GeoFeed legacy");
}
}

console.log(
  `\nadaptive-workspace Phase 3B.3.46 controlled workspace host candidate executable: ${passed} assertions ok\n`,
);
