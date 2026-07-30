/**
 * Phase 3B.3.19 — activation transition authorization grant issuance decision identity contract.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";

export const FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity =
  {
    schemaVersion: typeof FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_SCHEMA_VERSION;
    phase: "3B.3.19";
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
    activationViaIssuanceDecisionAllowed: false;
    canStartActivationAllowed: false;
    runtimeMutationViaIssuanceDecisionAllowed: false;
    executorViaIssuanceDecisionAllowed: false;
    schedulerViaIssuanceDecisionAllowed: false;
    commitViaIssuanceDecisionAllowed: false;
    graphTraversalViaIssuanceDecisionAllowed: false;
    transitionExecutionViaIssuanceDecisionAllowed: false;
    selectionExecutionViaIssuanceDecisionAllowed: false;
    preflightExecutionViaIssuanceDecisionAllowed: false;
    authorizationDecisionExecutionViaIssuanceDecisionAllowed: false;
    authorizationGrantViaIssuanceDecisionAllowed: false;
    authorizationApplicationViaIssuanceDecisionAllowed: false;
    transitionAuthorizationViaIssuanceDecisionAllowed: false;
    grantReadinessExecutionViaIssuanceDecisionAllowed: false;
    issuanceDecisionExecutionViaIssuanceDecisionAllowed: false;
    grantCreationViaIssuanceDecisionAllowed: false;
    grantIssuanceViaIssuanceDecisionAllowed: false;
    grantMaterializationViaIssuanceDecisionAllowed: false;
    grantPersistenceViaIssuanceDecisionAllowed: false;
    grantApplicationViaIssuanceDecisionAllowed: false;
    grantActivationViaIssuanceDecisionAllowed: false;
    grantConsumptionViaIssuanceDecisionAllowed: false;
    grantRevocationViaIssuanceDecisionAllowed: false;
    grantAuthorityViaIssuanceDecisionAllowed: false;
    authorityCreationViaIssuanceDecisionAllowed: false;
    authorityEnablementViaIssuanceDecisionAllowed: false;
    authorityDelegationViaIssuanceDecisionAllowed: false;
    authorityTransferViaIssuanceDecisionAllowed: false;
    protocolExecutionViaIssuanceDecisionAllowed: false;
    ownershipTransferViaIssuanceDecisionAllowed: false;
    writerTransferViaIssuanceDecisionAllowed: false;
    rendererTransferViaIssuanceDecisionAllowed: false;
    tokenViaIssuanceDecisionAllowed: false;
    secretViaIssuanceDecisionAllowed: false;
    signatureViaIssuanceDecisionAllowed: false;
    nonceViaIssuanceDecisionAllowed: false;
    credentialViaIssuanceDecisionAllowed: false;
    certificateViaIssuanceDecisionAllowed: false;
    permitViaIssuanceDecisionAllowed: false;
    callbackViaIssuanceDecisionAllowed: false;
    executableHandleViaIssuanceDecisionAllowed: false;
    runtimeCapabilityViaIssuanceDecisionAllowed: false;
    domMutationViaIssuanceDecisionAllowed: false;
    reactRemountViaIssuanceDecisionAllowed: false;
    secondGeofeedViaIssuanceDecisionAllowed: false;
  };

export function createFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity(): FeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity {
  return validateFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity(
    {
      schemaVersion:
        FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_SCHEMA_VERSION,
      phase: "3B.3.19",
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
      activationViaIssuanceDecisionAllowed: false,
      canStartActivationAllowed: false,
      runtimeMutationViaIssuanceDecisionAllowed: false,
      executorViaIssuanceDecisionAllowed: false,
      schedulerViaIssuanceDecisionAllowed: false,
      commitViaIssuanceDecisionAllowed: false,
      graphTraversalViaIssuanceDecisionAllowed: false,
      transitionExecutionViaIssuanceDecisionAllowed: false,
      selectionExecutionViaIssuanceDecisionAllowed: false,
      preflightExecutionViaIssuanceDecisionAllowed: false,
      authorizationDecisionExecutionViaIssuanceDecisionAllowed: false,
      authorizationGrantViaIssuanceDecisionAllowed: false,
      authorizationApplicationViaIssuanceDecisionAllowed: false,
      transitionAuthorizationViaIssuanceDecisionAllowed: false,
      grantReadinessExecutionViaIssuanceDecisionAllowed: false,
      issuanceDecisionExecutionViaIssuanceDecisionAllowed: false,
      grantCreationViaIssuanceDecisionAllowed: false,
      grantIssuanceViaIssuanceDecisionAllowed: false,
      grantMaterializationViaIssuanceDecisionAllowed: false,
      grantPersistenceViaIssuanceDecisionAllowed: false,
      grantApplicationViaIssuanceDecisionAllowed: false,
      grantActivationViaIssuanceDecisionAllowed: false,
      grantConsumptionViaIssuanceDecisionAllowed: false,
      grantRevocationViaIssuanceDecisionAllowed: false,
      grantAuthorityViaIssuanceDecisionAllowed: false,
      authorityCreationViaIssuanceDecisionAllowed: false,
      authorityEnablementViaIssuanceDecisionAllowed: false,
      authorityDelegationViaIssuanceDecisionAllowed: false,
      authorityTransferViaIssuanceDecisionAllowed: false,
      protocolExecutionViaIssuanceDecisionAllowed: false,
      ownershipTransferViaIssuanceDecisionAllowed: false,
      writerTransferViaIssuanceDecisionAllowed: false,
      rendererTransferViaIssuanceDecisionAllowed: false,
      tokenViaIssuanceDecisionAllowed: false,
      secretViaIssuanceDecisionAllowed: false,
      signatureViaIssuanceDecisionAllowed: false,
      nonceViaIssuanceDecisionAllowed: false,
      credentialViaIssuanceDecisionAllowed: false,
      certificateViaIssuanceDecisionAllowed: false,
      permitViaIssuanceDecisionAllowed: false,
      callbackViaIssuanceDecisionAllowed: false,
      executableHandleViaIssuanceDecisionAllowed: false,
      runtimeCapabilityViaIssuanceDecisionAllowed: false,
      domMutationViaIssuanceDecisionAllowed: false,
      reactRemountViaIssuanceDecisionAllowed: false,
      secondGeofeedViaIssuanceDecisionAllowed: false,
    },
  );
}

export function validateFeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity(
  candidate: unknown,
): FeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_INVALID",
      "Identity contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_SCHEMA",
      "Unsupported identity schemaVersion",
    );
  }
  if (c.phase !== "3B.3.19") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_PHASE",
      "phase must be 3B.3.19",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_IDS",
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
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_COUNTS",
      "mount/unmount/instance/renderer counts must stay sealed",
    );
  }
  if (
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_OWNER",
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
    "activationViaIssuanceDecisionAllowed",
    "canStartActivationAllowed",
    "runtimeMutationViaIssuanceDecisionAllowed",
    "executorViaIssuanceDecisionAllowed",
    "schedulerViaIssuanceDecisionAllowed",
    "commitViaIssuanceDecisionAllowed",
    "graphTraversalViaIssuanceDecisionAllowed",
    "transitionExecutionViaIssuanceDecisionAllowed",
    "selectionExecutionViaIssuanceDecisionAllowed",
    "preflightExecutionViaIssuanceDecisionAllowed",
    "authorizationDecisionExecutionViaIssuanceDecisionAllowed",
    "authorizationGrantViaIssuanceDecisionAllowed",
    "authorizationApplicationViaIssuanceDecisionAllowed",
    "transitionAuthorizationViaIssuanceDecisionAllowed",
    "grantReadinessExecutionViaIssuanceDecisionAllowed",
    "issuanceDecisionExecutionViaIssuanceDecisionAllowed",
    "grantCreationViaIssuanceDecisionAllowed",
    "grantIssuanceViaIssuanceDecisionAllowed",
    "grantMaterializationViaIssuanceDecisionAllowed",
    "grantPersistenceViaIssuanceDecisionAllowed",
    "grantApplicationViaIssuanceDecisionAllowed",
    "grantActivationViaIssuanceDecisionAllowed",
    "grantConsumptionViaIssuanceDecisionAllowed",
    "grantRevocationViaIssuanceDecisionAllowed",
    "grantAuthorityViaIssuanceDecisionAllowed",
    "authorityCreationViaIssuanceDecisionAllowed",
    "authorityEnablementViaIssuanceDecisionAllowed",
    "authorityDelegationViaIssuanceDecisionAllowed",
    "authorityTransferViaIssuanceDecisionAllowed",
    "protocolExecutionViaIssuanceDecisionAllowed",
    "ownershipTransferViaIssuanceDecisionAllowed",
    "writerTransferViaIssuanceDecisionAllowed",
    "rendererTransferViaIssuanceDecisionAllowed",
    "tokenViaIssuanceDecisionAllowed",
    "secretViaIssuanceDecisionAllowed",
    "signatureViaIssuanceDecisionAllowed",
    "nonceViaIssuanceDecisionAllowed",
    "credentialViaIssuanceDecisionAllowed",
    "certificateViaIssuanceDecisionAllowed",
    "permitViaIssuanceDecisionAllowed",
    "callbackViaIssuanceDecisionAllowed",
    "executableHandleViaIssuanceDecisionAllowed",
    "runtimeCapabilityViaIssuanceDecisionAllowed",
    "domMutationViaIssuanceDecisionAllowed",
    "reactRemountViaIssuanceDecisionAllowed",
    "secondGeofeedViaIssuanceDecisionAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_IDENTITY_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  return c as FeedHostActivationTransitionAuthorizationGrantIssuanceDecisionIdentity;
}
