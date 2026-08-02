/**
 * WX Phase 1B.5.6 — Honesty Density & Compacted Surface States.
 *
 * Pure · deterministic · synchronous · side-effect free · immutable · serializable.
 * Framework-independent · browser-independent · React-independent.
 *
 * Builds an Honesty Density plan on top of:
 *   Surface Registry → Presentation → Assist Eligibility →
 *   Progressive Disclosure → Tool & Action Presentation → Honesty Density
 *
 * Computes density / compact planning metadata only from already-resolved
 * Workspace plans. Does NOT inspect DOM, CSS, pixels, user agent, or perform
 * fresh runtime measurement reads inside the resolver.
 *
 * Does NOT render · Does NOT change layout/spacing/visibility · Does NOT
 * activate capabilities · Does NOT remount · Does NOT transfer ownership.
 *
 * Authority: WX Phase 1B.5 Master Spec · Implementation Master Spec §1B.5.6
 */

import type { WorkspaceCapabilityPlan } from "./resolve-workspace-capabilities";
import { WORKSPACE_CAPABILITY_FRAMEWORK } from "./resolve-workspace-capabilities";
import type {
  WorkspaceModeId,
  WorkspaceModePlan,
  WorkspacePosture,
} from "./resolve-workspace-mode";
import {
  WORKSPACE_ASSIST_ELIGIBILITY,
  resolveAssistEligibility,
  type AssistEligibilityPlan,
} from "./resolve-assist-eligibility";
import {
  WORKSPACE_PROGRESSIVE_DISCLOSURE,
  resolveProgressiveDisclosure,
  type ProgressiveDisclosurePlan,
} from "./resolve-progressive-disclosure";
import {
  WORKSPACE_TOOL_ACTION_PRESENTATION,
  resolveToolActionPresentation,
  type ToolActionPresentationPlan,
} from "./resolve-tool-action-presentation";
import {
  WORKSPACE_SURFACE_PRESENTATION,
  type SurfacePresentationPlan,
  type SurfacePresentationState,
  resolveSurfacePresentationFromPlans,
} from "./resolve-surface-presentation";
import {
  WORKSPACE_SURFACE_REGISTRY,
  type WorkspaceSurfaceId,
} from "./workspace-surface-registry";

/** Sealed Honesty Density contract identity for Phase 1B.5.6. */
export const WORKSPACE_HONESTY_DENSITY = {
  phase: "1b.5.6",
  contractId: "wx-honesty-density-v1",
  contractVersion: "1.0.0",
  honestySurfaceIds: [
    "stage",
    "orientation",
    "command",
    "assist-primary",
    "assist-secondary",
    "tool",
    "disclosure",
  ] as const,
  drivesChrome: false,
  appliesCompaction: false,
  rendersDensityUi: false,
  activatesCapabilities: false,
  diagnosticsOnly: true,
  visualActivationAuthorized: false,
  neverInspectViewport: true,
  neverInspectDevice: true,
  neverInspectUserAgent: true,
  neverInspectDom: true,
  neverInspectCss: true,
  neverRemount: true,
  neverTransferOwnership: true,
} as const;

export type HonestySurfaceId =
  (typeof WORKSPACE_HONESTY_DENSITY.honestySurfaceIds)[number];

export type HonestyDensityState =
  | "UNKNOWN"
  | "EMPTY"
  | "SPARSE"
  | "NORMAL"
  | "DENSE"
  | "OVERFLOW";

export type HonestyCompactState =
  | "NONE"
  | "OPTIONAL"
  | "RECOMMENDED"
  | "REQUIRED";

export type HonestyDensityReason =
  | "stage-primary-normal"
  | "core-chrome-normal"
  | "core-chrome-height-demoted"
  | "core-chrome-landscape-honesty"
  | "assist-absent-empty"
  | "assist-suppressed-empty"
  | "assist-future-sparse"
  | "assist-eligible-sparse-hollow"
  | "assist-capacity-normal"
  | "tool-reachable-sparse"
  | "tool-persistent-normal"
  | "tool-persistent-dense"
  | "disclosure-hidden-empty"
  | "disclosure-discoverable-sparse"
  | "disclosure-listed-normal"
  | "presentation-absent-empty"
  | "presentation-reachable-sparse"
  | "presentation-persistent-normal"
  | "presentation-compacted-dense"
  | "contention-overflow"
  | "fail-closed-unknown"
  | "presentation-plan-rejected"
  | "upstream-plan-rejected";

export type HonestyDensityConfidence = "high" | "medium" | "low";

export type HonestyDensityEntry = {
  surfaceId: HonestySurfaceId;
  registryVersion: string;
  honestyContractVersion: string;
  presentationState: SurfacePresentationState | "n/a";
  density: HonestyDensityState;
  compactState: HonestyCompactState;
  reason: HonestyDensityReason;
  confidence: HonestyDensityConfidence;
  /** Always false in 1B.5.6 — planning only. */
  renderAuthorized: false;
  /** Always false — compaction is not applied to chrome in this phase. */
  compactionAuthorized: false;
  diagnostics: {
    priorityRank: number;
    heightDemoted: boolean;
    posture: WorkspacePosture;
    mode: WorkspaceModeId;
  };
};

export type HonestyDensityPlanStatus = "ok" | "rejected";

export type HonestyDensityPlan = {
  status: HonestyDensityPlanStatus;
  rejectionReasons: readonly string[];
  phase: typeof WORKSPACE_HONESTY_DENSITY.phase;
  contractId: typeof WORKSPACE_HONESTY_DENSITY.contractId;
  contractVersion: typeof WORKSPACE_HONESTY_DENSITY.contractVersion;
  presentationContractId: typeof WORKSPACE_SURFACE_PRESENTATION.contractId;
  disclosureContractId: typeof WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId;
  toolActionContractId: typeof WORKSPACE_TOOL_ACTION_PRESENTATION.contractId;
  eligibilityContractId: typeof WORKSPACE_ASSIST_ELIGIBILITY.contractId;
  registryContractId: typeof WORKSPACE_SURFACE_REGISTRY.contractId;
  capabilityContractId: typeof WORKSPACE_CAPABILITY_FRAMEWORK.contractId;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  heightDemoted: boolean;
  landscapeCarveOut: boolean;
  orderedSurfaceIds: readonly HonestySurfaceId[];
  emptySurfaceIds: readonly HonestySurfaceId[];
  sparseSurfaceIds: readonly HonestySurfaceId[];
  normalSurfaceIds: readonly HonestySurfaceId[];
  denseSurfaceIds: readonly HonestySurfaceId[];
  overflowSurfaceIds: readonly HonestySurfaceId[];
  unknownSurfaceIds: readonly HonestySurfaceId[];
  compactNoneIds: readonly HonestySurfaceId[];
  compactOptionalIds: readonly HonestySurfaceId[];
  compactRecommendedIds: readonly HonestySurfaceId[];
  compactRequiredIds: readonly HonestySurfaceId[];
  entries: readonly HonestyDensityEntry[];
  entryById: Readonly<Record<HonestySurfaceId, HonestyDensityEntry>>;
  stabilityToken: string;
  drivesChrome: false;
  appliesCompaction: false;
  rendersDensityUi: false;
  visualActivationAuthorized: false;
  diagnosticsOnly: true;
};

export type HonestyDensityResolveInput = {
  registryContractId: string;
  registryContractVersion: string;
  capabilityContractId: string;
  presentationContractId: string;
  presentationContractVersion: string;
  disclosureContractId: string;
  disclosureContractVersion: string;
  toolActionContractId: string;
  toolActionContractVersion: string;
  presentationPlan: SurfacePresentationPlan;
  progressiveDisclosurePlan: ProgressiveDisclosurePlan;
  toolActionPlan: ToolActionPresentationPlan;
  assistEligibilityPlan: AssistEligibilityPlan;
  honestySurfaceIds?: readonly string[];
};

const HONESTY_SET: ReadonlySet<string> = new Set(
  WORKSPACE_HONESTY_DENSITY.honestySurfaceIds,
);

const PRIORITY: Readonly<Record<HonestySurfaceId, number>> = {
  stage: 1,
  orientation: 2,
  command: 2,
  disclosure: 3,
  "assist-primary": 4,
  "assist-secondary": 5,
  tool: 6,
};

export const HONESTY_DENSITY_FORBIDDEN_SOURCE_PATTERNS = [
  /\bnavigator\./,
  /\buserAgent\b/,
  /\bmatchMedia\b/,
  /\bwindow\./,
  /\bdocument\./,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bgetBoundingClientRect\b/,
  /\bResizeObserver\b/,
] as const;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const key of Object.keys(value as object)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

function tokenFor(plan: {
  status: string;
  mode: string;
  posture: string;
  states: readonly string[];
}): string {
  return [
    "wx-hd",
    WORKSPACE_HONESTY_DENSITY.contractVersion,
    plan.status,
    plan.mode,
    plan.posture,
    plan.states.join("|"),
  ].join(":");
}

function validateInput(input: HonestyDensityResolveInput): string[] {
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
  if (input.presentationContractId !== WORKSPACE_SURFACE_PRESENTATION.contractId) {
    reasons.push("presentation-contract-mismatch");
  }
  if (
    input.presentationContractVersion !==
    WORKSPACE_SURFACE_PRESENTATION.contractVersion
  ) {
    reasons.push("presentation-version-mismatch");
  }
  if (
    input.disclosureContractId !== WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId
  ) {
    reasons.push("disclosure-contract-mismatch");
  }
  if (
    input.disclosureContractVersion !==
    WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion
  ) {
    reasons.push("disclosure-version-mismatch");
  }
  if (
    input.toolActionContractId !== WORKSPACE_TOOL_ACTION_PRESENTATION.contractId
  ) {
    reasons.push("tool-action-contract-mismatch");
  }
  if (
    input.toolActionContractVersion !==
    WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion
  ) {
    reasons.push("tool-action-version-mismatch");
  }
  if (!input.presentationPlan || typeof input.presentationPlan !== "object") {
    reasons.push("missing-presentation-plan");
  }
  if (
    !input.progressiveDisclosurePlan ||
    typeof input.progressiveDisclosurePlan !== "object"
  ) {
    reasons.push("missing-disclosure-plan");
  }
  if (!input.toolActionPlan || typeof input.toolActionPlan !== "object") {
    reasons.push("missing-tool-action-plan");
  }
  if (
    !input.assistEligibilityPlan ||
    typeof input.assistEligibilityPlan !== "object"
  ) {
    reasons.push("missing-assist-eligibility-plan");
  }
  const ids = input.honestySurfaceIds ?? [
    ...WORKSPACE_HONESTY_DENSITY.honestySurfaceIds,
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      reasons.push("duplicate-honesty-surface");
      break;
    }
    seen.add(id);
    if (!HONESTY_SET.has(id)) {
      reasons.push("unknown-honesty-surface");
      break;
    }
  }
  return reasons;
}

function entryFor(
  surfaceId: HonestySurfaceId,
  presentationPlan: SurfacePresentationPlan,
  disclosurePlan: ProgressiveDisclosurePlan,
  toolActionPlan: ToolActionPresentationPlan,
  assistPlan: AssistEligibilityPlan,
): HonestyDensityEntry {
  const pe = presentationPlan.entryById[surfaceId as WorkspaceSurfaceId];
  const heightDemoted = presentationPlan.heightDemoted === true;
  const posture = presentationPlan.posture;
  const mode = presentationPlan.mode;
  const baseDiag = {
    priorityRank: PRIORITY[surfaceId],
    heightDemoted,
    posture,
    mode,
  };
  const base = {
    surfaceId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    honestyContractVersion: WORKSPACE_HONESTY_DENSITY.contractVersion,
    presentationState: (pe?.presentationState ?? "n/a") as
      | SurfacePresentationState
      | "n/a",
    renderAuthorized: false as const,
    compactionAuthorized: false as const,
    diagnostics: baseDiag,
  };

  if (!pe) {
    return {
      ...base,
      density: "UNKNOWN",
      compactState: "NONE",
      reason: "fail-closed-unknown",
      confidence: "low",
    };
  }

  // Stage — always primary; honesty = NORMAL unless rejected upstream.
  if (surfaceId === "stage") {
    return {
      ...base,
      density: "NORMAL",
      compactState: "NONE",
      reason: "stage-primary-normal",
      confidence: "high",
    };
  }

  // Orientation / Command — CORE chrome honesty.
  if (surfaceId === "orientation" || surfaceId === "command") {
    if (heightDemoted) {
      return {
        ...base,
        density: "DENSE",
        compactState: "REQUIRED",
        reason: "core-chrome-height-demoted",
        confidence: "high",
      };
    }
    if (posture === "landscape") {
      return {
        ...base,
        density: "NORMAL",
        compactState: "RECOMMENDED",
        reason: "core-chrome-landscape-honesty",
        confidence: "high",
      };
    }
    return {
      ...base,
      density: "NORMAL",
      compactState: "NONE",
      reason: "core-chrome-normal",
      confidence: "high",
    };
  }

  // Assist surfaces — eligibility + presentation honesty (hollow-ban aware).
  if (surfaceId === "assist-primary" || surfaceId === "assist-secondary") {
    const ae = assistPlan.entryById[surfaceId];
    if (!ae || ae.eligibilityState === "ineligible") {
      return {
        ...base,
        density: "EMPTY",
        compactState: "NONE",
        reason: "assist-absent-empty",
        confidence: "high",
      };
    }
    if (ae.eligibilityState === "suppressed" || ae.eligibilityState === "reserved") {
      return {
        ...base,
        density: "EMPTY",
        compactState: "NONE",
        reason: "assist-suppressed-empty",
        confidence: "high",
      };
    }
    if (ae.eligibilityState === "future-eligible") {
      return {
        ...base,
        density: "SPARSE",
        compactState: "NONE",
        reason: "assist-future-sparse",
        confidence: "medium",
      };
    }
    // eligible but hollow-ban → sparse honesty (capacity without living content)
    if (ae.eligibilityState === "eligible" && ae.suppressionReason === "hollow-ban") {
      return {
        ...base,
        density: "SPARSE",
        compactState: heightDemoted ? "OPTIONAL" : "NONE",
        reason: "assist-eligible-sparse-hollow",
        confidence: "high",
      };
    }
    if (pe.presentationState === "compacted") {
      return {
        ...base,
        density: "DENSE",
        compactState: "RECOMMENDED",
        reason: "presentation-compacted-dense",
        confidence: "high",
      };
    }
    return {
      ...base,
      density: "NORMAL",
      compactState: heightDemoted ? "OPTIONAL" : "NONE",
      reason: "assist-capacity-normal",
      confidence: "medium",
    };
  }

  // Tool surface — consume tool-action aggregate + presentation.
  if (surfaceId === "tool") {
    const tool = toolActionPlan.entryById.tool;
    const persistentCount = toolActionPlan.persistentToolActionIds.length;
    if (pe.presentationState === "absent") {
      return {
        ...base,
        density: "EMPTY",
        compactState: "NONE",
        reason: "presentation-absent-empty",
        confidence: "high",
      };
    }
    if (
      tool?.presentationState === "persistent" ||
      pe.presentationState === "persistent"
    ) {
      if (persistentCount >= 4 && heightDemoted) {
        return {
          ...base,
          density: "OVERFLOW",
          compactState: "REQUIRED",
          reason: "contention-overflow",
          confidence: "medium",
        };
      }
      if (persistentCount >= 3) {
        return {
          ...base,
          density: "DENSE",
          compactState: heightDemoted ? "REQUIRED" : "OPTIONAL",
          reason: "tool-persistent-dense",
          confidence: "high",
        };
      }
      return {
        ...base,
        density: "NORMAL",
        compactState: "NONE",
        reason: "tool-persistent-normal",
        confidence: "high",
      };
    }
    return {
      ...base,
      density: "SPARSE",
      compactState: "NONE",
      reason: "tool-reachable-sparse",
      confidence: "high",
    };
  }

  // Disclosure surface.
  if (surfaceId === "disclosure") {
    const de = disclosurePlan.entryById.disclosure;
    const ds = de?.disclosureState;
    if (ds === "hidden" || pe.presentationState === "absent") {
      return {
        ...base,
        density: "EMPTY",
        compactState: "NONE",
        reason: "disclosure-hidden-empty",
        confidence: "high",
      };
    }
    if (ds === "discoverable" || ds === "future-disclosure") {
      return {
        ...base,
        density: "SPARSE",
        compactState: "NONE",
        reason: "disclosure-discoverable-sparse",
        confidence: "high",
      };
    }
    if (ds === "disclosed") {
      return {
        ...base,
        density: "NORMAL",
        compactState: "NONE",
        reason: "disclosure-listed-normal",
        confidence: "high",
      };
    }
    if (pe.presentationState === "reachable") {
      return {
        ...base,
        density: "SPARSE",
        compactState: "NONE",
        reason: "presentation-reachable-sparse",
        confidence: "medium",
      };
    }
  }

  // Generic presentation fallback.
  if (pe.presentationState === "absent" || pe.presentationState === "reserved-blocked") {
    return {
      ...base,
      density: "EMPTY",
      compactState: "NONE",
      reason: "presentation-absent-empty",
      confidence: "high",
    };
  }
  if (pe.presentationState === "reachable") {
    return {
      ...base,
      density: "SPARSE",
      compactState: "NONE",
      reason: "presentation-reachable-sparse",
      confidence: "medium",
    };
  }
  if (pe.presentationState === "compacted") {
    return {
      ...base,
      density: "DENSE",
      compactState: "RECOMMENDED",
      reason: "presentation-compacted-dense",
      confidence: "high",
    };
  }
  if (pe.presentationState === "persistent") {
    return {
      ...base,
      density: "NORMAL",
      compactState: heightDemoted ? "OPTIONAL" : "NONE",
      reason: "presentation-persistent-normal",
      confidence: "medium",
    };
  }

  return {
    ...base,
    density: "UNKNOWN",
    compactState: "NONE",
    reason: "fail-closed-unknown",
    confidence: "low",
  };
}

function buildPlan(
  entries: HonestyDensityEntry[],
  meta: {
    status: HonestyDensityPlanStatus;
    rejectionReasons: readonly string[];
    presentationPlan: SurfacePresentationPlan;
  },
): HonestyDensityPlan {
  const sorted = [...entries].sort(
    (a, b) => a.diagnostics.priorityRank - b.diagnostics.priorityRank,
  );
  const orderedSurfaceIds = sorted.map((e) => e.surfaceId);
  const by = (d: HonestyDensityState) =>
    sorted.filter((e) => e.density === d).map((e) => e.surfaceId);
  const byC = (c: HonestyCompactState) =>
    sorted.filter((e) => e.compactState === c).map((e) => e.surfaceId);

  const entryById = {} as Record<HonestySurfaceId, HonestyDensityEntry>;
  for (const e of sorted) entryById[e.surfaceId] = e;

  const stabilityToken = tokenFor({
    status: meta.status,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    states: sorted.map((e) => `${e.surfaceId}=${e.density}/${e.compactState}`),
  });

  return {
    status: meta.status,
    rejectionReasons: meta.rejectionReasons,
    phase: WORKSPACE_HONESTY_DENSITY.phase,
    contractId: WORKSPACE_HONESTY_DENSITY.contractId,
    contractVersion: WORKSPACE_HONESTY_DENSITY.contractVersion,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    toolActionContractId: WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    eligibilityContractId: WORKSPACE_ASSIST_ELIGIBILITY.contractId,
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    heightDemoted: meta.presentationPlan.heightDemoted === true,
    landscapeCarveOut: meta.presentationPlan.landscapeCarveOut === true,
    orderedSurfaceIds,
    emptySurfaceIds: by("EMPTY"),
    sparseSurfaceIds: by("SPARSE"),
    normalSurfaceIds: by("NORMAL"),
    denseSurfaceIds: by("DENSE"),
    overflowSurfaceIds: by("OVERFLOW"),
    unknownSurfaceIds: by("UNKNOWN"),
    compactNoneIds: byC("NONE"),
    compactOptionalIds: byC("OPTIONAL"),
    compactRecommendedIds: byC("RECOMMENDED"),
    compactRequiredIds: byC("REQUIRED"),
    entries: sorted,
    entryById,
    stabilityToken,
    drivesChrome: false,
    appliesCompaction: false,
    rendersDensityUi: false,
    visualActivationAuthorized: false,
    diagnosticsOnly: true,
  };
}

function failClosedPlan(
  input: HonestyDensityResolveInput,
  rejectionReasons: readonly string[],
): HonestyDensityPlan {
  const pp = input.presentationPlan;
  const mode: WorkspaceModeId =
    pp && typeof pp.mode === "string" ? pp.mode : "browse";
  const posture: WorkspacePosture =
    pp && (pp.posture === "portrait" || pp.posture === "landscape")
      ? pp.posture
      : "portrait";
  const stub = {
    ...(pp ?? {}),
    mode,
    posture,
    heightDemoted: false,
    landscapeCarveOut: false,
    usableWidthPx: pp?.usableWidthPx ?? 0,
    usableHeightPx: pp?.usableHeightPx ?? 0,
    entryById: pp?.entryById ?? ({} as SurfacePresentationPlan["entryById"]),
  } as SurfacePresentationPlan;

  const ids = (
    input.honestySurfaceIds ?? [...WORKSPACE_HONESTY_DENSITY.honestySurfaceIds]
  ).filter((id): id is HonestySurfaceId => HONESTY_SET.has(id));
  const list =
    ids.length > 0 ? ids : [...WORKSPACE_HONESTY_DENSITY.honestySurfaceIds];

  const entries: HonestyDensityEntry[] = list.map((surfaceId) => ({
    surfaceId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    honestyContractVersion: WORKSPACE_HONESTY_DENSITY.contractVersion,
    presentationState: "n/a",
    density: "UNKNOWN",
    compactState: "NONE",
    reason: "fail-closed-unknown",
    confidence: "low",
    renderAuthorized: false,
    compactionAuthorized: false,
    diagnostics: {
      priorityRank: PRIORITY[surfaceId],
      heightDemoted: false,
      posture,
      mode,
    },
  }));

  return deepFreeze(
    buildPlan(entries, {
      status: "rejected",
      rejectionReasons,
      presentationPlan: stub,
    }),
  );
}

export function resolveHonestyDensity(
  input: HonestyDensityResolveInput,
): HonestyDensityPlan {
  const rejectionReasons = validateInput(input);
  if (rejectionReasons.length > 0) {
    return failClosedPlan(input, rejectionReasons);
  }

  const {
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
  } = input;

  if (presentationPlan.status === "rejected") {
    return failClosedPlan(input, [
      "presentation-plan-rejected",
      ...presentationPlan.rejectionReasons,
    ]);
  }
  if (progressiveDisclosurePlan.status === "rejected") {
    return failClosedPlan(input, [
      "upstream-plan-rejected",
      "disclosure-plan-rejected",
    ]);
  }
  if (toolActionPlan.status === "rejected") {
    return failClosedPlan(input, [
      "upstream-plan-rejected",
      "tool-action-plan-rejected",
    ]);
  }
  if (assistEligibilityPlan.status === "rejected") {
    return failClosedPlan(input, [
      "upstream-plan-rejected",
      "assist-eligibility-plan-rejected",
    ]);
  }

  const ids = (input.honestySurfaceIds ?? [
    ...WORKSPACE_HONESTY_DENSITY.honestySurfaceIds,
  ]) as HonestySurfaceId[];

  const entries = ids.map((id) =>
    entryFor(
      id,
      presentationPlan,
      progressiveDisclosurePlan,
      toolActionPlan,
      assistEligibilityPlan,
    ),
  );

  return deepFreeze(
    buildPlan(entries, {
      status: "ok",
      rejectionReasons: [],
      presentationPlan,
    }),
  );
}

export function resolveHonestyDensityFromPlans(
  modePlan: WorkspaceModePlan,
  capabilityPlan: WorkspaceCapabilityPlan,
): HonestyDensityPlan {
  const presentationPlan = resolveSurfacePresentationFromPlans(
    modePlan,
    capabilityPlan,
  );
  const assistEligibilityPlan = resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
  const progressiveDisclosurePlan = resolveProgressiveDisclosure({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    eligibilityContractId: WORKSPACE_ASSIST_ELIGIBILITY.contractId,
    eligibilityContractVersion: WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
    presentationPlan,
    assistEligibilityPlan,
  });
  const toolActionPlan = resolveToolActionPresentation(
    {
      registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
      registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
      capabilityContractId: capabilityPlan.contractId,
      presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
      presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
      disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
      disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
      presentationPlan,
      progressiveDisclosurePlan,
    },
    capabilityPlan,
  );
  return resolveHonestyDensity({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    toolActionContractId: WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    toolActionContractVersion: WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
  });
}

export function getHonestyDensityEntry(
  plan: HonestyDensityPlan,
  id: HonestySurfaceId,
): HonestyDensityEntry | undefined {
  return plan.entryById[id];
}

export function isHonestyRenderAuthorized(
  plan: HonestyDensityPlan,
  id: HonestySurfaceId,
): boolean {
  return plan.entryById[id]?.renderAuthorized === true;
}

export function isHonestyCompactionAuthorized(
  plan: HonestyDensityPlan,
  id: HonestySurfaceId,
): boolean {
  return plan.entryById[id]?.compactionAuthorized === true;
}

export function serializeHonestyDensityPlan(plan: HonestyDensityPlan): {
  status: HonestyDensityPlanStatus;
  contractId: string;
  contractVersion: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  orderedSurfaceIds: HonestySurfaceId[];
  emptySurfaceIds: HonestySurfaceId[];
  sparseSurfaceIds: HonestySurfaceId[];
  normalSurfaceIds: HonestySurfaceId[];
  denseSurfaceIds: HonestySurfaceId[];
  overflowSurfaceIds: HonestySurfaceId[];
  unknownSurfaceIds: HonestySurfaceId[];
  drivesChrome: false;
  appliesCompaction: false;
  diagnosticsOnly: true;
  stabilityToken: string;
} {
  return {
    status: plan.status,
    contractId: plan.contractId,
    contractVersion: plan.contractVersion,
    mode: plan.mode,
    posture: plan.posture,
    orderedSurfaceIds: [...plan.orderedSurfaceIds],
    emptySurfaceIds: [...plan.emptySurfaceIds],
    sparseSurfaceIds: [...plan.sparseSurfaceIds],
    normalSurfaceIds: [...plan.normalSurfaceIds],
    denseSurfaceIds: [...plan.denseSurfaceIds],
    overflowSurfaceIds: [...plan.overflowSurfaceIds],
    unknownSurfaceIds: [...plan.unknownSurfaceIds],
    drivesChrome: false,
    appliesCompaction: false,
    diagnosticsOnly: true,
    stabilityToken: plan.stabilityToken,
  };
}
