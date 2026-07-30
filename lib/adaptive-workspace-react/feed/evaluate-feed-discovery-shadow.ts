/**
 * Phase 3B.1 — feed.discovery shadow declaration (metadata only).
 *
 * No React renderer. Does not import the Feed component module. No DOM. Fail-closed.
 */

import {
  createFeedDiscoverySealedContract,
  FEED_DISCOVERY_WIDGET_ID,
  feedDiscoveryManifest,
  type SealedRuntimeContract,
  type WidgetManifest,
} from "@/lib/adaptive-workspace";
import {
  feedSealedNoteContractEvaluation,
  readFeedSealedInstrumentationCounters,
} from "@/lib/feed/feed-sealed-runtime-instrumentation";

export const FEED_DISCOVERY_SHADOW_SCHEMA_VERSION = 1 as const;

export type FeedDiscoveryShadowDeclaration = {
  schemaVersion: typeof FEED_DISCOVERY_SHADOW_SCHEMA_VERSION;
  widgetId: typeof FEED_DISCOVERY_WIDGET_ID;
  manifest: WidgetManifest;
  sealedContract: SealedRuntimeContract;
  shadowActivation: true;
  renderActivation: false;
  activeWriter: "legacy";
  runtimeClassification: "sealed-runtime";
  /** Explicit: Workspace must not register a Feed renderer for this id. */
  workspaceRendererRegistered: false;
};

/**
 * Builds the shadow-only declaration for feed.discovery.
 * Side effect (when instrumentation enabled): increments contractEvaluationCount only.
 */
export function evaluateFeedDiscoveryShadow(): FeedDiscoveryShadowDeclaration {
  feedSealedNoteContractEvaluation();
  const sealedContract = createFeedDiscoverySealedContract();
  const manifest = feedDiscoveryManifest();

  if (sealedContract.renderActivation !== false) {
    throw new Error("feed.discovery shadow fail-closed: renderActivation must be false");
  }
  if (sealedContract.shadowActivation !== true) {
    throw new Error("feed.discovery shadow fail-closed: shadowActivation must be true");
  }
  if (sealedContract.activeWriter !== "legacy") {
    throw new Error("feed.discovery shadow fail-closed: activeWriter must be legacy");
  }
  if (manifest.id !== FEED_DISCOVERY_WIDGET_ID) {
    throw new Error("feed.discovery shadow fail-closed: manifest id mismatch");
  }

  return {
    schemaVersion: FEED_DISCOVERY_SHADOW_SCHEMA_VERSION,
    widgetId: FEED_DISCOVERY_WIDGET_ID,
    manifest,
    sealedContract,
    shadowActivation: true,
    renderActivation: false,
    activeWriter: "legacy",
    runtimeClassification: "sealed-runtime",
    workspaceRendererRegistered: false,
  };
}

/** True when declaration asserts no Workspace Feed renderer. */
export function feedDiscoveryShadowHasNoRenderer(
  declaration: FeedDiscoveryShadowDeclaration,
): boolean {
  return (
    declaration.renderActivation === false &&
    declaration.workspaceRendererRegistered === false &&
    declaration.sealedContract.renderActivation === false
  );
}

/** Expose evaluation counter for diagnostics without mutating. */
export function readShadowEvaluationCount(): number {
  return readFeedSealedInstrumentationCounters().contractEvaluationCount;
}
