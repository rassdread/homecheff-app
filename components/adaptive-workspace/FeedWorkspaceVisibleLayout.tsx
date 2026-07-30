"use client";

/**
 * Visible Feed Workspace layout shell — presentation only.
 *
 * Mechanism B: composed as GeoFeed children (desktop) or as an outer grid
 * around a single GeoFeed (sub-lg landscape). Does not own feed requests.
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
  /** Primary feed column (FeedContent or GeoFeed itself). */
  primary: ReactNode;
  startPanel?: ReactNode;
  endPanel?: ReactNode;
  /** Optional SSR/seed measurement for hydration-stable first paint. */
  initialWidthPx?: number;
  initialHeightPx?: number;
  /** Aria label for the workspace section. */
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
    if (!el || typeof ResizeObserver === "undefined") return;

    const apply = (widthPx: number, heightPx: number) => {
      setMeasurement((prev) => {
        const result = coalesceMeasurement(prev, { widthPx, heightPx });
        return result.shouldResolve ? result.next : prev;
      });
    };

    apply(el.clientWidth, el.clientHeight);

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentBoxSize?.[0];
      const widthPx = box?.inlineSize ?? entry.contentRect.width;
      const heightPx = box?.blockSize ?? entry.contentRect.height;
      apply(widthPx, heightPx);
    });
    ro.observe(el);
    return () => ro.disconnect();
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

  return (
    <section
      ref={rootRef}
      data-aw-feed-workspace=""
      data-aw-layout-mode={plan.layoutMode}
      data-aw-orientation={plan.orientation}
      data-aw-profile={plan.profile}
      data-aw-supporting-panels={String(plan.supportingPanelCount)}
      data-aw-stability-token={plan.stabilityToken}
      aria-label={ariaLabel}
      className={
        plan.supportingPanelCount === 0
          ? "hc-aw-feed-workspace w-full min-w-0"
          : "hc-aw-feed-workspace w-full min-w-0 grid gap-4 lg:gap-5 lg:items-stretch lg:h-[calc(100dvh-5rem)] lg:max-h-[calc(100dvh-5rem)] lg:min-h-[28rem]"
      }
      style={
        plan.supportingPanelCount > 0
          ? { gridTemplateColumns: plan.gridTemplateColumns }
          : undefined
      }
    >
      {plan.showStartPanel && startPanel ? (
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
                className={colScroll}
              >
                {startPanel}
              </aside>
            </WorkspacePanel>
          </WorkspaceSlot>
        </WorkspaceRegion>
      ) : null}

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
              className={`${colScroll} min-w-0 space-y-4 hc-home-feed-grid`}
            >
              {primary}
            </div>
          </WorkspacePanel>
        </WorkspaceSlot>
      </WorkspaceRegion>

      {plan.showEndPanel && endPanel ? (
        <WorkspaceRegion regionId="supporting-end">
          <WorkspaceSlot slotId="feed.supporting.end">
            <WorkspacePanel
              panelId="feed.panel.end"
              slotId="feed.supporting.end"
              widgetId="home.desktop.right"
              mode="rail"
            >
              <aside data-aw-rail="end" className={colScroll}>
                {endPanel}
              </aside>
            </WorkspacePanel>
          </WorkspaceSlot>
        </WorkspaceRegion>
      ) : null}
    </section>
  );
}
