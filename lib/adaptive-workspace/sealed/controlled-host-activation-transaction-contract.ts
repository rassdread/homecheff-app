/**
 * Phase 3B.3.10 — Controlled Host Activation Transaction Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
  evaluateControlledHostActivationTransaction,
} from "./controlled-host-activation-transaction";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_TRANSACTION_REQUIREMENTS = [
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
  "rollback-prepared-not-active",
  "registration-registered",
  "placement-shadow-registered",
  "eligibility-eligible",
  "readiness-ready",
  "simulation-completed",
  "decision-allow",
  "plan-complete-not-executable",
  "pipeline-complete-not-executable",
  "activation-transaction-metadata-only",
  "activation-transaction-diagnostics-readable",
  "deterministic-pure-transaction-engine",
  "transaction-only-no-executor-no-scheduler",
  "commit-not-authorized",
  "rollback-execution-not-authorized",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationTransactionRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_REQUIREMENTS)[number];

export type ControlledHostActivationTransactionContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_TRANSACTION_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.10";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  transactionState: "completed";
  transactionResult: "transaction-complete-not-committed";
  wouldCommit: true;
  transactionCommitted: false;
  decisionResult: "ALLOW";
  planResult: "plan-complete-not-executable";
  pipelineResult: "pipeline-complete-not-executable";
  wouldActivate: true;
  transactionRequirements: readonly ControlledHostActivationTransactionRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY;
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
  rollbackExecutionAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.11";
};

export function createControlledHostActivationTransactionContract(): ControlledHostActivationTransactionContract {
  void evaluateControlledHostActivationTransaction();
  return validateControlledHostActivationTransactionContract({
    schemaVersion:
      CONTROLLED_HOST_ACTIVATION_TRANSACTION_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.10",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    transactionState: "completed",
    transactionResult: "transaction-complete-not-committed",
    wouldCommit: true,
    transactionCommitted: false,
    decisionResult: "ALLOW",
    planResult: "plan-complete-not-executable",
    pipelineResult: "pipeline-complete-not-executable",
    wouldActivate: true,
    transactionRequirements: [
      ...CONTROLLED_HOST_ACTIVATION_TRANSACTION_REQUIREMENTS,
    ],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction: PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY,
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
    rollbackExecutionAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.11",
  });
}

export function validateControlledHostActivationTransactionContract(
  candidate: unknown,
): ControlledHostActivationTransactionContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_INVALID",
      "Activation transaction contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_TRANSACTION_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_SCHEMA",
      "Unsupported activation transaction contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.10" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_PHASE",
      "phase must be 3B.3.10 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_IDS",
      "hostId/runtimeId must match stable legacy descriptors",
    );
  }
  if (
    c.transactionState !== "completed" ||
    c.transactionResult !== "transaction-complete-not-committed" ||
    c.wouldCommit !== true ||
    c.transactionCommitted !== false ||
    c.decisionResult !== "ALLOW" ||
    c.planResult !== "plan-complete-not-executable" ||
    c.pipelineResult !== "pipeline-complete-not-executable" ||
    c.wouldActivate !== true
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_STATE",
      "transaction/commit/decision/plan/pipeline mismatch",
    );
  }
  if (!Array.isArray(c.transactionRequirements)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_REQUIREMENTS",
      "transactionRequirements must be an array",
    );
  }
  for (const req of CONTROLLED_HOST_ACTIVATION_TRANSACTION_REQUIREMENTS) {
    if (!(c.transactionRequirements as string[]).includes(req)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_REQUIREMENT_MISSING",
        `Missing requirement: ${req}`,
      );
    }
  }
  if (c.identityGuarantee !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_IDENTITY",
      "identityGuarantee must preserve existing React identity",
    );
  }
  if (c.ownershipGuarantee !== "legacy-owner-writer-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_OWNERSHIP",
      "ownershipGuarantee must keep legacy owner/writer/renderer",
    );
  }
  if (c.rendererGuarantee !== "no-workspace-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_RENDERER",
      "rendererGuarantee must forbid workspace renderer",
    );
  }
  if (c.rollbackGuarantee !== "prepared-not-active-legacy-fallback") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_ROLLBACK",
      "rollbackGuarantee must remain prepared-not-active legacy fallback",
    );
  }
  if (
    c.activationRestriction !== PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_ACTIVATION",
      "activationRestriction must be PHASE_3B3_10_HOST_ACTIVATION_TRANSACTION_ONLY",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false ||
    c.transactionCommitted !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_FLAGS",
      "activation flags and transactionCommitted must remain false",
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
    "rollbackExecutionAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_FORBIDDEN",
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
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_INVARIANTS",
      "requiredInvariantIds must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.11") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_TRANSACTION_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.11",
    );
  }
  return c as ControlledHostActivationTransactionContract;
}
