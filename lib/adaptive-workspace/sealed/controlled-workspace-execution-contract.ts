/** AW-R3 Controlled Execution contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_EXECUTION_ID,
  PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY,
  createControlledWorkspaceExecutionDescriptor,
  type ControlledWorkspaceExecutionDescriptor,
} from "./controlled-workspace-execution";

export const CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_SCHEMA_VERSION = 1 as const;

export type ControlledWorkspaceExecutionContract = Pick<
  ControlledWorkspaceExecutionDescriptor,
  | "phase"
  | "previousPhase"
  | "nextEligibleStep"
  | "title"
  | "activationControlledExecutionId"
  | "activationControlledExecutionContractId"
  | "activationLiveAuthorizationId"
  | "activationLiveAuthorizationContractId"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "activationExecutionAllowed"
  | "issuancePipelineExecutionAllowed"
  | "issuancePipelineExecutable"
  | "issuancePipelineState"
  | "issuanceTransactionState"
  | "workspaceExecutionAuthorized"
  | "geoFeedAuthorityTransferred"
  | "feedOnAuthorized"
  | "productionPromotionAuthorized"
  | "stableMountId"
  | "stableMountIdentityPreserved"
  | "workspaceRuntimeHandleId"
  | "workspaceActivationHandleId"
  | "workspaceExecutionHandleId"
> & {
  readonly schemaVersion: 1;
  readonly contractId: typeof CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID;
  readonly activationRestriction: typeof PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY;
};

export function createControlledWorkspaceExecutionContract(): ControlledWorkspaceExecutionContract {
  const d = createControlledWorkspaceExecutionDescriptor();
  return validateControlledWorkspaceExecutionContract({
    schemaVersion: CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_SCHEMA_VERSION,
    contractId: CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID,
    phase: d.phase,
    previousPhase: d.previousPhase,
    nextEligibleStep: d.nextEligibleStep,
    title: d.title,
    activationControlledExecutionId: CONTROLLED_WORKSPACE_EXECUTION_ID,
    activationControlledExecutionContractId:
      CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID,
    activationLiveAuthorizationId: d.activationLiveAuthorizationId,
    activationLiveAuthorizationContractId:
      d.activationLiveAuthorizationContractId,
    candidateActivationState: d.candidateActivationState,
    candidateActivationResult: d.candidateActivationResult,
    activationExecutionAllowed: d.activationExecutionAllowed,
    issuancePipelineExecutionAllowed: d.issuancePipelineExecutionAllowed,
    issuancePipelineExecutable: d.issuancePipelineExecutable,
    issuancePipelineState: d.issuancePipelineState,
    issuanceTransactionState: d.issuanceTransactionState,
    workspaceExecutionAuthorized: d.workspaceExecutionAuthorized,
    geoFeedAuthorityTransferred: d.geoFeedAuthorityTransferred,
    feedOnAuthorized: d.feedOnAuthorized,
    productionPromotionAuthorized: d.productionPromotionAuthorized,
    stableMountId: d.stableMountId,
    stableMountIdentityPreserved: d.stableMountIdentityPreserved,
    workspaceRuntimeHandleId: d.workspaceRuntimeHandleId,
    workspaceActivationHandleId: d.workspaceActivationHandleId,
    workspaceExecutionHandleId: d.workspaceExecutionHandleId,
    activationRestriction: PHASE_AW_R3_CONTROLLED_EXECUTION_ONLY,
  });
}

export function validateControlledWorkspaceExecutionContract(
  candidate: unknown,
): ControlledWorkspaceExecutionContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_CONTRACT_INVALID",
      "Contract must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceExecutionContract;
  if (
    c.phase !== "AW-R3" ||
    c.previousPhase !== "AW-R2" ||
    c.nextEligibleStep !== "AW-R4" ||
    c.title !== "Controlled Execution" ||
    c.contractId !== CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID ||
    c.activationControlledExecutionId !== CONTROLLED_WORKSPACE_EXECUTION_ID ||
    c.activationControlledExecutionContractId !==
      CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID ||
    c.candidateActivationState !==
      "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY" ||
    c.activationExecutionAllowed !== true ||
    c.issuancePipelineExecutionAllowed !== true ||
    c.issuancePipelineExecutable !== true ||
    c.issuancePipelineState !== "CONTROLLED_EXECUTABLE" ||
    c.issuanceTransactionState !== "CONTROLLED_EXECUTION" ||
    c.workspaceExecutionAuthorized !== true ||
    c.geoFeedAuthorityTransferred !== false ||
    c.feedOnAuthorized !== false ||
    c.productionPromotionAuthorized !== false ||
    c.stableMountIdentityPreserved !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_CONTRACT_FLAGS",
      "AW-R3 Controlled Execution contract must be exact",
    );
  }
  return c;
}
