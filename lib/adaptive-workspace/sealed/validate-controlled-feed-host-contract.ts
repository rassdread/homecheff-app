/**
 * Fail-closed validation for Controlled Feed Host contracts (Phase 3B.3.1).
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_SEALED_INVARIANT_IDS,
  type FeedSealedInvariantId,
} from "./feed-discovery-invariants";
import {
  CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS,
  CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES,
  CONTROLLED_FEED_HOST_CONTRACT_SCHEMA_VERSION,
  type ControlledFeedHostContract,
} from "./controlled-feed-host-types";

function isPlainSerializable(value: unknown): boolean {
  if (value === null) return true;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return true;
  if (t === "function" || t === "symbol" || t === "bigint") return false;
  if (Array.isArray(value)) return value.every(isPlainSerializable);
  if (t === "object") {
    if (Object.getPrototypeOf(value) !== Object.prototype) return false;
    return Object.values(value as Record<string, unknown>).every(
      isPlainSerializable,
    );
  }
  return false;
}

export function validateControlledFeedHostContract(
  candidate: unknown,
): ControlledFeedHostContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_INVALID",
      "Controlled Feed Host contract must be a plain object",
    );
  }
  const c = candidate as Record<string, unknown>;

  if (c.schemaVersion !== CONTROLLED_FEED_HOST_CONTRACT_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_SCHEMA",
      "Unsupported controlled host schemaVersion",
    );
  }
  if (c.widgetId !== "feed.discovery") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_WIDGET",
      "widgetId must be feed.discovery",
    );
  }
  if (c.runtimeClassification !== "sealed-runtime") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_RUNTIME",
      "runtimeClassification must be sealed-runtime",
    );
  }
  if (c.hostClassification !== "controlled-host-candidate") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_HOST_CLASS",
      "hostClassification must be controlled-host-candidate",
    );
  }
  if (c.hostVersion !== 1) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_VERSION",
      "hostVersion must be 1",
    );
  }
  if (c.activeRenderOwner !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_RENDER_OWNER",
      "activeRenderOwner must be legacy through Phase 3B.3.2",
    );
  }
  if (c.activeWriter !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_WRITER",
      "activeWriter must be legacy through Phase 3B.3.2",
    );
  }
  if (c.hostActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_HOST_ACTIVATION",
      "hostActivation must be false through Phase 3B.3.2",
    );
  }
  if (c.renderActivation !== false) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_RENDER_ACTIVATION",
      "renderActivation must be false through Phase 3B.3.2",
    );
  }
  if (c.shadowActivation !== true) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_SHADOW",
      "shadowActivation must be true",
    );
  }
  if (c.mountingStrategy !== "reuse-existing-single-mount-only") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_MOUNT",
      "mountingStrategy must reuse existing single mount only",
    );
  }
  if (c.identityStrategy !== "preserve-existing-react-identity") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_IDENTITY",
      "identityStrategy must preserve existing React identity",
    );
  }
  if (c.rollbackStrategy !== "immediate-legacy-fallback") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_ROLLBACK",
      "rollbackStrategy must be immediate-legacy-fallback",
    );
  }
  if (c.fallbackOwner !== "legacy") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_FALLBACK",
      "fallbackOwner must be legacy",
    );
  }
  if (c.childPolicy !== "no-child-while-dormant") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_CHILD",
      "childPolicy must disallow dormant child rendering",
    );
  }
  if (c.wrapperPolicy !== "no-visible-wrapper") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_WRAPPER",
      "wrapperPolicy must disallow visible wrappers",
    );
  }
  if (c.DOMPolicy !== "zero-visible-dom-delta") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_DOM",
      "DOMPolicy must require zero visible DOM delta",
    );
  }
  for (const b of [
    "stateBoundary",
    "requestBoundary",
    "observerBoundary",
    "scrollBoundary",
    "cacheBoundary",
  ] as const) {
    const expected =
      b === "stateBoundary" ? "opaque" : "owned-by-feed";
    if (c[b] !== expected) {
      throw new HardContractViolation(
        "FEED_HOST_CONTRACT_BOUNDARY",
        `${b} must be ${expected}`,
      );
    }
  }
  if (c.browserProofRequirement !== "phase3b2-frozen-proof-required") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_PROOF_REQ",
      "browserProofRequirement must be phase3b2-frozen-proof-required",
    );
  }
  if (c.freezeRequirement !== "phase3b2-freeze-required") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_FREEZE_REQ",
      "freezeRequirement must be phase3b2-freeze-required",
    );
  }
  if (c.nextEligibleStep !== "3B.3.41") {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_NEXT",
      "nextEligibleStep must be 3B.3.41",
    );
  }

  if (!Array.isArray(c.activationPrerequisites)) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_PREREQS",
      "activationPrerequisites must be an array",
    );
  }
  for (const p of CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES) {
    if (!(c.activationPrerequisites as string[]).includes(p)) {
      throw new HardContractViolation(
        "FEED_HOST_CONTRACT_PREREQ_MISSING",
        `Missing prerequisite: ${p}`,
      );
    }
  }

  if (!Array.isArray(c.activationBlockers)) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_BLOCKERS",
      "activationBlockers must be an array",
    );
  }
  for (const b of CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS) {
    if (!(c.activationBlockers as string[]).includes(b)) {
      throw new HardContractViolation(
        "FEED_HOST_CONTRACT_BLOCKER_MISSING",
        `Missing blocker category: ${b}`,
      );
    }
  }

  if (!Array.isArray(c.requiredInvariantIds)) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_INVARIANTS",
      "requiredInvariantIds must be an array",
    );
  }
  if (
    (c.requiredInvariantIds as string[]).length !==
    FEED_SEALED_INVARIANT_IDS.length
  ) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_INVARIANTS_COUNT",
      "requiredInvariantIds must include all 20 release-blocking IDs",
    );
  }
  for (const id of FEED_SEALED_INVARIANT_IDS) {
    if (!(c.requiredInvariantIds as string[]).includes(id)) {
      throw new HardContractViolation(
        "FEED_HOST_CONTRACT_INVARIANT_MISSING",
        `Missing invariant: ${id}`,
      );
    }
  }

  if (!isPlainSerializable(candidate)) {
    throw new HardContractViolation(
      "FEED_HOST_CONTRACT_NOT_SERIALIZABLE",
      "Contract must be JSON-serializable plain data",
    );
  }

  return {
    schemaVersion: CONTROLLED_FEED_HOST_CONTRACT_SCHEMA_VERSION,
    widgetId: "feed.discovery",
    runtimeClassification: "sealed-runtime",
    hostClassification: "controlled-host-candidate",
    hostVersion: 1,
    activeRenderOwner: "legacy",
    activeWriter: "legacy",
    hostActivation: false,
    renderActivation: false,
    shadowActivation: true,
    mountingStrategy: "reuse-existing-single-mount-only",
    identityStrategy: "preserve-existing-react-identity",
    rollbackStrategy: "immediate-legacy-fallback",
    fallbackOwner: "legacy",
    childPolicy: "no-child-while-dormant",
    wrapperPolicy: "no-visible-wrapper",
    DOMPolicy: "zero-visible-dom-delta",
    stateBoundary: "opaque",
    requestBoundary: "owned-by-feed",
    observerBoundary: "owned-by-feed",
    scrollBoundary: "owned-by-feed",
    cacheBoundary: "owned-by-feed",
    activationPrerequisites: [
      ...CONTROLLED_FEED_HOST_ACTIVATION_PREREQUISITES,
    ],
    activationBlockers: [...CONTROLLED_FEED_HOST_ACTIVATION_BLOCKERS],
    requiredInvariantIds: [
      ...(c.requiredInvariantIds as FeedSealedInvariantId[]),
    ],
    browserProofRequirement: "phase3b2-frozen-proof-required",
    freezeRequirement: "phase3b2-freeze-required",
    nextEligibleStep: "3B.3.41",
  };
}
