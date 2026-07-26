/**
 * Phase 3B.3.25 — Controlled Workspace Host Candidate Selection Contract.
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
import {
  PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID,
} from "./controlled-workspace-host-candidate-selection";

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceHostCandidateSelectionContract = {
  schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.25";
  previousPhase: "3B.3.24";
  widgetId: "feed.discovery";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  selectionId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID;
  contractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID;
  candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  candidateSelectionState: "SELECTED_NOT_ACTIVATED";
  candidateSelectionResult: "controlled-workspace-host-candidate-selected-not-activated";
  candidateRegistered: true;
  candidateSelected: true;
  candidateActivated: false;
  candidateExecutable: false;
  metadataSelectionAllowed: true;
  activationAllowed: false;
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
  activationRestriction: typeof PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY;
  nextEligibleStep: "3B.3.26";
};

export function createControlledWorkspaceHostCandidateSelectionContract(): ControlledWorkspaceHostCandidateSelectionContract {
  return validateControlledWorkspaceHostCandidateSelectionContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.25",
    previousPhase: "3B.3.24",
    widgetId: "feed.discovery",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    selectionId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ID,
    contractId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    candidateSelectionState: "SELECTED_NOT_ACTIVATED",
    candidateSelectionResult:
      "controlled-workspace-host-candidate-selected-not-activated",
    candidateRegistered: true,
    candidateSelected: true,
    candidateActivated: false,
    candidateExecutable: false,
    metadataSelectionAllowed: true,
    activationAllowed: false,
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
      PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY,
    nextEligibleStep: "3B.3.26",
  });
}

export function validateControlledWorkspaceHostCandidateSelectionContract(
  candidate: unknown,
): ControlledWorkspaceHostCandidateSelectionContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_INVALID",
      "Selection contract must be a plain object",
    );
  }
  const c = candidate as ControlledWorkspaceHostCandidateSelectionContract;
  if (
    c.phase !== "3B.3.25" ||
    c.previousPhase !== "3B.3.24" ||
    c.nextEligibleStep !== "3B.3.26"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_PHASE",
      "phase must be 3B.3.25 with previousPhase 3B.3.24",
    );
  }
  if (
    c.candidateSelected !== true ||
    c.candidateActivated !== false ||
    c.activationAllowed !== false ||
    c.metadataSelectionAllowed !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_FLAGS",
      "Selection contract must select without activation",
    );
  }
  if (c.activationAllowed === true) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_SELECTION_CONTRACT_ACTIVATION",
      "activationAllowed must remain false",
    );
  }
  return c;
}
