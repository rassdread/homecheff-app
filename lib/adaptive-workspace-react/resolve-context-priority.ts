/**
 * WX Phase 1B.5.7 — Contextual Priority & Surface Ranking.
 *
 * Pure · deterministic · synchronous · side-effect free · immutable · serializable.
 * Framework-independent · browser-independent · React-independent.
 *
 * Builds a Contextual Priority plan on top of:
 *   Surface Registry → Presentation → Assist → Disclosure →
 *   Tool Action → Honesty Density → Contextual Priority
 *
 * Computes priority / ranking metadata only from already-resolved Workspace
 * plans. Does NOT inspect DOM, CSS, pixels, user agent, or viewport APIs.
 *
 * Does NOT render · Does NOT reorder · Does NOT change layout/visibility ·
 * Does NOT activate · Does NOT remount · Does NOT transfer ownership.
 *
 * Authority: WX Phase 1B.5 Master Spec · Implementation Master Spec §1B.5.7
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
  WORKSPACE_HONESTY_DENSITY,
  resolveHonestyDensity,
  type HonestyDensityPlan,
  type HonestyDensityState,
} from "./resolve-honesty-density";
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

/** Sealed Contextual Priority contract identity for Phase 1B.5.7. */
export const WORKSPACE_CONTEXT_PRIORITY = {
  phase: "1b.5.7",
  contractId: "wx-context-priority-v1",
  contractVersion: "1.0.0",
  prioritySurfaceIds: [
    "stage",
    "orientation",
    "command",
    "assist-primary",
    "assist-secondary",
    "tool",
    "disclosure",
  ] as const,
  drivesChrome: false,
  appliesOrdering: false,
  rendersPriorityUi: false,
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
  neverReorderSurfaces: true,
} as const;

export type PrioritySurfaceId =
  (typeof WORKSPACE_CONTEXT_PRIORITY.prioritySurfaceIds)[number];

export type ContextPriorityLevel =
  | "UNKNOWN"
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type ContextPriorityReason =
  | "stage-primary-critical"
  | "core-chrome-high"
  | "core-chrome-critical-height-demoted"
  | "assist-absent-low"
  | "assist-future-low"
  | "assist-hollow-low"
  | "assist-capacity-normal"
  | "tool-reachable-normal"
  | "tool-dense-high"
  | "tool-overflow-critical"
  | "disclosure-hidden-low"
  | "disclosure-discoverable-low"
  | "disclosure-listed-normal"
  | "presentation-absent-low"
  | "presentation-reachable-normal"
  | "presentation-persistent-high"
  | "fail-closed-unknown"
  | "honesty-plan-rejected"
  | "upstream-plan-rejected";

export type ContextPriorityConfidence = "high" | "medium" | "low";

export type ContextPriorityEntry = {
  surfaceId: PrioritySurfaceId;
  registryVersion: string;
  priorityContractVersion: string;
  presentationState: SurfacePresentationState | "n/a";
  honestyDensity: HonestyDensityState | "n/a";
  priority: ContextPriorityLevel;
  priorityScore: number;
  reason: ContextPriorityReason;
  confidence: ContextPriorityConfidence;
  /** Always false in 1B.5.7 — planning only. */
  renderAuthorized: false;
  /** Always false — ranking does not reorder surfaces in this phase. */
  orderingAuthorized: false;
  diagnostics: {
    rankIndex: number;
    heightDemoted: boolean;
    posture: WorkspacePosture;
    mode: WorkspaceModeId;
  };
};

export type ContextPriorityPlanStatus = "ok" | "rejected";

export type ContextPriorityPlan = {
  status: ContextPriorityPlanStatus;
  rejectionReasons: readonly string[];
  phase: typeof WORKSPACE_CONTEXT_PRIORITY.phase;
  contractId: typeof WORKSPACE_CONTEXT_PRIORITY.contractId;
  contractVersion: typeof WORKSPACE_CONTEXT_PRIORITY.contractVersion;
  honestyContractId: typeof WORKSPACE_HONESTY_DENSITY.contractId;
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
  orderedSurfaceIds: readonly PrioritySurfaceId[];
  unknownSurfaceIds: readonly PrioritySurfaceId[];
  lowSurfaceIds: readonly PrioritySurfaceId[];
  normalSurfaceIds: readonly PrioritySurfaceId[];
  highSurfaceIds: readonly PrioritySurfaceId[];
  criticalSurfaceIds: readonly PrioritySurfaceId[];
  entries: readonly ContextPriorityEntry[];
  entryById: Readonly<Record<PrioritySurfaceId, ContextPriorityEntry>>;
  stabilityToken: string;
  drivesChrome: false;
  appliesOrdering: false;
  rendersPriorityUi: false;
  visualActivationAuthorized: false;
  diagnosticsOnly: true;
};

export type ContextPriorityResolveInput = {
  registryContractId: string;
  registryContractVersion: string;
  capabilityContractId: string;
  presentationContractId: string;
  presentationContractVersion: string;
  disclosureContractId: string;
  disclosureContractVersion: string;
  toolActionContractId: string;
  toolActionContractVersion: string;
  honestyContractId: string;
  honestyContractVersion: string;
  presentationPlan: SurfacePresentationPlan;
  progressiveDisclosurePlan: ProgressiveDisclosurePlan;
  toolActionPlan: ToolActionPresentationPlan;
  assistEligibilityPlan: AssistEligibilityPlan;
  honestyDensityPlan: HonestyDensityPlan;
  prioritySurfaceIds?: readonly string[];
};

const PRIORITY_SET: ReadonlySet<string> = new Set(
  WORKSPACE_CONTEXT_PRIORITY.prioritySurfaceIds,
);

const RANK_INDEX: Readonly<Record<PrioritySurfaceId, number>> = {
  stage: 1,
  orientation: 2,
  command: 2,
  disclosure: 3,
  "assist-primary": 4,
  "assist-secondary": 5,
  tool: 6,
};

const SCORE: Readonly<Record<ContextPriorityLevel, number>> = {
  UNKNOWN: 0,
  LOW: 25,
  NORMAL: 50,
  HIGH: 75,
  CRITICAL: 100,
};

export const CONTEXT_PRIORITY_FORBIDDEN_SOURCE_PATTERNS = [
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
    "wx-cp",
    WORKSPACE_CONTEXT_PRIORITY.contractVersion,
    plan.status,
    plan.mode,
    plan.posture,
    plan.states.join("|"),
  ].join(":");
}

function validateInput(input: ContextPriorityResolveInput): string[] {
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
  if (input.honestyContractId !== WORKSPACE_HONESTY_DENSITY.contractId) {
    reasons.push("honesty-contract-mismatch");
  }
  if (
    input.honestyContractVersion !== WORKSPACE_HONESTY_DENSITY.contractVersion
  ) {
    reasons.push("honesty-version-mismatch");
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
  if (!input.honestyDensityPlan || typeof input.honestyDensityPlan !== "object") {
    reasons.push("missing-honesty-density-plan");
  }
  const ids = input.prioritySurfaceIds ?? [
    ...WORKSPACE_CONTEXT_PRIORITY.prioritySurfaceIds,
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      reasons.push("duplicate-priority-surface");
      break;
    }
    seen.add(id);
    if (!PRIORITY_SET.has(id)) {
      reasons.push("unknown-priority-surface");
      break;
    }
  }
  return reasons;
}

function level(
  priority: ContextPriorityLevel,
): { priority: ContextPriorityLevel; priorityScore: number } {
  return { priority, priorityScore: SCORE[priority] };
}

function entryFor(
  surfaceId: PrioritySurfaceId,
  presentationPlan: SurfacePresentationPlan,
  disclosurePlan: ProgressiveDisclosurePlan,
  toolActionPlan: ToolActionPresentationPlan,
  assistPlan: AssistEligibilityPlan,
  honestyPlan: HonestyDensityPlan,
): ContextPriorityEntry {
  const pe = presentationPlan.entryById[surfaceId as WorkspaceSurfaceId];
  const he = honestyPlan.entryById[surfaceId as keyof typeof honestyPlan.entryById];
  const heightDemoted = presentationPlan.heightDemoted === true;
  const posture = presentationPlan.posture;
  const mode = presentationPlan.mode;
  const base = {
    surfaceId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    priorityContractVersion: WORKSPACE_CONTEXT_PRIORITY.contractVersion,
    presentationState: (pe?.presentationState ?? "n/a") as
      | SurfacePresentationState
      | "n/a",
    honestyDensity: (he?.density ?? "n/a") as HonestyDensityState | "n/a",
    renderAuthorized: false as const,
    orderingAuthorized: false as const,
    diagnostics: {
      rankIndex: RANK_INDEX[surfaceId],
      heightDemoted,
      posture,
      mode,
    },
  };

  if (!pe || !he || he.density === "UNKNOWN") {
    return {
      ...base,
      ...level("UNKNOWN"),
      reason: "fail-closed-unknown",
      confidence: "low",
    };
  }

  if (surfaceId === "stage") {
    return {
      ...base,
      ...level("CRITICAL"),
      reason: "stage-primary-critical",
      confidence: "high",
    };
  }

  if (surfaceId === "orientation" || surfaceId === "command") {
    if (heightDemoted) {
      return {
        ...base,
        ...level("CRITICAL"),
        reason: "core-chrome-critical-height-demoted",
        confidence: "high",
      };
    }
    return {
      ...base,
      ...level("HIGH"),
      reason: "core-chrome-high",
      confidence: "high",
    };
  }

  if (surfaceId === "assist-primary" || surfaceId === "assist-secondary") {
    const ae = assistPlan.entryById[surfaceId];
    if (
      !ae ||
      ae.eligibilityState === "ineligible" ||
      ae.eligibilityState === "suppressed" ||
      ae.eligibilityState === "reserved"
    ) {
      return {
        ...base,
        ...level("LOW"),
        reason: "assist-absent-low",
        confidence: "high",
      };
    }
    if (ae.eligibilityState === "future-eligible") {
      return {
        ...base,
        ...level("LOW"),
        reason: "assist-future-low",
        confidence: "medium",
      };
    }
    if (ae.eligibilityState === "eligible" && ae.suppressionReason === "hollow-ban") {
      return {
        ...base,
        ...level("LOW"),
        reason: "assist-hollow-low",
        confidence: "high",
      };
    }
    return {
      ...base,
      ...level("NORMAL"),
      reason: "assist-capacity-normal",
      confidence: "medium",
    };
  }

  if (surfaceId === "tool") {
    if (he.density === "OVERFLOW") {
      return {
        ...base,
        ...level("CRITICAL"),
        reason: "tool-overflow-critical",
        confidence: "medium",
      };
    }
    if (he.density === "DENSE" || toolActionPlan.persistentToolActionIds.length >= 3) {
      return {
        ...base,
        ...level("HIGH"),
        reason: "tool-dense-high",
        confidence: "high",
      };
    }
    return {
      ...base,
      ...level("NORMAL"),
      reason: "tool-reachable-normal",
      confidence: "high",
    };
  }

  if (surfaceId === "disclosure") {
    const de = disclosurePlan.entryById.disclosure;
    const ds = de?.disclosureState;
    if (ds === "hidden" || pe.presentationState === "absent" || he.density === "EMPTY") {
      return {
        ...base,
        ...level("LOW"),
        reason: "disclosure-hidden-low",
        confidence: "high",
      };
    }
    if (ds === "discoverable" || ds === "future-disclosure" || he.density === "SPARSE") {
      return {
        ...base,
        ...level("LOW"),
        reason: "disclosure-discoverable-low",
        confidence: "high",
      };
    }
    if (ds === "disclosed") {
      return {
        ...base,
        ...level("NORMAL"),
        reason: "disclosure-listed-normal",
        confidence: "high",
      };
    }
  }

  if (pe.presentationState === "absent" || pe.presentationState === "reserved-blocked") {
    return {
      ...base,
      ...level("LOW"),
      reason: "presentation-absent-low",
      confidence: "high",
    };
  }
  if (pe.presentationState === "reachable") {
    return {
      ...base,
      ...level("NORMAL"),
      reason: "presentation-reachable-normal",
      confidence: "medium",
    };
  }
  if (pe.presentationState === "persistent" || pe.presentationState === "compacted") {
    return {
      ...base,
      ...level("HIGH"),
      reason: "presentation-persistent-high",
      confidence: "medium",
    };
  }

  return {
    ...base,
    ...level("UNKNOWN"),
    reason: "fail-closed-unknown",
    confidence: "low",
  };
}

function buildPlan(
  entries: ContextPriorityEntry[],
  meta: {
    status: ContextPriorityPlanStatus;
    rejectionReasons: readonly string[];
    presentationPlan: SurfacePresentationPlan;
  },
): ContextPriorityPlan {
  // Stable sealed order by rankIndex — NOT a UI reorder; diagnostics listing only.
  const sorted = [...entries].sort(
    (a, b) => a.diagnostics.rankIndex - b.diagnostics.rankIndex,
  );
  const orderedSurfaceIds = sorted.map((e) => e.surfaceId);
  const by = (p: ContextPriorityLevel) =>
    sorted.filter((e) => e.priority === p).map((e) => e.surfaceId);

  const entryById = {} as Record<PrioritySurfaceId, ContextPriorityEntry>;
  for (const e of sorted) entryById[e.surfaceId] = e;

  const stabilityToken = tokenFor({
    status: meta.status,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    states: sorted.map(
      (e) => `${e.surfaceId}=${e.priority}:${e.priorityScore}`,
    ),
  });

  return {
    status: meta.status,
    rejectionReasons: meta.rejectionReasons,
    phase: WORKSPACE_CONTEXT_PRIORITY.phase,
    contractId: WORKSPACE_CONTEXT_PRIORITY.contractId,
    contractVersion: WORKSPACE_CONTEXT_PRIORITY.contractVersion,
    honestyContractId: WORKSPACE_HONESTY_DENSITY.contractId,
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
    unknownSurfaceIds: by("UNKNOWN"),
    lowSurfaceIds: by("LOW"),
    normalSurfaceIds: by("NORMAL"),
    highSurfaceIds: by("HIGH"),
    criticalSurfaceIds: by("CRITICAL"),
    entries: sorted,
    entryById,
    stabilityToken,
    drivesChrome: false,
    appliesOrdering: false,
    rendersPriorityUi: false,
    visualActivationAuthorized: false,
    diagnosticsOnly: true,
  };
}

function failClosedPlan(
  input: ContextPriorityResolveInput,
  rejectionReasons: readonly string[],
): ContextPriorityPlan {
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
    input.prioritySurfaceIds ?? [...WORKSPACE_CONTEXT_PRIORITY.prioritySurfaceIds]
  ).filter((id): id is PrioritySurfaceId => PRIORITY_SET.has(id));
  const list =
    ids.length > 0 ? ids : [...WORKSPACE_CONTEXT_PRIORITY.prioritySurfaceIds];

  const entries: ContextPriorityEntry[] = list.map((surfaceId) => ({
    surfaceId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    priorityContractVersion: WORKSPACE_CONTEXT_PRIORITY.contractVersion,
    presentationState: "n/a",
    honestyDensity: "n/a",
    ...level("UNKNOWN"),
    reason: "fail-closed-unknown",
    confidence: "low",
    renderAuthorized: false,
    orderingAuthorized: false,
    diagnostics: {
      rankIndex: RANK_INDEX[surfaceId],
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

export function resolveContextPriority(
  input: ContextPriorityResolveInput,
): ContextPriorityPlan {
  const rejectionReasons = validateInput(input);
  if (rejectionReasons.length > 0) {
    return failClosedPlan(input, rejectionReasons);
  }

  const {
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
    honestyDensityPlan,
  } = input;

  if (presentationPlan.status === "rejected") {
    return failClosedPlan(input, [
      "upstream-plan-rejected",
      "presentation-plan-rejected",
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
  if (honestyDensityPlan.status === "rejected") {
    return failClosedPlan(input, [
      "honesty-plan-rejected",
      ...honestyDensityPlan.rejectionReasons,
    ]);
  }

  const ids = (input.prioritySurfaceIds ?? [
    ...WORKSPACE_CONTEXT_PRIORITY.prioritySurfaceIds,
  ]) as PrioritySurfaceId[];

  const entries = ids.map((id) =>
    entryFor(
      id,
      presentationPlan,
      progressiveDisclosurePlan,
      toolActionPlan,
      assistEligibilityPlan,
      honestyDensityPlan,
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

export function resolveContextPriorityFromPlans(
  modePlan: WorkspaceModePlan,
  capabilityPlan: WorkspaceCapabilityPlan,
): ContextPriorityPlan {
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
  const honestyDensityPlan = resolveHonestyDensity({
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
  return resolveContextPriority({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    toolActionContractId: WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    toolActionContractVersion: WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    honestyContractId: WORKSPACE_HONESTY_DENSITY.contractId,
    honestyContractVersion: WORKSPACE_HONESTY_DENSITY.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
    honestyDensityPlan,
  });
}

export function getContextPriorityEntry(
  plan: ContextPriorityPlan,
  id: PrioritySurfaceId,
): ContextPriorityEntry | undefined {
  return plan.entryById[id];
}

export function isContextPriorityRenderAuthorized(
  plan: ContextPriorityPlan,
  id: PrioritySurfaceId,
): boolean {
  return plan.entryById[id]?.renderAuthorized === true;
}

export function isContextPriorityOrderingAuthorized(
  plan: ContextPriorityPlan,
  id: PrioritySurfaceId,
): boolean {
  return plan.entryById[id]?.orderingAuthorized === true;
}

export function serializeContextPriorityPlan(plan: ContextPriorityPlan): {
  status: ContextPriorityPlanStatus;
  contractId: string;
  contractVersion: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  orderedSurfaceIds: PrioritySurfaceId[];
  unknownSurfaceIds: PrioritySurfaceId[];
  lowSurfaceIds: PrioritySurfaceId[];
  normalSurfaceIds: PrioritySurfaceId[];
  highSurfaceIds: PrioritySurfaceId[];
  criticalSurfaceIds: PrioritySurfaceId[];
  drivesChrome: false;
  appliesOrdering: false;
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
    unknownSurfaceIds: [...plan.unknownSurfaceIds],
    lowSurfaceIds: [...plan.lowSurfaceIds],
    normalSurfaceIds: [...plan.normalSurfaceIds],
    highSurfaceIds: [...plan.highSurfaceIds],
    criticalSurfaceIds: [...plan.criticalSurfaceIds],
    drivesChrome: false,
    appliesOrdering: false,
    diagnosticsOnly: true,
    stabilityToken: plan.stabilityToken,
  };
}
