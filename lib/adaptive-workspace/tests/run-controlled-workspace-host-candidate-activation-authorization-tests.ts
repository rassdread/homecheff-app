/**
 * Phase 3B.3.43 — sealed-core unit tests for candidate activation authorization.
 * Sealed + LIVE continuity for Phase 3B.3.43.
 */
import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { stableStringify } from "../resolver/canonicalize-layout-plan";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "../sealed/feed-host-rollback-contract";
import { evaluateFeedHostActivationGate, PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY } from "../sealed/feed-host-activation-gate";
import { PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY,
  PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY } from "../sealed/controlled-workspace-host-candidate-activation";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";
import { FEED_DISCOVERY_STABLE_RUNTIME_ID } from "../sealed/controlled-host-registry";
import {
  createControlledWorkspaceHostCandidateActivationAuthorizationDescriptor,
  evaluateControlledWorkspaceHostCandidateActivationAuthorization,
  validateControlledWorkspaceHostCandidateActivationAuthorizationDescriptor,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_BLOCKERS,
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
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
  createControlledWorkspaceHostCandidateActivationAuthorizationContract,
  validateControlledWorkspaceHostCandidateActivationAuthorizationContract,
} from "../sealed/controlled-workspace-host-candidate-activation-authorization-contract";
import {
  createFeedWorkspaceHostCandidateActivationAuthorizationIdentity,
  validateFeedWorkspaceHostCandidateActivationAuthorizationIdentity,
} from "../sealed/feed-workspace-host-candidate-activation-authorization-identity";
import {
  createFeedWorkspaceHostCandidateActivationAuthorizationPreparedContract,
  validateFeedWorkspaceHostCandidateActivationAuthorizationPreparedContract,
} from "../sealed/feed-workspace-host-candidate-activation-authorization-prepared";
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
  "\n[phase3b343] activation candidate-activation-readiness sealed descriptor + engine",
);

{
  const a = createControlledWorkspaceHostCandidateActivationAuthorizationDescriptor();
  const b = createControlledWorkspaceHostCandidateActivationAuthorizationDescriptor();
  assert.equal(a.currentPhase, "3B.3.43");
  assert.equal(a.previousPhase, "3B.3.42");
  assert.equal(a.nextEligibleStep, "3B.3.44");
  assert.equal(
    a.candidateActivationAuthorizationResult,
    "controlled-workspace-host-candidate-activation-authorized-not-activated",
  );
  assert.equal(
    a.candidateActivationAuthorizationState,
    "CANDIDATE_ACTIVATION_AUTHORIZED_NOT_ACTIVATED",
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
    a.activationCandidateActivationAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ID,
  );
  assert.equal(
    a.activationCandidateActivationAuthorizationContractId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
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
    PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic execution descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostCandidateActivationAuthorization();
  const d = evaluation.descriptor;
  const diag = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.43");
  assert.equal(
    d.candidateActivationAuthorizationResult,
    "controlled-workspace-host-candidate-activation-authorized-not-activated",
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
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONDITIONS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_GUARDS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_BLOCKERS.length > 0,
    true,
  );
  ok("engine diagnostics metadata only (chained from 3B.3.42)");
}

{
  const registry = createControlledHostRegistry();
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateActivationAuthorizationDescriptor({
        ...createControlledWorkspaceHostCandidateActivationAuthorizationDescriptor(),
        candidateActivated: true,
      } as ReturnType<
        typeof createControlledWorkspaceHostCandidateActivationAuthorizationDescriptor
      >),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        issuanceTransactionPrepared: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        issuanceTransactionCommitted: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        transactionCommitAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        candidateActivationAuthorized: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        transactionCommitReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        issuancePipelineExecutable: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        issuancePipelineExecutionAllowed: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        issuancePipelineExecutionReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        transactionPreparationAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        transactionPreparationReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        shellRendered: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(registry, {
        owner: "workspace",
      }),
    HardContractViolation,
  );
  ok("fail-closed not-prepared/committed/duplicate-commit-ready/pipeline/auth/shell/ownership paths");
}


console.log("\n[phase3b343] Started/Completed semantics (absent from 3B.3.43 contract surface)");
{
  const a = createControlledWorkspaceHostCandidateActivationAuthorizationDescriptor();
  assert.equal(
    Object.prototype.hasOwnProperty.call(a, "issuancePipelineStarted"),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(a, "issuancePipelineCompleted"),
    false,
  );
  ok("issuancePipelineStarted absent from Phase 3B.3.43 descriptor (not advanced)");
  ok("issuancePipelineCompleted absent from Phase 3B.3.43 descriptor (not advanced)");
  // Fail-closed inputs still reject Started/Executed-before
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostCandidateActivationAuthorization(
        createControlledHostRegistry(),
        { issuancePipelineStarted: true },
      ),
    HardContractViolation,
  );
  ok("issuancePipelineStarted=true input remains fail-closed");
}

console.log("\n[phase3b343] sealed contract + identity + prepared");

{
  const contract = createControlledWorkspaceHostCandidateActivationAuthorizationContract();
  assert.equal(contract.phase, "3B.3.43");
  assert.equal(contract.nextEligibleStep, "3B.3.44");
  assert.equal(
    contract.candidateActivationAuthorizationState,
    "CANDIDATE_ACTIVATION_AUTHORIZED_NOT_ACTIVATED",
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostCandidateActivationAuthorizationContract({
        ...contract,
        candidateActivated: true,
      } as typeof contract),
    HardContractViolation,
  );
  ok("authorization contract");
}

{
  const identity = createFeedWorkspaceHostCandidateActivationAuthorizationIdentity();
  assert.equal(identity.phase, "3B.3.43");
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
    identity.activationCandidateActivationAuthorizationId,
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ID,
  );
  assert.throws(
    () =>
      validateFeedWorkspaceHostCandidateActivationAuthorizationIdentity({
        ...identity,
        remountAllowed: true,
      } as typeof identity),
    HardContractViolation,
  );
  ok("authorization identity");
}

{
  const prepared = createFeedWorkspaceHostCandidateActivationAuthorizationPreparedContract({
    evidenceCommit: "phase3b343-sealed-core",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b343/",
    conditionCount:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_GUARDS.length,
    satisfiedGuardCount:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_GUARDS.length,
  });
  assert.equal(prepared.phase, "3B.3.43");
  assert.equal(prepared.nextEligibleStep, "3B.3.44");
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
      validateFeedWorkspaceHostCandidateActivationAuthorizationPreparedContract({
        ...prepared,
        candidateActivated: true,
      } as typeof prepared),
    HardContractViolation,
  );
  ok("authorization prepared metadata");
}



console.log("\n[phase3b343] LIVE gate + host continuity (skipped until CP3 if SKIP_PHASE3B343_LIVE=1)");

if (process.env.SKIP_PHASE3B343_LIVE === "1") {
  console.log("  · LIVE assertions skipped (SKIP_PHASE3B343_LIVE=1)");
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
      PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY,
    ),
  );
  assert.equal(gate.currentStep, "3B.3.45");
  assert.equal(gate.eligibleStep, "3B.3.46");
  ok("activation remains impossible (gate currentStep=3B.3.43, eligibleStep=3B.3.43)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.46");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.46");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_BLOCKERS.includes(
      PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostCandidateActivationAuthorization();
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
  ok("candidate authorized-not-activated with PHASE_3B3_43 blocker; Workspace null; GeoFeed legacy");
}
}

console.log(
  `\nadaptive-workspace Phase 3B.3.43 controlled workspace host candidate activation authorization: ${passed} assertions ok\n`,
);
