/**
 * Phase 3B.3.41 — sealed-core unit tests for issuance pipeline execution.
 * Sealed + LIVE continuity for Phase 3B.3.41.
 */
import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { stableStringify } from "../resolver/canonicalize-layout-plan";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "../sealed/feed-host-rollback-contract";
import { evaluateFeedHostActivationGate, PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY } from "../sealed/feed-host-activation-gate";
import { PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY,
  PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY } from "../sealed/controlled-workspace-host-candidate-activation";
import {
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-authorization";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";
import { FEED_DISCOVERY_STABLE_RUNTIME_ID } from "../sealed/controlled-host-registry";
import {
  createControlledWorkspaceHostActivationIssuancePipelineExecutionDescriptor,
  evaluateControlledWorkspaceHostActivationIssuancePipelineExecution,
  validateControlledWorkspaceHostActivationIssuancePipelineExecutionDescriptor,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_BLOCKERS,
  PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY,
} from "../sealed/controlled-workspace-host-activation-issuance-pipeline-execution";
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
  createControlledWorkspaceHostActivationIssuancePipelineExecutionContract,
  validateControlledWorkspaceHostActivationIssuancePipelineExecutionContract,
} from "../sealed/controlled-workspace-host-activation-issuance-pipeline-execution-contract";
import {
  createFeedWorkspaceHostActivationIssuancePipelineExecutionIdentity,
  validateFeedWorkspaceHostActivationIssuancePipelineExecutionIdentity,
} from "../sealed/feed-workspace-host-activation-issuance-pipeline-execution-identity";
import {
  createFeedWorkspaceHostActivationIssuancePipelineExecutionPreparedContract,
  validateFeedWorkspaceHostActivationIssuancePipelineExecutionPreparedContract,
} from "../sealed/feed-workspace-host-activation-issuance-pipeline-execution-prepared";
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
  "\n[phase3b341] activation issuance-pipeline-execution sealed descriptor + engine",
);

{
  const a = createControlledWorkspaceHostActivationIssuancePipelineExecutionDescriptor();
  const b = createControlledWorkspaceHostActivationIssuancePipelineExecutionDescriptor();
  assert.equal(a.currentPhase, "3B.3.41");
  assert.equal(a.previousPhase, "3B.3.40");
  assert.equal(a.nextEligibleStep, "3B.3.42");
  assert.equal(
    a.pipelineExecutionResult,
    "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated",
  );
  assert.equal(
    a.pipelineExecutionState,
    "PIPELINE_EXECUTED_NOT_ACTIVATED",
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
    a.activationIssuancePipelineExecutionId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID,
  );
  assert.equal(
    a.activationIssuancePipelineExecutionContractId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONTRACT_ID,
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
  assert.equal(a.issuancePipelineExecutionAllowed, false);
  assert.equal(a.issuancePipelineExecutable, false);
  assert.equal(a.candidateActivated, false);
  assert.equal(a.candidateActive, false);
  assert.equal(a.candidateExecutable, false);
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
    PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic execution descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationIssuancePipelineExecution();
  const d = evaluation.descriptor;
  const diag = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.41");
  assert.equal(
    d.pipelineExecutionResult,
    "controlled-workspace-host-activation-issuance-pipeline-executed-not-activated",
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
  assert.equal(diag.issuancePipelineExecuted, true);
  assert.equal(d.owner, "legacy");
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONDITIONS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_GUARDS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_BLOCKERS.length > 0,
    true,
  );
  ok("engine diagnostics metadata only (chained from 3B.3.40)");
}

{
  const registry = createControlledHostRegistry();
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationIssuancePipelineExecutionDescriptor({
        ...createControlledWorkspaceHostActivationIssuancePipelineExecutionDescriptor(),
        candidateActivated: true,
      } as ReturnType<
        typeof createControlledWorkspaceHostActivationIssuancePipelineExecutionDescriptor
      >),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        issuanceTransactionPrepared: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        issuanceTransactionCommitted: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        transactionCommitAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        issuancePipelineExecuted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        transactionCommitReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        issuancePipelineExecutable: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        issuancePipelineExecutionAllowed: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        issuancePipelineExecutionReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        transactionPreparationAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        transactionPreparationReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        shellRendered: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(registry, {
        owner: "workspace",
      }),
    HardContractViolation,
  );
  ok("fail-closed not-prepared/committed/duplicate-commit-ready/pipeline/auth/shell/ownership paths");
}


console.log("\n[phase3b341] Started/Completed semantics (absent from 3B.3.41 contract surface)");
{
  const a = createControlledWorkspaceHostActivationIssuancePipelineExecutionDescriptor();
  assert.equal(
    Object.prototype.hasOwnProperty.call(a, "issuancePipelineStarted"),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(a, "issuancePipelineCompleted"),
    false,
  );
  ok("issuancePipelineStarted absent from Phase 3B.3.41 descriptor (not advanced)");
  ok("issuancePipelineCompleted absent from Phase 3B.3.41 descriptor (not advanced)");
  // Fail-closed inputs still reject Started/Executed-before
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationIssuancePipelineExecution(
        createControlledHostRegistry(),
        { issuancePipelineStarted: true },
      ),
    HardContractViolation,
  );
  ok("issuancePipelineStarted=true input remains fail-closed");
}

console.log("\n[phase3b341] sealed contract + identity + prepared");

{
  const contract = createControlledWorkspaceHostActivationIssuancePipelineExecutionContract();
  assert.equal(contract.phase, "3B.3.41");
  assert.equal(contract.nextEligibleStep, "3B.3.42");
  assert.equal(
    contract.pipelineExecutionState,
    "PIPELINE_EXECUTED_NOT_ACTIVATED",
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationIssuancePipelineExecutionContract({
        ...contract,
        candidateActivated: true,
      } as typeof contract),
    HardContractViolation,
  );
  ok("authorization contract");
}

{
  const identity = createFeedWorkspaceHostActivationIssuancePipelineExecutionIdentity();
  assert.equal(identity.phase, "3B.3.41");
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
    identity.activationIssuancePipelineExecutionId,
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID,
  );
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationIssuancePipelineExecutionIdentity({
        ...identity,
        remountAllowed: true,
      } as typeof identity),
    HardContractViolation,
  );
  ok("authorization identity");
}

{
  const prepared = createFeedWorkspaceHostActivationIssuancePipelineExecutionPreparedContract({
    evidenceCommit: "phase3b341-sealed-core",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b341/",
    conditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_GUARDS.length,
    satisfiedGuardCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_GUARDS.length,
  });
  assert.equal(prepared.phase, "3B.3.41");
  assert.equal(prepared.nextEligibleStep, "3B.3.42");
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
      validateFeedWorkspaceHostActivationIssuancePipelineExecutionPreparedContract({
        ...prepared,
        candidateActivated: true,
      } as typeof prepared),
    HardContractViolation,
  );
  ok("authorization prepared metadata");
}



console.log("\n[phase3b341] LIVE gate + host continuity (skipped until CP3 if SKIP_PHASE3B341_LIVE=1)");

if (process.env.SKIP_PHASE3B341_LIVE === "1") {
  console.log("  · LIVE assertions skipped (SKIP_PHASE3B341_LIVE=1)");
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
  ok("activation remains impossible (gate currentStep=3B.3.43, eligibleStep=3B.3.44)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.47");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.47");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_BLOCKERS.includes(
      PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationIssuancePipelineExecution();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
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
  ok("candidate executed-not-activated with PHASE_3B3_41 blocker; Workspace null; GeoFeed legacy");
}
}

console.log(
  `\nadaptive-workspace Phase 3B.3.41 controlled workspace host activation issuance pipeline execution: ${passed} assertions ok\n`,
);
