/**
 * Phase 3B.3.24 — Controlled Workspace Host Candidate Registration Contract.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
} from "./controlled-workspace-host-candidate-registration";

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceHostCandidateRegistrationContract = {
  schemaVersion: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.24";
  previousPhase: "3B.3.23";
  widgetId: "feed.discovery";
  candidateId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID;
  registrationId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID;
  contractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_ID;
  candidateKind: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND;
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  candidateRegistrationState: "REGISTERED_NOT_SELECTED";
  candidateRegistrationResult: "controlled-workspace-host-candidate-registered-not-selected";
  candidateRegistered: true;
  candidateSelected: false;
  candidateActivated: false;
  candidateExecutable: false;
  selectionAllowed: false;
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
  activationRestriction: typeof PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY;
  nextEligibleStep: "3B.3.25";
};

export function createControlledWorkspaceHostCandidateRegistrationContract(): ControlledWorkspaceHostCandidateRegistrationContract {
  return validateControlledWorkspaceHostCandidateRegistrationContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.24",
    previousPhase: "3B.3.23",
    widgetId: "feed.discovery",
    candidateId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID,
    registrationId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID,
    contractId: CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_ID,
    candidateKind: CONTROLLED_WORKSPACE_HOST_CANDIDATE_KIND,
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    candidateRegistrationState: "REGISTERED_NOT_SELECTED",
    candidateRegistrationResult:
      "controlled-workspace-host-candidate-registered-not-selected",
    candidateRegistered: true,
    candidateSelected: false,
    candidateActivated: false,
    candidateExecutable: false,
    selectionAllowed: false,
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
      PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY,
    nextEligibleStep: "3B.3.25",
  });
}

export function validateControlledWorkspaceHostCandidateRegistrationContract(
  candidate: unknown,
): ControlledWorkspaceHostCandidateRegistrationContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_INVALID",
      "Registration contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_SCHEMA",
      "Unsupported registration contract schemaVersion",
    );
  }
  if (
    c.phase !== "3B.3.24" ||
    c.previousPhase !== "3B.3.23" ||
    c.widgetId !== "feed.discovery"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_PHASE",
      "phase must be 3B.3.24 with previousPhase 3B.3.23",
    );
  }
  if (
    c.candidateId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_ID ||
    c.registrationId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ID ||
    c.contractId !== CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_CONTRACT_ID
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_IDS",
      "candidate/registration/contract identities must be exact",
    );
  }
  if (
    c.candidateRegistrationState !== "REGISTERED_NOT_SELECTED" ||
    c.candidateRegistrationResult !==
      "controlled-workspace-host-candidate-registered-not-selected"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_RESULT",
      "Successful contract result/state mismatch",
    );
  }
  if (
    c.candidateSelected !== false ||
    c.candidateActivated !== false ||
    c.candidateExecutable !== false ||
    c.selectionAllowed !== false ||
    c.activationAllowed !== false ||
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_ACTIVATION",
      "Contract forbids selection/activation/execution",
    );
  }
  for (const key of [
    "ownershipTransferAllowed",
    "writerTransferAllowed",
    "rendererTransferAllowed",
    "remountAllowed",
    "secondMountAllowed",
    "wrapperAllowed",
    "portalAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  if (
    c.activationRestriction !==
    PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_BLOCKER",
      "activationRestriction must be PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY",
    );
  }
  if (c.nextEligibleStep !== "3B.3.25") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.25",
    );
  }
  return c as ControlledWorkspaceHostCandidateRegistrationContract;
}
