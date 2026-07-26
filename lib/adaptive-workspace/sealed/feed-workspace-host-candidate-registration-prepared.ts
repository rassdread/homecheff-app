/**
 * Phase 3B.3.24 readiness / freeze-for-next-step after workspace host candidate registration.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
} from "./controlled-workspace-host-candidate-registration";

export const FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostCandidateRegistrationPreparedContract = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.24";
  status: "controlled-workspace-host-candidate-registration-prepared";
  registrationContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  candidateRegistrationState: "REGISTERED_NOT_SELECTED";
  candidateRegistrationResult: "controlled-workspace-host-candidate-registered-not-selected";
  candidateRegistered: true;
  candidateSelected: false;
  candidateActivated: false;
  candidateExecutable: false;
  issuanceCommitBoundaryState: "NOT_ENTERED";
  issuanceCommitBoundaryResult: "authorization-grant-issuance-commit-boundary-ready-not-entered";
  issuanceCommitBoundaryEntered: false;
  hostActivation: false;
  renderActivation: false;
  writer: "legacy";
  owner: "legacy";
  renderer: "legacy";
  shellRendered: false;
  browserProof: "pass";
  existing20Invariants: "pass";
  nextEligibleStep: "3B.3.25";
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedWorkspaceHostCandidateRegistrationPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
}): FeedWorkspaceHostCandidateRegistrationPreparedContract {
  return validateFeedWorkspaceHostCandidateRegistrationPreparedContract({
    schemaVersion:
      FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.24",
    status: "controlled-workspace-host-candidate-registration-prepared",
    registrationContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    candidateRegistrationState: "REGISTERED_NOT_SELECTED",
    candidateRegistrationResult:
      "controlled-workspace-host-candidate-registered-not-selected",
    candidateRegistered: true,
    candidateSelected: false,
    candidateActivated: false,
    candidateExecutable: false,
    issuanceCommitBoundaryState: "NOT_ENTERED",
    issuanceCommitBoundaryResult:
      "authorization-grant-issuance-commit-boundary-ready-not-entered",
    issuanceCommitBoundaryEntered: false,
    hostActivation: false,
    renderActivation: false,
    writer: "legacy",
    owner: "legacy",
    renderer: "legacy",
    shellRendered: false,
    browserProof: "pass",
    existing20Invariants: "pass",
    nextEligibleStep: "3B.3.25",
    conditionCount: args.conditionCount,
    satisfiedConditionCount: args.satisfiedConditionCount,
    guardCount: args.guardCount,
    satisfiedGuardCount: args.satisfiedGuardCount,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedWorkspaceHostCandidateRegistrationPreparedContract(
  candidate: unknown,
): FeedWorkspaceHostCandidateRegistrationPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.24" ||
    c.status !== "controlled-workspace-host-candidate-registration-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_PHASE",
      "phase/status mismatch for 3B.3.24",
    );
  }
  if (
    c.candidateRegistrationState !== "REGISTERED_NOT_SELECTED" ||
    c.candidateSelected !== false ||
    c.candidateActivated !== false ||
    c.candidateExecutable !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_STATE",
      "Prepared contract must remain registered-not-selected",
    );
  }
  if (
    c.issuanceCommitBoundaryState !== "NOT_ENTERED" ||
    c.issuanceCommitBoundaryEntered !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_PREDECESSOR",
      "Predecessor commit boundary must remain NOT_ENTERED",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.shellRendered !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_ACTIVATION",
      "host/render activation and shell render must remain false",
    );
  }
  if (
    c.writer !== "legacy" ||
    c.owner !== "legacy" ||
    c.renderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_OWNER",
      "writer/owner/renderer must be legacy",
    );
  }
  if (c.nextEligibleStep !== "3B.3.25") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.25",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_COMMIT",
      "evidenceCommit required",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PREPARED_PATH",
      "evidenceArtifactPath required",
    );
  }
  return c as FeedWorkspaceHostCandidateRegistrationPreparedContract;
}
