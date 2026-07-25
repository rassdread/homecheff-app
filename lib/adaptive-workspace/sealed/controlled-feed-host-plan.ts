/**
 * Phase 3B.3.1 — pure Controlled Host Plan (metadata only, no React elements).
 */

import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";

export type ControlledFeedHostPlan = {
  widgetId: "feed.discovery";
  currentOwner: "legacy";
  targetHost: "adaptive-workspace-feed-host";
  activationState: "dormant";
  currentMountStrategy: "legacy-single-mount";
  targetMountStrategy: "reuse-same-instance-without-remount";
  currentIdentity: "legacy-react-identity";
  requiredIdentity: "preserve-existing-react-identity";
  rollbackTarget: "legacy";
  invariantSet: typeof FEED_SEALED_INVARIANT_IDS;
  prerequisiteStatus: "phase3b2-frozen-ready";
  blockerSet: readonly ["PHASE_3B3_1_DORMANT_HOST_ONLY"];
  recommendedNextStep: "3B.3.2-controlled-host-shadow-placement";
  hostActivation: false;
  renderActivation: false;
  hostClassification: "controlled-host-candidate";
};

export function createControlledFeedHostPlan(): ControlledFeedHostPlan {
  // Touch contracts to ensure fail-closed factories remain consistent.
  const host = createControlledFeedHostContract();
  const rollback = createFeedHostRollbackContract();
  void host;
  void rollback;
  return {
    widgetId: "feed.discovery",
    currentOwner: "legacy",
    targetHost: "adaptive-workspace-feed-host",
    activationState: "dormant",
    currentMountStrategy: "legacy-single-mount",
    targetMountStrategy: "reuse-same-instance-without-remount",
    currentIdentity: "legacy-react-identity",
    requiredIdentity: "preserve-existing-react-identity",
    rollbackTarget: "legacy",
    invariantSet: FEED_SEALED_INVARIANT_IDS,
    prerequisiteStatus: "phase3b2-frozen-ready",
    blockerSet: ["PHASE_3B3_1_DORMANT_HOST_ONLY"],
    recommendedNextStep: "3B.3.2-controlled-host-shadow-placement",
    hostActivation: false,
    renderActivation: false,
    hostClassification: "controlled-host-candidate",
  };
}
