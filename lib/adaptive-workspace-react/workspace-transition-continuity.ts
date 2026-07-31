/**
 * WX Phase 1B.2 — Workspace Transition Continuity contract.
 *
 * Pure · deterministic · side-effect free.
 * Declares how Mode/Posture transitions MUST preserve runtime identity.
 * Does NOT activate capabilities or change layouts.
 *
 * Authority: WMS §7 transition model · Master Spec WX-1B.2
 */

import {
  resolveWorkspaceMode,
  type WorkspaceModeId,
  type WorkspaceModePlan,
  type WorkspacePosture,
} from "./resolve-workspace-mode";
import type { NormalizedMeasurement } from "./workspace-runtime-types";
import { coalesceMeasurement } from "./normalize-workspace-measurement";

/** Sealed continuity invariants for the Feed Workspace shell. */
export const WORKSPACE_TRANSITION_CONTINUITY = {
  phase: "1b.2",
  contractId: "wx-transition-continuity-v1",
  /** Primary slot React key — never Mode/posture-derived. */
  primarySlotKey: "aw-slot-primary",
  startSlotKey: "aw-slot-start",
  endSlotKey: "aw-slot-end",
  orientationSlotKey: "aw-slot-orientation",
  neverKeyPrimaryByMode: true,
  neverUnmountPrimaryOnModeChange: true,
  railsHideWithoutUnmount: true,
  remountOnModeChange: false,
  reloadFeedOnModeChange: false,
  resetScrollOnModeChange: false,
  resetFiltersOnModeChange: false,
  duplicateObserversOnModeChange: false,
} as const;

export type WorkspaceTransitionEvent = {
  fromMode: WorkspaceModeId;
  toMode: WorkspaceModeId;
  fromPosture: WorkspacePosture;
  toPosture: WorkspacePosture;
  usableWidthPx: number;
  usableHeightPx: number;
  modeChanged: boolean;
  postureChanged: boolean;
  /** Continuity contract: remount is never authorized by Mode change. */
  remountAuthorized: false;
  feedIdentityPreserved: true;
  continuityToken: string;
};

/**
 * Describe a Mode/Posture transition. Always denies remount / identity loss.
 */
export function describeWorkspaceModeTransition(
  previous: WorkspaceModePlan,
  next: WorkspaceModePlan,
): WorkspaceTransitionEvent {
  const modeChanged = previous.mode !== next.mode;
  const postureChanged = previous.posture !== next.posture;
  return {
    fromMode: previous.mode,
    toMode: next.mode,
    fromPosture: previous.posture,
    toPosture: next.posture,
    usableWidthPx: next.usableWidthPx,
    usableHeightPx: next.usableHeightPx,
    modeChanged,
    postureChanged,
    remountAuthorized: false,
    feedIdentityPreserved: true,
    continuityToken: `wx-cont:${previous.mode}>${next.mode}:${previous.posture}>${next.posture}:${next.usableWidthPx}x${next.usableHeightPx}`,
  };
}

export type FailClosedUsableSpace = {
  usableWidthPx: number;
  usableHeightPx: number;
  /** True when dimensions came from last stable measurement (WMS §7.5). */
  usedLastStable: boolean;
  measurement: NormalizedMeasurement | null;
};

/**
 * Fail-closed usable space: invalid/empty measurements keep last stable dims.
 * First paint may use provided defaults when no prior stable exists.
 */
export function resolveFailClosedUsableSpace(args: {
  previous: NormalizedMeasurement | null;
  incomingWidthPx: number;
  incomingHeightPx: number;
  fallbackWidthPx: number;
  fallbackHeightPx: number;
  lastStable: { widthPx: number; heightPx: number } | null;
}): FailClosedUsableSpace {
  const coalesced = coalesceMeasurement(args.previous, {
    widthPx: args.incomingWidthPx,
    heightPx: args.incomingHeightPx,
  });

  // Invalid box → coalesce keeps previous but does not yield a fresh measurement.
  const incomingValid =
    Number.isFinite(args.incomingWidthPx) &&
    Number.isFinite(args.incomingHeightPx) &&
    Math.floor(args.incomingWidthPx) > 0 &&
    Math.floor(args.incomingHeightPx) > 0;

  if (!incomingValid) {
    if (args.lastStable) {
      return {
        usableWidthPx: args.lastStable.widthPx,
        usableHeightPx: args.lastStable.heightPx,
        usedLastStable: true,
        measurement: args.previous,
      };
    }
    if (args.previous) {
      return {
        usableWidthPx: args.previous.widthPx,
        usableHeightPx: args.previous.heightPx,
        usedLastStable: true,
        measurement: args.previous,
      };
    }
    return {
      usableWidthPx: Math.max(0, Math.floor(args.fallbackWidthPx)),
      usableHeightPx: Math.max(0, Math.floor(args.fallbackHeightPx)),
      usedLastStable: false,
      measurement: null,
    };
  }

  if (coalesced.next) {
    return {
      usableWidthPx: coalesced.next.widthPx,
      usableHeightPx: coalesced.next.heightPx,
      usedLastStable: false,
      measurement: coalesced.next,
    };
  }

  if (args.lastStable) {
    return {
      usableWidthPx: args.lastStable.widthPx,
      usableHeightPx: args.lastStable.heightPx,
      usedLastStable: true,
      measurement: args.previous,
    };
  }

  return {
    usableWidthPx: Math.max(0, Math.floor(args.fallbackWidthPx)),
    usableHeightPx: Math.max(0, Math.floor(args.fallbackHeightPx)),
    usedLastStable: false,
    measurement: args.previous,
  };
}

/**
 * Simulate a Mode transition from AvailableSpace A → B (pure / testable).
 */
export function simulateModeTransitionAcrossSpace(args: {
  fromWidthPx: number;
  fromHeightPx: number;
  toWidthPx: number;
  toHeightPx: number;
}): WorkspaceTransitionEvent {
  const previous = resolveWorkspaceMode({
    usableWidthPx: args.fromWidthPx,
    usableHeightPx: args.fromHeightPx,
  });
  const next = resolveWorkspaceMode({
    usableWidthPx: args.toWidthPx,
    usableHeightPx: args.toHeightPx,
  });
  return describeWorkspaceModeTransition(previous, next);
}

/** Source-level forbidden patterns for continuity (layout component). */
export const CONTINUITY_FORBIDDEN_SOURCE_PATTERNS = [
  /key=\{[^}]*modePlan/,
  /key=\{[^}]*\.mode\b/,
  /key=\{[^}]*modeToken/,
  /key=\{[^}]*posture/,
] as const;
