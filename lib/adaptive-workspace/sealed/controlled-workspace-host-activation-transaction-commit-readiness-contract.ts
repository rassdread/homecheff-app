/**
 * Phase 3B.3.36 — Controlled Workspace Host Activation Transaction Commit Readiness Contract.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
} from "./controlled-workspace-host-candidate-registration";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "./controlled-workspace-host-candidate-selection";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID } from "./controlled-workspace-host-activation-readiness";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID } from "./controlled-workspace-host-activation-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
} from "./controlled-workspace-host-activation-grant-issuance";
import {
  PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-commit-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-preparation";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
} from "./controlled-workspace-host-activation-transaction-opening-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
} from "./controlled-workspace-host-activation-transaction-opening-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
} from "./controlled-workspace-host-activation-commit-boundary-entry";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceHostActivationTransactionCommitReadinessContract = {
  schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.36";
  previousPhase: "3B.3.35";
  widgetId: "feed.discovery";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  activationCommitBoundaryId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID;
  activationTransactionPreparationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID;
  activationTransactionPreparationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID;
  activationTransactionCommitReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID;
  contractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID;
  candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  transactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED";
  transactionCommitReadinessResult: "controlled-workspace-host-activation-transaction-commit-ready-not-committed";
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
  metadataTransactionCommitReadinessAllowed: true;
  activationAllowed: false;
  transactionCommitReadinessAllowed: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
  remountAllowed: false;
  secondMountAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  activationRestriction: typeof PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY;
  nextEligibleStep: "3B.3.37";
};

export function createControlledWorkspaceHostActivationTransactionCommitReadinessContract(): ControlledWorkspaceHostActivationTransactionCommitReadinessContract {
  return validateControlledWorkspaceHostActivationTransactionCommitReadinessContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.36",
    previousPhase: "3B.3.35",
    widgetId: "feed.discovery",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    activationCommitBoundaryId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
    activationTransactionPreparationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
    activationTransactionPreparationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
    activationTransactionCommitReadinessId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
    contractId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    transactionCommitReadinessState: "TRANSACTION_COMMIT_READY_NOT_COMMITTED",
    transactionCommitReadinessResult:
      "controlled-workspace-host-activation-transaction-commit-ready-not-committed",
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
    metadataTransactionCommitReadinessAllowed: true,
    activationAllowed: false,
    transactionCommitReadinessAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    remountAllowed: false,
    secondMountAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    activationRestriction:
      PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY,
    nextEligibleStep: "3B.3.37",
  });
}

export function validateControlledWorkspaceHostActivationTransactionCommitReadinessContract(
  candidate: unknown,
): ControlledWorkspaceHostActivationTransactionCommitReadinessContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_INVALID",
      "Commit-boundary entry contract must be a plain object",
    );
  }
  const c = candidate as ControlledWorkspaceHostActivationTransactionCommitReadinessContract;
  if (
    c.phase !== "3B.3.36" ||
    c.previousPhase !== "3B.3.35" ||
    c.nextEligibleStep !== "3B.3.37"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_PHASE",
      "phase must be 3B.3.36 with previousPhase 3B.3.35",
    );
  }
  if (
    c.candidateGranted !== true ||
    c.candidateActivated !== false ||
    c.grantPresent !== true ||
    c.grantExecutable !== false ||
    c.activationCommitBoundaryEntered !== true ||
    c.activationCommitBoundaryArmed !== false ||
    c.activationCommitBoundaryCrossed !== false ||
    c.activationCommitBoundaryCommitted !== false ||
    c.activationCommitBoundaryAborted !== false ||
    c.activationCommitBoundaryExecutable !== false ||
    c.activationAllowed !== false ||
    c.transactionCommitReadinessAllowed !== false ||
    c.metadataTransactionCommitReadinessAllowed !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_FLAGS",
      "Commit-boundary entry contract must enter without arming, crossing, committing, aborting, or activating",
    );
  }
  return c;
}
