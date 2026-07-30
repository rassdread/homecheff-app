/**
 * Phase 3B.3.15 — activation transition selection identity contract.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";

export const FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionSelectionIdentity = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.15";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  expectedMountCount: 1;
  expectedUnmountCount: 0;
  expectedActiveInstanceCount: 1;
  expectedRendererRegistrationCount: 0;
  expectedOwner: "legacy";
  expectedWriter: "legacy";
  expectedRenderer: "legacy";
  runtimeIdTransitionAllowed: false;
  remountAllowed: false;
  identityTransitionAllowed: false;
  parentReplacementAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
  activationViaTransitionSelectionAllowed: false;
  canStartActivationAllowed: false;
  runtimeMutationViaTransitionSelectionAllowed: false;
  executorViaTransitionSelectionAllowed: false;
  schedulerViaTransitionSelectionAllowed: false;
  commitViaTransitionSelectionAllowed: false;
  graphTraversalViaTransitionSelectionAllowed: false;
  transitionExecutionViaTransitionSelectionAllowed: false;
  selectionExecutionViaTransitionSelectionAllowed: false;
  protocolExecutionViaTransitionSelectionAllowed: false;
  ownershipTransferViaTransitionSelectionAllowed: false;
  writerTransferViaTransitionSelectionAllowed: false;
  rendererTransferViaTransitionSelectionAllowed: false;
};

export function createFeedHostActivationTransitionSelectionIdentity(): FeedHostActivationTransitionSelectionIdentity {
  return validateFeedHostActivationTransitionSelectionIdentity({
    schemaVersion:
      FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.15",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    expectedMountCount: 1,
    expectedUnmountCount: 0,
    expectedActiveInstanceCount: 1,
    expectedRendererRegistrationCount: 0,
    expectedOwner: "legacy",
    expectedWriter: "legacy",
    expectedRenderer: "legacy",
    runtimeIdTransitionAllowed: false,
    remountAllowed: false,
    identityTransitionAllowed: false,
    parentReplacementAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
    activationViaTransitionSelectionAllowed: false,
    canStartActivationAllowed: false,
    runtimeMutationViaTransitionSelectionAllowed: false,
    executorViaTransitionSelectionAllowed: false,
    schedulerViaTransitionSelectionAllowed: false,
    commitViaTransitionSelectionAllowed: false,
    graphTraversalViaTransitionSelectionAllowed: false,
    transitionExecutionViaTransitionSelectionAllowed: false,
    selectionExecutionViaTransitionSelectionAllowed: false,
    protocolExecutionViaTransitionSelectionAllowed: false,
    ownershipTransferViaTransitionSelectionAllowed: false,
    writerTransferViaTransitionSelectionAllowed: false,
    rendererTransferViaTransitionSelectionAllowed: false,
  });
}

export function validateFeedHostActivationTransitionSelectionIdentity(
  candidate: unknown,
): FeedHostActivationTransitionSelectionIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_INVALID",
      "Identity contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_SCHEMA",
      "Unsupported identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.15") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_PHASE",
      "phase must be 3B.3.15",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_IDS",
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
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_COUNTS",
      "mount/unmount/instance/renderer counts must stay sealed",
    );
  }
  if (
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_OWNER",
      "expected owner/writer/renderer must be legacy",
    );
  }
  for (const key of [
    "runtimeIdTransitionAllowed",
    "remountAllowed",
    "identityTransitionAllowed",
    "parentReplacementAllowed",
    "wrapperAllowed",
    "portalAllowed",
    "activationViaTransitionSelectionAllowed",
    "canStartActivationAllowed",
    "runtimeMutationViaTransitionSelectionAllowed",
    "executorViaTransitionSelectionAllowed",
    "schedulerViaTransitionSelectionAllowed",
    "commitViaTransitionSelectionAllowed",
    "graphTraversalViaTransitionSelectionAllowed",
    "transitionExecutionViaTransitionSelectionAllowed",
    "selectionExecutionViaTransitionSelectionAllowed",
    "protocolExecutionViaTransitionSelectionAllowed",
    "ownershipTransferViaTransitionSelectionAllowed",
    "writerTransferViaTransitionSelectionAllowed",
    "rendererTransferViaTransitionSelectionAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_SELECTION_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedHostActivationTransitionSelectionIdentity;
}
