import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  WORKSPACE_DOMAIN_DENYLIST,
  type AvailableSpace,
  type CapabilitySignals,
  type EnvironmentSignals,
  type ResolveInput,
  type WorkspacePreferences,
} from "../types/workspace";
import { ValidationError } from "./validation-error";
import { validateWidgetManifestSet } from "./validate-widget-manifest";

function assertFiniteNonNeg(name: string, n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    throw new ValidationError(
      "AW.VALIDATE.NUMBER",
      `${name} must be a finite number >= 0`,
      { value: n },
    );
  }
  return n;
}

function assertPositiveUsable(name: string, n: unknown): number {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    throw new ValidationError(
      "AW.VALIDATE.NUMBER",
      `${name} must be a finite number >= 0`,
      { value: n },
    );
  }
  return n;
}

function rejectDomainKeys(obj: unknown, path: string): void {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj as object)) {
    if ((WORKSPACE_DOMAIN_DENYLIST as readonly string[]).includes(key)) {
      throw new ValidationError(
        "AW.HARD.DOMAIN_FIELD_FORBIDDEN",
        `Forbidden domain field "${key}" at ${path}`,
        { key, path },
      );
    }
  }
}

function validateAvailableSpace(space: AvailableSpace): AvailableSpace {
  rejectDomainKeys(space, "availableSpace");
  const widthPx = assertPositiveUsable("availableSpace.widthPx", space.widthPx);
  const heightPx = assertPositiveUsable(
    "availableSpace.heightPx",
    space.heightPx,
  );
  const safeArea = {
    top: assertFiniteNonNeg("safeArea.top", space.safeArea?.top),
    right: assertFiniteNonNeg("safeArea.right", space.safeArea?.right),
    bottom: assertFiniteNonNeg("safeArea.bottom", space.safeArea?.bottom),
    left: assertFiniteNonNeg("safeArea.left", space.safeArea?.left),
  };
  const chromeOccupied = {
    top: assertFiniteNonNeg("chromeOccupied.top", space.chromeOccupied?.top),
    bottom: assertFiniteNonNeg(
      "chromeOccupied.bottom",
      space.chromeOccupied?.bottom,
    ),
    start: assertFiniteNonNeg(
      "chromeOccupied.start",
      space.chromeOccupied?.start,
    ),
    end: assertFiniteNonNeg("chromeOccupied.end", space.chromeOccupied?.end),
  };
  const occlusions = Array.isArray(space.occlusions) ? space.occlusions : [];
  for (const o of occlusions) {
    if (!o || (o.kind !== "keyboard" && o.kind !== "hinge" && o.kind !== "system")) {
      throw new ValidationError(
        "AW.VALIDATE.OCCLUSION",
        "Unknown occlusion kind",
        { occlusion: o },
      );
    }
    assertFiniteNonNeg("occlusion.widthPx", o.widthPx);
    assertFiniteNonNeg("occlusion.heightPx", o.heightPx);
  }
  const stabilityToken =
    typeof space.stabilityToken === "string" ? space.stabilityToken.trim() : "";
  if (!stabilityToken) {
    throw new ValidationError(
      "AW.VALIDATE.STABILITY_TOKEN",
      "stabilityToken must be a non-empty string",
    );
  }
  return {
    widthPx,
    heightPx,
    safeArea,
    chromeOccupied,
    occlusions: occlusions.map((o) => ({
      kind: o.kind,
      widthPx: o.widthPx,
      heightPx: o.heightPx,
    })),
    stabilityToken,
  };
}

function validatePreferences(
  prefs: WorkspacePreferences | undefined,
): { preferences: WorkspacePreferences; warnings: string[] } {
  const warnings: string[] = [];
  if (!prefs || typeof prefs !== "object") {
    return {
      preferences: {
        schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
        version: 1,
        pins: [],
      },
      warnings: ["preferences missing; defaults applied"],
    };
  }
  rejectDomainKeys(prefs, "preferences");
  let version = typeof prefs.version === "number" ? prefs.version : 1;
  if (version !== 1) {
    warnings.push(`unsupported preferences.version=${version}; defaults applied`);
    version = 1;
  }
  const pins = Array.isArray(prefs.pins)
    ? prefs.pins.filter((p) => typeof p === "string")
    : [];
  return {
    preferences: {
      schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
      version,
      pins,
      density: prefs.density,
      filtersDefaultOpen: prefs.filtersDefaultOpen,
    },
    warnings,
  };
}

function defaultCapabilities(
  c: Partial<CapabilitySignals> | undefined,
): CapabilitySignals {
  return {
    pointerFine: Boolean(c?.pointerFine),
    hover: Boolean(c?.hover),
    touch: Boolean(c?.touch),
    reducedMotion: Boolean(c?.reducedMotion),
  };
}

function defaultEnvironment(
  e: Partial<EnvironmentSignals> | undefined,
): EnvironmentSignals {
  const shell = e?.shell === "pwa" || e?.shell === "native" ? e.shell : "web";
  const localeDir = e?.localeDir === "rtl" ? "rtl" : "ltr";
  return { shell, localeDir };
}

/**
 * Validates and normalizes ResolveInput without mutating the caller's object.
 */
export function validateResolveInput(raw: unknown): {
  input: ResolveInput;
  preferenceWarnings: string[];
} {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError("AW.VALIDATE.INPUT", "ResolveInput must be an object");
  }
  const r = raw as Record<string, unknown>;
  rejectDomainKeys(r, "ResolveInput");

  const schemaVersion = r.schemaVersion ?? ADAPTIVE_WORKSPACE_SCHEMA_VERSION;
  if (schemaVersion !== ADAPTIVE_WORKSPACE_SCHEMA_VERSION) {
    throw new ValidationError(
      "AW.HARD.UNSUPPORTED_SCHEMA",
      `Unsupported ResolveInput.schemaVersion=${String(schemaVersion)}`,
      { schemaVersion },
    );
  }

  if (typeof r.surfaceId !== "string" || !r.surfaceId.trim()) {
    throw new ValidationError("AW.VALIDATE.SURFACE", "surfaceId is required");
  }
  if (typeof r.primaryTask !== "string" || !r.primaryTask.trim()) {
    throw new ValidationError("AW.VALIDATE.TASK", "primaryTask is required");
  }

  const mode = (r.compatibility as { mode?: string } | undefined)?.mode;
  if (mode !== "off" && mode !== "shadow" && mode !== "on") {
    throw new ValidationError(
      "AW.VALIDATE.COMPAT",
      "compatibility.mode must be off|shadow|on",
    );
  }

  const availableSpace = validateAvailableSpace(
    (r.availableSpace ?? {}) as AvailableSpace,
  );

  const manifestsRaw = Array.isArray(r.manifests) ? r.manifests : [];
  const manifests = validateWidgetManifestSet(manifestsRaw);

  const panelRequests: ResolveInput["panelRequests"] = Array.isArray(
    r.panelRequests,
  )
    ? r.panelRequests
        .filter((p) => p && typeof p === "object")
        .map((p) => {
          const pr = p as Record<string, unknown>;
          if (typeof pr.widgetId !== "string" || !pr.widgetId) {
            throw new ValidationError(
              "AW.VALIDATE.PANEL_REQUEST",
              "panelRequest.widgetId required",
            );
          }
          if (pr.intent !== "open" && pr.intent !== "pin" && pr.intent !== "close") {
            throw new ValidationError(
              "AW.VALIDATE.PANEL_REQUEST",
              "panelRequest.intent must be open|pin|close",
            );
          }
          const intent = pr.intent as "open" | "pin" | "close";
          return {
            widgetId: pr.widgetId,
            intent,
            preferredMode: pr.preferredMode as ResolveInput["panelRequests"][number]["preferredMode"],
          };
        })
    : [];

  const { preferences, warnings } = validatePreferences(
    r.preferences as WorkspacePreferences | undefined,
  );

  const accessibility =
    r.accessibility && typeof r.accessibility === "object"
      ? {
          forceReducedMotion: Boolean(
            (r.accessibility as { forceReducedMotion?: boolean }).forceReducedMotion,
          ),
        }
      : {};

  const input: ResolveInput = {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    availableSpace,
    capabilities: defaultCapabilities(r.capabilities as CapabilitySignals),
    environment: defaultEnvironment(r.environment as EnvironmentSignals),
    surfaceId: r.surfaceId.trim(),
    primaryTask: r.primaryTask.trim(),
    manifests,
    panelRequests,
    preferences,
    accessibility,
    compatibility: { mode },
  };

  return { input, preferenceWarnings: warnings };
}

export function validateWorkspacePreferences(
  raw: unknown,
): WorkspacePreferences {
  const { preferences } = validatePreferences(raw as WorkspacePreferences);
  return preferences;
}
