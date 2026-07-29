/**
 * Phase 3B.3.44 — Workspace host activation candidate-activation identity contract.
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
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-preparation-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-preparation-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-preparation";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-commit-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-commit-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-issuance-pipeline-execution-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-issuance-pipeline-execution-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-issuance-pipeline-execution";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_CONTRACT_ID,
} from "./controlled-workspace-host-candidate-activation";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-commit";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-opening";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-opening-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-transaction-opening-readiness";
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
} from "./controlled-workspace-host-activation-commit-boundary-entry";

export const FEED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostCandidateActivationIdentity = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.44";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  activationCommitBoundaryId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID;
  activationCommitBoundaryEntryId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID;
  activationTransactionOpeningReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID;
  activationTransactionOpeningReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID;
  activationTransactionOpeningAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID;
  activationTransactionOpeningAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID;
  activationTransactionOpeningId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID;
  activationTransactionOpeningContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID;
  activationTransactionPreparationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID;
  activationTransactionPreparationReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID;
  activationTransactionPreparationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID;
  activationTransactionPreparationAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_CONTRACT_ID;
  activationTransactionPreparationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID;
  activationTransactionPreparationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID;
  activationTransactionCommitReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID;
  activationTransactionCommitReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID;
  activationTransactionCommitAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID;
  activationTransactionCommitAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONTRACT_ID;
  activationTransactionCommitId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID;
  activationTransactionCommitContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_CONTRACT_ID;
  activationIssuancePipelineExecutionReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID;
  activationIssuancePipelineExecutionReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_CONTRACT_ID;
  activationIssuancePipelineExecutionAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ID;
  activationIssuancePipelineExecutionAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_CONTRACT_ID;
  activationIssuancePipelineExecutionId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID;
  activationIssuancePipelineExecutionContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONTRACT_ID;
  activationCandidateActivationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ID;
  activationCandidateActivationContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_CONTRACT_ID;
  candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  expectedMountCount: 1;
  expectedUnmountCount: 0;
  expectedActiveInstanceCount: 1;
  expectedRendererRegistrationCount: 0;
  expectedOwner: "legacy";
  expectedWriter: "legacy";
  expectedRenderer: "legacy";
  candidateOwner: "none";
  candidateWriter: "none";
  candidateRenderer: "none";
  metadataTransactionCommitAllowed: true;
  transactionCommitExecuteAllowed: false;
  activationAllowed: false;
  commitBoundaryEntryAllowed: false;
  boundaryArmAllowed: false;
  boundaryCrossAllowed: false;
  boundaryCommitAllowed: false;
  boundaryAbortAllowed: false;
  runtimeIdTransitionAllowed: false;
  remountAllowed: false;
  identityTransitionAllowed: false;
  parentReplacementAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
};

export function createFeedWorkspaceHostCandidateActivationIdentity(): FeedWorkspaceHostCandidateActivationIdentity {
  return validateFeedWorkspaceHostCandidateActivationIdentity({
    schemaVersion:
      FEED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.44",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    activationCommitBoundaryId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ID,
    activationCommitBoundaryEntryId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ID,
    activationTransactionOpeningReadinessId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ID,
    activationTransactionOpeningReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_CONTRACT_ID,
    activationTransactionOpeningAuthorizationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID,
    activationTransactionOpeningAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_CONTRACT_ID,
    activationTransactionOpeningId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID,
    activationTransactionOpeningContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_CONTRACT_ID,
    activationTransactionPreparationReadinessId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID,
    activationTransactionPreparationReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_CONTRACT_ID,
    activationTransactionPreparationAuthorizationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID,
    activationTransactionPreparationAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_CONTRACT_ID,
    activationTransactionPreparationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID,
    activationTransactionPreparationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_CONTRACT_ID,
    activationTransactionCommitReadinessId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ID,
    activationTransactionCommitReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_CONTRACT_ID,
    activationTransactionCommitAuthorizationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ID,
    activationTransactionCommitAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_CONTRACT_ID,
    activationTransactionCommitId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID,
    activationTransactionCommitContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_CONTRACT_ID,
    activationIssuancePipelineExecutionReadinessId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID,
    activationIssuancePipelineExecutionReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_CONTRACT_ID,
    activationIssuancePipelineExecutionAuthorizationId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ID,
    activationIssuancePipelineExecutionAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_CONTRACT_ID,
    activationIssuancePipelineExecutionId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID,
    activationIssuancePipelineExecutionContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_CONTRACT_ID,
    activationCandidateActivationId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ID,
    activationCandidateActivationContractId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    expectedMountCount: 1,
    expectedUnmountCount: 0,
    expectedActiveInstanceCount: 1,
    expectedRendererRegistrationCount: 0,
    expectedOwner: "legacy",
    expectedWriter: "legacy",
    expectedRenderer: "legacy",
    candidateOwner: "none",
    candidateWriter: "none",
    candidateRenderer: "none",
    metadataTransactionCommitAllowed: true,
    transactionCommitExecuteAllowed: false,
    activationAllowed: false,
    commitBoundaryEntryAllowed: false,
    boundaryArmAllowed: false,
    boundaryCrossAllowed: false,
    boundaryCommitAllowed: false,
    boundaryAbortAllowed: false,
    runtimeIdTransitionAllowed: false,
    remountAllowed: false,
    identityTransitionAllowed: false,
    parentReplacementAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
  });
}

export function validateFeedWorkspaceHostCandidateActivationIdentity(
  candidate: unknown,
): FeedWorkspaceHostCandidateActivationIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_IDENTITY_INVALID",
      "Commit-readiness identity must be a plain object",
    );
  }
  const c = candidate as FeedWorkspaceHostCandidateActivationIdentity;
  if (c.phase !== "3B.3.44") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_IDENTITY_PHASE",
      "phase must be 3B.3.44",
    );
  }
  if (
    c.activationTransactionOpeningId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ID ||
    c.activationTransactionPreparationReadinessId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ID ||
    c.activationTransactionPreparationAuthorizationId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ID ||
    c.activationTransactionPreparationId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ID ||
    c.activationTransactionCommitId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ID ||
    c.activationIssuancePipelineExecutionReadinessId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ID ||
    c.activationIssuancePipelineExecutionAuthorizationId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ID ||
    c.activationIssuancePipelineExecutionId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ID ||
    c.activationCandidateActivationId !==
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ID ||
    c.activationTransactionOpeningAuthorizationId !==
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ID ||
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_IDENTITY_CHAIN",
      "Pipeline-execution-readiness identity must preserve exact commit/opening chain and legacy authority",
    );
  }
  if (
    c.remountAllowed === true ||
    c.ownershipTransferAllowed === true ||
    c.activationAllowed === true ||
    c.transactionCommitExecuteAllowed === true ||
    c.commitBoundaryEntryAllowed === true ||
    c.boundaryArmAllowed === true ||
    c.boundaryCrossAllowed === true ||
    c.boundaryCommitAllowed === true ||
    c.boundaryAbortAllowed === true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_IDENTITY_TRANSFER",
      "Commit-readiness identity forbids remount, transfer, activation, and further boundary progression",
    );
  }
  return c;
}
