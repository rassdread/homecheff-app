/**
 * Phase 3B.3.26 — Workspace host activation readiness identity contract.
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
import {
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-readiness";

export const FEED_WORKSPACE_HOST_ACTIVATION_READINESS_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostActivationReadinessIdentity = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_ACTIVATION_READINESS_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.26";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationReadinessContractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID;
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
  metadataReadinessAllowed: true;
  activationAllowed: false;
  authorizationAllowed: false;
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

export function createFeedWorkspaceHostActivationReadinessIdentity(): FeedWorkspaceHostActivationReadinessIdentity {
  return validateFeedWorkspaceHostActivationReadinessIdentity({
    schemaVersion:
      FEED_WORKSPACE_HOST_ACTIVATION_READINESS_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.26",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationReadinessContractId:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
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
    metadataReadinessAllowed: true,
    activationAllowed: false,
    authorizationAllowed: false,
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

export function validateFeedWorkspaceHostActivationReadinessIdentity(
  candidate: unknown,
): FeedWorkspaceHostActivationReadinessIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_IDENTITY_INVALID",
      "Activation readiness identity must be a plain object",
    );
  }
  const c = candidate as FeedWorkspaceHostActivationReadinessIdentity;
  if (c.phase !== "3B.3.26") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_IDENTITY_PHASE",
      "phase must be 3B.3.26",
    );
  }
  if (c.remountAllowed === true || c.ownershipTransferAllowed === true) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_IDENTITY_TRANSFER",
      "Activation readiness identity forbids remount and ownership transfer",
    );
  }
  if (c.activationAllowed === true || c.authorizationAllowed === true) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_IDENTITY_ACTIVATION",
      "activationAllowed and authorizationAllowed must remain false",
    );
  }
  return c;
}
