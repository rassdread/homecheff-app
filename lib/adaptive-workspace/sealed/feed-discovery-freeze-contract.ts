/**
 * Phase 3B.2 — feed.discovery freeze contract (release / validation only).
 * Does not steer Feed runtime. Fail-closed.
 */

import { HardContractViolation } from "../schema/validation-error";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";
import { createFeedDiscoverySealedContract } from "./feed-discovery-sealed-contract";
import type { SealedRuntimeContract } from "./sealed-runtime-types";

export const FEED_DISCOVERY_FREEZE_SCHEMA_VERSION = 1 as const;

export type FeedDiscoveryFreezeContract = {
  schemaVersion: typeof FEED_DISCOVERY_FREEZE_SCHEMA_VERSION;
  widgetId: "feed.discovery";
  runtimeClassification: "sealed-runtime";
  /** Maximum allowed mode — ON is forbidden. */
  modeMax: "shadow";
  renderActivation: false;
  shadowActivation: true;
  activeWriter: "legacy";
  singleStableMount: true;
  zeroUnmountDuringStableSession: true;
  noWorkspaceRequestIdentity: true;
  noWorkspaceObserverOwnership: true;
  noWorkspaceScrollOwnership: true;
  noWorkspaceCacheOwnership: true;
  browserProofStatus: "frozen";
  nextEligiblePhase: "3B.3";
  hostActivation: false;
  releaseBlockingInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  sealedContract: SealedRuntimeContract;
  /**
   * Evidence binding — commit SHA of the freeze evidence run.
   * Empty string is invalid for frozen status.
   */
  evidenceCommit: string;
  evidenceArtifactPath: string;
  productionMode: true;
};

export function createFeedDiscoveryFreezeContract(args: {
  evidenceCommit: string;
  evidenceArtifactPath: string;
}): FeedDiscoveryFreezeContract {
  const sealedContract = createFeedDiscoverySealedContract();
  const raw: FeedDiscoveryFreezeContract = {
    schemaVersion: FEED_DISCOVERY_FREEZE_SCHEMA_VERSION,
    widgetId: "feed.discovery",
    runtimeClassification: "sealed-runtime",
    modeMax: "shadow",
    renderActivation: false,
    shadowActivation: true,
    activeWriter: "legacy",
    singleStableMount: true,
    zeroUnmountDuringStableSession: true,
    noWorkspaceRequestIdentity: true,
    noWorkspaceObserverOwnership: true,
    noWorkspaceScrollOwnership: true,
    noWorkspaceCacheOwnership: true,
    browserProofStatus: "frozen",
    nextEligiblePhase: "3B.3",
    hostActivation: false,
    releaseBlockingInvariantIds: FEED_SEALED_INVARIANT_IDS,
    sealedContract,
    evidenceCommit: args.evidenceCommit,
    evidenceArtifactPath: args.evidenceArtifactPath,
    productionMode: true,
  };
  return validateFeedDiscoveryFreezeContract(raw);
}

export function validateFeedDiscoveryFreezeContract(
  candidate: unknown,
): FeedDiscoveryFreezeContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_FREEZE_INVALID",
      "Freeze contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;

  if (c.schemaVersion !== FEED_DISCOVERY_FREEZE_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_FREEZE_SCHEMA",
      "Unsupported freeze schemaVersion",
    );
  }
  if (c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_FREEZE_WIDGET",
      "widgetId must be feed.discovery",
    );
  }
  if (c.runtimeClassification !== "sealed-runtime") {
    throw new HardContractViolation(
      "FEED_FREEZE_CLASSIFICATION",
      "runtimeClassification must be sealed-runtime",
    );
  }
  if (c.modeMax !== "shadow") {
    throw new HardContractViolation(
      "FEED_FREEZE_MODE",
      "modeMax must be shadow (ON forbidden)",
    );
  }
  if (c.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_FREEZE_RENDER",
      "renderActivation must be false",
    );
  }
  if (c.shadowActivation !== true) {
    throw new HardContractViolation(
      "FEED_FREEZE_SHADOW",
      "shadowActivation must be true",
    );
  }
  if (c.activeWriter !== "legacy") {
    throw new HardContractViolation(
      "FEED_FREEZE_WRITER",
      "activeWriter must be legacy",
    );
  }
  if (c.browserProofStatus !== "frozen") {
    throw new HardContractViolation(
      "FEED_FREEZE_PROOF",
      "browserProofStatus must be frozen",
    );
  }
  if (c.nextEligiblePhase !== "3B.3") {
    throw new HardContractViolation(
      "FEED_FREEZE_NEXT_PHASE",
      "nextEligiblePhase must be 3B.3",
    );
  }
  if (c.hostActivation !== false) {
    throw new HardContractViolation(
      "FEED_FREEZE_HOST",
      "hostActivation must be false until explicit future phase",
    );
  }
  if (c.productionMode !== true) {
    throw new HardContractViolation(
      "FEED_FREEZE_PROD",
      "productionMode must be true for freeze",
    );
  }
  if (typeof c.evidenceCommit !== "string" || c.evidenceCommit.length < 7) {
    throw new HardContractViolation(
      "FEED_FREEZE_EVIDENCE_COMMIT",
      "evidenceCommit must be a non-empty git SHA",
    );
  }
  if (
    typeof c.evidenceArtifactPath !== "string" ||
    c.evidenceArtifactPath.length === 0
  ) {
    throw new HardContractViolation(
      "FEED_FREEZE_EVIDENCE_PATH",
      "evidenceArtifactPath required",
    );
  }
  for (const flag of [
    "singleStableMount",
    "zeroUnmountDuringStableSession",
    "noWorkspaceRequestIdentity",
    "noWorkspaceObserverOwnership",
    "noWorkspaceScrollOwnership",
    "noWorkspaceCacheOwnership",
  ] as const) {
    if (c[flag] !== true) {
      throw new HardContractViolation(
        "FEED_FREEZE_FLAG",
        `${flag} must be true`,
      );
    }
  }

  // Re-validate nested sealed contract
  const sealed = createFeedDiscoverySealedContract();
  if (sealed.renderActivation !== false || sealed.activeWriter !== "legacy") {
    throw new HardContractViolation(
      "FEED_FREEZE_SEALED",
      "Nested sealed contract invalid",
    );
  }

  return {
    ...(c as unknown as FeedDiscoveryFreezeContract),
    sealedContract: sealed,
    releaseBlockingInvariantIds: FEED_SEALED_INVARIANT_IDS,
  };
}
