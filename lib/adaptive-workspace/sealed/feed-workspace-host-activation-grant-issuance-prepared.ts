/**
 * Phase 3B.3.28 readiness / freeze-for-next-step after activation grant issuance.
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

export const FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostActivationGrantIssuancePreparedContract = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.28";
  status: "controlled-workspace-host-activation-grant-issuance-prepared";
  grantIssuanceContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  grantIssuanceState: "GRANTED_NOT_ACTIVATED";
  grantIssuanceResult: "controlled-workspace-host-activation-grant-issued-not-activated";
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
  futureGrantPossible: true;
  futureGrantIssued: true;
  futureActivationPossible: true;
  futureActivationAuthorized: true;
  futureActivationStarted: false;
  predecessorActivationAuthorizationState: "AUTHORIZED_NOT_GRANTED";
  predecessorActivationAuthorizationResult: "controlled-workspace-host-activation-authorized-not-granted";
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
  nextEligibleStep: "3B.3.29";
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedWorkspaceHostActivationGrantIssuancePreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
}): FeedWorkspaceHostActivationGrantIssuancePreparedContract {
  return validateFeedWorkspaceHostActivationGrantIssuancePreparedContract({
    schemaVersion:
      FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.28",
    status: "controlled-workspace-host-activation-grant-issuance-prepared",
    grantIssuanceContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    grantIssuanceState: "GRANTED_NOT_ACTIVATED",
    grantIssuanceResult:
      "controlled-workspace-host-activation-grant-issued-not-activated",
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
    futureGrantPossible: true,
    futureGrantIssued: true,
    futureActivationPossible: true,
    futureActivationAuthorized: true,
    futureActivationStarted: false,
    predecessorActivationAuthorizationState: "AUTHORIZED_NOT_GRANTED",
    predecessorActivationAuthorizationResult:
      "controlled-workspace-host-activation-authorized-not-granted",
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
    nextEligibleStep: "3B.3.29",
    conditionCount: args.conditionCount,
    satisfiedConditionCount: args.satisfiedConditionCount,
    guardCount: args.guardCount,
    satisfiedGuardCount: args.satisfiedGuardCount,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedWorkspaceHostActivationGrantIssuancePreparedContract(
  candidate: unknown,
): FeedWorkspaceHostActivationGrantIssuancePreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.28" ||
    c.status !== "controlled-workspace-host-activation-grant-issuance-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_PHASE",
      "Prepared phase/status must be exact",
    );
  }
  if (c.candidateGranted !== true || c.candidateActivated !== false) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_FLAGS",
      "Prepared grant issuance must remain granted-not-activated",
    );
  }
  if (c.nextEligibleStep !== "3B.3.29") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.29",
    );
  }
  if (c.issuanceCommitBoundaryState !== "NOT_ENTERED") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_BOUNDARY",
      "Commit boundary must remain NOT_ENTERED",
    );
  }
  if (c.browserProof !== "pass" || c.existing20Invariants !== "pass") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_PREPARED_PROOF",
      "Browser proof and invariants must pass",
    );
  }
  return c as unknown as FeedWorkspaceHostActivationGrantIssuancePreparedContract;
}
