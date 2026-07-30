/**
 * Phase 3B.3.12 — Controlled Host Activation Commit Protocol Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
  evaluateControlledHostActivationCommitProtocol,
} from "./controlled-host-activation-commit-protocol";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_REQUIREMENTS = [
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
  "commit-executed-false",
  "protocol-executed-false",
  "ownership-transferred-false",
  "writer-transferred-false",
  "renderer-transferred-false",
  "rollback-prepared-not-active",
  "commit-ready-true",
  "would-commit-true",
  "protocol-complete-not-executable",
  "activation-commit-protocol-metadata-only",
  "activation-commit-protocol-diagnostics-readable",
  "deterministic-pure-commit-protocol-engine",
  "protocol-only-no-executor-no-scheduler",
  "commit-not-authorized",
  "protocol-execution-not-authorized",
  "ownership-transfer-not-authorized",
  "writer-transfer-not-authorized",
  "renderer-transfer-not-authorized",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationCommitProtocolRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_REQUIREMENTS)[number];

export type ControlledHostActivationCommitProtocolContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.12";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  protocolState: "completed";
  protocolResult: "protocol-complete-not-executable";
  protocolExecuted: false;
  wouldCommit: true;
  commitReady: true;
  commitBlocked: true;
  readinessResult: "commit-ready-not-executable";
  transactionResult: "transaction-complete-not-committed";
  transactionCommitted: false;
  commitExecuted: false;
  ownershipTransferred: false;
  writerTransferred: false;
  rendererTransferred: false;
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  protocolRequirements: readonly ControlledHostActivationCommitProtocolRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  writerGuarantee: "legacy-writer-unchanged";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY;
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
  protocolExecutionAllowed: false;
  ownershipTransferAllowed: false;
  writerTransferAllowed: false;
  rendererTransferAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.13";
};

export function createControlledHostActivationCommitProtocolContract(): ControlledHostActivationCommitProtocolContract {
  void evaluateControlledHostActivationCommitProtocol();
  return validateControlledHostActivationCommitProtocolContract({
    schemaVersion:
      CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.12",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    protocolState: "completed",
    protocolResult: "protocol-complete-not-executable",
    protocolExecuted: false,
    wouldCommit: true,
    commitReady: true,
    commitBlocked: true,
    readinessResult: "commit-ready-not-executable",
    transactionResult: "transaction-complete-not-committed",
    transactionCommitted: false,
    commitExecuted: false,
    ownershipTransferred: false,
    writerTransferred: false,
    rendererTransferred: false,
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    pipelineResult: "pipeline-complete-not-executable",
    wouldActivate: true,
    protocolRequirements: [
      ...CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_REQUIREMENTS,
    ],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    writerGuarantee: "legacy-writer-unchanged",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction: PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY,
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
    protocolExecutionAllowed: false,
    ownershipTransferAllowed: false,
    writerTransferAllowed: false,
    rendererTransferAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.13",
  });
}

export function validateControlledHostActivationCommitProtocolContract(
  candidate: unknown,
): ControlledHostActivationCommitProtocolContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_INVALID",
      "Commit protocol contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_SCHEMA",
      "Unsupported commit protocol contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.12" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_PHASE",
      "phase must be 3B.3.12 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_IDS",
      "hostId/runtimeId must match stable legacy descriptors",
    );
  }
  if (
    c.protocolState !== "completed" ||
    c.protocolResult !== "protocol-complete-not-executable" ||
    c.protocolExecuted !== false ||
    c.wouldCommit !== true ||
    c.commitReady !== true ||
    c.commitBlocked !== true ||
    c.readinessResult !== "commit-ready-not-executable" ||
    c.transactionResult !== "transaction-complete-not-committed" ||
    c.transactionCommitted !== false ||
    c.commitExecuted !== false ||
    c.ownershipTransferred !== false ||
    c.writerTransferred !== false ||
    c.rendererTransferred !== false ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_STATE",
      "protocol/commit/readiness/transaction/decision/plan/pipeline mismatch",
    );
  }
  if (!Array.isArray(c.protocolRequirements)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_REQUIREMENTS",
      "protocolRequirements must be an array",
    );
  }
  for (const req of CONTROLLED_HOST_ACTIVATION_COMMIT_PROTOCOL_REQUIREMENTS) {
    if (!(c.protocolRequirements as string[]).includes(req)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_REQUIREMENT_MISSING",
        `Missing requirement: ${req}`,
      );
    }
  }
  if (c.identityGuarantee !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_IDENTITY",
      "identityGuarantee must preserve existing React identity",
    );
  }
  if (c.ownershipGuarantee !== "legacy-owner-writer-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_OWNERSHIP",
      "ownershipGuarantee must keep legacy owner/writer/renderer",
    );
  }
  if (c.rendererGuarantee !== "no-workspace-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_RENDERER",
      "rendererGuarantee must forbid workspace renderer",
    );
  }
  if (c.writerGuarantee !== "legacy-writer-unchanged") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_WRITER",
      "writerGuarantee must keep legacy writer unchanged",
    );
  }
  if (c.rollbackGuarantee !== "prepared-not-active-legacy-fallback") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_ROLLBACK",
      "rollbackGuarantee must remain prepared-not-active legacy fallback",
    );
  }
  if (
    c.activationRestriction !== PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_ACTIVATION",
      "activationRestriction must be PHASE_3B3_12_HOST_ACTIVATION_COMMIT_PROTOCOL_ONLY",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_FLAGS",
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
    "protocolExecutionAllowed",
    "ownershipTransferAllowed",
    "writerTransferAllowed",
    "rendererTransferAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_FORBIDDEN",
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
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_INVARIANTS",
      "requiredInvariantIds must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.13") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_COMMIT_PROTOCOL_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.13",
    );
  }
  return c as ControlledHostActivationCommitProtocolContract;
}
