/**
 * Ecosystem discovery analytics — no email / centralUserId / PII.
 */

import { trackEvent } from "@/components/GoogleAnalytics";
import type { EcosystemNavSurface, EcosystemProductId } from "./contract";

function viewportBucket(): "desktop" | "mobile" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

export function trackEcosystemMenuOpen(input: {
  sourceProduct: EcosystemProductId;
  authenticated: boolean;
  surface: EcosystemNavSurface;
}): void {
  trackEvent("ecosystem_menu_open", {
    sourceProduct: input.sourceProduct,
    authenticated: input.authenticated ? "1" : "0",
    surface: input.surface,
    viewport: viewportBucket(),
  });
}

export function trackEcosystemProductClick(input: {
  sourceProduct: EcosystemProductId;
  targetProduct: EcosystemProductId;
  authenticated: boolean;
  surface: EcosystemNavSurface;
}): void {
  trackEvent("ecosystem_product_click", {
    sourceProduct: input.sourceProduct,
    targetProduct: input.targetProduct,
    authenticated: input.authenticated ? "1" : "0",
    surface: input.surface,
    viewport: viewportBucket(),
  });
}
