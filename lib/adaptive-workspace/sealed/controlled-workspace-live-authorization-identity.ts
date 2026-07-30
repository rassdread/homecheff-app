/** AW-R2 controlled LIVE authorization identity contract. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID,
} from "./controlled-workspace-live-authorization";
import {
  createFeedWorkspaceHostCandidatePreActivationSealIdentity,
  type FeedWorkspaceHostCandidatePreActivationSealIdentity,
} from "./feed-workspace-host-candidate-pre-activation-seal-identity";

export const CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceLiveAuthorizationIdentity = Omit<
  FeedWorkspaceHostCandidatePreActivationSealIdentity,
  "phase" | "schemaVersion"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R2";
  readonly activationLiveAuthorizationId: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID;
  readonly activationLiveAuthorizationContractId: typeof CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID;
};

export function createControlledWorkspaceLiveAuthorizationIdentity(): ControlledWorkspaceLiveAuthorizationIdentity {
  return validateControlledWorkspaceLiveAuthorizationIdentity(
    Object.freeze({
      ...createFeedWorkspaceHostCandidatePreActivationSealIdentity(),
      schemaVersion:
        CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_IDENTITY_SCHEMA_VERSION,
      phase: "AW-R2",
      activationLiveAuthorizationId:
        CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID,
      activationLiveAuthorizationContractId:
        CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID,
    }),
  );
}

export function validateControlledWorkspaceLiveAuthorizationIdentity(
  candidate: unknown,
): ControlledWorkspaceLiveAuthorizationIdentity {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_IDENTITY_INVALID",
      "Identity must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceLiveAuthorizationIdentity;
  if (
    c.phase !== "AW-R2" ||
    c.activationLiveAuthorizationId !==
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_ID ||
    c.activationLiveAuthorizationContractId !==
      CONTROLLED_WORKSPACE_LIVE_AUTHORIZATION_CONTRACT_ID ||
    c.activationCandidatePreActivationSealId === undefined ||
    c.activationCandidatePreActivationSealContractId === undefined ||
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_LIVE_AUTHORIZATION_IDENTITY_CHAIN",
      "AW-R2 identity and AW-R1 seal tips must be exact",
    );
  }
  return c;
}
