/** AW-R1 prepared/freeze-for-AW-R2 contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  createControlledWorkspaceHostCandidatePreActivationSealDescriptor,
  type ControlledWorkspaceHostCandidatePreActivationSealDescriptor,
} from "./controlled-workspace-host-candidate-pre-activation-seal";

export const FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_PREPARED_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostCandidatePreActivationSealPreparedContract =
  Pick<
    ControlledWorkspaceHostCandidatePreActivationSealDescriptor,
    | "phase"
    | "previousPhase"
    | "nextEligibleStep"
    | "candidateActivationState"
    | "candidateActivationResult"
    | "candidateActivationStarted"
    | "candidateActivationExecuted"
    | "candidateActivationCompleted"
    | "issuancePipelineState"
    | "issuancePipelineExecutable"
    | "issuancePipelineExecutionAllowed"
    | "issuanceTransactionState"
    | "owner"
    | "writer"
    | "renderer"
    | "mountCount"
    | "unmountCount"
    | "geoFeedRenderCount"
  > & {
    readonly schemaVersion: 1;
    readonly status: "controlled-workspace-host-candidate-pre-activation-seal-prepared";
    readonly browserProof: "pass";
    readonly existing20Invariants: "pass";
    readonly evidenceCommit: string;
    readonly evidenceArtifactPath: string;
  };

export function createFeedWorkspaceHostCandidatePreActivationSealPreparedContract(
  args: { evidenceCommit: string; evidenceArtifactPath: string },
): FeedWorkspaceHostCandidatePreActivationSealPreparedContract {
  const d = createControlledWorkspaceHostCandidatePreActivationSealDescriptor();
  return validateFeedWorkspaceHostCandidatePreActivationSealPreparedContract(
    Object.freeze({
      schemaVersion:
        FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_PREPARED_SCHEMA_VERSION,
      status:
        "controlled-workspace-host-candidate-pre-activation-seal-prepared",
      phase: d.phase,
      previousPhase: d.previousPhase,
      nextEligibleStep: d.nextEligibleStep,
      candidateActivationState: d.candidateActivationState,
      candidateActivationResult: d.candidateActivationResult,
      candidateActivationStarted: d.candidateActivationStarted,
      candidateActivationExecuted: d.candidateActivationExecuted,
      candidateActivationCompleted: d.candidateActivationCompleted,
      issuancePipelineState: d.issuancePipelineState,
      issuancePipelineExecutable: d.issuancePipelineExecutable,
      issuancePipelineExecutionAllowed: d.issuancePipelineExecutionAllowed,
      issuanceTransactionState: d.issuanceTransactionState,
      owner: d.owner,
      writer: d.writer,
      renderer: d.renderer,
      mountCount: d.mountCount,
      unmountCount: d.unmountCount,
      geoFeedRenderCount: d.geoFeedRenderCount,
      browserProof: "pass",
      existing20Invariants: "pass",
      evidenceCommit: args.evidenceCommit,
      evidenceArtifactPath: args.evidenceArtifactPath,
    }),
  );
}

export function validateFeedWorkspaceHostCandidatePreActivationSealPreparedContract(
  candidate: unknown,
): FeedWorkspaceHostCandidatePreActivationSealPreparedContract {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_PREPARED_INVALID",
      "Prepared contract must be an object",
    );
  }
  const c =
    candidate as FeedWorkspaceHostCandidatePreActivationSealPreparedContract;
  if (
    c.phase !== "AW-R1" ||
    c.previousPhase !== "3B.3.47" ||
    c.nextEligibleStep !== "AW-R2" ||
    c.candidateActivationStarted !== true ||
    c.candidateActivationExecuted !== true ||
    c.candidateActivationCompleted !== true ||
    c.issuancePipelineState !== "NON_EXECUTABLE" ||
    c.issuancePipelineExecutable !== false ||
    c.issuancePipelineExecutionAllowed !== false ||
    c.issuanceTransactionState !== "OPENED" ||
    c.owner !== "legacy" ||
    c.writer !== "legacy" ||
    c.renderer !== "legacy" ||
    c.mountCount !== 1 ||
    c.geoFeedRenderCount !== 1 ||
    c.unmountCount !== 0
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_PREPARED_FLAGS",
      "Prepared AW-R1 state must preserve sealed non-LIVE invariants",
    );
  }
  return c;
}
