/**
 * WX Phase 1B.5.7 — Independently authored Contextual Priority fixtures.
 *
 * Expectations are explicit constants — NOT derived by importing or mirroring
 * the production resolver algorithm.
 *
 * Priority: UNKNOWN | LOW | NORMAL | HIGH | CRITICAL
 *
 * Authority: WX Phase 1B.5 Master Spec §1B.5.7 (planning only; no reorder/render).
 */

import type {
  ContextPriorityLevel,
  PrioritySurfaceId,
} from "../../resolve-context-priority";
import type { WorkspaceModeId, WorkspacePosture } from "../../resolve-workspace-mode";

export const PRIORITY_SURFACE_IDS: readonly PrioritySurfaceId[] = [
  "stage",
  "orientation",
  "command",
  "assist-primary",
  "assist-secondary",
  "tool",
  "disclosure",
] as const;

export type PriorityExpect = {
  priority: ContextPriorityLevel;
  priorityScore: number;
};

export type ContextPriorityVector = {
  id: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  heightDemoted: boolean;
  expect: Record<PrioritySurfaceId, PriorityExpect>;
};

export const CONTEXT_PRIORITY_VECTORS: readonly ContextPriorityVector[] = [
  {
    id: "browse-portrait-390",
    mode: "browse",
    posture: "portrait",
    usableWidthPx: 390,
    usableHeightPx: 844,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { priority: "CRITICAL", priorityScore: 100 },
      orientation: { priority: "HIGH", priorityScore: 75 },
      command: { priority: "HIGH", priorityScore: 75 },
      disclosure: { priority: "LOW", priorityScore: 25 },
      "assist-primary": { priority: "LOW", priorityScore: 25 },
      "assist-secondary": { priority: "LOW", priorityScore: 25 },
      tool: { priority: "NORMAL", priorityScore: 50 },
    },
  },
  {
    id: "browse-height-demoted-critical-chrome",
    mode: "browse",
    posture: "portrait",
    usableWidthPx: 390,
    usableHeightPx: 500,
    landscapeCarveOut: false,
    heightDemoted: true,
    expect: {
      stage: { priority: "CRITICAL", priorityScore: 100 },
      orientation: { priority: "CRITICAL", priorityScore: 100 },
      command: { priority: "CRITICAL", priorityScore: 100 },
      disclosure: { priority: "LOW", priorityScore: 25 },
      "assist-primary": { priority: "LOW", priorityScore: 25 },
      "assist-secondary": { priority: "LOW", priorityScore: 25 },
      tool: { priority: "NORMAL", priorityScore: 50 },
    },
  },
  {
    id: "hybrid-landscape-844",
    mode: "hybrid-workspace",
    posture: "landscape",
    usableWidthPx: 844,
    usableHeightPx: 390,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { priority: "CRITICAL", priorityScore: 100 },
      orientation: { priority: "HIGH", priorityScore: 75 },
      command: { priority: "HIGH", priorityScore: 75 },
      disclosure: { priority: "LOW", priorityScore: 25 },
      "assist-primary": { priority: "LOW", priorityScore: 25 },
      "assist-secondary": { priority: "LOW", priorityScore: 25 },
      tool: { priority: "NORMAL", priorityScore: 50 },
    },
  },
  {
    id: "full-landscape-1280",
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { priority: "CRITICAL", priorityScore: 100 },
      orientation: { priority: "HIGH", priorityScore: 75 },
      command: { priority: "HIGH", priorityScore: 75 },
      disclosure: { priority: "LOW", priorityScore: 25 },
      "assist-primary": { priority: "LOW", priorityScore: 25 },
      "assist-secondary": { priority: "LOW", priorityScore: 25 },
      tool: { priority: "NORMAL", priorityScore: 50 },
    },
  },
  {
    id: "professional-1600-tool-high",
    mode: "professional-workspace",
    posture: "landscape",
    usableWidthPx: 1600,
    usableHeightPx: 900,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { priority: "CRITICAL", priorityScore: 100 },
      orientation: { priority: "HIGH", priorityScore: 75 },
      command: { priority: "HIGH", priorityScore: 75 },
      disclosure: { priority: "LOW", priorityScore: 25 },
      "assist-primary": { priority: "LOW", priorityScore: 25 },
      "assist-secondary": { priority: "LOW", priorityScore: 25 },
      tool: { priority: "HIGH", priorityScore: 75 },
    },
  },
  {
    id: "professional-1600-overflow-critical-tool",
    mode: "professional-workspace",
    posture: "landscape",
    usableWidthPx: 1600,
    usableHeightPx: 500,
    landscapeCarveOut: false,
    heightDemoted: true,
    expect: {
      stage: { priority: "CRITICAL", priorityScore: 100 },
      orientation: { priority: "CRITICAL", priorityScore: 100 },
      command: { priority: "CRITICAL", priorityScore: 100 },
      disclosure: { priority: "LOW", priorityScore: 25 },
      "assist-primary": { priority: "LOW", priorityScore: 25 },
      "assist-secondary": { priority: "LOW", priorityScore: 25 },
      tool: { priority: "CRITICAL", priorityScore: 100 },
    },
  },
  {
    id: "compact-portrait-700",
    mode: "compact-workspace",
    posture: "portrait",
    usableWidthPx: 700,
    usableHeightPx: 900,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { priority: "CRITICAL", priorityScore: 100 },
      orientation: { priority: "HIGH", priorityScore: 75 },
      command: { priority: "HIGH", priorityScore: 75 },
      disclosure: { priority: "LOW", priorityScore: 25 },
      "assist-primary": { priority: "LOW", priorityScore: 25 },
      "assist-secondary": { priority: "LOW", priorityScore: 25 },
      tool: { priority: "NORMAL", priorityScore: 50 },
    },
  },
];
