/**
 * Phase 3B.3.24 — Workspace host candidate identity contract.
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

export const FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_SCHEMA_VERSION = 1 as const;

export type FeedWorkspaceHostCandidateIdentity = {
  schemaVersion: typeof FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.24";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
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
  selectionAllowed: false;
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

export function createFeedWorkspaceHostCandidateIdentity(): FeedWorkspaceHostCandidateIdentity {
  return validateFeedWorkspaceHostCandidateIdentity({
    schemaVersion: FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.24",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
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
    selectionAllowed: false,
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

export function validateFeedWorkspaceHostCandidateIdentity(
  candidate: unknown,
): FeedWorkspaceHostCandidateIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_INVALID",
      "Candidate identity must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_SCHEMA",
      "Unsupported candidate identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.24") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_PHASE",
      "phase must be 3B.3.24",
    );
  }
  if (
    c.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID ||
    c.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID ||
    c.candidateKind !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_IDS",
      "candidate identities must be exact",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_RUNTIME",
      "hostId/runtimeId must remain stable",
    );
  }
  if (
    c.expectedMountCount !== 1 ||
    c.expectedUnmountCount !== 0 ||
    c.expectedActiveInstanceCount !== 1 ||
    c.expectedRendererRegistrationCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_COUNTS",
      "mount/unmount/renderer counts must remain single-legacy",
    );
  }
  if (
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy" ||
    c.candidateOwner !== "none" ||
    c.candidateWriter !== "none" ||
    c.candidateRenderer !== "none"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_OWNER",
      "active ownership must remain legacy; candidate ownership must be none",
    );
  }
  for (const key of [
    "selectionAllowed",
    "activationAllowed",
    "runtimeIdTransitionAllowed",
    "remountAllowed",
    "identityTransitionAllowed",
    "parentReplacementAllowed",
    "wrapperAllowed",
    "portalAllowed",
    "ownershipTransferAllowed",
    "writerTransferAllowed",
    "rendererTransferAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_WORKSPACE_HOST_CANDIDATE_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedWorkspaceHostCandidateIdentity;
}
