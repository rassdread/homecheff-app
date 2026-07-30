/**
 * Phase 3B.3.3 — Controlled Host Registration Contract (fail-closed).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_DISCOVERY_CONTROLLED_HOST_ID,
  FEED_DISCOVERY_STABLE_RUNTIME_ID,
  PHASE_3B3_3_HOST_REGISTRATION_ONLY,
  createControlledHostRegistry,
} from "./controlled-host-registry";
import { FEED_SEALED_INVARIANT_IDS } from "./feed-discovery-invariants";

export const CONTROLLED_HOST_REGISTRATION_CONTRACT_SCHEMA_VERSION = 1 as const;

export const CONTROLLED_HOST_REGISTRATION_REQUIREMENTS = [
  "exactly-one-legacy-feed-host",
  "stable-runtime-id",
  "preserve-react-identity",
  "no-remount",
  "no-second-mount",
  "owner-legacy",
  "writer-legacy",
  "renderer-legacy",
  "host-activation-false",
  "render-activation-false",
  "rollback-prepared-not-active",
  "shadow-placement-registered",
  "metadata-only-registry",
  "all-20-release-blocking-invariants",
] as const;

export type ControlledHostRegistrationRequirement =
  (typeof CONTROLLED_HOST_REGISTRATION_REQUIREMENTS)[number];

export type ControlledHostRegistrationContract = {
  schemaVersion: typeof CONTROLLED_HOST_REGISTRATION_CONTRACT_SCHEMA_VERSION;
  phase: "3B.3.3";
  widgetId: "feed.discovery";
  hostId: typeof FEED_DISCOVERY_CONTROLLED_HOST_ID;
  runtimeId: typeof FEED_DISCOVERY_STABLE_RUNTIME_ID;
  registrationState: "registered";
  registrationRequirements: readonly ControlledHostRegistrationRequirement[];
  identityGuarantee: "preserve-existing-react-identity";
  ownershipGuarantee: "legacy-owner-writer-renderer";
  rendererGuarantee: "no-workspace-renderer";
  rollbackGuarantee: "prepared-not-active-legacy-fallback";
  activationRestriction: typeof PHASE_3B3_3_HOST_REGISTRATION_ONLY;
  hostActivation: false;
  renderActivation: false;
  remountAllowed: false;
  secondMountAllowed: false;
  wrapperAllowed: false;
  portalAllowed: false;
  requiredInvariantIds: typeof FEED_SEALED_INVARIANT_IDS;
  nextEligibleStep: "3B.3.4";
};

export function createControlledHostRegistrationContract(): ControlledHostRegistrationContract {
  void createControlledHostRegistry();
  return validateControlledHostRegistrationContract({
    schemaVersion: CONTROLLED_HOST_REGISTRATION_CONTRACT_SCHEMA_VERSION,
    phase: "3B.3.3",
    widgetId: "feed.discovery",
    hostId: FEED_DISCOVERY_CONTROLLED_HOST_ID,
    runtimeId: FEED_DISCOVERY_STABLE_RUNTIME_ID,
    registrationState: "registered",
    registrationRequirements: [...CONTROLLED_HOST_REGISTRATION_REQUIREMENTS],
    identityGuarantee: "preserve-existing-react-identity",
    ownershipGuarantee: "legacy-owner-writer-renderer",
    rendererGuarantee: "no-workspace-renderer",
    rollbackGuarantee: "prepared-not-active-legacy-fallback",
    activationRestriction: PHASE_3B3_3_HOST_REGISTRATION_ONLY,
    hostActivation: false,
    renderActivation: false,
    remountAllowed: false,
    secondMountAllowed: false,
    wrapperAllowed: false,
    portalAllowed: false,
    requiredInvariantIds: FEED_SEALED_INVARIANT_IDS,
    nextEligibleStep: "3B.3.4",
  });
}

export function validateControlledHostRegistrationContract(
  candidate: unknown,
): ControlledHostRegistrationContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_INVALID",
      "Registration contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;
  if (c.schemaVersion !== CONTROLLED_HOST_REGISTRATION_CONTRACT_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_SCHEMA",
      "Unsupported registration schemaVersion",
    );
  }
  if (c.phase !== "3B.3.3" || c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_PHASE",
      "phase must be 3B.3.3 and widgetId feed.discovery",
    );
  }
  if (
    c.hostId !== FEED_DISCOVERY_CONTROLLED_HOST_ID ||
    c.runtimeId !== FEED_DISCOVERY_STABLE_RUNTIME_ID
  ) {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_IDS",
      "hostId/runtimeId must match stable legacy descriptors",
    );
  }
  if (c.registrationState !== "registered") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_STATE",
      "registrationState must be registered",
    );
  }
  if (!Array.isArray(c.registrationRequirements)) {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_REQUIREMENTS",
      "registrationRequirements must be an array",
    );
  }
  for (const req of CONTROLLED_HOST_REGISTRATION_REQUIREMENTS) {
    if (!(c.registrationRequirements as string[]).includes(req)) {
      throw new HardContractViolation(
        "FEED_HOST_REGISTRATION_REQUIREMENT_MISSING",
        `Missing requirement: ${req}`,
      );
    }
  }
  if (c.identityGuarantee !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_IDENTITY",
      "identityGuarantee must preserve existing React identity",
    );
  }
  if (c.ownershipGuarantee !== "legacy-owner-writer-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_OWNERSHIP",
      "ownershipGuarantee must keep legacy owner/writer/renderer",
    );
  }
  if (c.rendererGuarantee !== "no-workspace-renderer") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_RENDERER",
      "rendererGuarantee must forbid workspace renderer",
    );
  }
  if (c.rollbackGuarantee !== "prepared-not-active-legacy-fallback") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_ROLLBACK",
      "rollbackGuarantee must remain prepared-not-active legacy fallback",
    );
  }
  if (c.activationRestriction !== PHASE_3B3_3_HOST_REGISTRATION_ONLY) {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_ACTIVATION",
      "activationRestriction must be PHASE_3B3_3_HOST_REGISTRATION_ONLY",
    );
  }
  if (c.hostActivation !== false || c.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_FLAGS",
      "hostActivation and renderActivation must be false",
    );
  }
  for (const key of [
    "remountAllowed",
    "secondMountAllowed",
    "wrapperAllowed",
    "portalAllowed",
  ] as const) {
    if (c[key] !== false) {
      throw new HardContractViolation(
        "FEED_HOST_REGISTRATION_FORBIDDEN",
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
      "FEED_HOST_REGISTRATION_INVARIANTS",
      "requiredInvariantIds must include all 20 release-blocking IDs",
    );
  }
  if (c.nextEligibleStep !== "3B.3.4") {
    throw new HardContractViolation(
      "FEED_HOST_REGISTRATION_NEXT",
      "nextEligibleStep must be 3B.3.4",
    );
  }
  return c as ControlledHostRegistrationContract;
}
