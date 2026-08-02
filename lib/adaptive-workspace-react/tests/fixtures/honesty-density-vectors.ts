/**
 * WX Phase 1B.5.6 — Independently authored Honesty Density fixtures.
 *
 * Expectations are explicit constants — NOT derived by importing or mirroring
 * the production resolver algorithm.
 *
 * Density: UNKNOWN | EMPTY | SPARSE | NORMAL | DENSE | OVERFLOW
 * Compact: NONE | OPTIONAL | RECOMMENDED | REQUIRED
 *
 * Authority: WX Phase 1B.5 Master Spec §1B.5.6 (planning only; no UI/compaction apply).
 */

import type {
  HonestyCompactState,
  HonestyDensityState,
  HonestySurfaceId,
} from "../../resolve-honesty-density";
import type { WorkspaceModeId, WorkspacePosture } from "../../resolve-workspace-mode";

export const HONESTY_SURFACE_IDS: readonly HonestySurfaceId[] = [
  "stage",
  "orientation",
  "command",
  "assist-primary",
  "assist-secondary",
  "tool",
  "disclosure",
] as const;

export type HonestyExpect = {
  density: HonestyDensityState;
  compact: HonestyCompactState;
};

export type HonestyDensityVector = {
  id: string;
  mode: WorkspaceModeId;
  posture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  landscapeCarveOut: boolean;
  /** Explicit pin — Mode engine only sets this for full/professional short height. */
  heightDemoted: boolean;
  expect: Record<HonestySurfaceId, HonestyExpect>;
};

/** Mode × posture × density honesty matrix (explicit). */
export const HONESTY_DENSITY_VECTORS: readonly HonestyDensityVector[] = [
  {
    id: "browse-portrait-390-normal-sparse-empty",
    mode: "browse",
    posture: "portrait",
    usableWidthPx: 390,
    usableHeightPx: 844,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { density: "NORMAL", compact: "NONE" },
      orientation: { density: "NORMAL", compact: "NONE" },
      command: { density: "NORMAL", compact: "NONE" },
      disclosure: { density: "SPARSE", compact: "NONE" },
      "assist-primary": { density: "EMPTY", compact: "NONE" },
      "assist-secondary": { density: "EMPTY", compact: "NONE" },
      tool: { density: "SPARSE", compact: "NONE" },
    },
  },
  {
    id: "browse-portrait-height-demoted-dense-required",
    mode: "browse",
    posture: "portrait",
    usableWidthPx: 390,
    usableHeightPx: 500,
    landscapeCarveOut: false,
    heightDemoted: true,
    expect: {
      stage: { density: "NORMAL", compact: "NONE" },
      orientation: { density: "DENSE", compact: "REQUIRED" },
      command: { density: "DENSE", compact: "REQUIRED" },
      disclosure: { density: "SPARSE", compact: "NONE" },
      "assist-primary": { density: "EMPTY", compact: "NONE" },
      "assist-secondary": { density: "EMPTY", compact: "NONE" },
      tool: { density: "SPARSE", compact: "NONE" },
    },
  },
  {
    id: "hybrid-landscape-844-recommended-sparse",
    mode: "hybrid-workspace",
    posture: "landscape",
    usableWidthPx: 844,
    usableHeightPx: 390,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { density: "NORMAL", compact: "NONE" },
      orientation: { density: "NORMAL", compact: "RECOMMENDED" },
      command: { density: "NORMAL", compact: "RECOMMENDED" },
      disclosure: { density: "SPARSE", compact: "NONE" },
      "assist-primary": { density: "SPARSE", compact: "NONE" },
      "assist-secondary": { density: "SPARSE", compact: "NONE" },
      tool: { density: "SPARSE", compact: "NONE" },
    },
  },
  {
    id: "full-landscape-1280-assist-hollow-sparse",
    mode: "full-workspace",
    posture: "landscape",
    usableWidthPx: 1280,
    usableHeightPx: 800,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { density: "NORMAL", compact: "NONE" },
      orientation: { density: "NORMAL", compact: "RECOMMENDED" },
      command: { density: "NORMAL", compact: "RECOMMENDED" },
      disclosure: { density: "SPARSE", compact: "NONE" },
      "assist-primary": { density: "SPARSE", compact: "NONE" },
      "assist-secondary": { density: "SPARSE", compact: "NONE" },
      tool: { density: "SPARSE", compact: "NONE" },
    },
  },
  {
    id: "professional-1600-tool-dense-optional",
    mode: "professional-workspace",
    posture: "landscape",
    usableWidthPx: 1600,
    usableHeightPx: 900,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { density: "NORMAL", compact: "NONE" },
      orientation: { density: "NORMAL", compact: "RECOMMENDED" },
      command: { density: "NORMAL", compact: "RECOMMENDED" },
      disclosure: { density: "SPARSE", compact: "NONE" },
      "assist-primary": { density: "SPARSE", compact: "NONE" },
      "assist-secondary": { density: "SPARSE", compact: "NONE" },
      tool: { density: "DENSE", compact: "OPTIONAL" },
    },
  },
  {
    id: "professional-1600-height-demoted-overflow-required",
    mode: "professional-workspace",
    posture: "landscape",
    usableWidthPx: 1600,
    usableHeightPx: 500,
    landscapeCarveOut: false,
    heightDemoted: true,
    expect: {
      stage: { density: "NORMAL", compact: "NONE" },
      orientation: { density: "DENSE", compact: "REQUIRED" },
      command: { density: "DENSE", compact: "REQUIRED" },
      disclosure: { density: "SPARSE", compact: "NONE" },
      "assist-primary": { density: "SPARSE", compact: "OPTIONAL" },
      "assist-secondary": { density: "SPARSE", compact: "OPTIONAL" },
      tool: { density: "OVERFLOW", compact: "REQUIRED" },
    },
  },
  {
    id: "compact-portrait-700-empty-assist",
    mode: "compact-workspace",
    posture: "portrait",
    usableWidthPx: 700,
    usableHeightPx: 900,
    landscapeCarveOut: false,
    heightDemoted: false,
    expect: {
      stage: { density: "NORMAL", compact: "NONE" },
      orientation: { density: "NORMAL", compact: "NONE" },
      command: { density: "NORMAL", compact: "NONE" },
      disclosure: { density: "SPARSE", compact: "NONE" },
      "assist-primary": { density: "EMPTY", compact: "NONE" },
      "assist-secondary": { density: "EMPTY", compact: "NONE" },
      tool: { density: "SPARSE", compact: "NONE" },
    },
  },
];
