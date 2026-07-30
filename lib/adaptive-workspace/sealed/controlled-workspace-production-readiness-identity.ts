/** AW-R5 Production Readiness identity chain. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
  CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID,
} from "./controlled-workspace-production-readiness";
import {
  createControlledWorkspaceGeoFeedAuthorityTransitionIdentity,
  type ControlledWorkspaceGeoFeedAuthorityTransitionIdentity,
} from "./controlled-workspace-geofeed-authority-transition-identity";

export const CONTROLLED_WORKSPACE_PRODUCTION_READINESS_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceProductionReadinessIdentity = Omit<
  ControlledWorkspaceGeoFeedAuthorityTransitionIdentity,
  "phase" | "schemaVersion"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R5";
  readonly activationProductionReadinessId: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID;
  readonly activationProductionReadinessContractId: typeof CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID;
};

export function createControlledWorkspaceProductionReadinessIdentity(): ControlledWorkspaceProductionReadinessIdentity {
  return validateControlledWorkspaceProductionReadinessIdentity(
    Object.freeze({
      ...createControlledWorkspaceGeoFeedAuthorityTransitionIdentity(),
      schemaVersion:
        CONTROLLED_WORKSPACE_PRODUCTION_READINESS_IDENTITY_SCHEMA_VERSION,
      phase: "AW-R5",
      activationProductionReadinessId:
        CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID,
      activationProductionReadinessContractId:
        CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID,
    }),
  );
}

export function validateControlledWorkspaceProductionReadinessIdentity(
  candidate: unknown,
): ControlledWorkspaceProductionReadinessIdentity {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_PRODUCTION_READINESS_IDENTITY_INVALID",
      "Identity must be an object",
    );
  }
  const c = candidate as ControlledWorkspaceProductionReadinessIdentity;
  if (
    c.phase !== "AW-R5" ||
    c.activationProductionReadinessId !==
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_ID ||
    c.activationProductionReadinessContractId !==
      CONTROLLED_WORKSPACE_PRODUCTION_READINESS_CONTRACT_ID ||
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
      "FEED_WORKSPACE_PRODUCTION_READINESS_IDENTITY_CHAIN",
      "AW-R5 identity and all predecessor tips must be exact",
    );
  }
  return c;
}
