/**
 * Phase 3B.3.35 prepared / freeze-for-next-step after transaction-preparation.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
} from "./controlled-workspace-host-candidate-registration";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "./controlled-workspace-host-candidate-selection";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID } from "./controlled-workspace-host-activation-readiness";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID } from "./controlled-workspace-host-activation-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
} from "./controlled-workspace-host-activation-grant-issuance";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
} from "./controlled-workspace-host-activation-transaction-preparation-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
} from "./controlled-workspace-host-activation-transaction-preparation";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
} from "./controlled-workspace-host-activation-transaction-opening";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
} from "./controlled-workspace-host-activation-transaction-opening-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
} from "./controlled-workspace-host-activation-transaction-opening-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
} from "./controlled-workspace-host-activation-commit-boundary-entry";

export const FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostActivationTransactionPreparationPreparedContract = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.35";
  status: "controlled-workspace-host-activation-transaction-preparation-prepared";
  transactionPreparationContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  activationCommitBoundaryId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID;
  activationTransactionOpeningAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID;
  activationTransactionOpeningId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID;
  activationTransactionPreparationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID;
  activationTransactionPreparationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID;
  activationTransactionPreparationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID;
  transactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED";
  transactionPreparationResult: "controlled-workspace-host-activation-transaction-prepared-not-committed";
  candidateSelected: true;
  candidateReady: true;
  candidateAuthorized: true;
  candidateGranted: true;
  candidateActivated: false;
  candidateExecutable: false;
  grantPresent: true;
  grantValid: true;
  grantImmutable: true;
  grantExecutable: false;
  activationCommitBoundaryEntered: true;
  activationCommitBoundaryArmed: false;
  activationCommitBoundaryCrossed: false;
  activationCommitBoundaryCommitted: false;
  activationCommitBoundaryAborted: false;
  activationCommitBoundaryExecutable: false;
  transactionOpeningReady: true;
  transactionOpeningAuthorized: true;
  transactionOpeningStarted: true;
  transactionOpeningCompleted: true;
  transactionPreparationReady: true;
  transactionPreparationAuthorized: true;
  issuancePipelineState: "NON_EXECUTABLE";
  futureGrantPossible: true;
  futureGrantIssued: true;
  futureActivationPossible: true;
  futureActivationAuthorized: true;
  futureActivationStarted: false;
  predecessorActivationTransactionPreparationAuthorizationState: "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED";
  predecessorActivationTransactionPreparationAuthorizationResult: "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared";
  predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED";
  predecessorActivationCommitBoundaryEntryResult: "controlled-workspace-host-activation-commit-boundary-entered";
  issuanceCommitBoundaryState: "NOT_ENTERED";
  issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
  issuanceCommitBoundaryEntered: false;
  issuanceTransactionState: "OPENED";
  issuanceTransactionOpened: true;
  issuanceTransactionPrepared: true;
  issuanceTransactionCommitted: false;
  issuanceTransactionAborted: false;
  issuancePipelineExecutable: false;
  hostActivation: false;
  renderActivation: false;
  writer: "legacy";
  owner: "legacy";
  renderer: "legacy";
  shellRendered: false;
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.36";
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedWorkspaceHostActivationTransactionPreparationPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
}): FeedWorkspaceHostActivationTransactionPreparationPreparedContract {
  return validateFeedWorkspaceHostActivationTransactionPreparationPreparedContract({
    schemaVersion:
      FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.35",
    status: "controlled-workspace-host-activation-transaction-preparation-prepared",
    transactionPreparationContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    activationCommitBoundaryId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
    activationTransactionOpeningAuthorizationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
    activationTransactionOpeningId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
    activationTransactionPreparationReadinessId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
    activationTransactionPreparationAuthorizationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
    activationTransactionPreparationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
    transactionPreparationState: "TRANSACTION_PREPARED_NOT_COMMITTED",
    transactionPreparationResult:
      "controlled-workspace-host-activation-transaction-prepared-not-committed",
    candidateSelected: true,
    candidateReady: true,
    candidateAuthorized: true,
    candidateGranted: true,
    candidateActivated: false,
    candidateExecutable: false,
    grantPresent: true,
    grantValid: true,
    grantImmutable: true,
    grantExecutable: false,
    activationCommitBoundaryEntered: true,
    activationCommitBoundaryArmed: false,
    activationCommitBoundaryCrossed: false,
    activationCommitBoundaryCommitted: false,
    activationCommitBoundaryAborted: false,
    activationCommitBoundaryExecutable: false,
    transactionOpeningReady: true,
    transactionOpeningAuthorized: true,
    transactionOpeningStarted: true,
    transactionOpeningCompleted: true,
    transactionPreparationReady: true,
    transactionPreparationAuthorized: true,
  // prepared
    issuancePipelineState: "NON_EXECUTABLE",
    futureGrantPossible: true,
    futureGrantIssued: true,
    futureActivationPossible: true,
    futureActivationAuthorized: true,
    futureActivationStarted: false,
    predecessorActivationTransactionPreparationAuthorizationState:
      "TRANSACTION_PREPARATION_AUTHORIZED_NOT_PREPARED",
    predecessorActivationTransactionPreparationAuthorizationResult:
      "controlled-workspace-host-activation-transaction-preparation-authorized-not-prepared",
    predecessorActivationCommitBoundaryEntryState: "COMMIT_BOUNDARY_ENTERED",
    predecessorActivationCommitBoundaryEntryResult:
      "controlled-workspace-host-activation-commit-boundary-entered",
    issuanceCommitBoundaryState: "NOT_ENTERED",
    issuanceCommitBoundaryResult:
      "authorization-grant-issuance-commit-boundary-ready-not-entered",
    issuanceCommitBoundaryEntered: false,
    issuanceTransactionState: "OPENED",
    issuanceTransactionOpened: true,
    issuanceTransactionPrepared: true,
    issuanceTransactionCommitted: false,
    issuanceTransactionAborted: false,
    issuancePipelineExecutable: false,
    hostActivation: false,
    renderActivation: false,
    writer: "legacy",
    owner: "legacy",
    renderer: "legacy",
    shellRendered: false,
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.36",
    conditionCount: args.conditionCount,
    satisfiedConditionCount: args.satisfiedConditionCount,
    guardCount: args.guardCount,
    satisfiedGuardCount: args.satisfiedGuardCount,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedWorkspaceHostActivationTransactionPreparationPreparedContract(
  candidate: unknown,
): FeedWorkspaceHostActivationTransactionPreparationPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.35" ||
    c.status !== "controlled-workspace-host-activation-transaction-preparation-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_PHASE",
      "Prepared phase/status must be exact",
    );
  }
  if (
    c.candidateGranted !== true ||
    c.candidateActivated !== false ||
    c.activationCommitBoundaryEntered !== true ||
    c.activationCommitBoundaryArmed !== false ||
    c.activationCommitBoundaryCrossed !== false ||
    c.activationCommitBoundaryCommitted !== false ||
    c.activationCommitBoundaryAborted !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.issuanceTransactionState !== "OPENED" ||
    c.issuanceTransactionOpened !== true ||
    c.issuanceTransactionPrepared !== true ||
    c.issuanceTransactionCommitted !== false ||
    c.issuanceTransactionAborted !== false ||
    c.issuancePipelineExecutable !== false ||
    c.issuancePipelineState !== "NON_EXECUTABLE" ||
    c.transactionOpeningReady !== true ||
    c.transactionOpeningAuthorized !== true ||
    c.transactionOpeningStarted !== true ||
    c.transactionOpeningCompleted !== true ||
    c.transactionPreparationReady !== true ||
    c.transactionPreparationAuthorized !== true ||
    c.transactionPreparationState !== "TRANSACTION_PREPARED_NOT_COMMITTED" ||
    c.transactionPreparationResult !==
      "controlled-workspace-host-activation-transaction-prepared-not-committed"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_FLAGS",
      "Prepared preparation-authorization must be prepared-not-committed without activation or pipeline execution",
    );
  }
  if (c.nextEligibleStep !== "3B.3.36") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.36",
    );
  }
  if (c.issuanceCommitBoundaryState !== "NOT_ENTERED") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_BOUNDARY",
      "Issuance commit boundary must remain frozen at NOT_ENTERED",
    );
  }
  if (c.browserProof !== "pass" || c.existing20Invariants !== "pass") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_PREPARED_PROOF",
      "Browser proof and invariants must pass",
    );
  }
  return c as unknown as FeedWorkspaceHostActivationTransactionPreparationPreparedContract;
}
