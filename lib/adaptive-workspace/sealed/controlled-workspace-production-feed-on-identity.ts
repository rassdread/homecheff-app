/** AW-R6 Production Feed ON identity chain. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID,
  CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID,
} from "./controlled-workspace-production-feed-on";
import {
  createControlledWorkspaceProductionReadinessIdentity,
  type ControlledWorkspaceProductionReadinessIdentity,
} from "./controlled-workspace-production-readiness-identity";

export const CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceProductionFeedOnIdentity = Omit<
  ControlledWorkspaceProductionReadinessIdentity,
  "phase" | "schemaVersion"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R6";
  readonly activationProductionFeedOnId: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID;
  readonly activationProductionFeedOnContractId: typeof CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID;
};

export function createControlledWorkspaceProductionFeedOnIdentity(): ControlledWorkspaceProductionFeedOnIdentity {
  return validateControlledWorkspaceProductionFeedOnIdentity(
    Object.freeze({
      ...createControlledWorkspaceProductionReadinessIdentity(),
      schemaVersion:
        CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_IDENTITY_SCHEMA_VERSION,
      phase: "AW-R6",
      activationProductionFeedOnId: CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID,
      activationProductionFeedOnContractId:
        CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID,
    }),
  );
}

export function validateControlledWorkspaceProductionFeedOnIdentity(
  candidate: unknown,
): ControlledWorkspaceProductionFeedOnIdentity {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_IDENTITY_INVALID",
      "Identity must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceProductionFeedOnIdentity;
  if (
    c.phase !== "AW-R6" ||
    c.activationProductionFeedOnId !== CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_ID ||
    c.activationProductionFeedOnContractId !==
      CONTROLLED_WORKSPACE_PRODUCTION_FEED_ON_CONTRACT_ID ||
    c.activationProductionReadinessId === undefined ||
    c.activationProductionReadinessContractId === undefined ||
    c.activationGeoFeedAuthorityTransitionId === undefined ||
    c.activationGeoFeedAuthorityTransitionContractId === undefined ||
    c.activationControlledExecutionId === undefined ||
    c.activationControlledExecutionContractId === undefined ||
    c.activationLiveAuthorizationId === undefined ||
    c.expectedOwner !== "workspace" ||
    c.expectedWriter !== "workspace" ||
    c.expectedRenderer !== "workspace" ||
    c.stableMountId !== "feed.discovery.controlled-host.stable-mount.v1"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_FEED_ON_IDENTITY_CHAIN",
      "AW-R6 identity and all predecessor tips must be exact",
    );
  }
  return c;
}
