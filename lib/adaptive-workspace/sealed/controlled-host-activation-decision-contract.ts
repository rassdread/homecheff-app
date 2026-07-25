/**
 * Phase 3B.3.7 — Controlled Host Activation Decision Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
  evaluateControlledHostActivationDecision,
} from "./controlled-host-activation-decision";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_DECISION_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_DECISION_REQUIREMENTS = [
  "exactly-one-registered-host",
  "stable-runtime-id",
  "preserve-react-identity",
  "owner-legacy",
  "writer-legacy",
  "renderer-legacy",
  "host-activation-false",
  "render-activation-false",
  "can-start-activation-false",
  "rollback-prepared-not-active",
  "registration-registered",
  "placement-shadow-registered",
  "eligibility-eligible",
  "readiness-ready",
  "simulation-completed",
  "decision-metadata-only",
  "decision-diagnostics-readable",
  "deterministic-pure-engine",
  "dry-run-only-no-executor",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationDecisionRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_DECISION_REQUIREMENTS)[number];

export type ControlledHostActivationDecisionContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_DECISION_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.7";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  decisionState: "completed";
  decisionResult: "ALLOW";
  wouldActivate: true;
  confidence: "high";
  decisionRequirements: readonly ControlledHostActivationDecisionRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY;
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
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.8";
};

export function createControlledHostActivationDecisionContract(): ControlledHostActivationDecisionContract {
  void evaluateControlledHostActivationDecision();
  return validateControlledHostActivationDecisionContract({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_DECISION_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.7",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    decisionState: "completed",
    decisionResult: "ALLOW",
    wouldActivate: true,
    confidence: "high",
    decisionRequirements: [...CONTROLLED_HOST_ACTIVATION_DECISION_REQUIREMENTS],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction: PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY,
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
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.8",
  });
}

export function validateControlledHostActivationDecisionContract(
  candidate: unknown,
): ControlledHostActivationDecisionContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_INVALID",
      "Activation decision contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !== CONTROLLED_HOST_ACTIVATION_DECISION_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_SCHEMA",
      "Unsupported activation decision contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.7" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_PHASE",
      "phase must be 3B.3.7 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_IDS",
      "hostId/runtimeId must match stable legacy descriptors",
    );
  }
  if (
    c.decisionState !== "completed" ||
    c.decisionResult !== "ALLOW" ||
    c.wouldActivate !== true ||
    c.confidence !== "high"
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_STATE",
      "decisionState/result/wouldActivate/confidence mismatch",
    );
  }
  if (!Array.isArray(c.decisionRequirements)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_REQUIREMENTS",
      "decisionRequirements must be an array",
    );
  }
  for (const req of CONTROLLED_HOST_ACTIVATION_DECISION_REQUIREMENTS) {
    if (!(c.decisionRequirements as string[]).includes(req)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_DECISION_CONTRACT_REQUIREMENT_MISSING",
        `Missing requirement: ${req}`,
      );
    }
  }
  if (c.identityGuarantee !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_IDENTITY",
      "identityGuarantee must preserve existing React identity",
    );
  }
  if (c.ownershipGuarantee !== "legacy-owner-writer-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_OWNERSHIP",
      "ownershipGuarantee must keep legacy owner/writer/renderer",
    );
  }
  if (c.rendererGuarantee !== "no-workspace-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_RENDERER",
      "rendererGuarantee must forbid workspace renderer",
    );
  }
  if (c.rollbackGuarantee !== "prepared-not-active-legacy-fallback") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_ROLLBACK",
      "rollbackGuarantee must remain prepared-not-active legacy fallback",
    );
  }
  if (c.activationRestriction !== PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_ACTIVATION",
      "activationRestriction must be PHASE_3B3_7_HOST_ACTIVATION_DECISION_ONLY",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_FLAGS",
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
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_DECISION_CONTRACT_FORBIDDEN",
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
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_INVARIANTS",
      "requiredInvariantIds must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.8") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_DECISION_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.8",
    );
  }
  return c as ControlledHostActivationDecisionContract;
}
