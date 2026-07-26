/**
 * Phase 3B.3.25 readiness / freeze-for-next-step after workspace host candidate selection.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
} from "./controlled-workspace-host-candidate-registration";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "./controlled-workspace-host-candidate-selection";

export const FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostCandidateSelectionPreparedContract = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.25";
  status: "controlled-workspace-host-candidate-selection-prepared";
  selectionContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  candidateSelectionState: "SELECTED_NOT_ACTIVATED";
  candidateSelectionResult: "controlled-workspace-host-candidate-selected-not-activated";
  candidateRegistered: true;
  candidateSelected: true;
  candidateActivated: false;
  candidateExecutable: false;
  futureActivationTarget: true;
  predecessorCandidateRegistrationState: "REGISTERED_NOT_SELECTED";
  predecessorCandidateRegistrationResult: "controlled-workspace-host-candidate-registered-not-selected";
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
  nextEligibleStep: "3B.3.26";
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedWorkspaceHostCandidateSelectionPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
}): FeedWorkspaceHostCandidateSelectionPreparedContract {
  return validateFeedWorkspaceHostCandidateSelectionPreparedContract({
    schemaVersion:
      FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.25",
    status: "controlled-workspace-host-candidate-selection-prepared",
    selectionContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    candidateSelectionState: "SELECTED_NOT_ACTIVATED",
    candidateSelectionResult:
      "controlled-workspace-host-candidate-selected-not-activated",
    candidateRegistered: true,
    candidateSelected: true,
    candidateActivated: false,
    candidateExecutable: false,
    futureActivationTarget: true,
    predecessorCandidateRegistrationState: "REGISTERED_NOT_SELECTED",
    predecessorCandidateRegistrationResult:
      "controlled-workspace-host-candidate-registered-not-selected",
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
    nextEligibleStep: "3B.3.26",
    conditionCount: args.conditionCount,
    satisfiedConditionCount: args.satisfiedConditionCount,
    guardCount: args.guardCount,
    satisfiedGuardCount: args.satisfiedGuardCount,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedWorkspaceHostCandidateSelectionPreparedContract(
  candidate: unknown,
): FeedWorkspaceHostCandidateSelectionPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.25" ||
    c.status !== "controlled-workspace-host-candidate-selection-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_PHASE",
      "Prepared phase/status must be exact",
    );
  }
  if (c.candidateSelected !== true || c.candidateActivated !== false) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_FLAGS",
      "Prepared selection must remain selected-not-activated",
    );
  }
  if (c.nextEligibleStep !== "3B.3.26") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.26",
    );
  }
  if (c.issuanceCommitBoundaryState !== "NOT_ENTERED") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_BOUNDARY",
      "Commit boundary must remain NOT_ENTERED",
    );
  }
  if (c.browserProof !== "pass" || c.existing20Invariants !== "pass") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_PREPARED_PROOF",
      "Browser proof and invariants must pass",
    );
  }
  return c as unknown as FeedWorkspaceHostCandidateSelectionPreparedContract;
}
