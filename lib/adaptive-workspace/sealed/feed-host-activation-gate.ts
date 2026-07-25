/**
 * Phase 3B.3.3 — pure host activation gate.
 * Always returns allowed=false with PHASE_3B3_3_HOST_REGISTRATION_ONLY.
 * No env/query/cookie/storage/context/flag can bypass this in 3B.3.3.
 */

import type { ControlledFeedHostContract } from "./controlled-feed-host-types";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";
import { PHASE_3B3_3_HOST_REGISTRATION_ONLY } from "./controlled-host-registry";

/** Historical blocker ids — retained in contract catalog only. */
export const PHASE_3B3_1_DORMANT_HOST_ONLY =
  "PHASE_3B3_1_DORMANT_HOST_ONLY" as const;
export { PHASE_3B3_2_SHADOW_PLACEMENT_ONLY } from "./controlled-feed-host-shadow-placement";
export { PHASE_3B3_3_HOST_REGISTRATION_ONLY };

export type FeedHostActivationGateResult = {
  allowed: false;
  currentStep: "3B.3.3";
  eligibleStep: "3B.3.4";
  reasons: readonly string[];
  blockers: readonly string[];
  proofStatus: "required" | "present" | "missing" | "invalid";
  freezeStatus: "required" | "present" | "missing" | "invalid";
  writerStatus: "legacy" | "mismatch";
  renderOwnerStatus: "legacy" | "mismatch";
  mountStatus: "single-legacy" | "mismatch";
  rollbackStatus: "prepared-not-active" | "mismatch";
  registrationStatus: "registered" | "mismatch";
};

export type FeedHostActivationGateInput = {
  contract?: ControlledFeedHostContract;
  phase3b2ProofValid?: boolean;
  phase3b2FreezeValid?: boolean;
  phase3b32ProofValid?: boolean;
  phase3b33ProofValid?: boolean;
  forceHostActivation?: unknown;
  envHostActivation?: unknown;
  queryHostActivation?: unknown;
  cookieHostActivation?: unknown;
  localStorageHostActivation?: unknown;
  sessionStorageHostActivation?: unknown;
  contextHostActivation?: unknown;
  globalHostActivation?: unknown;
  featureFlagHostActivation?: unknown;
  debugOverrideHostActivation?: unknown;
  observedWriter?: "legacy" | "workspace";
  observedRenderOwner?: "legacy" | "workspace";
  observedMountCount?: number;
  observedRollbackTarget?: "legacy" | "workspace";
  observedRegistrationState?: "registered" | "missing";
  observedRuntimeId?: string;
};

/**
 * Pure gate: host activation is never allowed in Phase 3B.3.3.
 */
export function evaluateFeedHostActivationGate(
  input: FeedHostActivationGateInput = {},
): FeedHostActivationGateResult {
  const contract = input.contract ?? createControlledFeedHostContract();
  const blockers: string[] = [PHASE_3B3_3_HOST_REGISTRATION_ONLY];
  const reasons: string[] = [
    "Phase 3B.3.3 registers the legacy feed host in metadata only; hostActivation remains deferred to 3B.3.4",
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

  if (input.phase3b32ProofValid === false || input.phase3b33ProofValid === false) {
    blockers.push("missing-proof", "proof-fail");
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

  let registrationStatus: FeedHostActivationGateResult["registrationStatus"] =
    "registered";
  if (input.observedRegistrationState === "missing") {
    registrationStatus = "mismatch";
    blockers.push("react-identity-changed");
  }
  if (
    typeof input.observedRuntimeId === "string" &&
    input.observedRuntimeId.length > 0 &&
    input.observedRuntimeId !== "feed.discovery.legacy-single-mount.v1"
  ) {
    registrationStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  void input.forceHostActivation;
  void input.envHostActivation;
  void input.queryHostActivation;
  void input.cookieHostActivation;
  void input.localStorageHostActivation;
  void input.sessionStorageHostActivation;
  void input.contextHostActivation;
  void input.globalHostActivation;
  void input.featureFlagHostActivation;
  void input.debugOverrideHostActivation;

  return {
    allowed: false,
    currentStep: "3B.3.3",
    eligibleStep: "3B.3.4",
    reasons,
    blockers: [...new Set(blockers)],
    proofStatus,
    freezeStatus,
    writerStatus,
    renderOwnerStatus,
    mountStatus,
    rollbackStatus,
    registrationStatus,
  };
}
