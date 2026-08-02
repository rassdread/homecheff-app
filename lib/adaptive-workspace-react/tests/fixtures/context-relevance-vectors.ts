/**
 * WX Phase 1B.5.8 — Independently authored Contextual Relevance fixtures.
 *
 * Expectations are explicit constants — NOT derived by importing or mirroring
 * the production resolver algorithm.
 *
 * Relevance: UNKNOWN | IRRELEVANT | CONTEXTUAL | IMPORTANT | ESSENTIAL
 *
 * Authority: WX Phase 1B.5 Master Spec §1B.5.8 (planning only; no render/reorder).
 */

import type {
  ContextRelevanceState,
  RelevanceSurfaceId,
} from "../../resolve-context-relevance";
import type { WorkspaceModeId, WorkspacePosture } from "../../resolve-workspace-mode";

export const RELEVANCE_SURFACE_IDS: readonly RelevanceSurfaceId[] = [
  "stage",
  "orientation",
  "command",
  "assist-primary",
  "assist-secondary",
  "tool",
  "disclosure",
] as const;

export type RelevanceExpect = {
  relevance: ContextRelevanceState;
  relevanceScore: number;
};

export type ContextRelevanceVector = {
  id: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  heightDemoted: boolean;
  expect: Record<RelevanceSurfaceId, RelevanceExpect>;
};

export const CONTEXT_RELEVANCE_VECTORS: readonly ContextRelevanceVector[] = [
  {
    id: "browse-portrait-390",
    mode: "browse",
    posture: "portrait",
    usableWidthPx: 390,
    usableHeightPx: 844,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { relevance: "ESSENTIAL", relevanceScore: 100 },
      orientation: { relevance: "IMPORTANT", relevanceScore: 75 },
      command: { relevance: "IMPORTANT", relevanceScore: 75 },
      disclosure: { relevance: "IRRELEVANT", relevanceScore: 25 },
      "assist-primary": { relevance: "IRRELEVANT", relevanceScore: 25 },
      "assist-secondary": { relevance: "IRRELEVANT", relevanceScore: 25 },
      tool: { relevance: "CONTEXTUAL", relevanceScore: 50 },
    },
  },
  {
    id: "browse-height-demoted-essential-chrome",
    mode: "browse",
    posture: "portrait",
    usableWidthPx: 390,
    usableHeightPx: 500,
    landscapeCarveOut: false,
    heightDemoted: true,
    expect: {
      stage: { relevance: "ESSENTIAL", relevanceScore: 100 },
      orientation: { relevance: "ESSENTIAL", relevanceScore: 100 },
      command: { relevance: "ESSENTIAL", relevanceScore: 100 },
      disclosure: { relevance: "IRRELEVANT", relevanceScore: 25 },
      "assist-primary": { relevance: "IRRELEVANT", relevanceScore: 25 },
      "assist-secondary": { relevance: "IRRELEVANT", relevanceScore: 25 },
      tool: { relevance: "CONTEXTUAL", relevanceScore: 50 },
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
      stage: { relevance: "ESSENTIAL", relevanceScore: 100 },
      orientation: { relevance: "IMPORTANT", relevanceScore: 75 },
      command: { relevance: "IMPORTANT", relevanceScore: 75 },
      disclosure: { relevance: "IRRELEVANT", relevanceScore: 25 },
      "assist-primary": { relevance: "IRRELEVANT", relevanceScore: 25 },
      "assist-secondary": { relevance: "IRRELEVANT", relevanceScore: 25 },
      tool: { relevance: "CONTEXTUAL", relevanceScore: 50 },
    },
  },
];
