/**
 * WX Phase 1B.3 — Independently authored capability activation fixtures.
 *
 * Explicit expected states only. Must NOT import or call the capability resolver.
 * Must NOT reimplement Mode thresholds.
 */

export type CapabilityStateFixture = "available" | "unavailable" | "reserved";

export type CapabilityVectorFixture = {
  id: string;
  mode:
    | "browse"
    | "compact-workspace"
    | "hybrid-workspace"
    | "full-workspace"
    | "professional-workspace";
  posture: "portrait" | "landscape";
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  expected: Record<string, CapabilityStateFixture>;
};

/** Explicit Mode × capability expectations (WMS 1.1 mapped to A/U/R). */
export const CAPABILITY_ACTIVATION_VECTORS: readonly CapabilityVectorFixture[] =
  [
    {
      id: "browse-portrait",
      mode: "browse",
      posture: "portrait",
      usableWidthPx: 390,
      usableHeightPx: 844,
      landscapeCarveOut: false,
      expected: {
        navigation: "available",
        discovery: "available",
        search: "available",
        filters: "available",
        panels: "unavailable",
        "workspace-density": "available",
        inspector: "unavailable",
        selection: "unavailable",
        "workspace-memory": "reserved",
        "contextual-assistance": "reserved",
        "professional-workspace": "reserved",
        "ai-collaboration": "reserved",
        extensions: "reserved",
      },
    },
    {
      id: "compact-landscape-carve",
      mode: "compact-workspace",
      posture: "landscape",
      usableWidthPx: 700,
      usableHeightPx: 360,
      landscapeCarveOut: true,
      expected: {
        navigation: "available",
        discovery: "available",
        search: "available",
        filters: "available",
        panels: "available",
        "workspace-density": "available",
        inspector: "unavailable",
        selection: "available",
        "workspace-memory": "reserved",
        "contextual-assistance": "reserved",
        "professional-workspace": "reserved",
        "ai-collaboration": "reserved",
        extensions: "reserved",
      },
    },
    {
      id: "compact-no-carve",
      mode: "compact-workspace",
      posture: "landscape",
      usableWidthPx: 650,
      usableHeightPx: 360,
      landscapeCarveOut: false,
      expected: {
        navigation: "available",
        discovery: "available",
        search: "available",
        filters: "available",
        panels: "unavailable",
        "workspace-density": "available",
        inspector: "unavailable",
        selection: "available",
        "workspace-memory": "reserved",
        "contextual-assistance": "reserved",
        "professional-workspace": "reserved",
        "ai-collaboration": "reserved",
        extensions: "reserved",
      },
    },
    {
      id: "hybrid-portrait",
      mode: "hybrid-workspace",
      posture: "portrait",
      usableWidthPx: 800,
      usableHeightPx: 1024,
      landscapeCarveOut: false,
      expected: {
        navigation: "available",
        discovery: "available",
        search: "available",
        filters: "available",
        panels: "available",
        "workspace-density": "available",
        inspector: "available",
        selection: "available",
        "workspace-memory": "reserved",
        "contextual-assistance": "reserved",
        "professional-workspace": "reserved",
        "ai-collaboration": "reserved",
        extensions: "reserved",
      },
    },
    {
      id: "full-landscape",
      mode: "full-workspace",
      posture: "landscape",
      usableWidthPx: 1280,
      usableHeightPx: 800,
      landscapeCarveOut: false,
      expected: {
        navigation: "available",
        discovery: "available",
        search: "available",
        filters: "available",
        panels: "available",
        "workspace-density": "available",
        inspector: "available",
        selection: "available",
        "workspace-memory": "reserved",
        "contextual-assistance": "reserved",
        "professional-workspace": "reserved",
        "ai-collaboration": "reserved",
        extensions: "reserved",
      },
    },
    {
      id: "professional-landscape",
      mode: "professional-workspace",
      posture: "landscape",
      usableWidthPx: 1920,
      usableHeightPx: 1080,
      landscapeCarveOut: false,
      expected: {
        navigation: "available",
        discovery: "available",
        search: "available",
        filters: "available",
        panels: "available",
        "workspace-density": "available",
        inspector: "available",
        selection: "available",
        "workspace-memory": "reserved",
        "contextual-assistance": "reserved",
        "professional-workspace": "reserved",
        "ai-collaboration": "reserved",
        extensions: "reserved",
      },
    },
  ] as const;

export const CAPABILITY_RESERVED_IDS = [
  "workspace-memory",
  "contextual-assistance",
  "professional-workspace",
  "ai-collaboration",
  "extensions",
] as const;
