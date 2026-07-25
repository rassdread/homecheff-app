/**
 * Phase 3B.3.13 — pure host activation gate.
 * Always returns allowed=false with PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY.
 */

import type { ControlledFeedHostContract } from "./controlled-feed-host-types";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";
import { PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY } from "./controlled-host-activation-state-machine";

export const PHASE_3B3_1_DORMANT_HOST_ONLY =
  "PHASE_3B3_1_DORMANT_HOST_ONLY" as const;
export { PHASE_3B3_2_SHADOW_PLACEMENT_ONLY } from "./controlled-feed-host-shadow-placement";
export { PHASE_3B3_3_HOST_REGISTRATION_ONLY } from "./controlled-host-registry";
export { PHASE_3B3_4_HOST_ELIGIBILITY_ONLY } from "./controlled-host-eligibility";
export { PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY } from "./controlled-host-activation-readiness";
export { PHASE_3B3_6_HOST_SHADOW_ACTIVATION_SIMULATION_ONLY } from "./controlled-host-shadow-activation-simulation";
export { PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY } from "./controlled-host-activation-decision";
export { PHASE_3B3_8_HOST_ACTIVATION_PLAN_ONLY } from "./controlled-host-activation-plan";
export { PHASE_3B3_9_HOST_ACTIVATION_PIPELINE_ONLY } from "./controlled-host-activation-pipeline";
export { PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY } from "./controlled-host-activation-transaction";
export { PHASE_3B3_11_HOST_ACTIVATION_COMMIT_READINESS_ONLY } from "./controlled-host-activation-commit-readiness";
export { PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY } from "./controlled-host-activation-commit-protocol";
export { PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY };

export type FeedHostActivationGateResult = {
  allowed: false;
  currentStep: "3B.3.13";
  eligibleStep: "3B.3.14";
  reasons: readonly string[];
  blockers: readonly string[];
  proofStatus: "required" | "present" | "missing" | "invalid";
  freezeStatus: "required" | "present" | "missing" | "invalid";
  writerStatus: "legacy" | "mismatch";
  renderOwnerStatus: "legacy" | "mismatch";
  mountStatus: "single-legacy" | "mismatch";
  rollbackStatus: "prepared-not-active" | "mismatch";
  registrationStatus: "registered" | "mismatch";
  eligibilityStatus: "eligible" | "mismatch";
  readinessStatus: "ready" | "mismatch";
  simulationStatus: "completed" | "mismatch";
  decisionStatus: "completed" | "mismatch";
  planStatus: "completed" | "mismatch";
  pipelineStatus: "completed" | "mismatch";
  transactionStatus: "completed" | "mismatch";
  commitReadinessStatus: "completed" | "mismatch";
  commitProtocolStatus: "completed" | "mismatch";
  stateMachineStatus: "completed" | "mismatch";
};

export type FeedHostActivationGateInput = {
  contract?: ControlledFeedHostContract;
  phase3b2ProofValid?: boolean;
  phase3b2FreezeValid?: boolean;
  phase3b32ProofValid?: boolean;
  phase3b33ProofValid?: boolean;
  phase3b34ProofValid?: boolean;
  phase3b35ProofValid?: boolean;
  phase3b36ProofValid?: boolean;
  phase3b37ProofValid?: boolean;
  phase3b38ProofValid?: boolean;
  phase3b39ProofValid?: boolean;
  phase3b310ProofValid?: boolean;
  phase3b311ProofValid?: boolean;
  phase3b312ProofValid?: boolean;
  phase3b313ProofValid?: boolean;
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
  observedEligibilityState?: "eligible" | "missing";
  observedReadinessState?: "ready" | "missing";
  observedSimulationState?: "completed" | "missing";
  observedDecisionState?: "completed" | "missing";
  observedPlanState?: "completed" | "missing";
  observedPipelineState?: "completed" | "missing";
  observedTransactionState?: "completed" | "missing";
  observedCommitReadinessState?: "completed" | "missing";
  observedCommitProtocolState?: "completed" | "missing";
  observedStateMachineState?: "completed" | "missing";
  observedRuntimeId?: string;
};

export function evaluateFeedHostActivationGate(
  input: FeedHostActivationGateInput = {},
): FeedHostActivationGateResult {
  const contract = input.contract ?? createControlledFeedHostContract();
  const blockers: string[] = [PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY];
  const reasons: string[] = [
    "Phase 3B.3.13 models sealed activation state machine only; hostActivation remains deferred to 3B.3.14",
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

  if (
    input.phase3b32ProofValid === false ||
    input.phase3b33ProofValid === false ||
    input.phase3b34ProofValid === false ||
    input.phase3b35ProofValid === false ||
    input.phase3b36ProofValid === false ||
    input.phase3b37ProofValid === false ||
    input.phase3b38ProofValid === false ||
    input.phase3b39ProofValid === false ||
    input.phase3b310ProofValid === false ||
    input.phase3b311ProofValid === false ||
    input.phase3b312ProofValid === false ||
    input.phase3b313ProofValid === false
  ) {
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

  let eligibilityStatus: FeedHostActivationGateResult["eligibilityStatus"] =
    "eligible";
  if (input.observedEligibilityState === "missing") {
    eligibilityStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let readinessStatus: FeedHostActivationGateResult["readinessStatus"] =
    "ready";
  if (input.observedReadinessState === "missing") {
    readinessStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let simulationStatus: FeedHostActivationGateResult["simulationStatus"] =
    "completed";
  if (input.observedSimulationState === "missing") {
    simulationStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let decisionStatus: FeedHostActivationGateResult["decisionStatus"] =
    "completed";
  if (input.observedDecisionState === "missing") {
    decisionStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let planStatus: FeedHostActivationGateResult["planStatus"] = "completed";
  if (input.observedPlanState === "missing") {
    planStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let pipelineStatus: FeedHostActivationGateResult["pipelineStatus"] =
    "completed";
  if (input.observedPipelineState === "missing") {
    pipelineStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let transactionStatus: FeedHostActivationGateResult["transactionStatus"] =
    "completed";
  if (input.observedTransactionState === "missing") {
    transactionStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let commitReadinessStatus: FeedHostActivationGateResult["commitReadinessStatus"] =
    "completed";
  if (input.observedCommitReadinessState === "missing") {
    commitReadinessStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let commitProtocolStatus: FeedHostActivationGateResult["commitProtocolStatus"] =
    "completed";
  if (input.observedCommitProtocolState === "missing") {
    commitProtocolStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let stateMachineStatus: FeedHostActivationGateResult["stateMachineStatus"] =
    "completed";
  if (input.observedStateMachineState === "missing") {
    stateMachineStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  if (
    typeof input.observedRuntimeId === "string" &&
    input.observedRuntimeId.length > 0 &&
    input.observedRuntimeId !== "feed.discovery.legacy-single-mount.v1"
  ) {
    registrationStatus = "mismatch";
    eligibilityStatus = "mismatch";
    readinessStatus = "mismatch";
    simulationStatus = "mismatch";
    decisionStatus = "mismatch";
    planStatus = "mismatch";
    pipelineStatus = "mismatch";
    transactionStatus = "mismatch";
    commitReadinessStatus = "mismatch";
    commitProtocolStatus = "mismatch";
    stateMachineStatus = "mismatch";
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
    currentStep: "3B.3.13",
    eligibleStep: "3B.3.14",
    reasons,
    blockers: [...new Set(blockers)],
    proofStatus,
    freezeStatus,
    writerStatus,
    renderOwnerStatus,
    mountStatus,
    rollbackStatus,
    registrationStatus,
    eligibilityStatus,
    readinessStatus,
    simulationStatus,
    decisionStatus,
    planStatus,
    pipelineStatus,
    transactionStatus,
    commitReadinessStatus,
    commitProtocolStatus,
    stateMachineStatus,
  };
}
