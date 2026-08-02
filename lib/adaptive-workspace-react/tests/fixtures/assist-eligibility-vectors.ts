/**
 * WX Phase 1B.5.3 — Independently authored Assist Surface Eligibility fixtures.
 *
 * Expectations are explicit constants — NOT derived by importing or mirroring
 * the production resolver algorithm.
 *
 * Eligibility states: eligible | ineligible | suppressed | reserved | future-eligible
 * Capacity-allowed assists are "eligible" with renderAuthorized false (hollow ban).
 * Secondary under Mode forbids but higher Mode unlocks = "future-eligible".
 *
 * Authority: WX Phase 1B.5 Master Spec §1B.5.3 + dual-assist §7.4.
 */

import type { AssistEligibilityState } from "../../resolve-assist-eligibility";
import type { WorkspaceModeId, WorkspacePosture } from "../../resolve-workspace-mode";

export type AssistSurfaceId = "assist-primary" | "assist-secondary";

export const ASSIST_IDS: readonly AssistSurfaceId[] = [
  "assist-primary",
  "assist-secondary",
] as const;

export type AssistEligibilityVector = {
  id: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  panels: "available" | "unavailable";
  expect: Record<AssistSurfaceId, AssistEligibilityState>;
};

/** Mode × posture assist eligibility matrix (explicit). */
export const ASSIST_ELIGIBILITY_VECTORS: readonly AssistEligibilityVector[] = [
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
      "assist-primary": "eligible",
      "assist-secondary": "future-eligible",
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
      "assist-primary": "eligible",
      "assist-secondary": "future-eligible",
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
      "assist-primary": "eligible",
      "assist-secondary": "eligible",
    },
  },
  {
    id: "professional-1920",
    mode: "professional-workspace",
    posture: "landscape",
    usableWidthPx: 1920,
    usableHeightPx: 1080,
    landscapeCarveOut: false,
    panels: "available",
    expect: {
      "assist-primary": "eligible",
      "assist-secondary": "eligible",
    },
  },
  {
    id: "hybrid-panels-unavailable-844",
    mode: "hybrid-workspace",
    posture: "landscape",
    usableWidthPx: 844,
    usableHeightPx: 390,
    landscapeCarveOut: false,
    panels: "unavailable",
    expect: {
      "assist-primary": "suppressed",
      "assist-secondary": "suppressed",
    },
  },
];
