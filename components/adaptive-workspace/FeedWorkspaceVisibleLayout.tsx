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
 *
 * AvailableSpace: width from workspace container; height from visual viewport.
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
  resolveWorkspaceMode,
  type FeedWorkspaceVisibleLayoutPlan,
  type NormalizedMeasurement,
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

  const plan: FeedWorkspaceVisibleLayoutPlan = resolveFeedWorkspaceVisibleLayout({
    usableWidthPx: measurement?.widthPx ?? initialWidthPx ?? 1280,
    usableHeightPx: measurement?.heightPx ?? initialHeightPx ?? 800,
  });

  /** WX 1B.1 — authoritative Mode identity; does not drive layout in this phase. */
  const modePlan = resolveWorkspaceMode({
    usableWidthPx: plan.usableWidthPx,
    usableHeightPx: plan.usableHeightPx,
  });

  useEffect(() => {
    onPlanChange?.(plan);
  }, [plan.stabilityToken, onPlanChange]);

  const multiCol = plan.supportingPanelCount > 0;
  const hasOrientation = Boolean(orientation);

  const gridTemplateAreas = (() => {
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
      data-wx-phase="1b.1"
      data-wx-mode={modePlan.mode}
      data-wx-posture={modePlan.posture}
      data-wx-mode-token={modePlan.stabilityToken}
      data-wx-height-demoted={modePlan.heightDemoted ? "1" : "0"}
      data-wx-landscape-carve-out={modePlan.landscapeCarveOut ? "1" : "0"}
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
      {hasOrientation ? (
        <div
          key="aw-slot-orientation"
          data-aw-slot-host="orientation"
          data-wx-orientation-host=""
          className="min-w-0"
          style={{ gridArea: "orient" }}
        >
          {orientation}
        </div>
      ) : null}

      {/* Permanent slot 1 — start rail (hidden, not unmounted, when unused). */}
      <div
        key="aw-slot-start"
        data-aw-slot-host="start"
        className={plan.showStartPanel ? "min-w-0 min-h-0" : "hidden"}
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

      {/* Permanent slot 2 — primary feed (GeoFeed). Never conditionally removed. */}
      <div
        key="aw-slot-primary"
        data-aw-slot-host="primary"
        className="min-w-0 min-h-0"
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
        key="aw-slot-end"
        data-aw-slot-host="end"
        className={plan.showEndPanel ? "min-w-0 min-h-0" : "hidden"}
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
