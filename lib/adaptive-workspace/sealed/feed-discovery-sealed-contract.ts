/**
 * Canonical feed.discovery sealed-runtime contract (Phase 3B.1).
 * Shadow-only: renderActivation false, legacy single writer.
 */

import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";
import {
  SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION,
  SEALED_WORKSPACE_CAPABILITIES,
  SEALED_WORKSPACE_PROHIBITIONS,
  type SealedRuntimeContract,
} from "./sealed-runtime-types";
import { validateSealedRuntimeContract } from "./validate-sealed-runtime-contract";

export const FEED_DISCOVERY_WIDGET_ID = "feed.discovery" as const;

export function createFeedDiscoverySealedContract(): SealedRuntimeContract {
  const raw: SealedRuntimeContract = {
    schemaVersion: SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION,
    widgetId: FEED_DISCOVERY_WIDGET_ID,
    runtimeClassification: "sealed-runtime",
    owner: "legacy-feed-runtime",
    renderActivation: false,
    shadowActivation: true,
    activeWriter: "legacy",
    mountPolicy: "single-stable-mount",
    stateBoundary: "opaque",
    requestBoundary: "owned-by-widget",
    observerBoundary:
      "owned-by-widget-except-existing-platform-measurement",
    scrollBoundary: "owned-by-widget",
    permittedWorkspaceCapabilities: [...SEALED_WORKSPACE_CAPABILITIES],
    prohibitedWorkspaceCapabilities: [...SEALED_WORKSPACE_PROHIBITIONS],
    invariantIds: [...FEED_SEALED_INVARIANT_IDS],
  };
  return validateSealedRuntimeContract(raw);
}
