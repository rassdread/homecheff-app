/**
 * Phase 3B.3.27 — Controlled Workspace Host Activation Authorization Contract.
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
  PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
} from "./controlled-workspace-host-activation-authorization";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceHostActivationAuthorizationContract = {
  schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.27";
  previousPhase: "3B.3.26";
  widgetId: "feed.discovery";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  contractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID;
  candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  activationAuthorizationState: "AUTHORIZED_NOT_GRANTED";
  activationAuthorizationResult: "controlled-workspace-host-activation-authorized-not-granted";
  candidateSelected: true;
  candidateReady: true;
  candidateAuthorized: true;
  candidateGranted: false;
  candidateActivated: false;
  candidateExecutable: false;
  metadataAuthorizationAllowed: true;
  activationAllowed: false;
  grantIssuanceAllowed: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
  remountAllowed: false;
  secondMountAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  activationRestriction: typeof PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY;
  nextEligibleStep: "3B.3.28";
};

export function createControlledWorkspaceHostActivationAuthorizationContract(): ControlledWorkspaceHostActivationAuthorizationContract {
  return validateControlledWorkspaceHostActivationAuthorizationContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.27",
    previousPhase: "3B.3.26",
    widgetId: "feed.discovery",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    contractId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    activationAuthorizationState: "AUTHORIZED_NOT_GRANTED",
    activationAuthorizationResult:
      "controlled-workspace-host-activation-authorized-not-granted",
    candidateSelected: true,
    candidateReady: true,
    candidateAuthorized: true,
    candidateGranted: false,
    candidateActivated: false,
    candidateExecutable: false,
    metadataAuthorizationAllowed: true,
    activationAllowed: false,
    grantIssuanceAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    remountAllowed: false,
    secondMountAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    activationRestriction:
      PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY,
    nextEligibleStep: "3B.3.28",
  });
}

export function validateControlledWorkspaceHostActivationAuthorizationContract(
  candidate: unknown,
): ControlledWorkspaceHostActivationAuthorizationContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_INVALID",
      "Authorization contract must be a plain object",
    );
  }
  const c = candidate as ControlledWorkspaceHostActivationAuthorizationContract;
  if (
    c.phase !== "3B.3.27" ||
    c.previousPhase !== "3B.3.26" ||
    c.nextEligibleStep !== "3B.3.28"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_PHASE",
      "phase must be 3B.3.27 with previousPhase 3B.3.26",
    );
  }
  if (
    c.candidateAuthorized !== true ||
    c.candidateGranted !== false ||
    c.candidateActivated !== false ||
    c.activationAllowed !== false ||
    c.grantIssuanceAllowed !== false ||
    c.metadataAuthorizationAllowed !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_CONTRACT_FLAGS",
      "Authorization contract must authorize without grant or activation",
    );
  }
  return c;
}
