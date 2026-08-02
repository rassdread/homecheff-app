/**
 * WX Phase 1B.5.8 — Contextual Relevance Engine.
 *
 * Pure · deterministic · synchronous · side-effect free · immutable · serializable.
 * Framework-independent · browser-independent · React-independent.
 *
 * Builds a Contextual Relevance plan on top of:
 *   Surface Registry → Presentation → Assist → Disclosure →
 *   Tool Action → Honesty Density → Contextual Priority → Contextual Relevance
 *
 * Explains WHY already-authorized surfaces are relevant within the current
 * Workspace context. Diagnostics metadata only.
 *
 * Does NOT render · Does NOT reorder · Does NOT change layout/visibility ·
 * Does NOT activate · Does NOT remount · Does NOT transfer ownership ·
 * Does NOT change Presentation / Assist / Disclosure / Tool / Honesty / Priority.
 *
 * Authority: WX Phase 1B.5 Master Spec · Implementation Master Spec §1B.5.8
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
  WORKSPACE_CONTEXT_PRIORITY,
  resolveContextPriority,
  type ContextPriorityLevel,
  type ContextPriorityPlan,
  type PrioritySurfaceId,
} from "./resolve-context-priority";
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

/** Sealed Contextual Relevance contract identity for Phase 1B.5.8. */
export const WORKSPACE_CONTEXT_RELEVANCE = {
  phase: "1b.5.8",
  contractId: "wx-context-relevance-v1",
  contractVersion: "1.0.0",
  relevanceSurfaceIds: [
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
  appliesDensity: false,
  appliesDisclosure: false,
  rendersRelevanceUi: false,
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
  neverChangePriority: true,
} as const;

export type RelevanceSurfaceId =
  (typeof WORKSPACE_CONTEXT_RELEVANCE.relevanceSurfaceIds)[number];

export type ContextRelevanceState =
  | "UNKNOWN"
  | "IRRELEVANT"
  | "CONTEXTUAL"
  | "IMPORTANT"
  | "ESSENTIAL";

export type ContextRelevanceReason =
  | "priority-critical-essential"
  | "priority-high-important"
  | "priority-normal-contextual"
  | "priority-low-irrelevant"
  | "honesty-empty-irrelevant"
  | "fail-closed-unknown"
  | "priority-plan-rejected"
  | "upstream-plan-rejected";

export type ContextRelevanceConfidence = "high" | "medium" | "low";

export type ContextRelevanceEntry = {
  surfaceId: RelevanceSurfaceId;
  registryVersion: string;
  relevanceContractVersion: string;
  presentationState: SurfacePresentationState | "n/a";
  honestyDensity: HonestyDensityState | "n/a";
  contextPriority: ContextPriorityLevel | "n/a";
  relevance: ContextRelevanceState;
  relevanceScore: number;
  reason: ContextRelevanceReason;
  confidence: ContextRelevanceConfidence;
  /** Always false in 1B.5.8 — planning only. */
  renderAuthorized: false;
  /** Always false — relevance does not reorder or present. */
  orderingAuthorized: false;
  diagnostics: {
    rankIndex: number;
    heightDemoted: boolean;
    posture: WorkspacePosture;
    mode: WorkspaceModeId;
  };
};

export type ContextRelevancePlanStatus = "ok" | "rejected";

export type ContextRelevancePlan = {
  status: ContextRelevancePlanStatus;
  rejectionReasons: readonly string[];
  phase: typeof WORKSPACE_CONTEXT_RELEVANCE.phase;
  contractId: typeof WORKSPACE_CONTEXT_RELEVANCE.contractId;
  contractVersion: typeof WORKSPACE_CONTEXT_RELEVANCE.contractVersion;
  priorityContractId: typeof WORKSPACE_CONTEXT_PRIORITY.contractId;
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
  orderedSurfaceIds: readonly RelevanceSurfaceId[];
  unknownSurfaceIds: readonly RelevanceSurfaceId[];
  irrelevantSurfaceIds: readonly RelevanceSurfaceId[];
  contextualSurfaceIds: readonly RelevanceSurfaceId[];
  importantSurfaceIds: readonly RelevanceSurfaceId[];
  essentialSurfaceIds: readonly RelevanceSurfaceId[];
  entries: readonly ContextRelevanceEntry[];
  entryById: Readonly<Record<RelevanceSurfaceId, ContextRelevanceEntry>>;
  stabilityToken: string;
  drivesChrome: false;
  appliesOrdering: false;
  rendersRelevanceUi: false;
  visualActivationAuthorized: false;
  diagnosticsOnly: true;
};

export type ContextRelevanceResolveInput = {
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
  priorityContractId: string;
  priorityContractVersion: string;
  presentationPlan: SurfacePresentationPlan;
  progressiveDisclosurePlan: ProgressiveDisclosurePlan;
  toolActionPlan: ToolActionPresentationPlan;
  assistEligibilityPlan: AssistEligibilityPlan;
  honestyDensityPlan: HonestyDensityPlan;
  contextPriorityPlan: ContextPriorityPlan;
  relevanceSurfaceIds?: readonly string[];
};

const RELEVANCE_SET: ReadonlySet<string> = new Set(
  WORKSPACE_CONTEXT_RELEVANCE.relevanceSurfaceIds,
);

const RANK_INDEX: Readonly<Record<RelevanceSurfaceId, number>> = {
  stage: 1,
  orientation: 2,
  command: 2,
  disclosure: 3,
  "assist-primary": 4,
  "assist-secondary": 5,
  tool: 6,
};

const SCORE: Readonly<Record<ContextRelevanceState, number>> = {
  UNKNOWN: 0,
  IRRELEVANT: 25,
  CONTEXTUAL: 50,
  IMPORTANT: 75,
  ESSENTIAL: 100,
};

export const CONTEXT_RELEVANCE_FORBIDDEN_SOURCE_PATTERNS = [
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
    "wx-cr",
    WORKSPACE_CONTEXT_RELEVANCE.contractVersion,
    plan.status,
    plan.mode,
    plan.posture,
    plan.states.join("|"),
  ].join(":");
}

function validateInput(input: ContextRelevanceResolveInput): string[] {
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
  if (input.priorityContractId !== WORKSPACE_CONTEXT_PRIORITY.contractId) {
    reasons.push("priority-contract-mismatch");
  }
  if (
    input.priorityContractVersion !== WORKSPACE_CONTEXT_PRIORITY.contractVersion
  ) {
    reasons.push("priority-version-mismatch");
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
  if (!input.contextPriorityPlan || typeof input.contextPriorityPlan !== "object") {
    reasons.push("missing-context-priority-plan");
  }
  const ids = input.relevanceSurfaceIds ?? [
    ...WORKSPACE_CONTEXT_RELEVANCE.relevanceSurfaceIds,
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      reasons.push("duplicate-relevance-surface");
      break;
    }
    seen.add(id);
    if (!RELEVANCE_SET.has(id)) {
      reasons.push("unknown-relevance-surface");
      break;
    }
  }
  return reasons;
}

function level(
  relevance: ContextRelevanceState,
): { relevance: ContextRelevanceState; relevanceScore: number } {
  return { relevance, relevanceScore: SCORE[relevance] };
}

function entryFor(
  surfaceId: RelevanceSurfaceId,
  presentationPlan: SurfacePresentationPlan,
  honestyPlan: HonestyDensityPlan,
  priorityPlan: ContextPriorityPlan,
): ContextRelevanceEntry {
  const pe = presentationPlan.entryById[surfaceId as WorkspaceSurfaceId];
  const he = honestyPlan.entryById[surfaceId as keyof typeof honestyPlan.entryById];
  const pre = priorityPlan.entryById[surfaceId as PrioritySurfaceId];
  const heightDemoted = presentationPlan.heightDemoted === true;
  const posture = presentationPlan.posture;
  const mode = presentationPlan.mode;
  const base = {
    surfaceId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    relevanceContractVersion: WORKSPACE_CONTEXT_RELEVANCE.contractVersion,
    presentationState: (pe?.presentationState ?? "n/a") as
      | SurfacePresentationState
      | "n/a",
    honestyDensity: (he?.density ?? "n/a") as HonestyDensityState | "n/a",
    contextPriority: (pre?.priority ?? "n/a") as ContextPriorityLevel | "n/a",
    renderAuthorized: false as const,
    orderingAuthorized: false as const,
    diagnostics: {
      rankIndex: RANK_INDEX[surfaceId],
      heightDemoted,
      posture,
      mode,
    },
  };

  if (!pe || !he || !pre || he.density === "UNKNOWN" || pre.priority === "UNKNOWN") {
    return {
      ...base,
      ...level("UNKNOWN"),
      reason: "fail-closed-unknown",
      confidence: "low",
    };
  }

  // Empty honesty + low priority ⇒ not contextually meaningful.
  if (he.density === "EMPTY" && pre.priority === "LOW") {
    return {
      ...base,
      ...level("IRRELEVANT"),
      reason: "honesty-empty-irrelevant",
      confidence: "high",
    };
  }

  if (pre.priority === "CRITICAL") {
    return {
      ...base,
      ...level("ESSENTIAL"),
      reason: "priority-critical-essential",
      confidence: "high",
    };
  }
  if (pre.priority === "HIGH") {
    return {
      ...base,
      ...level("IMPORTANT"),
      reason: "priority-high-important",
      confidence: "high",
    };
  }
  if (pre.priority === "NORMAL") {
    return {
      ...base,
      ...level("CONTEXTUAL"),
      reason: "priority-normal-contextual",
      confidence: "medium",
    };
  }
  if (pre.priority === "LOW") {
    return {
      ...base,
      ...level("IRRELEVANT"),
      reason: "priority-low-irrelevant",
      confidence: "high",
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
  entries: ContextRelevanceEntry[],
  meta: {
    status: ContextRelevancePlanStatus;
    rejectionReasons: readonly string[];
    presentationPlan: SurfacePresentationPlan;
  },
): ContextRelevancePlan {
  const sorted = [...entries].sort(
    (a, b) => a.diagnostics.rankIndex - b.diagnostics.rankIndex,
  );
  const orderedSurfaceIds = sorted.map((e) => e.surfaceId);
  const by = (r: ContextRelevanceState) =>
    sorted.filter((e) => e.relevance === r).map((e) => e.surfaceId);

  const entryById = {} as Record<RelevanceSurfaceId, ContextRelevanceEntry>;
  for (const e of sorted) entryById[e.surfaceId] = e;

  const stabilityToken = tokenFor({
    status: meta.status,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    states: sorted.map(
      (e) => `${e.surfaceId}=${e.relevance}:${e.relevanceScore}`,
    ),
  });

  return {
    status: meta.status,
    rejectionReasons: meta.rejectionReasons,
    phase: WORKSPACE_CONTEXT_RELEVANCE.phase,
    contractId: WORKSPACE_CONTEXT_RELEVANCE.contractId,
    contractVersion: WORKSPACE_CONTEXT_RELEVANCE.contractVersion,
    priorityContractId: WORKSPACE_CONTEXT_PRIORITY.contractId,
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
    irrelevantSurfaceIds: by("IRRELEVANT"),
    contextualSurfaceIds: by("CONTEXTUAL"),
    importantSurfaceIds: by("IMPORTANT"),
    essentialSurfaceIds: by("ESSENTIAL"),
    entries: sorted,
    entryById,
    stabilityToken,
    drivesChrome: false,
    appliesOrdering: false,
    rendersRelevanceUi: false,
    visualActivationAuthorized: false,
    diagnosticsOnly: true,
  };
}

function failClosedPlan(
  input: ContextRelevanceResolveInput,
  rejectionReasons: readonly string[],
): ContextRelevancePlan {
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
    input.relevanceSurfaceIds ?? [
      ...WORKSPACE_CONTEXT_RELEVANCE.relevanceSurfaceIds,
    ]
  ).filter((id): id is RelevanceSurfaceId => RELEVANCE_SET.has(id));
  const list =
    ids.length > 0
      ? ids
      : [...WORKSPACE_CONTEXT_RELEVANCE.relevanceSurfaceIds];

  const entries: ContextRelevanceEntry[] = list.map((surfaceId) => ({
    surfaceId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    relevanceContractVersion: WORKSPACE_CONTEXT_RELEVANCE.contractVersion,
    presentationState: "n/a",
    honestyDensity: "n/a",
    contextPriority: "n/a",
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

export function resolveContextRelevance(
  input: ContextRelevanceResolveInput,
): ContextRelevancePlan {
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
    contextPriorityPlan,
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
      "upstream-plan-rejected",
      "honesty-plan-rejected",
    ]);
  }
  if (contextPriorityPlan.status === "rejected") {
    return failClosedPlan(input, [
      "priority-plan-rejected",
      ...contextPriorityPlan.rejectionReasons,
    ]);
  }

  const ids = (input.relevanceSurfaceIds ?? [
    ...WORKSPACE_CONTEXT_RELEVANCE.relevanceSurfaceIds,
  ]) as RelevanceSurfaceId[];

  const entries = ids.map((id) =>
    entryFor(id, presentationPlan, honestyDensityPlan, contextPriorityPlan),
  );

  return deepFreeze(
    buildPlan(entries, {
      status: "ok",
      rejectionReasons: [],
      presentationPlan,
    }),
  );
}

export function resolveContextRelevanceFromPlans(
  modePlan: WorkspaceModePlan,
  capabilityPlan: WorkspaceCapabilityPlan,
): ContextRelevancePlan {
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
  const contextPriorityPlan = resolveContextPriority({
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
  return resolveContextRelevance({
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
    priorityContractId: WORKSPACE_CONTEXT_PRIORITY.contractId,
    priorityContractVersion: WORKSPACE_CONTEXT_PRIORITY.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
    honestyDensityPlan,
    contextPriorityPlan,
  });
}

export function getContextRelevanceEntry(
  plan: ContextRelevancePlan,
  id: RelevanceSurfaceId,
): ContextRelevanceEntry | undefined {
  return plan.entryById[id];
}

export function isContextRelevanceRenderAuthorized(
  plan: ContextRelevancePlan,
  id: RelevanceSurfaceId,
): boolean {
  return plan.entryById[id]?.renderAuthorized === true;
}

export function isContextRelevanceOrderingAuthorized(
  plan: ContextRelevancePlan,
  id: RelevanceSurfaceId,
): boolean {
  return plan.entryById[id]?.orderingAuthorized === true;
}

export function serializeContextRelevancePlan(plan: ContextRelevancePlan): {
  status: ContextRelevancePlanStatus;
  contractId: string;
  contractVersion: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  orderedSurfaceIds: RelevanceSurfaceId[];
  unknownSurfaceIds: RelevanceSurfaceId[];
  irrelevantSurfaceIds: RelevanceSurfaceId[];
  contextualSurfaceIds: RelevanceSurfaceId[];
  importantSurfaceIds: RelevanceSurfaceId[];
  essentialSurfaceIds: RelevanceSurfaceId[];
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
    irrelevantSurfaceIds: [...plan.irrelevantSurfaceIds],
    contextualSurfaceIds: [...plan.contextualSurfaceIds],
    importantSurfaceIds: [...plan.importantSurfaceIds],
    essentialSurfaceIds: [...plan.essentialSurfaceIds],
    drivesChrome: false,
    appliesOrdering: false,
    diagnosticsOnly: true,
    stabilityToken: plan.stabilityToken,
  };
}
