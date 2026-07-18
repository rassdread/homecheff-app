/**
 * Read-only shell detection for chrome occupancy — no Capacitor import in pure core.
 * Uses existing early HTML classes from app/layout.tsx / PWA bootstrap.
 */

import type { ChromeOccupancyShell } from "./chrome-occupancy-types";

export function detectChromeOccupancyShell(
  classList: { contains(token: string): boolean } | null | undefined,
): ChromeOccupancyShell {
  if (!classList) return "web";
  if (classList.contains("hc-native-capacitor")) return "native";
  if (classList.contains("hc-pwa-standalone")) return "pwa";
  return "web";
}

/**
 * Best-effort safe-area px from CSS env via a probe element.
 * Returns zeros when DOM unavailable (SSR) or parse fails.
 */
export function readSafeAreaInsetsPx(
  doc: Document | null | undefined,
): { topPx: number; bottomPx: number; startPx: number; endPx: number } {
  const zero = { topPx: 0, bottomPx: 0, startPx: 0, endPx: 0 };
  if (!doc?.body || typeof getComputedStyle === "undefined") return zero;
  try {
    const probe = doc.createElement("div");
    probe.style.cssText =
      "position:fixed;visibility:hidden;pointer-events:none;" +
      "padding-top:env(safe-area-inset-top,0px);" +
      "padding-bottom:env(safe-area-inset-bottom,0px);" +
      "padding-left:env(safe-area-inset-left,0px);" +
      "padding-right:env(safe-area-inset-right,0px);";
    doc.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const parse = (v: string) => {
      const n = Number.parseFloat(v);
      return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
    };
    const result = {
      topPx: parse(cs.paddingTop),
      bottomPx: parse(cs.paddingBottom),
      startPx: parse(cs.paddingLeft),
      endPx: parse(cs.paddingRight),
    };
    doc.body.removeChild(probe);
    return result;
  } catch {
    return zero;
  }
}
