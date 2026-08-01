"use client";

/**
 * Visible Feed Workspace layout shell — presentation only.
 *
 * Stable-mount architecture: three permanent region slots (start / primary / end).
 * Rails hide via `hidden` without unmounting the primary slot, so GeoFeed keeps
 * a fixed React sibling index across AvailableSpace / orientation changes.
 *
 * WX Phase 1A.1: full-width orientation strip + continuous Workspace frame chrome.
 * WX Phase 1B.1: Workspace Mode Engine diagnostics only (no layout/capability changes).
 * WX Phase 1B.2: Transition Continuity — Mode/Posture changes MUST NOT remount primary,
 *                reload feed, or reset scroll/filters. Fail-closed last stable space.
 * WX Phase 1B.2.1: Mobile landscape scroll — multiCol frame must propagate bounded height
 *                  so `#homecheff-feed-desktop` remains the vertical scroll owner (no clip freeze).
 * WX Phase 1B.3: Capability Activation Framework diagnostics only (no visual activation).
 *
 * AvailableSpace: width from workspace container; height from visual viewport.
 * NEVER key primary (or any slot) by Mode / posture / mode token / capability state.
 */

import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import WorkspaceRegion from "./WorkspaceRegion";
import WorkspaceSlot from "./WorkspaceSlot";
import WorkspacePanel from "./WorkspacePanel";
import {
  coalesceMeasurement,
  normalizeWorkspaceMeasurement,
  resolveFeedWorkspaceVisibleLayout,
  resolveWorkspaceCapabilitiesFromModePlan,
  resolveWorkspaceMode,
  WORKSPACE_TRANSITION_CONTINUITY,
  type FeedWorkspaceVisibleLayoutPlan,
  type NormalizedMeasurement,
  type WorkspaceModePlan,
} from "@/lib/adaptive-workspace-react";

export type FeedWorkspaceVisibleLayoutProps = {
  /**
   * Permanent primary slot content (stable GeoFeed from parent).
   */
  primary: ReactNode;
  startPanel?: ReactNode;
  endPanel?: ReactNode;
  /** WX 1A — full-width Workspace chrome above rails + stage. */
  orientation?: ReactNode;
  initialWidthPx?: number;
  initialHeightPx?: number;
  ariaLabel?: string;
  onPlanChange?: (plan: FeedWorkspaceVisibleLayoutPlan) => void;
};

function seedMeasurement(
  widthPx: number | undefined,
  heightPx: number | undefined,
): NormalizedMeasurement | null {
  if (widthPx == null || heightPx == null) return null;
  return normalizeWorkspaceMeasurement({ widthPx, heightPx });
}

function readViewportHeightPx(): number {
  if (typeof window === "undefined") return 800;
  return Math.floor(
    window.visualViewport?.height ?? window.innerHeight ?? 800,
  );
}

const railChromeClass =
  "hc-wx-rail h-full min-h-0 flex flex-col bg-white";

const railScrollClass =
  "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2.5 py-2.5 [-webkit-overflow-scrolling:touch]";

/** Diagnostics-only mount sequence — increments once per actual React mount. */
let wxShellMountSeq = 0;
let wxPrimaryMountSeq = 0;

export default function FeedWorkspaceVisibleLayout({
  primary,
  startPanel,
  endPanel,
  orientation,
  initialWidthPx,
  initialHeightPx,
  ariaLabel = "Adaptive workspace",
  onPlanChange,
}: FeedWorkspaceVisibleLayoutProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const lastStableRef = useRef<{ widthPx: number; heightPx: number } | null>(
    null,
  );
  const previousModeRef = useRef<WorkspaceModePlan | null>(null);
  /** Stable for the life of this shell instance; changes only on remount. */
  const [shellMountId] = useState(() => {
    wxShellMountSeq += 1;
    return `wx-shell-mount:${wxShellMountSeq}`;
  });
  /** Stable for the life of the primary slot host; changes only on remount. */
  const [primaryMountId] = useState(() => {
    wxPrimaryMountSeq += 1;
    return `wx-primary-mount:${wxPrimaryMountSeq}`;
  });
  const [measurement, setMeasurement] = useState<NormalizedMeasurement | null>(
    () => seedMeasurement(initialWidthPx, initialHeightPx),
  );

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const apply = (widthPx: number, heightPx: number) => {
      setMeasurement((prev) => {
        const result = coalesceMeasurement(prev, { widthPx, heightPx });
        return result.shouldResolve ? result.next : prev;
      });
    };

    const measure = () => {
      const widthPx = el.clientWidth || window.innerWidth;
      const heightPx = readViewportHeightPx();
      apply(widthPx, heightPx);
    };

    measure();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;
    ro?.observe(el);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      ro?.disconnect();
      vv?.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, []);

  // Prefer live measurement; otherwise last stable / defaults (WMS fail-closed).
  const usableWidthPx =
    measurement?.widthPx ??
    lastStableRef.current?.widthPx ??
    initialWidthPx ??
    1280;
  const usableHeightPx =
    measurement?.heightPx ??
    lastStableRef.current?.heightPx ??
    initialHeightPx ??
    800;

  const usedLastStable =
    measurement == null && lastStableRef.current != null;

  if (measurement) {
    lastStableRef.current = {
      widthPx: measurement.widthPx,
      heightPx: measurement.heightPx,
    };
  }

  const plan: FeedWorkspaceVisibleLayoutPlan = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx,
    usableHeightPx,
  });

  /** WX 1B.1 — authoritative Mode identity; does not drive layout. */
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: plan.usableWidthPx,
    usableHeightPx: plan.usableHeightPx,
  });

  /** WX 1B.3 — capability activation plan; diagnostics only (no visual activation). */
  const capabilityPlan = resolveWorkspaceCapabilitiesFromModePlan(modePlan);

  const previousMode = previousModeRef.current;
  const modeChanged =
    previousMode != null && previousMode.mode !== modePlan.mode;
  const postureChanged =
    previousMode != null && previousMode.posture !== modePlan.posture;
  previousModeRef.current = modePlan;

  useEffect(() => {
    onPlanChange?.(plan);
  }, [plan.stabilityToken, onPlanChange]);

  const multiCol = plan.supportingPanelCount > 0;
  const hasOrientation = Boolean(orientation);

  const gridTemplateAreas = (() => {
    // Orientation host is always mounted for continuity; reserve grid row when
    // orientation content is provided (Home always passes it).
    if (plan.showStartPanel) {
      return hasOrientation
        ? '"orient orient orient" "start primary end"'
        : '"start primary end"';
    }
    if (plan.showEndPanel) {
      return hasOrientation
        ? '"orient orient" "primary end"'
        : '"primary end"';
    }
    return hasOrientation ? '"orient" "primary"' : '"primary"';
  })();

  const gridTemplateColumns = multiCol
    ? plan.gridTemplateColumns
    : "minmax(0,1fr)";

  const gridTemplateRows = hasOrientation
    ? multiCol
      ? "auto minmax(0,1fr)"
      : "auto auto"
    : undefined;

  return (
    <section
      ref={rootRef}
      data-aw-feed-workspace=""
      data-wx-phase="1b.3"
      data-wx-continuity={WORKSPACE_TRANSITION_CONTINUITY.contractId}
      data-wx-continuity-remount="0"
      data-wx-shell-mount-id={shellMountId}
      data-wx-fail-closed={usedLastStable ? "1" : "0"}
      data-wx-mode={modePlan.mode}
      data-wx-posture={modePlan.posture}
      data-wx-mode-token={modePlan.stabilityToken}
      data-wx-height-demoted={modePlan.heightDemoted ? "1" : "0"}
      data-wx-landscape-carve-out={modePlan.landscapeCarveOut ? "1" : "0"}
      data-wx-mode-changed={modeChanged ? "1" : "0"}
      data-wx-posture-changed={postureChanged ? "1" : "0"}
      data-wx-capability={capabilityPlan.contractId}
      data-wx-cap-token={capabilityPlan.stabilityToken}
      data-wx-cap-available={String(capabilityPlan.availableCount)}
      data-wx-cap-unavailable={String(capabilityPlan.unavailableCount)}
      data-wx-cap-reserved={String(capabilityPlan.reservedCount)}
      data-wx-cap-navigation={capabilityPlan.capabilities.navigation}
      data-wx-cap-discovery={capabilityPlan.capabilities.discovery}
      data-wx-cap-search={capabilityPlan.capabilities.search}
      data-wx-cap-filters={capabilityPlan.capabilities.filters}
      data-wx-cap-panels={capabilityPlan.capabilities.panels}
      data-wx-cap-workspace-density={
        capabilityPlan.capabilities["workspace-density"]
      }
      data-wx-cap-inspector={capabilityPlan.capabilities.inspector}
      data-wx-cap-selection={capabilityPlan.capabilities.selection}
      data-wx-cap-workspace-memory={
        capabilityPlan.capabilities["workspace-memory"]
      }
      data-wx-cap-contextual-assistance={
        capabilityPlan.capabilities["contextual-assistance"]
      }
      data-wx-cap-professional-workspace={
        capabilityPlan.capabilities["professional-workspace"]
      }
      data-wx-cap-ai-collaboration={
        capabilityPlan.capabilities["ai-collaboration"]
      }
      data-wx-cap-extensions={capabilityPlan.capabilities.extensions}
      data-wx-cap-visual-activation="0"
      data-aw-layout-mode={plan.layoutMode}
      data-aw-orientation={plan.orientation}
      data-aw-profile={plan.profile}
      data-aw-supporting-panels={String(plan.supportingPanelCount)}
      data-aw-stability-token={plan.stabilityToken}
      data-aw-feed-max-width={String(plan.feedColumnMaxWidthPx)}
      data-aw-usable-width={String(plan.usableWidthPx)}
      data-aw-usable-height={String(plan.usableHeightPx)}
      aria-label={ariaLabel}
      className={
        multiCol
          ? "hc-aw-feed-workspace hc-wx-frame w-full min-w-0 grid gap-0 items-stretch max-h-[calc(100dvh-5rem)] min-h-[12rem] h-[calc(100dvh-5rem)] overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm"
          : "hc-aw-feed-workspace w-full min-w-0 grid gap-2 sm:gap-3"
      }
      style={{
        gridTemplateColumns,
        gridTemplateAreas,
        gridTemplateRows,
      }}
    >
      {/* Permanent orientation host — hidden when unused (never toggles sibling index of primary). */}
      <div
        key={WORKSPACE_TRANSITION_CONTINUITY.orientationSlotKey}
        data-aw-slot-host="orientation"
        data-wx-orientation-host=""
        className={hasOrientation ? "min-w-0" : "hidden"}
        style={{ gridArea: hasOrientation ? "orient" : undefined }}
        aria-hidden={!hasOrientation}
      >
        {orientation}
      </div>

      {/* Permanent slot 1 — start rail (hidden, not unmounted, when unused). */}
      <div
        key={WORKSPACE_TRANSITION_CONTINUITY.startSlotKey}
        data-aw-slot-host="start"
        className={
          plan.showStartPanel
            ? multiCol
              ? "min-w-0 min-h-0 h-full overflow-hidden"
              : "min-w-0 min-h-0"
            : "hidden"
        }
        style={{ gridArea: plan.showStartPanel ? "start" : undefined }}
        aria-hidden={!plan.showStartPanel}
      >
        <WorkspaceRegion regionId="supporting-start">
          <WorkspaceSlot slotId="feed.supporting.start">
            <WorkspacePanel
              panelId="feed.panel.start"
              slotId="feed.supporting.start"
              widgetId="home.desktop.left"
              mode="rail"
            >
              <aside
                data-aw-rail="start"
                data-aw-rail-width={String(plan.startRailWidthPx)}
                data-wx-rail-chrome=""
                className={`${railChromeClass} border-r border-gray-200/80`}
              >
                <div className={railScrollClass}>{startPanel}</div>
              </aside>
            </WorkspacePanel>
          </WorkspaceSlot>
        </WorkspaceRegion>
      </div>

      {/* Permanent slot 2 — primary feed (GeoFeed). Never conditionally removed. Never keyed by Mode. */}
      <div
        key={WORKSPACE_TRANSITION_CONTINUITY.primarySlotKey}
        data-aw-slot-host="primary"
        data-wx-continuity-primary="1"
        data-wx-primary-mount-id={primaryMountId}
        className={
          multiCol
            ? "min-w-0 min-h-0 h-full overflow-hidden"
            : "min-w-0 min-h-0"
        }
        style={{ gridArea: "primary" }}
      >
        <WorkspaceRegion regionId="primary-stage">
          <WorkspaceSlot slotId="feed.primary">
            <WorkspacePanel
              panelId="feed.panel.primary"
              slotId="feed.primary"
              widgetId="feed.discovery"
              mode="stage"
            >
              <div
                data-wx-stage-chrome=""
                className="hc-wx-stage h-full min-h-0 flex flex-col bg-gray-50/40"
              >
                <div
                  id="homecheff-feed-desktop"
                  data-aw-primary-feed=""
                  data-aw-stable-feed-slot="1"
                  className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2 sm:px-3 [-webkit-overflow-scrolling:touch] min-w-0 w-full mx-auto space-y-2 sm:space-y-3 hc-home-feed-grid"
                  style={{ maxWidth: plan.feedColumnMaxWidthPx }}
                >
                  {primary}
                </div>
              </div>
            </WorkspacePanel>
          </WorkspaceSlot>
        </WorkspaceRegion>
      </div>

      {/* Permanent slot 3 — end rail (hidden when unused). */}
      <div
        key={WORKSPACE_TRANSITION_CONTINUITY.endSlotKey}
        data-aw-slot-host="end"
        className={
          plan.showEndPanel
            ? multiCol
              ? "min-w-0 min-h-0 h-full overflow-hidden"
              : "min-w-0 min-h-0"
            : "hidden"
        }
        style={{ gridArea: plan.showEndPanel ? "end" : undefined }}
        aria-hidden={!plan.showEndPanel}
      >
        <WorkspaceRegion regionId="supporting-end">
          <WorkspaceSlot slotId="feed.supporting.end">
            <WorkspacePanel
              panelId="feed.panel.end"
              slotId="feed.supporting.end"
              widgetId="home.desktop.right"
              mode="rail"
            >
              <aside
                data-aw-rail="end"
                data-aw-rail-width={String(plan.endRailWidthPx)}
                data-wx-rail-chrome=""
                className={`${railChromeClass} border-l border-gray-200/80`}
              >
                <div className={railScrollClass}>{endPanel}</div>
              </aside>
            </WorkspacePanel>
          </WorkspaceSlot>
        </WorkspaceRegion>
      </div>
    </section>
  );
}
