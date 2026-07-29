/**
 * Phase 3B.3.37 — sealed-core unit tests for transaction commit authorization.
 * Sealed + LIVE continuity for Phase 3B.3.37.
 */
import assert from "node:assert/strict";
import { HardContractViolation } from "../schema/validation-error";
import { stableStringify } from "../resolver/canonicalize-layout-plan";
import { createControlledHostRegistry } from "../sealed/controlled-host-registry";
import { createControlledFeedHostContract } from "../sealed/create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "../sealed/feed-host-rollback-contract";
import { evaluateFeedHostActivationGate,
  PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY,
} from "../sealed/feed-host-activation-gate";
import { PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY,
  PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY } from "../sealed/controlled-workspace-host-candidate-activation";
import {
  PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY,
} from "../sealed/controlled-workspace-host-candidate-activation-authorization";
import { FEED_DISCOVERY_HOST_CANDIDATE_METADATA } from "../registry/settings-manifests";
import { FEED_DISCOVERY_STABLE_RUNTIME_ID } from "../sealed/controlled-host-registry";
import {
  createControlledWorkspaceHostActivationTransactionCommitAuthorizationDescriptor,
  evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization,
  validateControlledWorkspaceHostActivationTransactionCommitAuthorizationDescriptor,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONDITIONS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_GUARDS,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_BLOCKERS,
  PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY,
} from "../sealed/controlled-workspace-host-activation-transaction-commit-authorization";
import {
  PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
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
  createControlledWorkspaceHostActivationTransactionCommitAuthorizationContract,
  validateControlledWorkspaceHostActivationTransactionCommitAuthorizationContract,
} from "../sealed/controlled-workspace-host-activation-transaction-commit-authorization-contract";
import {
  createFeedWorkspaceHostActivationTransactionCommitAuthorizationIdentity,
  validateFeedWorkspaceHostActivationTransactionCommitAuthorizationIdentity,
} from "../sealed/feed-workspace-host-activation-transaction-commit-authorization-identity";
import {
  createFeedWorkspaceHostActivationTransactionCommitAuthorizationPreparedContract,
  validateFeedWorkspaceHostActivationTransactionCommitAuthorizationPreparedContract,
} from "../sealed/feed-workspace-host-activation-transaction-commit-authorization-prepared";
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
  "\n[phase3b337] activation transaction-commit-authorization sealed descriptor + engine",
);

{
  const a = createControlledWorkspaceHostActivationTransactionCommitAuthorizationDescriptor();
  const b = createControlledWorkspaceHostActivationTransactionCommitAuthorizationDescriptor();
  assert.equal(a.currentPhase, "3B.3.37");
  assert.equal(a.previousPhase, "3B.3.36");
  assert.equal(a.nextEligibleStep, "3B.3.38");
  assert.equal(
    a.transactionCommitAuthorizationResult,
    "controlled-workspace-host-activation-transaction-commit-authorized-not-committed",
  );
  assert.equal(
    a.transactionCommitAuthorizationState,
    "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED",
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
  assert.equal(a.transactionCommitAuthorizationCount, 1);
  assert.equal(
    a.activationBlocker,
    PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY,
  );
  assert.equal(stableStringify(a), stableStringify(b));
  ok("successful deterministic transaction-commit-authorization descriptor");
}

{
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization();
  const d = evaluation.descriptor;
  const diag = evaluation.diagnostics;
  assert.equal(d.currentPhase, "3B.3.37");
  assert.equal(
    d.transactionCommitAuthorizationResult,
    "controlled-workspace-host-activation-transaction-commit-authorized-not-committed",
  );
  assert.equal(d.transactionPreparationReady, true);
  assert.equal(d.transactionPreparationAuthorized, true);
  assert.equal(d.transactionCommitReady, true);
  assert.equal(diag.transactionPreparationReady, true);
  assert.equal(diag.transactionPreparationAuthorized, true);
  assert.equal(diag.transactionCommitReady, true);
  assert.equal(d.issuanceTransactionState, "OPENED");
  assert.equal(d.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(d.owner, "legacy");
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONDITIONS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_GUARDS.length > 0,
    true,
  );
  assert.equal(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_BLOCKERS.length > 0,
    true,
  );
  ok("engine diagnostics metadata only (chained from 3B.3.36)");
}

{
  const registry = createControlledHostRegistry();
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionCommitAuthorizationDescriptor({
        ...createControlledWorkspaceHostActivationTransactionCommitAuthorizationDescriptor(),
        candidateActivated: true,
      } as ReturnType<
        typeof createControlledWorkspaceHostActivationTransactionCommitAuthorizationDescriptor
      >),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        issuanceTransactionPrepared: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        issuanceTransactionCommitted: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        transactionCommitAuthorized: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        transactionCommitReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        issuancePipelineExecutable: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        transactionPreparationAuthorized: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        transactionPreparationReady: false,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        shellRendered: true,
      }),
    HardContractViolation,
  );
  assert.throws(
    () =>
      evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization(registry, {
        owner: "workspace",
      }),
    HardContractViolation,
  );
  ok("fail-closed not-prepared/committed/duplicate-commit-ready/pipeline/auth/shell/ownership paths");
}

console.log("\n[phase3b337] sealed contract + identity + prepared");

{
  const contract = createControlledWorkspaceHostActivationTransactionCommitAuthorizationContract();
  assert.equal(contract.phase, "3B.3.37");
  assert.equal(contract.nextEligibleStep, "3B.3.38");
  assert.equal(
    contract.transactionCommitAuthorizationState,
    "TRANSACTION_COMMIT_AUTHORIZED_NOT_COMMITTED",
  );
  assert.throws(
    () =>
      validateControlledWorkspaceHostActivationTransactionCommitAuthorizationContract({
        ...contract,
        candidateActivated: true,
      } as typeof contract),
    HardContractViolation,
  );
  ok("transaction-commit-authorization contract");
}

{
  const identity = createFeedWorkspaceHostActivationTransactionCommitAuthorizationIdentity();
  assert.equal(identity.phase, "3B.3.37");
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
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionCommitAuthorizationIdentity({
        ...identity,
        remountAllowed: true,
      } as typeof identity),
    HardContractViolation,
  );
  ok("transaction-commit-authorization identity");
}

{
  const prepared = createFeedWorkspaceHostActivationTransactionCommitAuthorizationPreparedContract({
    evidenceCommit: "phase3b337-sealed-core",
    evidenceArtifactPath: "docs/audits/artifacts/phase3b337/",
    conditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONDITIONS.length,
    satisfiedConditionCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONDITIONS.length,
    guardCount: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_GUARDS.length,
    satisfiedGuardCount:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_GUARDS.length,
  });
  assert.equal(prepared.phase, "3B.3.37");
  assert.equal(prepared.nextEligibleStep, "3B.3.38");
  assert.equal(prepared.transactionPreparationReady, true);
  assert.equal(prepared.transactionPreparationAuthorized, true);
  assert.equal(prepared.transactionCommitReady, true);
  assert.equal(prepared.transactionCommitAuthorized, true);
  assert.equal(prepared.issuanceTransactionState, "OPENED");
  assert.equal(prepared.issuanceTransactionPrepared, true);
  assert.equal(prepared.issuancePipelineState, "NON_EXECUTABLE");
  assert.throws(
    () =>
      validateFeedWorkspaceHostActivationTransactionCommitAuthorizationPreparedContract({
        ...prepared,
        candidateActivated: true,
      } as typeof prepared),
    HardContractViolation,
  );
  ok("transaction-commit-authorization prepared metadata");
}



console.log("\n[phase3b337] LIVE gate + host continuity");

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
  ok("activation remains impossible (gate currentStep=3B.3.43, eligibleStep=3B.3.44)");
}

{
  const host = createControlledFeedHostContract();
  assert.equal(host.nextEligibleStep, "3B.3.46");
  assert.ok(
    host.activationBlockers.includes(
      PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY,
    ),
  );
  assert.equal(FEED_DISCOVERY_HOST_CANDIDATE_METADATA.nextEligibleStep, "3B.3.46");
  assert.equal(createFeedHostRollbackContract().rollbackReadiness, "prepared-not-active");
  assert.equal(createControlledHostRegistry().hostCount, 1);
  ok("owner/writer/renderer/registry/rollback/host metadata unchanged");
}

{
  assert.ok(
    CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_BLOCKERS.includes(
      PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY,
    ),
  );
  const evaluation = evaluateControlledWorkspaceHostActivationTransactionCommitAuthorization();
  assert.equal(evaluation.descriptor.candidateGranted, true);
  assert.equal(evaluation.descriptor.candidateActivated, false);
  assert.equal(evaluation.descriptor.transactionOpeningCompleted, true);
  assert.equal(evaluation.descriptor.transactionPreparationReady, true);
  assert.equal(evaluation.descriptor.transactionPreparationAuthorized, true);
  assert.equal(evaluation.descriptor.transactionCommitReady, true);
  assert.equal(evaluation.descriptor.transactionCommitAuthorized, true);
  assert.equal(evaluation.descriptor.issuanceTransactionState, "OPENED");
  assert.equal(evaluation.descriptor.issuanceTransactionOpened, true);
  assert.equal(evaluation.descriptor.issuanceTransactionPrepared, true);
  assert.equal(evaluation.descriptor.issuanceTransactionCommitted, false);
  assert.equal(evaluation.descriptor.issuancePipelineState, "NON_EXECUTABLE");
  assert.equal(evaluation.descriptor.workspaceCandidateRendered, false);
  assert.equal(evaluation.descriptor.owner, "legacy");
  assert.equal(evaluation.descriptor.writer, "legacy");
  assert.equal(evaluation.descriptor.renderer, "legacy");
  ok("candidate commit-authorized-not-committed with PHASE_3B3_37 blocker; Workspace null; GeoFeed legacy");
}

console.log(
  `\nadaptive-workspace Phase 3B.3.37 controlled workspace host activation transaction commit authorization: ${passed} assertions ok\n`,
);
