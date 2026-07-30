/**
 * Fail-closed validation for sealed runtime contracts.
 */

import { HardContractViolation } from "../schema/validation-error";
import {
  FEED_SEALED_INVARIANT_IDS,
  type FeedSealedInvariantId,
} from "./feed-discovery-invariants";
import {
  SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION,
  SEALED_WORKSPACE_CAPABILITIES,
  SEALED_WORKSPACE_PROHIBITIONS,
  type SealedRuntimeContract,
  type SealedWorkspaceCapability,
  type SealedWorkspaceProhibition,
} from "./sealed-runtime-types";

const CAP_SET = new Set<string>(SEALED_WORKSPACE_CAPABILITIES);
const PROHIBITION_SET = new Set<string>(SEALED_WORKSPACE_PROHIBITIONS);
const INVARIANT_SET = new Set<string>(FEED_SEALED_INVARIANT_IDS);

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

/**
 * Validates a sealed-runtime contract. Throws HardContractViolation on any
 * invalid shape or activation that would allow Workspace to render/write.
 */
export function validateSealedRuntimeContract(
  candidate: unknown,
): SealedRuntimeContract {
  if (candidate === null || typeof candidate !== "object") {
    throw new HardContractViolation(
      "SEALED_CONTRACT_INVALID",
      "Sealed runtime contract must be a plain object",
    );
  }

  const c = candidate as Record<string, unknown>;

  if (c.schemaVersion !== SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_SCHEMA",
      "Unsupported sealed runtime schemaVersion",
      { schemaVersion: c.schemaVersion },
    );
  }

  if (typeof c.widgetId !== "string" || c.widgetId.length === 0) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_WIDGET_ID",
      "widgetId must be a non-empty string",
    );
  }

  if (c.runtimeClassification !== "sealed-runtime") {
    throw new HardContractViolation(
      "SEALED_CONTRACT_CLASSIFICATION",
      "runtimeClassification must be sealed-runtime",
    );
  }

  if (c.owner !== "legacy-feed-runtime") {
    throw new HardContractViolation(
      "SEALED_CONTRACT_OWNER",
      "owner must be legacy-feed-runtime for Feed sealed contracts",
    );
  }

  if (c.renderActivation !== false) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_RENDER_ACTIVATION",
      "sealed runtime renderActivation must be false",
    );
  }

  if (c.shadowActivation !== true) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_SHADOW_ACTIVATION",
      "sealed runtime shadowActivation must be true in Phase 3B.1",
    );
  }

  if (c.activeWriter !== "legacy") {
    throw new HardContractViolation(
      "SEALED_CONTRACT_WRITER",
      "activeWriter must be legacy for sealed Feed runtime",
    );
  }

  if (c.mountPolicy !== "single-stable-mount") {
    throw new HardContractViolation(
      "SEALED_CONTRACT_MOUNT_POLICY",
      "mountPolicy must be single-stable-mount",
    );
  }

  if (c.stateBoundary !== "opaque") {
    throw new HardContractViolation(
      "SEALED_CONTRACT_STATE_BOUNDARY",
      "stateBoundary must be opaque",
    );
  }

  if (c.requestBoundary !== "owned-by-widget") {
    throw new HardContractViolation(
      "SEALED_CONTRACT_REQUEST_BOUNDARY",
      "requestBoundary must be owned-by-widget",
    );
  }

  if (
    c.observerBoundary !== "owned-by-widget" &&
    c.observerBoundary !==
      "owned-by-widget-except-existing-platform-measurement"
  ) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_OBSERVER_BOUNDARY",
      "observerBoundary invalid",
    );
  }

  if (c.scrollBoundary !== "owned-by-widget") {
    throw new HardContractViolation(
      "SEALED_CONTRACT_SCROLL_BOUNDARY",
      "scrollBoundary must be owned-by-widget",
    );
  }

  if (!Array.isArray(c.permittedWorkspaceCapabilities)) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_CAPABILITIES",
      "permittedWorkspaceCapabilities must be an array",
    );
  }

  for (const cap of c.permittedWorkspaceCapabilities) {
    if (!CAP_SET.has(String(cap))) {
      throw new HardContractViolation(
        "SEALED_CONTRACT_CAPABILITY_UNKNOWN",
        `Unknown permitted capability: ${String(cap)}`,
      );
    }
    if (PROHIBITION_SET.has(String(cap))) {
      throw new HardContractViolation(
        "SEALED_CONTRACT_CAPABILITY_FORBIDDEN",
        `Prohibited capability listed as permitted: ${String(cap)}`,
      );
    }
  }

  if (!Array.isArray(c.prohibitedWorkspaceCapabilities)) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_PROHIBITIONS",
      "prohibitedWorkspaceCapabilities must be an array",
    );
  }

  const prohibited = c.prohibitedWorkspaceCapabilities as string[];
  for (const p of SEALED_WORKSPACE_PROHIBITIONS) {
    if (!prohibited.includes(p)) {
      throw new HardContractViolation(
        "SEALED_CONTRACT_PROHIBITION_MISSING",
        `Missing required prohibition: ${p}`,
      );
    }
  }
  for (const p of prohibited) {
    if (!PROHIBITION_SET.has(p)) {
      throw new HardContractViolation(
        "SEALED_CONTRACT_PROHIBITION_UNKNOWN",
        `Unknown prohibition: ${p}`,
      );
    }
  }

  if (!Array.isArray(c.invariantIds) || c.invariantIds.length === 0) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_INVARIANTS",
      "invariantIds must be a non-empty array",
    );
  }
  for (const id of c.invariantIds) {
    if (!INVARIANT_SET.has(String(id))) {
      throw new HardContractViolation(
        "SEALED_CONTRACT_INVARIANT_UNKNOWN",
        `Unknown invariant id: ${String(id)}`,
      );
    }
  }

  if (!isPlainSerializable(candidate)) {
    throw new HardContractViolation(
      "SEALED_CONTRACT_NOT_SERIALIZABLE",
      "Sealed runtime contract must be JSON-serializable plain data",
    );
  }

  return {
    schemaVersion: SEALED_RUNTIME_CONTRACT_SCHEMA_VERSION,
    widgetId: c.widgetId as string,
    runtimeClassification: "sealed-runtime",
    owner: "legacy-feed-runtime",
    renderActivation: false,
    shadowActivation: true,
    activeWriter: "legacy",
    mountPolicy: "single-stable-mount",
    stateBoundary: "opaque",
    requestBoundary: "owned-by-widget",
    observerBoundary: c.observerBoundary as SealedRuntimeContract["observerBoundary"],
    scrollBoundary: "owned-by-widget",
    permittedWorkspaceCapabilities: [
      ...(c.permittedWorkspaceCapabilities as SealedWorkspaceCapability[]),
    ],
    prohibitedWorkspaceCapabilities: [
      ...(c.prohibitedWorkspaceCapabilities as SealedWorkspaceProhibition[]),
    ],
    invariantIds: [...(c.invariantIds as FeedSealedInvariantId[])],
  };
}

/** Returns true when a capability is explicitly prohibited on the contract. */
export function isSealedCapabilityProhibited(
  contract: SealedRuntimeContract,
  capability: string,
): boolean {
  return (contract.prohibitedWorkspaceCapabilities as readonly string[]).includes(
    capability,
  );
}
