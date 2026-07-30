/**
 * Phase 3B.3.26 — Controlled Workspace Host Activation Readiness Contract.
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
  PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
  CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
} from "./controlled-workspace-host-activation-readiness";

export const CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceHostActivationReadinessContract = {
  schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.26";
  previousPhase: "3B.3.25";
  widgetId: "feed.discovery";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  activationReadinessId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID;
  contractId: typeof CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID;
  candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  activationReadinessState: "READY_NOT_AUTHORIZED";
  activationReadinessResult: "controlled-workspace-host-activation-ready-not-authorized";
  candidateSelected: true;
  candidateReady: true;
  candidateAuthorized: false;
  candidateGranted: false;
  candidateActivated: false;
  candidateExecutable: false;
  metadataReadinessAllowed: true;
  activationAllowed: false;
  authorizationAllowed: false;
  grantAllowed: false;
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
  activationRestriction: typeof PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY;
  nextEligibleStep: "3B.3.27";
};

export function createControlledWorkspaceHostActivationReadinessContract(): ControlledWorkspaceHostActivationReadinessContract {
  return validateControlledWorkspaceHostActivationReadinessContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.26",
    previousPhase: "3B.3.25",
    widgetId: "feed.discovery",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    activationReadinessId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ID,
    contractId: CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    activationReadinessState: "READY_NOT_AUTHORIZED",
    activationReadinessResult:
      "controlled-workspace-host-activation-ready-not-authorized",
    candidateSelected: true,
    candidateReady: true,
    candidateAuthorized: false,
    candidateGranted: false,
    candidateActivated: false,
    candidateExecutable: false,
    metadataReadinessAllowed: true,
    activationAllowed: false,
    authorizationAllowed: false,
    grantAllowed: false,
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
      PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY,
    nextEligibleStep: "3B.3.27",
  });
}

export function validateControlledWorkspaceHostActivationReadinessContract(
  candidate: unknown,
): ControlledWorkspaceHostActivationReadinessContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_INVALID",
      "Activation readiness contract must be a plain object",
    );
  }
  const c = candidate as ControlledWorkspaceHostActivationReadinessContract;
  if (
    c.phase !== "3B.3.26" ||
    c.previousPhase !== "3B.3.25" ||
    c.nextEligibleStep !== "3B.3.27"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_PHASE",
      "phase must be 3B.3.26 with previousPhase 3B.3.25",
    );
  }
  if (
    c.candidateReady !== true ||
    c.candidateAuthorized !== false ||
    c.candidateActivated !== false ||
    c.activationAllowed !== false ||
    c.metadataReadinessAllowed !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_FLAGS",
      "Readiness contract must mark ready without authorization",
    );
  }
  if (c.activationAllowed === true || c.authorizationAllowed === true) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_ACTIVATION_READINESS_CONTRACT_ACTIVATION",
      "activationAllowed and authorizationAllowed must remain false",
    );
  }
  return c;
}
