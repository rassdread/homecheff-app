/**
 * Phase 3B.1 — sealed runtime widget contract types.
 *
 * Serializable / deterministic metadata only. No React, DOM, functions,
 * or live runtime state.
 */

import type { FeedSealedInvariantId } from "./feed-discovery-invariants";

export const SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION = 1 as const;

export type SealedRuntimeClassification = "sealed-runtime";

export type SealedRuntimeOwner = "legacy-feed-runtime";

export type SealedRuntimeActiveWriter = "legacy" | "workspace";

export type SealedMountPolicy = "single-stable-mount";

export type SealedStateBoundary = "opaque";

export type SealedRequestBoundary = "owned-by-widget";

export type SealedObserverBoundary =
  | "owned-by-widget"
  | "owned-by-widget-except-existing-platform-measurement";

export type SealedScrollBoundary = "owned-by-widget";

/** Capabilities Workspace may exercise for a sealed runtime. */
export const SEALED_WORKSPACE_CAPABILITIES = [
  "declare",
  "identify",
  "diagnose",
  "measure-outer-lifecycle",
  "compare-invariants",
] as const;

export type SealedWorkspaceCapability =
  (typeof SEALED_WORKSPACE_CAPABILITIES)[number];

/** Capabilities Workspace must never exercise for a sealed runtime. */
export const SEALED_WORKSPACE_PROHIBITIONS = [
  "render",
  "duplicate",
  "remount",
  "request",
  "paginate",
  "filter",
  "sort",
  "cache",
  "observe-internal-sentinels",
  "mutate-internal-state",
  "influence-request-identity",
  "influence-paint-identity",
] as const;

export type SealedWorkspaceProhibition =
  (typeof SEALED_WORKSPACE_PROHIBITIONS)[number];

/**
 * Pure sealed-runtime contract. Must remain JSON-serializable and free of
 * functions, React elements, DOM nodes, and runtime state.
 */
export type SealedRuntimeContract = {
  schemaVersion: typeof SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION;
  widgetId: string;
  runtimeClassification: SealedRuntimeClassification;
  owner: SealedRuntimeOwner;
  renderActivation: boolean;
  shadowActivation: boolean;
  activeWriter: SealedRuntimeActiveWriter;
  mountPolicy: SealedMountPolicy;
  stateBoundary: SealedStateBoundary;
  requestBoundary: SealedRequestBoundary;
  observerBoundary: SealedObserverBoundary;
  scrollBoundary: SealedScrollBoundary;
  permittedWorkspaceCapabilities: readonly SealedWorkspaceCapability[];
  prohibitedWorkspaceCapabilities: readonly SealedWorkspaceProhibition[];
  invariantIds: readonly FeedSealedInvariantId[];
};
