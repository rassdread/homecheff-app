import type { WorkspaceLayoutPlan } from "../types/workspace";

/** Stable JSON-safe canonicalization (sorted keys via structured clone + sort fields). */
export function canonicalizeLayoutPlan(
  plan: WorkspaceLayoutPlan,
): WorkspaceLayoutPlan {
  return {
    schemaVersion: plan.schemaVersion,
    surfaceId: plan.surfaceId,
    profile: plan.profile,
    renderActivation: plan.renderActivation,
    regions: plan.regions
      .map((r) => ({ id: r.id, slotIds: [...r.slotIds].sort() }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    slots: [...plan.slots].sort((a, b) => a.id.localeCompare(b.id)),
    panels: [...plan.panels].sort((a, b) => a.id.localeCompare(b.id)),
    placements: [...plan.placements].sort((a, b) => a.id.localeCompare(b.id)),
    primaryWidgetId: plan.primaryWidgetId,
    overflowStrategy: plan.overflowStrategy,
    focusIntent: { ...plan.focusIntent },
    transitionIntent: plan.transitionIntent,
    lifecycleIntents: [...plan.lifecycleIntents].sort((a, b) =>
      a.widgetId.localeCompare(b.widgetId),
    ),
    diagnostics: {
      ...plan.diagnostics,
      placed: [...plan.diagnostics.placed].sort((a, b) =>
        a.widgetId.localeCompare(b.widgetId),
      ),
      rejected: [...plan.diagnostics.rejected].sort((a, b) =>
        a.widgetId.localeCompare(b.widgetId),
      ),
      fallbacks: [...plan.diagnostics.fallbacks].sort((a, b) =>
        a.widgetId.localeCompare(b.widgetId),
      ),
      preferenceWarnings: [...plan.diagnostics.preferenceWarnings].sort(),
      incompatibilities: [...plan.diagnostics.incompatibilities].sort(),
      diagnosticCodes: [...plan.diagnostics.diagnosticCodes].sort(),
      warnings: [...plan.diagnostics.warnings].sort(),
    },
    navigationIntent: {
      landmarks: [...plan.navigationIntent.landmarks].sort(),
    },
  };
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) {
      out[key] = sortKeys((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}
