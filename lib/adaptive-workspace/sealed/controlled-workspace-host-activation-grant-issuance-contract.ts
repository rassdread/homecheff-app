/**
 * Phase 3B.3.28 — Controlled Workspace Host Activation Grant Issuance Contract.
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
  PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
} from "./controlled-workspace-host-activation-grant-issuance";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceHostActivationGrantIssuanceContract = {
  schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.28";
  previousPhase: "3B.3.27";
  widgetId: "feed.discovery";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  activationAuthorizationId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID;
  activationGrantId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID;
  activationGrantIssuanceId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID;
  contractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID;
  candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  grantIssuanceState: "GRANTED_NOT_ACTIVATED";
  grantIssuanceResult: "controlled-workspace-host-activation-grant-issued-not-activated";
  candidateSelected: true;
  candidateReady: true;
  candidateAuthorized: true;
  candidateGranted: true;
  candidateActivated: false;
  candidateExecutable: false;
  grantPresent: true;
  grantValid: true;
  grantImmutable: true;
  grantExecutable: false;
  metadataGrantIssuanceAllowed: true;
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
  activationRestriction: typeof PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY;
  nextEligibleStep: "3B.3.29";
};

export function createControlledWorkspaceHostActivationGrantIssuanceContract(): ControlledWorkspaceHostActivationGrantIssuanceContract {
  return validateControlledWorkspaceHostActivationGrantIssuanceContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.28",
    previousPhase: "3B.3.27",
    widgetId: "feed.discovery",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    activationAuthorizationId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ID,
    activationGrantId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ID,
    activationGrantIssuanceId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ID,
    contractId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    grantIssuanceState: "GRANTED_NOT_ACTIVATED",
    grantIssuanceResult:
      "controlled-workspace-host-activation-grant-issued-not-activated",
    candidateSelected: true,
    candidateReady: true,
    candidateAuthorized: true,
    candidateGranted: true,
    candidateActivated: false,
    candidateExecutable: false,
    grantPresent: true,
    grantValid: true,
    grantImmutable: true,
    grantExecutable: false,
    metadataGrantIssuanceAllowed: true,
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
      PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY,
    nextEligibleStep: "3B.3.29",
  });
}

export function validateControlledWorkspaceHostActivationGrantIssuanceContract(
  candidate: unknown,
): ControlledWorkspaceHostActivationGrantIssuanceContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_INVALID",
      "Grant issuance contract must be a plain object",
    );
  }
  const c = candidate as ControlledWorkspaceHostActivationGrantIssuanceContract;
  if (
    c.phase !== "3B.3.28" ||
    c.previousPhase !== "3B.3.27" ||
    c.nextEligibleStep !== "3B.3.29"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_PHASE",
      "phase must be 3B.3.28 with previousPhase 3B.3.27",
    );
  }
  if (
    c.candidateGranted !== true ||
    c.candidateActivated !== false ||
    c.grantPresent !== true ||
    c.grantExecutable !== false ||
    c.activationAllowed !== false ||
    c.grantIssuanceAllowed !== false ||
    c.metadataGrantIssuanceAllowed !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_CONTRACT_FLAGS",
      "Grant issuance contract must grant without further issuance or activation",
    );
  }
  return c;
}
