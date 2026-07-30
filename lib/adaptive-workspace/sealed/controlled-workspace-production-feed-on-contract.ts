/** AW-R6 Production Feed ON contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
  CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID,
  CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID,
  createControlledWorkspaceProductionFeedOnDescriptor,
  type ControlledWorkspaceProductionFeedOnDescriptor,
} from "./controlled-workspace-production-feed-on";

export const CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceProductionFeedOnContract = Pick<
  ControlledWorkspaceProductionFeedOnDescriptor,
  | "phase"
  | "previousPhase"
  | "nextEligibleStep"
  | "title"
  | "activationProductionFeedOnId"
  | "activationProductionFeedOnContractId"
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
  | "roadmapComplete"
  | "terminalMarker"
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
  readonly contractId: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID;
  readonly activationRestriction: typeof ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE;
};

export function createControlledWorkspaceProductionFeedOnContract(): ControlledWorkspaceProductionFeedOnContract {
  const d = createControlledWorkspaceProductionFeedOnDescriptor();
  return validateControlledWorkspaceProductionFeedOnContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_SCHEMA_VERSION,
    contractId: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID,
    phase: d.phase,
    previousPhase: d.previousPhase,
    nextEligibleStep: d.nextEligibleStep,
    title: d.title,
    activationProductionFeedOnId: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID,
    activationProductionFeedOnContractId:
      CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID,
    activationProductionReadinessId: d.activationProductionReadinessId,
    activationProductionReadinessContractId:
      d.activationProductionReadinessContractId,
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
    roadmapComplete: d.roadmapComplete,
    terminalMarker: d.terminalMarker,
    legacyAuthorityActive: d.legacyAuthorityActive,
    targetAuthorityActive: d.targetAuthorityActive,
    authorityCommitBoundary: d.authorityCommitBoundary,
    stableMountId: d.stableMountId,
    stableMountIdentityPreserved: d.stableMountIdentityPreserved,
    requestIdentityPreserved: d.requestIdentityPreserved,
    feedStatePreserved: d.feedStatePreserved,
    geoFeedInstanceCount: d.geoFeedInstanceCount,
    activationRestriction: ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE,
  });
}

export function validateControlledWorkspaceProductionFeedOnContract(
  candidate: unknown,
): ControlledWorkspaceProductionFeedOnContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_INVALID",
      "Contract must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceProductionFeedOnContract;
  if (
    c.phase !== "AW-R6" ||
    c.previousPhase !== "AW-R5" ||
    c.nextEligibleStep !== "none" ||
    c.title !== "Production Freeze & Feed ON" ||
    c.contractId !== CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID ||
    c.activationProductionFeedOnId !== CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID ||
    c.activationProductionFeedOnContractId !==
      CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID ||
    c.candidateActivationState !== "PRODUCTION_LIVE_FEED_ON" ||
    c.candidateActivationResult !==
      "controlled-workspace-production-live-feed-on" ||
    c.issuancePipelineState !== "PRODUCTION_ON" ||
    c.issuanceTransactionState !== "PRODUCTION_COMMITTED" ||
    c.owner !== "workspace" ||
    c.writer !== "workspace" ||
    c.renderer !== "workspace" ||
    c.requestAuthority !== "workspace" ||
    c.paginationAuthority !== "workspace" ||
    c.cacheAuthority !== "workspace" ||
    c.observerAuthority !== "workspace" ||
    c.lifecycleAuthority !== "workspace" ||
    c.geoFeedAuthorityTransferred !== true ||
    c.renderActivation !== true ||
    c.feedOnAuthorized !== true ||
    c.productionPromotionAuthorized !== true ||
    c.productionReadinessCertified !== true ||
    c.architectureProductionReady !== true ||
    c.releaseBlockersRemain !== false ||
    c.readyForFinalActivation !== true ||
    c.roadmapComplete !== true ||
    c.terminalMarker !== ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE ||
    c.activationRestriction !== ADAPTIVE_WORKSPACE_CONDENSED_ROADMAP_COMPLETE ||
    c.legacyAuthorityActive !== false ||
    c.targetAuthorityActive !== true ||
    c.authorityCommitBoundary !== "COMMITTED" ||
    c.stableMountId !== "feed.discovery.controlled-host.stable-mount.v1" ||
    c.stableMountIdentityPreserved !== true ||
    c.requestIdentityPreserved !== true ||
    c.feedStatePreserved !== true ||
    c.geoFeedInstanceCount !== 1
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_FLAGS",
      "AW-R6 production Feed ON contract must be exact",
    );
  }
  if (c.feedOnAuthorized !== c.productionPromotionAuthorized) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ATOMIC",
      "Feed ON and production promotion must match atomically",
    );
  }
  return c;
}
