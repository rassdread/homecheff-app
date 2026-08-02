/**
 * WX Phase 1B.5.3 — Assist Surface Eligibility Presentation.
 *
 * Pure · deterministic · synchronous · side-effect free · immutable · serializable.
 * Framework-independent · browser-independent · React-independent.
 *
 * Extends the Surface Presentation Plan with Assist Surface eligibility metadata only.
 *
 * Does NOT render Assist UI · Does NOT activate capabilities · Does NOT remount ·
 * Does NOT drive chrome occupancy (hollow permanent assists forbidden without 1B.6 content).
 *
 * Authority: WX Phase 1B.5 Master Spec · Implementation Master Spec §1B.5.3
 *            (eligibility layer; visual occupancy deferred while hollow-ban holds)
 */

import type { WorkspaceCapabilityPlan } from "./resolve-workspace-capabilities";
import { WORKSPACE_CAPABILITY_FRAMEWORK } from "./resolve-workspace-capabilities";
import type {
  WorkspaceModeId,
  WorkspaceModePlan,
  WorkspacePosture,
} from "./resolve-workspace-mode";
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

/** Sealed Assist Eligibility contract identity for Phase 1B.5.3. */
export const WORKSPACE_ASSIST_ELIGIBILITY = {
  phase: "1b.5.3",
  contractId: "wx-assist-surface-eligibility-v1",
  contractVersion: "1.0.0",
  assistSurfaceIds: ["assist-primary", "assist-secondary"] as const,
  drivesChrome: false,
  rendersAssist: false,
  activatesCapabilities: false,
  diagnosticsOnly: true,
  visualActivationAuthorized: false,
  hollowPermanentAssistsForbidden: true,
  neverInspectViewport: true,
  neverInspectDevice: true,
  neverInspectUserAgent: true,
  neverRemount: true,
  neverTransferOwnership: true,
} as const;

export type AssistSurfaceId =
  (typeof WORKSPACE_ASSIST_ELIGIBILITY.assistSurfaceIds)[number];

export type AssistEligibilityState =
  | "eligible"
  | "ineligible"
  | "suppressed"
  | "reserved"
  | "future-eligible";

export type AssistEligibilityReason =
  | "presentation-persistent-capacity"
  | "presentation-compacted-capacity"
  | "mode-forbids-assist"
  | "capability-unavailable"
  | "capability-reserved"
  | "contention-demoted"
  | "reserved-surface"
  | "higher-mode-capacity"
  | "hollow-ban-deferred-content"
  | "fail-closed-minimum"
  | "presentation-plan-rejected";

export type AssistSuppressionReason =
  | "none"
  | "mode-forbids-assist"
  | "capability-unavailable"
  | "capability-reserved"
  | "contention-demoted-absent"
  | "contention-demoted-reachable"
  | "insufficient-capacity"
  | "reserved-surface"
  | "hollow-ban"
  | "invalid-input-fail-closed"
  | "registry-version-mismatch"
  | "capability-contract-mismatch"
  | "presentation-contract-mismatch"
  | "unknown-assist-surface"
  | "duplicate-assist-surface"
  | "malformed-metadata";

export type AssistEligibilityEntry = {
  assistSurfaceId: AssistSurfaceId;
  registryVersion: string;
  presentationPlanVersion: string;
  eligibilityContractVersion: string;
  presentationState: SurfacePresentationState | "n/a";
  eligibilityState: AssistEligibilityState;
  eligibilityReason: AssistEligibilityReason;
  suppressionReason: AssistSuppressionReason;
  reserved: boolean;
  planEligible: boolean;
  renderAuthorized: false;
  diagnostics: {
    priorityRank: number;
    presentationSuppression: SurfaceSuppressionReason | "n/a";
  };
};

export type AssistEligibilityPlanStatus = "ok" | "rejected";

export type AssistEligibilityPlan = {
  status: AssistEligibilityPlanStatus;
  rejectionReasons: readonly string[];
  phase: typeof WORKSPACE_ASSIST_ELIGIBILITY.phase;
  contractId: typeof WORKSPACE_ASSIST_ELIGIBILITY.contractId;
  contractVersion: typeof WORKSPACE_ASSIST_ELIGIBILITY.contractVersion;
  presentationContractId: typeof WORKSPACE_SURFACE_PRESENTATION.contractId;
  presentationContractVersion: typeof WORKSPACE_SURFACE_PRESENTATION.contractVersion;
  registryContractId: typeof WORKSPACE_SURFACE_REGISTRY.contractId;
  registryContractVersion: typeof WORKSPACE_SURFACE_REGISTRY.contractVersion;
  capabilityContractId: typeof WORKSPACE_CAPABILITY_FRAMEWORK.contractId;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  maxAssistPersistent: number;
  orderedAssistIds: readonly AssistSurfaceId[];
  eligibleAssistIds: readonly AssistSurfaceId[];
  ineligibleAssistIds: readonly AssistSurfaceId[];
  suppressedAssistIds: readonly AssistSurfaceId[];
  reservedAssistIds: readonly AssistSurfaceId[];
  futureEligibleAssistIds: readonly AssistSurfaceId[];
  entries: readonly AssistEligibilityEntry[];
  entryById: Readonly<Record<AssistSurfaceId, AssistEligibilityEntry>>;
  stabilityToken: string;
  drivesChrome: false;
  rendersAssist: false;
  visualActivationAuthorized: false;
  diagnosticsOnly: true;
};

export type AssistEligibilityResolveInput = {
  registryContractId: string;
  registryContractVersion: string;
  capabilityContractId: string;
  presentationContractId: string;
  presentationContractVersion: string;
  presentationPlan: SurfacePresentationPlan;
  assistSurfaceIds?: readonly string[];
};

const ASSIST_SET: ReadonlySet<string> = new Set(
  WORKSPACE_ASSIST_ELIGIBILITY.assistSurfaceIds,
);

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
    "wx-ase",
    WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
    plan.status,
    plan.mode,
    plan.posture,
    plan.states.join("|"),
  ].join(":");
}

function validateInput(input: AssistEligibilityResolveInput): string[] {
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
  const ids = input.assistSurfaceIds ?? [
    ...WORKSPACE_ASSIST_ELIGIBILITY.assistSurfaceIds,
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      reasons.push("duplicate-assist-surface");
      break;
    }
    seen.add(id);
    if (!ASSIST_SET.has(id)) {
      reasons.push("unknown-assist-surface");
      break;
    }
  }
  return reasons;
}

function mapSuppression(
  presentationSuppression: SurfaceSuppressionReason | undefined,
): AssistSuppressionReason {
  switch (presentationSuppression) {
    case "none":
      return "none";
    case "mode-forbids-assist":
      return "mode-forbids-assist";
    case "capability-unavailable":
      return "capability-unavailable";
    case "capability-reserved":
      return "capability-reserved";
    case "contention-demoted-absent":
      return "contention-demoted-absent";
    case "contention-demoted-reachable":
      return "contention-demoted-reachable";
    case "insufficient-capacity":
      return "insufficient-capacity";
    case "reserved-surface":
      return "reserved-surface";
    case "registry-version-mismatch":
      return "registry-version-mismatch";
    case "capability-contract-mismatch":
      return "capability-contract-mismatch";
    default:
      return "invalid-input-fail-closed";
  }
}

function eligibilityFromPresentation(
  assistId: AssistSurfaceId,
  presentationPlan: SurfacePresentationPlan,
): AssistEligibilityEntry {
  const pe = presentationPlan.entryById[assistId as WorkspaceSurfaceId];
  const registryVersion = WORKSPACE_SURFACE_REGISTRY.contractVersion;
  const presentationPlanVersion = WORKSPACE_SURFACE_PRESENTATION.contractVersion;
  const eligibilityContractVersion = WORKSPACE_ASSIST_ELIGIBILITY.contractVersion;

  if (!pe) {
    return {
      assistSurfaceId: assistId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      presentationState: "n/a",
      eligibilityState: "ineligible",
      eligibilityReason: "fail-closed-minimum",
      suppressionReason: "unknown-assist-surface",
      reserved: false,
      planEligible: false,
      renderAuthorized: false,
      diagnostics: { priorityRank: 999, presentationSuppression: "n/a" },
    };
  }

  if (pe.reserved || pe.presentationState === "reserved-blocked") {
    return {
      assistSurfaceId: assistId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      presentationState: pe.presentationState,
      eligibilityState: "reserved",
      eligibilityReason: "reserved-surface",
      suppressionReason: "reserved-surface",
      reserved: true,
      planEligible: false,
      renderAuthorized: false,
      diagnostics: {
        priorityRank: pe.priority,
        presentationSuppression: pe.suppressionReason,
      },
    };
  }

  if (
    pe.presentationState === "persistent" ||
    pe.presentationState === "compacted"
  ) {
    return {
      assistSurfaceId: assistId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      presentationState: pe.presentationState,
      // Capacity-shaped eligibility. Hollow ban: renderAuthorized stays false —
      // must not claim Persistent occupancy as decoration without 1B.6 content.
      eligibilityState: "eligible",
      eligibilityReason:
        pe.presentationState === "compacted"
          ? "presentation-compacted-capacity"
          : "presentation-persistent-capacity",
      suppressionReason: "hollow-ban",
      reserved: false,
      planEligible: true,
      renderAuthorized: false,
      diagnostics: {
        priorityRank: pe.priority,
        presentationSuppression: pe.suppressionReason,
      },
    };
  }

  if (pe.suppressionReason === "mode-forbids-assist") {
    const higherModeCapacity =
      assistId === "assist-secondary" &&
      presentationPlan.maxAssistPersistent < 2 &&
      (presentationPlan.mode === "hybrid-workspace" ||
        presentationPlan.mode === "compact-workspace" ||
        presentationPlan.mode === "browse");
    return {
      assistSurfaceId: assistId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      presentationState: pe.presentationState,
      eligibilityState: higherModeCapacity ? "future-eligible" : "ineligible",
      eligibilityReason: higherModeCapacity
        ? "higher-mode-capacity"
        : "mode-forbids-assist",
      suppressionReason: "mode-forbids-assist",
      reserved: false,
      planEligible: false,
      renderAuthorized: false,
      diagnostics: {
        priorityRank: pe.priority,
        presentationSuppression: pe.suppressionReason,
      },
    };
  }

  return {
    assistSurfaceId: assistId,
    registryVersion,
    presentationPlanVersion,
    eligibilityContractVersion,
    presentationState: pe.presentationState,
    eligibilityState: "suppressed",
    eligibilityReason:
      pe.suppressionReason === "contention-demoted-absent" ||
      pe.suppressionReason === "contention-demoted-reachable"
        ? "contention-demoted"
        : pe.suppressionReason === "capability-reserved"
          ? "capability-reserved"
          : "capability-unavailable",
    suppressionReason: mapSuppression(pe.suppressionReason),
    reserved: false,
    planEligible: false,
    renderAuthorized: false,
    diagnostics: {
      priorityRank: pe.priority,
      presentationSuppression: pe.suppressionReason,
    },
  };
}

function buildPlan(
  entries: AssistEligibilityEntry[],
  meta: {
    status: AssistEligibilityPlanStatus;
    rejectionReasons: readonly string[];
    presentationPlan: SurfacePresentationPlan;
  },
): AssistEligibilityPlan {
  const sorted = [...entries].sort(
    (a, b) => a.diagnostics.priorityRank - b.diagnostics.priorityRank,
  );
  const orderedAssistIds = sorted.map((e) => e.assistSurfaceId);
  const eligibleAssistIds = sorted
    .filter((e) => e.eligibilityState === "eligible")
    .map((e) => e.assistSurfaceId);
  const ineligibleAssistIds = sorted
    .filter((e) => e.eligibilityState === "ineligible")
    .map((e) => e.assistSurfaceId);
  const suppressedAssistIds = sorted
    .filter((e) => e.eligibilityState === "suppressed")
    .map((e) => e.assistSurfaceId);
  const reservedAssistIds = sorted
    .filter((e) => e.eligibilityState === "reserved")
    .map((e) => e.assistSurfaceId);
  const futureEligibleAssistIds = sorted
    .filter((e) => e.eligibilityState === "future-eligible")
    .map((e) => e.assistSurfaceId);

  const entryById = {} as Record<AssistSurfaceId, AssistEligibilityEntry>;
  for (const e of sorted) {
    entryById[e.assistSurfaceId] = e;
  }

  const stabilityToken = tokenFor({
    status: meta.status,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    states: sorted.map((e) => `${e.assistSurfaceId}=${e.eligibilityState}`),
  });

  return {
    status: meta.status,
    rejectionReasons: meta.rejectionReasons,
    phase: WORKSPACE_ASSIST_ELIGIBILITY.phase,
    contractId: WORKSPACE_ASSIST_ELIGIBILITY.contractId,
    contractVersion: WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: WORKSPACE_CAPABILITY_FRAMEWORK.contractId,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    usableWidthPx: meta.presentationPlan.usableWidthPx,
    usableHeightPx: meta.presentationPlan.usableHeightPx,
    landscapeCarveOut: meta.presentationPlan.landscapeCarveOut,
    maxAssistPersistent: meta.presentationPlan.maxAssistPersistent,
    orderedAssistIds,
    eligibleAssistIds,
    ineligibleAssistIds,
    suppressedAssistIds,
    reservedAssistIds,
    futureEligibleAssistIds,
    entries: sorted,
    entryById,
    stabilityToken,
    drivesChrome: false,
    rendersAssist: false,
    visualActivationAuthorized: false,
    diagnosticsOnly: true,
  };
}

function failClosedPlan(
  input: AssistEligibilityResolveInput,
  rejectionReasons: readonly string[],
): AssistEligibilityPlan {
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
    maxAssistPersistent: 0,
    entryById: pp?.entryById ?? ({} as SurfacePresentationPlan["entryById"]),
  } as SurfacePresentationPlan;

  const suppression: AssistSuppressionReason = rejectionReasons.includes(
    "registry-version-mismatch",
  )
    ? "registry-version-mismatch"
    : rejectionReasons.includes("capability-contract-mismatch")
      ? "capability-contract-mismatch"
      : rejectionReasons.includes("presentation-contract-mismatch") ||
          rejectionReasons.includes("presentation-version-mismatch")
        ? "presentation-contract-mismatch"
        : rejectionReasons.includes("unknown-assist-surface")
          ? "unknown-assist-surface"
          : rejectionReasons.includes("duplicate-assist-surface")
            ? "duplicate-assist-surface"
            : "invalid-input-fail-closed";

  const entries: AssistEligibilityEntry[] =
    WORKSPACE_ASSIST_ELIGIBILITY.assistSurfaceIds.map((id, i) => ({
      assistSurfaceId: id,
      registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
      presentationPlanVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
      eligibilityContractVersion: WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
      presentationState: "absent",
      eligibilityState: "ineligible",
      eligibilityReason:
        pp?.status === "rejected"
          ? "presentation-plan-rejected"
          : "fail-closed-minimum",
      suppressionReason: suppression,
      reserved: false,
      planEligible: false,
      renderAuthorized: false,
      diagnostics: {
        priorityRank: 4 + i,
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

/** Canonical Assist Surface Eligibility Resolver. O(k), k=2 sealed. */
export function resolveAssistEligibility(
  input: AssistEligibilityResolveInput,
): AssistEligibilityPlan {
  const rejectionReasons = validateInput(input);
  if (rejectionReasons.length > 0) {
    return failClosedPlan(input, rejectionReasons);
  }

  const presentationPlan = input.presentationPlan;
  const ids =
    (input.assistSurfaceIds as readonly AssistSurfaceId[] | undefined) ??
    WORKSPACE_ASSIST_ELIGIBILITY.assistSurfaceIds;

  const entries = ids.map((id) =>
    eligibilityFromPresentation(id, presentationPlan),
  );

  if (presentationPlan.status === "rejected") {
    return deepFreeze(
      buildPlan(
        entries.map((e) => ({
          ...e,
          eligibilityState: "ineligible" as const,
          eligibilityReason: "presentation-plan-rejected" as const,
          suppressionReason: "invalid-input-fail-closed" as const,
          planEligible: false,
        })),
        {
          status: "rejected",
          rejectionReasons: ["presentation-plan-rejected"],
          presentationPlan,
        },
      ),
    );
  }

  return deepFreeze(
    buildPlan(entries, {
      status: "ok",
      rejectionReasons: [],
      presentationPlan,
    }),
  );
}

export function resolveAssistEligibilityFromPlans(
  modePlan: WorkspaceModePlan,
  capabilityPlan: WorkspaceCapabilityPlan,
): AssistEligibilityPlan {
  const presentationPlan = resolveSurfacePresentationFromPlans(
    modePlan,
    capabilityPlan,
  );
  return resolveAssistEligibility({
    registryContractId: WORKSPACE_SURFACE_REGISTRY.contractId,
    registryContractVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
    capabilityContractId: capabilityPlan.contractId,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
    presentationPlan,
  });
}

export function getAssistEligibilityEntry(
  plan: AssistEligibilityPlan,
  id: AssistSurfaceId,
): AssistEligibilityEntry | undefined {
  return plan.entryById[id];
}

export function isAssistPlanEligible(
  plan: AssistEligibilityPlan,
  id: AssistSurfaceId,
): boolean {
  return plan.entryById[id]?.planEligible === true;
}

export function isAssistRenderAuthorized(
  plan: AssistEligibilityPlan,
  id: AssistSurfaceId,
): boolean {
  return plan.entryById[id]?.renderAuthorized === true;
}

export function serializeAssistEligibilityPlan(plan: AssistEligibilityPlan): {
  status: AssistEligibilityPlanStatus;
  contractId: string;
  contractVersion: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  orderedAssistIds: AssistSurfaceId[];
  eligibleAssistIds: AssistSurfaceId[];
  ineligibleAssistIds: AssistSurfaceId[];
  suppressedAssistIds: AssistSurfaceId[];
  reservedAssistIds: AssistSurfaceId[];
  futureEligibleAssistIds: AssistSurfaceId[];
  stabilityToken: string;
  drivesChrome: false;
  rendersAssist: false;
  entries: Array<{
    assistSurfaceId: AssistSurfaceId;
    eligibilityState: AssistEligibilityState;
    planEligible: boolean;
    renderAuthorized: false;
    eligibilityReason: AssistEligibilityReason;
    suppressionReason: AssistSuppressionReason;
  }>;
} {
  return {
    status: plan.status,
    contractId: plan.contractId,
    contractVersion: plan.contractVersion,
    mode: plan.mode,
    posture: plan.posture,
    orderedAssistIds: [...plan.orderedAssistIds],
    eligibleAssistIds: [...plan.eligibleAssistIds],
    ineligibleAssistIds: [...plan.ineligibleAssistIds],
    suppressedAssistIds: [...plan.suppressedAssistIds],
    reservedAssistIds: [...plan.reservedAssistIds],
    futureEligibleAssistIds: [...plan.futureEligibleAssistIds],
    stabilityToken: plan.stabilityToken,
    drivesChrome: false,
    rendersAssist: false,
    entries: plan.entries.map((e) => ({
      assistSurfaceId: e.assistSurfaceId,
      eligibilityState: e.eligibilityState,
      planEligible: e.planEligible,
      renderAuthorized: false,
      eligibilityReason: e.eligibilityReason,
      suppressionReason: e.suppressionReason,
    })),
  };
}

export const ASSIST_ELIGIBILITY_FORBIDDEN_SOURCE_PATTERNS: readonly RegExp[] = [
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
