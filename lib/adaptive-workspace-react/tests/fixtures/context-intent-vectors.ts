/**
 * WX Phase 1B.5.9 — Independently authored Contextual Intent fixtures.
 *
 * Expectations are explicit constants — NOT derived by importing or mirroring
 * the production resolver algorithm.
 *
 * Intent: UNKNOWN | EXPLORE | DISCOVER | CREATE | MANAGE | OPERATE
 *
 * Authority: WX Phase 1B.5 Master Spec §1B.5.9 (planning only; no render/reorder).
 */

import type {
  ContextIntentState,
  IntentSurfaceId,
} from "../../resolve-context-intent";
import type { WorkspaceModeId, WorkspacePosture } from "../../resolve-workspace-mode";

export const INTENT_SURFACE_IDS: readonly IntentSurfaceId[] = [
  "stage",
  "orientation",
  "command",
  "assist-primary",
  "assist-secondary",
  "tool",
  "disclosure",
] as const;

export type IntentExpect = {
  intent: ContextIntentState;
  intentScore: number;
};

export type ContextIntentVector = {
  id: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  heightDemoted: boolean;
  expect: Record<IntentSurfaceId, IntentExpect>;
};

export const CONTEXT_INTENT_VECTORS: readonly ContextIntentVector[] = [
  {
    id: "browse-portrait-explore",
    mode: "browse",
    posture: "portrait",
    usableWidthPx: 390,
    usableHeightPx: 844,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { intent: "EXPLORE", intentScore: 20 },
      orientation: { intent: "EXPLORE", intentScore: 20 },
      command: { intent: "EXPLORE", intentScore: 20 },
      disclosure: { intent: "DISCOVER", intentScore: 40 },
      "assist-primary": { intent: "EXPLORE", intentScore: 20 },
      "assist-secondary": { intent: "EXPLORE", intentScore: 20 },
      tool: { intent: "EXPLORE", intentScore: 20 },
    },
  },
  {
    id: "compact-discover",
    mode: "compact-workspace",
    posture: "landscape",
    usableWidthPx: 700,
    usableHeightPx: 320,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { intent: "DISCOVER", intentScore: 40 },
      orientation: { intent: "DISCOVER", intentScore: 40 },
      command: { intent: "DISCOVER", intentScore: 40 },
      disclosure: { intent: "DISCOVER", intentScore: 40 },
      "assist-primary": { intent: "DISCOVER", intentScore: 40 },
      "assist-secondary": { intent: "DISCOVER", intentScore: 40 },
      tool: { intent: "DISCOVER", intentScore: 40 },
    },
  },
  {
    id: "hybrid-manage-tool",
    mode: "hybrid-workspace",
    posture: "landscape",
    usableWidthPx: 844,
    usableHeightPx: 390,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { intent: "MANAGE", intentScore: 80 },
      orientation: { intent: "MANAGE", intentScore: 80 },
      command: { intent: "MANAGE", intentScore: 80 },
      disclosure: { intent: "DISCOVER", intentScore: 40 },
      "assist-primary": { intent: "MANAGE", intentScore: 80 },
      "assist-secondary": { intent: "MANAGE", intentScore: 80 },
      tool: { intent: "MANAGE", intentScore: 80 },
    },
  },
  {
    id: "full-create",
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { intent: "CREATE", intentScore: 60 },
      orientation: { intent: "CREATE", intentScore: 60 },
      command: { intent: "CREATE", intentScore: 60 },
      disclosure: { intent: "DISCOVER", intentScore: 40 },
      "assist-primary": { intent: "CREATE", intentScore: 60 },
      "assist-secondary": { intent: "CREATE", intentScore: 60 },
      tool: { intent: "MANAGE", intentScore: 80 },
    },
  },
  {
    id: "professional-operate",
    mode: "professional-workspace",
    posture: "landscape",
    usableWidthPx: 1600,
    usableHeightPx: 900,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { intent: "OPERATE", intentScore: 100 },
      orientation: { intent: "OPERATE", intentScore: 100 },
      command: { intent: "OPERATE", intentScore: 100 },
      disclosure: { intent: "OPERATE", intentScore: 100 },
      "assist-primary": { intent: "OPERATE", intentScore: 100 },
      "assist-secondary": { intent: "OPERATE", intentScore: 100 },
      tool: { intent: "OPERATE", intentScore: 100 },
    },
  },
];
