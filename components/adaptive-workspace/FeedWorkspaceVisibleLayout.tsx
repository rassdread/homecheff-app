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
 *                  Phone portrait (non-multiCol) keeps window/document scroll — do NOT put
 *                  overflow-y-auto + overscroll-y-contain on an unbounded feed (touch trap).
 * WX Phase 1B.3: Capability Activation Framework diagnostics only (no visual activation).
 * WX Phase 1B.4: Landscape Work Posture presentation diagnostics (chrome compaction owned
 *                by WorkspaceChromeProvider — layout does not remount or change ownership).
 * WX Phase 1B.5.1: Surface Registry diagnostics only — no presentation resolver, no
 *                  capability visual activation, no assist/tool occupancy changes.
 * WX Phase 1B.5.2: Surface Presentation Resolver diagnostics only — plan eligibility /
 *                  priority; does NOT drive chrome, remount, or visual activation.
 * WX Phase 1B.5.3: Assist Surface Eligibility diagnostics only — eligibility metadata;
 *                  does NOT render Assist UI, drive chrome occupancy, or activate capabilities
 *                  (hollow permanent assists forbidden without living content).
 * WX Phase 1B.5.4: Progressive Disclosure Continuity diagnostics only — disclosure planning;
 *                  does NOT render disclosure UI, drawers, overlays, or drive chrome.
 * WX Phase 1B.5.5: Tool & Action Surface Presentation diagnostics only — Persistent vs
 *                  Reachable planning for already-authorized tools/shortcuts; does NOT
 *                  change static tool chrome, invent actions, rename IA, or activate chrome.
 * WX Phase 1B.5.6: Honesty Density & Compacted States diagnostics only — density /
 *                  compact planning metadata; does NOT change layout, spacing, visibility,
 *                  chrome, ownership, activation, or apply compaction.
 * WX Phase 1B.5.7: Contextual Priority & Surface Ranking diagnostics only — priority
 *                  metadata; does NOT reorder, render, animate, activate, or change layout.
 *
 * AvailableSpace: width from workspace container; height from visual viewport.
 * NEVER key primary (or any slot) by Mode / posture / mode token / capability /
 * presentation-plan / assist-eligibility / progressive-disclosure / tool-action /
 * honesty-density / context-priority state.
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
  resolveSurfacePresentationFromPlans,
  resolveAssistEligibilityFromPlans,
  resolveProgressiveDisclosureFromPlans,
  resolveToolActionPresentationFromPlans,
  resolveHonestyDensityFromPlans,
  resolveContextPriorityFromPlans,
  resolveContextRelevanceFromPlans,
  WORKSPACE_TRANSITION_CONTINUITY,
  WORKSPACE_SURFACE_REGISTRY,
  WORKSPACE_SURFACE_IDS,
  WORKSPACE_RESERVED_SURFACE_IDS,
  WORKSPACE_SURFACE_PRESENTATION,
  WORKSPACE_ASSIST_ELIGIBILITY,
  WORKSPACE_PROGRESSIVE_DISCLOSURE,
  WORKSPACE_TOOL_ACTION_PRESENTATION,
  WORKSPACE_HONESTY_DENSITY,
  WORKSPACE_CONTEXT_PRIORITY,
  WORKSPACE_CONTEXT_RELEVANCE,
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

  /** WX 1B.5.2 — presentation plan; diagnostics only (does not drive chrome). */
  const presentationPlan = resolveSurfacePresentationFromPlans(
    modePlan,
    capabilityPlan,
  );

  /** WX 1B.5.3 — assist eligibility; diagnostics only (does not render Assist). */
  const assistEligibilityPlan = resolveAssistEligibilityFromPlans(
    modePlan,
    capabilityPlan,
  );

  /** WX 1B.5.4 — progressive disclosure; diagnostics only (does not render disclosure UI). */
  const progressiveDisclosurePlan = resolveProgressiveDisclosureFromPlans(
    modePlan,
    capabilityPlan,
  );

  /** WX 1B.5.5 — tool/action presentation; diagnostics only (static chrome unchanged). */
  const toolActionPlan = resolveToolActionPresentationFromPlans(
    modePlan,
    capabilityPlan,
  );

  /** WX 1B.5.6 — honesty density; diagnostics only (does not apply compaction). */
  const honestyDensityPlan = resolveHonestyDensityFromPlans(
    modePlan,
    capabilityPlan,
  );

  /** WX 1B.5.7 — contextual priority; diagnostics only (does not reorder). */
  const contextPriorityPlan = resolveContextPriorityFromPlans(
    modePlan,
    capabilityPlan,
  );

  /** WX 1B.5.8 — contextual relevance; diagnostics only (does not present). */
  const contextRelevancePlan = resolveContextRelevanceFromPlans(
    modePlan,
    capabilityPlan,
  );

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
      data-wx-phase="1b.5.8"
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
      data-wx-landscape-work={modePlan.posture === "landscape" ? "1" : "0"}
      data-wx-landscape-contract="wx-landscape-work-posture-v1"
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
      data-wx-surface-registry={WORKSPACE_SURFACE_REGISTRY.contractId}
      data-wx-surface-registry-version={WORKSPACE_SURFACE_REGISTRY.contractVersion}
      data-wx-surface-ids={WORKSPACE_SURFACE_IDS.join(",")}
      data-wx-surface-reserved={WORKSPACE_RESERVED_SURFACE_IDS.join(",")}
      data-wx-surface-count={String(WORKSPACE_SURFACE_IDS.length)}
      data-wx-presentation={WORKSPACE_SURFACE_PRESENTATION.contractId}
      data-wx-presentation-plan={WORKSPACE_SURFACE_PRESENTATION.planContractId}
      data-wx-presentation-version={WORKSPACE_SURFACE_PRESENTATION.contractVersion}
      data-wx-presentation-token={presentationPlan.stabilityToken}
      data-wx-presentation-status={presentationPlan.status}
      data-wx-presentation-drives-chrome="0"
      data-wx-presentation-eligible={presentationPlan.eligibleSurfaceIds.join(",")}
      data-wx-presentation-suppressed={presentationPlan.suppressedSurfaceIds.join(
        ",",
      )}
      data-wx-presentation-reserved={presentationPlan.reservedSurfaceIds.join(",")}
      data-wx-presentation-ordered={presentationPlan.orderedSurfaceIds.join(",")}
      data-wx-assist-eligibility={WORKSPACE_ASSIST_ELIGIBILITY.contractId}
      data-wx-assist-eligibility-version={WORKSPACE_ASSIST_ELIGIBILITY.contractVersion}
      data-wx-assist-eligibility-token={assistEligibilityPlan.stabilityToken}
      data-wx-assist-eligibility-status={assistEligibilityPlan.status}
      data-wx-assist-renders="0"
      data-wx-assist-drives-chrome="0"
      data-wx-assist-ids={assistEligibilityPlan.orderedAssistIds.join(",")}
      data-wx-assist-eligible={assistEligibilityPlan.eligibleAssistIds.join(",")}
      data-wx-assist-ineligible={assistEligibilityPlan.ineligibleAssistIds.join(",")}
      data-wx-assist-suppressed={assistEligibilityPlan.suppressedAssistIds.join(",")}
      data-wx-assist-reserved={assistEligibilityPlan.reservedAssistIds.join(",")}
      data-wx-assist-future={assistEligibilityPlan.futureEligibleAssistIds.join(",")}
      data-wx-disclosure={WORKSPACE_PROGRESSIVE_DISCLOSURE.contractId}
      data-wx-disclosure-version={WORKSPACE_PROGRESSIVE_DISCLOSURE.contractVersion}
      data-wx-disclosure-token={progressiveDisclosurePlan.stabilityToken}
      data-wx-disclosure-status={progressiveDisclosurePlan.status}
      data-wx-disclosure-renders="0"
      data-wx-disclosure-drives-chrome="0"
      data-wx-disclosure-ids={progressiveDisclosurePlan.orderedSurfaceIds.join(",")}
      data-wx-disclosure-hidden={progressiveDisclosurePlan.hiddenSurfaceIds.join(",")}
      data-wx-disclosure-discoverable={progressiveDisclosurePlan.discoverableSurfaceIds.join(",")}
      data-wx-disclosure-disclosed={progressiveDisclosurePlan.disclosedSurfaceIds.join(",")}
      data-wx-disclosure-suppressed={progressiveDisclosurePlan.suppressedSurfaceIds.join(",")}
      data-wx-disclosure-reserved={progressiveDisclosurePlan.reservedSurfaceIds.join(",")}
      data-wx-disclosure-future={progressiveDisclosurePlan.futureSurfaceIds.join(",")}
      data-wx-tool-action={WORKSPACE_TOOL_ACTION_PRESENTATION.contractId}
      data-wx-tool-action-version={WORKSPACE_TOOL_ACTION_PRESENTATION.contractVersion}
      data-wx-tool-action-token={toolActionPlan.stabilityToken}
      data-wx-tool-action-status={toolActionPlan.status}
      data-wx-tool-renders="0"
      data-wx-tool-drives-chrome="0"
      data-wx-tool-chrome-activation="0"
      data-wx-tool-static-chrome="1"
      data-wx-tool-ids={toolActionPlan.orderedToolActionIds.join(",")}
      data-wx-tool-persistent={toolActionPlan.persistentToolActionIds.join(",")}
      data-wx-tool-reachable={toolActionPlan.reachableToolActionIds.join(",")}
      data-wx-tool-absent={toolActionPlan.absentToolActionIds.join(",")}
      data-wx-tool-suppressed={toolActionPlan.suppressedToolActionIds.join(",")}
      data-wx-tool-reserved={toolActionPlan.reservedToolActionIds.join(",")}
      data-wx-tool-future={toolActionPlan.futurePersistentToolActionIds.join(",")}
      data-wx-honesty={WORKSPACE_HONESTY_DENSITY.contractId}
      data-wx-honesty-version={WORKSPACE_HONESTY_DENSITY.contractVersion}
      data-wx-honesty-token={honestyDensityPlan.stabilityToken}
      data-wx-honesty-status={honestyDensityPlan.status}
      data-wx-honesty-renders="0"
      data-wx-honesty-drives-chrome="0"
      data-wx-honesty-applies-compaction="0"
      data-wx-density={honestyDensityPlan.orderedSurfaceIds
        .map((id) => `${id}:${honestyDensityPlan.entryById[id].density}`)
        .join(",")}
      data-wx-compact={honestyDensityPlan.orderedSurfaceIds
        .map((id) => `${id}:${honestyDensityPlan.entryById[id].compactState}`)
        .join(",")}
      data-wx-honesty-ids={honestyDensityPlan.orderedSurfaceIds.join(",")}
      data-wx-honesty-empty={honestyDensityPlan.emptySurfaceIds.join(",")}
      data-wx-honesty-sparse={honestyDensityPlan.sparseSurfaceIds.join(",")}
      data-wx-honesty-normal={honestyDensityPlan.normalSurfaceIds.join(",")}
      data-wx-honesty-dense={honestyDensityPlan.denseSurfaceIds.join(",")}
      data-wx-honesty-overflow={honestyDensityPlan.overflowSurfaceIds.join(",")}
      data-wx-honesty-unknown={honestyDensityPlan.unknownSurfaceIds.join(",")}
      data-wx-honesty-compact-none={honestyDensityPlan.compactNoneIds.join(",")}
      data-wx-honesty-compact-optional={honestyDensityPlan.compactOptionalIds.join(
        ",",
      )}
      data-wx-honesty-compact-recommended={honestyDensityPlan.compactRecommendedIds.join(
        ",",
      )}
      data-wx-honesty-compact-required={honestyDensityPlan.compactRequiredIds.join(
        ",",
      )}
      data-wx-context-priority={WORKSPACE_CONTEXT_PRIORITY.contractId}
      data-wx-context-priority-version={WORKSPACE_CONTEXT_PRIORITY.contractVersion}
      data-wx-context-priority-token={contextPriorityPlan.stabilityToken}
      data-wx-context-priority-status={contextPriorityPlan.status}
      data-wx-priority-renders="0"
      data-wx-priority-drives-chrome="0"
      data-wx-priority-applies-ordering="0"
      data-wx-priority={contextPriorityPlan.orderedSurfaceIds
        .map((id) => `${id}:${contextPriorityPlan.entryById[id].priority}`)
        .join(",")}
      data-wx-priority-score={contextPriorityPlan.orderedSurfaceIds
        .map((id) => `${id}:${contextPriorityPlan.entryById[id].priorityScore}`)
        .join(",")}
      data-wx-priority-ids={contextPriorityPlan.orderedSurfaceIds.join(",")}
      data-wx-priority-unknown={contextPriorityPlan.unknownSurfaceIds.join(",")}
      data-wx-priority-low={contextPriorityPlan.lowSurfaceIds.join(",")}
      data-wx-priority-normal={contextPriorityPlan.normalSurfaceIds.join(",")}
      data-wx-priority-high={contextPriorityPlan.highSurfaceIds.join(",")}
      data-wx-priority-critical={contextPriorityPlan.criticalSurfaceIds.join(",")}
      data-wx-context-relevance={WORKSPACE_CONTEXT_RELEVANCE.contractId}
      data-wx-context-relevance-version={WORKSPACE_CONTEXT_RELEVANCE.contractVersion}
      data-wx-context-relevance-token={contextRelevancePlan.stabilityToken}
      data-wx-context-relevance-status={contextRelevancePlan.status}
      data-wx-relevance-renders="0"
      data-wx-relevance-drives-chrome="0"
      data-wx-relevance-applies-ordering="0"
      data-wx-relevance={contextRelevancePlan.orderedSurfaceIds
        .map((id) => `${id}:${contextRelevancePlan.entryById[id].relevance}`)
        .join(",")}
      data-wx-relevance-score={contextRelevancePlan.orderedSurfaceIds
        .map(
          (id) => `${id}:${contextRelevancePlan.entryById[id].relevanceScore}`,
        )
        .join(",")}
      data-wx-relevance-ids={contextRelevancePlan.orderedSurfaceIds.join(",")}
      data-wx-relevance-unknown={contextRelevancePlan.unknownSurfaceIds.join(",")}
      data-wx-relevance-irrelevant={contextRelevancePlan.irrelevantSurfaceIds.join(
        ",",
      )}
      data-wx-relevance-contextual={contextRelevancePlan.contextualSurfaceIds.join(
        ",",
      )}
      data-wx-relevance-important={contextRelevancePlan.importantSurfaceIds.join(
        ",",
      )}
      data-wx-relevance-essential={contextRelevancePlan.essentialSurfaceIds.join(
        ",",
      )}
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
                className={
                  multiCol
                    ? "hc-wx-stage h-full min-h-0 flex flex-col bg-gray-50/40"
                    : "hc-wx-stage min-h-0 flex flex-col bg-gray-50/40"
                }
              >
                <div
                  id="homecheff-feed-desktop"
                  data-aw-primary-feed=""
                  data-aw-stable-feed-slot="1"
                  data-wx-scroll-owner={multiCol ? "feed" : "document"}
                  className={
                    multiCol
                      ? "min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 py-2 sm:px-3 [-webkit-overflow-scrolling:touch] min-w-0 w-full mx-auto space-y-2 sm:space-y-3 hc-home-feed-grid"
                      : "min-w-0 w-full mx-auto space-y-2 sm:space-y-3 hc-home-feed-grid px-2 py-2 sm:px-3"
                  }
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
