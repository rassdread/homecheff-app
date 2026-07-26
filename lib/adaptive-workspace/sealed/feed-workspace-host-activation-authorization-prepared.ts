/**
 * Phase 3B.3.27 readiness / freeze-for-next-step after activation authorization.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
} from "./controlled-workspace-host-candidate-registration";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "./controlled-workspace-host-candidate-selection";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID } from "./controlled-workspace-host-activation-readiness";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID } from "./controlled-workspace-host-activation-authorization";

export const FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostActivationAuthorizationPreparedContract = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.27";
  status: "controlled-workspace-host-activation-authorization-prepared";
  authorizationContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  activationAuthorizationState: "AUTHORIZED_NOT_GRANTED";
  activationAuthorizationResult: "controlled-workspace-host-activation-authorized-not-granted";
  candidateSelected: true;
  candidateReady: true;
  candidateAuthorized: true;
  candidateGranted: false;
  candidateActivated: false;
  candidateExecutable: false;
  futureGrantPossible: true;
  futureGrantIssued: false;
  futureActivationPossible: true;
  futureActivationAuthorized: true;
  predecessorActivationReadinessState: "READY_NOT_AUTHORIZED";
  predecessorActivationReadinessResult: "controlled-workspace-host-activation-ready-not-authorized";
  issuanceCommitBoundaryState: "NOT_ENTERED";
  issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
  issuanceCommitBoundaryEntered: false;
  issuanceTransactionState: "NOT_OPENED";
  issuancePipelineExecutable: false;
  hostActivation: false;
  renderActivation: false;
  writer: "legacy";
  owner: "legacy";
  renderer: "legacy";
  shellRendered: false;
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.28";
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedWorkspaceHostActivationAuthorizationPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
}): FeedWorkspaceHostActivationAuthorizationPreparedContract {
  return validateFeedWorkspaceHostActivationAuthorizationPreparedContract({
    schemaVersion:
      FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.27",
    status: "controlled-workspace-host-activation-authorization-prepared",
    authorizationContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationAuthorizationState: "AUTHORIZED_NOT_GRANTED",
    activationAuthorizationResult:
      "controlled-workspace-host-activation-authorized-not-granted",
    candidateSelected: true,
    candidateReady: true,
    candidateAuthorized: true,
    candidateGranted: false,
    candidateActivated: false,
    candidateExecutable: false,
    futureGrantPossible: true,
    futureGrantIssued: false,
    futureActivationPossible: true,
    futureActivationAuthorized: true,
    predecessorActivationReadinessState: "READY_NOT_AUTHORIZED",
    predecessorActivationReadinessResult:
      "controlled-workspace-host-activation-ready-not-authorized",
    issuanceCommitBoundaryState: "NOT_ENTERED",
    issuanceCommitBoundaryResult:
      "authorization-grant-issuance-commit-boundary-ready-not-entered",
    issuanceCommitBoundaryEntered: false,
    issuanceTransactionState: "NOT_OPENED",
    issuancePipelineExecutable: false,
    hostActivation: false,
    renderActivation: false,
    writer: "legacy",
    owner: "legacy",
    renderer: "legacy",
    shellRendered: false,
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.28",
    conditionCount: args.conditionCount,
    satisfiedConditionCount: args.satisfiedConditionCount,
    guardCount: args.guardCount,
    satisfiedGuardCount: args.satisfiedGuardCount,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedWorkspaceHostActivationAuthorizationPreparedContract(
  candidate: unknown,
): FeedWorkspaceHostActivationAuthorizationPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.27" ||
    c.status !== "controlled-workspace-host-activation-authorization-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_PHASE",
      "Prepared phase/status must be exact",
    );
  }
  if (c.candidateAuthorized !== true || c.candidateGranted !== false) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_FLAGS",
      "Prepared authorization must remain authorized-not-granted",
    );
  }
  if (c.nextEligibleStep !== "3B.3.28") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.28",
    );
  }
  if (c.issuanceCommitBoundaryState !== "NOT_ENTERED") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_BOUNDARY",
      "Commit boundary must remain NOT_ENTERED",
    );
  }
  if (c.browserProof !== "pass" || c.existing20Invariants !== "pass") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_PREPARED_PROOF",
      "Browser proof and invariants must pass",
    );
  }
  return c as unknown as FeedWorkspaceHostActivationAuthorizationPreparedContract;
}
