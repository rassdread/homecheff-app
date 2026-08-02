/**
 * WX Phase 1B.5.4 — Progressive Disclosure Continuity.
 *
 * Pure · deterministic · synchronous · side-effect free · immutable · serializable.
 * Framework-independent · browser-independent · React-independent.
 *
 * Builds a Progressive Disclosure plan on top of:
 *   Surface Registry → Presentation Resolver → Assist Eligibility → Progressive Disclosure
 *
 * Determines only whether a progressive surface may be disclosed — never whether it
 * renders, executes, or activates. Visible disclosure count remains ZERO in this phase.
 *
 * Authority: WX Phase 1B.5 Master Spec · Implementation Master Spec §1B.5.4
 *            (disclosure planning only; drawer/overlay UI deferred)
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
  type AssistEligibilityState,
} from "./resolve-assist-eligibility";
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

/** Sealed Progressive Disclosure contract identity for Phase 1B.5.4. */
export const WORKSPACE_PROGRESSIVE_DISCLOSURE = {
  phase: "1b.5.4",
  contractId: "wx-progressive-disclosure-v1",
  contractVersion: "1.0.0",
  /** Progressive / reachable-support surfaces under disclosure continuity. */
  progressiveSurfaceIds: [
    "assist-primary",
    "assist-secondary",
    "tool",
    "disclosure",
    "utility",
  ] as const,
  drivesChrome: false,
  rendersDisclosure: false,
  activatesCapabilities: false,
  diagnosticsOnly: true,
  visualActivationAuthorized: false,
  neverInspectViewport: true,
  neverInspectDevice: true,
  neverInspectUserAgent: true,
  neverRemount: true,
  neverTransferOwnership: true,
  /** Open/close drawer behaviour is not authorized in 1B.5.4. */
  disclosureUiAuthorized: false,
} as const;

export type ProgressiveSurfaceId =
  (typeof WORKSPACE_PROGRESSIVE_DISCLOSURE.progressiveSurfaceIds)[number];

export type ProgressiveDisclosureState =
  | "hidden"
  | "discoverable"
  | "disclosed"
  | "suppressed"
  | "reserved"
  | "future-disclosure";

export type ProgressiveDisclosureReason =
  | "capacity-persistent-hidden"
  | "capacity-compacted-hidden"
  | "disclosure-mechanism-ready"
  | "reachable-listed"
  | "assist-future-unlock"
  | "disclosure-deferred"
  | "deferred-utility"
  | "mode-forbids"
  | "capability-unavailable"
  | "capability-reserved"
  | "contention-demoted"
  | "reserved-surface"
  | "assist-suppressed"
  | "fail-closed-minimum"
  | "presentation-plan-rejected"
  | "eligibility-plan-rejected";

export type ProgressiveDisclosureSuppressionReason =
  | "none"
  | "mode-forbids"
  | "capability-unavailable"
  | "capability-reserved"
  | "contention-demoted-absent"
  | "insufficient-capacity"
  | "reserved-surface"
  | "deferred-utility"
  | "assist-suppressed"
  | "hollow-ban-irrelevant"
  | "invalid-input-fail-closed"
  | "registry-version-mismatch"
  | "capability-contract-mismatch"
  | "presentation-contract-mismatch"
  | "eligibility-contract-mismatch"
  | "unknown-progressive-surface"
  | "duplicate-progressive-surface"
  | "malformed-metadata";

export type ProgressiveDisclosureEntry = {
  surfaceId: ProgressiveSurfaceId;
  registryVersion: string;
  presentationPlanVersion: string;
  eligibilityContractVersion: string;
  disclosureContractVersion: string;
  presentationState: SurfacePresentationState | "n/a";
  assistEligibilityState: AssistEligibilityState | "n/a";
  disclosureState: ProgressiveDisclosureState;
  disclosureReason: ProgressiveDisclosureReason;
  suppressionReason: ProgressiveDisclosureSuppressionReason;
  reserved: boolean;
  /** Planning flag: may participate in disclosure continuity. Never authorizes UI. */
  planDiscloseable: boolean;
  /** Always false in 1B.5.4 — no disclosure UI. */
  renderAuthorized: false;
  diagnostics: {
    priorityRank: number;
    presentationSuppression: SurfaceSuppressionReason | "n/a";
    presentationDisclosure:
      | "not-applicable"
      | "disclosure-ready"
      | "disclosure-deferred"
      | "n/a";
  };
};

export type ProgressiveDisclosurePlanStatus = "ok" | "rejected";

export type ProgressiveDisclosurePlan = {
  status: ProgressiveDisclosurePlanStatus;
  rejectionReasons: readonly string[];
  phase: typeof WORKSPACE_PROGRESSIVE_DISCLOSURE.phase;
  contractId: typeof WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId;
  contractVersion: typeof WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion;
  presentationContractId: typeof WORKSPACE_SURFACE_PRESENTATION.contractId;
  presentationContractVersion: typeof WORKSPACE_SURFACE_PRESENTATION.contractVersion;
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
  orderedSurfaceIds: readonly ProgressiveSurfaceId[];
  hiddenSurfaceIds: readonly ProgressiveSurfaceId[];
  discoverableSurfaceIds: readonly ProgressiveSurfaceId[];
  disclosedSurfaceIds: readonly ProgressiveSurfaceId[];
  suppressedSurfaceIds: readonly ProgressiveSurfaceId[];
  reservedSurfaceIds: readonly ProgressiveSurfaceId[];
  futureSurfaceIds: readonly ProgressiveSurfaceId[];
  entries: readonly ProgressiveDisclosureEntry[];
  entryById: Readonly<Record<ProgressiveSurfaceId, ProgressiveDisclosureEntry>>;
  stabilityToken: string;
  drivesChrome: false;
  rendersDisclosure: false;
  visualActivationAuthorized: false;
  diagnosticsOnly: true;
};

export type ProgressiveDisclosureResolveInput = {
  registryContractId: string;
  registryContractVersion: string;
  capabilityContractId: string;
  presentationContractId: string;
  presentationContractVersion: string;
  eligibilityContractId: string;
  eligibilityContractVersion: string;
  presentationPlan: SurfacePresentationPlan;
  assistEligibilityPlan: AssistEligibilityPlan;
  progressiveSurfaceIds?: readonly string[];
};

const PROGRESSIVE_SET: ReadonlySet<string> = new Set(
  WORKSPACE_PROGRESSIVE_DISCLOSURE.progressiveSurfaceIds,
);

const ASSIST_SET: ReadonlySet<string> = new Set(
  WORKSPACE_ASSIST_ELIGIBILITY.assistSurfaceIds,
);

export const PROGRESSIVE_DISCLOSURE_FORBIDDEN_SOURCE_PATTERNS = [
  "window.",
  "navigator.",
  "document.",
  "localStorage",
  "sessionStorage",
  "matchMedia",
  "ResizeObserver",
  "MutationObserver",
  "setTimeout",
  "setInterval",
  "requestAnimationFrame",
  "fetch(",
  "XMLHttpRequest",
  "useState",
  "useEffect",
  "useLayoutEffect",
  "useRef",
  "useMemo",
  "useCallback",
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
    "wx-pd",
    WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    plan.status,
    plan.mode,
    plan.posture,
    plan.states.join("|"),
  ].join(":");
}

function validateInput(input: ProgressiveDisclosureResolveInput): string[] {
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
  if (input.eligibilityContractId !== WORKSPACE_ASSIST_ELIGIBILITY.contractId) {
    reasons.push("eligibility-contract-mismatch");
  }
  if (
    input.eligibilityContractVersion !==
    WORKSPACE_ASSIST_ELIGIBILITY.contractVersion
  ) {
    reasons.push("eligibility-version-mismatch");
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
    !input.assistEligibilityPlan ||
    typeof input.assistEligibilityPlan !== "object"
  ) {
    reasons.push("missing-eligibility-plan");
  } else {
    if (
      input.assistEligibilityPlan.contractId !==
      WORKSPACE_ASSIST_ELIGIBILITY.contractId
    ) {
      reasons.push("eligibility-plan-contract-mismatch");
    }
    if (
      input.assistEligibilityPlan.contractVersion !==
      WORKSPACE_ASSIST_ELIGIBILITY.contractVersion
    ) {
      reasons.push("eligibility-plan-version-mismatch");
    }
  }
  const ids = input.progressiveSurfaceIds ?? [
    ...WORKSPACE_PROGRESSIVE_DISCLOSURE.progressiveSurfaceIds,
  ];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      reasons.push("duplicate-progressive-surface");
      break;
    }
    seen.add(id);
    if (!PROGRESSIVE_SET.has(id)) {
      reasons.push("unknown-progressive-surface");
      break;
    }
  }
  return reasons;
}

function mapPresentationSuppression(
  presentationSuppression: SurfaceSuppressionReason | undefined,
): ProgressiveDisclosureSuppressionReason {
  switch (presentationSuppression) {
    case "none":
      return "none";
    case "mode-forbids-assist":
      return "mode-forbids";
    case "capability-unavailable":
      return "capability-unavailable";
    case "capability-reserved":
      return "capability-reserved";
    case "contention-demoted-absent":
      return "contention-demoted-absent";
    case "contention-demoted-reachable":
      return "none";
    case "insufficient-capacity":
      return "insufficient-capacity";
    case "reserved-surface":
      return "reserved-surface";
    case "deferred-utility":
      return "deferred-utility";
    case "registry-version-mismatch":
      return "registry-version-mismatch";
    case "capability-contract-mismatch":
      return "capability-contract-mismatch";
    default:
      return "invalid-input-fail-closed";
  }
}

function disclosureFromInputs(
  surfaceId: ProgressiveSurfaceId,
  presentationPlan: SurfacePresentationPlan,
  assistPlan: AssistEligibilityPlan,
): ProgressiveDisclosureEntry {
  const pe = presentationPlan.entryById[surfaceId as WorkspaceSurfaceId];
  const registryVersion = WORKSPACE_SURFACE_REGISTRY.contractVersion;
  const presentationPlanVersion = WORKSPACE_SURFACE_PRESENTATION.contractVersion;
  const eligibilityContractVersion = WORKSPACE_ASSIST_ELIGIBILITY.contractVersion;
  const disclosureContractVersion =
    WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion;

  const assistEligibilityState: AssistEligibilityState | "n/a" = ASSIST_SET.has(
    surfaceId,
  )
    ? (assistPlan.entryById[surfaceId as "assist-primary" | "assist-secondary"]
        ?.eligibilityState ?? "n/a")
    : "n/a";

  if (!pe) {
    return {
      surfaceId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      disclosureContractVersion,
      presentationState: "n/a",
      assistEligibilityState,
      disclosureState: "suppressed",
      disclosureReason: "fail-closed-minimum",
      suppressionReason: "unknown-progressive-surface",
      reserved: false,
      planDiscloseable: false,
      renderAuthorized: false,
      diagnostics: {
        priorityRank: 999,
        presentationSuppression: "n/a",
        presentationDisclosure: "n/a",
      },
    };
  }

  const presentationDisclosure =
    pe.disclosureState === "not-applicable" ||
    pe.disclosureState === "disclosure-ready" ||
    pe.disclosureState === "disclosure-deferred"
      ? pe.disclosureState
      : "n/a";

  const baseDiag = {
    priorityRank: pe.priority,
    presentationSuppression: pe.suppressionReason,
    presentationDisclosure,
  } as const;

  if (pe.reserved || pe.presentationState === "reserved-blocked") {
    return {
      surfaceId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      disclosureContractVersion,
      presentationState: pe.presentationState,
      assistEligibilityState,
      disclosureState: "reserved",
      disclosureReason: "reserved-surface",
      suppressionReason: "reserved-surface",
      reserved: true,
      planDiscloseable: false,
      renderAuthorized: false,
      diagnostics: baseDiag,
    };
  }

  // Assist eligibility is authoritative for assist surfaces when present.
  if (ASSIST_SET.has(surfaceId) && assistEligibilityState !== "n/a") {
    if (assistEligibilityState === "reserved") {
      return {
        surfaceId,
        registryVersion,
        presentationPlanVersion,
        eligibilityContractVersion,
        disclosureContractVersion,
        presentationState: pe.presentationState,
        assistEligibilityState,
        disclosureState: "reserved",
        disclosureReason: "reserved-surface",
        suppressionReason: "reserved-surface",
        reserved: true,
        planDiscloseable: false,
        renderAuthorized: false,
        diagnostics: baseDiag,
      };
    }
    if (assistEligibilityState === "future-eligible") {
      return {
        surfaceId,
        registryVersion,
        presentationPlanVersion,
        eligibilityContractVersion,
        disclosureContractVersion,
        presentationState: pe.presentationState,
        assistEligibilityState,
        disclosureState: "future-disclosure",
        disclosureReason: "assist-future-unlock",
        suppressionReason: mapPresentationSuppression(pe.suppressionReason),
        reserved: false,
        planDiscloseable: false,
        renderAuthorized: false,
        diagnostics: baseDiag,
      };
    }
    if (assistEligibilityState === "suppressed") {
      return {
        surfaceId,
        registryVersion,
        presentationPlanVersion,
        eligibilityContractVersion,
        disclosureContractVersion,
        presentationState: pe.presentationState,
        assistEligibilityState,
        disclosureState: "suppressed",
        disclosureReason: "assist-suppressed",
        suppressionReason: "assist-suppressed",
        reserved: false,
        planDiscloseable: false,
        renderAuthorized: false,
        diagnostics: baseDiag,
      };
    }
    if (assistEligibilityState === "eligible") {
      // Capacity-shaped path — disclosure continuity not required while persistent.
      return {
        surfaceId,
        registryVersion,
        presentationPlanVersion,
        eligibilityContractVersion,
        disclosureContractVersion,
        presentationState: pe.presentationState,
        assistEligibilityState,
        disclosureState: "hidden",
        disclosureReason:
          pe.presentationState === "compacted"
            ? "capacity-compacted-hidden"
            : "capacity-persistent-hidden",
        suppressionReason: "hollow-ban-irrelevant",
        reserved: false,
        planDiscloseable: false,
        renderAuthorized: false,
        diagnostics: baseDiag,
      };
    }
    // ineligible — fall through to presentation mapping
  }

  if (pe.presentationState === "persistent") {
    return {
      surfaceId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      disclosureContractVersion,
      presentationState: pe.presentationState,
      assistEligibilityState,
      disclosureState: "hidden",
      disclosureReason: "capacity-persistent-hidden",
      suppressionReason: "none",
      reserved: false,
      planDiscloseable: false,
      renderAuthorized: false,
      diagnostics: baseDiag,
    };
  }

  if (pe.presentationState === "compacted") {
    return {
      surfaceId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      disclosureContractVersion,
      presentationState: pe.presentationState,
      assistEligibilityState,
      disclosureState: "hidden",
      disclosureReason: "capacity-compacted-hidden",
      suppressionReason: "none",
      reserved: false,
      planDiscloseable: false,
      renderAuthorized: false,
      diagnostics: baseDiag,
    };
  }

  if (pe.disclosureState === "disclosure-deferred") {
    return {
      surfaceId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      disclosureContractVersion,
      presentationState: pe.presentationState,
      assistEligibilityState,
      disclosureState: "future-disclosure",
      disclosureReason: "disclosure-deferred",
      suppressionReason: mapPresentationSuppression(pe.suppressionReason),
      reserved: false,
      planDiscloseable: false,
      renderAuthorized: false,
      diagnostics: baseDiag,
    };
  }

  if (pe.suppressionReason === "deferred-utility") {
    return {
      surfaceId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      disclosureContractVersion,
      presentationState: pe.presentationState,
      assistEligibilityState,
      disclosureState: "future-disclosure",
      disclosureReason: "deferred-utility",
      suppressionReason: "deferred-utility",
      reserved: false,
      planDiscloseable: false,
      renderAuthorized: false,
      diagnostics: baseDiag,
    };
  }

  if (
    pe.presentationState === "reachable" ||
    pe.disclosureState === "disclosure-ready"
  ) {
    if (surfaceId === "disclosure") {
      // Overflow mechanism may be discovered — never auto-opens; no UI in 1B.5.4.
      return {
        surfaceId,
        registryVersion,
        presentationPlanVersion,
        eligibilityContractVersion,
        disclosureContractVersion,
        presentationState: pe.presentationState,
        assistEligibilityState,
        disclosureState: "discoverable",
        disclosureReason: "disclosure-mechanism-ready",
        suppressionReason: "none",
        reserved: false,
        planDiscloseable: true,
        renderAuthorized: false,
        diagnostics: baseDiag,
      };
    }
    // Reachable content authorized for disclosure listing (planning only).
    return {
      surfaceId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      disclosureContractVersion,
      presentationState: pe.presentationState,
      assistEligibilityState,
      disclosureState: "disclosed",
      disclosureReason: "reachable-listed",
      suppressionReason: "none",
      reserved: false,
      planDiscloseable: true,
      renderAuthorized: false,
      diagnostics: baseDiag,
    };
  }

  if (pe.presentationState === "absent") {
    const suppression = mapPresentationSuppression(pe.suppressionReason);
    return {
      surfaceId,
      registryVersion,
      presentationPlanVersion,
      eligibilityContractVersion,
      disclosureContractVersion,
      presentationState: pe.presentationState,
      assistEligibilityState,
      disclosureState: "suppressed",
      disclosureReason:
        pe.suppressionReason === "mode-forbids-assist"
          ? "mode-forbids"
          : pe.suppressionReason === "capability-unavailable"
            ? "capability-unavailable"
            : pe.suppressionReason === "contention-demoted-absent"
              ? "contention-demoted"
              : "fail-closed-minimum",
      suppressionReason: suppression,
      reserved: false,
      planDiscloseable: false,
      renderAuthorized: false,
      diagnostics: baseDiag,
    };
  }

  return {
    surfaceId,
    registryVersion,
    presentationPlanVersion,
    eligibilityContractVersion,
    disclosureContractVersion,
    presentationState: pe.presentationState,
    assistEligibilityState,
    disclosureState: "suppressed",
    disclosureReason: "fail-closed-minimum",
    suppressionReason: "invalid-input-fail-closed",
    reserved: false,
    planDiscloseable: false,
    renderAuthorized: false,
    diagnostics: baseDiag,
  };
}

function buildPlan(
  entries: ProgressiveDisclosureEntry[],
  meta: {
    status: ProgressiveDisclosurePlanStatus;
    rejectionReasons: readonly string[];
    presentationPlan: SurfacePresentationPlan;
    assistEligibilityPlan: AssistEligibilityPlan;
  },
): ProgressiveDisclosurePlan {
  const sorted = [...entries].sort(
    (a, b) => a.diagnostics.priorityRank - b.diagnostics.priorityRank,
  );
  const orderedSurfaceIds = sorted.map((e) => e.surfaceId);
  const hiddenSurfaceIds = sorted
    .filter((e) => e.disclosureState === "hidden")
    .map((e) => e.surfaceId);
  const discoverableSurfaceIds = sorted
    .filter((e) => e.disclosureState === "discoverable")
    .map((e) => e.surfaceId);
  const disclosedSurfaceIds = sorted
    .filter((e) => e.disclosureState === "disclosed")
    .map((e) => e.surfaceId);
  const suppressedSurfaceIds = sorted
    .filter((e) => e.disclosureState === "suppressed")
    .map((e) => e.surfaceId);
  const reservedSurfaceIds = sorted
    .filter((e) => e.disclosureState === "reserved")
    .map((e) => e.surfaceId);
  const futureSurfaceIds = sorted
    .filter((e) => e.disclosureState === "future-disclosure")
    .map((e) => e.surfaceId);

  const entryById = {} as Record<
    ProgressiveSurfaceId,
    ProgressiveDisclosureEntry
  >;
  for (const e of sorted) {
    entryById[e.surfaceId] = e;
  }

  const stabilityToken = tokenFor({
    status: meta.status,
    mode: meta.presentationPlan.mode,
    posture: meta.presentationPlan.posture,
    states: sorted.map((e) => `${e.surfaceId}=${e.disclosureState}`),
  });

  return {
    status: meta.status,
    rejectionReasons: meta.rejectionReasons,
    phase: WORKSPACE_PROGRESSIVE_DISCLOSURE.phase,
    contractId: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId,
    contractVersion: WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
    presentationContractId: WORKSPACE_SURFACE_PRESENTATION.contractId,
    presentationContractVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
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
    orderedSurfaceIds,
    hiddenSurfaceIds,
    discoverableSurfaceIds,
    disclosedSurfaceIds,
    suppressedSurfaceIds,
    reservedSurfaceIds,
    futureSurfaceIds,
    entries: sorted,
    entryById,
    stabilityToken,
    drivesChrome: false,
    rendersDisclosure: false,
    visualActivationAuthorized: false,
    diagnosticsOnly: true,
  };
}

function failClosedPlan(
  input: ProgressiveDisclosureResolveInput,
  rejectionReasons: readonly string[],
): ProgressiveDisclosurePlan {
  const pp = input.presentationPlan;
  const ae = input.assistEligibilityPlan;
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

  const stubEligibility = {
    ...(ae ?? {}),
    mode,
    posture,
    entryById: ae?.entryById ?? {},
  } as AssistEligibilityPlan;

  const suppression: ProgressiveDisclosureSuppressionReason =
    rejectionReasons.includes("registry-version-mismatch")
      ? "registry-version-mismatch"
      : rejectionReasons.includes("capability-contract-mismatch")
        ? "capability-contract-mismatch"
        : rejectionReasons.includes("presentation-contract-mismatch") ||
            rejectionReasons.includes("presentation-version-mismatch")
          ? "presentation-contract-mismatch"
          : rejectionReasons.includes("eligibility-contract-mismatch") ||
              rejectionReasons.includes("eligibility-version-mismatch")
            ? "eligibility-contract-mismatch"
            : rejectionReasons.includes("unknown-progressive-surface")
              ? "unknown-progressive-surface"
              : rejectionReasons.includes("duplicate-progressive-surface")
                ? "duplicate-progressive-surface"
                : "invalid-input-fail-closed";

  const entries: ProgressiveDisclosureEntry[] =
    WORKSPACE_PROGRESSIVE_DISCLOSURE.progressiveSurfaceIds.map((id, i) => ({
      surfaceId: id,
      registryVersion: WORKSPACE_SURFACE_REGISTRY.contractVersion,
      presentationPlanVersion: WORKSPACE_SURFACE_PRESENTATION.contractVersion,
      eligibilityContractVersion: WORKSPACE_ASSIST_ELIGIBILITY.contractVersion,
      disclosureContractVersion:
        WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion,
      presentationState: "absent",
      assistEligibilityState: "n/a",
      disclosureState: "suppressed",
      disclosureReason:
        pp?.status === "rejected"
          ? "presentation-plan-rejected"
          : ae?.status === "rejected"
            ? "eligibility-plan-rejected"
            : "fail-closed-minimum",
      suppressionReason: suppression,
      reserved: false,
      planDiscloseable: false,
      renderAuthorized: false,
      diagnostics: {
        priorityRank: 10 + i,
        presentationSuppression: "n/a",
        presentationDisclosure: "n/a",
      },
    }));

  return deepFreeze(
    buildPlan(entries, {
      status: "rejected",
      rejectionReasons,
      presentationPlan: stubPresentation,
      assistEligibilityPlan: stubEligibility,
    }),
  );
}

/** Canonical Progressive Disclosure Resolver. O(k), k=5 sealed. */
export function resolveProgressiveDisclosure(
  input: ProgressiveDisclosureResolveInput,
): ProgressiveDisclosurePlan {
  const rejectionReasons = validateInput(input);
  if (rejectionReasons.length > 0) {
    return failClosedPlan(input, rejectionReasons);
  }

  const presentationPlan = input.presentationPlan;
  const assistEligibilityPlan = input.assistEligibilityPlan;
  const ids =
    (input.progressiveSurfaceIds as
      | readonly ProgressiveSurfaceId[]
      | undefined) ?? WORKSPACE_PROGRESSIVE_DISCLOSURE.progressiveSurfaceIds;

  const entries = ids.map((id) =>
    disclosureFromInputs(id, presentationPlan, assistEligibilityPlan),
  );

  if (presentationPlan.status === "rejected") {
    return deepFreeze(
      buildPlan(
        entries.map((e) => ({
          ...e,
          disclosureState: "suppressed" as const,
          disclosureReason: "presentation-plan-rejected" as const,
          suppressionReason: "invalid-input-fail-closed" as const,
          planDiscloseable: false,
        })),
        {
          status: "rejected",
          rejectionReasons: ["presentation-plan-rejected"],
          presentationPlan,
          assistEligibilityPlan,
        },
      ),
    );
  }

  if (assistEligibilityPlan.status === "rejected") {
    return deepFreeze(
      buildPlan(
        entries.map((e) => ({
          ...e,
          disclosureState: "suppressed" as const,
          disclosureReason: "eligibility-plan-rejected" as const,
          suppressionReason: "invalid-input-fail-closed" as const,
          planDiscloseable: false,
        })),
        {
          status: "rejected",
          rejectionReasons: ["eligibility-plan-rejected"],
          presentationPlan,
          assistEligibilityPlan,
        },
      ),
    );
  }

  return deepFreeze(
    buildPlan(entries, {
      status: "ok",
      rejectionReasons: [],
      presentationPlan,
      assistEligibilityPlan,
    }),
  );
}

export function resolveProgressiveDisclosureFromPlans(
  modePlan: WorkspaceModePlan,
  capabilityPlan: WorkspaceCapabilityPlan,
): ProgressiveDisclosurePlan {
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
  return resolveProgressiveDisclosure({
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
}

export function getProgressiveDisclosureEntry(
  plan: ProgressiveDisclosurePlan,
  id: ProgressiveSurfaceId,
): ProgressiveDisclosureEntry | undefined {
  return plan.entryById[id];
}

export function isProgressivePlanDiscloseable(
  plan: ProgressiveDisclosurePlan,
  id: ProgressiveSurfaceId,
): boolean {
  return plan.entryById[id]?.planDiscloseable === true;
}

export function isProgressiveRenderAuthorized(
  plan: ProgressiveDisclosurePlan,
  id: ProgressiveSurfaceId,
): boolean {
  return plan.entryById[id]?.renderAuthorized === true;
}

export function serializeProgressiveDisclosurePlan(
  plan: ProgressiveDisclosurePlan,
): {
  status: ProgressiveDisclosurePlanStatus;
  contractId: string;
  contractVersion: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  orderedSurfaceIds: ProgressiveSurfaceId[];
  hiddenSurfaceIds: ProgressiveSurfaceId[];
  discoverableSurfaceIds: ProgressiveSurfaceId[];
  disclosedSurfaceIds: ProgressiveSurfaceId[];
  suppressedSurfaceIds: ProgressiveSurfaceId[];
  reservedSurfaceIds: ProgressiveSurfaceId[];
  futureSurfaceIds: ProgressiveSurfaceId[];
  stabilityToken: string;
  drivesChrome: false;
  rendersDisclosure: false;
  entries: Array<{
    surfaceId: ProgressiveSurfaceId;
    disclosureState: ProgressiveDisclosureState;
    planDiscloseable: boolean;
    renderAuthorized: false;
    disclosureReason: ProgressiveDisclosureReason;
    suppressionReason: ProgressiveDisclosureSuppressionReason;
  }>;
} {
  return {
    status: plan.status,
    contractId: plan.contractId,
    contractVersion: plan.contractVersion,
    mode: plan.mode,
    posture: plan.posture,
    orderedSurfaceIds: [...plan.orderedSurfaceIds],
    hiddenSurfaceIds: [...plan.hiddenSurfaceIds],
    discoverableSurfaceIds: [...plan.discoverableSurfaceIds],
    disclosedSurfaceIds: [...plan.disclosedSurfaceIds],
    suppressedSurfaceIds: [...plan.suppressedSurfaceIds],
    reservedSurfaceIds: [...plan.reservedSurfaceIds],
    futureSurfaceIds: [...plan.futureSurfaceIds],
    stabilityToken: plan.stabilityToken,
    drivesChrome: false,
    rendersDisclosure: false,
    entries: plan.entries.map((e) => ({
      surfaceId: e.surfaceId,
      disclosureState: e.disclosureState,
      planDiscloseable: e.planDiscloseable,
      renderAuthorized: false as const,
      disclosureReason: e.disclosureReason,
      suppressionReason: e.suppressionReason,
    })),
  };
}
