/** AW-R3 Controlled Execution identity chain. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_EXECUTION_ID,
} from "./controlled-workspace-execution";
import {
  createControlledWorkspaceLiveAuthorizationIdentity,
  type ControlledWorkspaceLiveAuthorizationIdentity,
} from "./controlled-workspace-live-authorization-identity";

export const CONTROLLED_WORKSPACE_EXECUTION_IDENTITY_SCHEMA_VERSION = 1 as const;

export type ControlledWorkspaceExecutionIdentity = Omit<
  ControlledWorkspaceLiveAuthorizationIdentity,
  "phase" | "schemaVersion"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R3";
  readonly activationControlledExecutionId: typeof CONTROLLED_WORKSPACE_EXECUTION_ID;
  readonly activationControlledExecutionContractId: typeof CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID;
};

export function createControlledWorkspaceExecutionIdentity(): ControlledWorkspaceExecutionIdentity {
  return validateControlledWorkspaceExecutionIdentity(
    Object.freeze({
      ...createControlledWorkspaceLiveAuthorizationIdentity(),
      schemaVersion: CONTROLLED_WORKSPACE_EXECUTION_IDENTITY_SCHEMA_VERSION,
      phase: "AW-R3",
      activationControlledExecutionId: CONTROLLED_WORKSPACE_EXECUTION_ID,
      activationControlledExecutionContractId:
        CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID,
    }),
  );
}

export function validateControlledWorkspaceExecutionIdentity(
  candidate: unknown,
): ControlledWorkspaceExecutionIdentity {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_IDENTITY_INVALID",
      "Identity must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceExecutionIdentity;
  if (
    c.phase !== "AW-R3" ||
    c.activationControlledExecutionId !== CONTROLLED_WORKSPACE_EXECUTION_ID ||
    c.activationControlledExecutionContractId !==
      CONTROLLED_WORKSPACE_EXECUTION_CONTRACT_ID ||
    c.activationLiveAuthorizationId === undefined ||
    c.activationLiveAuthorizationContractId === undefined ||
    c.expectedOwner !== "legacy" ||
    c.expectedWriter !== "legacy" ||
    c.expectedRenderer !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_CONTROLLED_EXECUTION_IDENTITY_CHAIN",
      "AW-R3 identity and all predecessor tips must be exact",
    );
  }
  return c;
}
