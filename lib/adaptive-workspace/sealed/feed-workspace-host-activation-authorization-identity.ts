/**
 * Phase 3B.3.27 — Workspace host activation authorization identity contract.
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
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-authorization";

export const FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostActivationAuthorizationIdentity = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.27";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  activationAuthorizationContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID;
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
  metadataAuthorizationAllowed: true;
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

export function createFeedWorkspaceHostActivationAuthorizationIdentity(): FeedWorkspaceHostActivationAuthorizationIdentity {
  return validateFeedWorkspaceHostActivationAuthorizationIdentity({
    schemaVersion:
      FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.27",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationAuthorizationContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
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
    metadataAuthorizationAllowed: true,
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

export function validateFeedWorkspaceHostActivationAuthorizationIdentity(
  candidate: unknown,
): FeedWorkspaceHostActivationAuthorizationIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_IDENTITY_INVALID",
      "Authorization identity must be a plain object",
    );
  }
  const c = candidate as FeedWorkspaceHostActivationAuthorizationIdentity;
  if (c.phase !== "3B.3.27") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_IDENTITY_PHASE",
      "phase must be 3B.3.27",
    );
  }
  if (
    c.remountAllowed === true ||
    c.ownershipTransferAllowed === true ||
    c.activationAllowed === true ||
    c.grantIssuanceAllowed === true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_IDENTITY_TRANSFER",
      "Authorization identity forbids remount, transfer, activation, and grant issuance",
    );
  }
  return c;
}
