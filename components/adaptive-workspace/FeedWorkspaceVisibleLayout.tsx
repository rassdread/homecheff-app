"use client";

/**
 * Visible Feed Workspace layout shell — presentation only.
 *
 * Stable-mount architecture: three permanent region slots (start / primary / end).
 * Rails hide via `hidden` without unmounting the primary slot, so GeoFeed keeps
 * a fixed React sibling index across AvailableSpace / orientation changes.
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

export default function FeedWorkspaceVisibleLayout({
  primary,
  startPanel,
  endPanel,
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

  useEffect(() => {
    onPlanChange?.(plan);
  }, [plan.stabilityToken, onPlanChange]);

  const colScroll =
    "min-h-0 overflow-y-auto overscroll-y-contain pb-3 [-webkit-overflow-scrolling:touch]";

  const multiCol = plan.supportingPanelCount > 0;

  const gridTemplateAreas = plan.showStartPanel
    ? '"start primary end"'
    : plan.showEndPanel
      ? '"primary end"'
      : '"primary"';

  return (
    <section
      ref={rootRef}
      data-aw-feed-workspace=""
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
          ? "hc-aw-feed-workspace w-full min-w-0 grid gap-4 items-stretch max-h-[calc(100dvh-5rem)] min-h-[12rem] h-[calc(100dvh-5rem)]"
          : "hc-aw-feed-workspace w-full min-w-0 grid gap-4"
      }
      style={{
        gridTemplateColumns: multiCol
          ? plan.gridTemplateColumns
          : "minmax(0,1fr)",
        gridTemplateAreas,
      }}
    >
      {/* Permanent slot 1 — start rail (hidden, not unmounted, when unused). */}
      <div
        key="aw-slot-start"
        data-aw-slot-host="start"
        className={plan.showStartPanel ? "min-w-0" : "hidden"}
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
                className={colScroll}
              >
                {startPanel}
              </aside>
            </WorkspacePanel>
          </WorkspaceSlot>
        </WorkspaceRegion>
      </div>

      {/* Permanent slot 2 — primary feed (GeoFeed). Never conditionally removed. */}
      <div
        key="aw-slot-primary"
        data-aw-slot-host="primary"
        className="min-w-0"
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
                id="homecheff-feed-desktop"
                data-aw-primary-feed=""
                data-aw-stable-feed-slot="1"
                className={`${colScroll} min-w-0 w-full mx-auto space-y-4 hc-home-feed-grid`}
                style={{ maxWidth: plan.feedColumnMaxWidthPx }}
              >
                {primary}
              </div>
            </WorkspacePanel>
          </WorkspaceSlot>
        </WorkspaceRegion>
      </div>

      {/* Permanent slot 3 — end rail (hidden when unused). */}
      <div
        key="aw-slot-end"
        data-aw-slot-host="end"
        className={plan.showEndPanel ? "min-w-0" : "hidden"}
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
                className={colScroll}
              >
                {endPanel}
              </aside>
            </WorkspacePanel>
          </WorkspaceSlot>
        </WorkspaceRegion>
      </div>
    </section>
  );
}
