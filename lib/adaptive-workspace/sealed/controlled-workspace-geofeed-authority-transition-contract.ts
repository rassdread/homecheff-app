/** AW-R4 GeoFeed Authority Transition contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID,
  PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY,
  createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor,
  type ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor,
} from "./controlled-workspace-geofeed-authority-transition";

export const CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceGeoFeedAuthorityTransitionContract = Pick<
  ControlledWorkspaceGeoFeedAuthorityTransitionDescriptor,
  | "phase"
  | "previousPhase"
  | "nextEligibleStep"
  | "title"
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
  readonly contractId: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID;
  readonly activationRestriction: typeof PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY;
};

export function createControlledWorkspaceGeoFeedAuthorityTransitionContract(): ControlledWorkspaceGeoFeedAuthorityTransitionContract {
  const d = createControlledWorkspaceGeoFeedAuthorityTransitionDescriptor();
  return validateControlledWorkspaceGeoFeedAuthorityTransitionContract({
    schemaVersion:
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_SCHEMA_VERSION,
    contractId: CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID,
    phase: d.phase,
    previousPhase: d.previousPhase,
    nextEligibleStep: d.nextEligibleStep,
    title: d.title,
    activationGeoFeedAuthorityTransitionId:
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID,
    activationGeoFeedAuthorityTransitionContractId:
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID,
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
    legacyAuthorityActive: d.legacyAuthorityActive,
    targetAuthorityActive: d.targetAuthorityActive,
    authorityCommitBoundary: d.authorityCommitBoundary,
    stableMountId: d.stableMountId,
    stableMountIdentityPreserved: d.stableMountIdentityPreserved,
    requestIdentityPreserved: d.requestIdentityPreserved,
    feedStatePreserved: d.feedStatePreserved,
    geoFeedInstanceCount: d.geoFeedInstanceCount,
    activationRestriction: PHASE_AW_R4_GEOFEED_AUTHORITY_TRANSITION_ONLY,
  });
}

export function validateControlledWorkspaceGeoFeedAuthorityTransitionContract(
  candidate: unknown,
): ControlledWorkspaceGeoFeedAuthorityTransitionContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_CONTRACT_INVALID",
      "Contract must be an object",
    );
  }
  const c =
    candidate as ControlledWorkspaceGeoFeedAuthorityTransitionContract;
  if (
    c.phase !== "AW-R4" ||
    c.previousPhase !== "AW-R3" ||
    c.nextEligibleStep !== "AW-R5" ||
    c.title !== "GeoFeed Authority Transition" ||
    c.contractId !==
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID ||
    c.activationGeoFeedAuthorityTransitionId !==
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID ||
    c.activationGeoFeedAuthorityTransitionContractId !==
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID ||
    c.candidateActivationState !==
      "GEOFEED_AUTHORITY_TRANSITIONED_NOT_PRODUCTION_ON" ||
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
    c.legacyAuthorityActive !== false ||
    c.targetAuthorityActive !== true ||
    c.authorityCommitBoundary !== "COMMITTED" ||
    c.stableMountIdentityPreserved !== true ||
    c.requestIdentityPreserved !== true ||
    c.feedStatePreserved !== true ||
    c.geoFeedInstanceCount !== 1
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_CONTRACT_FLAGS",
      "AW-R4 authority transition contract must be exact",
    );
  }
  return c;
}
