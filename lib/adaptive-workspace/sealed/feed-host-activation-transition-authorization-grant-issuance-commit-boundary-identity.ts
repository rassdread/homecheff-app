/**
 * Phase 3B.3.23 — activation transition authorization grant issuance commit boundary identity contract.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";

export const FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.23";
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
  activationViaIssuanceCommitBoundaryAllowed: false;
  canStartActivationAllowed: false;
  runtimeMutationViaIssuanceCommitBoundaryAllowed: false;
  executorViaIssuanceCommitBoundaryAllowed: false;
  schedulerViaIssuanceCommitBoundaryAllowed: false;
  commitViaIssuanceCommitBoundaryAllowed: false;
  graphTraversalViaIssuanceCommitBoundaryAllowed: false;
  transitionExecutionViaIssuanceCommitBoundaryAllowed: false;
  selectionExecutionViaIssuanceCommitBoundaryAllowed: false;
  preflightExecutionViaIssuanceCommitBoundaryAllowed: false;
  authorizationDecisionExecutionViaIssuanceCommitBoundaryAllowed: false;
  authorizationGrantViaIssuanceCommitBoundaryAllowed: false;
  authorizationApplicationViaIssuanceCommitBoundaryAllowed: false;
  transitionAuthorizationViaIssuanceCommitBoundaryAllowed: false;
  grantReadinessExecutionViaIssuanceCommitBoundaryAllowed: false;
  issuanceDecisionExecutionViaIssuanceCommitBoundaryAllowed: false;
  issuanceCommitBoundaryExecutionViaIssuanceCommitBoundaryAllowed: false;
  grantCreationViaIssuanceCommitBoundaryAllowed: false;
  grantIssuanceViaIssuanceCommitBoundaryAllowed: false;
  grantMaterializationViaIssuanceCommitBoundaryAllowed: false;
  grantPersistenceViaIssuanceCommitBoundaryAllowed: false;
  grantApplicationViaIssuanceCommitBoundaryAllowed: false;
  grantActivationViaIssuanceCommitBoundaryAllowed: false;
  grantConsumptionViaIssuanceCommitBoundaryAllowed: false;
  grantRevocationViaIssuanceCommitBoundaryAllowed: false;
  grantAuthorityViaIssuanceCommitBoundaryAllowed: false;
  authorityCreationViaIssuanceCommitBoundaryAllowed: false;
  authorityEnablementViaIssuanceCommitBoundaryAllowed: false;
  authorityDelegationViaIssuanceCommitBoundaryAllowed: false;
  authorityTransferViaIssuanceCommitBoundaryAllowed: false;
  protocolExecutionViaIssuanceCommitBoundaryAllowed: false;
  ownershipTransferViaIssuanceCommitBoundaryAllowed: false;
  writerTransferViaIssuanceCommitBoundaryAllowed: false;
  rendererTransferViaIssuanceCommitBoundaryAllowed: false;
  tokenViaIssuanceCommitBoundaryAllowed: false;
  secretViaIssuanceCommitBoundaryAllowed: false;
  signatureViaIssuanceCommitBoundaryAllowed: false;
  nonceViaIssuanceCommitBoundaryAllowed: false;
  credentialViaIssuanceCommitBoundaryAllowed: false;
  certificateViaIssuanceCommitBoundaryAllowed: false;
  permitViaIssuanceCommitBoundaryAllowed: false;
  callbackViaIssuanceCommitBoundaryAllowed: false;
  executableHandleViaIssuanceCommitBoundaryAllowed: false;
  runtimeCapabilityViaIssuanceCommitBoundaryAllowed: false;
  commandViaIssuanceCommitBoundaryAllowed: false;
  dispatcherViaIssuanceCommitBoundaryAllowed: false;
  queueViaIssuanceCommitBoundaryAllowed: false;
  domMutationViaIssuanceCommitBoundaryAllowed: false;
  reactRemountViaIssuanceCommitBoundaryAllowed: false;
  secondGeofeedViaIssuanceCommitBoundaryAllowed: false;
  nonNullShellViaIssuanceCommitBoundaryAllowed: false;
};

export function createFeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity(): FeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity {
  return validateFeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity({
    schemaVersion: FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.23",
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
    activationViaIssuanceCommitBoundaryAllowed: false,
    canStartActivationAllowed: false,
    runtimeMutationViaIssuanceCommitBoundaryAllowed: false,
    executorViaIssuanceCommitBoundaryAllowed: false,
    schedulerViaIssuanceCommitBoundaryAllowed: false,
    commitViaIssuanceCommitBoundaryAllowed: false,
    graphTraversalViaIssuanceCommitBoundaryAllowed: false,
    transitionExecutionViaIssuanceCommitBoundaryAllowed: false,
    selectionExecutionViaIssuanceCommitBoundaryAllowed: false,
    preflightExecutionViaIssuanceCommitBoundaryAllowed: false,
    authorizationDecisionExecutionViaIssuanceCommitBoundaryAllowed: false,
    authorizationGrantViaIssuanceCommitBoundaryAllowed: false,
    authorizationApplicationViaIssuanceCommitBoundaryAllowed: false,
    transitionAuthorizationViaIssuanceCommitBoundaryAllowed: false,
    grantReadinessExecutionViaIssuanceCommitBoundaryAllowed: false,
    issuanceDecisionExecutionViaIssuanceCommitBoundaryAllowed: false,
    issuanceCommitBoundaryExecutionViaIssuanceCommitBoundaryAllowed: false,
  issuancePlanExecutionViaIssuanceCommitBoundaryAllowed: false,
    grantCreationViaIssuanceCommitBoundaryAllowed: false,
    grantIssuanceViaIssuanceCommitBoundaryAllowed: false,
    grantMaterializationViaIssuanceCommitBoundaryAllowed: false,
    grantPersistenceViaIssuanceCommitBoundaryAllowed: false,
    grantApplicationViaIssuanceCommitBoundaryAllowed: false,
    grantActivationViaIssuanceCommitBoundaryAllowed: false,
    grantConsumptionViaIssuanceCommitBoundaryAllowed: false,
    grantRevocationViaIssuanceCommitBoundaryAllowed: false,
    grantAuthorityViaIssuanceCommitBoundaryAllowed: false,
    authorityCreationViaIssuanceCommitBoundaryAllowed: false,
    authorityEnablementViaIssuanceCommitBoundaryAllowed: false,
    authorityDelegationViaIssuanceCommitBoundaryAllowed: false,
    authorityTransferViaIssuanceCommitBoundaryAllowed: false,
    protocolExecutionViaIssuanceCommitBoundaryAllowed: false,
    ownershipTransferViaIssuanceCommitBoundaryAllowed: false,
    writerTransferViaIssuanceCommitBoundaryAllowed: false,
    rendererTransferViaIssuanceCommitBoundaryAllowed: false,
    tokenViaIssuanceCommitBoundaryAllowed: false,
    secretViaIssuanceCommitBoundaryAllowed: false,
    signatureViaIssuanceCommitBoundaryAllowed: false,
    nonceViaIssuanceCommitBoundaryAllowed: false,
    credentialViaIssuanceCommitBoundaryAllowed: false,
    certificateViaIssuanceCommitBoundaryAllowed: false,
    permitViaIssuanceCommitBoundaryAllowed: false,
    callbackViaIssuanceCommitBoundaryAllowed: false,
    executableHandleViaIssuanceCommitBoundaryAllowed: false,
    runtimeCapabilityViaIssuanceCommitBoundaryAllowed: false,
    commandViaIssuanceCommitBoundaryAllowed: false,
    dispatcherViaIssuanceCommitBoundaryAllowed: false,
    queueViaIssuanceCommitBoundaryAllowed: false,
    domMutationViaIssuanceCommitBoundaryAllowed: false,
    reactRemountViaIssuanceCommitBoundaryAllowed: false,
    secondGeofeedViaIssuanceCommitBoundaryAllowed: false,
    nonNullShellViaIssuanceCommitBoundaryAllowed: false,
  });
}

export function validateFeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity(
  candidate: unknown,
): FeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_INVALID",
      "Identity contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_SCHEMA",
      "Unsupported identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.23") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_PHASE",
      "phase must be 3B.3.22",
    );
  }
  if (c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID || c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (c.expectedMountCount !== 1 || c.expectedUnmountCount !== 0 || c.expectedActiveInstanceCount !== 1 || c.expectedRendererRegistrationCount !== 0) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_COUNTS",
      "mount/unmount/instance/renderer counts must stay sealed",
    );
  }
  if (c.expectedOwner !== "legacy" || c.expectedWriter !== "legacy" || c.expectedRenderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_OWNER",
      "expected owner/writer/renderer must be legacy",
    );
  }
  for (const [key, val] of Object.entries(c)) {
    if (key.endsWith("Allowed") && val !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedHostActivationTransitionAuthorizationGrantIssuanceCommitBoundaryIdentity;
}
