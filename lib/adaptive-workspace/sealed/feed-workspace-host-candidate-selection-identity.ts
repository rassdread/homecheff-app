/**
 * Phase 3B.3.25 — Workspace host candidate selection identity contract.
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
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID,
} from "./controlled-workspace-host-candidate-selection";

export const FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostCandidateSelectionIdentity = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.25";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  selectionContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID;
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
  metadataSelectionAllowed: true;
  activationAllowed: false;
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

export function createFeedWorkspaceHostCandidateSelectionIdentity(): FeedWorkspaceHostCandidateSelectionIdentity {
  return validateFeedWorkspaceHostCandidateSelectionIdentity({
    schemaVersion:
      FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.25",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    selectionContractId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID,
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
    metadataSelectionAllowed: true,
    activationAllowed: false,
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

export function validateFeedWorkspaceHostCandidateSelectionIdentity(
  candidate: unknown,
): FeedWorkspaceHostCandidateSelectionIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_IDENTITY_INVALID",
      "Selection identity must be a plain object",
    );
  }
  const c = candidate as FeedWorkspaceHostCandidateSelectionIdentity;
  if (c.phase !== "3B.3.25") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_IDENTITY_PHASE",
      "phase must be 3B.3.25",
    );
  }
  if (c.remountAllowed === true || c.ownershipTransferAllowed === true) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_IDENTITY_TRANSFER",
      "Selection identity forbids remount and ownership transfer",
    );
  }
  if (c.activationAllowed === true) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_IDENTITY_ACTIVATION",
      "activationAllowed must remain false",
    );
  }
  return c;
}
