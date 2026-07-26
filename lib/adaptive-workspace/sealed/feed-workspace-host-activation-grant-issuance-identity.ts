/**
 * Phase 3B.3.28 — Workspace host activation grant issuance identity contract.
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
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
} from "./controlled-workspace-host-activation-grant-issuance";

export const FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostActivationGrantIssuanceIdentity = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.28";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  activationGrantIssuanceContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID;
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
  metadataGrantIssuanceAllowed: true;
  activationAllowed: false;
  grantIssuanceAllowed: false;
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

export function createFeedWorkspaceHostActivationGrantIssuanceIdentity(): FeedWorkspaceHostActivationGrantIssuanceIdentity {
  return validateFeedWorkspaceHostActivationGrantIssuanceIdentity({
    schemaVersion:
      FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.28",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    activationGrantIssuanceContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
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
    metadataGrantIssuanceAllowed: true,
    activationAllowed: false,
    grantIssuanceAllowed: false,
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

export function validateFeedWorkspaceHostActivationGrantIssuanceIdentity(
  candidate: unknown,
): FeedWorkspaceHostActivationGrantIssuanceIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_IDENTITY_INVALID",
      "Grant issuance identity must be a plain object",
    );
  }
  const c = candidate as FeedWorkspaceHostActivationGrantIssuanceIdentity;
  if (c.phase !== "3B.3.28") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_IDENTITY_PHASE",
      "phase must be 3B.3.28",
    );
  }
  if (
    c.remountAllowed === true ||
    c.ownershipTransferAllowed === true ||
    c.activationAllowed === true ||
    c.grantIssuanceAllowed === true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_IDENTITY_TRANSFER",
      "Grant issuance identity forbids remount, transfer, activation, and further grant issuance",
    );
  }
  return c;
}
