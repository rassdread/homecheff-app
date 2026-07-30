/**
 * Phase 3B.3.3 — Controlled Host Registry (metadata only).
 * Registers the existing legacy feed mount as a future Controlled Host.
 * No React instances, no runtime objects, no ownership mutation.
 */

import { HardContractViolation } from "../schema/validation-error";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { createControlledFeedHostShadowPlacement } from "./controlled-feed-host-shadow-placement";

export const CONTROLLED_HOST_REGISTRY_SCHEMA_VERSION = 1 as const;

export const FEED_DISCOVERY_CONTROLLED_HOST_ID =
  "feed.discovery.controlled-host" as const;

/** Stable runtime identity token — not a React fiber / instance pointer. */
export const FEED_DISCOVERY_STABLE_RUNTIME_ID =
  "feed.discovery.legacy-single-mount.v1" as const;

export const PHASE_3B3_3_HOST_REGISTRATION_ONLY =
  "PHASE_3B3_3_HOST_REGISTRATION_ONLY" as const;

export type ControlledHostDescriptor = {
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  componentType: "legacy-feed-mount";
  registrationState: "registered";
  owner: "legacy";
  writer: "legacy";
  renderer: "legacy";
  activationState: "dormant";
  placementState: "shadow-registered";
  identityState: "stable-single-mount";
  rollbackState: "prepared-not-active";
  hostActivation: false;
  renderActivation: false;
  shadowActivation: true;
  nextEligibleStep: "3B.3.4";
  activationBlocker: typeof PHASE_3B3_3_HOST_REGISTRATION_ONLY;
};

export type ControlledHostRegistry = {
  schemaVersion: typeof CONTROLLED_HOST_REGISTRY_SCHEMA_VERSION;
  phase: "3B.3.3";
  widgetId: "feed.discovery";
  hostCount: 1;
  hosts: readonly [ControlledHostDescriptor];
  containsRuntimeObjects: false;
  containsReactInstances: false;
  mutatesFeedLifecycle: false;
  registryOwner: "adaptive-workspace";
  runtimeOwner: "legacy";
};

export function createFeedDiscoveryControlledHostDescriptor(): ControlledHostDescriptor {
  return {
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    componentType: "legacy-feed-mount",
    registrationState: "registered",
    owner: "legacy",
    writer: "legacy",
    renderer: "legacy",
    activationState: "dormant",
    placementState: "shadow-registered",
    identityState: "stable-single-mount",
    rollbackState: "prepared-not-active",
    hostActivation: false,
    renderActivation: false,
    shadowActivation: true,
    nextEligibleStep: "3B.3.4",
    activationBlocker: PHASE_3B3_3_HOST_REGISTRATION_ONLY,
  };
}

export function createControlledHostRegistry(): ControlledHostRegistry {
  // Touch related factories for fail-closed consistency.
  void createControlledFeedHostContract();
  void createFeedHostRollbackContract();
  void createControlledFeedHostShadowPlacement();
  return validateControlledHostRegistry({
    schemaVersion: CONTROLLED_HOST_REGISTRY_SCHEMA_VERSION,
    phase: "3B.3.3",
    widgetId: "feed.discovery",
    hostCount: 1,
    hosts: [createFeedDiscoveryControlledHostDescriptor()],
    containsRuntimeObjects: false,
    containsReactInstances: false,
    mutatesFeedLifecycle: false,
    registryOwner: "adaptive-workspace",
    runtimeOwner: "legacy",
  });
}

export function readControlledHostRegistry(): ControlledHostRegistry {
  return createControlledHostRegistry();
}

export function validateControlledHostDescriptor(
  candidate: unknown,
): ControlledHostDescriptor {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_INVALID",
      "Host descriptor must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID) {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_ID",
      "hostId must be feed.discovery.controlled-host",
    );
  }
  if (c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID) {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_RUNTIME",
      "runtimeId must be the stable legacy-single-mount token",
    );
  }
  if (c.componentType !== "legacy-feed-mount") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_COMPONENT",
      "componentType must be legacy-feed-mount",
    );
  }
  if (c.registrationState !== "registered") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_REGISTRATION",
      "registrationState must be registered",
    );
  }
  if (c.owner !== "legacy" || c.writer !== "legacy" || c.renderer !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_OWNERSHIP",
      "owner, writer, and renderer must remain legacy",
    );
  }
  if (c.activationState !== "dormant") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_ACTIVATION_STATE",
      "activationState must be dormant",
    );
  }
  if (c.placementState !== "shadow-registered") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_PLACEMENT",
      "placementState must remain shadow-registered",
    );
  }
  if (c.identityState !== "stable-single-mount") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_IDENTITY",
      "identityState must be stable-single-mount",
    );
  }
  if (c.rollbackState !== "prepared-not-active") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_ROLLBACK",
      "rollbackState must be prepared-not-active",
    );
  }
  if (c.hostActivation !== false || c.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_FLAGS",
      "hostActivation and renderActivation must be false",
    );
  }
  if (c.nextEligibleStep !== "3B.3.4") {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_NEXT",
      "nextEligibleStep must be 3B.3.4",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_3_HOST_REGISTRATION_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_DESCRIPTOR_BLOCKER",
      "activationBlocker must be PHASE_3B3_3_HOST_REGISTRATION_ONLY",
    );
  }
  return c as ControlledHostDescriptor;
}

export function validateControlledHostRegistry(
  candidate: unknown,
): ControlledHostRegistry {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRY_INVALID",
      "Registry must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_HOST_REGISTRY_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRY_SCHEMA",
      "Unsupported registry schemaVersion",
    );
  }
  if (c.phase !== "3B.3.3" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRY_PHASE",
      "phase must be 3B.3.3 and widgetId feed.discovery",
    );
  }
  if (c.hostCount !== 1 || !Array.isArray(c.hosts) || c.hosts.length !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRY_COUNT",
      "registry must contain exactly one host",
    );
  }
  const host = validateControlledHostDescriptor(c.hosts[0]);
  if (
    c.containsRuntimeObjects !== false ||
    c.containsReactInstances !== false ||
    c.mutatesFeedLifecycle !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRY_PURITY",
      "registry must not contain runtime/React objects or mutate feed lifecycle",
    );
  }
  if (c.registryOwner !== "adaptive-workspace" || c.runtimeOwner !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRY_OWNERS",
      "registryOwner must be adaptive-workspace; runtimeOwner must be legacy",
    );
  }
  return {
    schemaVersion: CONTROLLED_HOST_REGISTRY_SCHEMA_VERSION,
    phase: "3B.3.3",
    widgetId: "feed.discovery",
    hostCount: 1,
    hosts: [host],
    containsRuntimeObjects: false,
    containsReactInstances: false,
    mutatesFeedLifecycle: false,
    registryOwner: "adaptive-workspace",
    runtimeOwner: "legacy",
  };
}
