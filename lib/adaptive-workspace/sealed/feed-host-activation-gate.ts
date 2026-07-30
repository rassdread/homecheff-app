/**
 * AW-R2 — pure host activation gate.
 * LIVE is authorized in metadata, but execution remains blocked.
 */

import type { ControlledFeedHostContract } from "./controlled-feed-host-types";
import { createControlledFeedHostContract } from "./create-controlled-feed-host-contract";
import { PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY } from "./controlled-host-activation-transition-preflight";
import { PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY } from "./controlled-host-activation-transition-authorization-decision";
import { PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY } from "./controlled-host-activation-transition-authorization-grant-readiness";
import { PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY } from "./controlled-host-activation-transition-authorization-grant-issuance-decision";
import { PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY } from "./controlled-host-activation-transition-authorization-grant-issuance-plan";
import { PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY } from "./controlled-host-activation-transition-authorization-grant-issuance-pipeline";
import { PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY } from "./controlled-host-activation-transition-authorization-grant-issuance-transaction";
import { PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY } from "./controlled-host-activation-transition-authorization-grant-issuance-commit-boundary";
import { PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY } from "./controlled-workspace-host-candidate-registration";
import { PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY } from "./controlled-workspace-host-candidate-selection";
import { PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY } from "./controlled-workspace-host-activation-readiness";
import { PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY } from "./controlled-workspace-host-activation-authorization";
import { PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY } from "./controlled-workspace-host-activation-grant-issuance";
import { PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY } from "./controlled-workspace-host-activation-commit-boundary-entry";
import { PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY } from "./controlled-workspace-host-activation-transaction-opening-readiness";
import { PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY } from "./controlled-workspace-host-activation-transaction-opening-authorization";
import { PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY } from "./controlled-workspace-host-activation-transaction-opening";
import { PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY } from "./controlled-workspace-host-activation-transaction-preparation-readiness";
import { PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY } from "./controlled-workspace-host-activation-transaction-preparation-authorization";
import { PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY } from "./controlled-workspace-host-activation-transaction-preparation";
import { PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY } from "./controlled-workspace-host-activation-transaction-commit-readiness";
import { PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY } from "./controlled-workspace-host-activation-transaction-commit-authorization";
import { PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY } from "./controlled-workspace-host-activation-transaction-commit";
import { PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY } from "./controlled-workspace-host-activation-issuance-pipeline-execution-readiness";
import { PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY } from "./controlled-workspace-host-activation-issuance-pipeline-execution-authorization";
import { PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY } from "./controlled-workspace-host-activation-issuance-pipeline-execution";
import { PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY } from "./controlled-workspace-host-candidate-activation-readiness";
import { PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY } from "./controlled-workspace-host-candidate-activation-authorization";
import { PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY } from "./controlled-workspace-host-candidate-activation";
import { PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY } from "./controlled-workspace-host-candidate-active";
import { PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY } from "./controlled-workspace-host-candidate-executable";
import { PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY } from "./controlled-workspace-host-candidate-execution-started";
import { PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY } from "./controlled-workspace-host-candidate-pre-activation-seal";
import { PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY } from "./controlled-workspace-live-authorization";

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
export { PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY } from "./controlled-host-activation-state-machine";
export { PHASE_3B3_14_HOST_ACTIVATION_TRANSITION_GRAPH_ONLY } from "./controlled-host-activation-transition-graph";
export { PHASE_3B3_15_HOST_ACTIVATION_TRANSITION_SELECTION_ONLY } from "./controlled-host-activation-transition-selection";
export { PHASE_3B3_16_HOST_ACTIVATION_TRANSITION_PREFLIGHT_ONLY };
export { PHASE_3B3_17_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_DECISION_ONLY };
export { PHASE_3B3_18_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_READINESS_ONLY };
export { PHASE_3B3_19_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_DECISION_ONLY };
export { PHASE_3B3_20_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PLAN_ONLY };
export { PHASE_3B3_21_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_PIPELINE_ONLY };
export { PHASE_3B3_22_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_TRANSACTION_ONLY };
export { PHASE_3B3_23_HOST_ACTIVATION_TRANSITION_AUTHORIZATION_GRANT_ISSUANCE_COMMIT_BOUNDARY_ONLY };
export { PHASE_3B3_24_CONTROLLED_WORKSPACE_HOST_CANDIDATE_REGISTRATION_ONLY };
export { PHASE_3B3_25_CONTROLLED_WORKSPACE_HOST_CANDIDATE_SELECTION_ONLY };
export { PHASE_3B3_26_CONTROLLED_WORKSPACE_HOST_ACTIVATION_READINESS_ONLY };
export { PHASE_3B3_27_CONTROLLED_WORKSPACE_HOST_ACTIVATION_AUTHORIZATION_ONLY };
export { PHASE_3B3_28_CONTROLLED_WORKSPACE_HOST_ACTIVATION_GRANT_ISSUANCE_ONLY };
export { PHASE_3B3_29_CONTROLLED_WORKSPACE_HOST_ACTIVATION_COMMIT_BOUNDARY_ENTRY_ONLY };
export { PHASE_3B3_30_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_READINESS_ONLY };
export { PHASE_3B3_31_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_AUTHORIZATION_ONLY };
export { PHASE_3B3_32_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_OPENING_ONLY };
export { PHASE_3B3_33_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_READINESS_ONLY };
export { PHASE_3B3_34_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_AUTHORIZATION_ONLY };
export { PHASE_3B3_35_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_PREPARATION_ONLY };
export { PHASE_3B3_36_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_READINESS_ONLY };
export { PHASE_3B3_37_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_AUTHORIZATION_ONLY };
export { PHASE_3B3_38_CONTROLLED_WORKSPACE_HOST_ACTIVATION_TRANSACTION_COMMIT_ONLY };
export { PHASE_3B3_39_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_READINESS_ONLY };
export { PHASE_3B3_40_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_AUTHORIZATION_ONLY };
export { PHASE_3B3_41_CONTROLLED_WORKSPACE_HOST_ACTIVATION_ISSUANCE_PIPELINE_EXECUTION_ONLY };
export { PHASE_3B3_42_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_READINESS_ONLY };
export { PHASE_3B3_43_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_AUTHORIZATION_ONLY };
export { PHASE_3B3_44_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVATION_ONLY };
export { PHASE_3B3_45_CONTROLLED_WORKSPACE_HOST_CANDIDATE_ACTIVE_ONLY }
export { PHASE_3B3_46_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTABLE_ONLY };
export { PHASE_3B3_47_CONTROLLED_WORKSPACE_HOST_CANDIDATE_EXECUTION_STARTED_ONLY };
export { PHASE_AW_R1_FINAL_PRE_ACTIVATION_SEAL_ONLY };
export { PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY };

export type FeedHostActivationGateResult = {
  allowed: false;
  currentStep: "AW-R2";
  eligibleStep: "AW-R3";
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
  transitionGraphStatus: "completed" | "mismatch";
  transitionSelectionStatus: "completed" | "mismatch";
  transitionPreflightStatus: "completed" | "mismatch";
  transitionAuthorizationDecisionStatus: "completed" | "mismatch";
  transitionAuthorizationGrantReadinessStatus: "completed" | "mismatch";
  transitionAuthorizationGrantIssuanceDecisionStatus: "completed" | "mismatch";
  transitionAuthorizationGrantIssuancePlanStatus: "completed" | "mismatch";
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
  phase3b314ProofValid?: boolean;
  phase3b315ProofValid?: boolean;
  phase3b316ProofValid?: boolean;
  phase3b317ProofValid?: boolean;
  phase3b318ProofValid?: boolean;
  phase3b319ProofValid?: boolean;
  phase3b320ProofValid?: boolean;
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
  observedTransitionGraphState?: "completed" | "missing";
  observedTransitionSelectionState?: "completed" | "missing";
  observedTransitionPreflightState?: "completed" | "missing";
  observedTransitionAuthorizationDecisionState?: "completed" | "missing";
  observedTransitionAuthorizationGrantReadinessState?: "completed" | "missing";
  observedTransitionAuthorizationGrantIssuanceDecisionState?:
    | "completed"
    | "missing";
  observedTransitionAuthorizationGrantIssuancePlanState?:
    | "completed"
    | "missing";
  observedRuntimeId?: string;
};

export function evaluateFeedHostActivationGate(
  input: FeedHostActivationGateInput = {},
): FeedHostActivationGateResult {
  const contract = input.contract ?? createControlledFeedHostContract();
  const blockers: string[] = [
    PHASE_AW_R2_CONTROLLED_LIVE_AUTHORIZATION_ONLY,
  ];
  const reasons: string[] = [
    "AW-R2 authorizes LIVE Allowed metadata only; execution, runtime and Workspace remain deferred to AW-R3+",
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
    input.phase3b313ProofValid === false ||
    input.phase3b314ProofValid === false ||
    input.phase3b315ProofValid === false ||
    input.phase3b316ProofValid === false ||
    input.phase3b317ProofValid === false ||
    input.phase3b318ProofValid === false ||
    input.phase3b319ProofValid === false ||
    input.phase3b320ProofValid === false
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

  let transitionGraphStatus: FeedHostActivationGateResult["transitionGraphStatus"] =
    "completed";
  if (input.observedTransitionGraphState === "missing") {
    transitionGraphStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let transitionSelectionStatus: FeedHostActivationGateResult["transitionSelectionStatus"] =
    "completed";
  if (input.observedTransitionSelectionState === "missing") {
    transitionSelectionStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let transitionPreflightStatus: FeedHostActivationGateResult["transitionPreflightStatus"] =
    "completed";
  if (input.observedTransitionPreflightState === "missing") {
    transitionPreflightStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let transitionAuthorizationDecisionStatus: FeedHostActivationGateResult["transitionAuthorizationDecisionStatus"] =
    "completed";
  if (input.observedTransitionAuthorizationDecisionState === "missing") {
    transitionAuthorizationDecisionStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let transitionAuthorizationGrantReadinessStatus: FeedHostActivationGateResult["transitionAuthorizationGrantReadinessStatus"] =
    "completed";
  if (input.observedTransitionAuthorizationGrantReadinessState === "missing") {
    transitionAuthorizationGrantReadinessStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let transitionAuthorizationGrantIssuanceDecisionStatus: FeedHostActivationGateResult["transitionAuthorizationGrantIssuanceDecisionStatus"] =
    "completed";
  if (
    input.observedTransitionAuthorizationGrantIssuanceDecisionState ===
    "missing"
  ) {
    transitionAuthorizationGrantIssuanceDecisionStatus = "mismatch";
    blockers.push("react-identity-changed");
  }

  let transitionAuthorizationGrantIssuancePlanStatus: FeedHostActivationGateResult["transitionAuthorizationGrantIssuancePlanStatus"] =
    "completed";
  if (
    input.observedTransitionAuthorizationGrantIssuancePlanState === "missing"
  ) {
    transitionAuthorizationGrantIssuancePlanStatus = "mismatch";
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
    transitionGraphStatus = "mismatch";
    transitionSelectionStatus = "mismatch";
    transitionPreflightStatus = "mismatch";
    transitionAuthorizationDecisionStatus = "mismatch";
    transitionAuthorizationGrantReadinessStatus = "mismatch";
    transitionAuthorizationGrantIssuanceDecisionStatus = "mismatch";
    transitionAuthorizationGrantIssuancePlanStatus = "mismatch";
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
    currentStep: "AW-R2",
    eligibleStep: "AW-R3",
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
    transitionGraphStatus,
    transitionSelectionStatus,
    transitionPreflightStatus,
    transitionAuthorizationDecisionStatus,
    transitionAuthorizationGrantReadinessStatus,
    transitionAuthorizationGrantIssuanceDecisionStatus,
    transitionAuthorizationGrantIssuancePlanStatus,
  };
}
