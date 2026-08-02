/**
 * WX Phase 1B.5.5 — Tool & Action Surface Presentation.
 *
 * Pure · deterministic · synchronous · side-effect free · immutable · serializable.
 * Framework-independent · browser-independent · React-independent.
 *
 * Builds a Tool & Action Presentation plan on top of:
 *   Surface Registry → Presentation Resolver → Assist Eligibility →
 *   Progressive Disclosure → Tool & Action Presentation
 *
 * Classifies already-authorized Workspace tools / quick actions as
 * Persistent or Reachable per the Surface Presentation Plan.
 *
 * Does NOT render tool chrome · Does NOT invent actions · Does NOT rename IA ·
 * Does NOT densify Professional tools · Does NOT remount · Does NOT transfer ownership.
 * Existing static tool chrome (1B.4 command/nav/create) remains unchanged —
 * this phase emits diagnostics-only presentation states.
 *
 * Authority: WX Phase 1B.5 Master Spec · Implementation Master Spec §1B.5.5
 */

import type { WorkspaceCapabilityPlan } from "./resolve-workspace-capabilities";
import {
  WORKSPACE_CAPABILITY_FRAMEWORK,
  type WorkspaceCapabilityId,
  type WorkspaceCapabilityState,
} from "./resolve-workspace-capabilities";
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
  type ProgressiveDisclosureState,
} from "./resolve-progressive-disclosure";
import {
  WORKSPACE_SURFACE_PRESENTATION,
  type SurfacePresentationPlan,
  type SurfacePresentationState,
  type SurfaceSuppressionReason,
  resolveSurfacePresentationFromPlans,
} from "./resolve-surface-presentation";
import {
  WORKSPACE_SURFACE_REGISTRY,
  type WorkspaceSurfaceId,
} from "./workspace-surface-registry";

/** Sealed Tool & Action Presentation contract identity for Phase 1B.5.5. */
export const WORKSPACE_TOOL_ACTION_PRESENTATION = {
  phase: "1b.5.5",
  contractId: "wx-tool-action-presentation-v1",
  contractVersion: "1.0.0",
  /**
   * Already-authorized action / tool presentation identities.
   * Canonical product owners remain unchanged — these IDs are presentation-only.
   */
  toolActionIds: [
    "tool",
    "action-create",
    "action-search",
    "action-filters",
  ] as const,
  drivesChrome: false,
  rendersTools: false,
  activatesCapabilities: false,
  diagnosticsOnly: true,
  visualActivationAuthorized: false,
  toolChromeActivationAuthorized: false,
  /** Prior static tool chrome rules remain authoritative for occupancy. */
  staticChromeUnchanged: true,
  neverInspectViewport: true,
  neverInspectDevice: true,
  neverInspectUserAgent: true,
  neverRemount: true,
  neverTransferOwnership: true,
  neverInventActions: true,
  neverRenameIa: true,
} as const;

export type ToolActionId =
  (typeof WORKSPACE_TOOL_ACTION_PRESENTATION.toolActionIds)[number];

export type ToolActionPresentationState =
  | "persistent"
  | "reachable"
  | "absent"
  | "suppressed"
  | "reserved"
  | "future-persistent";

export type ToolActionPresentationReason =
  | "presentation-tool-persistent"
  | "presentation-tool-reachable"
  | "core-action-reachable"
  | "core-action-persistent"
  | "capability-unavailable"
  | "capability-reserved"
  | "contention-demoted"
  | "disclosure-continuity"
  | "higher-mode-capacity"
  | "static-chrome-freeze"
  | "fail-closed-minimum"
  | "presentation-plan-rejected"
  | "disclosure-plan-rejected";

export type ToolActionSuppressionReason =
  | "none"
  | "capability-unavailable"
  | "capability-reserved"
  | "contention-demoted-reachable"
  | "contention-demoted-absent"
  | "insufficient-capacity"
  | "static-chrome-freeze"
  | "invalid-input-fail-closed"
  | "registry-version-mismatch"
  | "capability-contract-mismatch"
  | "presentation-contract-mismatch"
  | "disclosure-contract-mismatch"
  | "unknown-tool-action"
  | "duplicate-tool-action"
  | "malformed-metadata";

export type ToolActionPresentationEntry = {
  toolActionId: ToolActionId;
  registryVersion: string;
  presentationPlanVersion: string;
  disclosurePlanVersion: string;
  toolActionContractVersion: string;
  /** Presentation state of registry `tool` surface (or n/a). */
  toolPresentationState: SurfacePresentationState | "n/a";
  disclosureState: ProgressiveDisclosureState | "n/a";
  presentationState: ToolActionPresentationState;
  presentationReason: ToolActionPresentationReason;
  suppressionReason: ToolActionSuppressionReason;
  capabilityId: WorkspaceCapabilityId | "shortcuts-actions";
  capabilityState: WorkspaceCapabilityState | "n/a";
  reserved: boolean;
  planPersistent: boolean;
  planReachable: boolean;
  /** Always false in 1B.5.5 — static chrome freeze / no tool chrome activation. */
  renderAuthorized: false;
  diagnostics: {
    priorityRank: number;
    presentationSuppression: SurfaceSuppressionReason | "n/a";
  };
};

export type ToolActionPresentationPlanStatus = "ok" | "rejected";

export type ToolActionPresentationPlan = {
  status: ToolActionPresentationPlanStatus;
  rejectionReasons: readonly string[];
  phase: typeof WORKSPACE_TOOL_ACTION_PRESENTATION.phase;
  contractId: typeof WORKSPACE_TOOL_ACTION_PRESENTATION.contractId;
  contractVersion: typeof WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion;
  presentationContractId: typeof WORKSPACE_SURFACE_PRESENTATION.contractId;
  presentationContractVersion: typeof WORKSPACE_SURFACE_PRESENTATION.contractVersion;
  disclosureContractId: typeof WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId;
  disclosureContractVersion: typeof WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion;
  eligibilityContractId: typeof WORKSPACE_ASSIST_ELIGIBILITY.contractId;
  eligibilityContractVersion: typeof WORKSPACE_ASSIST_ELIGIBILITY.contractVersion;
  registryContractId: typeof WORKSPACE_SURFACE_REGISTRY.contractId;
  registryContractVersion: typeof WORKSPACE_SURFACE_REGISTRY.contractVersion;
  capabilityContractId: typeof WORKSPACE_CAPABILITY_FRAMEWORK.contractId;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  orderedToolActionIds: readonly ToolActionId[];
  persistentToolActionIds: readonly ToolActionId[];
  reachableToolActionIds: readonly ToolActionId[];
  absentToolActionIds: readonly ToolActionId[];
  suppressedToolActionIds: readonly ToolActionId[];
  reservedToolActionIds: readonly ToolActionId[];
  futurePersistentToolActionIds: readonly ToolActionId[];
  entries: readonly ToolActionPresentationEntry[];
  entryById: Readonly<Record<ToolActionId, ToolActionPresentationEntry>>;
  stabilityToken: string;
  drivesChrome: false;
  rendersTools: false;
  visualActivationAuthorized: false;
  toolChromeActivationAuthorized: false;
  staticChromeUnchanged: true;
  diagnosticsOnly: true;
};

export type ToolActionPresentationResolveInput = {
  registryContractId: string;
  registryContractVersion: string;
  capabilityContractId: string;
  presentationContractId: string;
  presentationContractVersion: string;
  disclosureContractId: string;
  disclosureContractVersion: string;
  presentationPlan: SurfacePresentationPlan;
  progressiveDisclosurePlan: ProgressiveDisclosurePlan;
  toolActionIds?: readonly string[];
};

const TOOL_ACTION_SET: ReadonlySet<string> = new Set(
  WORKSPACE_TOOL_ACTION_PRESENTATION.toolActionIds,
);

/** Priority ranks — lower = higher priority under diagnostics ordering. */
const TOOL_ACTION_PRIORITY: Readonly<Record<ToolActionId, number>> = {
  tool: 6,
  "action-create": 3,
  "action-search": 4,
  "action-filters": 5,
};

const TOOL_ACTION_CAPABILITY: Readonly<
  Record<ToolActionId, WorkspaceCapabilityId | "shortcuts-actions">
> = {
  tool: "shortcuts-actions",
  "action-create": "navigation",
  "action-search": "search",
  "action-filters": "filters",
};

export const TOOL_ACTION_PRESENTATION_FORBIDDEN_SOURCE_PATTERNS = [
  /\bnavigator\./,
  /\buserAgent\b/,
  /\bmatchMedia\b/,
  /\bwindow\./,
  /\bdocument\./,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
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
    "wx-tap",
    WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    plan.status,
    plan.mode,
    plan.posture,
    plan.states.join("|"),
  ].join(":");
}

function validateInput(input: ToolActionPresentationResolveInput): string[] {
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
  if (!input.presentationPlan || typeof input.presentationPlan !== "object") {
    reasons.push("missing-presentation-plan");
  } else {
    if (
      input.presentationPlan.contractId !==
      WORKSPACE_SURFACE_PRESENTATION.contractId
    ) {
      reasons.push("presentation-plan-contract-mismatch");
    }
    if (
      input.presentationPlan.contractVersion !==
      WORKSPACE_SURFACE_PRESENTATION.contractVersion
    ) {
      reasons.push("presentation-plan-version-mismatch");
    }
  }
  if (
    !input.progressiveDisclosurePlan ||
    typeof input.progressiveDisclosurePlan !== "object"
  ) {
    reasons.push("missing-disclosure-plan");
  } else {
    if (
      input.progressiveDisclosurePlan.contractId !==
      WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId
    ) {
      reasons.push("disclosure-plan-contract-mismatch");
    }
    if (
      input.progressiveDisclosurePlan.contractVersion !==
      WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion
    ) {
      reasons.push("disclosure-plan-version-mismatch");
    }
  }
  const ids = input.toolActionIds ?? [
    ...WORKSPACE_TOOL_ACTION_PRESENTATION.toolActionIds,
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      reasons.push("duplicate-tool-action");
      break;
    }
    seen.add(id);
    if (!TOOL_ACTION_SET.has(id)) {
      reasons.push("unknown-tool-action");
      break;
    }
  }
  return reasons;
}

function resolveCapabilityFromPlan(
  actionId: ToolActionId,
  presentationPlan: SurfacePresentationPlan,
  capabilityPlan?: WorkspaceCapabilityPlan,
): WorkspaceCapabilityState | "n/a" {
  const cap = TOOL_ACTION_CAPABILITY[actionId];
  if (cap === "shortcuts-actions") {
    const tool = presentationPlan.entryById["tool" as WorkspaceSurfaceId];
    return tool?.capabilityState ?? "n/a";
  }
  if (capabilityPlan) {
    return capabilityPlan.capabilities[cap];
  }
  return "n/a";
}

function entryForAction(
  actionId: ToolActionId,
  presentationPlan: SurfacePresentationPlan,
  disclosurePlan: ProgressiveDisclosurePlan,
  capabilityPlan?: WorkspaceCapabilityPlan,
): ToolActionPresentationEntry {
  const registryVersion = WORKSPACE_SURFACE_REGISTRY.contractVersion;
  const presentationPlanVersion = WORKSPACE_SURFACE_PRESENTATION.contractVersion;
  const disclosurePlanVersion = WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion;
  const toolActionContractVersion =
    WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion;
  const toolPe = presentationPlan.entryById["tool" as WorkspaceSurfaceId];
  const toolDisclosure = disclosurePlan.entryById.tool;
  const capabilityId = TOOL_ACTION_CAPABILITY[actionId];
  const capabilityState = resolveCapabilityFromPlan(
    actionId,
    presentationPlan,
    capabilityPlan,
  );
  const priorityRank = TOOL_ACTION_PRIORITY[actionId];
  const toolPresentationState = toolPe?.presentationState ?? "n/a";
  const disclosureState = toolDisclosure?.disclosureState ?? "n/a";
  const presentationSuppression = toolPe?.suppressionReason ?? "n/a";

  const base = {
    toolActionId: actionId,
    registryVersion,
    presentationPlanVersion,
    disclosurePlanVersion,
    toolActionContractVersion,
    toolPresentationState,
    disclosureState,
    capabilityId,
    capabilityState,
    reserved: false,
    renderAuthorized: false as const,
    diagnostics: {
      priorityRank,
      presentationSuppression,
    },
  };

  // Capability reserved → reserved-blocked for that action.
  if (capabilityState === "reserved") {
    return {
      ...base,
      presentationState: "reserved",
      presentationReason: "capability-reserved",
      suppressionReason: "capability-reserved",
      reserved: true,
      planPersistent: false,
      planReachable: false,
    };
  }

  // Capability unavailable → suppressed (CORE actions still fail-closed Reachable below).
  if (capabilityState === "unavailable" && actionId !== "tool") {
    // CORE reachability: navigation/search/filters must remain Reachable when
    // capability is unexpectedly unavailable — fail closed to reachable, not absent.
    if (
      actionId === "action-create" ||
      actionId === "action-search" ||
      actionId === "action-filters"
    ) {
      return {
        ...base,
        presentationState: "reachable",
        presentationReason: "fail-closed-minimum",
        suppressionReason: "capability-unavailable",
        planPersistent: false,
        planReachable: true,
      };
    }
    return {
      ...base,
      presentationState: "suppressed",
      presentationReason: "capability-unavailable",
      suppressionReason: "capability-unavailable",
      planPersistent: false,
      planReachable: false,
    };
  }

  if (!toolPe) {
    return {
      ...base,
      presentationState: "reachable",
      presentationReason: "fail-closed-minimum",
      suppressionReason: "invalid-input-fail-closed",
      planPersistent: false,
      planReachable: true,
    };
  }

  // Contention demotion on tool surface → all actions Reachable.
  if (
    toolPe.suppressionReason === "contention-demoted-reachable" ||
    toolPe.presentationReason === "contention-priority"
  ) {
    return {
      ...base,
      presentationState: "reachable",
      presentationReason: "contention-demoted",
      suppressionReason: "contention-demoted-reachable",
      planPersistent: false,
      planReachable: true,
    };
  }

  if (toolPe.presentationState === "persistent") {
    // Capacity allows Persistent tool presentation. Static chrome freeze:
    // planPersistent=true but renderAuthorized stays false — no chrome activation.
    if (actionId === "tool") {
      return {
        ...base,
        presentationState: "persistent",
        presentationReason: "presentation-tool-persistent",
        suppressionReason: "static-chrome-freeze",
        planPersistent: true,
        planReachable: false,
      };
    }
    return {
      ...base,
      presentationState: "persistent",
      presentationReason: "core-action-persistent",
      suppressionReason: "static-chrome-freeze",
      planPersistent: true,
      planReachable: false,
    };
  }

  if (toolPe.presentationState === "reachable") {
    if (actionId === "tool") {
      return {
        ...base,
        presentationState: "reachable",
        presentationReason: "presentation-tool-reachable",
        suppressionReason: "none",
        planPersistent: false,
        planReachable: true,
      };
    }
    return {
      ...base,
      presentationState: "reachable",
      presentationReason:
        disclosureState === "disclosed" || disclosureState === "discoverable"
          ? "disclosure-continuity"
          : "core-action-reachable",
      suppressionReason: "none",
      planPersistent: false,
      planReachable: true,
    };
  }

  if (toolPe.presentationState === "compacted") {
    // Compaction densification belongs to 1B.5.6 — treat as reachable continuity.
    return {
      ...base,
      presentationState: "reachable",
      presentationReason: "disclosure-continuity",
      suppressionReason: "none",
      planPersistent: false,
      planReachable: true,
    };
  }

  if (toolPe.presentationState === "reserved-blocked") {
    return {
      ...base,
      presentationState: "reserved",
      presentationReason: "capability-reserved",
      suppressionReason: "capability-reserved",
      reserved: true,
      planPersistent: false,
      planReachable: false,
    };
  }

  // Absent / unknown — fail closed to Reachable for CORE continuity.
  if (
    presentationPlan.mode === "browse" ||
    presentationPlan.mode === "compact-workspace"
  ) {
    // Higher modes may unlock Persistent tool — mark future for tool aggregate only.
    if (
      actionId === "tool" &&
      (presentationPlan.mode === "browse" ||
        presentationPlan.mode === "compact-workspace")
    ) {
      return {
        ...base,
        presentationState: "future-persistent",
        presentationReason: "higher-mode-capacity",
        suppressionReason: "insufficient-capacity",
        planPersistent: false,
        planReachable: true,
      };
    }
  }

  return {
    ...base,
    presentationState: "reachable",
    presentationReason: "fail-closed-minimum",
    suppressionReason: "none",
    planPersistent: false,
    planReachable: true,
  };
}

function buildPlan(
  entries: ToolActionPresentationEntry[],
  meta: {
    status: ToolActionPresentationPlanStatus;
    rejectionReasons: readonly string[];
    presentationPlan: SurfacePresentationPlan;
  },
): ToolActionPresentationPlan {
  const sorted = [...entries].sort(
    (a, b) => a.diagnostics.priorityRank - b.diagnostics.priorityRank,
  );
  const orderedToolActionIds = sorted.map((e) => e.toolActionId);
  const persistentToolActionIds = sorted
    .filter((e) => e.presentationState === "persistent")
    .map((e) => e.toolActionId);
  const reachableToolActionIds = sorted
    .filter((e) => e.presentationState === "reachable")
    .map((e) => e.toolActionId);
  const absentToolActionIds = sorted
    .filter((e) => e.presentationState === "absent")
    .map((e) => e.toolActionId);
  const suppressedToolActionIds = sorted
    .filter((e) => e.presentationState === "suppressed")
    .map((e) => e.toolActionId);
  const reservedToolActionIds = sorted
    .filter((e) => e.presentationState === "reserved")
    .map((e) => e.toolActionId);
  const futurePersistentToolActionIds = sorted
    .filter((e) => e.presentationState === "future-persistent")
    .map((e) => e.toolActionId);

  const entryById = {} as Record<ToolActionId, ToolActionPresentationEntry>;
  for (const e of sorted) {
    entryById[e.toolActionId] = e;
  }

  const stabilityToken = tokenFor({
    status: meta.status,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    states: sorted.map((e) => `${e.toolActionId}=${e.presentationState}`),
  });

  return {
    status: meta.status,
    rejectionReasons: meta.rejectionReasons,
    phase: WORKSPACE_TOOL_ACTION_PRESENTATION.phase,
    contractId: WORKSPACE_TOOL_ACTION_PRESENTATION.contractId,
    contractVersion: WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosureContractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    disclosureContractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    eligibilityContractId: WORKSPACE_ASSIST_ELIGIBILITY.contractId,
    eligibilityContractVersion: WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    usableWidthPx: meta.presentationPlan.usableWidthPx,
    usableHeightPx: meta.presentationPlan.usableHeightPx,
    landscapeCarveOut: meta.presentationPlan.landscapeCarveOut,
    orderedToolActionIds,
    persistentToolActionIds,
    reachableToolActionIds,
    absentToolActionIds,
    suppressedToolActionIds,
    reservedToolActionIds,
    futurePersistentToolActionIds,
    entries: sorted,
    entryById,
    stabilityToken,
    drivesChrome: false,
    rendersTools: false,
    visualActivationAuthorized: false,
    toolChromeActivationAuthorized: false,
    staticChromeUnchanged: true,
    diagnosticsOnly: true,
  };
}

function failClosedPlan(
  input: ToolActionPresentationResolveInput,
  rejectionReasons: readonly string[],
): ToolActionPresentationPlan {
  const pp = input.presentationPlan;
  const mode: WorkspaceModeId =
    pp && typeof pp.mode === "string" ? pp.mode : "browse";
  const posture: WorkspacePosture =
    pp && (pp.posture === "portrait" || pp.posture === "landscape")
      ? pp.posture
      : "portrait";
  const stubPresentation = {
    ...(pp ?? {}),
    mode,
    posture,
    usableWidthPx: pp?.usableWidthPx ?? 0,
    usableHeightPx: pp?.usableHeightPx ?? 0,
    landscapeCarveOut: false,
    entryById: pp?.entryById ?? ({} as SurfacePresentationPlan["entryById"]),
  } as SurfacePresentationPlan;

  const suppression: ToolActionSuppressionReason =
    rejectionReasons.includes("registry-version-mismatch")
      ? "registry-version-mismatch"
      : rejectionReasons.includes("capability-contract-mismatch")
        ? "capability-contract-mismatch"
        : rejectionReasons.includes("presentation-contract-mismatch") ||
            rejectionReasons.includes("presentation-version-mismatch")
          ? "presentation-contract-mismatch"
          : rejectionReasons.includes("disclosure-contract-mismatch") ||
              rejectionReasons.includes("disclosure-version-mismatch")
            ? "disclosure-contract-mismatch"
            : rejectionReasons.includes("unknown-tool-action")
              ? "unknown-tool-action"
              : rejectionReasons.includes("duplicate-tool-action")
                ? "duplicate-tool-action"
                : "invalid-input-fail-closed";

  const ids = (
    input.toolActionIds ?? [...WORKSPACE_TOOL_ACTION_PRESENTATION.toolActionIds]
  ).filter((id): id is ToolActionId => TOOL_ACTION_SET.has(id));

  const entries: ToolActionPresentationEntry[] = (
    ids.length > 0 ? ids : [...WORKSPACE_TOOL_ACTION_PRESENTATION.toolActionIds]
  ).map((toolActionId) => ({
    toolActionId,
    registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    presentationPlanVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    disclosurePlanVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    toolActionContractVersion: WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion,
    toolPresentationState: "n/a",
    disclosureState: "n/a",
    presentationState: "reachable",
    presentationReason: "fail-closed-minimum",
    suppressionReason: suppression,
    capabilityId: TOOL_ACTION_CAPABILITY[toolActionId],
    capabilityState: "n/a",
    reserved: false,
    planPersistent: false,
    planReachable: true,
    renderAuthorized: false,
    diagnostics: {
      priorityRank: TOOL_ACTION_PRIORITY[toolActionId],
      presentationSuppression: "n/a",
    },
  }));

  return deepFreeze(
    buildPlan(entries, {
      status: "rejected",
      rejectionReasons,
      presentationPlan: stubPresentation,
    }),
  );
}

export function resolveToolActionPresentation(
  input: ToolActionPresentationResolveInput,
  capabilityPlan?: WorkspaceCapabilityPlan,
): ToolActionPresentationPlan {
  const rejectionReasons = validateInput(input);
  if (rejectionReasons.length > 0) {
    return failClosedPlan(input, rejectionReasons);
  }

  const { presentationPlan, progressiveDisclosurePlan } = input;

  if (presentationPlan.status === "rejected") {
    return failClosedPlan(input, [
      "presentation-plan-rejected",
      ...presentationPlan.rejectionReasons,
    ]);
  }
  if (progressiveDisclosurePlan.status === "rejected") {
    return failClosedPlan(input, [
      "disclosure-plan-rejected",
      ...progressiveDisclosurePlan.rejectionReasons,
    ]);
  }

  const ids = (input.toolActionIds ?? [
    ...WORKSPACE_TOOL_ACTION_PRESENTATION.toolActionIds,
  ]) as ToolActionId[];

  const entries = ids.map((id) =>
    entryForAction(
      id,
      presentationPlan,
      progressiveDisclosurePlan,
      capabilityPlan,
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

export function resolveToolActionPresentationFromPlans(
  modePlan: WorkspaceModePlan,
  capabilityPlan: WorkspaceCapabilityPlan,
): ToolActionPresentationPlan {
  const presentationPlan = resolveSurfacePresentationFromPlans(
    modePlan,
    capabilityPlan,
  );
  const assistEligibilityPlan: AssistEligibilityPlan = resolveAssistEligibility({
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
  return resolveToolActionPresentation(
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
}

export function getToolActionPresentationEntry(
  plan: ToolActionPresentationPlan,
  id: ToolActionId,
): ToolActionPresentationEntry | undefined {
  return plan.entryById[id];
}

export function isToolActionPlanPersistent(
  plan: ToolActionPresentationPlan,
  id: ToolActionId,
): boolean {
  return plan.entryById[id]?.planPersistent === true;
}

export function isToolActionPlanReachable(
  plan: ToolActionPresentationPlan,
  id: ToolActionId,
): boolean {
  return plan.entryById[id]?.planReachable === true;
}

export function isToolActionRenderAuthorized(
  plan: ToolActionPresentationPlan,
  id: ToolActionId,
): boolean {
  return plan.entryById[id]?.renderAuthorized === true;
}

export function serializeToolActionPresentationPlan(
  plan: ToolActionPresentationPlan,
): {
  status: ToolActionPresentationPlanStatus;
  contractId: string;
  contractVersion: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  orderedToolActionIds: ToolActionId[];
  persistentToolActionIds: ToolActionId[];
  reachableToolActionIds: ToolActionId[];
  absentToolActionIds: ToolActionId[];
  suppressedToolActionIds: ToolActionId[];
  reservedToolActionIds: ToolActionId[];
  futurePersistentToolActionIds: ToolActionId[];
  drivesChrome: false;
  rendersTools: false;
  diagnosticsOnly: true;
  stabilityToken: string;
} {
  return {
    status: plan.status,
    contractId: plan.contractId,
    contractVersion: plan.contractVersion,
    mode: plan.mode,
    posture: plan.posture,
    orderedToolActionIds: [...plan.orderedToolActionIds],
    persistentToolActionIds: [...plan.persistentToolActionIds],
    reachableToolActionIds: [...plan.reachableToolActionIds],
    absentToolActionIds: [...plan.absentToolActionIds],
    suppressedToolActionIds: [...plan.suppressedToolActionIds],
    reservedToolActionIds: [...plan.reservedToolActionIds],
    futurePersistentToolActionIds: [...plan.futurePersistentToolActionIds],
    drivesChrome: false,
    rendersTools: false,
    diagnosticsOnly: true,
    stabilityToken: plan.stabilityToken,
  };
}
