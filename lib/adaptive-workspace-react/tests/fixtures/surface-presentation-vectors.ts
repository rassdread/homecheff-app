/**
 * WX Phase 1B.5.2 — Independently authored presentation-plan fixtures.
 *
 * Expectations are explicit constants — NOT derived by importing or mirroring
 * the production resolver algorithm.
 *
 * Authority: WX Phase 1B.5 Master Spec §7 + dual-assist §7.4 + contention §7.3.
 */

import type { WorkspaceModeId, WorkspacePosture } from "../../resolve-workspace-mode";
import type { SurfacePresentationState } from "../../resolve-surface-presentation";
import type { WorkspaceSurfaceId } from "../../workspace-surface-registry";

export type SurfacePresentationVector = {
  id: string;
  /** Explicit Mode (not derived). */
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  heightDemoted?: boolean;
  /** Explicit panels capability state. */
  panels: "available" | "unavailable" | "reserved";
  /** Expected max assist persistent slots. */
  maxAssistPersistent: number;
  /** Expected presentationState per surface (all 12). */
  states: Record<WorkspaceSurfaceId, SurfacePresentationState>;
  /** Expected eligible IDs (persistent|compacted), priority order. */
  eligibleOrdered: readonly WorkspaceSurfaceId[];
};

/** Priority order of all sealed surfaces (rank, then registry index). */
export const EXPECTED_PRIORITY_ORDER: readonly WorkspaceSurfaceId[] = [
  "stage", // 1
  "orientation", // 2 (index before command)
  "command", // 2
  "disclosure", // 3
  "assist-primary", // 4
  "assist-secondary", // 5
  "tool", // 6
  "utility", // 8
  "reserved-memory", // 100
  "reserved-ai", // 101
  "reserved-collaboration", // 102
  "reserved-extensions", // 103
] as const;

export const RESERVED_SURFACE_IDS: readonly WorkspaceSurfaceId[] = [
  "reserved-memory",
  "reserved-ai",
  "reserved-collaboration",
  "reserved-extensions",
] as const;

const reservedBlocked = {
  "reserved-memory": "reserved-blocked",
  "reserved-ai": "reserved-blocked",
  "reserved-collaboration": "reserved-blocked",
  "reserved-extensions": "reserved-blocked",
} as const satisfies Record<string, SurfacePresentationState>;

/** Progressive growth + Mode × posture matrix (explicit). */
export const SURFACE_PRESENTATION_VECTORS: readonly SurfacePresentationVector[] =
  [
    {
      id: "browse-portrait-320",
      mode: "browse",
      posture: "portrait",
      usableWidthPx: 320,
      usableHeightPx: 568,
      landscapeCarveOut: false,
      panels: "unavailable",
      maxAssistPersistent: 0,
      states: {
        stage: "persistent",
        orientation: "persistent",
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "absent",
        "assist-secondary": "absent",
        tool: "reachable",
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: ["stage", "orientation", "command"],
    },
    {
      id: "browse-portrait-390",
      mode: "browse",
      posture: "portrait",
      usableWidthPx: 390,
      usableHeightPx: 844,
      landscapeCarveOut: false,
      panels: "unavailable",
      maxAssistPersistent: 0,
      states: {
        stage: "persistent",
        orientation: "persistent",
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "absent",
        "assist-secondary": "absent",
        tool: "reachable",
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: ["stage", "orientation", "command"],
    },
    {
      id: "compact-landscape-carve-700",
      mode: "compact-workspace",
      posture: "landscape",
      usableWidthPx: 700,
      usableHeightPx: 320,
      landscapeCarveOut: true,
      panels: "available",
      maxAssistPersistent: 1,
      states: {
        stage: "persistent",
        orientation: "compacted", // short landscape height
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "persistent",
        "assist-secondary": "absent",
        tool: "reachable",
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: ["stage", "orientation", "command", "assist-primary"],
    },
    {
      id: "compact-portrait-no-carve",
      mode: "compact-workspace",
      posture: "portrait",
      usableWidthPx: 700,
      usableHeightPx: 900,
      landscapeCarveOut: false,
      panels: "unavailable",
      maxAssistPersistent: 0,
      states: {
        stage: "persistent",
        orientation: "persistent",
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "absent",
        "assist-secondary": "absent",
        tool: "reachable",
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: ["stage", "orientation", "command"],
    },
    {
      id: "hybrid-landscape-844",
      mode: "hybrid-workspace",
      posture: "landscape",
      usableWidthPx: 844,
      usableHeightPx: 390,
      landscapeCarveOut: false,
      panels: "available",
      maxAssistPersistent: 1,
      states: {
        stage: "persistent",
        orientation: "compacted",
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "persistent",
        "assist-secondary": "absent",
        tool: "reachable",
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: ["stage", "orientation", "command", "assist-primary"],
    },
    {
      id: "hybrid-portrait-768",
      mode: "hybrid-workspace",
      posture: "portrait",
      usableWidthPx: 768,
      usableHeightPx: 1024,
      landscapeCarveOut: false,
      panels: "available",
      maxAssistPersistent: 1,
      states: {
        stage: "persistent",
        orientation: "persistent",
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "persistent",
        "assist-secondary": "absent",
        tool: "reachable",
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: ["stage", "orientation", "command", "assist-primary"],
    },
    {
      id: "full-landscape-1280",
      mode: "full-workspace",
      posture: "landscape",
      usableWidthPx: 1280,
      usableHeightPx: 800,
      landscapeCarveOut: false,
      panels: "available",
      maxAssistPersistent: 2,
      states: {
        stage: "persistent",
        orientation: "persistent",
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "persistent",
        "assist-secondary": "persistent",
        tool: "reachable",
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: [
        "stage",
        "orientation",
        "command",
        "assist-primary",
        "assist-secondary",
      ],
    },
    {
      id: "professional-1440-tool-contention",
      mode: "professional-workspace",
      posture: "landscape",
      usableWidthPx: 1440,
      usableHeightPx: 900,
      landscapeCarveOut: false,
      panels: "available",
      maxAssistPersistent: 2,
      states: {
        stage: "persistent",
        orientation: "persistent",
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "persistent",
        "assist-secondary": "persistent",
        tool: "reachable", // contention demote < 1600
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: [
        "stage",
        "orientation",
        "command",
        "assist-primary",
        "assist-secondary",
      ],
    },
    {
      id: "professional-1920-tool-persistent",
      mode: "professional-workspace",
      posture: "landscape",
      usableWidthPx: 1920,
      usableHeightPx: 1080,
      landscapeCarveOut: false,
      panels: "available",
      maxAssistPersistent: 2,
      states: {
        stage: "persistent",
        orientation: "persistent",
        command: "persistent",
        disclosure: "reachable",
        "assist-primary": "persistent",
        "assist-secondary": "persistent",
        tool: "persistent",
        utility: "absent",
        ...reservedBlocked,
      },
      eligibleOrdered: [
        "stage",
        "orientation",
        "command",
        "assist-primary",
        "assist-secondary",
        "tool",
      ],
    },
  ];
