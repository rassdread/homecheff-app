/**
 * Phase 3B.3.21 — activation transition authorization grant issuance pipeline identity contract.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";

export const FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity = {
  schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_SCHEMA_VERSION;
  phase: "3B.3.21";
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
  activationViaIssuancePipelineAllowed: false;
  canStartActivationAllowed: false;
  runtimeMutationViaIssuancePipelineAllowed: false;
  executorViaIssuancePipelineAllowed: false;
  schedulerViaIssuancePipelineAllowed: false;
  commitViaIssuancePipelineAllowed: false;
  graphTraversalViaIssuancePipelineAllowed: false;
  transitionExecutionViaIssuancePipelineAllowed: false;
  selectionExecutionViaIssuancePipelineAllowed: false;
  preflightExecutionViaIssuancePipelineAllowed: false;
  authorizationDecisionExecutionViaIssuancePipelineAllowed: false;
  authorizationGrantViaIssuancePipelineAllowed: false;
  authorizationApplicationViaIssuancePipelineAllowed: false;
  transitionAuthorizationViaIssuancePipelineAllowed: false;
  grantReadinessExecutionViaIssuancePipelineAllowed: false;
  issuanceDecisionExecutionViaIssuancePipelineAllowed: false;
  issuancePipelineExecutionViaIssuancePipelineAllowed: false;
  grantCreationViaIssuancePipelineAllowed: false;
  grantIssuanceViaIssuancePipelineAllowed: false;
  grantMaterializationViaIssuancePipelineAllowed: false;
  grantPersistenceViaIssuancePipelineAllowed: false;
  grantApplicationViaIssuancePipelineAllowed: false;
  grantActivationViaIssuancePipelineAllowed: false;
  grantConsumptionViaIssuancePipelineAllowed: false;
  grantRevocationViaIssuancePipelineAllowed: false;
  grantAuthorityViaIssuancePipelineAllowed: false;
  authorityCreationViaIssuancePipelineAllowed: false;
  authorityEnablementViaIssuancePipelineAllowed: false;
  authorityDelegationViaIssuancePipelineAllowed: false;
  authorityTransferViaIssuancePipelineAllowed: false;
  protocolExecutionViaIssuancePipelineAllowed: false;
  ownershipTransferViaIssuancePipelineAllowed: false;
  writerTransferViaIssuancePipelineAllowed: false;
  rendererTransferViaIssuancePipelineAllowed: false;
  tokenViaIssuancePipelineAllowed: false;
  secretViaIssuancePipelineAllowed: false;
  signatureViaIssuancePipelineAllowed: false;
  nonceViaIssuancePipelineAllowed: false;
  credentialViaIssuancePipelineAllowed: false;
  certificateViaIssuancePipelineAllowed: false;
  permitViaIssuancePipelineAllowed: false;
  callbackViaIssuancePipelineAllowed: false;
  executableHandleViaIssuancePipelineAllowed: false;
  runtimeCapabilityViaIssuancePipelineAllowed: false;
  commandViaIssuancePipelineAllowed: false;
  dispatcherViaIssuancePipelineAllowed: false;
  queueViaIssuancePipelineAllowed: false;
  domMutationViaIssuancePipelineAllowed: false;
  reactRemountViaIssuancePipelineAllowed: false;
  secondGeofeedViaIssuancePipelineAllowed: false;
  nonNullShellViaIssuancePipelineAllowed: false;
};

export function createFeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity(): FeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity {
  return validateFeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity({
    schemaVersion: FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_SCHEMA_VERSION,
    phase: "3B.3.21",
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
    activationViaIssuancePipelineAllowed: false,
    canStartActivationAllowed: false,
    runtimeMutationViaIssuancePipelineAllowed: false,
    executorViaIssuancePipelineAllowed: false,
    schedulerViaIssuancePipelineAllowed: false,
    commitViaIssuancePipelineAllowed: false,
    graphTraversalViaIssuancePipelineAllowed: false,
    transitionExecutionViaIssuancePipelineAllowed: false,
    selectionExecutionViaIssuancePipelineAllowed: false,
    preflightExecutionViaIssuancePipelineAllowed: false,
    authorizationDecisionExecutionViaIssuancePipelineAllowed: false,
    authorizationGrantViaIssuancePipelineAllowed: false,
    authorizationApplicationViaIssuancePipelineAllowed: false,
    transitionAuthorizationViaIssuancePipelineAllowed: false,
    grantReadinessExecutionViaIssuancePipelineAllowed: false,
    issuanceDecisionExecutionViaIssuancePipelineAllowed: false,
    issuancePipelineExecutionViaIssuancePipelineAllowed: false,
  issuancePlanExecutionViaIssuancePipelineAllowed: false,
    grantCreationViaIssuancePipelineAllowed: false,
    grantIssuanceViaIssuancePipelineAllowed: false,
    grantMaterializationViaIssuancePipelineAllowed: false,
    grantPersistenceViaIssuancePipelineAllowed: false,
    grantApplicationViaIssuancePipelineAllowed: false,
    grantActivationViaIssuancePipelineAllowed: false,
    grantConsumptionViaIssuancePipelineAllowed: false,
    grantRevocationViaIssuancePipelineAllowed: false,
    grantAuthorityViaIssuancePipelineAllowed: false,
    authorityCreationViaIssuancePipelineAllowed: false,
    authorityEnablementViaIssuancePipelineAllowed: false,
    authorityDelegationViaIssuancePipelineAllowed: false,
    authorityTransferViaIssuancePipelineAllowed: false,
    protocolExecutionViaIssuancePipelineAllowed: false,
    ownershipTransferViaIssuancePipelineAllowed: false,
    writerTransferViaIssuancePipelineAllowed: false,
    rendererTransferViaIssuancePipelineAllowed: false,
    tokenViaIssuancePipelineAllowed: false,
    secretViaIssuancePipelineAllowed: false,
    signatureViaIssuancePipelineAllowed: false,
    nonceViaIssuancePipelineAllowed: false,
    credentialViaIssuancePipelineAllowed: false,
    certificateViaIssuancePipelineAllowed: false,
    permitViaIssuancePipelineAllowed: false,
    callbackViaIssuancePipelineAllowed: false,
    executableHandleViaIssuancePipelineAllowed: false,
    runtimeCapabilityViaIssuancePipelineAllowed: false,
    commandViaIssuancePipelineAllowed: false,
    dispatcherViaIssuancePipelineAllowed: false,
    queueViaIssuancePipelineAllowed: false,
    domMutationViaIssuancePipelineAllowed: false,
    reactRemountViaIssuancePipelineAllowed: false,
    secondGeofeedViaIssuancePipelineAllowed: false,
    nonNullShellViaIssuancePipelineAllowed: false,
  });
}

export function validateFeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity(
  candidate: unknown,
): FeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_INVALID",
      "Identity contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_SCHEMA",
      "Unsupported identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.21") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_PHASE",
      "phase must be 3B.3.21",
    );
  }
  if (c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID || c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_IDS",
      "hostId/runtimeId must remain stable",
    );
  }
  if (c.expectedMountCount !== 1 || c.expectedUnmountCount !== 0 || c.expectedActiveInstanceCount !== 1 || c.expectedRendererRegistrationCount !== 0) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_COUNTS",
      "mount/unmount/instance/renderer counts must stay sealed",
    );
  }
  if (c.expectedOwner !== "legacy" || c.expectedWriter !== "legacy" || c.expectedRenderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_OWNER",
      "expected owner/writer/renderer must be legacy",
    );
  }
  for (const [key, val] of Object.entries(c)) {
    if (key.endsWith("Allowed") && val !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedHostActivationTransitionAuthorizationGrantIssuancePipelineIdentity;
}
