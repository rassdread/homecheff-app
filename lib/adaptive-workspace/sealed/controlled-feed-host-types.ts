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
  "shadow-placement-browser-proof-green",
  "host-registration-browser-proof-green",
  "host-eligibility-browser-proof-green",
  "host-activation-readiness-browser-proof-green",
  "host-shadow-activation-simulation-browser-proof-green",
  "host-activation-decision-browser-proof-green",
  "host-activation-plan-browser-proof-green",
  "host-activation-pipeline-browser-proof-green",
  "host-activation-transaction-browser-proof-green",
] as const;

export type ControlledFeedHostActivationPrerequisite =
  (typeof CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES)[number];

export const CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS = [
  "missing-proof",
  "proof-fail",
  "proof-inconclusive-blocking",
  "host-activation-true-in-3b3-1",
  "render-activation-true-in-3b3-1",
  "host-activation-true-in-3b3-2",
  "render-activation-true-in-3b3-2",
  "host-activation-true-in-3b3-3",
  "render-activation-true-in-3b3-3",
  "host-activation-true-in-3b3-4",
  "render-activation-true-in-3b3-4",
  "host-activation-true-in-3b3-5",
  "render-activation-true-in-3b3-5",
  "host-activation-true-in-3b3-6",
  "render-activation-true-in-3b3-6",
  "host-activation-true-in-3b3-7",
  "render-activation-true-in-3b3-7",
  "host-activation-true-in-3b3-8",
  "render-activation-true-in-3b3-8",
  "host-activation-true-in-3b3-9",
  "render-activation-true-in-3b3-9",
  "host-activation-true-in-3b3-10",
  "render-activation-true-in-3b3-10",
  "active-workspace-writer",
  "active-workspace-renderer",
  "second-geofeed-mount",
  "request-identity-changed",
  "react-identity-changed",
  "visible-dom-wrapper",
  "missing-rollback-route",
  "PHASE_3B3_1_DORMANT_HOST_ONLY",
  "PHASE_3B3_2_SHADOW_PLACEMENT_ONLY",
  "PHASE_3B3_3_HOST_REGISTRATION_ONLY",
  "PHASE_3B3_4_HOST_ELIGIBILITY_ONLY",
  "PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY",
  "PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY",
  "PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY",
  "PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY",
  "PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY",
  "PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY",
  "PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY",
  "PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY",
  "PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY",
  "PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY",
  "PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY",
  "PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY",
  "PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY",
  "PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY",
  "PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY",
  "PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY",
  "PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY",
  "PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY",
  "PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY",
  "PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY",
  "PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY",
  "PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY",
  "PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY",
  "PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY",
  "PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY",
  "PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY",
  "PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY",
  "PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY",
  "PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY",
  "PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY",
  "PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY",
  "PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY",
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
  nextEligibleStep: "3B.3.43";
};
