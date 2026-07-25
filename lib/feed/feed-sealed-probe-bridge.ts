/**
 * Phase 3B.2/3B.3.1 — namespaced browser probe bridge for sealed Feed instrumentation.
 *
 * Installed only when NEXT_PUBLIC_FEED_SEALED_BASELINE=1 (compile-time gate).
 */

import {
  isFeedSealedInstrumentationEnabled,
  readFeedSealedInstrumentationCounters,
  type SealedCounters,
} from "@/lib/feed/feed-sealed-runtime-instrumentation";

export const HC_FEED_SEALED_PROBE_KEY = "__HC_FEED_SEALED_PROBE__" as const;

export type FeedSealedProbeApi = {
  version: 2;
  readCounters: () => Readonly<SealedCounters>;
  evaluateShadow: () => Promise<{
    widgetId: string;
    renderActivation: false;
    shadowActivation: true;
    activeWriter: "legacy";
    runtimeClassification: "sealed-runtime";
    workspaceRendererRegistered: false;
  }>;
  attemptFeedOn: () => {
    allowed: false;
    renderActivation: false;
    reason: string;
  };
  /** Phase 3B.3.1 — always blocked host activation. */
  attemptHostActivation: (force?: unknown) => Promise<{
    allowed: false;
    blockers: readonly string[];
    currentStep: "3B.3.1";
    eligibleStep: "3B.3.2";
  }>;
  readControlledHostContract: () => Promise<{
    hostActivation: false;
    renderActivation: false;
    activeRenderOwner: "legacy";
    activeWriter: "legacy";
    nextEligibleStep: "3B.3.2";
    hostClassification: "controlled-host-candidate";
  }>;
  readHostPlan: () => Promise<{
    activationState: "dormant";
    hostActivation: false;
    renderActivation: false;
    recommendedNextStep: string;
  }>;
};

declare global {
  interface Window {
    [HC_FEED_SEALED_PROBE_KEY]?: FeedSealedProbeApi;
  }
}

export function installFeedSealedProbeBridge(): void {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_FEED_SEALED_BASELINE !== "1") return;
  if (!isFeedSealedInstrumentationEnabled()) return;

  const api: FeedSealedProbeApi = {
    version: 2,
    readCounters: () => readFeedSealedInstrumentationCounters(),
    evaluateShadow: async () => {
      const mod = await import(
        "@/lib/adaptive-workspace-react/feed/evaluate-feed-discovery-shadow"
      );
      const d = mod.evaluateFeedDiscoveryShadow();
      return {
        widgetId: d.widgetId,
        renderActivation: false as const,
        shadowActivation: true as const,
        activeWriter: "legacy" as const,
        runtimeClassification: "sealed-runtime" as const,
        workspaceRendererRegistered: false as const,
      };
    },
    attemptFeedOn: () => ({
      allowed: false,
      renderActivation: false,
      reason: "feed.discovery renderActivation is permanently false in Phase 3B",
    }),
    attemptHostActivation: async (force?: unknown) => {
      const mod = await import("@/lib/adaptive-workspace");
      const gate = mod.evaluateFeedHostActivationGate({
        forceHostActivation: force,
        envHostActivation: force,
        queryHostActivation: force,
        cookieHostActivation: force,
        localStorageHostActivation: force,
        phase3b2ProofValid: true,
        phase3b2FreezeValid: true,
        observedWriter: "legacy",
        observedRenderOwner: "legacy",
        observedMountCount: 1,
        observedRollbackTarget: "legacy",
      });
      return {
        allowed: false as const,
        blockers: gate.blockers,
        currentStep: "3B.3.1" as const,
        eligibleStep: "3B.3.2" as const,
      };
    },
    readControlledHostContract: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const c = mod.createControlledFeedHostContract();
      return {
        hostActivation: false as const,
        renderActivation: false as const,
        activeRenderOwner: "legacy" as const,
        activeWriter: "legacy" as const,
        nextEligibleStep: "3B.3.2" as const,
        hostClassification: "controlled-host-candidate" as const,
      };
    },
    readHostPlan: async () => {
      const mod = await import("@/lib/adaptive-workspace");
      const p = mod.createControlledFeedHostPlan();
      return {
        activationState: "dormant" as const,
        hostActivation: false as const,
        renderActivation: false as const,
        recommendedNextStep: p.recommendedNextStep,
      };
    },
  };

  window[HC_FEED_SEALED_PROBE_KEY] = api;
}
