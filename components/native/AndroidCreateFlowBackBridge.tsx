"use client";

import { useEffect } from "react";
import { ensureAndroidCreateFlowBackBridge } from "@/lib/native/androidCreateFlowBack";

/**
 * Starts the Capacitor Android back-button listener once (handler stack lives in lib).
 */
export default function AndroidCreateFlowBackBridge() {
  useEffect(() => {
    ensureAndroidCreateFlowBackBridge();
  }, []);
  return null;
}
