/** AW-R4 GeoFeed Authority Transition identity chain. */
import { HardContractViolation } from "../schema/validation-error";
import {
  CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID,
  CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID,
} from "./controlled-workspace-geofeed-authority-transition";
import {
  createControlledWorkspaceExecutionIdentity,
  type ControlledWorkspaceExecutionIdentity,
} from "./controlled-workspace-execution-identity";

export const CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_IDENTITY_SCHEMA_VERSION =
  1 as const;

export type ControlledWorkspaceGeoFeedAuthorityTransitionIdentity = Omit<
  ControlledWorkspaceExecutionIdentity,
  "phase" | "schemaVersion" | "expectedOwner" | "expectedWriter" | "expectedRenderer"
> & {
  readonly schemaVersion: 1;
  readonly phase: "AW-R4";
  readonly activationGeoFeedAuthorityTransitionId: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID;
  readonly activationGeoFeedAuthorityTransitionContractId: typeof CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID;
  readonly expectedOwner: "workspace";
  readonly expectedWriter: "workspace";
  readonly expectedRenderer: "workspace";
  readonly stableMountId: "feed.discovery.controlled-host.stable-mount.v1";
};

export function createControlledWorkspaceGeoFeedAuthorityTransitionIdentity(): ControlledWorkspaceGeoFeedAuthorityTransitionIdentity {
  return validateControlledWorkspaceGeoFeedAuthorityTransitionIdentity(
    Object.freeze({
      ...createControlledWorkspaceExecutionIdentity(),
      schemaVersion:
        CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_IDENTITY_SCHEMA_VERSION,
      phase: "AW-R4",
      activationGeoFeedAuthorityTransitionId:
        CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID,
      activationGeoFeedAuthorityTransitionContractId:
        CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID,
      expectedOwner: "workspace",
      expectedWriter: "workspace",
      expectedRenderer: "workspace",
      stableMountId: "feed.discovery.controlled-host.stable-mount.v1",
    }),
  );
}

export function validateControlledWorkspaceGeoFeedAuthorityTransitionIdentity(
  candidate: unknown,
): ControlledWorkspaceGeoFeedAuthorityTransitionIdentity {
  if (!candidate || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_IDENTITY_INVALID",
      "Identity must be an object",
    );
  }
  const c =
    candidate as ControlledWorkspaceGeoFeedAuthorityTransitionIdentity;
  if (
    c.phase !== "AW-R4" ||
    c.activationGeoFeedAuthorityTransitionId !==
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_ID ||
    c.activationGeoFeedAuthorityTransitionContractId !==
      CONTROLLED_WORKSPACE_GEOFEED_AUTHORITY_TRANSITION_CONTRACT_ID ||
    c.activationControlledExecutionId === undefined ||
    c.activationControlledExecutionContractId === undefined ||
    c.activationLiveAuthorizationId === undefined ||
    c.expectedOwner !== "workspace" ||
    c.expectedWriter !== "workspace" ||
    c.expectedRenderer !== "workspace" ||
    c.stableMountId !== "feed.discovery.controlled-host.stable-mount.v1"
  ) {
    throw new HardContractViolation(
      "FEED_WORKSPACE_GEOFEED_AUTHORITY_IDENTITY_CHAIN",
      "AW-R4 identity and all predecessor tips must be exact",
    );
  }
  return c;
}
