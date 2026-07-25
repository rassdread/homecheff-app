/**
 * Phase 3B.3.5 — Controlled Host Activation Readiness Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
} from "./controlled-host-registry";
import {
  PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
  evaluateControlledHostActivationReadiness,
} from "./controlled-host-activation-readiness";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA_VERSION =
  1 as const;

export const CONTROLLED_HOST_ACTIVATION_READINESS_REQUIREMENTS = [
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
  "readiness-metadata-only",
  "readiness-diagnostics-readable",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostActivationReadinessRequirement =
  (typeof CONTROLLED_HOST_ACTIVATION_READINESS_REQUIREMENTS)[number];

export type ControlledHostActivationReadinessContract = {
  schemaVersion: typeof CONTROLLED_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.5";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  readinessState: "ready";
  readinessRequirements: readonly ControlledHostActivationReadinessRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY;
  hostActivation: false;
  renderActivation: false;
  canStartActivation: false;
  remountAllowed: false;
  secondMountAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
  executorAllowed: false;
  schedulerAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.6";
};

export function createControlledHostActivationReadinessContract(): ControlledHostActivationReadinessContract {
  void evaluateControlledHostActivationReadiness();
  return validateControlledHostActivationReadinessContract({
    schemaVersion: CONTROLLED_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.5",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    readinessState: "ready",
    readinessRequirements: [
      ...CONTROLLED_HOST_ACTIVATION_READINESS_REQUIREMENTS,
    ],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction: PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY,
    hostActivation: false,
    renderActivation: false,
    canStartActivation: false,
    remountAllowed: false,
    secondMountAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
    executorAllowed: false,
    schedulerAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.6",
  });
}

export function validateControlledHostActivationReadinessContract(
  candidate: unknown,
): ControlledHostActivationReadinessContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_INVALID",
      "Activation readiness contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (
    c.schemaVersion !==
    CONTROLLED_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA_VERSION
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_SCHEMA",
      "Unsupported activation readiness contract schemaVersion",
    );
  }
  if (c.phase !== "3B.3.5" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_PHASE",
      "phase must be 3B.3.5 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_IDS",
      "hostId/runtimeId must match stable legacy descriptors",
    );
  }
  if (c.readinessState !== "ready") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_STATE",
      "readinessState must be ready",
    );
  }
  if (!Array.isArray(c.readinessRequirements)) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_REQUIREMENTS",
      "readinessRequirements must be an array",
    );
  }
  for (const req of CONTROLLED_HOST_ACTIVATION_READINESS_REQUIREMENTS) {
    if (!(c.readinessRequirements as string[]).includes(req)) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_READINESS_CONTRACT_REQUIREMENT_MISSING",
        `Missing requirement: ${req}`,
      );
    }
  }
  if (c.identityGuarantee !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_IDENTITY",
      "identityGuarantee must preserve existing React identity",
    );
  }
  if (c.ownershipGuarantee !== "legacy-owner-writer-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_OWNERSHIP",
      "ownershipGuarantee must keep legacy owner/writer/renderer",
    );
  }
  if (c.rendererGuarantee !== "no-workspace-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_RENDERER",
      "rendererGuarantee must forbid workspace renderer",
    );
  }
  if (c.rollbackGuarantee !== "prepared-not-active-legacy-fallback") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_ROLLBACK",
      "rollbackGuarantee must remain prepared-not-active legacy fallback",
    );
  }
  if (c.activationRestriction !== PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_ACTIVATION",
      "activationRestriction must be PHASE_3B3_5_HOST_ACTIVATION_READINESS_ONLY",
    );
  }
  if (
    c.hostActivation !== false ||
    c.renderActivation !== false ||
    c.canStartActivation !== false
  ) {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_FLAGS",
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
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_ACTIVATION_READINESS_CONTRACT_FORBIDDEN",
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
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_INVARIANTS",
      "requiredInvariantIds must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.6") {
    throw new HardContractViolation(
      "FEED_HOST_ACTIVATION_READINESS_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.6",
    );
  }
  return c as ControlledHostActivationReadinessContract;
}
