/**
 * WX Phase 1B.5.1 — Workspace Surface Registry & Presentation Contract.
 *
 * Pure · deterministic · immutable · serializable · side-effect free.
 * Technology-independent · browser-independent · framework-independent.
 *
 * Canonical registry of Workspace presentation surfaces.
 * Does NOT decide which surfaces are shown.
 * Does NOT activate capabilities.
 * Does NOT resolve presentation occupancy.
 * Does NOT render.
 *
 * Authority: WX Phase 1B.5 Master Specification · Implementation Master Spec §1B.5.1
 */

/** Sealed presentation contract identity for Phase 1B.5.1. */
export const WORKSPACE_SURFACE_REGISTRY = {
  phase: "1b.5.1",
  contractId: "wx-surface-presentation-registry-v1",
  contractVersion: "1.0.0",
  /** Registry is presentation vocabulary only — never drives visibility alone. */
  decidesVisibility: false,
  activatesCapabilities: false,
  resolvesPresentation: false,
  diagnosticsOnly: true,
  neverInspectViewport: true,
  neverInspectDevice: true,
  neverInspectUserAgent: true,
  visualActivationAuthorized: false,
} as const;

/**
 * Canonical surface identifiers — stable forever within this contract.
 * Future phases MUST consume these IDs; they MUST NOT invent parallel registries.
 */
export type WorkspaceSurfaceId =
  | "stage"
  | "orientation"
  | "command"
  | "assist-primary"
  | "assist-secondary"
  | "tool"
  | "disclosure"
  | "utility"
  | "reserved-memory"
  | "reserved-ai"
  | "reserved-collaboration"
  | "reserved-extensions";

/** Presentation category — classification only, not a visibility decision. */
export type WorkspaceSurfaceCategory =
  | "core"
  | "progressive"
  | "reachable-support"
  | "deferred"
  | "reserved";

/** Surface family grouping for diagnostics and future consumers. */
export type WorkspaceSurfaceFamily =
  | "stage"
  | "chrome"
  | "assist"
  | "tools"
  | "disclosure"
  | "utility"
  | "reserved";

/** Presentation role — semantic intent metadata only. */
export type WorkspaceSurfacePresentationRole =
  | "primary-stage"
  | "orientation-chrome"
  | "command-chrome"
  | "assist-region"
  | "tool-region"
  | "disclosure-overflow"
  | "utility-transient"
  | "reserved-blocked";

/**
 * Availability metadata describes future presentation *intent*,
 * not runtime eligibility. Resolver (1B.5.2+) owns decisions.
 */
export type WorkspaceSurfaceAvailabilityIntent =
  | "always-present"
  | "capacity-gated"
  | "reachable-fallback"
  | "deferred-phase"
  | "reserved-blocked";

export type WorkspaceSurfaceCapabilityRelation =
  | "core-feed"
  | "orientation"
  | "navigation-command"
  | "panels-context"
  | "shortcuts-actions"
  | "progressive-disclosure"
  | "utility-future"
  | "reserved-memory"
  | "reserved-ai"
  | "reserved-collaboration"
  | "reserved-extensions"
  | "none";

/**
 * Presentation contract for one surface — registry metadata only.
 * No React · no CSS · no DOM · no browser assumptions.
 */
export type WorkspaceSurfacePresentationContract = {
  /** Stable identifier — unique in registry. */
  id: WorkspaceSurfaceId;
  /** Human-readable diagnostic label (not UI copy). */
  label: string;
  /** Contract version binding this entry. */
  contractVersion: typeof WORKSPACE_SURFACE_REGISTRY.contractVersion;
  /** Presentation category. */
  category: WorkspaceSurfaceCategory;
  /** Surface family. */
  family: WorkspaceSurfaceFamily;
  /** Presentation role. */
  presentationRole: WorkspaceSurfacePresentationRole;
  /** True when surface MUST remain non-presentable under current program. */
  reserved: boolean;
  /**
   * Priority metadata (lower number = higher priority under future contention).
   * Registry stores intent; 1B.5.2 resolver applies it.
   */
  priorityRank: number;
  /** Availability intent metadata — not a runtime decision. */
  availabilityIntent: WorkspaceSurfaceAvailabilityIntent;
  /** Related capability vocabulary (informational). */
  capabilityRelation: WorkspaceSurfaceCapabilityRelation;
  /** Diagnostic token for evidence / DOM mirrors. */
  diagnosticToken: string;
};

type MutableContract = {
  -readonly [K in keyof WorkspaceSurfacePresentationContract]: WorkspaceSurfacePresentationContract[K];
};

const CONTRACT_VERSION = WORKSPACE_SURFACE_REGISTRY.contractVersion;

/** Authoritative ordered registry entries (definition order = default enumeration order). */
const SURFACE_DEFINITIONS: readonly MutableContract[] = [
  {
    id: "stage",
    label: "Stage Surface",
    contractVersion: CONTRACT_VERSION,
    category: "core",
    family: "stage",
    presentationRole: "primary-stage",
    reserved: false,
    priorityRank: 1,
    availabilityIntent: "always-present",
    capabilityRelation: "core-feed",
    diagnosticToken: "wx-surface:stage",
  },
  {
    id: "orientation",
    label: "Orientation Surface",
    contractVersion: CONTRACT_VERSION,
    category: "core",
    family: "chrome",
    presentationRole: "orientation-chrome",
    reserved: false,
    priorityRank: 2,
    availabilityIntent: "always-present",
    capabilityRelation: "orientation",
    diagnosticToken: "wx-surface:orientation",
  },
  {
    id: "command",
    label: "Command Surface",
    contractVersion: CONTRACT_VERSION,
    category: "core",
    family: "chrome",
    presentationRole: "command-chrome",
    reserved: false,
    priorityRank: 2,
    availabilityIntent: "always-present",
    capabilityRelation: "navigation-command",
    diagnosticToken: "wx-surface:command",
  },
  {
    id: "assist-primary",
    label: "Primary Assist Surface",
    contractVersion: CONTRACT_VERSION,
    category: "progressive",
    family: "assist",
    presentationRole: "assist-region",
    reserved: false,
    priorityRank: 4,
    availabilityIntent: "capacity-gated",
    capabilityRelation: "panels-context",
    diagnosticToken: "wx-surface:assist-primary",
  },
  {
    id: "assist-secondary",
    label: "Secondary Assist Surface",
    contractVersion: CONTRACT_VERSION,
    category: "progressive",
    family: "assist",
    presentationRole: "assist-region",
    reserved: false,
    priorityRank: 5,
    availabilityIntent: "capacity-gated",
    capabilityRelation: "panels-context",
    diagnosticToken: "wx-surface:assist-secondary",
  },
  {
    id: "tool",
    label: "Tool Surface",
    contractVersion: CONTRACT_VERSION,
    category: "progressive",
    family: "tools",
    presentationRole: "tool-region",
    reserved: false,
    priorityRank: 6,
    availabilityIntent: "capacity-gated",
    capabilityRelation: "shortcuts-actions",
    diagnosticToken: "wx-surface:tool",
  },
  {
    id: "disclosure",
    label: "Disclosure Surface",
    contractVersion: CONTRACT_VERSION,
    category: "reachable-support",
    family: "disclosure",
    presentationRole: "disclosure-overflow",
    reserved: false,
    priorityRank: 3,
    availabilityIntent: "reachable-fallback",
    capabilityRelation: "progressive-disclosure",
    diagnosticToken: "wx-surface:disclosure",
  },
  {
    id: "utility",
    label: "Utility Surface",
    contractVersion: CONTRACT_VERSION,
    category: "deferred",
    family: "utility",
    presentationRole: "utility-transient",
    reserved: false,
    priorityRank: 8,
    availabilityIntent: "deferred-phase",
    capabilityRelation: "utility-future",
    diagnosticToken: "wx-surface:utility",
  },
  {
    id: "reserved-memory",
    label: "Reserved — Workspace Memory",
    contractVersion: CONTRACT_VERSION,
    category: "reserved",
    family: "reserved",
    presentationRole: "reserved-blocked",
    reserved: true,
    priorityRank: 100,
    availabilityIntent: "reserved-blocked",
    capabilityRelation: "reserved-memory",
    diagnosticToken: "wx-surface:reserved-memory",
  },
  {
    id: "reserved-ai",
    label: "Reserved — AI Assistant",
    contractVersion: CONTRACT_VERSION,
    category: "reserved",
    family: "reserved",
    presentationRole: "reserved-blocked",
    reserved: true,
    priorityRank: 101,
    availabilityIntent: "reserved-blocked",
    capabilityRelation: "reserved-ai",
    diagnosticToken: "wx-surface:reserved-ai",
  },
  {
    id: "reserved-collaboration",
    label: "Reserved — Collaboration",
    contractVersion: CONTRACT_VERSION,
    category: "reserved",
    family: "reserved",
    presentationRole: "reserved-blocked",
    reserved: true,
    priorityRank: 102,
    availabilityIntent: "reserved-blocked",
    capabilityRelation: "reserved-collaboration",
    diagnosticToken: "wx-surface:reserved-collaboration",
  },
  {
    id: "reserved-extensions",
    label: "Reserved — Workspace Extensions",
    contractVersion: CONTRACT_VERSION,
    category: "reserved",
    family: "reserved",
    presentationRole: "reserved-blocked",
    reserved: true,
    priorityRank: 103,
    availabilityIntent: "reserved-blocked",
    capabilityRelation: "reserved-extensions",
    diagnosticToken: "wx-surface:reserved-extensions",
  },
];

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

const FROZEN_SURFACES: readonly WorkspaceSurfacePresentationContract[] =
  deepFreeze(
    SURFACE_DEFINITIONS.map((entry) => ({ ...entry })),
  ) as readonly WorkspaceSurfacePresentationContract[];

const SURFACE_BY_ID: ReadonlyMap<
  WorkspaceSurfaceId,
  WorkspaceSurfacePresentationContract
> = new Map(FROZEN_SURFACES.map((s) => [s.id, s]));

export const WORKSPACE_SURFACE_IDS: readonly WorkspaceSurfaceId[] =
  FROZEN_SURFACES.map((s) => s.id);

export const WORKSPACE_RESERVED_SURFACE_IDS: readonly WorkspaceSurfaceId[] =
  FROZEN_SURFACES.filter((s) => s.reserved).map((s) => s.id);

/** Ordered immutable registry snapshot. */
export function listWorkspaceSurfaces(): readonly WorkspaceSurfacePresentationContract[] {
  return FROZEN_SURFACES;
}

/** Constant-time lookup by stable identifier. */
export function getWorkspaceSurface(
  id: WorkspaceSurfaceId,
): WorkspaceSurfacePresentationContract | undefined {
  return SURFACE_BY_ID.get(id);
}

export function isWorkspaceSurfaceId(value: unknown): value is WorkspaceSurfaceId {
  return typeof value === "string" && SURFACE_BY_ID.has(value as WorkspaceSurfaceId);
}

export function isWorkspaceSurfaceReserved(id: WorkspaceSurfaceId): boolean {
  const surface = SURFACE_BY_ID.get(id);
  return surface?.reserved === true;
}

/** Serializable diagnostics snapshot — read-only evidence. */
export type WorkspaceSurfaceRegistryDiagnostics = {
  phase: typeof WORKSPACE_SURFACE_REGISTRY.phase;
  contractId: typeof WORKSPACE_SURFACE_REGISTRY.contractId;
  contractVersion: typeof WORKSPACE_SURFACE_REGISTRY.contractVersion;
  surfaceCount: number;
  surfaceIds: readonly WorkspaceSurfaceId[];
  reservedIds: readonly WorkspaceSurfaceId[];
  decidesVisibility: false;
  activatesCapabilities: false;
  visualActivationAuthorized: false;
};

export function getWorkspaceSurfaceRegistryDiagnostics(): WorkspaceSurfaceRegistryDiagnostics {
  return {
    phase: WORKSPACE_SURFACE_REGISTRY.phase,
    contractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    contractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    surfaceCount: FROZEN_SURFACES.length,
    surfaceIds: WORKSPACE_SURFACE_IDS,
    reservedIds: WORKSPACE_RESERVED_SURFACE_IDS,
    decidesVisibility: false,
    activatesCapabilities: false,
    visualActivationAuthorized: false,
  };
}

/** JSON-serializable plain object (deep clone of diagnostics + contracts). */
export function serializeWorkspaceSurfaceRegistry(): {
  registry: WorkspaceSurfaceRegistryDiagnostics;
  surfaces: WorkspaceSurfacePresentationContract[];
} {
  return {
    registry: getWorkspaceSurfaceRegistryDiagnostics(),
    surfaces: FROZEN_SURFACES.map((s) => ({ ...s })),
  };
}

/** Source seals — registry module must remain free of these patterns. */
export const SURFACE_REGISTRY_FORBIDDEN_SOURCE_PATTERNS: readonly RegExp[] = [
  /\bwindow\b/,
  /\bdocument\b/,
  /\bnavigator\b/,
  /\buserAgent\b/i,
  /\bmatchMedia\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bsetInterval\b/,
  /\bsetTimeout\b/,
  /\baddEventListener\b/,
  /\bResizeObserver\b/,
  /\bIntersectionObserver\b/,
  /\bfrom ["']react["']/,
  /\bfrom ["']react-dom["']/,
  /\.tsx["']/,
];
