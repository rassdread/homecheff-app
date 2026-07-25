/**
 * Phase 3B.3.8 — pure Controlled Host Plan (metadata only).
 */

import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";
import { createFeedHostRollbackContract } from "./feed-host-rollback-contract";
import { PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY } from "./controlled-host-activation-plan";

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
  blockerSet: readonly [typeof PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY];
  recommendedNextStep: "3B.3.9-controlled-host-activation-candidate";
  placementState: "shadow-registered";
  registrationState: "registered";
  eligibilityState: "eligible";
  readinessState: "ready";
  simulationState: "completed";
  decisionState: "completed";
  decisionResult: "ALLOW";
  wouldActivate: true;
  confidence: "high";
  planState: "completed";
  planResult: "plan-complete-not-executable";
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
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
    blockerSet: [PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY],
    recommendedNextStep: "3B.3.9-controlled-host-activation-candidate",
    placementState: "shadow-registered",
    registrationState: "registered",
    eligibilityState: "eligible",
    readinessState: "ready",
    simulationState: "completed",
    decisionState: "completed",
    decisionResult: "ALLOW",
    wouldActivate: true,
    confidence: "high",
    planState: "completed",
    planResult: "plan-complete-not-executable",
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    hostClassification: "controlled-host-candidate",
  };
}
