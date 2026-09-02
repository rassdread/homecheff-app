"use client";

import { useEffect } from "react";
import {
  captureMarketplaceUtmFirstTouch,
  hasMarketplaceUtmSignal,
} from "@/lib/acquisition/utm-persistence";

const CONSENT_KEY = "privacy-notice-accepted";
const CONSENT_FULL = "true";
const CONSENT_ALL = "all";

function hasAnalyticsConsent(): boolean {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    return value === CONSENT_FULL || value === CONSENT_ALL;
  } catch {
    return false;
  }
}

/**
 * Captures first-touch UTMs on Marketplace surfaces (essential attribution cookie).
 * Cookie always persists (no CMP). Emits GA `acquisition_landing` only when consent allows
 * and gtag/dataLayer exists.
 */
export default function MarketplaceUtmCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const capture = captureMarketplaceUtmFirstTouch(params, window.location.pathname);
    if (!hasMarketplaceUtmSignal(capture)) return;
    if (!hasAnalyticsConsent()) return;

    const w = window as Window & {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: Record<string, unknown>[];
    };
    const canEmitAnalytics = typeof w.gtag === "function" || Array.isArray(w.dataLayer);
    if (!canEmitAnalytics) return;

    const payload = {
      product: "marketplace",
      utm_source: capture!.utm_source,
      utm_medium: capture!.utm_medium,
      utm_campaign: capture!.utm_campaign,
      utm_content: capture!.utm_content,
      utm_term: capture!.utm_term,
      landing_path: capture!.landing_path,
    };
    try {
      if (typeof w.gtag === "function") {
        w.gtag("event", "acquisition_landing", payload);
      }
      if (!w.dataLayer) w.dataLayer = [];
      w.dataLayer.push({ event: "acquisition_landing", ...payload });
    } catch {
      /* ignore */
    }
  }, []);

  return null;
}
