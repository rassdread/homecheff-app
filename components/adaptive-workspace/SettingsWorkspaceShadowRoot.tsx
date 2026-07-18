"use client";

/**
 * Settings Workspace Shadow Root — Phase 2B.
 *
 * HOMEPAGE / FEED: not touched.
 * Chrome occupancy adapters: Phase 2C.
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
  coalesceMeasurement,
  coerceAdaptiveWorkspaceSettingsMode,
  createSettingsResolveInput,
  resolveAdaptiveWorkspaceSettingsMode,
  type AdaptiveWorkspaceSettingsMode,
  type NormalizedMeasurement,
  type SettingsShadowDiagnostics,
} from "@/lib/adaptive-workspace-react";

export type SettingsWorkspaceShadowRootProps = {
  children: ReactNode;
  /** Test override only — never sourced from query params or browser storage in production paths. */
  modeOverride?: AdaptiveWorkspaceSettingsMode | "on";
  /** Test/dev callback — not an event bus. */
  onDiagnostics?: (d: SettingsShadowDiagnostics) => void;
  /** Prefer reduced motion when known (optional). */
  reducedMotion?: boolean;
};

function emptyDiagnostics(
  mode: AdaptiveWorkspaceSettingsMode,
): SettingsShadowDiagnostics {
  return {
    compatibilityMode: mode === "off" ? "off" : "shadow",
    surfaceId: "settings",
    widthPx: 0,
    heightPx: 0,
    stabilityToken: "",
    profile: null,
    primaryWidgetId: null,
    renderActivation: false,
    panelCount: 0,
    diagnosticCodes: mode === "off" ? ["AW.COMPAT.OFF"] : [],
    resolveCount: 0,
    lastStatus: mode === "off" ? "skipped" : "idle",
  };
}

export default function SettingsWorkspaceShadowRoot({
  children,
  modeOverride,
  onDiagnostics,
  reducedMotion = false,
}: SettingsWorkspaceShadowRootProps) {
  const mode = coerceAdaptiveWorkspaceSettingsMode(
    modeOverride ?? resolveAdaptiveWorkspaceSettingsMode(),
  );

  const measureRef = useRef<HTMLDivElement | null>(null);
  const stableRef = useRef<NormalizedMeasurement | null>(null);
  const resolveCountRef = useRef(0);
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
    (measurement: NormalizedMeasurement) => {
      try {
        const input = createSettingsResolveInput({
          measurement,
          // Shadow: always ask pure core for shadow; never ON.
          compatibilityMode: "shadow",
          reducedMotion,
        });
        const plan: WorkspaceLayoutPlan = resolveWorkspaceLayout(input);
        resolveCountRef.current += 1;

        // Fail closed: even if plan somehow activates, UI must not use it.
        const renderActivation = false;

        publish({
          compatibilityMode: "shadow",
          surfaceId: "settings",
          widthPx: measurement.widthPx,
          heightPx: measurement.heightPx,
          stabilityToken: measurement.stabilityToken,
          profile: plan.profile,
          primaryWidgetId: plan.primaryWidgetId,
          renderActivation,
          panelCount: plan.panels.length,
          diagnosticCodes: plan.diagnostics.diagnosticCodes,
          resolveCount: resolveCountRef.current,
          lastStatus: plan.primaryWidgetId ? "ok" : "fallback",
        });
      } catch (err) {
        publish({
          ...emptyDiagnostics("shadow"),
          widthPx: measurement.widthPx,
          heightPx: measurement.heightPx,
          stabilityToken: measurement.stabilityToken,
          resolveCount: resolveCountRef.current,
          lastStatus: "error",
          lastErrorCode:
            err && typeof err === "object" && "code" in err
              ? String((err as { code: unknown }).code)
              : "AW.SHADOW.RESOLVE_ERROR",
        });
      }
    },
    [publish, reducedMotion],
  );

  useEffect(() => {
    if (mode === "off") {
      publish(emptyDiagnostics("off"));
      return;
    }

    const el = measureRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      publish({
        ...emptyDiagnostics("shadow"),
        lastStatus: "error",
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
          stableRef.current,
          { widthPx: width, heightPx: height },
        );
        if (!shouldResolve || !next) return;
        stableRef.current = next;
        runResolve(next);
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
    // Initial measurement without waiting for a resize event.
    schedule(el.clientWidth, el.clientHeight);

    return () => {
      observer.disconnect();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [mode, publish, runResolve]);

  // Neutral block wrapper (not display:contents — RO needs a principal box).
  // No landmark role; children keep their own <main>/<nav>.
  return (
    <div
      ref={measureRef}
      data-aw-settings-shadow-root=""
      data-aw-mode={mode}
      data-aw-render-activation={String(diagnostics.renderActivation)}
      data-aw-profile={diagnostics.profile ?? ""}
      data-aw-stability-token={diagnostics.stabilityToken}
      data-aw-resolve-count={String(diagnostics.resolveCount)}
      data-aw-last-status={diagnostics.lastStatus}
      data-aw-primary-widget={diagnostics.primaryWidgetId ?? ""}
      className="w-full min-w-0"
    >
      {/* Stable child host: never keyed by profile/width/plan */}
      <div data-aw-settings-content="">{children}</div>
    </div>
  );
}
