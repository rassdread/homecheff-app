/**
 * WX Phase 1B.3 — Workspace Capability Activation Framework.
 *
 * Pure · deterministic · side-effect free · UI-independent.
 * Resolves which Workspace capabilities are AVAILABLE / UNAVAILABLE / RESERVED
 * for a given Workspace Mode (+ posture / AvailableSpace-derived Mode plan).
 *
 * Does NOT activate capabilities visually.
 * Does NOT touch GeoFeed, Controlled Host, layout, or navigation.
 *
 * Authority: WMS v1.1 Capability Model · Master Spec WX-1B.3
 */

import type {
  WorkspaceModeId,
  WorkspaceModePlan,
  WorkspacePosture,
} from "./resolve-workspace-mode";
import { resolveWorkspaceMode } from "./resolve-workspace-mode";

/** Sealed activation states — the only legal capability outcomes in 1B.3. */
export type WorkspaceCapabilityState =
  | "available"
  | "unavailable"
  | "reserved";

/**
 * Canonical capability categories for the activation framework.
 * Future feature work MUST consume these IDs via the resolver — never self-activate.
 */
export type WorkspaceCapabilityId =
  | "navigation"
  | "discovery"
  | "search"
  | "filters"
  | "panels"
  | "workspace-density"
  | "inspector"
  | "selection"
  | "workspace-memory"
  | "contextual-assistance"
  | "professional-workspace"
  | "ai-collaboration"
  | "extensions";

export const WORKSPACE_CAPABILITY_IDS: readonly WorkspaceCapabilityId[] = [
  "navigation",
  "discovery",
  "search",
  "filters",
  "panels",
  "workspace-density",
  "inspector",
  "selection",
  "workspace-memory",
  "contextual-assistance",
  "professional-workspace",
  "ai-collaboration",
  "extensions",
] as const;

/** Capabilities that remain RESERVED in every Mode under WMS 1.1 / WX 1B.3. */
export const WORKSPACE_RESERVED_CAPABILITY_IDS: readonly WorkspaceCapabilityId[] =
  [
    "workspace-memory",
    "contextual-assistance",
    "professional-workspace",
    "ai-collaboration",
    "extensions",
  ] as const;

export const WORKSPACE_CAPABILITY_FRAMEWORK = {
  phase: "1b.3",
  contractId: "wx-capability-activation-v1",
  neverSelfActivate: true,
  neverInspectViewport: true,
  neverInspectDevice: true,
  neverInspectUserAgent: true,
  diagnosticsOnly: true,
  visualActivationAuthorized: false,
} as const;

export type WorkspaceCapabilityActivationMap = Record<
  WorkspaceCapabilityId,
  WorkspaceCapabilityState
>;

export type WorkspaceCapabilityPlan = {
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  capabilities: WorkspaceCapabilityActivationMap;
  /** Count of capabilities in each state (diagnostic). */
  availableCount: number;
  unavailableCount: number;
  reservedCount: number;
  /**
   * Stability token for diagnostics only — must not drive React keys or layout.
   */
  stabilityToken: string;
  contractId: typeof WORKSPACE_CAPABILITY_FRAMEWORK.contractId;
  phase: typeof WORKSPACE_CAPABILITY_FRAMEWORK.phase;
};

export type WorkspaceCapabilityResolveInput = {
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut?: boolean;
};

const MODE_IDS: ReadonlySet<string> = new Set([
  "browse",
  "compact-workspace",
  "hybrid-workspace",
  "full-workspace",
  "professional-workspace",
]);

function isModeId(value: string): value is WorkspaceModeId {
  return MODE_IDS.has(value);
}

function countStates(map: WorkspaceCapabilityActivationMap): {
  availableCount: number;
  unavailableCount: number;
  reservedCount: number;
} {
  let availableCount = 0;
  let unavailableCount = 0;
  let reservedCount = 0;
  for (const id of WORKSPACE_CAPABILITY_IDS) {
    const state = map[id];
    if (state === "available") availableCount += 1;
    else if (state === "unavailable") unavailableCount += 1;
    else reservedCount += 1;
  }
  return { availableCount, unavailableCount, reservedCount };
}

/**
 * Mode → capability activation matrix (WMS v1.1 mapped to AVAILABLE/UNAVAILABLE/RESERVED).
 *
 * Reachable / progressive capabilities are still AVAILABLE to the framework
 * (authority to surface later). Visual activation is forbidden in 1B.3.
 */
function activationForMode(
  mode: WorkspaceModeId,
  landscapeCarveOut: boolean,
): WorkspaceCapabilityActivationMap {
  const reserved = Object.fromEntries(
    WORKSPACE_RESERVED_CAPABILITY_IDS.map((id) => [id, "reserved" as const]),
  ) as Pick<
    WorkspaceCapabilityActivationMap,
    (typeof WORKSPACE_RESERVED_CAPABILITY_IDS)[number]
  >;

  const coreAlways: Pick<
    WorkspaceCapabilityActivationMap,
    | "navigation"
    | "discovery"
    | "search"
    | "filters"
    | "workspace-density"
  > = {
    navigation: "available",
    discovery: "available",
    search: "available",
    filters: "available",
    "workspace-density": "available",
  };

  switch (mode) {
    case "browse":
      return {
        ...coreAlways,
        ...reserved,
        panels: "unavailable",
        inspector: "unavailable",
        selection: "unavailable",
      };
    case "compact-workspace":
      return {
        ...coreAlways,
        ...reserved,
        // Compact may host ≤1 assist panel when carve-out / capacity applies.
        panels: landscapeCarveOut ? "available" : "unavailable",
        inspector: "unavailable",
        selection: "available",
      };
    case "hybrid-workspace":
      return {
        ...coreAlways,
        ...reserved,
        panels: "available",
        inspector: "available",
        selection: "available",
      };
    case "full-workspace":
      return {
        ...coreAlways,
        ...reserved,
        panels: "available",
        inspector: "available",
        selection: "available",
      };
    case "professional-workspace":
      return {
        ...coreAlways,
        ...reserved,
        panels: "available",
        inspector: "available",
        selection: "available",
      };
  }
}

/**
 * Resolve capability activation for an explicit Mode / posture input.
 * Fail-closed: unknown Mode → browse-equivalent availability (safe minimum).
 */
export function resolveWorkspaceCapabilities(
  input: WorkspaceCapabilityResolveInput,
): WorkspaceCapabilityPlan {
  const mode: WorkspaceModeId = isModeId(input.mode) ? input.mode : "browse";
  const posture: WorkspacePosture =
    input.posture === "landscape" ? "landscape" : "portrait";
  const usableWidthPx = Math.max(0, Math.floor(Number(input.usableWidthPx) || 0));
  const usableHeightPx = Math.max(
    0,
    Math.floor(Number(input.usableHeightPx) || 0),
  );
  const landscapeCarveOut = Boolean(input.landscapeCarveOut);

  const capabilities = activationForMode(mode, landscapeCarveOut);
  const counts = countStates(capabilities);
  const stabilityToken = `wx-cap:${mode}:${posture}:${usableWidthPx}x${usableHeightPx}:lc${landscapeCarveOut ? 1 : 0}:a${counts.availableCount}:u${counts.unavailableCount}:r${counts.reservedCount}`;

  return {
    mode,
    posture,
    usableWidthPx,
    usableHeightPx,
    landscapeCarveOut,
    capabilities,
    ...counts,
    stabilityToken,
    contractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    phase: WORKSPACE_CAPABILITY_FRAMEWORK.phase,
  };
}

/** Resolve capabilities from an existing Mode plan (preferred wiring path). */
export function resolveWorkspaceCapabilitiesFromModePlan(
  modePlan: WorkspaceModePlan,
): WorkspaceCapabilityPlan {
  return resolveWorkspaceCapabilities({
    mode: modePlan.mode,
    posture: modePlan.posture,
    usableWidthPx: modePlan.usableWidthPx,
    usableHeightPx: modePlan.usableHeightPx,
    landscapeCarveOut: modePlan.landscapeCarveOut,
  });
}

/**
 * Resolve Mode then capabilities from AvailableSpace only.
 * Capabilities still do not inspect viewport / UA — they consume Mode output.
 */
export function resolveWorkspaceCapabilitiesFromAvailableSpace(args: {
  usableWidthPx: number;
  usableHeightPx: number;
}): WorkspaceCapabilityPlan {
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: args.usableWidthPx,
    usableHeightPx: args.usableHeightPx,
  });
  return resolveWorkspaceCapabilitiesFromModePlan(modePlan);
}

export function getWorkspaceCapabilityState(
  plan: WorkspaceCapabilityPlan,
  id: WorkspaceCapabilityId,
): WorkspaceCapabilityState {
  return plan.capabilities[id];
}

export function isWorkspaceCapabilityAvailable(
  plan: WorkspaceCapabilityPlan,
  id: WorkspaceCapabilityId,
): boolean {
  return plan.capabilities[id] === "available";
}

/** Source-level forbidden patterns: capabilities must not self-activate from UA/viewport. */
export const CAPABILITY_FORBIDDEN_SOURCE_PATTERNS = [
  /navigator\.userAgent/,
  /matchMedia\s*\(/,
  /window\.innerWidth/,
  /window\.visualViewport/,
] as const;
