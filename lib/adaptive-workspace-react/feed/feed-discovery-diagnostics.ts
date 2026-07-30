/**
 * Phase 3B.1 — read-only diagnostics snapshot for feed.discovery.
 * Never used to steer Feed runtime behavior.
 */

import {
  createFeedDiscoverySealedContract,
  FEED_DISCOVERY_WIDGET_ID,
  FEED_SEALED_INVARIANT_IDS,
  type FeedSealedInvariantId,
  type SealedRuntimeContract,
} from "@/lib/adaptive-workspace";
import { readFeedSealedInstrumentationCounters } from "@/lib/feed/feed-sealed-runtime-instrumentation";
import {
  evaluateFeedDiscoveryShadow,
  type FeedDiscoveryShadowDeclaration,
} from "./evaluate-feed-discovery-shadow";

export type FeedInvariantInstrumentStatus =
  | "instrumented"
  | "not-directly-instrumented-in-3b1"
  | "declared";

const INSTRUMENTED: ReadonlySet<FeedSealedInvariantId> = new Set([
  "FEED_GEOFEED_SINGLE_MOUNT",
  "FEED_GEOFEED_ZERO_UNMOUNT_DURING_STABLE_SESSION",
  "FEED_NO_ADDITIONAL_API_REQUESTS",
  "FEED_LEGACY_SINGLE_WRITER",
  "FEED_REQUEST_KEY_STABLE_UNDER_WORKSPACE_CHANGES",
]);

const NOT_DIRECT: ReadonlySet<FeedSealedInvariantId> = new Set([
  "FEED_NATIVE_PAINT_KEY_STABLE_UNDER_WORKSPACE_CHANGES",
  "FEED_PREPARED_BATCH_IDENTITY_STABLE",
  "FEED_PAGINATION_CURSOR_NOT_RESET_BY_WORKSPACE",
  "FEED_RESULT_CACHE_NOT_REINITIALIZED_BY_WORKSPACE",
  "FEED_FILTER_CACHE_NOT_REINITIALIZED_BY_WORKSPACE",
  "FEED_INTERSECTION_OBSERVER_OWNERSHIP_UNCHANGED",
  "FEED_RESIZE_OBSERVER_OWNERSHIP_UNCHANGED",
  "FEED_SCROLL_OWNERSHIP_UNCHANGED",
  "FEED_TILE_IDENTITY_UNCHANGED",
  "FEED_SKELETON_OWNERSHIP_UNCHANGED",
  "FEED_LOADING_BEHAVIOR_UNCHANGED",
  "FEED_VISIBLE_DOM_UNCHANGED",
  "FEED_SSR_BEHAVIOR_UNCHANGED",
  "FEED_HYDRATION_CLEAN",
  "FEED_NO_WORKSPACE_REQUEST_IDENTITY_INPUT",
]);

export type FeedDiscoveryDiagnosticsSnapshot = {
  widgetId: typeof FEED_DISCOVERY_WIDGET_ID;
  shadowActivation: true;
  renderActivation: false;
  activeWriter: "legacy";
  runtimeClassification: "sealed-runtime";
  mountCount: number;
  unmountCount: number;
  activeInstanceCount: number;
  contractEvaluationCount: number;
  requestCount: number;
  requestKeyTransitionCount: number;
  nativePaintKeyTransitionCount: number | null;
  paginationResetCount: number | null;
  resultCacheInitCount: number | null;
  filterCacheInitCount: number | null;
  preparedBatchIdentityTransitionCount: number | null;
  observerCreationCount: number | null;
  invariantStatuses: Record<FeedSealedInvariantId, FeedInvariantInstrumentStatus>;
  sampleSequence: number;
  sealedContract: SealedRuntimeContract;
};

function invariantStatuses(): Record<
  FeedSealedInvariantId,
  FeedInvariantInstrumentStatus
> {
  const out = {} as Record<FeedSealedInvariantId, FeedInvariantInstrumentStatus>;
  for (const id of FEED_SEALED_INVARIANT_IDS) {
    if (INSTRUMENTED.has(id)) out[id] = "instrumented";
    else if (NOT_DIRECT.has(id)) out[id] = "not-directly-instrumented-in-3b1";
    else out[id] = "declared";
  }
  return out;
}

function snapshotFrom(
  sealedContract: SealedRuntimeContract,
): FeedDiscoveryDiagnosticsSnapshot {
  const c = readFeedSealedInstrumentationCounters();
  return {
    widgetId: FEED_DISCOVERY_WIDGET_ID,
    shadowActivation: true,
    renderActivation: false,
    activeWriter: "legacy",
    runtimeClassification: "sealed-runtime",
    mountCount: c.mountCount,
    unmountCount: c.unmountCount,
    activeInstanceCount: c.activeInstanceCount,
    contractEvaluationCount: c.contractEvaluationCount,
    requestCount: c.requestStartCount,
    requestKeyTransitionCount: c.requestKeyTransitionCount,
    nativePaintKeyTransitionCount: null,
    paginationResetCount: null,
    resultCacheInitCount: null,
    filterCacheInitCount: null,
    preparedBatchIdentityTransitionCount: null,
    observerCreationCount: null,
    invariantStatuses: invariantStatuses(),
    sampleSequence: c.sampleSequence,
    sealedContract,
  };
}

/**
 * Read-only snapshot. Does not start requests, create observers, or render.
 * Pass `declaration` to reuse a prior shadow evaluation without re-bumping.
 * Set `evaluateShadow: true` to evaluate once (bumps evaluation count).
 */
export function readFeedDiscoveryDiagnosticsSnapshot(args?: {
  declaration?: FeedDiscoveryShadowDeclaration;
  evaluateShadow?: boolean;
}): FeedDiscoveryDiagnosticsSnapshot {
  if (args?.declaration) {
    return snapshotFrom(args.declaration.sealedContract);
  }
  if (args?.evaluateShadow === true) {
    return snapshotFrom(evaluateFeedDiscoveryShadow().sealedContract);
  }
  return peekFeedDiscoveryDiagnosticsSnapshot();
}

/** Snapshot that never evaluates shadow (no evaluation-count side effect). */
export function peekFeedDiscoveryDiagnosticsSnapshot(): FeedDiscoveryDiagnosticsSnapshot {
  return snapshotFrom(createFeedDiscoverySealedContract());
}
