/** AW-R2 controlled LIVE authorization contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID,
  PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY,
} from "./controlled-workspace-live-authorization";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
} from "./controlled-workspace-host-candidate-pre-activation-seal";

export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceLiveAuthorizationContract = {
  readonly schemaVersion: 1;
  readonly phase: "AW-R2";
  readonly previousPhase: "AW-R1";
  readonly nextEligibleStep: "AW-R3";
  readonly title: "Controlled LIVE Authorization";
  readonly contractId: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID;
  readonly activationLiveAuthorizationId: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID;
  readonly activationLiveAuthorizationContractId: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID;
  readonly activationCandidatePreActivationSealId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID;
  readonly activationCandidatePreActivationSealContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID;
  readonly candidateActivationState: "LIVE_AUTHORIZED_NOT_EXECUTABLE";
  readonly candidateActivationResult: "controlled-workspace-live-authorized-not-executable";
  readonly candidateActivationStarted: true;
  readonly candidateActivationExecuted: true;
  readonly candidateActivationCompleted: true;
  readonly activationExecutionAllowed: true;
  readonly issuancePipelineExecutable: false;
  readonly issuancePipelineExecutionAllowed: false;
  readonly rollbackTargetAllowed: false;
  readonly rollbackMode: "metadata-gate-only";
  readonly rollbackPreservesGeoFeedIdentity: true;
  readonly activationRestriction: typeof PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY;
};

export function createControlledWorkspaceLiveAuthorizationContract(): ControlledWorkspaceLiveAuthorizationContract {
  return validateControlledWorkspaceLiveAuthorizationContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_SCHEMA_VERSION,
    phase: "AW-R2",
    previousPhase: "AW-R1",
    nextEligibleStep: "AW-R3",
    title: "Controlled LIVE Authorization",
    contractId:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
    activationLiveAuthorizationId:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID,
    activationLiveAuthorizationContractId:
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
    activationCandidatePreActivationSealId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
    activationCandidatePreActivationSealContractId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
    candidateActivationState: "LIVE_AUTHORIZED_NOT_EXECUTABLE",
    candidateActivationResult:
      "controlled-workspace-live-authorized-not-executable",
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationExecutionAllowed: true,
    issuancePipelineExecutable: false,
    issuancePipelineExecutionAllowed: false,
    rollbackTargetAllowed: false,
    rollbackMode: "metadata-gate-only",
    rollbackPreservesGeoFeedIdentity: true,
    activationRestriction: PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY,
  });
}

export function validateControlledWorkspaceLiveAuthorizationContract(
  candidate: unknown,
): ControlledWorkspaceLiveAuthorizationContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_INVALID",
      "Contract must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceLiveAuthorizationContract;
  if (
    c.phase !== "AW-R2" ||
    c.previousPhase !== "AW-R1" ||
    c.nextEligibleStep !== "AW-R3" ||
    c.candidateActivationStarted !== true ||
    c.candidateActivationExecuted !== true ||
    c.candidateActivationCompleted !== true ||
    c.candidateActivationState !== "LIVE_AUTHORIZED_NOT_EXECUTABLE" ||
    c.candidateActivationResult !==
      "controlled-workspace-live-authorized-not-executable" ||
    c.activationExecutionAllowed !== true ||
    c.issuancePipelineExecutable !== false ||
    c.issuancePipelineExecutionAllowed !== false ||
    c.rollbackTargetAllowed !== false ||
    c.rollbackMode !== "metadata-gate-only" ||
    c.rollbackPreservesGeoFeedIdentity !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_FLAGS",
      "AW-R2 must authorize Allowed without making execution executable",
    );
  }
  return c;
}
