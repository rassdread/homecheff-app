/**
 * Phase 3B.3.4 — pure Controlled Host Plan (metadata only).
 */

import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { PHASE_3B3_4_HOST_ELIGIBILITY_ONLY } from "./controlled-host-eligibility";

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
  blockerSet: readonly [typeof PHASE_3B3_4_HOST_ELIGIBILITY_ONLY];
  recommendedNextStep: "3B.3.5-controlled-host-activation-candidate";
  placementState: "shadow-registered";
  registrationState: "registered";
  eligibilityState: "eligible";
  hostActivation: false;
  renderActivation: false;
  hostClassification: "controlled-host-candidate";
};

export function createControlledFeedHostPlan(): ControlledFeedHostPlan {
  void createControlledFeedHostContract();
  void createFeedHostRollbackContract();
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
    blockerSet: [PHASE_3B3_4_HOST_ELIGIBILITY_ONLY],
    recommendedNextStep: "3B.3.5-controlled-host-activation-candidate",
    placementState: "shadow-registered",
    registrationState: "registered",
    eligibilityState: "eligible",
    hostActivation: false,
    renderActivation: false,
    hostClassification: "controlled-host-candidate",
  };
}
