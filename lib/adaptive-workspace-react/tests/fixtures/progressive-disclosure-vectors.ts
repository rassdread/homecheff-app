/**
 * WX Phase 1B.5.4 — Independently authored Progressive Disclosure fixtures.
 *
 * Expectations are explicit constants — NOT derived by importing or mirroring
 * the production resolver algorithm.
 *
 * Disclosure states: hidden | discoverable | disclosed | suppressed | reserved | future-disclosure
 *
 * Authority: WX Phase 1B.5 Master Spec §1B.5.4 (planning only; no disclosure UI).
 */

import type { ProgressiveDisclosureState } from "../../resolve-progressive-disclosure";
import type { WorkspaceModeId, WorkspacePosture } from "../../resolve-workspace-mode";

export type ProgressiveSurfaceId =
  | "assist-primary"
  | "assist-secondary"
  | "tool"
  | "disclosure"
  | "utility";

export const PROGRESSIVE_IDS: readonly ProgressiveSurfaceId[] = [
  "assist-primary",
  "assist-secondary",
  "tool",
  "disclosure",
  "utility",
] as const;

export type ProgressiveDisclosureVector = {
  id: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  panels: "available" | "unavailable";
  expect: Record<ProgressiveSurfaceId, ProgressiveDisclosureState>;
};

/** Mode × posture progressive disclosure matrix (explicit). */
export const PROGRESSIVE_DISCLOSURE_VECTORS: readonly ProgressiveDisclosureVector[] =
  [
    {
      id: "browse-portrait-390",
      mode: "browse",
      posture: "portrait",
      usableWidthPx: 390,
      usableHeightPx: 844,
      landscapeCarveOut: false,
      panels: "unavailable",
      expect: {
        "assist-primary": "suppressed",
        "assist-secondary": "suppressed",
        tool: "disclosed",
        disclosure: "discoverable",
        utility: "future-disclosure",
      },
    },
    {
      id: "compact-portrait-no-carve",
      mode: "compact-workspace",
      posture: "portrait",
      usableWidthPx: 700,
      usableHeightPx: 900,
      landscapeCarveOut: false,
      panels: "unavailable",
      expect: {
        "assist-primary": "suppressed",
        "assist-secondary": "suppressed",
        tool: "disclosed",
        disclosure: "discoverable",
        utility: "future-disclosure",
      },
    },
    {
      id: "compact-landscape-carve-700",
      mode: "compact-workspace",
      posture: "landscape",
      usableWidthPx: 700,
      usableHeightPx: 320,
      landscapeCarveOut: true,
      panels: "available",
      expect: {
        "assist-primary": "hidden",
        "assist-secondary": "future-disclosure",
        tool: "disclosed",
        disclosure: "discoverable",
        utility: "future-disclosure",
      },
    },
    {
      id: "hybrid-landscape-844",
      mode: "hybrid-workspace",
      posture: "landscape",
      usableWidthPx: 844,
      usableHeightPx: 390,
      landscapeCarveOut: false,
      panels: "available",
      expect: {
        "assist-primary": "hidden",
        "assist-secondary": "future-disclosure",
        tool: "disclosed",
        disclosure: "discoverable",
        utility: "future-disclosure",
      },
    },
    {
      id: "full-landscape-1280",
      mode: "full-workspace",
      posture: "landscape",
      usableWidthPx: 1280,
      usableHeightPx: 800,
      landscapeCarveOut: false,
      panels: "available",
      expect: {
        "assist-primary": "hidden",
        "assist-secondary": "hidden",
        tool: "disclosed",
        disclosure: "discoverable",
        utility: "future-disclosure",
      },
    },
    {
      id: "professional-landscape-1920",
      mode: "professional-workspace",
      posture: "landscape",
      usableWidthPx: 1920,
      usableHeightPx: 1080,
      landscapeCarveOut: false,
      panels: "available",
      expect: {
        "assist-primary": "hidden",
        "assist-secondary": "hidden",
        tool: "hidden",
        disclosure: "discoverable",
        utility: "future-disclosure",
      },
    },
    {
      id: "hybrid-panels-unavailable",
      mode: "hybrid-workspace",
      posture: "landscape",
      usableWidthPx: 844,
      usableHeightPx: 390,
      landscapeCarveOut: false,
      panels: "unavailable",
      expect: {
        "assist-primary": "suppressed",
        "assist-secondary": "suppressed",
        tool: "disclosed",
        disclosure: "discoverable",
        utility: "future-disclosure",
      },
    },
  ];
