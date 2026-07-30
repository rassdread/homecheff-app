/** AW-R2 prepared/freeze-for-AW-R3 contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledWorkspaceLiveAuthorizationDescriptor,
  type ControlledWorkspaceLiveAuthorizationDescriptor,
} from "./controlled-workspace-live-authorization";

export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_PREPARED_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceLiveAuthorizationPreparedContract = Pick<
  ControlledWorkspaceLiveAuthorizationDescriptor,
  | "phase"
  | "previousPhase"
  | "nextEligibleStep"
  | "candidateActivationState"
  | "candidateActivationResult"
  | "candidateActivationStarted"
  | "candidateActivationExecuted"
  | "candidateActivationCompleted"
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
  | "owner"
  | "writer"
  | "renderer"
  | "mountCount"
  | "unmountCount"
  | "geoFeedRenderCount"
  | "rollbackTargetAllowed"
  | "rollbackMode"
  | "rollbackPreservesGeoFeedIdentity"
> & {
  readonly schemaVersion: 1;
  readonly status: "controlled-workspace-live-authorization-prepared";
  readonly browserProof: "pass";
  readonly existing20Invariants: "pass";
  readonly evidenceCommit: string;
  readonly evidenceArtifactPath: string;
};

export function createControlledWorkspaceLiveAuthorizationPreparedContract(
  args: { evidenceCommit: string; evidenceArtifactPath: string },
): ControlledWorkspaceLiveAuthorizationPreparedContract {
  const d = createControlledWorkspaceLiveAuthorizationDescriptor();
  return validateControlledWorkspaceLiveAuthorizationPreparedContract(
    Object.freeze({
      schemaVersion:
        CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_PREPARED_SCHEMA_VERSION,
      status: "controlled-workspace-live-authorization-prepared",
      phase: d.phase,
      previousPhase: d.previousPhase,
      nextEligibleStep: d.nextEligibleStep,
      candidateActivationState: d.candidateActivationState,
      candidateActivationResult: d.candidateActivationResult,
      candidateActivationStarted: d.candidateActivationStarted,
      candidateActivationExecuted: d.candidateActivationExecuted,
      candidateActivationCompleted: d.candidateActivationCompleted,
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
      owner: d.owner,
      writer: d.writer,
      renderer: d.renderer,
      mountCount: d.mountCount,
      unmountCount: d.unmountCount,
      geoFeedRenderCount: d.geoFeedRenderCount,
      rollbackTargetAllowed: d.rollbackTargetAllowed,
      rollbackMode: d.rollbackMode,
      rollbackPreservesGeoFeedIdentity: d.rollbackPreservesGeoFeedIdentity,
      browserProof: "pass",
      existing20Invariants: "pass",
      evidenceCommit: args.evidenceCommit,
      evidenceArtifactPath: args.evidenceArtifactPath,
    }),
  );
}

export function validateControlledWorkspaceLiveAuthorizationPreparedContract(
  candidate: unknown,
): ControlledWorkspaceLiveAuthorizationPreparedContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_PREPARED_INVALID",
      "Prepared contract must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceLiveAuthorizationPreparedContract;
  if (
    c.phase !== "AW-R2" ||
    c.previousPhase !== "AW-R1" ||
    c.nextEligibleStep !== "AW-R3" ||
    c.candidateActivationState !== "LIVE_AUTHORIZED_NOT_EXECUTABLE" ||
    c.candidateActivationResult !==
      "controlled-workspace-live-authorized-not-executable" ||
    c.candidateActivationStarted !== true ||
    c.candidateActivationExecuted !== true ||
    c.candidateActivationCompleted !== true ||
    c.activationExecutionAllowed !== true ||
    c.issuancePipelineState !== "NON_EXECUTABLE" ||
    c.issuancePipelineExecutable !== false ||
    c.issuancePipelineExecutionAllowed !== false ||
    c.issuanceTransactionState !== "OPENED" ||
    c.workspaceVisible !== false ||
    c.workspaceHostMounted !== false ||
    c.workspaceCandidateRendered !== false ||
    c.workspaceReactInstancePresent !== false ||
    c.runtimeCapabilityPresent !== false ||
    c.runtimeHostInstancePresent !== false ||
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.mountCount !== 1 ||
    c.geoFeedRenderCount !== 1 ||
    c.unmountCount !== 0 ||
    c.rollbackTargetAllowed !== false ||
    c.rollbackMode !== "metadata-gate-only" ||
    c.rollbackPreservesGeoFeedIdentity !== true
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_PREPARED_FLAGS",
      "Prepared AW-R2 state must authorize Allowed only",
    );
  }
  return c;
}
