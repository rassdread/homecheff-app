/** AW-R1 pre-activation seal identity contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
  CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
} from "./controlled-workspace-host-candidate-pre-activation-seal";
import {
  createFeedWorkspaceHostCandidateExecutionStartedIdentity,
  type FeedWorkspaceHostCandidateExecutionStartedIdentity,
} from "./feed-workspace-host-candidate-execution-started-identity";

export const FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type FeedWorkspaceHostCandidatePreActivationSealIdentity = Omit<
  FeedWorkspaceHostCandidateExecutionStartedIdentity,
  "phase" | "schemaVersion"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R1";
  readonly activationCandidatePreActivationSealId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID;
  readonly activationCandidatePreActivationSealContractId: typeof CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID;
};

export function createFeedWorkspaceHostCandidatePreActivationSealIdentity(): FeedWorkspaceHostCandidatePreActivationSealIdentity {
  const predecessor =
    createFeedWorkspaceHostCandidateExecutionStartedIdentity();
  return validateFeedWorkspaceHostCandidatePreActivationSealIdentity(
    Object.freeze({
      ...predecessor,
      schemaVersion:
        FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_IDENTITY_SCHEMA_VERSION,
      phase: "AW-R1",
      activationCandidatePreActivationSealId:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID,
      activationCandidatePreActivationSealContractId:
        CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID,
    }),
  );
}

export function validateFeedWorkspaceHostCandidatePreActivationSealIdentity(
  candidate: unknown,
): FeedWorkspaceHostCandidatePreActivationSealIdentity {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_IDENTITY_INVALID",
      "Identity must be an object",
    );
  }
  const c = candidate as FeedWorkspaceHostCandidatePreActivationSealIdentity;
  if (
    c.phase !== "AW-R1" ||
    c.activationCandidatePreActivationSealId !==
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_ID ||
    c.activationCandidatePreActivationSealContractId !==
      CONTROLLED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_CONTRACT_ID ||
    c.activationCandidateExecutionStartedId === undefined ||
    c.activationCandidateExecutionStartedContractId === undefined ||
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_HOST_CANDIDATE_PRE_ACTIVATION_SEAL_IDENTITY_CHAIN",
      "AW-R1 identity and prior tips must be exact",
    );
  }
  return c;
}
