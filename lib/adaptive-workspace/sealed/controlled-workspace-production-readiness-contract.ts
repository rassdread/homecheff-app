/** AW-R5 Production Readiness contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID,
  PHASE_AW_R5_PRODUCTION_READINESS_ONLY,
  createControlledWorkspaceProductionReadinessDescriptor,
  type ControlledWorkspaceProductionReadinessDescriptor,
} from "./controlled-workspace-production-readiness";

export const CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceProductionReadinessContract = Pick<
  ControlledWorkspaceProductionReadinessDescriptor,
  | "phase"
  | "previousPhase"
  | "nextEligibleStep"
  | "title"
  | "activationProductionReadinessId"
  | "activationProductionReadinessContractId"
  | "activationGeoFeedAuthorityTransitionId"
  | "activationGeoFeedAuthorityTransitionContractId"
  | "activationControlledExecutionId"
  | "activationControlledExecutionContractId"
  | "activationLiveAuthorizationId"
  | "activationLiveAuthorizationContractId"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "issuancePipelineState"
  | "issuanceTransactionState"
  | "owner"
  | "writer"
  | "renderer"
  | "requestAuthority"
  | "paginationAuthority"
  | "cacheAuthority"
  | "observerAuthority"
  | "lifecycleAuthority"
  | "geoFeedAuthorityTransferred"
  | "renderActivation"
  | "feedOnAuthorized"
  | "productionPromotionAuthorized"
  | "productionReadinessCertified"
  | "architectureProductionReady"
  | "releaseBlockersRemain"
  | "readyForFinalActivation"
  | "legacyAuthorityActive"
  | "targetAuthorityActive"
  | "authorityCommitBoundary"
  | "stableMountId"
  | "stableMountIdentityPreserved"
  | "requestIdentityPreserved"
  | "feedStatePreserved"
  | "geoFeedInstanceCount"
> & {
  readonly schemaVersion: 1;
  readonly contractId: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID;
  readonly activationRestriction: typeof PHASE_AW_R5_PRODUCTION_READINESS_ONLY;
};

export function createControlledWorkspaceProductionReadinessContract(): ControlledWorkspaceProductionReadinessContract {
  const d = createControlledWorkspaceProductionReadinessDescriptor();
  return validateControlledWorkspaceProductionReadinessContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_SCHEMA_VERSION,
    contractId: CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
    phase: d.phase,
    previousPhase: d.previousPhase,
    nextEligibleStep: d.nextEligibleStep,
    title: d.title,
    activationProductionReadinessId:
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID,
    activationProductionReadinessContractId:
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
    activationGeoFeedAuthorityTransitionId:
      d.activationGeoFeedAuthorityTransitionId,
    activationGeoFeedAuthorityTransitionContractId:
      d.activationGeoFeedAuthorityTransitionContractId,
    activationControlledExecutionId: d.activationControlledExecutionId,
    activationControlledExecutionContractId:
      d.activationControlledExecutionContractId,
    activationLiveAuthorizationId: d.activationLiveAuthorizationId,
    activationLiveAuthorizationContractId:
      d.activationLiveAuthorizationContractId,
    candidateActivationState: d.candidateActivationState,
    candidateActivationResult: d.candidateActivationResult,
    issuancePipelineState: d.issuancePipelineState,
    issuanceTransactionState: d.issuanceTransactionState,
    owner: d.owner,
    writer: d.writer,
    renderer: d.renderer,
    requestAuthority: d.requestAuthority,
    paginationAuthority: d.paginationAuthority,
    cacheAuthority: d.cacheAuthority,
    observerAuthority: d.observerAuthority,
    lifecycleAuthority: d.lifecycleAuthority,
    geoFeedAuthorityTransferred: d.geoFeedAuthorityTransferred,
    renderActivation: d.renderActivation,
    feedOnAuthorized: d.feedOnAuthorized,
    productionPromotionAuthorized: d.productionPromotionAuthorized,
    productionReadinessCertified: d.productionReadinessCertified,
    architectureProductionReady: d.architectureProductionReady,
    releaseBlockersRemain: d.releaseBlockersRemain,
    readyForFinalActivation: d.readyForFinalActivation,
    legacyAuthorityActive: d.legacyAuthorityActive,
    targetAuthorityActive: d.targetAuthorityActive,
    authorityCommitBoundary: d.authorityCommitBoundary,
    stableMountId: d.stableMountId,
    stableMountIdentityPreserved: d.stableMountIdentityPreserved,
    requestIdentityPreserved: d.requestIdentityPreserved,
    feedStatePreserved: d.feedStatePreserved,
    geoFeedInstanceCount: d.geoFeedInstanceCount,
    activationRestriction: PHASE_AW_R5_PRODUCTION_READINESS_ONLY,
  });
}

export function validateControlledWorkspaceProductionReadinessContract(
  candidate: unknown,
): ControlledWorkspaceProductionReadinessContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_INVALID",
      "Contract must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceProductionReadinessContract;
  if (
    c.phase !== "AW-R5" ||
    c.previousPhase !== "AW-R4" ||
    c.nextEligibleStep !== "AW-R6" ||
    c.title !== "Production Readiness" ||
    c.contractId !== CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID ||
    c.activationProductionReadinessId !==
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID ||
    c.activationProductionReadinessContractId !==
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID ||
    c.candidateActivationState !== "PRODUCTION_READY_NOT_RELEASED" ||
    c.candidateActivationResult !==
      "controlled-workspace-production-ready-feed-off" ||
    c.issuancePipelineState !== "AUTHORITY_TRANSITIONED" ||
    c.issuanceTransactionState !== "AUTHORITY_COMMITTED" ||
    c.owner !== "workspace" ||
    c.writer !== "workspace" ||
    c.renderer !== "workspace" ||
    c.requestAuthority !== "workspace" ||
    c.geoFeedAuthorityTransferred !== true ||
    c.renderActivation !== true ||
    c.feedOnAuthorized !== false ||
    c.productionPromotionAuthorized !== false ||
    c.productionReadinessCertified !== true ||
    c.architectureProductionReady !== true ||
    c.releaseBlockersRemain !== false ||
    c.readyForFinalActivation !== true ||
    c.legacyAuthorityActive !== false ||
    c.targetAuthorityActive !== true ||
    c.authorityCommitBoundary !== "COMMITTED" ||
    c.stableMountIdentityPreserved !== true ||
    c.requestIdentityPreserved !== true ||
    c.feedStatePreserved !== true ||
    c.geoFeedInstanceCount !== 1
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_FLAGS",
      "AW-R5 production readiness contract must be exact",
    );
  }
  return c;
}
