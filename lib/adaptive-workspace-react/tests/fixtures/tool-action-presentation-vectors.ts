/**
 * WX Phase 1B.5.5 — Independently authored Tool & Action Presentation fixtures.
 *
 * Expectations are explicit constants — NOT derived by importing or mirroring
 * the production resolver algorithm.
 *
 * Presentation states: persistent | reachable | absent | suppressed | reserved | future-persistent
 *
 * Authority: WX Phase 1B.5 Master Spec §1B.5.5 (planning only; static chrome freeze).
 */

import type { ToolActionPresentationState } from "../../resolve-tool-action-presentation";
import type { WorkspaceModeId, WorkspacePosture } from "../../resolve-workspace-mode";

export type ToolActionId =
  | "tool"
  | "action-create"
  | "action-search"
  | "action-filters";

export const TOOL_ACTION_IDS: readonly ToolActionId[] = [
  "tool",
  "action-create",
  "action-search",
  "action-filters",
] as const;

export type ToolActionPresentationVector = {
  id: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  expect: Record<ToolActionId, ToolActionPresentationState>;
};

/** Mode × posture × width tool persistence matrix (explicit). */
export const TOOL_ACTION_PRESENTATION_VECTORS: readonly ToolActionPresentationVector[] =
  [
    {
      id: "browse-portrait-390",
      mode: "browse",
      posture: "portrait",
      usableWidthPx: 390,
      usableHeightPx: 844,
      landscapeCarveOut: false,
      expect: {
        tool: "reachable",
        "action-create": "reachable",
        "action-search": "reachable",
        "action-filters": "reachable",
      },
    },
    {
      id: "hybrid-landscape-844",
      mode: "hybrid-workspace",
      posture: "landscape",
      usableWidthPx: 844,
      usableHeightPx: 390,
      landscapeCarveOut: false,
      expect: {
        tool: "reachable",
        "action-create": "reachable",
        "action-search": "reachable",
        "action-filters": "reachable",
      },
    },
    {
      id: "full-landscape-1280",
      mode: "full-workspace",
      posture: "landscape",
      usableWidthPx: 1280,
      usableHeightPx: 800,
      landscapeCarveOut: false,
      expect: {
        tool: "reachable",
        "action-create": "reachable",
        "action-search": "reachable",
        "action-filters": "reachable",
      },
    },
    {
      id: "professional-contention-1440",
      mode: "professional-workspace",
      posture: "landscape",
      usableWidthPx: 1440,
      usableHeightPx: 900,
      landscapeCarveOut: false,
      expect: {
        // Presentation aspirational persistent, demoted Reachable under width < 1600.
        tool: "reachable",
        "action-create": "reachable",
        "action-search": "reachable",
        "action-filters": "reachable",
      },
    },
    {
      id: "professional-persistent-1600",
      mode: "professional-workspace",
      posture: "landscape",
      usableWidthPx: 1600,
      usableHeightPx: 900,
      landscapeCarveOut: false,
      expect: {
        tool: "persistent",
        "action-create": "persistent",
        "action-search": "persistent",
        "action-filters": "persistent",
      },
    },
    {
      id: "professional-persistent-1920",
      mode: "professional-workspace",
      posture: "landscape",
      usableWidthPx: 1920,
      usableHeightPx: 1080,
      landscapeCarveOut: false,
      expect: {
        tool: "persistent",
        "action-create": "persistent",
        "action-search": "persistent",
        "action-filters": "persistent",
      },
    },
    {
      id: "compact-portrait-700",
      mode: "compact-workspace",
      posture: "portrait",
      usableWidthPx: 700,
      usableHeightPx: 900,
      landscapeCarveOut: false,
      expect: {
        tool: "reachable",
        "action-create": "reachable",
        "action-search": "reachable",
        "action-filters": "reachable",
      },
    },
  ];
