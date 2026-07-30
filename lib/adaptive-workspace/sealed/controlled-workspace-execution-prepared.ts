/** AW-R3 prepared/freeze-for-AW-R4 contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledWorkspaceExecutionDescriptor,
  type ControlledWorkspaceExecutionDescriptor,
} from "./controlled-workspace-execution";

export const CONTROLLED_WORKSPACE_EXECUTION_PREPARED_SCHEMA_VERSION = 1 as const;

export type ControlledWorkspaceExecutionPreparedContract = Pick<
  ControlledWorkspaceExecutionDescriptor,
  | "phase"
  | "previousPhase"
  | "nextEligibleStep"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "activationExecutionAllowed"
  | "issuancePipelineState"
  | "issuancePipelineExecutable"
  | "issuancePipelineExecutionAllowed"
  | "issuanceTransactionState"
  | "workspaceVisible"
  | "workspaceHostMounted"
  | "workspaceCandidateRendered"
  | "workspaceReactInstancePresent"
  | "runtimeCapabilityPresent"
  | "runtimeHostInstancePresent"
  | "activationHandlePresent"
  | "executionHandlePresent"
  | "owner"
  | "writer"
  | "renderer"
  | "mountCount"
  | "unmountCount"
  | "geoFeedRenderCount"
  | "stableMountId"
  | "stableMountIdentityPreserved"
  | "workspaceExecutionAuthorized"
  | "geoFeedAuthorityTransferred"
  | "feedOnAuthorized"
  | "productionPromotionAuthorized"
  | "workspaceRuntimeHandleId"
  | "workspaceActivationHandleId"
  | "workspaceExecutionHandleId"
  | "rollbackTargetPhase"
  | "rollbackMode"
  | "rollbackPreservesGeoFeedIdentity"
  | "rollbackRestoresExecutable"
  | "rollbackRestoresPipelineState"
  | "rollbackRestoresTransactionState"
  | "rollbackRestoresWorkspaceAbsent"
  | "rollbackRestoresRuntimeAbsent"
> & {
  readonly schemaVersion: 1;
  readonly status: "controlled-workspace-execution-prepared";
  readonly browserProof: "pass";
  readonly existing20Invariants: "pass";
  readonly evidenceCommit: string;
  readonly evidenceArtifactPath: string;
};

export function createControlledWorkspaceExecutionPreparedContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
}): ControlledWorkspaceExecutionPreparedContract {
  const d = createControlledWorkspaceExecutionDescriptor();
  return validateControlledWorkspaceExecutionPreparedContract(
    Object.freeze({
      schemaVersion: CONTROLLED_WORKSPACE_EXECUTION_PREPARED_SCHEMA_VERSION,
      status: "controlled-workspace-execution-prepared",
      phase: d.phase,
      previousPhase: d.previousPhase,
      nextEligibleStep: d.nextEligibleStep,
      candidateActivationState: d.candidateActivationState,
      candidateActivationResult: d.candidateActivationResult,
      activationExecutionAllowed: d.activationExecutionAllowed,
      issuancePipelineState: d.issuancePipelineState,
      issuancePipelineExecutable: d.issuancePipelineExecutable,
      issuancePipelineExecutionAllowed: d.issuancePipelineExecutionAllowed,
      issuanceTransactionState: d.issuanceTransactionState,
      workspaceVisible: d.workspaceVisible,
      workspaceHostMounted: d.workspaceHostMounted,
      workspaceCandidateRendered: d.workspaceCandidateRendered,
      workspaceReactInstancePresent: d.workspaceReactInstancePresent,
      runtimeCapabilityPresent: d.runtimeCapabilityPresent,
      runtimeHostInstancePresent: d.runtimeHostInstancePresent,
      activationHandlePresent: d.activationHandlePresent,
      executionHandlePresent: d.executionHandlePresent,
      owner: d.owner,
      writer: d.writer,
      renderer: d.renderer,
      mountCount: d.mountCount,
      unmountCount: d.unmountCount,
      geoFeedRenderCount: d.geoFeedRenderCount,
      stableMountId: d.stableMountId,
      stableMountIdentityPreserved: d.stableMountIdentityPreserved,
      workspaceExecutionAuthorized: d.workspaceExecutionAuthorized,
      geoFeedAuthorityTransferred: d.geoFeedAuthorityTransferred,
      feedOnAuthorized: d.feedOnAuthorized,
      productionPromotionAuthorized: d.productionPromotionAuthorized,
      workspaceRuntimeHandleId: d.workspaceRuntimeHandleId,
      workspaceActivationHandleId: d.workspaceActivationHandleId,
      workspaceExecutionHandleId: d.workspaceExecutionHandleId,
      rollbackTargetPhase: d.rollbackTargetPhase,
      rollbackMode: d.rollbackMode,
      rollbackPreservesGeoFeedIdentity: d.rollbackPreservesGeoFeedIdentity,
      rollbackRestoresExecutable: d.rollbackRestoresExecutable,
      rollbackRestoresPipelineState: d.rollbackRestoresPipelineState,
      rollbackRestoresTransactionState: d.rollbackRestoresTransactionState,
      rollbackRestoresWorkspaceAbsent: d.rollbackRestoresWorkspaceAbsent,
      rollbackRestoresRuntimeAbsent: d.rollbackRestoresRuntimeAbsent,
      browserProof: "pass",
      existing20Invariants: "pass",
      evidenceCommit: args.evidenceCommit,
      evidenceArtifactPath: args.evidenceArtifactPath,
    }),
  );
}

export function validateControlledWorkspaceExecutionPreparedContract(
  candidate: unknown,
): ControlledWorkspaceExecutionPreparedContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_PREPARED_INVALID",
      "Prepared contract must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceExecutionPreparedContract;
  if (
    c.phase !== "AW-R3" ||
    c.previousPhase !== "AW-R2" ||
    c.nextEligibleStep !== "AW-R4" ||
    c.candidateActivationState !==
      "CONTROLLED_EXECUTION_WITH_LEGACY_GEOFEED_AUTHORITY" ||
    c.activationExecutionAllowed !== true ||
    c.issuancePipelineExecutable !== true ||
    c.issuancePipelineExecutionAllowed !== true ||
    c.issuancePipelineState !== "CONTROLLED_EXECUTABLE" ||
    c.issuanceTransactionState !== "CONTROLLED_EXECUTION" ||
    c.workspaceVisible !== true ||
    c.workspaceHostMounted !== true ||
    c.workspaceCandidateRendered !== true ||
    c.workspaceReactInstancePresent !== true ||
    c.runtimeCapabilityPresent !== true ||
    c.runtimeHostInstancePresent !== true ||
    c.activationHandlePresent !== true ||
    c.executionHandlePresent !== true ||
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.mountCount !== 1 ||
    c.geoFeedRenderCount !== 1 ||
    c.unmountCount !== 0 ||
    c.geoFeedAuthorityTransferred !== false ||
    c.feedOnAuthorized !== false ||
    c.productionPromotionAuthorized !== false ||
    c.rollbackTargetPhase !== "AW-R2" ||
    c.rollbackRestoresExecutable !== false ||
    c.rollbackRestoresWorkspaceAbsent !== true ||
    c.rollbackRestoresRuntimeAbsent !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_PREPARED_FLAGS",
      "Prepared AW-R3 state must preserve the complete capability boundary",
    );
  }
  return c;
}
