import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  PANEL_MODE_META,
  RESOLVE_PRECEDENCE,
  type DecisionTrace,
  type FocusIntent,
  type LifecycleIntent,
  type OverflowStrategy,
  type PanelInstancePlan,
  type PanelMode,
  type RegionId,
  type RegionPlan,
  type ResolveInput,
  type SlotPlan,
  type TransitionIntent,
  type WidgetManifest,
  type WidgetPlacement,
  type WorkspaceLayoutPlan,
  type WorkspaceProfile,
} from "../types/workspace";
import { validateResolveInput } from "../schema/validate-resolve-input";
import { HardContractViolation } from "../schema/validation-error";
import { resolveWorkspaceProfile } from "../profile/resolve-workspace-profile";
import {
  getSurfacePolicy,
  manifestSupportsSurface,
  type SurfacePolicy,
} from "../policies/settings-policy";
import { DIAGNOSTIC_CODES } from "../diagnostics/diagnostic-codes";
import { canonicalizeLayoutPlan } from "./canonicalize-layout-plan";

type CandidateSource =
  | "primary-task"
  | "explicit-panel-request"
  | "valid-user-pin"
  | "surface-policy-required"
  | "surface-policy-default";

interface Candidate {
  manifest: WidgetManifest;
  source: CandidateSource;
  preferredMode?: PanelMode;
  preferredRegion?: RegionId;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const v of Object.values(value as object)) {
      if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
    }
  }
  return value;
}

function pickPrimary(
  input: ResolveInput,
  policy: SurfacePolicy,
): WidgetManifest | null {
  const byId = new Map(input.manifests.map((m) => [m.id, m]));
  for (const req of policy.requiredWidgets) {
    const m = byId.get(req.widgetId);
    if (m?.canBePrimary && manifestSupportsSurface(m, input.surfaceId)) return m;
  }
  const taskHint = input.primaryTask.split(".")[0] ?? "";
  /** Exact primaryTask id outranks shared prefix (e.g. messages.chat vs messages.list). */
  const taskScore = (m: { id: string }): number => {
    if (m.id === input.primaryTask) return 2;
    if (m.id.startsWith(`${taskHint}.`)) return 1;
    return 0;
  };
  const ranked = input.manifests
    .filter(
      (m) =>
        m.canBePrimary &&
        m.allowedPanelModes.includes("stage") &&
        manifestSupportsSurface(m, input.surfaceId),
    )
    .slice()
    .sort((a, b) => {
      const aTask = taskScore(a);
      const bTask = taskScore(b);
      if (bTask !== aTask) return bTask - aTask;
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.id.localeCompare(b.id);
    });
  return ranked[0] ?? null;
}

function collectCandidates(
  input: ResolveInput,
  policy: SurfacePolicy,
  primaryId: string | null,
): { candidates: Candidate[]; preferenceWarnings: string[]; rejectedEarly: { widgetId: string; reason: string; code: string }[] } {
  const byId = new Map(input.manifests.map((m) => [m.id, m]));
  const preferenceWarnings: string[] = [];
  const rejectedEarly: { widgetId: string; reason: string; code: string }[] = [];
  const seen = new Set<string>();
  const candidates: Candidate[] = [];

  const add = (c: Candidate) => {
    if (c.manifest.id === primaryId) return;
    if (seen.has(c.manifest.id)) return;
    if (!manifestSupportsSurface(c.manifest, input.surfaceId)) return;
    seen.add(c.manifest.id);
    candidates.push(c);
  };

  for (const req of input.panelRequests) {
    if (req.intent === "close") continue;
    const m = byId.get(req.widgetId);
    if (!m) {
      rejectedEarly.push({
        widgetId: req.widgetId,
        reason: "unknown widget",
        code: DIAGNOSTIC_CODES.UNKNOWN_WIDGET,
      });
      continue;
    }
    if (req.intent === "pin" || req.intent === "open") {
      add({
        manifest: m,
        source: "explicit-panel-request",
        preferredMode: req.preferredMode,
      });
    }
  }

  for (const pin of input.preferences.pins) {
    const m = byId.get(pin);
    if (!m) {
      preferenceWarnings.push(`invalid pin ignored: ${pin}`);
      continue;
    }
    if (m.id === primaryId) {
      preferenceWarnings.push(`pin ignored; cannot displace primary: ${pin}`);
      continue;
    }
    add({ manifest: m, source: "valid-user-pin" });
  }

  for (const spec of policy.requiredWidgets) {
    if (spec.widgetId === primaryId) continue;
    const m = byId.get(spec.widgetId);
    if (!m) continue;
    add({
      manifest: m,
      source: "surface-policy-required",
      preferredRegion: spec.preferredRegion,
      preferredMode: spec.preferredModes?.[0],
    });
  }

  for (const spec of policy.defaultWidgets) {
    if (spec.widgetId === primaryId) continue;
    const m = byId.get(spec.widgetId);
    if (!m) continue;
    add({
      manifest: m,
      source: "surface-policy-default",
      preferredRegion: spec.preferredRegion,
      preferredMode: spec.preferredModes?.[0],
    });
  }

  const sourceRank: Record<CandidateSource, number> = {
    "primary-task": 0,
    "explicit-panel-request": 1,
    "valid-user-pin": 2,
    "surface-policy-required": 3,
    "surface-policy-default": 4,
  };

  candidates.sort((a, b) => {
    const sr = sourceRank[a.source] - sourceRank[b.source];
    if (sr !== 0) return sr;
    if (b.manifest.priority !== a.manifest.priority) {
      return b.manifest.priority - a.manifest.priority;
    }
    return a.manifest.id.localeCompare(b.manifest.id);
  });

  return { candidates, preferenceWarnings, rejectedEarly };
}

function chooseMode(
  manifest: WidgetManifest,
  profile: WorkspaceProfile,
  preferred?: PanelMode,
  region?: RegionId,
): PanelMode {
  const persistentOk =
    profile === "COMFORT" ||
    profile === "EXPANDED" ||
    profile === "PROFESSIONAL";
  const order: PanelMode[] = [];
  if (preferred) order.push(preferred);
  if (region === "supporting-start" || region === "supporting-end") {
    if (persistentOk) order.push("rail", "split");
    order.push("sheet", "drawer", "overlay");
  }
  if (region === "utility") order.push("rail", "floating", "overlay");
  if (region === "transient-overlay") order.push("overlay", "sheet");
  if (region === "global-modal") order.push("modal");
  order.push("sheet", "drawer", "overlay", "floating", "rail", "split");

  for (const mode of order) {
    if (!manifest.allowedPanelModes.includes(mode)) continue;
    if (mode === "stage" && !manifest.canBePrimary) continue;
    if ((mode === "rail" || mode === "split") && profile === "COMPACT") continue;
    if (mode === "floating" && !manifest.canFloat) continue;
    if (mode === "overlay" && !manifest.canOverlay && !manifest.allowedPanelModes.includes("overlay")) {
      // allow if explicitly in allowedPanelModes only
    }
    if (mode === "overlay" && !manifest.allowedPanelModes.includes("overlay")) continue;
    return mode;
  }
  const collapse = manifest.collapseBehavior;
  if (collapse === "to-sheet" && manifest.allowedPanelModes.includes("sheet")) return "sheet";
  if (collapse === "to-drawer" && manifest.allowedPanelModes.includes("drawer")) return "drawer";
  if (manifest.allowedPanelModes.includes("overlay") && manifest.canOverlay) return "overlay";
  return manifest.allowedPanelModes.find((m) => m !== "stage") ?? manifest.allowedPanelModes[0]!;
}

function defaultRegionFor(
  manifest: WidgetManifest,
  mode: PanelMode,
  profile: WorkspaceProfile,
): RegionId {
  if (manifest.preferredRegion) return manifest.preferredRegion;
  if (mode === "modal") return "global-modal";
  if (mode === "overlay" || mode === "sheet" || mode === "drawer") {
    return "transient-overlay";
  }
  if (mode === "floating") return "floating-action";
  if (profile === "PROFESSIONAL" && manifest.canPersist) return "utility";
  return "supporting-end";
}

function buildFallbackPlan(
  input: ResolveInput,
  preferenceWarnings: string[],
  reason: string,
): WorkspaceLayoutPlan {
  const { profile } = resolveWorkspaceProfile({
    usableWidthPx: input.availableSpace.widthPx,
    usableHeightPx: input.availableSpace.heightPx,
  });
  const slotId = `slot:${input.surfaceId}:primary`;
  const panelId = `panel:${input.surfaceId}:primary`;
  const reduced =
    input.capabilities.reducedMotion || input.accessibility.forceReducedMotion;
  const transitionIntent: TransitionIntent = reduced ? "none" : "immediate";
  const focusIntent: FocusIntent = {
    targetSlotId: slotId,
    trap: false,
    recovery: "stage",
  };
  const diagnostics: DecisionTrace = {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    profile,
    availableSpaceSummary: {
      widthPx: input.availableSpace.widthPx,
      heightPx: input.availableSpace.heightPx,
      stabilityToken: input.availableSpace.stabilityToken,
    },
    primaryWidgetId: null,
    precedence: RESOLVE_PRECEDENCE,
    placed: [],
    rejected: [],
    fallbacks: [
      {
        widgetId: "*",
        from: "resolve",
        to: "empty-stage",
        reason,
      },
    ],
    preferenceWarnings,
    incompatibilities: [],
    compatibilityMode: input.compatibility.mode,
    transitionIntent,
    focusIntent,
    diagnosticCodes: [DIAGNOSTIC_CODES.FALLBACK_MISSING_PRIMARY],
    warnings: [reason],
  };

  const regions: RegionPlan[] = [
    { id: "navigation", slotIds: [] },
    { id: "primary-stage", slotIds: [slotId] },
  ];
  const slots: SlotPlan[] = [{ id: slotId, regionId: "primary-stage", panelId: null }];

  return canonicalizeLayoutPlan({
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    surfaceId: input.surfaceId,
    profile,
    renderActivation: input.compatibility.mode === "on",
    regions,
    slots,
    panels: [],
    placements: [],
    primaryWidgetId: null,
    overflowStrategy: "none",
    focusIntent,
    transitionIntent,
    lifecycleIntents: [],
    diagnostics,
    navigationIntent: { landmarks: ["navigation", "primary-stage"] },
  });
}

/**
 * Pure hybrid policy resolver.
 * Does not measure space, run hysteresis, touch DOM/React, or mutate input.
 */
export function resolveWorkspaceLayout(rawInput: unknown): WorkspaceLayoutPlan {
  const { input, preferenceWarnings: prefWarnFromValidation } =
    validateResolveInput(rawInput);

  // Ensure sealed uniqueness already enforced by validateWidgetManifestSet
  const sealed = input.manifests.filter((m) => m.type === "sealed");
  if (sealed.length > 1) {
    throw new HardContractViolation(
      DIAGNOSTIC_CODES.DUPLICATE_SEALED,
      "Duplicate sealed widget registration",
    );
  }

  if (input.compatibility.mode === "off") {
    const empty = buildFallbackPlan(input, prefWarnFromValidation, "compat off");
    return canonicalizeLayoutPlan({
      ...empty,
      renderActivation: false,
      diagnostics: {
        ...empty.diagnostics,
        compatibilityMode: "off",
        diagnosticCodes: [DIAGNOSTIC_CODES.COMPAT_OFF],
        warnings: ["compatibility mode off — no render directives"],
      },
    });
  }

  const policy = getSurfacePolicy(input.surfaceId);
  const primary = pickPrimary(input, policy);
  if (!primary) {
    return buildFallbackPlan(
      input,
      prefWarnFromValidation,
      "missing primary widget",
    );
  }

  const { profile, heightDemoted, budget } = resolveWorkspaceProfile({
    usableWidthPx: input.availableSpace.widthPx,
    usableHeightPx: input.availableSpace.heightPx,
  });

  const preferenceWarnings = [...prefWarnFromValidation];
  const { candidates, preferenceWarnings: pinWarnings, rejectedEarly } =
    collectCandidates(input, policy, primary.id);
  preferenceWarnings.push(...pinWarnings);

  const placedWidgets = new Set<string>([primary.id]);
  const rejected: Array<DecisionTrace["rejected"][number]> = [...rejectedEarly];
  const fallbacks: Array<DecisionTrace["fallbacks"][number]> = [];
  const incompatibilities: string[] = [];
  const diagnosticCodes: string[] = [];
  if (heightDemoted) diagnosticCodes.push(DIAGNOSTIC_CODES.HEIGHT_DEMOTE);

  const regionsMap = new Map<RegionId, string[]>();
  const ensureRegion = (id: RegionId) => {
    if (!regionsMap.has(id)) regionsMap.set(id, []);
  };
  ensureRegion("navigation");
  ensureRegion("primary-stage");

  const slots: SlotPlan[] = [];
  const panels: PanelInstancePlan[] = [];
  const placements: WidgetPlacement[] = [];
  const lifecycleIntents: LifecycleIntent[] = [];
  const placedTrace: Array<DecisionTrace["placed"][number]> = [];

  const place = (
    manifest: WidgetManifest,
    regionId: RegionId,
    mode: PanelMode,
    reason: string,
  ) => {
    ensureRegion(regionId);
    const slotId = `slot:${input.surfaceId}:${regionId}:${manifest.id}`;
    const panelId = `panel:${input.surfaceId}:${manifest.id}`;
    const placementId = `placement:${manifest.id}`;
    const meta = PANEL_MODE_META[mode];

    regionsMap.get(regionId)!.push(slotId);
    slots.push({ id: slotId, regionId, panelId });
    panels.push({
      id: panelId,
      slotId,
      mode,
      widgetId: manifest.id,
      takesStructuralSpace: meta.takesStructuralSpace,
      isTransient: meta.isTransient,
      requiresFocusTrap: meta.requiresFocusTrap,
      closeContract: meta.isTransient
        ? { escape: true, backdrop: meta.blocksUnderlyingContent }
        : undefined,
    });
    placements.push({
      id: placementId,
      widgetId: manifest.id,
      panelId,
      slotId,
      regionId,
      mode,
      statePreservationKey: manifest.statePreservationKey,
      visible: true,
    });
    lifecycleIntents.push({
      widgetId: manifest.id,
      statePreservationKey: manifest.statePreservationKey,
      intent: "VISIBLE",
    });
    placedTrace.push({ widgetId: manifest.id, region: regionId, mode, reason });
    placedWidgets.add(manifest.id);
  };

  place(primary, "primary-stage", "stage", "primary-task");

  let persistentUsed = 0;
  let utilityUsed = 0;
  let transientUsed = 0;
  let overflowStrategy: OverflowStrategy = "none";

  for (const candidate of candidates) {
    const m = candidate.manifest;
    if (placedWidgets.has(m.id)) continue;

    const blockedBy = [...placedWidgets].find((id) => {
      const other = input.manifests.find((x) => x.id === id);
      return (
        (m.incompatibleWith ?? []).includes(id) ||
        (other?.incompatibleWith ?? []).includes(m.id)
      );
    });
    if (blockedBy) {
      incompatibilities.push(`${m.id} incompatible with ${blockedBy}`);
      rejected.push({
        widgetId: m.id,
        reason: `incompatible with ${blockedBy}`,
        code: DIAGNOSTIC_CODES.INCOMPATIBLE,
      });
      continue;
    }

    let region =
      candidate.preferredRegion ??
      m.preferredRegion ??
      defaultRegionFor(m, "rail", profile);
    let mode = chooseMode(m, profile, candidate.preferredMode, region);
    const meta = PANEL_MODE_META[mode];

    // Capacity checks
    if (meta.takesStructuralSpace && (mode === "rail" || mode === "split")) {
      if (persistentUsed >= budget.maxPersistentSupportingPanels) {
        const collapsed = chooseMode(
          m,
          "COMPACT",
          undefined,
          "transient-overlay",
        );
        if (PANEL_MODE_META[collapsed].isTransient) {
          fallbacks.push({
            widgetId: m.id,
            from: mode,
            to: collapsed,
            reason: "capacity — collapse supporting",
          });
          mode = collapsed;
          region = "transient-overlay";
          diagnosticCodes.push(DIAGNOSTIC_CODES.COLLAPSED);
        } else {
          rejected.push({
            widgetId: m.id,
            reason: "capacity",
            code: DIAGNOSTIC_CODES.CAPACITY,
          });
          overflowStrategy = "overflow-menu";
          continue;
        }
      }
    }

    if (region === "utility") {
      if (utilityUsed >= budget.maxUtilityPanels) {
        rejected.push({
          widgetId: m.id,
          reason: "utility capacity",
          code: DIAGNOSTIC_CODES.CAPACITY,
        });
        overflowStrategy = "overflow-menu";
        continue;
      }
    }

    const finalMeta = PANEL_MODE_META[mode];
    if (finalMeta.isTransient) {
      if (transientUsed >= budget.maxConcurrentTransientPanels) {
        rejected.push({
          widgetId: m.id,
          reason: "transient capacity",
          code: DIAGNOSTIC_CODES.CAPACITY,
        });
        continue;
      }
    }

    if (!m.allowedPanelModes.includes(mode)) {
      rejected.push({
        widgetId: m.id,
        reason: `forbidden mode ${mode}`,
        code: DIAGNOSTIC_CODES.FORBIDDEN_MODE,
      });
      continue;
    }

    place(m, region, mode, candidate.source);

    if (finalMeta.takesStructuralSpace && (mode === "rail" || mode === "split")) {
      persistentUsed += 1;
    }
    if (region === "utility") utilityUsed += 1;
    if (finalMeta.isTransient) transientUsed += 1;
  }

  // AWI-021: COMPACT must not have two persistent rails
  if (profile === "COMPACT") {
    const rails = panels.filter(
      (p) =>
        (p.mode === "rail" || p.mode === "split") && p.takesStructuralSpace,
    );
    if (rails.length > 0) {
      // Should not happen due to chooseMode; hard-strip if any slipped
      throw new HardContractViolation(
        "AW.HARD.COMPACT_RAILS",
        "COMPACT plan must not include persistent rails",
      );
    }
  }

  const stagePanels = panels.filter((p) => p.mode === "stage");
  if (stagePanels.length !== 1) {
    throw new HardContractViolation(
      "AW.HARD.STAGE_COUNT",
      `Expected exactly one stage panel, found ${stagePanels.length}`,
    );
  }

  const reduced =
    input.capabilities.reducedMotion || Boolean(input.accessibility.forceReducedMotion);
  const transitionIntent: TransitionIntent = reduced ? "none" : "relocate";
  if (reduced) diagnosticCodes.push(DIAGNOSTIC_CODES.REDUCED_MOTION);

  const primaryPlacement = placements.find((p) => p.widgetId === primary.id)!;
  const focusIntent: FocusIntent = {
    targetSlotId: primaryPlacement.slotId,
    targetWidgetId: primary.id,
    trap: false,
    recovery: "preserve",
  };

  // Modal focus trap if any
  const modal = panels.find((p) => p.mode === "modal");
  if (modal) {
    focusIntent.trap = true;
    focusIntent.targetWidgetId = modal.widgetId;
    focusIntent.targetSlotId = modal.slotId;
    focusIntent.returnTo = primaryPlacement.slotId;
  }

  const renderActivation = input.compatibility.mode === "on";
  if (input.compatibility.mode === "shadow") {
    diagnosticCodes.push(DIAGNOSTIC_CODES.COMPAT_SHADOW);
  }

  const regions: RegionPlan[] = [...regionsMap.entries()]
    .map(([id, slotIds]) => ({ id, slotIds: slotIds.slice().sort() }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const diagnostics: DecisionTrace = {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    profile,
    availableSpaceSummary: {
      widthPx: input.availableSpace.widthPx,
      heightPx: input.availableSpace.heightPx,
      stabilityToken: input.availableSpace.stabilityToken,
    },
    primaryWidgetId: primary.id,
    precedence: RESOLVE_PRECEDENCE,
    placed: placedTrace.slice().sort((a, b) => a.widgetId.localeCompare(b.widgetId)),
    rejected: rejected.slice().sort((a, b) => a.widgetId.localeCompare(b.widgetId)),
    fallbacks: fallbacks.slice().sort((a, b) => a.widgetId.localeCompare(b.widgetId)),
    preferenceWarnings: preferenceWarnings.slice().sort(),
    incompatibilities: incompatibilities.slice().sort(),
    compatibilityMode: input.compatibility.mode,
    transitionIntent,
    focusIntent,
    diagnosticCodes: [...new Set(diagnosticCodes)].sort(),
    warnings: preferenceWarnings.slice().sort(),
  };

  const plan: WorkspaceLayoutPlan = {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    surfaceId: input.surfaceId,
    profile,
    renderActivation,
    regions,
    slots: slots.slice().sort((a, b) => a.id.localeCompare(b.id)),
    panels: panels.slice().sort((a, b) => a.id.localeCompare(b.id)),
    placements: placements.slice().sort((a, b) => a.id.localeCompare(b.id)),
    primaryWidgetId: primary.id,
    overflowStrategy,
    focusIntent,
    transitionIntent,
    lifecycleIntents: lifecycleIntents
      .slice()
      .sort((a, b) => a.widgetId.localeCompare(b.widgetId)),
    diagnostics,
    navigationIntent: { landmarks: ["navigation", "primary-stage"] },
  };

  return deepFreeze(canonicalizeLayoutPlan(plan));
}
