/**
 * Phase 3B.3.13 — Controlled Host Activation State Machine Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
  evaluateControlledHostActivationStateMachine,
} from "./controlled-host-activation-state-machine";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_REQUIREMENTS = [
  "exactly-one-registered-host",
  "stable-runtime-id",
  "preserve-react-identity",
  "owner-legacy",
  "writer-legacy",
  "renderer-legacy",
  "host-activation-false",
  "render-activation-false",
  "can-start-activation-false",
  "transaction-committed-false",
  "protocol-executed-false",
  "transition-executed-false",
  "current-state-commit-ready",
  "active-terminal-theoretical-only",
  "rollback-prepared-not-active",
  "state-machine-complete-not-executable",
  "activation-state-machine-metadata-only",
  "activation-state-machine-diagnostics-readable",
  "deterministic-pure-state-machine-engine",
  "state-machine-only-no-executor-no-scheduler",
  "transition-execution-not-authorized",
  "commit-not-authorized",
  "ownership-transfer-not-authorized",
  "writer-transfer-not-authorized",
  "renderer-transfer-not-authorized",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationStateMachineRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_REQUIREMENTS)[number];

export type ControlledHostActivationStateMachineContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.13";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  machineState: "completed";
  machineResult: "state-machine-complete-not-executable";
  currentState: "COMMIT_READY";
  initialState: "LEGACY_DORMANT";
  transitionExecuted: false;
  protocolExecuted: false;
  transactionCommitted: false;
  wouldCommit: true;
  commitReady: true;
  protocolResult: "protocol-complete-not-executable";
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  machineRequirements: readonly ControlledHostActivationStateMachineRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  writerGuarantee: "legacy-writer-unchanged";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  remountAllowed: false;
  secondMountAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  runtimeMutationAllowed: false;
  commitAllowed: false;
  transitionExecutionAllowed: false;
  protocolExecutionAllowed: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.14";
};

export function createControlledHostActivationStateMachineContract(): ControlledHostActivationStateMachineContract {
  void evaluateControlledHostActivationStateMachine();
  return validateControlledHostActivationStateMachineContract({
    schemaVersion:
      CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.13",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    machineState: "completed",
    machineResult: "state-machine-complete-not-executable",
    currentState: "COMMIT_READY",
    initialState: "LEGACY_DORMANT",
    transitionExecuted: false,
    protocolExecuted: false,
    transactionCommitted: false,
    wouldCommit: true,
    commitReady: true,
    protocolResult: "protocol-complete-not-executable",
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    pipelineResult: "pipeline-complete-not-executable",
    wouldActivate: true,
    machineRequirements: [
      ...CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_REQUIREMENTS,
    ],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    writerGuarantee: "legacy-writer-unchanged",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction: PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    remountAllowed: false,
    secondMountAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
    executorAllowed: false,
    schedulerAllowed: false,
    runtimeMutationAllowed: false,
    commitAllowed: false,
    transitionExecutionAllowed: false,
    protocolExecutionAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.14",
  });
}

export function validateControlledHostActivationStateMachineContract(
  candidate: unknown,
): ControlledHostActivationStateMachineContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_INVALID",
      "State machine contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_SCHEMA",
      "Unsupported state machine contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.13" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_PHASE",
      "phase must be 3B.3.13 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_IDS",
      "hostId/runtimeId must match stable legacy descriptors",
    );
  }
  if (
    c.machineState !== "completed" ||
    c.machineResult !== "state-machine-complete-not-executable" ||
    c.currentState !== "COMMIT_READY" ||
    c.initialState !== "LEGACY_DORMANT" ||
    c.transitionExecuted !== false ||
    c.protocolExecuted !== false ||
    c.transactionCommitted !== false ||
    c.wouldCommit !== true ||
    c.commitReady !== true ||
    c.protocolResult !== "protocol-complete-not-executable" ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_STATE",
      "machine/current/transition/protocol/decision mismatch",
    );
  }
  if (!Array.isArray(c.machineRequirements)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_REQUIREMENTS",
      "machineRequirements must be an array",
    );
  }
  for (const req of CONTROLLED_HOST_ACTIVATION_STATE_MACHINE_REQUIREMENTS) {
    if (!(c.machineRequirements as string[]).includes(req)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_REQUIREMENT_MISSING",
        `Missing requirement: ${req}`,
      );
    }
  }
  if (c.identityGuarantee !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_IDENTITY",
      "identityGuarantee must preserve existing React identity",
    );
  }
  if (c.ownershipGuarantee !== "legacy-owner-writer-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_OWNERSHIP",
      "ownershipGuarantee must keep legacy owner/writer/renderer",
    );
  }
  if (c.rendererGuarantee !== "no-workspace-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_RENDERER",
      "rendererGuarantee must forbid workspace renderer",
    );
  }
  if (c.writerGuarantee !== "legacy-writer-unchanged") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_WRITER",
      "writerGuarantee must keep legacy writer unchanged",
    );
  }
  if (c.rollbackGuarantee !== "prepared-not-active-legacy-fallback") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_ROLLBACK",
      "rollbackGuarantee must remain prepared-not-active legacy fallback",
    );
  }
  if (
    c.activationRestriction !== PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_ACTIVATION",
      "activationRestriction must be PHASE_3B3_13_HOST_ACTIVATION_STATE_MACHINE_ONLY",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_FLAGS",
      "activation flags must remain false",
    );
  }
  for (const key of [
    "remountAllowed",
    "secondMountAllowed",
    "wrapperAllowed",
    "portalAllowed",
    "executorAllowed",
    "schedulerAllowed",
    "runtimeMutationAllowed",
    "commitAllowed",
    "transitionExecutionAllowed",
    "protocolExecutionAllowed",
    "ownershipTransferAllowed",
    "writerTransferAllowed",
    "rendererTransferAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_FORBIDDEN",
        `${key} must be false`,
      );
    }
  }
  if (
    !Array.isArray(c.requiredInvariantIds) ||
    (c.requiredInvariantIds as string[]).length !==
      FEED_SEALED_INVARIANT_IDS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_INVARIANTS",
      "requiredInvariantIds must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.14") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_STATE_MACHINE_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.14",
    );
  }
  return c as ControlledHostActivationStateMachineContract;
}
