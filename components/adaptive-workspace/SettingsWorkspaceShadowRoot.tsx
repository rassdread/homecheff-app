"use client";

/**
 * Settings Workspace Shadow Root — Phase 2B + 2C.
 *
 * HOMEPAGE / FEED: not touched.
 * Chrome occupancy: read-only diagnostic snapshot (MODEL A container-first).
 *
 * Shadow mode: measure + resolve for diagnostics only.
 * Existing Settings UI remains the sole layout writer.
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  resolveWorkspaceLayout,
  type WorkspaceLayoutPlan,
} from "@/lib/adaptive-workspace";
import {
  buildChromeOccupancySnapshot,
  coalesceChromeOccupancy,
  coalesceMeasurement,
  coerceAdaptiveWorkspaceSettingsMode,
  createSettingsResolveInput,
  detectChromeOccupancyShell,
  emptyChromeOccupancy,
  HC_AW_LG_BREAKPOINT_PX,
  readSafeAreaInsetsPx,
  resolveAdaptiveWorkspaceSettingsMode,
  type AdaptiveWorkspaceSettingsMode,
  type NormalizedMeasurement,
  type SettingsShadowDiagnostics,
  type WorkspaceChromeOccupancy,
} from "@/lib/adaptive-workspace-react";

export type SettingsWorkspaceShadowRootProps = {
  children: ReactNode;
  /** Test override only — never sourced from query params or browser storage in production paths. */
  modeOverride?: AdaptiveWorkspaceSettingsMode | "on";
  /** Test/dev callback — not an event bus. */
  onDiagnostics?: (d: SettingsShadowDiagnostics) => void;
  /** Prefer reduced motion when known (optional). */
  reducedMotion?: boolean;
  /** Test override for chrome occupancy (skip live shell read). */
  chromeOccupancyOverride?: WorkspaceChromeOccupancy | null;
  /**
   * Settings pilot defaults to `/settings` (no Next router dependency).
   * Used only for legacy bottom-nav visibility — never mutates URL.
   */
  pathname?: string;
};

function chromeSafeAreaSummary(o: WorkspaceChromeOccupancy): string {
  const s = o.safeArea;
  return `${s.topPx}/${s.endPx}/${s.bottomPx}/${s.startPx}`;
}

function chromeSourcesSummary(o: WorkspaceChromeOccupancy): string {
  return o.sources.map((x) => x.id).join(",");
}

function emptyDiagnostics(
  mode: AdaptiveWorkspaceSettingsMode,
  occupancy: WorkspaceChromeOccupancy = emptyChromeOccupancy(),
): SettingsShadowDiagnostics {
  return {
    compatibilityMode: mode === "off" ? "off" : "shadow",
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
    diagnosticCodes: mode === "off" ? ["AW.COMPAT.OFF"] : [],
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
  };
}

export default function SettingsWorkspaceShadowRoot({
  children,
  modeOverride,
  onDiagnostics,
  reducedMotion = false,
  chromeOccupancyOverride,
  pathname = "/settings",
}: SettingsWorkspaceShadowRootProps) {
  const mode = coerceAdaptiveWorkspaceSettingsMode(
    modeOverride ?? resolveAdaptiveWorkspaceSettingsMode(),
  );

  const measureRef = useRef<HTMLDivElement | null>(null);
  const stableMeasureRef = useRef<NormalizedMeasurement | null>(null);
  const stableOccupancyRef = useRef<WorkspaceChromeOccupancy>(
    emptyChromeOccupancy(),
  );
  const resolveCountRef = useRef(0);
  const chromeUpdateCountRef = useRef(0);
  const chromeIgnoredRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const onDiagnosticsRef = useRef(onDiagnostics);
  onDiagnosticsRef.current = onDiagnostics;

  const [diagnostics, setDiagnostics] = useState<SettingsShadowDiagnostics>(
    () => emptyDiagnostics(mode),
  );

  const publish = useCallback((next: SettingsShadowDiagnostics) => {
    setDiagnostics(next);
    onDiagnosticsRef.current?.(next);
  }, []);

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
        const input = createSettingsResolveInput({
          measurement,
          compatibilityMode: "shadow",
          reducedMotion,
          chromeOccupancy: occupancy,
          shell,
        });
        const plan: WorkspaceLayoutPlan = resolveWorkspaceLayout(input);
        resolveCountRef.current += 1;

        const renderActivation = false;
        const token = input.availableSpace.stabilityToken;

        publish({
          compatibilityMode: "shadow",
          surfaceId: "settings",
          widthPx: measurement.widthPx,
          heightPx: measurement.heightPx,
          rawWidthPx: measurement.widthPx,
          rawHeightPx: measurement.heightPx,
          usableWidthPx: measurement.widthPx,
          usableHeightPx: measurement.heightPx,
          stabilityToken: measurement.stabilityToken,
          resolveStabilityToken: token,
          profile: plan.profile,
          primaryWidgetId: plan.primaryWidgetId,
          renderActivation,
          panelCount: plan.panels.length,
          diagnosticCodes: plan.diagnostics.diagnosticCodes,
          resolveCount: resolveCountRef.current,
          lastStatus: plan.primaryWidgetId ? "ok" : "fallback",
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
        });
      } catch (err) {
        publish({
          ...emptyDiagnostics("shadow", occupancy),
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
              : "AW.SHADOW.RESOLVE_ERROR",
        });
      }
    },
    [publish, reducedMotion],
  );

  const tryResolve = useCallback(() => {
    const measurement = stableMeasureRef.current;
    const occupancy = stableOccupancyRef.current;
    if (!measurement) return;
    runResolve(measurement, occupancy);
  }, [runResolve]);

  // Chrome occupancy owner — policy + matchMedia (no chrome ResizeObserver).
  useEffect(() => {
    if (mode === "off") {
      publish(emptyDiagnostics("off"));
      return;
    }

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
  }, [mode, pathname, chromeOccupancyOverride, publish, tryResolve]);

  // Container measurement owner — one ResizeObserver.
  useEffect(() => {
    if (mode === "off") {
      return;
    }

    const el = measureRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      publish({
        ...emptyDiagnostics("shadow", stableOccupancyRef.current),
        lastStatus: "error",
        lastNormalizationStatus: "error",
        lastErrorCode: "AW.SHADOW.NO_OBSERVER",
      });
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
        if (!shouldResolve || !next) return;
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
  }, [mode, publish, runResolve]);

  return (
    <div
      ref={measureRef}
      data-aw-settings-shadow-root=""
      data-aw-mode={mode}
      data-aw-render-activation={String(diagnostics.renderActivation)}
      data-aw-profile={diagnostics.profile ?? ""}
      data-aw-stability-token={diagnostics.resolveStabilityToken || diagnostics.stabilityToken}
      data-aw-resolve-count={String(diagnostics.resolveCount)}
      data-aw-last-status={diagnostics.lastStatus}
      data-aw-primary-widget={diagnostics.primaryWidgetId ?? ""}
      data-aw-chrome-token={diagnostics.chromeStabilityToken}
      data-aw-chrome-top={String(diagnostics.chromeTopPx)}
      data-aw-chrome-bottom={String(diagnostics.chromeBottomPx)}
      data-aw-chrome-applied={String(diagnostics.chromeAppliedToUsableSpace)}
      data-aw-usable-w={String(diagnostics.usableWidthPx)}
      data-aw-usable-h={String(diagnostics.usableHeightPx)}
      className="w-full min-w-0"
    >
      {/* Stable child host: never keyed by profile/width/plan/occupancy */}
      <div data-aw-settings-content="">{children}</div>
    </div>
  );
}
