/**
 * Phase 3B.3.2 — Controlled Host Shadow Placement contract.
 * Declares registration/positioning of the existing legacy feed mount as host-candidate.
 * Does not activate host/render ownership. No React/DOM/Feed imports.
 */

import { HardContractViolation } from "../schema/validation-error";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";

export const CONTROLLED_FEED_HOST_SHADOW_PLACEMENT_SCHEMA_VERSION = 1 as const;

export const PHASE_3B3_2_SHADOW_PLACEMENT_ONLY =
  "PHASE_3B3_2_SHADOW_PLACEMENT_ONLY" as const;

export type ControlledFeedHostShadowPlacement = {
  schemaVersion: typeof CONTROLLED_FEED_HOST_SHADOW_PLACEMENT_SCHEMA_VERSION;
  phase: "3B.3.2";
  widgetId: "feed.discovery";
  placementState: "shadow-registered";
  placementMode: "sibling-after-legacy-mount";
  placementStrategy: "reuse-same-instance-without-remount";
  identityStrategy: "preserve-existing-react-identity";
  hostActivation: false;
  renderActivation: false;
  shadowActivation: true;
  activeRenderOwner: "legacy";
  activeWriter: "legacy";
  remountPolicy: "forbidden";
  wrapperPolicy: "forbidden";
  portalPolicy: "forbidden";
  secondMountPolicy: "forbidden";
  childPolicy: "no-child-while-dormant";
  DOMPolicy: "zero-visible-dom-delta";
  requestBoundary: "owned-by-feed";
  observerBoundary: "owned-by-feed";
  scrollBoundary: "owned-by-feed";
  cacheBoundary: "owned-by-feed";
  registrationVisibleInMetadata: true;
  rollbackReadiness: "prepared-not-active";
  rollbackTarget: "legacy";
  nextEligibleStep: "3B.3.3";
  activationBlocker: typeof PHASE_3B3_2_SHADOW_PLACEMENT_ONLY;
};

export function createControlledFeedHostShadowPlacement(): ControlledFeedHostShadowPlacement {
  // Keep host + rollback factories fail-closed and consistent.
  void createControlledFeedHostContract();
  void createFeedHostRollbackContract();
  return validateControlledFeedHostShadowPlacement({
    schemaVersion: CONTROLLED_FEED_HOST_SHADOW_PLACEMENT_SCHEMA_VERSION,
    phase: "3B.3.2",
    widgetId: "feed.discovery",
    placementState: "shadow-registered",
    placementMode: "sibling-after-legacy-mount",
    placementStrategy: "reuse-same-instance-without-remount",
    identityStrategy: "preserve-existing-react-identity",
    hostActivation: false,
    renderActivation: false,
    shadowActivation: true,
    activeRenderOwner: "legacy",
    activeWriter: "legacy",
    remountPolicy: "forbidden",
    wrapperPolicy: "forbidden",
    portalPolicy: "forbidden",
    secondMountPolicy: "forbidden",
    childPolicy: "no-child-while-dormant",
    DOMPolicy: "zero-visible-dom-delta",
    requestBoundary: "owned-by-feed",
    observerBoundary: "owned-by-feed",
    scrollBoundary: "owned-by-feed",
    cacheBoundary: "owned-by-feed",
    registrationVisibleInMetadata: true,
    rollbackReadiness: "prepared-not-active",
    rollbackTarget: "legacy",
    nextEligibleStep: "3B.3.3",
    activationBlocker: PHASE_3B3_2_SHADOW_PLACEMENT_ONLY,
  });
}

export function validateControlledFeedHostShadowPlacement(
  candidate: unknown,
): ControlledFeedHostShadowPlacement {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_INVALID",
      "Shadow placement must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_FEED_HOST_SHADOW_PLACEMENT_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_SCHEMA",
      "Unsupported shadow placement schemaVersion",
    );
  }
  if (c.phase !== "3B.3.2" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_PHASE",
      "phase must be 3B.3.2 and widgetId feed.discovery",
    );
  }
  if (c.placementState !== "shadow-registered") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_STATE",
      "placementState must be shadow-registered",
    );
  }
  if (c.placementMode !== "sibling-after-legacy-mount") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_MODE",
      "placementMode must be sibling-after-legacy-mount",
    );
  }
  if (c.placementStrategy !== "reuse-same-instance-without-remount") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_STRATEGY",
      "placementStrategy must reuse same instance without remount",
    );
  }
  if (c.identityStrategy !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_IDENTITY",
      "identityStrategy must preserve existing React identity",
    );
  }
  if (c.hostActivation !== false || c.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_ACTIVATION",
      "hostActivation and renderActivation must remain false",
    );
  }
  if (c.activeRenderOwner !== "legacy" || c.activeWriter !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_OWNER",
      "render owner and writer must remain legacy",
    );
  }
  for (const [key, expected] of [
    ["remountPolicy", "forbidden"],
    ["wrapperPolicy", "forbidden"],
    ["portalPolicy", "forbidden"],
    ["secondMountPolicy", "forbidden"],
    ["childPolicy", "no-child-while-dormant"],
    ["DOMPolicy", "zero-visible-dom-delta"],
  ] as const) {
    if (c[key] !== expected) {
      throw new HardContractViolation(
        "FEED_HOST_SHADOW_PLACEMENT_POLICY",
        `${key} must be ${expected}`,
      );
    }
  }
  for (const b of [
    "requestBoundary",
    "observerBoundary",
    "scrollBoundary",
    "cacheBoundary",
  ] as const) {
    if (c[b] !== "owned-by-feed") {
      throw new HardContractViolation(
        "FEED_HOST_SHADOW_PLACEMENT_BOUNDARY",
        `${b} must be owned-by-feed`,
      );
    }
  }
  if (c.registrationVisibleInMetadata !== true) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_METADATA",
      "registrationVisibleInMetadata must be true",
    );
  }
  if (
    c.rollbackReadiness !== "prepared-not-active" ||
    c.rollbackTarget !== "legacy"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_ROLLBACK",
      "rollback must remain prepared-not-active targeting legacy",
    );
  }
  if (c.nextEligibleStep !== "3B.3.3") {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_NEXT",
      "nextEligibleStep must be 3B.3.3",
    );
  }
  if (c.activationBlocker !== PHASE_3B3_2_SHADOW_PLACEMENT_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_SHADOW_PLACEMENT_BLOCKER",
      "activationBlocker must be PHASE_3B3_2_SHADOW_PLACEMENT_ONLY",
    );
  }
  return c as ControlledFeedHostShadowPlacement;
}
