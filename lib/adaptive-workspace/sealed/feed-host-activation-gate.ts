/**
 * Phase 3B.3.1 — pure host activation gate.
 * Always returns allowed=false with PHASE_3B3_1_DORMANT_HOST_ONLY.
 * No env/query/cookie/localStorage can bypass this in 3B.3.1.
 */

import type { ControlledFeedHostContract } from "./controlled-feed-host-types";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";

export const PHASE_3B3_1_DORMANT_HOST_ONLY =
  "PHASE_3B3_1_DORMANT_HOST_ONLY" as const;

export type FeedHostActivationGateResult = {
  allowed: false;
  currentStep: "3B.3.1";
  eligibleStep: "3B.3.2";
  reasons: readonly string[];
  blockers: readonly string[];
  proofStatus: "required" | "present" | "missing" | "invalid";
  freezeStatus: "required" | "present" | "missing" | "invalid";
  writerStatus: "legacy" | "mismatch";
  renderOwnerStatus: "legacy" | "mismatch";
  mountStatus: "single-legacy" | "mismatch";
  rollbackStatus: "prepared-not-active" | "mismatch";
};

export type FeedHostActivationGateInput = {
  /** Optional contract; defaults to canonical dormant contract. */
  contract?: ControlledFeedHostContract;
  /** Whether Phase 3B.2 proof artifact validates. */
  phase3b2ProofValid?: boolean;
  /** Whether Phase 3B.2 freeze validates. */
  phase3b2FreezeValid?: boolean;
  /** Attempted overrides — ignored for activation in 3B.3.1. */
  forceHostActivation?: unknown;
  envHostActivation?: unknown;
  queryHostActivation?: unknown;
  cookieHostActivation?: unknown;
  localStorageHostActivation?: unknown;
  observedWriter?: "legacy" | "workspace";
  observedRenderOwner?: "legacy" | "workspace";
  observedMountCount?: number;
  observedRollbackTarget?: "legacy" | "workspace";
};

/**
 * Pure gate: host activation is never allowed in Phase 3B.3.1.
 */
export function evaluateFeedHostActivationGate(
  input: FeedHostActivationGateInput = {},
): FeedHostActivationGateResult {
  const contract = input.contract ?? createControlledFeedHostContract();
  const blockers: string[] = [PHASE_3B3_1_DORMANT_HOST_ONLY];
  const reasons: string[] = [
    "Phase 3B.3.1 prepares dormant controlled host only; activation is deferred to 3B.3.2",
  ];

  let proofStatus: FeedHostActivationGateResult["proofStatus"] = "required";
  if (input.phase3b2ProofValid === true) proofStatus = "present";
  else if (input.phase3b2ProofValid === false) {
    proofStatus = "invalid";
    blockers.push("missing-proof", "proof-fail");
  }

  let freezeStatus: FeedHostActivationGateResult["freezeStatus"] = "required";
  if (input.phase3b2FreezeValid === true) freezeStatus = "present";
  else if (input.phase3b2FreezeValid === false) {
    freezeStatus = "invalid";
    blockers.push("missing-proof");
  }

  let writerStatus: FeedHostActivationGateResult["writerStatus"] = "legacy";
  if (
    input.observedWriter === "workspace" ||
    contract.activeWriter !== "legacy"
  ) {
    writerStatus = "mismatch";
    blockers.push("active-workspace-writer");
  }

  let renderOwnerStatus: FeedHostActivationGateResult["renderOwnerStatus"] =
    "legacy";
  if (
    input.observedRenderOwner === "workspace" ||
    contract.activeRenderOwner !== "legacy"
  ) {
    renderOwnerStatus = "mismatch";
    blockers.push("active-workspace-renderer");
  }

  let mountStatus: FeedHostActivationGateResult["mountStatus"] =
    "single-legacy";
  if (
    typeof input.observedMountCount === "number" &&
    input.observedMountCount !== 1
  ) {
    mountStatus = "mismatch";
    blockers.push("second-geofeed-mount");
  }

  let rollbackStatus: FeedHostActivationGateResult["rollbackStatus"] =
    "prepared-not-active";
  if (
    input.observedRollbackTarget === "workspace" ||
    contract.fallbackOwner !== "legacy"
  ) {
    rollbackStatus = "mismatch";
    blockers.push("missing-rollback-route");
  }

  // Explicitly ignore any force/env/query/cookie/storage attempts.
  void input.forceHostActivation;
  void input.envHostActivation;
  void input.queryHostActivation;
  void input.cookieHostActivation;
  void input.localStorageHostActivation;

  return {
    allowed: false,
    currentStep: "3B.3.1",
    eligibleStep: "3B.3.2",
    reasons,
    blockers: [...new Set(blockers)],
    proofStatus,
    freezeStatus,
    writerStatus,
    renderOwnerStatus,
    mountStatus,
    rollbackStatus,
  };
}
