/**
 * Phase 3B.3.1 — Controlled Feed Host contract types.
 * Serializable / deterministic metadata only. No React, DOM, or Feed imports.
 */

import type { FeedSealedInvariantId } from "./feed-discovery-invariants";

export const CONTROLLED_FEED_HOST_CONTRACT_SCHEMA_VERSION = 1 as const;

export type ControlledHostClassification = "controlled-host-candidate";

export type ControlledHostRenderOwner = "legacy" | "workspace";

export type ControlledHostWriter = "legacy" | "workspace";

export type ControlledMountingStrategy =
  | "reuse-existing-single-mount-only"
  | "remount-allowed";

export type ControlledIdentityStrategy =
  | "preserve-existing-react-identity"
  | "new-host-key-allowed";

export type ControlledRollbackStrategy =
  | "immediate-legacy-fallback"
  | "none";

export type ControlledChildPolicy =
  | "no-child-while-dormant"
  | "dormant-child-allowed";

export type ControlledWrapperPolicy =
  | "no-visible-wrapper"
  | "visible-wrapper-allowed";

export type ControlledDomPolicy =
  | "zero-visible-dom-delta"
  | "visible-dom-delta-allowed";

export type ControlledBoundaryOwner = "owned-by-feed" | "opaque";

export const CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES = [
  "phase3b2-frozen-proof-required",
  "phase3b2-freeze-required",
  "all-20-release-blocking-invariants-pass",
  "render-owner-legacy",
  "writer-legacy",
  "single-geofeed-mount",
  "no-forbidden-keys",
  "no-second-renderer",
  "rollback-path-valid",
  "production-build-green",
  "dormant-host-browser-proof-green",
] as const;

export type ControlledFeedHostActivationPrerequisite =
  (typeof CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES)[number];

export const CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS = [
  "missing-proof",
  "proof-fail",
  "proof-inconclusive-blocking",
  "host-activation-true-in-3b3-1",
  "render-activation-true-in-3b3-1",
  "active-workspace-writer",
  "active-workspace-renderer",
  "second-geofeed-mount",
  "request-identity-changed",
  "react-identity-changed",
  "visible-dom-wrapper",
  "missing-rollback-route",
  "PHASE_3B3_1_DORMANT_HOST_ONLY",
] as const;

export type ControlledFeedHostActivationBlocker =
  (typeof CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS)[number];

export type ControlledFeedHostContract = {
  schemaVersion: typeof CONTROLLED_FEED_HOST_CONTRACT_SCHEMA_VERSION;
  widgetId: "feed.discovery";
  runtimeClassification: "sealed-runtime";
  hostClassification: ControlledHostClassification;
  hostVersion: 1;
  activeRenderOwner: ControlledHostRenderOwner;
  activeWriter: ControlledHostWriter;
  hostActivation: boolean;
  renderActivation: boolean;
  shadowActivation: boolean;
  mountingStrategy: ControlledMountingStrategy;
  identityStrategy: ControlledIdentityStrategy;
  rollbackStrategy: ControlledRollbackStrategy;
  fallbackOwner: "legacy";
  childPolicy: ControlledChildPolicy;
  wrapperPolicy: ControlledWrapperPolicy;
  DOMPolicy: ControlledDomPolicy;
  stateBoundary: "opaque";
  requestBoundary: "owned-by-feed";
  observerBoundary: "owned-by-feed";
  scrollBoundary: "owned-by-feed";
  cacheBoundary: "owned-by-feed";
  activationPrerequisites: readonly ControlledFeedHostActivationPrerequisite[];
  activationBlockers: readonly ControlledFeedHostActivationBlocker[];
  requiredInvariantIds: readonly FeedSealedInvariantId[];
  browserProofRequirement: "phase3b2-frozen-proof-required";
  freezeRequirement: "phase3b2-freeze-required";
  nextEligibleStep: "3B.3.2";
};
