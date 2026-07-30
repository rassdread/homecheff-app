/** AW-R1 pre-activation seal contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
  PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY,
} from "./controlled-workspace-host-candidate-pre-activation-seal";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ID,
} from "./controlled-workspace-host-candidate-execution-started";

export const CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceHostCandidatePreActivationSealContract = {
  readonly schemaVersion: 1;
  readonly phase: "AW-R1";
  readonly previousPhase: "3B.3.47";
  readonly nextEligibleStep: "AW-R2";
  readonly title: "Controlled Workspace Host Candidate Pre-Activation Seal";
  readonly contractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID;
  readonly activationCandidatePreActivationSealId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID;
  readonly activationCandidatePreActivationSealContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID;
  readonly activationCandidateExecutionStartedId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ID;
  readonly activationCandidateExecutionStartedContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_CONTRACT_ID;
  readonly candidateActivationState: "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE";
  readonly candidateActivationResult: "controlled-workspace-host-candidate-pre-activation-sealed-not-live";
  readonly candidateActivationStarted: true;
  readonly candidateActivationExecuted: true;
  readonly candidateActivationCompleted: true;
  readonly activationAllowed: false;
  readonly issuancePipelineExecutable: false;
  readonly activationRestriction: typeof PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY;
};

export function createControlledWorkspaceHostCandidatePreActivationSealContract(): ControlledWorkspaceHostCandidatePreActivationSealContract {
  return validateControlledWorkspaceHostCandidatePreActivationSealContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_SCHEMA_VERSION,
    phase: "AW-R1",
    previousPhase: "3B.3.47",
    nextEligibleStep: "AW-R2",
    title: "Controlled Workspace Host Candidate Pre-Activation Seal",
    contractId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
    activationCandidatePreActivationSealId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
    activationCandidatePreActivationSealContractId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
    activationCandidateExecutionStartedId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ID,
    activationCandidateExecutionStartedContractId:
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_CONTRACT_ID,
    candidateActivationState: "CANDIDATE_PRE_ACTIVATION_SEALED_NOT_LIVE",
    candidateActivationResult:
      "controlled-workspace-host-candidate-pre-activation-sealed-not-live",
    candidateActivationStarted: true,
    candidateActivationExecuted: true,
    candidateActivationCompleted: true,
    activationAllowed: false,
    issuancePipelineExecutable: false,
    activationRestriction: PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY,
  });
}

export function validateControlledWorkspaceHostCandidatePreActivationSealContract(
  candidate: unknown,
): ControlledWorkspaceHostCandidatePreActivationSealContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_INVALID",
      "Contract must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceHostCandidatePreActivationSealContract;
  if (
    c.phase !== "AW-R1" ||
    c.previousPhase !== "3B.3.47" ||
    c.nextEligibleStep !== "AW-R2" ||
    c.candidateActivationStarted !== true ||
    c.candidateActivationExecuted !== true ||
    c.candidateActivationCompleted !== true ||
    c.activationAllowed !== false ||
    c.issuancePipelineExecutable !== false
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_FLAGS",
      "AW-R1 seal contract must be exact and not LIVE",
    );
  }
  return c;
}
