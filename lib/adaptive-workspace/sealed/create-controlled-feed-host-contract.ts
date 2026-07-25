/**
 * Canonical feed.discovery Controlled Host Contract — Phase 3B.3.1 dormant.
 */

import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";
import {
  CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS,
  CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES,
  CONTROLLED_FEED_HOST_CONTRACT_SCHEMA_VERSION,
  type ControlledFeedHostContract,
} from "./controlled-feed-host-types";
import { validateControlledFeedHostContract } from "./validate-controlled-feed-host-contract";

export function createControlledFeedHostContract(): ControlledFeedHostContract {
  const raw: ControlledFeedHostContract = {
    schemaVersion: CONTROLLED_FEED_HOST_CONTRACT_SCHEMA_VERSION,
    widgetId: "feed.discovery",
    runtimeClassification: "sealed-runtime",
    hostClassification: "controlled-host-candidate",
    hostVersion: 1,
    activeRenderOwner: "legacy",
    activeWriter: "legacy",
    hostActivation: false,
    renderActivation: false,
    shadowActivation: true,
    mountingStrategy: "reuse-existing-single-mount-only",
    identityStrategy: "preserve-existing-react-identity",
    rollbackStrategy: "immediate-legacy-fallback",
    fallbackOwner: "legacy",
    childPolicy: "no-child-while-dormant",
    wrapperPolicy: "no-visible-wrapper",
    DOMPolicy: "zero-visible-dom-delta",
    stateBoundary: "opaque",
    requestBoundary: "owned-by-feed",
    observerBoundary: "owned-by-feed",
    scrollBoundary: "owned-by-feed",
    cacheBoundary: "owned-by-feed",
    activationPrerequisites: [
      ...CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES,
    ],
    activationBlockers: [...CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS],
    requiredInvariantIds: [...FEED_SEALED_INVARIANT_IDS],
    browserProofRequirement: "phase3b2-frozen-proof-required",
    freezeRequirement: "phase3b2-freeze-required",
    nextEligibleStep: "3B.3.20",
  };
  return validateControlledFeedHostContract(raw);
}
