/**
 * Phase 3B.3.26 readiness / freeze-for-next-step after activation readiness.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
} from "./controlled-workspace-host-candidate-registration";
import { CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID } from "./controlled-workspace-host-candidate-selection";
import { CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID } from "./controlled-workspace-host-activation-readiness";

export const FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostActivationReadinessPreparedContract = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_SCHEMA_VERSION;
  phase: "3B.3.26";
  status: "controlled-workspace-host-activation-readiness-prepared";
  readinessContract: "valid";
  identityContract: "valid";
  diagnosticsReadable: true;
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationReadinessState: "READY_NOT_AUTHORIZED";
  activationReadinessResult: "controlled-workspace-host-activation-ready-not-authorized";
  candidateSelected: true;
  candidateReady: true;
  candidateAuthorized: false;
  candidateGranted: false;
  candidateActivated: false;
  candidateExecutable: false;
  futureActivationPossible: true;
  futureActivationAuthorized: false;
  predecessorCandidateSelectionState: "SELECTED_NOT_ACTIVATED";
  predecessorCandidateSelectionResult: "controlled-workspace-host-candidate-selected-not-activated";
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
  nextEligibleStep: "3B.3.27";
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
  evidenceCommit: string;
  evidenceArtifactPath: string;
};

export function createFeedWorkspaceHostActivationReadinessPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
  conditionCount: number;
  satisfiedConditionCount: number;
  guardCount: number;
  satisfiedGuardCount: number;
}): FeedWorkspaceHostActivationReadinessPreparedContract {
  return validateFeedWorkspaceHostActivationReadinessPreparedContract({
    schemaVersion:
      FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_SCHEMA_VERSION,
    phase: "3B.3.26",
    status: "controlled-workspace-host-activation-readiness-prepared",
    readinessContract: "valid",
    identityContract: "valid",
    diagnosticsReadable: true,
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationReadinessState: "READY_NOT_AUTHORIZED",
    activationReadinessResult:
      "controlled-workspace-host-activation-ready-not-authorized",
    candidateSelected: true,
    candidateReady: true,
    candidateAuthorized: false,
    candidateGranted: false,
    candidateActivated: false,
    candidateExecutable: false,
    futureActivationPossible: true,
    futureActivationAuthorized: false,
    predecessorCandidateSelectionState: "SELECTED_NOT_ACTIVATED",
    predecessorCandidateSelectionResult:
      "controlled-workspace-host-candidate-selected-not-activated",
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
    nextEligibleStep: "3B.3.27",
    conditionCount: args.conditionCount,
    satisfiedConditionCount: args.satisfiedConditionCount,
    guardCount: args.guardCount,
    satisfiedGuardCount: args.satisfiedGuardCount,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
  });
}

export function validateFeedWorkspaceHostActivationReadinessPreparedContract(
  candidate: unknown,
): FeedWorkspaceHostActivationReadinessPreparedContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_INVALID",
      "Prepared contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_SCHEMA",
      "Unsupported prepared schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.26" ||
    c.status !== "controlled-workspace-host-activation-readiness-prepared"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_PHASE",
      "Prepared phase/status must be exact",
    );
  }
  if (c.candidateReady !== true || c.candidateAuthorized !== false) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_FLAGS",
      "Prepared readiness must remain ready-not-authorized",
    );
  }
  if (c.nextEligibleStep !== "3B.3.27") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_NEXT",
      "nextEligibleStep must be 3B.3.27",
    );
  }
  if (c.issuanceCommitBoundaryState !== "NOT_ENTERED") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_BOUNDARY",
      "Commit boundary must remain NOT_ENTERED",
    );
  }
  if (c.browserProof !== "pass" || c.existing20Invariants !== "pass") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_PREPARED_PROOF",
      "Browser proof and invariants must pass",
    );
  }
  return c as unknown as FeedWorkspaceHostActivationReadinessPreparedContract;
}
