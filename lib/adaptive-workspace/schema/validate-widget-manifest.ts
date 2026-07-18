import {
  ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
  type PanelMode,
  type RegionId,
  type WidgetManifest,
} from "../types/workspace";
import { HardContractViolation, ValidationError } from "./validation-error";

const REGION_IDS = new Set<RegionId>([
  "navigation",
  "primary-stage",
  "supporting-start",
  "supporting-end",
  "utility",
  "transient-overlay",
  "global-modal",
  "floating-action",
]);

const PANEL_MODES = new Set<PanelMode>([
  "stage",
  "rail",
  "split",
  "drawer",
  "sheet",
  "overlay",
  "floating",
  "modal",
]);

function asManifest(raw: unknown, index: number): WidgetManifest {
  if (!raw || typeof raw !== "object") {
    throw new ValidationError(
      "AW.VALIDATE.MANIFEST",
      `manifest[${index}] must be an object`,
    );
  }
  const m = raw as Record<string, unknown>;
  const id = typeof m.id === "string" ? m.id.trim() : "";
  if (!id) {
    throw new ValidationError(
      "AW.VALIDATE.MANIFEST_ID",
      `manifest[${index}].id is required`,
    );
  }

  const schemaVersion = m.schemaVersion ?? ADAPTIVE_WORKSPACE_SCHEMA_VERSION;
  if (schemaVersion !== ADAPTIVE_WORKSPACE_SCHEMA_VERSION) {
    throw new ValidationError(
      "AW.HARD.UNSUPPORTED_SCHEMA",
      `Unsupported WidgetManifest.schemaVersion for ${id}`,
      { schemaVersion },
    );
  }

  const type = m.type === "sealed" ? "sealed" : "standard";
  const version = typeof m.version === "number" && Number.isFinite(m.version) ? m.version : 1;
  const supportedSurfaces = Array.isArray(m.supportedSurfaces)
    ? m.supportedSurfaces.filter((s) => typeof s === "string")
    : ["*"];

  const constraintsRaw = (m.constraints ?? {}) as Record<string, unknown>;
  const minWidth =
    typeof constraintsRaw.minWidth === "number" ? constraintsRaw.minWidth : 0;
  const minHeight =
    typeof constraintsRaw.minHeight === "number" ? constraintsRaw.minHeight : 0;
  const preferredWidth =
    typeof constraintsRaw.preferredWidth === "number"
      ? constraintsRaw.preferredWidth
      : undefined;
  const maxWidth =
    typeof constraintsRaw.maxWidth === "number"
      ? constraintsRaw.maxWidth
      : undefined;

  if (minWidth < 0 || minHeight < 0) {
    throw new ValidationError(
      "AW.VALIDATE.CONSTRAINTS",
      `manifest ${id} has negative constraints`,
    );
  }
  if (
    preferredWidth !== undefined &&
    (preferredWidth < minWidth ||
      (maxWidth !== undefined && preferredWidth > maxWidth))
  ) {
    throw new ValidationError(
      "AW.VALIDATE.CONSTRAINTS",
      `manifest ${id}: minWidth ≤ preferredWidth ≤ maxWidth required`,
    );
  }
  if (maxWidth !== undefined && maxWidth < minWidth) {
    throw new ValidationError(
      "AW.VALIDATE.CONSTRAINTS",
      `manifest ${id}: maxWidth < minWidth`,
    );
  }

  const allowedPanelModes = (
    Array.isArray(m.allowedPanelModes) ? m.allowedPanelModes : []
  ).filter((mode): mode is PanelMode => PANEL_MODES.has(mode as PanelMode));

  if (allowedPanelModes.length === 0) {
    throw new ValidationError(
      "AW.VALIDATE.MODES",
      `manifest ${id} requires at least one allowedPanelMode`,
    );
  }

  const canBePrimary = Boolean(m.canBePrimary);
  if (allowedPanelModes.includes("stage") && !canBePrimary) {
    throw new ValidationError(
      "AW.VALIDATE.PRIMARY",
      `manifest ${id}: stage mode requires canBePrimary`,
    );
  }

  const preferredRegion = m.preferredRegion as RegionId | undefined;
  if (preferredRegion !== undefined && !REGION_IDS.has(preferredRegion)) {
    throw new ValidationError(
      "AW.VALIDATE.REGION",
      `manifest ${id}: invalid preferredRegion`,
      { preferredRegion },
    );
  }

  const incompatibleWith = Array.isArray(m.incompatibleWith)
    ? m.incompatibleWith.filter((x) => typeof x === "string")
    : [];
  if (incompatibleWith.includes(id)) {
    throw new ValidationError(
      "AW.VALIDATE.INCOMPATIBLE",
      `manifest ${id} cannot be incompatible with itself`,
    );
  }

  const statePreservationKey =
    typeof m.statePreservationKey === "string" && m.statePreservationKey.trim()
      ? m.statePreservationKey.trim()
      : id;

  const priority =
    typeof m.priority === "number" && Number.isFinite(m.priority)
      ? m.priority
      : 0;

  return {
    schemaVersion: ADAPTIVE_WORKSPACE_SCHEMA_VERSION,
    id,
    type,
    version,
    supportedSurfaces: supportedSurfaces.length ? supportedSurfaces : ["*"],
    constraints: { minWidth, preferredWidth, maxWidth, minHeight },
    preferredRegion,
    allowedPanelModes,
    canBePrimary,
    canPersist: Boolean(m.canPersist),
    canFloat: Boolean(m.canFloat),
    canOverlay: Boolean(m.canOverlay),
    priority,
    collapseBehavior:
      (m.collapseBehavior as WidgetManifest["collapseBehavior"]) ?? "to-sheet",
    restoreBehavior:
      (m.restoreBehavior as WidgetManifest["restoreBehavior"]) ??
      "policy-default",
    focusBehavior:
      (m.focusBehavior as WidgetManifest["focusBehavior"]) ?? "preserve",
    ssrCapability: (m.ssrCapability as WidgetManifest["ssrCapability"]) ?? "shell",
    hydrationStrategy:
      (m.hydrationStrategy as WidgetManifest["hydrationStrategy"]) ?? "enhance",
    statePreservationKey,
    accessibilityLabel:
      typeof m.accessibilityLabel === "string" && m.accessibilityLabel
        ? m.accessibilityLabel
        : id,
    requiredCapabilities: Array.isArray(m.requiredCapabilities)
      ? (m.requiredCapabilities as WidgetManifest["requiredCapabilities"])
      : undefined,
    incompatibleWith,
  };
}

export function validateWidgetManifest(raw: unknown): WidgetManifest {
  return asManifest(raw, 0);
}

export function validateWidgetManifestSet(rawList: unknown[]): WidgetManifest[] {
  const manifests = rawList.map((item, i) => asManifest(item, i));
  const ids = new Set<string>();
  const keys = new Set<string>();
  let sealedCount = 0;

  for (const m of manifests) {
    if (ids.has(m.id)) {
      throw new HardContractViolation(
        "AW.HARD.DUPLICATE_MANIFEST_ID",
        `Duplicate manifest id: ${m.id}`,
      );
    }
    ids.add(m.id);
    if (keys.has(m.statePreservationKey)) {
      throw new HardContractViolation(
        "AW.HARD.DUPLICATE_PRESERVATION_KEY",
        `Duplicate statePreservationKey: ${m.statePreservationKey}`,
      );
    }
    keys.add(m.statePreservationKey);
    if (m.type === "sealed") {
      sealedCount += 1;
      if (sealedCount > 1) {
        throw new HardContractViolation(
          "AW.HARD.DUPLICATE_SEALED",
          "At most one sealed widget may be registered in a ResolveInput",
        );
      }
    }
  }

  return manifests.slice().sort((a, b) => a.id.localeCompare(b.id));
}
