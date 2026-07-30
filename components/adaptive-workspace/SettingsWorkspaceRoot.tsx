"use client";

/**
 * Settings Workspace Root — Phase 2F Controlled ON Pilot.
 *
 * Modes:
 * - off: legacy writer only (no observer/resolver)
 * - shadow: legacy writer + measure/resolve diagnostics (Phase 2B–2E)
 * - on: Workspace Region→Slot→Panel writer for settings.hub only
 *
 * Single-writer: ON never mounts a parallel legacy SettingsHubClient tree.
 * Notifications / Messages / Feed: never rendered here.
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  resolveWorkspaceLayout,
  type WorkspaceLayoutPlan,
  type WorkspaceProfile,
} from "@/lib/adaptive-workspace";
import {
  buildChromeOccupancySnapshot,
  coalesceChromeOccupancy,
  coalesceMeasurement,
  coerceAdaptiveWorkspaceSettingsMode,
  createMessagesShadowResolveInput,
  createSettingsInitialPlan,
  createSettingsNotificationsResolveInput,
  createSettingsResolveInput,
  detectChromeOccupancyShell,
  emptyChromeOccupancy,
  emptyMessagesShadowDiagnostics,
  emptyNotificationsShadowDiagnostics,
  extractMessagesShadowDiagnostics,
  extractNotificationsShadowDiagnostics,
  HC_AW_LG_BREAKPOINT_PX,
  readSafeAreaInsetsPx,
  SETTINGS_HUB_WIDGET_ID,
  SETTINGS_PRIMARY_PANEL_ID,
  SETTINGS_PRIMARY_REGION_ID,
  SETTINGS_PRIMARY_SLOT_ID,
  validateSettingsRenderPlan,
  type AdaptiveWorkspaceSettingsMode,
  type MessagesPresentationIntent,
  type NormalizedMeasurement,
  type NotificationsPresentationIntent,
  type SettingsOnPilotDiagnostics,
  type WorkspaceChromeOccupancy,
} from "@/lib/adaptive-workspace-react";
import SettingsWorkspaceShadowRoot from "./SettingsWorkspaceShadowRoot";
import WorkspaceRegion from "./WorkspaceRegion";
import WorkspaceSlot from "./WorkspaceSlot";
import WorkspacePanel from "./WorkspacePanel";
import SettingsWorkspaceWidgetHost from "./SettingsWorkspaceWidgetHost";
import WorkspaceRenderErrorBoundary from "./WorkspaceRenderErrorBoundary";

export type SettingsWorkspaceRootProps = {
  children: ReactNode;
  /**
   * Server-resolved mode (required for hydration safety).
   * Never from query strings, browser storage, or cookies.
   */
  mode: AdaptiveWorkspaceSettingsMode;
  /** Test override — never production user control. */
  modeOverride?: AdaptiveWorkspaceSettingsMode;
  onDiagnostics?: (d: SettingsOnPilotDiagnostics) => void;
  reducedMotion?: boolean;
  chromeOccupancyOverride?: WorkspaceChromeOccupancy | null;
  notificationsPresentationOverride?: NotificationsPresentationIntent | null;
  messagesPresentationOverride?: MessagesPresentationIntent | null;
  pathname?: string;
};

function chromeSafeAreaSummary(o: WorkspaceChromeOccupancy): string {
  const s = o.safeArea;
  return `${s.topPx}/${s.endPx}/${s.bottomPx}/${s.startPx}`;
}

function chromeSourcesSummary(o: WorkspaceChromeOccupancy): string {
  return o.sources.map((x) => x.id).join(",");
}

function baseOnDiagnostics(
  mode: AdaptiveWorkspaceSettingsMode,
  occupancy: WorkspaceChromeOccupancy = emptyChromeOccupancy(),
): SettingsOnPilotDiagnostics {
  return {
    compatibilityMode: mode === "off" ? "off" : mode === "on" ? "on" : "shadow",
    surfaceId: "settings",
    widthPx: 0,
    heightPx: 0,
    rawWidthPx: 0,
    rawHeightPx: 0,
    usableWidthPx: 0,
    usableHeightPx: 0,
    stabilityToken: "",
    resolveStabilityToken: "",
    profile: null,
    primaryWidgetId: null,
    renderActivation: false,
    panelCount: 0,
    diagnosticCodes: [],
    resolveCount: 0,
    lastStatus: mode === "off" ? "skipped" : "idle",
    chromeSchemaVersion: occupancy.schemaVersion,
    chromeTopPx: occupancy.topPx,
    chromeBottomPx: occupancy.bottomPx,
    chromeStartPx: occupancy.startPx,
    chromeEndPx: occupancy.endPx,
    chromeSafeAreaSummary: chromeSafeAreaSummary(occupancy),
    chromeSources: chromeSourcesSummary(occupancy),
    chromeStabilityToken: occupancy.stabilityToken,
    chromeUpdateCount: 0,
    chromeIgnoredIdenticalCount: 0,
    chromeAppliedToUsableSpace: false,
    lastNormalizationStatus: mode === "off" ? "skipped" : "idle",
    notifications: emptyNotificationsShadowDiagnostics(),
    messages: emptyMessagesShadowDiagnostics(),
    effectiveMode: mode,
    requestedMode: mode,
    modeSource: "override",
    renderOwner: mode === "on" ? "workspace" : "legacy",
    planValidationStatus: "idle",
    fallbackActive: false,
    renderedSurface: "settings",
    renderedRegionId: null,
    renderedSlotId: null,
    renderedPanelId: null,
    renderedWidgetId: null,
    preservationKey: null,
    planToken: "",
    singleWriterStatus: "ok",
    rejectedWidgetIds: "",
    ignoredMeasurementCount: 0,
  };
}

/**
 * Stable ON tree: Region→Slot→Panel→settings.hub host.
 * Structure never switches on profile/plan/fallback diagnostics (continuity).
 * Hard Error Boundary recovery may remount — documented separately.
 */
function SettingsOnTree({ children }: { children: ReactNode }) {
  return (
    <WorkspaceRegion regionId={SETTINGS_PRIMARY_REGION_ID}>
      <WorkspaceSlot
        slotId={SETTINGS_PRIMARY_SLOT_ID}
        regionId={SETTINGS_PRIMARY_REGION_ID}
      >
        <WorkspacePanel
          panelId={SETTINGS_PRIMARY_PANEL_ID}
          slotId={SETTINGS_PRIMARY_SLOT_ID}
          widgetId={SETTINGS_HUB_WIDGET_ID}
          mode="stage"
        >
          <SettingsWorkspaceWidgetHost
            widgetId={SETTINGS_HUB_WIDGET_ID}
            preservationKey={SETTINGS_HUB_WIDGET_ID}
          >
            {children}
          </SettingsWorkspaceWidgetHost>
        </WorkspacePanel>
      </WorkspaceSlot>
    </WorkspaceRegion>
  );
}

function SettingsWorkspaceOnRoot({
  children,
  mode,
  onDiagnostics,
  reducedMotion = false,
  chromeOccupancyOverride,
  notificationsPresentationOverride = null,
  messagesPresentationOverride = null,
  pathname = "/settings",
}: Omit<SettingsWorkspaceRootProps, "modeOverride"> & {
  mode: "on";
}) {
  const initialPlan = useMemo(
    () => createSettingsInitialPlan({ compatibilityMode: "on" }),
    [],
  );

  const measureRef = useRef<HTMLDivElement | null>(null);
  const stableMeasureRef = useRef<NormalizedMeasurement | null>(null);
  const stableOccupancyRef = useRef<WorkspaceChromeOccupancy>(
    emptyChromeOccupancy(),
  );
  const notificationsIntentRef = useRef(notificationsPresentationOverride);
  notificationsIntentRef.current = notificationsPresentationOverride;
  const messagesIntentRef = useRef(messagesPresentationOverride);
  messagesIntentRef.current = messagesPresentationOverride;

  const resolveCountRef = useRef(0);
  const chromeUpdateCountRef = useRef(0);
  const chromeIgnoredRef = useRef(0);
  const ignoredMeasurementRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const onDiagnosticsRef = useRef(onDiagnostics);
  onDiagnosticsRef.current = onDiagnostics;

  const [fallbackActive, setFallbackActive] = useState(false);
  const [diagnostics, setDiagnostics] = useState<SettingsOnPilotDiagnostics>(
    () => {
      const v = validateSettingsRenderPlan(initialPlan, "on");
      const d = baseOnDiagnostics("on");
      return {
        ...d,
        renderActivation: true,
        renderOwner: "workspace",
        primaryWidgetId: SETTINGS_HUB_WIDGET_ID,
        panelCount: 1,
        profile: initialPlan.profile,
        planValidationStatus: v.ok ? "ok" : "invalid",
        fallbackActive: !v.ok,
        renderedRegionId: SETTINGS_PRIMARY_REGION_ID,
        renderedSlotId: SETTINGS_PRIMARY_SLOT_ID,
        renderedPanelId: SETTINGS_PRIMARY_PANEL_ID,
        renderedWidgetId: SETTINGS_HUB_WIDGET_ID,
        preservationKey: SETTINGS_HUB_WIDGET_ID,
        planToken: initialPlan.diagnostics.availableSpaceSummary.stabilityToken,
        lastStatus: v.ok ? "ok" : "fallback",
        diagnosticCodes: v.ok ? [] : [v.code],
      };
    },
  );

  // Fail closed if initial plan invalid (should not happen for canonical plan).
  useEffect(() => {
    const v = validateSettingsRenderPlan(initialPlan, "on");
    if (!v.ok) setFallbackActive(true);
  }, [initialPlan]);

  const publish = useCallback((next: SettingsOnPilotDiagnostics) => {
    setDiagnostics(next);
    onDiagnosticsRef.current?.(next);
  }, []);

  const applyPlan = useCallback(
    (
      plan: WorkspaceLayoutPlan,
      measurement: NormalizedMeasurement,
      occupancy: WorkspaceChromeOccupancy,
      extra?: Partial<SettingsOnPilotDiagnostics>,
    ) => {
      const validation = validateSettingsRenderPlan(plan, "on");
      if (!validation.ok) {
        setFallbackActive(true);
        publish({
          ...baseOnDiagnostics("on", occupancy),
          widthPx: measurement.widthPx,
          heightPx: measurement.heightPx,
          rawWidthPx: measurement.widthPx,
          rawHeightPx: measurement.heightPx,
          usableWidthPx: measurement.widthPx,
          usableHeightPx: measurement.heightPx,
          stabilityToken: measurement.stabilityToken,
          resolveStabilityToken: plan.diagnostics.availableSpaceSummary.stabilityToken,
          profile: plan.profile,
          primaryWidgetId: plan.primaryWidgetId,
          renderActivation: false,
          panelCount: plan.panels.length,
          diagnosticCodes: [validation.code, ...plan.diagnostics.diagnosticCodes],
          resolveCount: resolveCountRef.current,
          lastStatus: "fallback",
          chromeUpdateCount: chromeUpdateCountRef.current,
          chromeIgnoredIdenticalCount: chromeIgnoredRef.current,
          chromeSchemaVersion: occupancy.schemaVersion,
          chromeTopPx: occupancy.topPx,
          chromeBottomPx: occupancy.bottomPx,
          chromeStartPx: occupancy.startPx,
          chromeEndPx: occupancy.endPx,
          chromeSafeAreaSummary: chromeSafeAreaSummary(occupancy),
          chromeSources: chromeSourcesSummary(occupancy),
          chromeStabilityToken: occupancy.stabilityToken,
          chromeAppliedToUsableSpace: occupancy.appliedToUsableSpace,
          lastNormalizationStatus: "ok",
          planValidationStatus: "invalid",
          fallbackActive: true,
          renderOwner: "legacy-fallback",
          singleWriterStatus: "ok",
          rejectedWidgetIds: plan.placements
            .map((p) => p.widgetId)
            .filter((id) => id !== SETTINGS_HUB_WIDGET_ID)
            .join(","),
          ignoredMeasurementCount: ignoredMeasurementRef.current,
          ...extra,
        });
        return;
      }

      // Valid plan: keep stable Region/Slot/Panel tree (no remount).
      setFallbackActive(false);
      const placement = plan.placements.find(
        (p) => p.widgetId === SETTINGS_HUB_WIDGET_ID,
      )!;

      let messages = emptyMessagesShadowDiagnostics();
      const messagesIntent = messagesIntentRef.current;
      if (messagesIntent) {
        try {
          const shell = detectChromeOccupancyShell(
            typeof document !== "undefined"
              ? document.documentElement.classList
              : null,
          );
          const msgBuilt = createMessagesShadowResolveInput({
            measurement,
            compatibilityMode: "shadow",
            chromeOccupancy: occupancy,
            shell,
            messagesPresentation: {
              ...messagesIntent,
              reducedMotion: messagesIntent.reducedMotion ?? reducedMotion,
            },
          });
          const msgPlan = resolveWorkspaceLayout(msgBuilt.input);
          messages = extractMessagesShadowDiagnostics(
            msgPlan,
            messagesIntent,
            msgBuilt.primaryTask,
          );
        } catch {
          messages = {
            ...emptyMessagesShadowDiagnostics(),
            diagnosticCodes: "AW.MESSAGES.SHADOW_RESOLVE_ERROR",
          };
        }
      }

      let notifications = emptyNotificationsShadowDiagnostics();
      const notificationsIntent = notificationsIntentRef.current;
      if (notificationsIntent) {
        try {
          const shell = detectChromeOccupancyShell(
            typeof document !== "undefined"
              ? document.documentElement.classList
              : null,
          );
          // Fixture diagnostics only — separate from the ON render plan (settings.hub only).
          const { input, notificationsRequestKind } =
            createSettingsNotificationsResolveInput({
              measurement,
              compatibilityMode: "shadow",
              reducedMotion,
              chromeOccupancy: occupancy,
              shell,
              notificationsPresentation: notificationsIntent,
            });
          const nPlan = resolveWorkspaceLayout(input);
          notifications = extractNotificationsShadowDiagnostics(
            nPlan,
            notificationsRequestKind,
          );
        } catch {
          notifications = {
            ...emptyNotificationsShadowDiagnostics(),
            diagnosticCodes: "AW.NOTIFICATIONS.SHADOW_RESOLVE_ERROR",
          };
        }
      } else {
        notifications = extractNotificationsShadowDiagnostics(plan, "none");
      }

      publish({
        compatibilityMode: "on",
        surfaceId: "settings",
        widthPx: measurement.widthPx,
        heightPx: measurement.heightPx,
        rawWidthPx: measurement.widthPx,
        rawHeightPx: measurement.heightPx,
        usableWidthPx: measurement.widthPx,
        usableHeightPx: measurement.heightPx,
        stabilityToken: measurement.stabilityToken,
        resolveStabilityToken:
          plan.diagnostics.availableSpaceSummary.stabilityToken,
        profile: plan.profile as WorkspaceProfile,
        primaryWidgetId: SETTINGS_HUB_WIDGET_ID,
        renderActivation: true,
        panelCount: 1,
        diagnosticCodes: plan.diagnostics.diagnosticCodes,
        resolveCount: resolveCountRef.current,
        lastStatus: "ok",
        chromeSchemaVersion: occupancy.schemaVersion,
        chromeTopPx: occupancy.topPx,
        chromeBottomPx: occupancy.bottomPx,
        chromeStartPx: occupancy.startPx,
        chromeEndPx: occupancy.endPx,
        chromeSafeAreaSummary: chromeSafeAreaSummary(occupancy),
        chromeSources: chromeSourcesSummary(occupancy),
        chromeStabilityToken: occupancy.stabilityToken,
        chromeUpdateCount: chromeUpdateCountRef.current,
        chromeIgnoredIdenticalCount: chromeIgnoredRef.current,
        chromeAppliedToUsableSpace: occupancy.appliedToUsableSpace,
        lastNormalizationStatus: "ok",
        notifications,
        messages,
        effectiveMode: "on",
        requestedMode: "on",
        modeSource: "override",
        renderOwner: "workspace",
        planValidationStatus: "ok",
        fallbackActive: false,
        renderedSurface: "settings",
        renderedRegionId: SETTINGS_PRIMARY_REGION_ID,
        renderedSlotId: placement.slotId,
        renderedPanelId: placement.panelId,
        renderedWidgetId: SETTINGS_HUB_WIDGET_ID,
        preservationKey: placement.statePreservationKey,
        planToken: plan.diagnostics.availableSpaceSummary.stabilityToken,
        singleWriterStatus: "ok",
        rejectedWidgetIds: "",
        ignoredMeasurementCount: ignoredMeasurementRef.current,
        ...extra,
      });
    },
    [publish, reducedMotion],
  );

  const runResolve = useCallback(
    (
      measurement: NormalizedMeasurement,
      occupancy: WorkspaceChromeOccupancy,
    ) => {
      try {
        const shell = detectChromeOccupancyShell(
          typeof document !== "undefined"
            ? document.documentElement.classList
            : null,
        );
        // Settings ON resolve: settings.hub only — never include Notifications/Messages
        // panelRequests in the production render plan.
        const input = createSettingsResolveInput({
          measurement,
          compatibilityMode: "on",
          reducedMotion,
          chromeOccupancy: occupancy,
          shell,
        });
        const plan = resolveWorkspaceLayout(input);
        resolveCountRef.current += 1;
        applyPlan(plan, measurement, occupancy);
      } catch (err) {
        setFallbackActive(true);
        publish({
          ...baseOnDiagnostics("on", occupancy),
          widthPx: measurement.widthPx,
          heightPx: measurement.heightPx,
          rawWidthPx: measurement.widthPx,
          rawHeightPx: measurement.heightPx,
          usableWidthPx: measurement.widthPx,
          usableHeightPx: measurement.heightPx,
          stabilityToken: measurement.stabilityToken,
          resolveCount: resolveCountRef.current,
          chromeUpdateCount: chromeUpdateCountRef.current,
          chromeIgnoredIdenticalCount: chromeIgnoredRef.current,
          lastStatus: "error",
          lastNormalizationStatus: "error",
          lastErrorCode:
            err && typeof err === "object" && "code" in err
              ? String((err as { code: unknown }).code)
              : "AW.ON.RESOLVE_ERROR",
          planValidationStatus: "error",
          fallbackActive: true,
          renderOwner: "legacy-fallback",
          renderActivation: false,
          ignoredMeasurementCount: ignoredMeasurementRef.current,
        });
      }
    },
    [applyPlan, publish, reducedMotion],
  );

  const tryResolve = useCallback(() => {
    const measurement = stableMeasureRef.current;
    if (!measurement) return;
    runResolve(measurement, stableOccupancyRef.current);
  }, [runResolve]);

  useEffect(() => {
    tryResolve();
  }, [
    notificationsPresentationOverride,
    messagesPresentationOverride,
    tryResolve,
  ]);

  useEffect(() => {
    if (chromeOccupancyOverride != null) {
      const { shouldUpdate, next, ignoredIdentical } = coalesceChromeOccupancy(
        stableOccupancyRef.current,
        chromeOccupancyOverride,
      );
      if (ignoredIdentical) chromeIgnoredRef.current += 1;
      if (shouldUpdate) {
        chromeUpdateCountRef.current += 1;
        stableOccupancyRef.current = next;
        tryResolve();
      }
      return;
    }

    const readOccupancy = (): WorkspaceChromeOccupancy => {
      const shell = detectChromeOccupancyShell(
        document.documentElement.classList,
      );
      const viewportWidthPx =
        typeof window !== "undefined" ? window.innerWidth : null;
      const safeArea = readSafeAreaInsetsPx(document);
      return buildChromeOccupancySnapshot({
        shell,
        pathname,
        viewportWidthPx,
        safeArea,
      });
    };

    const apply = () => {
      const snap = readOccupancy();
      const { shouldUpdate, next, ignoredIdentical } = coalesceChromeOccupancy(
        stableOccupancyRef.current,
        snap,
      );
      if (ignoredIdentical) {
        chromeIgnoredRef.current += 1;
        return;
      }
      if (!shouldUpdate) return;
      chromeUpdateCountRef.current += 1;
      stableOccupancyRef.current = next;
      tryResolve();
    };

    apply();
    const mql =
      typeof window !== "undefined"
        ? window.matchMedia(`(max-width: ${HC_AW_LG_BREAKPOINT_PX - 1}px)`)
        : null;
    const onMql = () => apply();
    mql?.addEventListener?.("change", onMql);
    return () => {
      mql?.removeEventListener?.("change", onMql);
    };
  }, [pathname, chromeOccupancyOverride, tryResolve]);

  useEffect(() => {
    const el = measureRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      publish({
        ...baseOnDiagnostics("on", stableOccupancyRef.current),
        lastStatus: "error",
        lastNormalizationStatus: "error",
        lastErrorCode: "AW.ON.NO_OBSERVER",
        planValidationStatus: "error",
        fallbackActive: true,
        renderOwner: "legacy-fallback",
      });
      setFallbackActive(true);
      return;
    }

    const schedule = (width: number, height: number) => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const { shouldResolve, next } = coalesceMeasurement(
          stableMeasureRef.current,
          { widthPx: width, heightPx: height },
        );
        if (!shouldResolve || !next) {
          ignoredMeasurementRef.current += 1;
          return;
        }
        stableMeasureRef.current = next;
        runResolve(next, stableOccupancyRef.current);
      });
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentBoxSize?.[0]
        ? {
            width: entry.contentBoxSize[0].inlineSize,
            height: entry.contentBoxSize[0].blockSize,
          }
        : {
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          };
      schedule(box.width, box.height);
    });

    observer.observe(el);
    schedule(el.clientWidth, el.clientHeight);

    return () => {
      observer.disconnect();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [publish, runResolve]);

  const n = diagnostics.notifications;
  const m = diagnostics.messages;
  const usingFallback = fallbackActive;

  // Error-boundary fallback keeps the same Region→Slot→Panel host when possible
  // so a soft recovery path does not invent a second writer. Hard crashes may still remount.
  const boundaryFallback = <SettingsOnTree>{children}</SettingsOnTree>;

  return (
    <div
      ref={measureRef}
      data-aw-settings-workspace-root=""
      data-aw-settings-on-root=""
      data-aw-mode="on"
      data-aw-render-owner={usingFallback ? "legacy-fallback" : "workspace"}
      data-aw-render-activation={String(
        usingFallback ? false : diagnostics.renderActivation,
      )}
      data-aw-profile={diagnostics.profile ?? ""}
      data-aw-stability-token={
        diagnostics.resolveStabilityToken || diagnostics.stabilityToken
      }
      data-aw-resolve-count={String(diagnostics.resolveCount)}
      data-aw-last-status={diagnostics.lastStatus}
      data-aw-primary-widget={diagnostics.primaryWidgetId ?? ""}
      data-aw-fallback={usingFallback ? "1" : "0"}
      data-aw-plan-validation={diagnostics.planValidationStatus}
      data-aw-single-writer={diagnostics.singleWriterStatus}
      data-aw-chrome-token={diagnostics.chromeStabilityToken}
      data-aw-chrome-top={String(diagnostics.chromeTopPx)}
      data-aw-chrome-bottom={String(diagnostics.chromeBottomPx)}
      data-aw-chrome-applied={String(diagnostics.chromeAppliedToUsableSpace)}
      data-aw-usable-w={String(diagnostics.usableWidthPx)}
      data-aw-usable-h={String(diagnostics.usableHeightPx)}
      data-aw-region-id={diagnostics.renderedRegionId ?? ""}
      data-aw-slot-id={diagnostics.renderedSlotId ?? ""}
      data-aw-panel-id={diagnostics.renderedPanelId ?? ""}
      data-aw-widget-id={diagnostics.renderedWidgetId ?? ""}
      data-aw-preservation-key={diagnostics.preservationKey ?? ""}
      data-aw-notifications-candidate={n.candidate ? "1" : "0"}
      data-aw-notifications-request={n.request}
      data-aw-messages-scenario={m.scenario}
      data-aw-messages-primary-widget={m.primaryWidget}
      className="w-full min-w-0"
    >
      <WorkspaceRenderErrorBoundary
        fallback={boundaryFallback}
        onError={() => {
          setFallbackActive(true);
        }}
      >
        <SettingsOnTree>{children}</SettingsOnTree>
      </WorkspaceRenderErrorBoundary>
    </div>
  );
}

export default function SettingsWorkspaceRoot({
  children,
  mode: modeProp,
  modeOverride,
  onDiagnostics,
  reducedMotion,
  chromeOccupancyOverride,
  notificationsPresentationOverride,
  messagesPresentationOverride,
  pathname,
}: SettingsWorkspaceRootProps) {
  const mode = coerceAdaptiveWorkspaceSettingsMode(
    modeOverride ?? modeProp,
  );

  // OFF / SHADOW: legacy is the sole Settings writer (Phase 2B Shadow Root).
  if (mode === "off" || mode === "shadow") {
    return (
      <SettingsWorkspaceShadowRoot
        modeOverride={mode}
        onDiagnostics={
          onDiagnostics
            ? (d) =>
                onDiagnostics({
                  ...d,
                  effectiveMode: mode,
                  requestedMode: mode,
                  modeSource: modeOverride ? "override" : "env",
                  renderOwner: "legacy",
                  planValidationStatus: "idle",
                  fallbackActive: false,
                  renderedSurface: "settings",
                  renderedRegionId: null,
                  renderedSlotId: null,
                  renderedPanelId: null,
                  renderedWidgetId: null,
                  preservationKey: null,
                  planToken: d.resolveStabilityToken,
                  singleWriterStatus: "ok",
                  rejectedWidgetIds: "",
                  ignoredMeasurementCount: 0,
                })
            : undefined
        }
        reducedMotion={reducedMotion}
        chromeOccupancyOverride={chromeOccupancyOverride}
        notificationsPresentationOverride={notificationsPresentationOverride}
        messagesPresentationOverride={messagesPresentationOverride}
        pathname={pathname}
      >
        {children}
      </SettingsWorkspaceShadowRoot>
    );
  }

  // ON: Workspace is the sole layout writer for settings.hub.
  return (
    <SettingsWorkspaceOnRoot
      mode="on"
      onDiagnostics={onDiagnostics}
      reducedMotion={reducedMotion}
      chromeOccupancyOverride={chromeOccupancyOverride}
      notificationsPresentationOverride={notificationsPresentationOverride}
      messagesPresentationOverride={messagesPresentationOverride}
      pathname={pathname}
    >
      {children}
    </SettingsWorkspaceOnRoot>
  );
}
