/**
 * WX Phase 1B.5.9 — Contextual Intent Resolution.
 *
 * Pure · deterministic · synchronous · side-effect free · immutable · serializable.
 * Framework-independent · browser-independent · React-independent.
 *
 * Builds a Contextual Intent plan on top of:
 *   Surface Registry → Presentation → Assist → Disclosure →
 *   Tool Action → Honesty Density → Contextual Priority →
 *   Contextual Relevance → Contextual Intent
 *
 * Classifies WHICH user intent the already-authorized Workspace context
 * represents. Diagnostics metadata only.
 *
 * Does NOT render · Does NOT reorder · Does NOT change layout/visibility ·
 * Does NOT activate · Does NOT remount · Does NOT transfer ownership ·
 * Does NOT change Presentation / Assist / Disclosure / Tool / Honesty /
 * Priority / Relevance.
 *
 * Authority: WX Phase 1B.5 Master Spec · Implementation Master Spec §1B.5.9
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
  WORKSPACE_CONTEXT_RELEVANCE,
  resolveContextRelevance,
  type ContextRelevancePlan,
  type ContextRelevanceState,
  type RelevanceSurfaceId,
} from "./resolve-context-relevance";
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

/** Sealed Contextual Intent contract identity for Phase 1B.5.9. */
export const WORKSPACE_CONTEXT_INTENT = {
  phase: "1b.5.9",
  contractId: "wx-context-intent-v1",
  contractVersion: "1.0.0",
  intentSurfaceIds: [
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
  rendersIntentUi: false,
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
  neverChangeRelevance: true,
} as const;

export type IntentSurfaceId =
  (typeof WORKSPACE_CONTEXT_INTENT.intentSurfaceIds)[number];

export type ContextIntentState =
  | "UNKNOWN"
  | "EXPLORE"
  | "DISCOVER"
  | "CREATE"
  | "MANAGE"
  | "OPERATE";

export type ContextIntentReason =
  | "mode-browse-explore"
  | "mode-compact-discover"
  | "mode-hybrid-manage"
  | "mode-full-create"
  | "mode-professional-operate"
  | "disclosure-discover"
  | "tool-operate"
  | "tool-manage"
  | "fail-closed-unknown"
  | "relevance-plan-rejected"
  | "upstream-plan-rejected";

export type ContextIntentConfidence = "high" | "medium" | "low";

export type ContextIntentEntry = {
  surfaceId: IntentSurfaceId;
  registryVersion: string;
  intentContractVersion: string;
  presentationState: SurfacePresentationState | "n/a";
  honestyDensity: HonestyDensityState | "n/a";
  contextPriority: ContextPriorityLevel | "n/a";
  contextRelevance: ContextRelevanceState | "n/a";
  intent: ContextIntentState;
  intentScore: number;
  reason: ContextIntentReason;
  confidence: ContextIntentConfidence;
  /** Always false in 1B.5.9 — planning only. */
  renderAuthorized: false;
  orderingAuthorized: false;
  diagnostics: {
    rankIndex: number;
    heightDemoted: boolean;
    posture: WorkspacePosture;
    mode: WorkspaceModeId;
  };
};

export type ContextIntentPlanStatus = "ok" | "rejected";

export type ContextIntentPlan = {
  status: ContextIntentPlanStatus;
  rejectionReasons: readonly string[];
  phase: typeof WORKSPACE_CONTEXT_INTENT.phase;
  contractId: typeof WORKSPACE_CONTEXT_INTENT.contractId;
  contractVersion: typeof WORKSPACE_CONTEXT_INTENT.contractVersion;
  relevanceContractId: typeof WORKSPACE_CONTEXT_RELEVANCE.contractId;
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
  orderedSurfaceIds: readonly IntentSurfaceId[];
  unknownSurfaceIds: readonly IntentSurfaceId[];
  exploreSurfaceIds: readonly IntentSurfaceId[];
  discoverSurfaceIds: readonly IntentSurfaceId[];
  createSurfaceIds: readonly IntentSurfaceId[];
  manageSurfaceIds: readonly IntentSurfaceId[];
  operateSurfaceIds: readonly IntentSurfaceId[];
  entries: readonly ContextIntentEntry[];
  entryById: Readonly<Record<IntentSurfaceId, ContextIntentEntry>>;
  stabilityToken: string;
  drivesChrome: false;
  appliesOrdering: false;
  rendersIntentUi: false;
  visualActivationAuthorized: false;
  diagnosticsOnly: true;
};

export type ContextIntentResolveInput = {
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
  relevanceContractId: string;
  relevanceContractVersion: string;
  presentationPlan: SurfacePresentationPlan;
  progressiveDisclosurePlan: ProgressiveDisclosurePlan;
  toolActionPlan: ToolActionPresentationPlan;
  assistEligibilityPlan: AssistEligibilityPlan;
  honestyDensityPlan: HonestyDensityPlan;
  contextPriorityPlan: ContextPriorityPlan;
  contextRelevancePlan: ContextRelevancePlan;
  intentSurfaceIds?: readonly string[];
};

const INTENT_SET: ReadonlySet<string> = new Set(
  WORKSPACE_CONTEXT_INTENT.intentSurfaceIds,
);

const RANK_INDEX: Readonly<Record<IntentSurfaceId, number>> = {
  stage: 1,
  orientation: 2,
  command: 2,
  disclosure: 3,
  "assist-primary": 4,
  "assist-secondary": 5,
  tool: 6,
};

const SCORE: Readonly<Record<ContextIntentState, number>> = {
  UNKNOWN: 0,
  EXPLORE: 20,
  DISCOVER: 40,
  CREATE: 60,
  MANAGE: 80,
  OPERATE: 100,
};

export const CONTEXT_INTENT_FORBIDDEN_SOURCE_PATTERNS = [
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
    "wx-ci",
    WORKSPACE_CONTEXT_INTENT.contractVersion,
    plan.status,
    plan.mode,
    plan.posture,
    plan.states.join("|"),
  ].join(":");
}

function validateInput(input: ContextIntentResolveInput): string[] {
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
  if (input.relevanceContractId !== WORKSPACE_CONTEXT_RELEVANCE.contractId) {
    reasons.push("relevance-contract-mismatch");
  }
  if (
    input.relevanceContractVersion !== WORKSPACE_CONTEXT_RELEVANCE.contractVersion
  ) {
    reasons.push("relevance-version-mismatch");
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
  if (
    !input.contextRelevancePlan ||
    typeof input.contextRelevancePlan !== "object"
  ) {
    reasons.push("missing-context-relevance-plan");
  }
  const ids = input.intentSurfaceIds ?? [
    ...WORKSPACE_CONTEXT_INTENT.intentSurfaceIds,
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      reasons.push("duplicate-intent-surface");
      break;
    }
    seen.add(id);
    if (!INTENT_SET.has(id)) {
      reasons.push("unknown-intent-surface");
      break;
    }
  }
  return reasons;
}

function level(
  intent: ContextIntentState,
): { intent: ContextIntentState; intentScore: number } {
  return { intent, intentScore: SCORE[intent] };
}

function modeBaseIntent(
  mode: WorkspaceModeId,
): { intent: ContextIntentState; reason: ContextIntentReason; confidence: ContextIntentConfidence } {
  switch (mode) {
    case "browse":
      return { intent: "EXPLORE", reason: "mode-browse-explore", confidence: "high" };
    case "compact-workspace":
      return {
        intent: "DISCOVER",
        reason: "mode-compact-discover",
        confidence: "high",
      };
    case "hybrid-workspace":
      return { intent: "MANAGE", reason: "mode-hybrid-manage", confidence: "high" };
    case "full-workspace":
      return { intent: "CREATE", reason: "mode-full-create", confidence: "high" };
    case "professional-workspace":
      return {
        intent: "OPERATE",
        reason: "mode-professional-operate",
        confidence: "high",
      };
    default:
      return {
        intent: "UNKNOWN",
        reason: "fail-closed-unknown",
        confidence: "low",
      };
  }
}

function entryFor(
  surfaceId: IntentSurfaceId,
  presentationPlan: SurfacePresentationPlan,
  honestyPlan: HonestyDensityPlan,
  priorityPlan: ContextPriorityPlan,
  relevancePlan: ContextRelevancePlan,
): ContextIntentEntry {
  const pe = presentationPlan.entryById[surfaceId as WorkspaceSurfaceId];
  const he = honestyPlan.entryById[surfaceId as keyof typeof honestyPlan.entryById];
  const pre = priorityPlan.entryById[surfaceId as PrioritySurfaceId];
  const re = relevancePlan.entryById[surfaceId as RelevanceSurfaceId];
  const heightDemoted = presentationPlan.heightDemoted === true;
  const posture = presentationPlan.posture;
  const mode = presentationPlan.mode;
  const base = {
    surfaceId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    intentContractVersion: WORKSPACE_CONTEXT_INTENT.contractVersion,
    presentationState: (pe?.presentationState ?? "n/a") as
      | SurfacePresentationState
      | "n/a",
    honestyDensity: (he?.density ?? "n/a") as HonestyDensityState | "n/a",
    contextPriority: (pre?.priority ?? "n/a") as ContextPriorityLevel | "n/a",
    contextRelevance: (re?.relevance ?? "n/a") as ContextRelevanceState | "n/a",
    renderAuthorized: false as const,
    orderingAuthorized: false as const,
    diagnostics: {
      rankIndex: RANK_INDEX[surfaceId],
      heightDemoted,
      posture,
      mode,
    },
  };

  if (
    !pe ||
    !he ||
    !pre ||
    !re ||
    he.density === "UNKNOWN" ||
    pre.priority === "UNKNOWN" ||
    re.relevance === "UNKNOWN"
  ) {
    return {
      ...base,
      ...level("UNKNOWN"),
      reason: "fail-closed-unknown",
      confidence: "low",
    };
  }

  const modeIntent = modeBaseIntent(mode);

  // Disclosure surfaces classify as DISCOVER unless already OPERATE.
  if (surfaceId === "disclosure" && modeIntent.intent !== "OPERATE") {
    return {
      ...base,
      ...level("DISCOVER"),
      reason: "disclosure-discover",
      confidence: "high",
    };
  }

  // Tool surfaces escalate toward operational/manage intents.
  if (surfaceId === "tool") {
    if (mode === "professional-workspace") {
      return {
        ...base,
        ...level("OPERATE"),
        reason: "tool-operate",
        confidence: "high",
      };
    }
    if (mode === "full-workspace" || mode === "hybrid-workspace") {
      return {
        ...base,
        ...level("MANAGE"),
        reason: "tool-manage",
        confidence: "medium",
      };
    }
  }

  return {
    ...base,
    ...level(modeIntent.intent),
    reason: modeIntent.reason,
    confidence: modeIntent.confidence,
  };
}

function buildPlan(
  entries: ContextIntentEntry[],
  meta: {
    status: ContextIntentPlanStatus;
    rejectionReasons: readonly string[];
    presentationPlan: SurfacePresentationPlan;
  },
): ContextIntentPlan {
  const sorted = [...entries].sort(
    (a, b) => a.diagnostics.rankIndex - b.diagnostics.rankIndex,
  );
  const orderedSurfaceIds = sorted.map((e) => e.surfaceId);
  const by = (r: ContextIntentState) =>
    sorted.filter((e) => e.intent === r).map((e) => e.surfaceId);

  const entryById = {} as Record<IntentSurfaceId, ContextIntentEntry>;
  for (const e of sorted) entryById[e.surfaceId] = e;

  const stabilityToken = tokenFor({
    status: meta.status,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    states: sorted.map((e) => `${e.surfaceId}=${e.intent}:${e.intentScore}`),
  });

  return {
    status: meta.status,
    rejectionReasons: meta.rejectionReasons,
    phase: WORKSPACE_CONTEXT_INTENT.phase,
    contractId: WORKSPACE_CONTEXT_INTENT.contractId,
    contractVersion: WORKSPACE_CONTEXT_INTENT.contractVersion,
    relevanceContractId: WORKSPACE_CONTEXT_RELEVANCE.contractId,
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
    exploreSurfaceIds: by("EXPLORE"),
    discoverSurfaceIds: by("DISCOVER"),
    createSurfaceIds: by("CREATE"),
    manageSurfaceIds: by("MANAGE"),
    operateSurfaceIds: by("OPERATE"),
    entries: sorted,
    entryById,
    stabilityToken,
    drivesChrome: false,
    appliesOrdering: false,
    rendersIntentUi: false,
    visualActivationAuthorized: false,
    diagnosticsOnly: true,
  };
}

function failClosedPlan(
  input: ContextIntentResolveInput,
  rejectionReasons: readonly string[],
): ContextIntentPlan {
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
    input.intentSurfaceIds ?? [...WORKSPACE_CONTEXT_INTENT.intentSurfaceIds]
  ).filter((id): id is IntentSurfaceId => INTENT_SET.has(id));
  const list =
    ids.length > 0 ? ids : [...WORKSPACE_CONTEXT_INTENT.intentSurfaceIds];

  const entries: ContextIntentEntry[] = list.map((surfaceId) => ({
    surfaceId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    intentContractVersion: WORKSPACE_CONTEXT_INTENT.contractVersion,
    presentationState: "n/a",
    honestyDensity: "n/a",
    contextPriority: "n/a",
    contextRelevance: "n/a",
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

export function resolveContextIntent(
  input: ContextIntentResolveInput,
): ContextIntentPlan {
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
    contextRelevancePlan,
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
      "upstream-plan-rejected",
      "priority-plan-rejected",
    ]);
  }
  if (contextRelevancePlan.status === "rejected") {
    return failClosedPlan(input, [
      "relevance-plan-rejected",
      ...contextRelevancePlan.rejectionReasons,
    ]);
  }

  const ids = (input.intentSurfaceIds ?? [
    ...WORKSPACE_CONTEXT_INTENT.intentSurfaceIds,
  ]) as IntentSurfaceId[];

  const entries = ids.map((id) =>
    entryFor(
      id,
      presentationPlan,
      honestyDensityPlan,
      contextPriorityPlan,
      contextRelevancePlan,
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

export function resolveContextIntentFromPlans(
  modePlan: WorkspaceModePlan,
  capabilityPlan: WorkspaceCapabilityPlan,
): ContextIntentPlan {
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
  const contextRelevancePlan = resolveContextRelevance({
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
  return resolveContextIntent({
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
    relevanceContractId: WORKSPACE_CONTEXT_RELEVANCE.contractId,
    relevanceContractVersion: WORKSPACE_CONTEXT_RELEVANCE.contractVersion,
    presentationPlan,
    progressiveDisclosurePlan,
    toolActionPlan,
    assistEligibilityPlan,
    honestyDensityPlan,
    contextPriorityPlan,
    contextRelevancePlan,
  });
}

export function getContextIntentEntry(
  plan: ContextIntentPlan,
  id: IntentSurfaceId,
): ContextIntentEntry | undefined {
  return plan.entryById[id];
}

export function isContextIntentRenderAuthorized(
  plan: ContextIntentPlan,
  id: IntentSurfaceId,
): boolean {
  return plan.entryById[id]?.renderAuthorized === true;
}

export function isContextIntentOrderingAuthorized(
  plan: ContextIntentPlan,
  id: IntentSurfaceId,
): boolean {
  return plan.entryById[id]?.orderingAuthorized === true;
}

export function serializeContextIntentPlan(plan: ContextIntentPlan): {
  status: ContextIntentPlanStatus;
  contractId: string;
  contractVersion: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  orderedSurfaceIds: IntentSurfaceId[];
  unknownSurfaceIds: IntentSurfaceId[];
  exploreSurfaceIds: IntentSurfaceId[];
  discoverSurfaceIds: IntentSurfaceId[];
  createSurfaceIds: IntentSurfaceId[];
  manageSurfaceIds: IntentSurfaceId[];
  operateSurfaceIds: IntentSurfaceId[];
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
    exploreSurfaceIds: [...plan.exploreSurfaceIds],
    discoverSurfaceIds: [...plan.discoverSurfaceIds],
    createSurfaceIds: [...plan.createSurfaceIds],
    manageSurfaceIds: [...plan.manageSurfaceIds],
    operateSurfaceIds: [...plan.operateSurfaceIds],
    drivesChrome: false,
    appliesOrdering: false,
    diagnosticsOnly: true,
    stabilityToken: plan.stabilityToken,
  };
}
