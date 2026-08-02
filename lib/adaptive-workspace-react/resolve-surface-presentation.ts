/**
 * WX Phase 1B.5.2 — Surface Presentation Resolver & Prioritisation.
 *
 * Pure · deterministic · synchronous · side-effect free · immutable · serializable.
 * Framework-independent · browser-independent · React-independent.
 *
 * Answers only: which registered surfaces are eligible for presentation, and in
 * what deterministic priority order, given approved Workspace state.
 *
 * Does NOT render · Does NOT activate capabilities · Does NOT remount · Does NOT
 * own GeoFeed / Host / Mode / Continuity / Capability semantics.
 *
 * Authority: WX Phase 1B.5 Master Spec · Implementation Master Spec §1B.5.2
 */

import type {
  WorkspaceCapabilityActivationMap,
  WorkspaceCapabilityPlan,
  WorkspaceCapabilityState,
} from "./resolve-workspace-capabilities";
import { WORKSPACE_CAPABILITY_FRAMEWORK } from "./resolve-workspace-capabilities";
import type {
  WorkspaceModeId,
  WorkspaceModePlan,
  WorkspacePosture,
} from "./resolve-workspace-mode";
import {
  WORKSPACE_SURFACE_IDS,
  WORKSPACE_SURFACE_REGISTRY,
  WORKSPACE_RESERVED_SURFACE_IDS,
  listWorkspaceSurfaces,
  type WorkspaceSurfaceId,
  type WorkspaceSurfacePresentationContract,
} from "./workspace-surface-registry";

/** Sealed resolver / plan contract identity for Phase 1B.5.2. */
export const WORKSPACE_SURFACE_PRESENTATION = {
  phase: "1b.5.2",
  contractId: "wx-surface-presentation-resolver-v1",
  planContractId: "wx-surface-presentation-plan-v1",
  contractVersion: "1.0.0",
  decidesVisibility: false,
  activatesCapabilities: false,
  drivesChrome: false,
  diagnosticsOnly: true,
  visualActivationAuthorized: false,
  neverInspectViewport: true,
  neverInspectDevice: true,
  neverInspectUserAgent: true,
  neverRemount: true,
  neverTransferOwnership: true,
} as const;

/**
 * Presentation occupation vocabulary (plan-only — never implies DOM mount).
 * Master Spec §7.2.
 */
export type SurfacePresentationState =
  | "absent"
  | "reachable"
  | "persistent"
  | "compacted"
  | "reserved-blocked";

export type SurfaceDisclosureState =
  | "not-applicable"
  | "disclosure-ready"
  | "disclosure-deferred";

export type SurfaceCompactionState =
  | "not-applicable"
  | "compaction-eligible"
  | "compacted";

export type SurfacePresentationReason =
  | "core-always-present"
  | "mode-assist-capacity"
  | "capability-available"
  | "reachable-continuity"
  | "landscape-carve-out"
  | "contention-priority"
  | "height-honesty"
  | "deferred-phase"
  | "reserved-surface"
  | "fail-closed-minimum"
  | "capability-unavailable"
  | "mode-forbids";

export type SurfaceSuppressionReason =
  | "none"
  | "mode-forbids-assist"
  | "capability-unavailable"
  | "capability-reserved"
  | "reserved-surface"
  | "deferred-utility"
  | "contention-demoted-reachable"
  | "contention-demoted-absent"
  | "insufficient-capacity"
  | "invalid-input-fail-closed"
  | "registry-version-mismatch"
  | "capability-contract-mismatch"
  | "unknown-surface"
  | "duplicate-surface"
  | "malformed-capability";

export type SurfacePresentationEntry = {
  surfaceId: WorkspaceSurfaceId;
  registryVersion: string;
  presentationPlanVersion: string;
  capabilityState: WorkspaceCapabilityState | "n/a";
  presentationState: SurfacePresentationState;
  /** Registry priorityRank (lower = higher priority). */
  priority: number;
  /**
   * True when presentationState is persistent or compacted —
   * eligible for future chrome occupation (not a render authorization).
   */
  eligible: boolean;
  reserved: boolean;
  suppressionReason: SurfaceSuppressionReason;
  presentationReason: SurfacePresentationReason;
  disclosureState: SurfaceDisclosureState;
  compactionState: SurfaceCompactionState;
  diagnostics: {
    registryIndex: number;
    priorityRank: number;
    aspirationalState: SurfacePresentationState;
  };
};

export type SurfacePresentationPlanStatus = "ok" | "rejected";

export type SurfacePresentationPlan = {
  status: SurfacePresentationPlanStatus;
  rejectionReasons: readonly string[];
  phase: typeof WORKSPACE_SURFACE_PRESENTATION.phase;
  contractId: typeof WORKSPACE_SURFACE_PRESENTATION.contractId;
  planContractId: typeof WORKSPACE_SURFACE_PRESENTATION.planContractId;
  contractVersion: typeof WORKSPACE_SURFACE_PRESENTATION.contractVersion;
  registryContractId: typeof WORKSPACE_SURFACE_REGISTRY.contractId;
  registryContractVersion: typeof WORKSPACE_SURFACE_REGISTRY.contractVersion;
  capabilityContractId: typeof WORKSPACE_CAPABILITY_FRAMEWORK.contractId;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  heightDemoted: boolean;
  /** All surfaces in deterministic priority order (rank, then registry index). */
  orderedSurfaceIds: readonly WorkspaceSurfaceId[];
  eligibleSurfaceIds: readonly WorkspaceSurfaceId[];
  suppressedSurfaceIds: readonly WorkspaceSurfaceId[];
  reservedSurfaceIds: readonly WorkspaceSurfaceId[];
  reachableSurfaceIds: readonly WorkspaceSurfaceId[];
  entries: readonly SurfacePresentationEntry[];
  entryById: Readonly<Record<WorkspaceSurfaceId, SurfacePresentationEntry>>;
  maxAssistPersistent: number;
  stabilityToken: string;
  drivesChrome: false;
  visualActivationAuthorized: false;
  diagnosticsOnly: true;
};

/**
 * Serializable resolver input — approved Workspace state only.
 * Must not include device/UA/DOM/React/CSS/network/storage.
 */
export type SurfacePresentationResolveInput = {
  registryContractId: string;
  registryContractVersion: string;
  capabilityContractId: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  heightDemoted?: boolean;
  capabilities: WorkspaceCapabilityActivationMap;
  /**
   * Optional registry snapshot for contract tests (large / malformed).
   * Production callers omit this — sealed registry is used.
   */
  surfaces?: readonly WorkspaceSurfacePresentationContract[];
};

const MODE_IDS: ReadonlySet<string> = new Set([
  "browse",
  "compact-workspace",
  "hybrid-workspace",
  "full-workspace",
  "professional-workspace",
]);

const POSTURE_IDS: ReadonlySet<string> = new Set(["portrait", "landscape"]);

const CAPABILITY_STATES: ReadonlySet<string> = new Set([
  "available",
  "unavailable",
  "reserved",
]);

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

function floorNonNeg(n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function capabilityForSurface(
  surface: WorkspaceSurfacePresentationContract,
  capabilities: WorkspaceCapabilityActivationMap,
): WorkspaceCapabilityState | "n/a" {
  switch (surface.capabilityRelation) {
    case "panels-context":
      return capabilities.panels;
    case "shortcuts-actions":
      // Tools follow progressive action affordance — treat panels/search as
      // availability signal only when panels available; else unavailable.
      return capabilities.panels === "available" ||
        capabilities.search === "available"
        ? "available"
        : capabilities.panels;
    case "progressive-disclosure":
      return capabilities.navigation === "available" ? "available" : "unavailable";
    case "core-feed":
    case "orientation":
    case "navigation-command":
      return "available";
    case "utility-future":
      return "unavailable";
    case "reserved-memory":
    case "reserved-ai":
    case "reserved-collaboration":
    case "reserved-extensions":
      return "reserved";
    default:
      return "n/a";
  }
}

/**
 * Dual-assist Mode capacity (Master §7.4) gated by panels capability + carve-out.
 */
export function maxAssistPersistentForMode(
  mode: WorkspaceModeId,
  panelsAvailable: boolean,
  landscapeCarveOut: boolean,
): number {
  if (!panelsAvailable) return 0;
  switch (mode) {
    case "browse":
      return 0;
    case "compact-workspace":
      return landscapeCarveOut ? 1 : 0;
    case "hybrid-workspace":
      return 1;
    case "full-workspace":
    case "professional-workspace":
      return 2;
    default:
      return 0;
  }
}

/**
 * Tie-break model (documented):
 * 1. Ascending `priorityRank` (lower number = higher priority).
 * 2. Ascending sealed registry definition index.
 * Never: insertion-order of plain objects, random, device, UA.
 */
export function compareSurfacePriority(
  a: { priorityRank: number; registryIndex: number },
  b: { priorityRank: number; registryIndex: number },
): number {
  if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
  return a.registryIndex - b.registryIndex;
}

function tokenFor(plan: {
  mode: string;
  posture: string;
  ordered: readonly string[];
  eligible: readonly string[];
  states: readonly string[];
  status: string;
}): string {
  return [
    "wx-spp",
    WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    plan.status,
    plan.mode,
    plan.posture,
    plan.ordered.join("+"),
    plan.eligible.join("+"),
    plan.states.join("|"),
  ].join(":");
}

type MutableEntry = {
  -readonly [K in keyof SurfacePresentationEntry]: SurfacePresentationEntry[K];
};

function makeEntry(
  surface: WorkspaceSurfacePresentationContract,
  registryIndex: number,
  presentationState: SurfacePresentationState,
  presentationReason: SurfacePresentationReason,
  suppressionReason: SurfaceSuppressionReason,
  capabilityState: WorkspaceCapabilityState | "n/a",
  disclosureState: SurfaceDisclosureState,
  compactionState: SurfaceCompactionState,
  aspirationalState: SurfacePresentationState,
): MutableEntry {
  const eligible =
    presentationState === "persistent" || presentationState === "compacted";
  return {
    surfaceId: surface.id,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    presentationPlanVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    capabilityState,
    presentationState,
    priority: surface.priorityRank,
    eligible,
    reserved: surface.reserved,
    suppressionReason,
    presentationReason,
    disclosureState,
    compactionState,
    diagnostics: {
      registryIndex,
      priorityRank: surface.priorityRank,
      aspirationalState,
    },
  };
}

function validateInput(input: SurfacePresentationResolveInput): string[] {
  const reasons: string[] = [];
  if (input.registryContractId !== WORKSPACE_SURFACE_REGISTRY.contractId) {
    reasons.push("registry-contract-id-mismatch");
  }
  if (
    input.registryContractVersion !== WORKSPACE_SURFACE_REGISTRY.contractVersion
  ) {
    reasons.push("registry-version-mismatch");
  }
  if (input.capabilityContractId !== WORKSPACE_CAPABILITY_FRAMEWORK.contractId) {
    reasons.push("capability-contract-mismatch");
  }
  if (!MODE_IDS.has(input.mode)) {
    reasons.push("invalid-mode");
  }
  if (!POSTURE_IDS.has(input.posture)) {
    reasons.push("invalid-posture");
  }
  if (!input.capabilities || typeof input.capabilities !== "object") {
    reasons.push("missing-capability-input");
  } else {
    for (const key of [
      "navigation",
      "discovery",
      "search",
      "filters",
      "panels",
    ] as const) {
      const v = input.capabilities[key];
      if (!CAPABILITY_STATES.has(v)) {
        reasons.push("malformed-capability");
        break;
      }
    }
  }
  const surfaces = input.surfaces ?? listWorkspaceSurfaces();
  const sealedIds = new Set<string>(WORKSPACE_SURFACE_IDS);
  const seen = new Set<string>();
  for (const s of surfaces) {
    if (seen.has(s.id)) {
      reasons.push("duplicate-surface");
      break;
    }
    seen.add(s.id);
    if (!sealedIds.has(s.id)) {
      reasons.push("unknown-surface");
      break;
    }
    if (
      typeof s.priorityRank !== "number" ||
      !Number.isFinite(s.priorityRank)
    ) {
      reasons.push("impossible-priority-metadata");
      break;
    }
  }
  return reasons;
}

function failClosedPlan(
  input: SurfacePresentationResolveInput,
  rejectionReasons: readonly string[],
): SurfacePresentationPlan {
  const width = floorNonNeg(input.usableWidthPx);
  const height = floorNonNeg(input.usableHeightPx);
  const mode: WorkspaceModeId = MODE_IDS.has(input.mode)
    ? input.mode
    : "browse";
  const posture: WorkspacePosture = POSTURE_IDS.has(input.posture)
    ? input.posture
    : "portrait";
  const surfaces = listWorkspaceSurfaces();
  const entries: MutableEntry[] = [];

  for (let i = 0; i < surfaces.length; i++) {
    const s = surfaces[i]!;
    if (s.reserved) {
      entries.push(
        makeEntry(
          s,
          i,
          "reserved-blocked",
          "reserved-surface",
          "reserved-surface",
          "reserved",
          "not-applicable",
          "not-applicable",
          "reserved-blocked",
        ),
      );
      continue;
    }
    if (s.id === "stage") {
      entries.push(
        makeEntry(
          s,
          i,
          "persistent",
          "fail-closed-minimum",
          "none",
          "available",
          "not-applicable",
          "not-applicable",
          "persistent",
        ),
      );
      continue;
    }
    if (s.id === "orientation" || s.id === "command") {
      entries.push(
        makeEntry(
          s,
          i,
          "persistent",
          "fail-closed-minimum",
          "none",
          "available",
          "not-applicable",
          "not-applicable",
          "persistent",
        ),
      );
      continue;
    }
    if (s.id === "disclosure") {
      entries.push(
        makeEntry(
          s,
          i,
          "reachable",
          "reachable-continuity",
          "invalid-input-fail-closed",
          "available",
          "disclosure-ready",
          "not-applicable",
          "reachable",
        ),
      );
      continue;
    }
    entries.push(
      makeEntry(
        s,
        i,
        "absent",
        "fail-closed-minimum",
        rejectionReasons.includes("registry-version-mismatch")
          ? "registry-version-mismatch"
          : rejectionReasons.includes("capability-contract-mismatch")
            ? "capability-contract-mismatch"
            : "invalid-input-fail-closed",
        capabilityForSurface(s, input.capabilities ?? ({} as WorkspaceCapabilityActivationMap)),
        s.id === "disclosure" ? "disclosure-ready" : "not-applicable",
        "not-applicable",
        "absent",
      ),
    );
  }

  return freezePlan(buildPlanFromEntries(entries, {
    status: "rejected",
    rejectionReasons,
    mode,
    posture,
    usableWidthPx: width,
    usableHeightPx: height,
    landscapeCarveOut: false,
    heightDemoted: true,
    maxAssistPersistent: 0,
  }));
}

function buildPlanFromEntries(
  entries: MutableEntry[],
  meta: {
    status: SurfacePresentationPlanStatus;
    rejectionReasons: readonly string[];
    mode: WorkspaceModeId;
    posture: WorkspacePosture;
    usableWidthPx: number;
    usableHeightPx: number;
    landscapeCarveOut: boolean;
    heightDemoted: boolean;
    maxAssistPersistent: number;
  },
): SurfacePresentationPlan {
  const sorted = [...entries].sort((a, b) =>
    compareSurfacePriority(
      {
        priorityRank: a.diagnostics.priorityRank,
        registryIndex: a.diagnostics.registryIndex,
      },
      {
        priorityRank: b.diagnostics.priorityRank,
        registryIndex: b.diagnostics.registryIndex,
      },
    ),
  );

  const orderedSurfaceIds = sorted.map((e) => e.surfaceId);
  const eligibleSurfaceIds = sorted
    .filter((e) => e.eligible)
    .map((e) => e.surfaceId);
  const reservedSurfaceIds = sorted
    .filter((e) => e.reserved || e.presentationState === "reserved-blocked")
    .map((e) => e.surfaceId);
  const reachableSurfaceIds = sorted
    .filter((e) => e.presentationState === "reachable")
    .map((e) => e.surfaceId);
  const suppressedSurfaceIds = sorted
    .filter(
      (e) =>
        e.presentationState === "absent" ||
        e.suppressionReason === "contention-demoted-reachable" ||
        e.suppressionReason === "contention-demoted-absent",
    )
    .map((e) => e.surfaceId);

  const entryById = {} as Record<WorkspaceSurfaceId, SurfacePresentationEntry>;
  for (const e of sorted) {
    entryById[e.surfaceId] = e;
  }

  const stabilityToken = tokenFor({
    mode: meta.mode,
    posture: meta.posture,
    ordered: orderedSurfaceIds,
    eligible: eligibleSurfaceIds,
    states: sorted.map((e) => `${e.surfaceId}=${e.presentationState}`),
    status: meta.status,
  });

  return {
    status: meta.status,
    rejectionReasons: meta.rejectionReasons,
    phase: WORKSPACE_SURFACE_PRESENTATION.phase,
    contractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    planContractId: WORKSPACE_SURFACE_PRESENTATION.planContractId,
    contractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: meta.mode,
    posture: meta.posture,
    usableWidthPx: meta.usableWidthPx,
    usableHeightPx: meta.usableHeightPx,
    landscapeCarveOut: meta.landscapeCarveOut,
    heightDemoted: meta.heightDemoted,
    orderedSurfaceIds,
    eligibleSurfaceIds,
    suppressedSurfaceIds,
    reservedSurfaceIds,
    reachableSurfaceIds,
    entries: sorted,
    entryById,
    maxAssistPersistent: meta.maxAssistPersistent,
    stabilityToken,
    drivesChrome: false,
    visualActivationAuthorized: false,
    diagnosticsOnly: true,
  };
}

function freezePlan(plan: SurfacePresentationPlan): SurfacePresentationPlan {
  return deepFreeze(plan);
}

/**
 * Canonical Surface Presentation Resolver.
 * Complexity: O(n log n) for n registry surfaces (sort); n=12 sealed.
 */
export function resolveSurfacePresentation(
  input: SurfacePresentationResolveInput,
): SurfacePresentationPlan {
  const rejectionReasons = validateInput(input);
  if (rejectionReasons.length > 0) {
    return failClosedPlan(input, rejectionReasons);
  }

  const width = floorNonNeg(input.usableWidthPx);
  const height = floorNonNeg(input.usableHeightPx);
  const heightDemoted = input.heightDemoted === true;
  const surfaces = [...(input.surfaces ?? listWorkspaceSurfaces())];
  const panelsAvailable = input.capabilities.panels === "available";
  const maxAssist = maxAssistPersistentForMode(
    input.mode,
    panelsAvailable,
    input.landscapeCarveOut,
  );

  // Index by sealed registry order when using default registry.
  const registryIndexById = new Map<WorkspaceSurfaceId, number>(
    listWorkspaceSurfaces().map((s, i) => [s.id, i]),
  );

  const aspirational = new Map<WorkspaceSurfaceId, MutableEntry>();

  for (let i = 0; i < surfaces.length; i++) {
    const s = surfaces[i]!;
    const registryIndex = registryIndexById.get(s.id) ?? i;
    const capState = capabilityForSurface(s, input.capabilities);

    // Registry reserved truth wins over any capability input.
    if (s.reserved || s.availabilityIntent === "reserved-blocked") {
      aspirational.set(
        s.id,
        makeEntry(
          s,
          registryIndex,
          "reserved-blocked",
          "reserved-surface",
          "reserved-surface",
          "reserved",
          "not-applicable",
          "not-applicable",
          "reserved-blocked",
        ),
      );
      continue;
    }

    if (s.availabilityIntent === "deferred-phase" || s.id === "utility") {
      aspirational.set(
        s.id,
        makeEntry(
          s,
          registryIndex,
          "absent",
          "deferred-phase",
          "deferred-utility",
          capState,
          "not-applicable",
          "not-applicable",
          "absent",
        ),
      );
      continue;
    }

    if (s.id === "stage") {
      aspirational.set(
        s.id,
        makeEntry(
          s,
          registryIndex,
          "persistent",
          "core-always-present",
          "none",
          "available",
          "not-applicable",
          "not-applicable",
          "persistent",
        ),
      );
      continue;
    }

    if (s.id === "orientation") {
      const compacted =
        heightDemoted ||
        (input.posture === "landscape" && height > 0 && height < 500);
      aspirational.set(
        s.id,
        makeEntry(
          s,
          registryIndex,
          compacted ? "compacted" : "persistent",
          compacted ? "height-honesty" : "core-always-present",
          "none",
          "available",
          "not-applicable",
          compacted ? "compacted" : "compaction-eligible",
          compacted ? "compacted" : "persistent",
        ),
      );
      continue;
    }

    if (s.id === "command") {
      aspirational.set(
        s.id,
        makeEntry(
          s,
          registryIndex,
          "persistent",
          "core-always-present",
          "none",
          "available",
          "disclosure-ready",
          "compaction-eligible",
          "persistent",
        ),
      );
      continue;
    }

    if (s.id === "disclosure") {
      aspirational.set(
        s.id,
        makeEntry(
          s,
          registryIndex,
          "reachable",
          "reachable-continuity",
          "none",
          capState === "available" ? "available" : "unavailable",
          "disclosure-ready",
          "not-applicable",
          "reachable",
        ),
      );
      continue;
    }

    if (s.id === "assist-primary") {
      if (maxAssist < 1) {
        const reason: SurfaceSuppressionReason = !panelsAvailable
          ? input.capabilities.panels === "reserved"
            ? "capability-reserved"
            : "capability-unavailable"
          : "mode-forbids-assist";
        aspirational.set(
          s.id,
          makeEntry(
            s,
            registryIndex,
            "absent",
            reason === "mode-forbids-assist" ? "mode-forbids" : "capability-unavailable",
            reason,
            capState,
            "disclosure-deferred",
            "not-applicable",
            "absent",
          ),
        );
      } else {
        const reason: SurfacePresentationReason =
          input.mode === "compact-workspace" && input.landscapeCarveOut
            ? "landscape-carve-out"
            : "mode-assist-capacity";
        aspirational.set(
          s.id,
          makeEntry(
            s,
            registryIndex,
            "persistent",
            reason,
            "none",
            "available",
            "not-applicable",
            "not-applicable",
            "persistent",
          ),
        );
      }
      continue;
    }

    if (s.id === "assist-secondary") {
      if (maxAssist < 2) {
        aspirational.set(
          s.id,
          makeEntry(
            s,
            registryIndex,
            "absent",
            "mode-forbids",
            maxAssist === 0 && !panelsAvailable
              ? "capability-unavailable"
              : "mode-forbids-assist",
            capState,
            "disclosure-deferred",
            "not-applicable",
            "absent",
          ),
        );
      } else {
        aspirational.set(
          s.id,
          makeEntry(
            s,
            registryIndex,
            "persistent",
            "mode-assist-capacity",
            "none",
            "available",
            "not-applicable",
            "not-applicable",
            "persistent",
          ),
        );
      }
      continue;
    }

    if (s.id === "tool") {
      // Reachable by default; may become persistent only in full/professional
      // when panels available and width ≥ professional band — still plan-only.
      const wantPersistent =
        panelsAvailable &&
        (input.mode === "full-workspace" ||
          input.mode === "professional-workspace") &&
        width >= 1440;
      aspirational.set(
        s.id,
        makeEntry(
          s,
          registryIndex,
          wantPersistent ? "persistent" : "reachable",
          wantPersistent ? "capability-available" : "reachable-continuity",
          "none",
          capState,
          wantPersistent ? "not-applicable" : "disclosure-ready",
          "not-applicable",
          wantPersistent ? "persistent" : "reachable",
        ),
      );
      continue;
    }

    // Unknown non-reserved progressive — absent fail-closed.
    aspirational.set(
      s.id,
      makeEntry(
        s,
        registryIndex,
        "absent",
        "fail-closed-minimum",
        "insufficient-capacity",
        capState,
        "not-applicable",
        "not-applicable",
        "absent",
      ),
    );
  }

  // Contention pass: demote lower-priority persistent tools/assists if needed.
  // Stage / orientation / command never lose presence.
  const persistentCandidates = [...aspirational.values()]
    .filter(
      (e) =>
        e.presentationState === "persistent" &&
        e.surfaceId !== "stage" &&
        e.surfaceId !== "orientation" &&
        e.surfaceId !== "command",
    )
    .sort((a, b) =>
      compareSurfacePriority(
        {
          priorityRank: a.diagnostics.priorityRank,
          registryIndex: a.diagnostics.registryIndex,
        },
        {
          priorityRank: b.diagnostics.priorityRank,
          registryIndex: b.diagnostics.registryIndex,
        },
      ),
    );

  // Assist hard cap already applied; demote tool if both assists + tool persist
  // under constrained width (< 1600) even if aspirational allowed tool.
  if (width < 1600) {
    const tool = aspirational.get("tool");
    if (tool && tool.presentationState === "persistent") {
      tool.presentationState = "reachable";
      tool.eligible = false;
      tool.presentationReason = "contention-priority";
      tool.suppressionReason = "contention-demoted-reachable";
      tool.disclosureState = "disclosure-ready";
    }
  }

  // Ensure assist count respects maxAssist after any mutation.
  const assists = ["assist-primary", "assist-secondary"] as const;
  let assistPersistent = 0;
  for (const id of assists) {
    const e = aspirational.get(id);
    if (e?.presentationState === "persistent") assistPersistent += 1;
  }
  if (assistPersistent > maxAssist) {
    // Demote lowest priority assist first (secondary before primary).
    for (const id of [...assists].reverse()) {
      if (assistPersistent <= maxAssist) break;
      const e = aspirational.get(id);
      if (e && e.presentationState === "persistent") {
        e.presentationState = "absent";
        e.eligible = false;
        e.presentationReason = "contention-priority";
        e.suppressionReason = "contention-demoted-absent";
        e.disclosureState = "disclosure-deferred";
        assistPersistent -= 1;
      }
    }
  }

  void persistentCandidates;

  const entries = [...aspirational.values()];
  return freezePlan(
    buildPlanFromEntries(entries, {
      status: "ok",
      rejectionReasons: [],
      mode: input.mode,
      posture: input.posture,
      usableWidthPx: width,
      usableHeightPx: height,
      landscapeCarveOut: input.landscapeCarveOut,
      heightDemoted,
      maxAssistPersistent: maxAssist,
    }),
  );
}

/** Convenience: resolve from authoritative Mode + Capability plans. */
export function resolveSurfacePresentationFromPlans(
  modePlan: WorkspaceModePlan,
  capabilityPlan: WorkspaceCapabilityPlan,
): SurfacePresentationPlan {
  return resolveSurfacePresentation({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    mode: modePlan.mode,
    posture: modePlan.posture,
    usableWidthPx: modePlan.usableWidthPx,
    usableHeightPx: modePlan.usableHeightPx,
    landscapeCarveOut: modePlan.landscapeCarveOut,
    heightDemoted: modePlan.heightDemoted,
    capabilities: capabilityPlan.capabilities,
  });
}

export function getSurfacePresentationEntry(
  plan: SurfacePresentationPlan,
  id: WorkspaceSurfaceId,
): SurfacePresentationEntry | undefined {
  return plan.entryById[id];
}

export function isSurfacePresentationEligible(
  plan: SurfacePresentationPlan,
  id: WorkspaceSurfaceId,
): boolean {
  return plan.entryById[id]?.eligible === true;
}

/** JSON-safe clone for evidence / serialization stability. */
export function serializeSurfacePresentationPlan(
  plan: SurfacePresentationPlan,
): {
  status: SurfacePresentationPlanStatus;
  contractId: string;
  contractVersion: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  orderedSurfaceIds: WorkspaceSurfaceId[];
  eligibleSurfaceIds: WorkspaceSurfaceId[];
  suppressedSurfaceIds: WorkspaceSurfaceId[];
  reservedSurfaceIds: WorkspaceSurfaceId[];
  reachableSurfaceIds: WorkspaceSurfaceId[];
  stabilityToken: string;
  entries: Array<{
    surfaceId: WorkspaceSurfaceId;
    presentationState: SurfacePresentationState;
    eligible: boolean;
    priority: number;
    suppressionReason: SurfaceSuppressionReason;
    presentationReason: SurfacePresentationReason;
  }>;
} {
  return {
    status: plan.status,
    contractId: plan.contractId,
    contractVersion: plan.contractVersion,
    mode: plan.mode,
    posture: plan.posture,
    orderedSurfaceIds: [...plan.orderedSurfaceIds],
    eligibleSurfaceIds: [...plan.eligibleSurfaceIds],
    suppressedSurfaceIds: [...plan.suppressedSurfaceIds],
    reservedSurfaceIds: [...plan.reservedSurfaceIds],
    reachableSurfaceIds: [...plan.reachableSurfaceIds],
    stabilityToken: plan.stabilityToken,
    entries: plan.entries.map((e) => ({
      surfaceId: e.surfaceId,
      presentationState: e.presentationState,
      eligible: e.eligible,
      priority: e.priority,
      suppressionReason: e.suppressionReason,
      presentationReason: e.presentationReason,
    })),
  };
}

export const SURFACE_PRESENTATION_FORBIDDEN_SOURCE_PATTERNS: readonly RegExp[] =
  [
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
