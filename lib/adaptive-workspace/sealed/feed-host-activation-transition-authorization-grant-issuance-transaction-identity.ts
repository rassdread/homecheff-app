/**
 * Phase 3B.3.22 — activation transition authorization grant issuance transaction identity contract.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";

export const FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.22";
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
  activationViaIssuanceTransactionAllowed: false;
  canStartActivationAllowed: false;
  runtimeMutationViaIssuanceTransactionAllowed: false;
  executorViaIssuanceTransactionAllowed: false;
  schedulerViaIssuanceTransactionAllowed: false;
  commitViaIssuanceTransactionAllowed: false;
  graphTraversalViaIssuanceTransactionAllowed: false;
  transitionExecutionViaIssuanceTransactionAllowed: false;
  selectionExecutionViaIssuanceTransactionAllowed: false;
  preflightExecutionViaIssuanceTransactionAllowed: false;
  authorizationDecisionExecutionViaIssuanceTransactionAllowed: false;
  authorizationGrantViaIssuanceTransactionAllowed: false;
  authorizationApplicationViaIssuanceTransactionAllowed: false;
  transitionAuthorizationViaIssuanceTransactionAllowed: false;
  grantReadinessExecutionViaIssuanceTransactionAllowed: false;
  issuanceDecisionExecutionViaIssuanceTransactionAllowed: false;
  issuanceTransactionExecutionViaIssuanceTransactionAllowed: false;
  grantCreationViaIssuanceTransactionAllowed: false;
  grantIssuanceViaIssuanceTransactionAllowed: false;
  grantMaterializationViaIssuanceTransactionAllowed: false;
  grantPersistenceViaIssuanceTransactionAllowed: false;
  grantApplicationViaIssuanceTransactionAllowed: false;
  grantActivationViaIssuanceTransactionAllowed: false;
  grantConsumptionViaIssuanceTransactionAllowed: false;
  grantRevocationViaIssuanceTransactionAllowed: false;
  grantAuthorityViaIssuanceTransactionAllowed: false;
  authorityCreationViaIssuanceTransactionAllowed: false;
  authorityEnablementViaIssuanceTransactionAllowed: false;
  authorityDelegationViaIssuanceTransactionAllowed: false;
  authorityTransferViaIssuanceTransactionAllowed: false;
  protocolExecutionViaIssuanceTransactionAllowed: false;
  ownershipTransferViaIssuanceTransactionAllowed: false;
  writerTransferViaIssuanceTransactionAllowed: false;
  rendererTransferViaIssuanceTransactionAllowed: false;
  tokenViaIssuanceTransactionAllowed: false;
  secretViaIssuanceTransactionAllowed: false;
  signatureViaIssuanceTransactionAllowed: false;
  nonceViaIssuanceTransactionAllowed: false;
  credentialViaIssuanceTransactionAllowed: false;
  certificateViaIssuanceTransactionAllowed: false;
  permitViaIssuanceTransactionAllowed: false;
  callbackViaIssuanceTransactionAllowed: false;
  executableHandleViaIssuanceTransactionAllowed: false;
  runtimeCapabilityViaIssuanceTransactionAllowed: false;
  commandViaIssuanceTransactionAllowed: false;
  dispatcherViaIssuanceTransactionAllowed: false;
  queueViaIssuanceTransactionAllowed: false;
  domMutationViaIssuanceTransactionAllowed: false;
  reactRemountViaIssuanceTransactionAllowed: false;
  secondGeofeedViaIssuanceTransactionAllowed: false;
  nonNullShellViaIssuanceTransactionAllowed: false;
};

export function createFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity(): FeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity {
  return validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity({
    schemaVersion: FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.22",
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
    activationViaIssuanceTransactionAllowed: false,
    canStartActivationAllowed: false,
    runtimeMutationViaIssuanceTransactionAllowed: false,
    executorViaIssuanceTransactionAllowed: false,
    schedulerViaIssuanceTransactionAllowed: false,
    commitViaIssuanceTransactionAllowed: false,
    graphTraversalViaIssuanceTransactionAllowed: false,
    transitionExecutionViaIssuanceTransactionAllowed: false,
    selectionExecutionViaIssuanceTransactionAllowed: false,
    preflightExecutionViaIssuanceTransactionAllowed: false,
    authorizationDecisionExecutionViaIssuanceTransactionAllowed: false,
    authorizationGrantViaIssuanceTransactionAllowed: false,
    authorizationApplicationViaIssuanceTransactionAllowed: false,
    transitionAuthorizationViaIssuanceTransactionAllowed: false,
    grantReadinessExecutionViaIssuanceTransactionAllowed: false,
    issuanceDecisionExecutionViaIssuanceTransactionAllowed: false,
    issuanceTransactionExecutionViaIssuanceTransactionAllowed: false,
  issuancePlanExecutionViaIssuanceTransactionAllowed: false,
    grantCreationViaIssuanceTransactionAllowed: false,
    grantIssuanceViaIssuanceTransactionAllowed: false,
    grantMaterializationViaIssuanceTransactionAllowed: false,
    grantPersistenceViaIssuanceTransactionAllowed: false,
    grantApplicationViaIssuanceTransactionAllowed: false,
    grantActivationViaIssuanceTransactionAllowed: false,
    grantConsumptionViaIssuanceTransactionAllowed: false,
    grantRevocationViaIssuanceTransactionAllowed: false,
    grantAuthorityViaIssuanceTransactionAllowed: false,
    authorityCreationViaIssuanceTransactionAllowed: false,
    authorityEnablementViaIssuanceTransactionAllowed: false,
    authorityDelegationViaIssuanceTransactionAllowed: false,
    authorityTransferViaIssuanceTransactionAllowed: false,
    protocolExecutionViaIssuanceTransactionAllowed: false,
    ownershipTransferViaIssuanceTransactionAllowed: false,
    writerTransferViaIssuanceTransactionAllowed: false,
    rendererTransferViaIssuanceTransactionAllowed: false,
    tokenViaIssuanceTransactionAllowed: false,
    secretViaIssuanceTransactionAllowed: false,
    signatureViaIssuanceTransactionAllowed: false,
    nonceViaIssuanceTransactionAllowed: false,
    credentialViaIssuanceTransactionAllowed: false,
    certificateViaIssuanceTransactionAllowed: false,
    permitViaIssuanceTransactionAllowed: false,
    callbackViaIssuanceTransactionAllowed: false,
    executableHandleViaIssuanceTransactionAllowed: false,
    runtimeCapabilityViaIssuanceTransactionAllowed: false,
    commandViaIssuanceTransactionAllowed: false,
    dispatcherViaIssuanceTransactionAllowed: false,
    queueViaIssuanceTransactionAllowed: false,
    domMutationViaIssuanceTransactionAllowed: false,
    reactRemountViaIssuanceTransactionAllowed: false,
    secondGeofeedViaIssuanceTransactionAllowed: false,
    nonNullShellViaIssuanceTransactionAllowed: false,
  });
}

export function validateFeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity(
  candidate: unknown,
): FeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_INVALID",
      "Identity contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_SCHEMA",
      "Unsupported identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.22") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_PHASE",
      "phase must be 3B.3.22",
    );
  }
  if (c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID || c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (c.expectedMountCount !== 1 || c.expectedUnmountCount !== 0 || c.expectedActiveInstanceCount !== 1 || c.expectedRendererRegistrationCount !== 0) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_COUNTS",
      "mount/unmount/instance/renderer counts must stay sealed",
    );
  }
  if (c.expectedOwner !== "legacy" || c.expectedWriter !== "legacy" || c.expectedRenderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_OWNER",
      "expected owner/writer/renderer must be legacy",
    );
  }
  for (const [key, val] of Object.entries(c)) {
    if (key.endsWith("Allowed") && val !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedHostActivationTransitionAuthorizationGrantIssuanceTransactionIdentity;
}
